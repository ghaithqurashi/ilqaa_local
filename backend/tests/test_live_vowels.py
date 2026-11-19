"""
Offline checks for the live vowel check on the speaking stage (app/services/vowelized_live.py).

Synthetic "speech" (noise bursts separated by pauses) is streamed like the browser does, and a fake
Tashkeel ASR answers by burst length – no model, keys or network needed:

    cd backend
    python tests/test_live_vowels.py          # ends with "ALL PASSED"
"""

import asyncio
import base64
import io
import os
import sys
import wave
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

os.environ["ASR_BASE_URL"] = "http://fake-asr/v1"

from app.clients import asr_client                       # noqa: E402
from app.services import vowelized_live as vl            # noqa: E402

SR = 16000
S1 = "ذَهَبَ الطَّالِبُ إِلَى الْمَدْرَسَةِ صَبَاحًا"
S2 = "إِنَّ الْعِلْمَ نُورٌ يُضِيءُ الطَّرِيقَ"
S3 = "وَالصَّبْرُ مِفْتَاحُ الْفَرَجِ"
SCRIPT = f"{S1}. {S2}. {S3}."
# what the speaker "says" for each burst length (seconds) – sentence 2 with a wrong case ending
SPOKEN = {2.5: "ذَهَبَ الطَّالِبُ إِلَى الْمَدْرَسَةِ صَبَاحًا", 2.0: "إِنَّ الْعِلْمُ نُورٌ يُضِيءُ الطَّرِيقَ",
          1.5: "كَلَامٌ مُرْتَجَلٌ خَارِجَ النَّصِّ"}

failures = 0


async def no_review(batch):
    return []


def check(cond, msg):
    global failures
    failures += 0 if cond else 1
    print(("  ok   " if cond else "  FAIL ") + msg)


def speech(seconds, seed):
    rng = np.random.default_rng(seed)
    t = np.arange(int(seconds * SR)) / SR
    env = 0.6 + 0.4 * np.sin(2 * np.pi * 3 * t) ** 2                  # syllable-like loudness
    return (rng.normal(0, 0.15, len(t)) * env).astype(np.float32)


def silence(seconds, seed=0):
    return np.random.default_rng(seed).normal(0, 0.002, int(seconds * SR)).astype(np.float32)


async def fake_transcribe(b64, mime="audio/wav", language="ar"):
    with wave.open(io.BytesIO(base64.b64decode(b64))) as w:
        dur = w.getnframes() / SR - 2 * vl.PAD_S
    await asyncio.sleep(0.05)
    key = min(SPOKEN, key=lambda k: abs(k - dur))
    return SPOKEN[key]

asr_client.transcribe = fake_transcribe


async def stream(v, parts, sm_lines=()):
    audio = np.concatenate(parts)
    for i in range(0, len(audio), 4096):                              # browser chunk size
        v.feed(audio[i:i + 4096])
        await asyncio.sleep(0)
    for start, end, text in sm_lines:
        v.add_speechmatics_final(text, start, end)


