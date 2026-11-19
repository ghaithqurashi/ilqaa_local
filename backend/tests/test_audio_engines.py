"""
Offline checks for the audio / ASR / TTS routing of /api/analyze and /api/tts.

Starts fake LLM, Gemini, OpenAI-compatible and ASR servers on localhost, so no keys or
network are needed:

    cd backend
    python tests/test_audio_engines.py        # ends with "ALL PASSED"
"""

import base64
import io
import json
import os
import sys
import threading
import wave
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

REFERENCE = "ذَهَبَ الطَّالِبُ إِلَى الْمَدْرَسَةِ صَبَاحًا."
SAID = "ذَهَبَ الطَّالِبَ إِلَى الْمَدْرَسَةِ سَبَاحًا."       # wrong case ending + ص→س
CALLS = []


def _wav() -> str:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(16000); w.writeframes(b"\0\0" * 8000)
    return base64.b64encode(buf.getvalue()).decode()


PRONUNCIATION_ANSWER = {
    "overallScore": 55, "feedback": "شرح", "grammaticalSummary": "جملة فعلية",
    "corrections": [
        {"word": "ذَهَبَ", "status": "correct", "note": "فعل ماضٍ", "i_rab": "فعل ماض مبني على الفتح"},
        {"word": "الطَّالِبُ", "status": "mispronounced", "note": "فاعل مرفوع نُطق بالفتح",
         "errorReason": "لحن إعرابي: الفتح بدل الضم", "i_rab": "فاعل مرفوع"},
        {"word": "إِلَى", "status": "mispronounced", "note": "خطأ مختلق"},          # LLM invents an error
        {"word": "الْمَدْرَسَةِ", "status": "correct", "note": "اسم مجرور"},
        {"word": "صَبَاحًا", "status": "correct", "note": "ظرف"},                   # LLM misses the ص→س
    ],
    "recommendations": ["تدرب"],
}


