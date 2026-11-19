"""
Async client for the *audio* model: the AI that listens to a recording and the one that speaks.

Used for what the text LLM (``LLMClient``) cannot do:

* pronunciation feedback that sends the student's real recording (audio input)
* text-to-speech for the model reading (voices "Fenrir" / "Charon")

Two kinds of provider:

    gemini   Google's Gemini REST API (generateContent with inline audio; Gemini TTS voices)
    openai   any OpenAI-compatible API:
               audio input  -> POST {base}/chat/completions with an "input_audio" content part
                               (e.g. gpt-4o-audio-preview on OpenAI, or an audio-capable model on OpenRouter)
               speech       -> POST {base}/audio/speech  (e.g. gpt-4o-mini-tts, tts-1)

Settings (read at call time, so values loaded by ``env_loader`` are seen). The old GEMINI_* names
still work as fallbacks so existing .env files keep working.

    AUDIO_PROVIDER      gemini (default) | openai | none
    AUDIO_API_KEY       API key                         (old name: GEMINI_API_KEY)
    AUDIO_BASE_URL      optional; default per provider
    AUDIO_MODELS        comma-separated audio-understanding models, tried in order (old: GEMINI_MODELS)
    AUDIO_TIMEOUT       seconds, default 60             (old: GEMINI_TIMEOUT)

    Text-to-speech uses the same provider / key / base URL unless overridden:
    AUDIO_TTS_PROVIDER, AUDIO_TTS_API_KEY, AUDIO_TTS_BASE_URL
    AUDIO_TTS_MODELS    comma-separated speech models   (old: GEMINI_TTS_MODELS)
    AUDIO_TTS_VOICES    openai only: map the app's two voices, default "Fenrir=onyx,Charon=echo"

Retry / model-fallback logic ported from ILQAA-LAB's ``server.ts``.
"""

import asyncio
import base64
import io
import json
import logging
import os
import wave
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

import aiohttp

logger = logging.getLogger(__name__)

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
OPENAI_BASE_URL = "https://api.openai.com/v1"

DEFAULT_MODELS = {
    "gemini": "gemini-3.8-flash,gemini-flash-latest,gemini-3.1-flash-lite",
    "openai": "gpt-4o-audio-preview",
}
DEFAULT_TTS_MODELS = {
    "gemini": "gemini-2.0-flash,gemini-2.0-flash-exp,gemini-2.5-flash-preview-tts,gemini-3.1-flash-tts-preview",
    "openai": "gpt-4o-mini-tts,tts-1",
}
DEFAULT_OPENAI_VOICES = "Fenrir=onyx,Charon=echo"

# OpenAI's input_audio accepts only these containers
_OPENAI_AUDIO_FORMATS = {"audio/wav": "wav", "audio/x-wav": "wav", "audio/wave": "wav",
                         "audio/mpeg": "mp3", "audio/mp3": "mp3"}

_TRANSIENT_MARKERS = ("503", "500", "429", "unavailable", "busy", "overloaded",
                      "high demand", "rate_limit", "resource_exhausted")
_OVERLOAD_MARKERS = ("503", "unavailable", "high demand", "overloaded")


class AudioModelError(Exception):
    """Raised when every configured audio model fails."""


# Old name, kept for code that still catches it
GeminiError = AudioModelError


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------

_warned_old_names = set()


def _env(name: str, old: Optional[str] = None, default: str = "") -> str:
    value = os.getenv(name, "").strip()
    if value:
        return value
    if old:
        value = os.getenv(old, "").strip()
        if value:
            if old not in _warned_old_names:
                _warned_old_names.add(old)
                logger.info("Using %s for %s – rename it in backend/.env (the old name still works)", old, name)
            return value
    return default


def _usable_key(key: str) -> bool:
    return bool(key) and not key.lower().startswith("your-")