async def main():
    vl.SM_WAIT_S = 0.3

    print("1) cutting at pauses + script mode")
    out = []
    async def send(m): out.append(m)
    v = vl.LiveVowelizer(send, review=no_review)
    info = v.set_script(SCRIPT)
    check(info["script"] and info["scriptHasVowels"] and info["scriptWords"] == 13, f"script accepted ({info})")
    v.start()
    # burst 1: 0.5–3.0 s, burst 2: 3.8–5.8 s, burst 3: 6.6–8.1 s
    await stream(v, [silence(0.5), speech(2.5, 1), silence(0.8), speech(2.0, 2), silence(0.8), speech(1.5, 3),
                     silence(1.0)],
                 [(0.5, 3.0, "ذهب الطالب الى المدرسة صباحا"), (3.8, 5.8, "ان العلم نور يضيء الطريق"),
                  (6.6, 8.1, "كلام مرتجل خارج النص")])
    await v.close(timeout=5)
    segs = [m for m in out if m["status"] == "vowelized_segment"]
    check(len(segs) == 3, f"three segments cut at the pauses ({len(segs)})")
    if len(segs) == 3:
        check(abs(segs[0]["start"] - 0.25) < 0.1 and abs(segs[0]["end"] - 3.25) < 0.15,
              f"segment 1 spans the burst plus padding ({segs[0]['start']}–{segs[0]['end']})")
        check(segs[0]["mode"] == "script" and all(w["status"] == "correct" for w in segs[0]["words"]),
              "sentence 1 matched in the script, no errors")
        bad = [w for w in segs[1]["words"] if w["status"] != "correct"]
        check(segs[1]["mode"] == "script" and len(bad) == 1 and bad[0]["word"] == "الْعِلْمَ"
              and bad[0]["errors"][0]["type"] == "ending_vowel", "sentence 2: الْعِلْمَ read with the wrong ending")
        check(segs[2]["mode"] == "off_script", f"improvised sentence recognised as off-script ({segs[2]['mode']})")
        check(all(s["agreement"] and s["agreement"] > 0.9 for s in segs), "Tashkeel and Speechmatics agree")
    summ = v.summary()
    check(summ["mode"] == "script" and summ["errorsByType"] == {"لحن في حركة الإعراب (آخر الكلمة)": 1},
          f"summary counts the ending error ({summ['errorsByType']})")
    check(summ["script"]["wordsRead"] == 10 and summ["script"]["reachedPercent"] == 77,
          f"script coverage ({summ['script']})")

    print("2) free speech: LLM review in batches, disagreement → uncertain")
    out.clear()
    reviewed = []
    async def review(batch):
        reviewed.append([b["id"] for b in batch])
        return [{"segmentId": batch[0]["id"], "word": "الْعِلْمُ", "correct": "الْعِلْمَ", "reason": "اسم إنّ منصوب"}]
    v = vl.LiveVowelizer(send, review=review)
    v.start()
    await stream(v, [silence(0.5), speech(2.0, 4), silence(0.8), speech(2.0, 5), silence(0.8), speech(2.0, 6),
                     silence(0.8), speech(2.5, 7), silence(1.0)],
                 [(0.5, 2.5, "ان العلم نور يضيء الطريق"), (3.3, 5.3, "ان العلم نور يضيء الطريق"),
                  (6.1, 8.1, "ان العلم نور يضيء الطريق"), (8.9, 11.4, "كلمات اخرى مختلفة تماما هنا")])
    await v.close(timeout=5)
    segs = [m for m in out if m["status"] == "vowelized_segment"]
    reviews = [m for m in out if m["status"] == "vowel_review"]
    check(len(segs) == 4 and all(s["mode"] == "free" for s in segs), "four free-speech segments")
    check(segs and segs[-1]["uncertain"], "segment where the two recognisers disagree is uncertain")
    check(reviewed == [[1, 2, 3]], f"one review of the three certain segments ({reviewed})")
    check(len(reviews) == 1 and reviews[0]["issues"][0]["correct"] == "الْعِلْمَ", "review issue sent to the client")
    check(v.summary()["uncertainSegments"] == 1, "summary counts the uncertain segment")

    print("3) slow ASR → oldest segments dropped, never blocks the audio")
    out.clear()
    async def slow(b64, mime="audio/wav", language="ar"):
        await asyncio.sleep(0.5)
        return SPOKEN[2.0]
    asr_client.transcribe = slow
    v = vl.LiveVowelizer(send, review=no_review)
    v.start()
    parts = [silence(0.3)]
    for i in range(8):
        parts += [speech(1.2, 10 + i), silence(0.6)]
    await stream(v, parts)
    check(v.dropped >= 3, f"segments dropped instead of piling up ({v.dropped})")
    await v.close(timeout=10)
    asr_client.transcribe = fake_transcribe

    print("4) ASR unreachable → one warning, then off; long speech cut at 15 s")
    out.clear()
    async def down(*a, **k):
        raise asr_client.ASRError("cannot reach the ASR server")
    asr_client.transcribe = down
    v = vl.LiveVowelizer(send, review=no_review)
    v.start()
    await stream(v, [silence(0.3), speech(20, 20), silence(1.0)])
    await v.close(timeout=5)
    states = [m.get("state") for m in out if m["status"] == "vowel_status"]
    check(states == ["warning"], f"a single warning for two failures ({states})")
    check(v._next_id - 1 == 2, f"20 s of speech cut into two segments ({v._next_id - 1})")
    asr_client.transcribe = fake_transcribe

    print("5) disabled without ASR_BASE_URL or for English")
    check(not vl.LiveVowelizer(send, language="en").enabled, "English: off")
    os.environ["ASR_BASE_URL"] = ""
    check(not vl.LiveVowelizer(send).enabled, "no ASR server: off")
    os.environ["ASR_BASE_URL"] = "http://fake-asr/v1"
    check(not vl.has_vowels("ذهب الطالب الى المدرسة") and vl.has_vowels(S1), "vowel detection of a script")


