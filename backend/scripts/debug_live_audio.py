#!/usr/bin/env python3
"""
Debug the live-transcription path one hop at a time, without a browser.

Streams a speech recording to /ws/audio exactly like the React speaking stage
does (16 kHz mono float32 chunks of 4096 samples, in real time) and prints
every message the backend sends back.

    python scripts/debug_live_audio.py                         # backend from frontend/.env (or :8000)
    python scripts/debug_live_audio.py --backend http://127.0.0.1:8800
    python scripts/debug_live_audio.py --frontend http://localhost:3000   # also test the Vite proxy hop
    python scripts/debug_live_audio.py --wav my_voice.wav --seconds 20
    python scripts/debug_live_audio.py --wav khutba.wav --script khutba.txt   # live vowel check against a text

Hops checked, in order:
  1. backend HTTP      GET  <backend>/api/health
  2. backend audio WS  <backend>/ws/audio  → "connected" (Speechmatics session opened)
  3. transcription     words come back while the recording streams
  4. session summary   {"action":"stop"} → session_complete
  5. Vite proxy        same WebSocket through <frontend>/ws/audio (only with --frontend)

Needs the backend environment (numpy, soundfile, librosa, websockets – all in requirements.txt).
"""

import argparse
import asyncio
import json
import sys
import time
import urllib.request

# Windows: when output is redirected (file, pipe, some IDE consoles) Python uses the legacy code page
# and crashes on the emoji / Arabic this code prints. Force UTF-8 output on every platform.
for _stream in (sys.stdout, sys.stderr):
    try:
        if (getattr(_stream, "encoding", "") or "").lower().replace("-", "") != "utf8":
            _stream.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]          # ilqaa-platform/
DEFAULT_WAV = ROOT / "tools" / "asr-eval" / "recordings" / "ahmed" / "s15_ok.wav"
SR, CHUNK = 16000, 4096

if sys.platform == "win32":
    import os
    os.system("")                   # enables ANSI colour codes in the classic Windows console
GREEN, RED, YELLOW, DIM, END = "\033[32m", "\033[31m", "\033[33m", "\033[2m", "\033[0m"


def ok(msg):   print(f"{GREEN}✓{END} {msg}")
def bad(msg):  print(f"{RED}✗ {msg}{END}")
def note(msg): print(f"{YELLOW}! {msg}{END}")


