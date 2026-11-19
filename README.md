# Ilqaa Platform (إلقاء)

Combined repository for the Ilqaa public-speaking platform.

| Folder | Origin | Stack |
|---|---|---|
| `backend/` | [rami-awad/Ilqaa](https://github.com/rami-awad/Ilqaa) | FastAPI · WebSockets · Speechmatics · MediaPipe · LLM client · Firebase auth |
| `frontend/` | [ghaithqurashi/ILQAA-LAB](https://github.com/ghaithqurashi/ILQAA-LAB) | React 19 · Vite · Tailwind — no server of its own; talks to `backend/` |
| `shared/` | — | Configs shared by both (filler words, speaking sectors, translations) — to be populated |

Both folders were imported with `git subtree`, so their full commit history is preserved.

## Running locally

Start the backend first, then the frontend.

```bash
# backend – http://localhost:8000
cd backend && python3.11 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
cp .env.example .env   # fill in keys – including AUDIO_API_KEY for the React app's audio features
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# frontend – http://localhost:3000 (forwards /api and /ws to the backend)
cd frontend && npm install
npm run dev
```

`http://localhost:8000/api/health` shows which AI engine the React app's
features are using (`practice_ai_engine`: `llm`, `gemini` or `offline_fallback`).

### Windows

Everything installs on Windows 10/11 x64: every pinned backend package has a Windows wheel for
Python 3.11 (torch, MediaPipe 0.10.18, OpenCV, jax, …) and the frontend lockfile includes the Windows
builds of its native tools. Use PowerShell:

```powershell
# backend – http://localhost:8000   (Python 3.11 x64 from python.org, which installs the `py` launcher)
cd backend
py -3.11 -m venv .venv
.venv\Scripts\Activate.ps1          # if blocked: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
pip install -r requirements.txt
copy .env.example .env              # then fill in the keys
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# frontend – http://localhost:3000   (Node.js 20 or newer)
cd frontend
npm install
npm run dev
```

Windows notes:

- **Keep the project path short** (e.g. `C:\dev\ilqaa-platform`). torch and MediaPipe contain files whose
  paths come close to Windows' 260-character limit inside `.venv`, and `pip install` fails with
  "No such file or directory" when the limit is crossed. Alternatively enable long paths once, in an
  administrator PowerShell:
  `New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name LongPathsEnabled -Value 1 -PropertyType DWORD -Force`
- If `import torch` / `cv2` / `mediapipe` fails with **"DLL load failed"**, install the latest
  *Microsoft Visual C++ Redistributable (x64)*.
- **FFmpeg is not needed** for the backend (audio arrives as raw PCM).
- Allow the browser to use the **camera and microphone**: Settings → Privacy & security → Camera / Microphone.
- `frontend/.env` → `BACKEND_URL=http://127.0.0.1:8000` (prefer `127.0.0.1` to `localhost`).
- Docker Desktop (WSL 2) can run `backend/Dockerfile` instead of a local Python install.

### The live speaking stage

The stage needs the backend running with `SPEECHMATICS_API_KEY` (live transcription)
and an AI engine (`LLM_*` settings – coaching, tone and the end-of-session evaluation).
Camera analysis (MediaPipe) runs locally in the backend. Every live figure shows "—"
until it has actually been measured; the status chips under the stage header show
which of the four streams are connected.

**Live vowel check (optional).** With a vowelized ASR configured (`ASR_BASE_URL`, see
"Vowelized pronunciation check" below), the stage also checks vowels and case endings *while*
the speaker talks:

- The backend keeps the incoming audio, cuts it at each pause (never inside a word – the case
  ending is the last vowel), and sends each sentence to Tashkeel-2B. On an Apple-silicon Mac a
  sentence takes about 0.3 s, so it appears with its vowels about a second after the pause.
- **With a text** (the selected preset, or the speaker's own text pasted on the setup page) each
  sentence is located in the text and compared letter by letter, exactly like the voice-practice
  page: skipped words, wrong letters, wrong endings, inner vowels, shadda. A text without vowels can
  be vowelized by the LLM ("أضف التشكيل تلقائياً") – review it, the comparison relies on it. The
  vowelized text is also shown on the teleprompter.
- **Free speech**: the text LLM reviews the i'rab of every three sentences and reports only clear errors.
- A sentence where Tashkeel and Speechmatics disagree on the words is shown as unclear and not judged;
  if the ASR falls behind, the oldest sentences are skipped rather than delayed.
- Possible errors are underlined (dotted) on the stage; the debrief gets the totals and examples.

The recogniser can mishear (see the benchmark's false alarms), so findings are presented as
indications, and the debrief looks for patterns. Try it without a browser:
`python scripts/debug_live_audio.py --wav reading.wav --script reading.txt`.
Offline checks: `python tests/test_live_vowels.py`.

**Live transcript without Speechmatics.** `LIVE_TRANSCRIBER` in `backend/.env` decides who writes the
stage's live transcript: `auto` (default – Speechmatics when `SPEECHMATICS_API_KEY` is set, otherwise the
vowelized ASR), `speechmatics`, or `asr`. With the ASR, each sentence appears (with its vowels) about a
second after the speaker pauses instead of word by word; speaking rate, fillers, pauses, the live hints
and the debrief are computed from those sentences, and no sentence is skipped if the ASR falls behind
(the transcript lags instead). There is no second recogniser to cross-check against, so every sentence
is judged. Arabic only – English sessions need Speechmatics. `/api/health` → `live_transcriber` shows
the choice.

### Testing the AI endpoints

With the backend running, send one real request per task and check the replies:

```bash
cd backend
python scripts/smoke_test_practice.py --label gpt-4.1-mini --out results-gpt.json --tts
```

Any OpenAI-compatible provider works, e.g. OpenRouter in `backend/.env`:

```
LLM_PROVIDER=custom
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_API_KEY=<your key>
LLM_MODEL=openai/gpt-4.1-mini        # or google/gemini-2.5-flash
```

Offline routing checks (fake servers, no keys needed): `python tests/test_audio_engines.py`.

### Which model does what

| Feature (React app) | Engine | Settings |
|---|---|---|
| Challenges, coach, reports, live prompts, debrief | text LLM (`PRACTICE_AI_ENGINE=auto`/`llm`), or the audio model (`audio`) | `LLM_*` |
| Pronunciation feedback on a recording | `PRONUNCIATION_ENGINE`: `asr` → `audio` → `text` (`auto` takes the first available) | `ASR_*`, `AUDIO_*` |
| Model reading voice (`/api/tts`) | audio TTS model, else Google Translate's voice | `AUDIO_TTS_*` / `AUDIO_*` |
| Live transcription on the stage | Speechmatics | `SPEECHMATICS_API_KEY` |

`AUDIO_PROVIDER` is `gemini` (default) or `openai` (any OpenAI-compatible API: OpenAI, OpenRouter…);
the old `GEMINI_*` names still work. `/api/health` shows what the running backend picked
(`practice_ai_engine`, `pronunciation_engine`, `audio`, `tts`, `asr`). Restart the backend after editing `.env`.

### Vowelized pronunciation check (Cohere-Speech-Tashkeel-2B)

With `PRONUNCIATION_ENGINE=asr` (or `auto` with an ASR configured), a recording is checked like this:

1. The browser converts the recording to 16 kHz WAV and sends it with the reference text.
2. [NAMAA-Space/Cohere-Speech-Tashkeel-2B](https://huggingface.co/NAMAA-Space/Cohere-Speech-Tashkeel-2B)
   writes down what the student said **with its short vowels**.
3. `backend/app/services/arabic_diff.py` compares it with the vowelized reference: skipped / extra words,
   wrong letters (ص→س…), wrong case endings, wrong inner vowels, shadda. Pausal endings (الوقف) are accepted.
4. The text LLM gets that comparison and explains each error (i'rab, makhraj); the word statuses and the
   score come from the comparison, so the same reading always gets the same result and the LLM can't
   invent or overlook an error. Without an LLM the comparison alone is returned.

The page shows the vowelized transcript under the result. If the ASR server is unreachable the request falls
back to the audio model, then to transcript-only feedback (`asrError` in the reply says why).

Run the model as a local service in the benchmark environment (`tools/asr-eval`, see its README):

```bash
cd tools/asr-eval
source .venv/bin/activate              # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements-server.txt
python serve_asr.py                    # http://127.0.0.1:8090/v1 – first start downloads the weights
```

and in `backend/.env`:

```
ASR_BASE_URL=http://127.0.0.1:8090/v1
PRONUNCIATION_ENGINE=asr
```

A GPU (CUDA) or Apple-silicon Mac (MPS) is strongly recommended; on CPU a sentence can take several seconds
(raise `ASR_TIMEOUT` if needed). `serve_asr.py --host 0.0.0.0 --api-key <secret>` lets the backend use a GPU
machine elsewhere. Accuracy limits are whatever the benchmark (`tools/asr-eval`) measured: an ASR mistake
becomes a false error for the student, so check the benchmark's *false alarms* and *missed endings* first.

## Deploying the demo on a Windows machine

This turns a Windows 10/11 PC into a demo server: the backend runs in the background, the React app
is served as a production build, and both start automatically with Windows. Do the one-time setup from
[Windows](#windows) first (Python 3.11, Node.js 20+, `pip install -r requirements.txt`, `npm install`),
in a short path such as `C:\dev\ilqaa-platform`.

**How the pieces fit.** The React app calls `/api/...` and opens `/ws/...` streams on *its own*
address, so whatever serves the built site must forward those paths to the backend. Browsers also
allow the **microphone and camera only on `https://` or `http://localhost`** – a demo that other
computers open needs HTTPS.

| Option | Use when | Serves the site with | Mic/camera works for |
|---|---|---|---|
| A. Vite preview | presenting on the demo PC itself | `npm run preview` | that PC only (`localhost`) |
| B. Caddy | others open the demo from their own devices | [Caddy](https://caddyserver.com) web server (one `.exe`) | everyone, over HTTPS |

### 1. Backend settings (`backend\.env`)

- Fill in `SPEECHMATICS_API_KEY` and the `LLM_*` settings (plus `AUDIO_*` / `ASR_*` if used).
- Keep `ENVIRONMENT=development`. `production` is wired for Google Cloud Run + Firebase Hosting
  (it hard-codes the Firebase site URL and `wss://`), not for a self-hosted machine.
- Set a long random `JWT_SECRET` and an `ALLOWED_USERS` list: in development mode
  `/api/auth/test-login` hands out session tokens, to anyone if `ALLOWED_USERS` is empty.
- **Do not expose the demo to the internet as-is.** The React app has no sign-in yet (roadmap step 4)
  and `/api/analyze`, `/api/tts` and the `/ws/*` streams are open – anyone who can reach them spends
  your Speechmatics / LLM credits. Keep it on a trusted network, or put the password prompt from
  option B in front of it.

### 2. Build the frontend

```powershell
cd C:\dev\ilqaa-platform\frontend
npm ci              # exact versions from package-lock.json
npm run build       # writes frontend\dist
```

### 3a. Option A – quick demo on this PC

Two PowerShell windows:

```powershell
# window 1 – backend (no --reload in a demo)
cd C:\dev\ilqaa-platform\backend
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000

# window 2 – serves frontend\dist and forwards /api and /ws to BACKEND_URL (from frontend\.env)
cd C:\dev\ilqaa-platform\frontend
npm run preview
```

Open **http://localhost:4173** on the demo PC. (`npm run preview` reuses the `/api` + `/ws` forwarding
from `vite.config.ts`; it is fine for a demo but is not a production web server.)

### 3b. Option B – demo for other devices (Caddy + HTTPS)

1. Download `caddy.exe` for Windows amd64 from <https://caddyserver.com/download> and save it as
   `C:\dev\caddy\caddy.exe`.
2. Create `C:\dev\caddy\Caddyfile` – replace `192.168.1.50` with the demo PC's IP address
   (`ipconfig`):

   ```caddyfile
   localhost, 192.168.1.50 {
       # Certificates from Caddy's own local authority (no internet or domain needed)
       tls internal

       # Optional password prompt – generate the hash with:  C:\dev\caddy\caddy.exe hash-password
       # basic_auth {
       #     demo <paste-the-hash-here>
       # }

       # Backend: AI tasks, text-to-speech and the four live streams (WebSockets are proxied automatically)
       handle /api/* {
           reverse_proxy 127.0.0.1:8000
       }
       handle /ws/* {
           reverse_proxy 127.0.0.1:8000
       }

       # The React app (single-page app: unknown paths fall back to index.html)
       handle {
           root * C:/dev/ilqaa-platform/frontend/dist
           try_files {path} /index.html
           file_server
           encode zstd gzip
       }
   }
   ```

   With a real domain name pointing at the PC (and ports 80/443 reachable from the internet), use the
   domain as the site address and delete `tls internal` – Caddy then fetches a trusted certificate itself.
3. Start the backend (window 1 of option A), then Caddy:

   ```powershell
   C:\dev\caddy\caddy.exe run --config C:\dev\caddy\Caddyfile
   ```

4. Allow HTTPS through the firewall (administrator PowerShell):

   ```powershell
   New-NetFirewallRule -DisplayName "Ilqaa demo (HTTPS)" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow -Profile Private
   ```

5. Open **https://192.168.1.50** from another device. Because the certificate comes from Caddy's local
   authority, each device must trust it once: install
   `%AppData%\Caddy\pki\authorities\local\root.crt` (on the demo PC, in the profile of the account
   that runs Caddy) as a trusted root certificate on the device – otherwise the browser shows a warning
   and blocks the microphone and camera.

### 4. Start everything automatically with Windows

Register the backend (and Caddy, for option B) as scheduled tasks that start at boot, run without
anyone logged in, and restart if they stop. Run in an **administrator** PowerShell:

```powershell
$root  = "C:\dev\ilqaa-platform"
New-Item -ItemType Directory -Force "$root\logs" | Out-Null
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) `
            -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -StartWhenAvailable
$runAs = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType S4U   # runs while logged off; no stored password

# backend – output goes to logs\backend.log
$backend = New-ScheduledTaskAction -Execute "cmd.exe" -WorkingDirectory "$root\backend" `
           -Argument '/c .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 >> ..\logs\backend.log 2>&1'
Register-ScheduledTask -TaskName "Ilqaa backend" -Action $backend -Trigger (New-ScheduledTaskTrigger -AtStartup) `
                       -Principal $runAs -Settings $settings

# Caddy (option B)
$caddy = New-ScheduledTaskAction -Execute "cmd.exe" -WorkingDirectory "C:\dev\caddy" `
         -Argument '/c caddy.exe run --config Caddyfile >> C:\dev\ilqaa-platform\logs\caddy.log 2>&1'
Register-ScheduledTask -TaskName "Ilqaa web (Caddy)" -Action $caddy -Trigger (New-ScheduledTaskTrigger -AtStartup) `
                       -Principal $runAs -Settings $settings

Start-ScheduledTask "Ilqaa backend"; Start-ScheduledTask "Ilqaa web (Caddy)"
```

- `-ExecutionTimeLimit ([TimeSpan]::Zero)` matters: by default Task Scheduler **stops a task after
  72 hours**.
- Writing the backend's output to a file is safe: it switches its console output to UTF-8 at startup,
  so the emoji and Arabic it prints don't crash it under Windows' legacy code page.
- Manage them with `Get-ScheduledTask "Ilqaa*"`, `Stop-ScheduledTask` / `Start-ScheduledTask`, or the
  Task Scheduler app. For option A, use a task with `npm.cmd run preview` in `frontend` instead of Caddy.
- Keep the PC from sleeping during demos: Settings → System → Power → *Sleep: Never* (when plugged in).

### 5. Check the deployment

1. `http://127.0.0.1:8000/api/health` on the demo PC → `"status": "healthy"` and the AI engine in use.
2. The same through the front door: `https://192.168.1.50/api/health` (option B) or
   `http://localhost:4173/api/health` (option A) – proves `/api` forwarding.
3. Live audio path, on the demo PC (option A or direct backend):
   `backend\.venv\Scripts\python.exe backend\scripts\debug_live_audio.py --backend http://127.0.0.1:8000 --frontend http://localhost:4173`
4. In the browser, open the speaking stage with `?debug=1` (e.g. `https://192.168.1.50/?debug=1`) and
   start a session: the four status chips should turn green and the debug panel shows audio chunks
   flowing. Logs are in `C:\dev\ilqaa-platform\logs\`.

### 6. Updating the demo

```powershell
cd C:\dev\ilqaa-platform
git pull
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
cd frontend; npm ci; npm run build; cd ..
Restart-ScheduledTask "Ilqaa backend"     # Caddy serves the new build without a restart
```

(`Restart-ScheduledTask` is `Stop-ScheduledTask` followed by `Start-ScheduledTask` on older Windows.)

## Merge roadmap

1. ✅ Single repo with both histories (`git subtree`)
2. ✅ AI tasks from `frontend/server.ts` moved into FastAPI (`backend/app/api/practice.py`); `server.ts` removed
3. ✅ React speaking stage (`OratoryStageTab`) runs on the backend WebSockets (`/ws/audio`, `/ws/video`, `/ws/guidance`, `/ws/sentiments`) via `frontend/src/lib/liveCoach.ts`; simulated metrics removed
4. Firebase sign-in in React with roles (student / teacher / admin / ministry)
5. Add a database for students, sessions and progress (replace browser localStorage)
6. Merge translations and configs into `shared/`; retire `backend/static/`

## Pulling later upstream changes

```bash
git subtree pull --prefix=backend  https://github.com/rami-awad/Ilqaa.git main
git subtree pull --prefix=frontend https://github.com/ghaithqurashi/ILQAA-LAB.git main
```