@dataclass
class AudioConfig:
    provider: str            # gemini | openai | none
    api_key: str
    base_url: str
    models: List[str]
    timeout: float
    voices: Dict[str, str]

    @property
    def configured(self) -> bool:
        return self.provider in ("gemini", "openai") and _usable_key(self.api_key)

    def public(self) -> Dict[str, Any]:
        """Non-secret summary for /api/health."""
        return {"provider": self.provider, "base_url": self.base_url, "models": self.models,
                "configured": self.configured}


def _provider(raw: str) -> str:
    p = (raw or "gemini").strip().lower()
    if p in ("openai", "openai_compatible", "openrouter", "custom"):
        return "openai"
    if p in ("none", "off", "disabled", ""):
        return "none"
    return "gemini"


def _models(raw: str, provider: str, defaults: Dict[str, str]) -> List[str]:
    models = [m.strip() for m in (raw or defaults.get(provider, "")).split(",") if m.strip()]
    return list(dict.fromkeys(models))


def _default_base(provider: str) -> str:
    return OPENAI_BASE_URL if provider == "openai" else GEMINI_BASE_URL


def listen_config() -> AudioConfig:
    """Settings for the model that listens to recordings (pronunciation feedback)."""
    provider = _provider(_env("AUDIO_PROVIDER", default="gemini"))
    return AudioConfig(
        provider=provider,
        api_key=_env("AUDIO_API_KEY", "GEMINI_API_KEY"),
        base_url=_env("AUDIO_BASE_URL", default=_default_base(provider)).rstrip("/"),
        models=_models(_env("AUDIO_MODELS", "GEMINI_MODELS"), provider, DEFAULT_MODELS),
        timeout=float(_env("AUDIO_TIMEOUT", "GEMINI_TIMEOUT", "60")),
        voices={},
    )


def tts_config() -> AudioConfig:
    """Settings for text-to-speech; inherits the listening settings unless AUDIO_TTS_* override them."""
    base = listen_config()
    provider = _provider(_env("AUDIO_TTS_PROVIDER", default=base.provider))
    same = provider == base.provider
    voices = {}
    for pair in _env("AUDIO_TTS_VOICES", default=DEFAULT_OPENAI_VOICES).split(","):
        if "=" in pair:
            k, v = pair.split("=", 1)
            voices[k.strip()] = v.strip()
    return AudioConfig(
        provider=provider,
        api_key=_env("AUDIO_TTS_API_KEY", default=base.api_key if same else ""),
        base_url=_env("AUDIO_TTS_BASE_URL", default=base.base_url if same else _default_base(provider)).rstrip("/"),
        models=_models(_env("AUDIO_TTS_MODELS", "GEMINI_TTS_MODELS"), provider, DEFAULT_TTS_MODELS),
        timeout=base.timeout,
        voices=voices,
    )


def is_configured() -> bool:
    """True when an audio-understanding model is available."""
    return listen_config().configured


def tts_configured() -> bool:
    return tts_config().configured


def accepts_audio(mime: str) -> bool:
    """Whether the configured listening provider can take a recording in this format."""
    cfg = listen_config()
    if cfg.provider == "openai":
        return (mime or "").split(";")[0].strip().lower() in _OPENAI_AUDIO_FORMATS
    return True


# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------

def _is_retryable(exc: Exception) -> Tuple[bool, bool]:
    msg = str(exc).lower()
    return any(m in msg for m in _TRANSIENT_MARKERS), any(m in msg for m in _OVERLOAD_MARKERS)


async def _post_json(session: aiohttp.ClientSession, url: str, body: Dict[str, Any],
                     headers: Dict[str, str], timeout: float) -> Dict[str, Any]:
    async with session.post(url, json=body, headers=headers,
                            timeout=aiohttp.ClientTimeout(total=timeout)) as resp:
        text = await resp.text()
        if resp.status != 200:
            raise AudioModelError(f"HTTP {resp.status}: {text[:300]}")
        return json.loads(text)