def backend_from_frontend_env() -> str:
    env = ROOT / "frontend" / ".env"
    if env.exists():
        for line in env.read_text(encoding="utf-8").splitlines():
            if line.strip().startswith("BACKEND_URL="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return "http://127.0.0.1:8000"


def load_audio(path: Path, seconds: float) -> np.ndarray:
    import librosa
    wav, _ = librosa.load(str(path), sr=SR, mono=True)
    return wav[: int(seconds * SR)].astype(np.float32) if seconds else wav.astype(np.float32)


def check_health(base: str, via_vite: bool = False) -> bool:
    url = base.rstrip("/") + "/api/health"
    try:
        with urllib.request.urlopen(url, timeout=5) as r:
            data = json.loads(r.read().decode())
        ok(f"HTTP {url} → {data.get('status')} · environment {data.get('environment')} · "
           f"AI engine {data.get('practice_ai_engine')}")
        return True
    except Exception as e:
        bad(f"HTTP {url} failed: {e}")
        if not via_vite:
            print("  → Is the backend running on that address? Start it from ilqaa-platform/backend:\n"
                  "    ../../Ilqaa/.venv/bin/python -m uvicorn app.main:app --port <port>")
        return False


async def stream(ws_url: str, audio: np.ndarray, realtime: bool, label: str, max_seconds: float = 0,
                 script: str = "") -> dict:
    import websockets
    result = {"connected": False, "error": None, "texts": [], "metrics": None, "summary": None, "sent": 0,
              "vowel_segments": []}
    t0 = time.monotonic()
    stamp = lambda: f"{DIM}[{time.monotonic() - t0:5.1f}s]{END}"
    try:
        async with websockets.connect(ws_url, max_size=None, open_timeout=10) as ws:
            first = json.loads(await asyncio.wait_for(ws.recv(), timeout=20))
            if first.get("status") != "connected":
                result["error"] = first.get("error") or json.dumps(first, ensure_ascii=False)
                bad(f"{label}: backend refused the session: {result['error']}")
                return result
            result["connected"] = True
            engine = first.get("transcriber", "speechmatics")
            ok(f"{label}: connected – live transcript by "
               f"{'the vowelized ASR (one sentence per pause)' if engine == 'asr' else 'Speechmatics'} "
               f"({first.get('message', '')})")
            if first.get("vowel_check"):
                ok(f"{label}: live vowel check is on (ASR_BASE_URL)")
                if script:
                    await ws.send(json.dumps({"action": "script", "text": script}))
            elif script:
                note("--script given, but the live vowel check is off (set ASR_BASE_URL in backend/.env)")

            async def sender():
                n = len(audio) if not max_seconds else min(len(audio), int(max_seconds * SR))
                for i in range(0, n, CHUNK):
                    await ws.send(audio[i:i + CHUNK].tobytes())
                    result["sent"] += 1
                    if realtime:
                        await asyncio.sleep(CHUNK / SR)
                await asyncio.sleep(3)                      # let the last words arrive
                await ws.send(json.dumps({"action": "stop"}))

            async def receiver():
                async for raw in ws:
                    if isinstance(raw, bytes):
                        continue
                    d = json.loads(raw)
                    st = d.get("status")
                    if st == "transcription":
                        result["texts"].append(d.get("transcription", ""))
                        kind = "final" if d.get("is_final") else "partial"
                        print(f"  {stamp()} 📝 {kind:7} {d.get('transcription', '')[-110:]}")
                    elif st == "metrics":
                        m = d.get("metrics", {})
                        result["metrics"] = m
                        print(f"  {stamp()} 📊 wpm {m.get('wpm', 0):.0f} · words {m.get('total_words')} · fillers {m.get('total_fillers')}")
                    elif st == "vowelized_segment":
                        result["vowel_segments"].append(d)
                        flags = [f"{w['word']}←{w.get('spokenWord', '')}: {e['detail']}"
                                 for w in d.get("words", []) for e in w.get("errors", [])]
                        tag = "uncertain" if d.get("uncertain") else d.get("mode")
                        print(f"  {stamp()} 🔤 [{d.get('start', 0):.1f}-{d.get('end', 0):.1f}s {tag}, "
                              f"+{d.get('lagSeconds', 0)}s] {d.get('text', '')}")
                        for f in flags:
                            print(f"           {YELLOW}✗ {f}{END}")
                    elif st == "vowel_review":
                        for i in d.get("issues", []):
                            print(f"  {stamp()} 🧐 {i.get('word')} → {i.get('correct')}: {i.get('reason')}")
                    elif st == "vowel_status":
                        print(f"  {stamp()} 🔤 vowel check: {d.get('state')} {d.get('message', '')}"
                              + (f" · script {d.get('scriptWords')} words, vowels: {d.get('scriptHasVowels')}" if d.get("script") else ""))
                    elif st == "session_complete":
                        result["summary"] = d.get("summary")
                        return
                    elif st in ("error", "warning"):
                        print(f"  {stamp()} {RED}{st}: {d.get('error') or d.get('warning')}{END}")
                        if st == "error":
                            result["error"] = d.get("error")
                    else:
                        print(f"  {stamp()} {DIM}{json.dumps(d, ensure_ascii=False)[:120]}{END}")

            await asyncio.wait_for(asyncio.gather(sender(), receiver()), timeout=len(audio) / SR + 90)
    except asyncio.TimeoutError:
        result["error"] = result["error"] or "timed out"
        bad(f"{label}: timed out")
    except Exception as e:
        result["error"] = result["error"] or f"{type(e).__name__}: {e}"
        bad(f"{label}: {result['error']}")
    return result


async def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--backend", help="backend base URL (default: BACKEND_URL from frontend/.env, else http://127.0.0.1:8000)")
    ap.add_argument("--frontend", help="also test the Vite proxy, e.g. http://localhost:3000")
    ap.add_argument("--wav", default=str(DEFAULT_WAV), help="speech recording to stream (any format librosa reads)")
    ap.add_argument("--seconds", type=float, default=15, help="stream at most this many seconds (0 = whole file)")
    ap.add_argument("--language", default="ar")
    ap.add_argument("--topic", default="academic_student")
    ap.add_argument("--fast", action="store_true", help="send as fast as possible instead of real time")
    ap.add_argument("--script", help="text file of what is being read: the live vowel check compares each sentence with it")
    args = ap.parse_args()

    backend = (args.backend or backend_from_frontend_env()).rstrip("/")
    print(f"backend: {backend}" + (f"   frontend: {args.frontend}" if args.frontend else ""))
    if "localhost" in backend:
        note("BACKEND_URL uses 'localhost'. Node (Vite) may resolve that to IPv6 ::1 while uvicorn listens on "
             "IPv4 127.0.0.1 – prefer http://127.0.0.1:<port> in frontend/.env.")

    wav = Path(args.wav)
    if not wav.exists():
        bad(f"recording not found: {wav}  (pass --wav <file>)")
        return 1
    audio = load_audio(wav, args.seconds)
    peak = float(np.abs(audio).max()) if len(audio) else 0.0
    print(f"audio: {wav.name} · {len(audio) / SR:.1f} s · peak level {peak:.2f}")

    print("\n1) Backend HTTP")
    if not check_health(backend):
        return 1

    ws_base = backend.replace("https://", "wss://").replace("http://", "ws://")
    q = f"language={args.language}&topic={args.topic}"
    print(f"\n2–4) Backend audio stream  {ws_base}/ws/audio?{q}")
    script = Path(args.script).read_text(encoding="utf-8") if args.script else ""
    r = await stream(f"{ws_base}/ws/audio?{q}", audio, not args.fast, "backend /ws/audio", script=script)
    failed = False
    if not r["connected"]:
        failed = True
        print("  → The backend could not start live transcription (the error above says why). With Speechmatics, check "
              "SPEECHMATICS_API_KEY in backend/.env and the backend terminal (invalid key, quota, network); without it, "
              "set ASR_BASE_URL (LIVE_TRANSCRIBER=auto|asr) and start tools/asr-eval/serve_asr.py.")
    elif not any(t.strip() for t in r["texts"]):
        failed = True
        bad(f"no transcription came back ({r['sent']} audio chunks sent)")
        print("  → Audio reached the backend but no words came back. With Speechmatics, check the backend terminal for "
              "'🎯 Final' / '📝 Partial' lines and errors; with the vowelized ASR, check that serve_asr.py is running "
              "and answering (🔤 lines above). Also check that --language matches the speech.")
    else:
        ok(f"transcription works: {len(r['texts'])} updates – \"{r['texts'][-1][:80]}…\"")
        if r["summary"]:
            s = r["summary"]
            ok(f"session summary: {s.get('total_words')} words · {s.get('overall_wpm', 0):.0f} WPM · {s.get('total_fillers')} fillers")
            va = s.get("vowel_analysis")
            if va and va.get("enabled"):
                ok(f"vowel check: {va.get('segments')} sentences ({va.get('uncertainSegments')} unclear, "
                   f"{va.get('droppedSegments')} dropped) · ASR {va.get('medianAsrSeconds')} s per sentence · "
                   f"errors {va.get('errorsByType') or 'none'}"
                   + (f" · script delivered {va['script']['coveragePercent']}%" if va.get("script") else ""))
        else:
            note("no session_complete summary after stop")

    if args.frontend:
        fe = args.frontend.rstrip("/")
        print(f"\n5) Through the Vite dev server  {fe}")
        if check_health(fe, via_vite=True):
            fe_ws = fe.replace("https://", "wss://").replace("http://", "ws://")
            r2 = await stream(f"{fe_ws}/ws/audio?{q}", audio, not args.fast, "Vite proxy /ws/audio", max_seconds=8)
            if r2["connected"] and any(t.strip() for t in r2["texts"]):
                ok("the Vite proxy forwards the audio stream correctly")
            elif r2["connected"]:
                note("the proxy connects, but no words came back in 8 s")
            else:
                failed = True
                print("  → The browser path is broken at the Vite proxy: check BACKEND_URL in frontend/.env, then "
                      "restart `npm run dev` (Vite reads .env only at startup).")
        else:
            failed = True
            print("  → Vite is running but can't reach the backend (an HTTP 500 here usually means 'connection refused'"
                  " – the npm run dev terminal shows the exact error). Set BACKEND_URL in frontend/.env to the address that"
                  " worked in step 1, then restart `npm run dev`.")

    print("\n" + ("Some hops failed – see the hints above." if failed else
                  "All hops work. If the browser still shows no transcript, open the stage with ?debug=1 "
                  "(e.g. http://localhost:3000/?debug=1) to see what the page sends and receives."))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
