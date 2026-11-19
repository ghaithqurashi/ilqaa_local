#!/usr/bin/env python3
"""
Serve NAMAA-Space/Cohere-Speech-Tashkeel-2B as an OpenAI-compatible transcription API,
so the Ilqaa backend can use it for vowelized pronunciation checks (PRONUNCIATION_ENGINE=asr).

    python serve_asr.py                          # http://127.0.0.1:8090/v1, best device (cuda / mps / cpu)
    python serve_asr.py --device cpu --port 8090
    python serve_asr.py --host 0.0.0.0           # let another machine's backend use this GPU box

then in backend/.env:

    ASR_BASE_URL=http://127.0.0.1:8090/v1

Endpoints:
    POST /v1/audio/transcriptions   multipart "file" (WAV/FLAC/OGG; MP3/WebM need ffmpeg installed)
                                    -> {"text": "...", "duration": s, "seconds": s}
    GET  /health                    -> model, device, ready

Runs in the asr-eval environment (see README.md) plus:  pip install -r requirements-server.txt
"""

import argparse
import os
import sys
import tempfile
import threading
import time
from pathlib import Path

for _stream in (sys.stdout, sys.stderr):
    try:
        if (getattr(_stream, "encoding", "") or "").lower().replace("-", "") != "utf8":
            _stream.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

sys.path.insert(0, str(Path(__file__).resolve().parent))
from run_eval import REPO, SR, Transcriber, load_audio  # noqa: E402

MAX_SECONDS = 120          # longer recordings are cut (the read-aloud texts are short)


def build_app(transcriber: Transcriber, api_key: str = ""):
    from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile

    app = FastAPI(title="Vowelized ASR (Cohere-Speech-Tashkeel-2B)")
    lock = threading.Lock()                  # one inference at a time: the model is not thread-safe

    def _auth(authorization):
        if api_key and (authorization or "") != f"Bearer {api_key}":
            raise HTTPException(status_code=401, detail="invalid API key")

    @app.get("/health")
    def health():
        return {"model": REPO, "device": transcriber.device, "dtype": str(transcriber.dtype).replace("torch.", ""),
                "ready": True}

    @app.post("/v1/audio/transcriptions")
    def transcriptions(file: UploadFile = File(...), model: str = Form(REPO), language: str = Form("ar"),
                       response_format: str = Form("json"), authorization: str = Header(None)):
        # a plain def: FastAPI runs it in a worker thread, so a slow CPU inference doesn't block /health
        _auth(authorization)
        suffix = Path(file.filename or "audio.wav").suffix or ".wav"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(file.file.read())
            path = tmp.name
        try:
            try:
                wav = load_audio(path)[: MAX_SECONDS * SR]
            except Exception as exc:
                raise HTTPException(status_code=400, detail=f"cannot decode the audio ({suffix}): {exc}. "
                                                            "Send WAV, or install ffmpeg for MP3/WebM/M4A.")
            if len(wav) < SR // 10:
                raise HTTPException(status_code=400, detail="recording is too short")
            with lock:
                text, seconds = transcriber.transcribe(wav)
        finally:
            try:
                os.unlink(path)
            except OSError:
                pass
        print(f"[{time.strftime('%H:%M:%S')}] {len(wav) / SR:.1f} s audio → {seconds:.1f} s  {text[:90]}", flush=True)
        if response_format == "text":
            from fastapi.responses import PlainTextResponse
            return PlainTextResponse(text)
        return {"text": text, "duration": round(len(wav) / SR, 2), "seconds": round(seconds, 2)}

    return app


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=8090)
    ap.add_argument("--device", default="auto", help="auto | cuda | mps | cpu")
    ap.add_argument("--dtype", default="auto", help="auto | float32 | bfloat16 | float16")
    ap.add_argument("--api-key", default=os.getenv("ASR_API_KEY", ""), help="require this bearer token (optional)")
    args = ap.parse_args()

    try:
        import uvicorn  # noqa: F401
        import multipart  # noqa: F401  (python-multipart, for file uploads)
    except ImportError:
        sys.exit("Missing server packages. Install them:  pip install -r requirements-server.txt")

    transcriber = Transcriber(args.device, args.dtype)
    import numpy as np
    transcriber.warmup(np.zeros(SR, dtype=np.float32))     # loads kernels; falls back to float32 / CPU if needed
    print(f"Model ready on {transcriber.device} in {transcriber.load_seconds:.0f} s. "
          f"Set ASR_BASE_URL=http://{'127.0.0.1' if args.host in ('0.0.0.0', '::') else args.host}:{args.port}/v1 "
          f"in backend/.env")

    import uvicorn
    uvicorn.run(build_app(transcriber, args.api_key), host=args.host, port=args.port, log_level="warning")


if __name__ == "__main__":
    main()
