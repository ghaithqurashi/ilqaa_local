"""
Client for a *vowelized* speech-recognition service (ASR that writes the short vowels).

The backend does not load the speech model itself. It calls any server with the
OpenAI-compatible transcription endpoint:

    POST {ASR_BASE_URL}/audio/transcriptions      multipart: file, model, language
    ->   {"text": "ذَهَبَ الطَّالِبُ إِلَى الْمَدْرَسَةِ"}

``tools/asr-eval/serve_asr.py`` is such a server for NAMAA-Space/Cohere-Speech-Tashkeel-2B
(run it on the same PC or on a GPU machine).

Settings:
    ASR_BASE_URL    e.g. http://127.0.0.1:8090/v1   (empty = vowelized ASR off)
    ASR_API_KEY     optional bearer token
    ASR_MODEL       model name sent to the server (default NAMAA-Space/Cohere-Speech-Tashkeel-2B)
    ASR_TIMEOUT     seconds, default 120 (CPU inference of a 2B model is slow)
"""

import base64
import logging
import os
from typing import Any, Dict, Optional

import aiohttp

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "NAMAA-Space/Cohere-Speech-Tashkeel-2B"

_EXT = {"audio/wav": "wav", "audio/x-wav": "wav", "audio/wave": "wav", "audio/webm": "webm",
        "audio/ogg": "ogg", "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/flac": "flac"}


class ASRError(Exception):
    pass


def base_url() -> str:
    return os.getenv("ASR_BASE_URL", "").strip().rstrip("/")


def model() -> str:
    return os.getenv("ASR_MODEL", "").strip() or DEFAULT_MODEL


def is_configured() -> bool:
    return bool(base_url())


def public() -> Dict[str, Any]:
    return {"base_url": base_url() or None, "model": model() if is_configured() else None,
            "configured": is_configured()}


async def transcribe(audio_b64: str, mime: str = "audio/wav", language: str = "ar") -> str:
    """Return the vowelized transcript of a base64 recording. Raises ASRError on failure."""
    if not is_configured():
        raise ASRError("ASR_BASE_URL is not set")
    try:
        audio = base64.b64decode(audio_b64)
    except Exception as exc:
        raise ASRError(f"recording is not valid base64: {exc}")

    mime = (mime or "audio/wav").split(";")[0].strip().lower()
    form = aiohttp.FormData()
    form.add_field("file", audio, filename=f"recording.{_EXT.get(mime, 'wav')}", content_type=mime)
    form.add_field("model", model())
    form.add_field("language", language)
    form.add_field("response_format", "json")

    headers = {}
    key = os.getenv("ASR_API_KEY", "").strip()
    if key:
        headers["Authorization"] = f"Bearer {key}"

    timeout = aiohttp.ClientTimeout(total=float(os.getenv("ASR_TIMEOUT", "120") or 120))
    url = f"{base_url()}/audio/transcriptions"
    logger.info("Vowelized ASR request → %s (%d KB, %s)", url, len(audio) // 1024, mime)
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, data=form, headers=headers, timeout=timeout) as resp:
                body = await resp.text()
                if resp.status != 200:
                    raise ASRError(f"HTTP {resp.status}: {body[:300]}")
    except aiohttp.ClientError as exc:
        raise ASRError(f"cannot reach the ASR server at {url}: {exc}")
    except TimeoutError:
        raise ASRError(f"the ASR server did not answer within {timeout.total:.0f} s")

    import json
    try:
        text = json.loads(body).get("text", "")
    except (ValueError, AttributeError):
        text = body                         # response_format=text servers
    text = (text or "").strip()
    logger.info("Vowelized ASR transcript: %s", text[:200])
    return text
