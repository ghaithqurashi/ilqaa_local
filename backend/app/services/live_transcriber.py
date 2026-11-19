"""
Which engine writes the live transcript on the speaking stage (``LIVE_TRANSCRIBER``):

    auto          (default) Speechmatics when SPEECHMATICS_API_KEY is set, otherwise the vowelized ASR
    speechmatics  Speechmatics real-time: words appear while the speaker talks
    asr           the vowelized ASR (ASR_BASE_URL, e.g. Cohere-Speech-Tashkeel-2B): each sentence
                  appears, with its vowels, about a second after the speaker pauses. Arabic only.

With ``asr`` the live vowel check judges every sentence (there is no second recogniser to
cross-check it against), and speaking rate, fillers, pauses, the live hints and the debrief are
computed from those sentences.
"""

import os
from typing import Any, Dict, Optional, Tuple

from app.clients import asr_client


def speechmatics_configured() -> bool:
    key = os.getenv("SPEECHMATICS_API_KEY", "").strip()
    return bool(key) and not key.lower().startswith("your")


def setting() -> str:
    value = os.getenv("LIVE_TRANSCRIBER", "auto").strip().lower() or "auto"
    return value if value in ("auto", "speechmatics", "asr") else "auto"


def choose(language: str) -> Tuple[Optional[str], Optional[str]]:
    """Return ``(engine, None)`` or ``(None, error message)`` for a session in ``language``."""
    choice = setting()
    asr_ok = asr_client.is_configured()

    if choice == "speechmatics" or (choice == "auto" and speechmatics_configured()):
        if speechmatics_configured():
            return "speechmatics", None
        return None, "LIVE_TRANSCRIBER=speechmatics but SPEECHMATICS_API_KEY is not set in backend/.env."

    # asr (explicitly, or auto without a Speechmatics key)
    if not asr_ok:
        if choice == "asr":
            return None, "LIVE_TRANSCRIBER=asr but ASR_BASE_URL is not set in backend/.env."
        return None, ("No live transcription is configured: set SPEECHMATICS_API_KEY, or ASR_BASE_URL "
                      "(vowelized ASR, Arabic) in backend/.env.")
    if language != "ar":
        return None, ("The vowelized ASR transcribes Arabic only; set SPEECHMATICS_API_KEY in backend/.env "
                      "for sessions in other languages.")
    return "asr", None


def summary() -> Dict[str, Any]:
    """For /api/health: the setting and what an Arabic / English session would use."""
    return {"setting": setting(), "speechmatics_configured": speechmatics_configured(),
            "arabic": choose("ar")[0], "english": choose("en")[0]}