asyncio.run(main())


def websocket_end_to_end():
    """The whole /ws/audio socket with Speechmatics replaced by a fake that 'hears' the bursts."""
    print("6) /ws/audio end to end (fake Speechmatics)")
    import json
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from app.websockets import audio_ws

    class FakeSM:
        is_connected = True
        def __init__(self): self.t = 0.0; self.sent = []
        async def connect(self, language="ar"): return True
        async def send_audio(self, chunk):
            self.t += len(chunk) / SR
            if self.t > 3.1 and not self.sent:
                self.sent.append(1)
                self.pending = {"text": "ذهب الطالب الى المدرسة صباحا", "segment_text": "ذهب الطالب الى المدرسة صباحا",
                                "segment_start_time": 0.5, "segment_end_time": 3.0,
                                "chunk_metrics": {"is_final": True, "is_partial": False, "word_count": 5}}
            return True
        async def get_latest_transcription_with_timestamps(self, timeout=0.05):
            p = getattr(self, "pending", None); self.pending = None; return p
        async def close(self): pass

    audio_ws.SpeechmaticsTranscriber = FakeSM
    os.environ["SPEECHMATICS_API_KEY"] = "test-key"            # auto → Speechmatics
    app = FastAPI(); app.include_router(audio_ws.router)
    msgs = []
    with TestClient(app).websocket_connect("/ws/audio?language=ar&topic=lecture") as ws:
        first = ws.receive_json()
        check(first["status"] == "connected" and first["vowel_check"] is True, "connected, vowel check on")
        ws.send_text(json.dumps({"action": "script", "text": SCRIPT}))
        st = ws.receive_json()
        check(st["status"] == "vowel_status" and st["script"], "script acknowledged")
        audio = np.concatenate([silence(0.5), speech(2.5, 1), silence(1.2)])
        for i in range(0, len(audio), 4096):
            ws.send_bytes(audio[i:i + 4096].tobytes())
        ws.send_text(json.dumps({"action": "stop"}))
        while True:
            m = ws.receive_json()
            msgs.append(m)
            if m["status"] == "session_complete":
                break
    seg = [m for m in msgs if m["status"] == "vowelized_segment"]
    check(len(seg) == 1 and seg[0]["mode"] == "script" and seg[0]["speechmaticsText"],
          f"vowelized segment delivered over the socket ({[m['status'] for m in msgs]})")
    va = msgs[-1]["summary"].get("vowel_analysis", {})
    check(va.get("judgedSegments") == 1 and va.get("script", {}).get("wordsRead") == 5,
          f"session summary carries the vowel analysis ({va.get('judgedSegments')}, {va.get('script')})")


websocket_end_to_end()


