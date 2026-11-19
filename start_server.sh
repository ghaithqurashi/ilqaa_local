#!/bin/sh
cd  ~/ilqaa-platform/backend 
source .venv/bin/activate
.venv/bin/python ~/ilqaa-platform/tools/asr-eval/serve_asr.py &
.venv/bin/python -m uvicorn app.main:app --port 8000 &


cd ~/ilqaa-platform/frontend
npm run dev