def _gemini_parts(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    try:
        return data["candidates"][0]["content"]["parts"] or []
    except (KeyError, IndexError, TypeError):
        return []


def _parse_json_object(text: str) -> Dict[str, Any]:
    from app.clients.llm_client import LLMClient
    cleaned = LLMClient._extract_and_repair_json(LLMClient.__new__(LLMClient), text or "{}")
    result = json.loads(cleaned or "{}")
    if not isinstance(result, dict):
        raise AudioModelError(f"Expected a JSON object, got {type(result).__name__}")
    return result


# ---------------------------------------------------------------------------
# Structured JSON answer (optionally listening to a recording)
# ---------------------------------------------------------------------------

async def generate_json(
    prompt: str,
    schema: Dict[str, Any],
    *,
    json_instructions: str = "",
    audio: Optional[Tuple[str, str]] = None,
    preferred_model: Optional[str] = None,
    max_tokens: int = 4000,
) -> Dict[str, Any]:
    """Ask the audio model for one JSON object.

    ``schema`` uses Gemini's schema format (``"type": "OBJECT"``) – sent natively to Gemini;
    for OpenAI-compatible APIs ``json_instructions`` (the schema rendered as text) is used instead.
    ``audio`` is ``(mime_type, base64_data)``. ``preferred_model`` is tried first on Gemini only.
    """
    cfg = listen_config()
    if not cfg.configured:
        raise AudioModelError("No audio model configured (AUDIO_PROVIDER / AUDIO_API_KEY).")

    models = list(cfg.models)
    if preferred_model and cfg.provider == "gemini":
        models = list(dict.fromkeys([preferred_model] + models))

    last_error: Optional[Exception] = None
    async with aiohttp.ClientSession() as session:
        for model in models:
            delay = 0.5
            for attempt in (1, 2):
                try:
                    logger.info("Audio model request (%s, model=%s, audio=%s, attempt=%s/2)",
                                cfg.provider, model, bool(audio), attempt)
                    if cfg.provider == "gemini":
                        return await _gemini_json(session, cfg, model, prompt, schema, audio)
                    return await _openai_json(session, cfg, model, prompt, json_instructions, audio, max_tokens)
                except (AudioModelError, aiohttp.ClientError, asyncio.TimeoutError, json.JSONDecodeError) as exc:
                    last_error = exc
                    transient, overloaded = _is_retryable(exc)
                    if transient and not overloaded and attempt < 2:
                        logger.warning("Transient audio-model error on %s: %s – retrying in %.1fs", model, exc, delay)
                        await asyncio.sleep(delay)
                        delay *= 2
                        continue
                    logger.warning("Audio model %s failed: %s – trying next model", model, exc)
                    break

    raise AudioModelError(str(last_error) if last_error else "All audio models failed.")


async def _gemini_json(session, cfg: AudioConfig, model: str, prompt: str, schema: Dict[str, Any],
                       audio: Optional[Tuple[str, str]]) -> Dict[str, Any]:
    parts: List[Dict[str, Any]] = []
    if audio:
        parts.append({"inlineData": {"mimeType": audio[0], "data": audio[1]}})
    parts.append({"text": prompt})
    body = {
        "contents": [{"role": "user", "parts": parts}],
        "generationConfig": {"responseMimeType": "application/json", "responseSchema": schema},
    }
    data = await _post_json(session, f"{cfg.base_url}/models/{model}:generateContent", body,
                            {"x-goog-api-key": cfg.api_key}, cfg.timeout)
    return _parse_json_object("".join(p.get("text", "") for p in _gemini_parts(data)))


async def _openai_json(session, cfg: AudioConfig, model: str, prompt: str, json_instructions: str,
                       audio: Optional[Tuple[str, str]], max_tokens: int) -> Dict[str, Any]:
    content: List[Dict[str, Any]] = [{"type": "text", "text": prompt}]
    if audio:
        fmt = _OPENAI_AUDIO_FORMATS.get(audio[0].split(";")[0].strip().lower())
        if not fmt:
            raise AudioModelError(f"OpenAI-compatible audio input needs WAV or MP3, got {audio[0]}")
        content.append({"type": "input_audio", "input_audio": {"data": audio[1], "format": fmt}})
    messages = []
    if json_instructions:
        messages.append({"role": "system", "content": json_instructions})
    messages.append({"role": "user", "content": content})
    body = {"model": model, "messages": messages, "max_tokens": max_tokens, "temperature": 0.1}
    data = await _post_json(session, f"{cfg.base_url}/chat/completions", body,
                            {"Authorization": f"Bearer {cfg.api_key}"}, cfg.timeout)
    try:
        text = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        raise AudioModelError(f"Unexpected response: {json.dumps(data)[:300]}")
    if isinstance(text, list):          # some providers return content parts
        text = "".join(p.get("text", "") for p in text if isinstance(p, dict))
    return _parse_json_object(text)


# ---------------------------------------------------------------------------
# Text-to-speech
# ---------------------------------------------------------------------------

def pcm_to_wav(pcm: bytes, sample_rate: int = 24000, channels: int = 1, sample_width: int = 2) -> bytes:
    """Wrap raw 16-bit PCM (Gemini TTS output) in a playable WAV container."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wav:
        wav.setnchannels(channels)
        wav.setsampwidth(sample_width)
        wav.setframerate(sample_rate)
        wav.writeframes(pcm)
    return buf.getvalue()


async def synthesize_speech(text: str, voice: str = "Fenrir") -> Optional[Tuple[bytes, str]]:
    """Return ``(audio_bytes, content_type)`` from the TTS model, or ``None`` if not configured / all fail."""
    cfg = tts_config()
    if not cfg.configured:
        return None
    async with aiohttp.ClientSession() as session:
        for model in cfg.models:
            try:
                if cfg.provider == "gemini":
                    audio = await _gemini_tts(session, cfg, model, text, voice)
                else:
                    audio = await _openai_tts(session, cfg, model, text, voice)
                if audio:
                    return audio
            except (AudioModelError, aiohttp.ClientError, asyncio.TimeoutError, json.JSONDecodeError) as exc:
                logger.info("TTS model %s (%s) unavailable: %s", model, cfg.provider, exc)
    return None


async def _gemini_tts(session, cfg: AudioConfig, model: str, text: str, voice: str) -> Optional[Tuple[bytes, str]]:
    body = {
        "contents": [{"parts": [{"text": text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}},
        },
    }
    data = await _post_json(session, f"{cfg.base_url}/models/{model}:generateContent", body,
                            {"x-goog-api-key": cfg.api_key}, cfg.timeout)
    for part in _gemini_parts(data):
        inline = part.get("inlineData") or part.get("inline_data") or {}
        if inline.get("data"):
            return pcm_to_wav(base64.b64decode(inline["data"])), "audio/wav"
    return None


async def _openai_tts(session, cfg: AudioConfig, model: str, text: str, voice: str) -> Optional[Tuple[bytes, str]]:
    body = {"model": model, "input": text, "voice": cfg.voices.get(voice, voice.lower()), "response_format": "wav"}
    async with session.post(f"{cfg.base_url}/audio/speech", json=body,
                            headers={"Authorization": f"Bearer {cfg.api_key}"},
                            timeout=aiohttp.ClientTimeout(total=cfg.timeout)) as resp:
        data = await resp.read()
        if resp.status != 200:
            raise AudioModelError(f"HTTP {resp.status}: {data[:300].decode('utf-8', 'replace')}")
        if not data:
            return None
        ctype = resp.headers.get("Content-Type", "audio/wav").split(";")[0]
        return data, ctype if ctype.startswith("audio/") else "audio/wav"