def asr_as_live_transcriber():
    """LIVE_TRANSCRIBER: engine choice, and the whole socket with only the vowelized ASR (no Speechmatics)."""
    print("7) LIVE_TRANSCRIBER: which engine transcribes")
    import json
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from app.services import live_transcriber as lt
    from app.websockets import audio_ws

    def setenv(sm=None, asr=None, choice=None):
        for k, v in (("SPEECHMATICS_API_KEY", sm), ("ASR_BASE_URL", asr), ("LIVE_TRANSCRIBER", choice)):
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v

    cases = [  # (speechmatics key, asr url, setting, language) -> engine or None
        (("k", "http://a/v1", None, "ar"), "speechmatics"),
        ((None, "http://a/v1", None, "ar"), "asr"),
        (("your-speechmatics-key", "http://a/v1", None, "ar"), "asr"),
        (("k", "http://a/v1", "asr", "ar"), "asr"),
        ((None, "http://a/v1", "speechmatics", "ar"), None),
        ((None, "http://a/v1", None, "en"), None),
        ((None, None, None, "ar"), None),
        (("k", None, "asr", "ar"), None),
    ]
    for (sm, asr, choice, lang), want in cases:
        setenv(sm, asr, choice)
        got, problem = lt.choose(lang)
        check(got == want and (got or problem), f"key={bool(sm) and sm != 'your-speechmatics-key'} asr={bool(asr)} "
                                                 f"LIVE_TRANSCRIBER={choice or 'auto'} {lang} → {got or problem}")

    print("8) /ws/audio with the vowelized ASR as the live transcriber (no Speechmatics key)")
    setenv(None, "http://fake-asr/v1", None)

    class NoSM:
        def __init__(self): raise AssertionError("Speechmatics must not be used")
    audio_ws.SpeechmaticsTranscriber = NoSM
    asr_client.transcribe = fake_transcribe
    app = FastAPI(); app.include_router(audio_ws.router)
    msgs = []
    with TestClient(app).websocket_connect("/ws/audio?language=ar&topic=lecture") as ws:
        first = ws.receive_json()
        check(first["status"] == "connected" and first.get("transcriber") == "asr" and first["vowel_check"],
              f"connected, transcriber asr ({first.get('transcriber')})")
        audio = np.concatenate([silence(0.5), speech(2.5, 1), silence(0.8), speech(2.0, 2), silence(1.2)])
        for i in range(0, len(audio), 4096):
            ws.send_bytes(audio[i:i + 4096].tobytes())
        ws.send_text(json.dumps({"action": "stop"}))
        while True:
            m = ws.receive_json()
            msgs.append(m)
            if m["status"] == "session_complete":
                break
    tr = [m for m in msgs if m["status"] == "transcription"]
    plain1 = "ذهب الطالب إلى المدرسة صباحا"
    check(len(tr) == 2 and tr[0]["transcription"] == plain1 and tr[-1]["transcription"].startswith(plain1 + " إن العلم"),
          f"transcript grows one plain sentence at a time ({[t['transcription'] for t in tr]})")
    check(all(t["service"] == "vowelized_asr" for t in tr), "messages name the vowelized ASR as the service")
    seg = [m for m in msgs if m["status"] == "vowelized_segment"]
    check(len(seg) == 2 and all(s["primary"] and not s["uncertain"] for s in seg), "both sentences judged (no cross-check)")
    summ = msgs[-1]["summary"]
    check(summ.get("total_words") == 10 and summ.get("transcription_service") == "vowelized_asr",
          f"speaking metrics from the ASR sentences ({summ.get('total_words')} words, {summ.get('transcription_service')})")
    check(summ.get("vowel_analysis", {}).get("liveTranscriber") == "asr", "vowel analysis says who transcribed")

    print("9) English session without Speechmatics → clear error")
    with TestClient(app).websocket_connect("/ws/audio?language=en&topic=lecture") as ws:
        m = ws.receive_json()
    check(m["status"] == "error" and "Arabic only" in m["error"], f"error: {m.get('error')}")


asr_as_live_transcriber()
print("\n" + ("ALL PASSED" if not failures else f"{failures} FAILED"))
sys.exit(1 if failures else 0)
