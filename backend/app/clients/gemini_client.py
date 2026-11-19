"""Old module name – the audio-model client is now ``app.clients.audio_client`` (AUDIO_* settings)."""
from app.clients.audio_client import *  # noqa: F401,F403
from app.clients.audio_client import AudioModelError as GeminiError  # noqa: F401