class Fake(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _send(self, obj, ctype="application/json", status=200):
        data = obj if isinstance(obj, bytes) else json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        body = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        path = self.path
        if path.endswith("/audio/transcriptions"):
            CALLS.append(("asr", b"recording.wav" in body))
            return self._send({"text": SAID})
        req = json.loads(body or b"{}")
        if path.endswith(":generateContent"):
            parts = req["contents"][0]["parts"]
            if "responseModalities" in req.get("generationConfig", {}):
                CALLS.append(("gemini_tts", path))
                return self._send({"candidates": [{"content": {"parts": [
                    {"inlineData": {"data": base64.b64encode(b"\0\0" * 100).decode()}}]}}]})
            CALLS.append(("gemini", any("inlineData" in p for p in parts)))
            return self._send({"candidates": [{"content": {"parts": [{"text": json.dumps(PRONUNCIATION_ANSWER)}]}}]})
        if path.endswith("/audio/speech"):
            CALLS.append(("openai_tts", req.get("voice")))
            return self._send(b"RIFF....WAVE", "audio/wav")
        if path.endswith("/chat/completions"):
            content = req["messages"][-1]["content"]
            has_audio = isinstance(content, list) and any(c.get("type") == "input_audio" for c in content)
            who = "llm" if "/llm/" in path else "openai_audio"
            prompt = content if isinstance(content, str) else content[0]["text"]
            CALLS.append((who, has_audio, prompt))
            if "شكّل النص" in prompt:
                return self._send({"choices": [{"message": {"content": json.dumps(
                    {"vowelizedText": REFERENCE, "notes": ""}, ensure_ascii=False)}}]})
            if "oratory master" in prompt:
                return self._send({"choices": [{"message": {"content": json.dumps({"overallScore": 70}, ensure_ascii=False)}}]})
            return self._send({"choices": [{"message": {"content": json.dumps(PRONUNCIATION_ANSWER, ensure_ascii=False)}}]})
        self._send({"error": "unknown"}, status=404)


server = ThreadingHTTPServer(("127.0.0.1", 0), Fake)
threading.Thread(target=server.serve_forever, daemon=True).start()
BASE = f"http://127.0.0.1:{server.server_port}"

from fastapi import FastAPI                       # noqa: E402
from fastapi.testclient import TestClient         # noqa: E402
from app.api import practice                      # noqa: E402

app = FastAPI()
app.include_router(practice.router)
client = TestClient(app)

failures = 0


def check(cond, msg):
    global failures
    failures += 0 if cond else 1
    print(("  ok   " if cond else "  FAIL ") + msg)


def env(**kw):
    for k in [k for k in os.environ if k.startswith(("LLM_", "AUDIO_", "GEMINI_", "ASR_", "PRACTICE_", "PRONUNCIATION_"))]:
        del os.environ[k]
    os.environ.update({k: v for k, v in kw.items() if v is not None})
    practice._tts_cache.clear()
    CALLS.clear()


def ask(mime="audio/wav", audio=True):
    body = {"task": "pronunciation_feedback", "language": "ar", "text": "ذهب الطالب الى المدرسة صباحا",
            "targetText": REFERENCE}
    if audio:
        body.update(audioBase64="data:%s;base64,%s" % (mime, _wav()), audioMimeType=mime)
    r = client.post("/api/analyze", json=body)
    return r.status_code, r.json()


LLM = dict(LLM_PROVIDER="custom", LLM_BASE_URL=f"{BASE}/llm/v1", LLM_API_KEY="k", LLM_MODEL="m", LLM_MAX_RETRIES="1")

print("1) vowelized ASR + text LLM (PRONUNCIATION_ENGINE=auto)")
env(**LLM, ASR_BASE_URL=f"{BASE}/asr/v1", AUDIO_API_KEY="g", AUDIO_BASE_URL=f"{BASE}/gemini")
code, d = ask()
check(code == 200, f"HTTP 200 ({code})")
check(d.get("evaluationMethod") == "vowelized_asr", f"evaluationMethod vowelized_asr ({d.get('evaluationMethod')})")
check([c[0] for c in CALLS] == ["asr", "llm"], f"called the ASR then the LLM ({[c[0] for c in CALLS]})")
check(CALLS and CALLS[0][1], "the ASR received the recording as a WAV file")
check("لحن في حركة الإعراب" in (CALLS[1][2] if len(CALLS) > 1 else ""), "the LLM prompt contains the comparison")
st = [c["status"] for c in d.get("corrections", [])]
check(st == ["correct", "mispronounced", "correct", "correct", "mispronounced"],
      f"word statuses follow the comparison, not the LLM ({st})")
check(d["corrections"][1].get("errorReason") == "لحن إعرابي: الفتح بدل الضم", "keeps the LLM's explanation when it agrees")
check("ص→س" in (d["corrections"][4].get("errorReason") or ""), "adds the error the LLM missed")
check(d["corrections"][4].get("spokenWord") == "سَبَاحًا", "spokenWord is what the ASR heard")
check(d.get("overallScore") == 82 and d.get("asrTranscript") == SAID, f"deterministic score 82 ({d.get('overallScore')})")

print("2) ASR down → falls back to the audio model (Gemini)")
env(**LLM, ASR_BASE_URL="http://127.0.0.1:9/v1", ASR_TIMEOUT="3", GEMINI_API_KEY="g", AUDIO_BASE_URL=f"{BASE}/gemini")
code, d = ask()
check(code == 200 and d.get("evaluationMethod") == "multimodal_audio", f"multimodal_audio ({d.get('evaluationMethod')})")
check(CALLS and CALLS[0] == ("gemini", True), f"Gemini got the audio, via the old GEMINI_API_KEY name ({CALLS[:1]})")
check("asrError" in d, "reports why the ASR was skipped")

print("3) PRONUNCIATION_ENGINE=audio with an OpenAI-compatible audio model")
env(**LLM, ASR_BASE_URL=f"{BASE}/asr/v1", PRONUNCIATION_ENGINE="audio", AUDIO_PROVIDER="openai",
    AUDIO_BASE_URL=f"{BASE}/oa/v1", AUDIO_API_KEY="o", AUDIO_MODELS="gpt-4o-audio-preview")
code, d = ask()
check(code == 200 and [c[0] for c in CALLS] == ["openai_audio"], f"only the audio model was called ({[c[0] for c in CALLS]})")
check(CALLS and CALLS[0][1], "sent as an input_audio part")
code, d = ask(mime="audio/webm")
check([c[0] for c in CALLS][-1:] == ["llm"] and d.get("evaluationMethod") == "linguistic_transcript",
      "WebM can't go to an OpenAI audio model → transcript-only feedback by the LLM")

print("4) PRONUNCIATION_ENGINE=text ignores the recording")
env(**LLM, ASR_BASE_URL=f"{BASE}/asr/v1", PRONUNCIATION_ENGINE="text")
code, d = ask()
check([c[0] for c in CALLS] == ["llm"] and d.get("evaluationMethod") == "linguistic_transcript", "LLM only")

print("5) ASR without any LLM → the comparison alone")
env(ASR_BASE_URL=f"{BASE}/asr/v1")
code, d = ask()
check(code == 200 and d.get("evaluationMethod") == "vowelized_asr" and d.get("overallScore") == 82,
      f"graded without an LLM ({code}, {d.get('evaluationMethod')})")
check("offline_fallback" not in d, "not marked as offline sample text")

print("6) PRACTICE_AI_ENGINE=audio sends a text task to the audio model")
env(**LLM, PRACTICE_AI_ENGINE="audio", AUDIO_PROVIDER="openai", AUDIO_BASE_URL=f"{BASE}/oa/v1", AUDIO_API_KEY="o")
r = client.post("/api/analyze", json={"task": "interactive_coach", "language": "ar", "message": "مرحبا"})
check(r.status_code == 200 and [c[0] for c in CALLS] == ["openai_audio"], f"audio model answered ({[c[0] for c in CALLS]})")
os.environ["PRACTICE_AI_ENGINE"] = "gemini"
check(practice._text_engine() == "audio", "'gemini' still accepted as the old value")

print("7) text-to-speech")
env(GEMINI_API_KEY="g", AUDIO_BASE_URL=f"{BASE}/gemini")
r = client.get("/api/tts", params={"text": "مرحبا", "voice": "Charon"})
check(r.status_code == 200 and r.headers["content-type"] == "audio/wav" and CALLS[0][0] == "gemini_tts", "Gemini TTS")
env(AUDIO_PROVIDER="gemini", AUDIO_API_KEY="g", AUDIO_TTS_PROVIDER="openai", AUDIO_TTS_BASE_URL=f"{BASE}/oa/v1",
    AUDIO_TTS_API_KEY="o")
r = client.get("/api/tts", params={"text": "مرحبا", "voice": "Charon"})
check(r.status_code == 200 and CALLS == [("openai_tts", "echo")], f"separate OpenAI TTS, Charon→echo ({CALLS})")

print("8) speaking stage: diacritize a script, vowel analysis in the debrief")
env(**LLM)
r = client.post("/api/analyze", json={"task": "diacritize_script", "language": "ar", "text": "ذهب الطالب إلى المدرسة صباحا."})
d = r.json()
check(r.status_code == 200 and d.get("vowelizedText") == REFERENCE and d.get("wordsChanged") is False,
      f"vowels added, words unchanged ({d})")
r = client.post("/api/analyze", json={"task": "diacritize_script", "language": "ar", "text": "نص مختلف تماما"})
check(r.json().get("wordsChanged") is True, "flags an answer whose words differ from the original")
r = client.post("/api/analyze", json={"task": "oratory_debrief", "language": "ar", "transcript": "نص",
                                      "vowelAnalysis": {"enabled": True, "mode": "script", "judgedSegments": 4,
                                                        "uncertainSegments": 1, "script": {"coveragePercent": 80},
                                                        "errorsByType": {"لحن في حركة الإعراب (آخر الكلمة)": 2},
                                                        "examples": [{"word": "الْعِلْمَ", "spoken": "الْعِلْمُ",
                                                                      "label": "لحن", "detail": "ضمة بدل فتحة"}]}})
prompt = CALLS[-1][2] if CALLS else ""
check(r.status_code == 200 and "case endings" in prompt and "الْعِلْمَ ← الْعِلْمُ" in prompt and "80%" in prompt,
      "the debrief prompt includes the vowel analysis")

server.shutdown()
print("\n" + ("ALL PASSED" if not failures else f"{failures} FAILED"))
sys.exit(1 if failures else 0)
