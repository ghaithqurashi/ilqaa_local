# Vowelized ASR benchmark (Cohere-Speech-Tashkeel-2B)

Measures whether [NAMAA-Space/Cohere-Speech-Tashkeel-2B](https://huggingface.co/NAMAA-Space/Cohere-Speech-Tashkeel-2B)
can power Ilqaa's read-aloud check: the model writes down what the student said
**with vowels**, and `arabic_diff.py` compares that with the vowelized reference
text to find mistakes (wrong letter, skipped word, wrong case ending, wrong inner
vowel, missing shadda).

| File | What it does |
|---|---|
| `sentences.json` | 15 reference sentences; each has a correct reading plus variants with one planted mistake (41 clips) |
| `record.py` | Records the clips from your microphone (16 kHz WAV + manifest) |
| `run_eval.py` | Runs the model on the clips and writes the benchmark report |
| `arabic_diff.py` | Vowel-aware comparison: alignment, error types, WER/CER/DER |
| `test_arabic_diff.py` | Self-checks for the comparison and the planted variants |
| `serve_asr.py` | Serves the model as an OpenAI-compatible `/v1/audio/transcriptions` API for the backend (`ASR_BASE_URL`) |

`arabic_diff.py` here loads `backend/app/services/arabic_diff.py`, the same comparison the backend uses.

## 1. Set up (once)

Use a separate environment from the backend (this needs a newer `transformers`).

```bash
cd tools/asr-eval
python3.11 -m venv .venv
source .venv/bin/activate
pip install -U -r requirements.txt
python test_arabic_diff.py          # should end with "ALL PASSED"
```

**Windows (PowerShell):**

```powershell
cd tools\asr-eval
py -3.11 -m venv .venv
.venv\Scripts\Activate.ps1
pip install -U -r requirements.txt
python test_arabic_diff.py
```

- Recording needs microphone access for desktop apps: Settings → Privacy & security → Microphone →
  *Let desktop apps access your microphone*.
- There is no Apple GPU (MPS) on Windows: the model runs on the CPU in float32 (≈8 GB RAM, slower), or
  on an NVIDIA GPU if you install the CUDA build of torch from the selector on pytorch.org (the default
  `pip install torch` on Windows is CPU-only). `--device cuda` then uses it.
- The report's process-memory figure is not available on Windows (GPU memory still is, with CUDA).
- Keep the folder path short – see the long-path note in the root README.

## 2. Record the test set

```bash
python record.py --speaker ahmed
```

Takes about 15 minutes for all 41 clips. For each clip the terminal shows the
line to read; for planted-mistake clips the line already contains the mistake
and a ⚠ hint says what to do (e.g. *سَبَاحًا: انطق الصاد سيناً*). Read every
word with its full vowels and pause only at punctuation. `q` stops, and running
the command again resumes where you left off. `--redo s01/ending` re-records a
clip; `--list-devices` / `--device N` pick a microphone.

The first time, macOS asks to give your terminal app microphone access
(System Settings → Privacy & Security → Microphone).

More speakers make the results far more meaningful – especially students, since
the model has only been evaluated on adult speech. Each speaker records under
their own `--speaker` name. Children's recordings need parental consent;
`recordings/` is git-ignored and never leaves your machine.

Clips recorded elsewhere (phone, the Ilqaa app) can be added by placing them in
`recordings/<speaker>/` with a `manifest.csv` that has the columns
`file,speaker,item,variant,reference,read_as,expect,duration_s` (see a generated
one). Any format `librosa` can open works; m4a/mp3 need `ffmpeg` installed.

## 3. Run the benchmark

```bash
python run_eval.py --name mac-mps
```

The first run downloads the model (several GB) from Hugging Face. On a Mac it
uses the Apple GPU (MPS) in bfloat16, and automatically falls back to float32 –
then to CPU – if an operation isn't supported. Options:

- `--limit 5` – quick try on the first 5 clips
- `--device cpu` / `--dtype float32` – force a device or precision (compare MPS vs CPU)
- `--speakers ahmed` – only some speakers
- `--dry-run` – no model; checks the recordings and the scoring pipeline
- `--rescore results/mac-mps` – re-score saved transcripts after changing `arabic_diff.py` (no model run)

Output in `results/<name>/`: `report.md` (readable report), `summary.json`,
`clips.jsonl` (every transcript).

## 4. Reading the report

**Speed** – model load time, latency per clip and real-time factor (processing
time ÷ audio length; below 1 is faster than real time), memory.

**Transcription accuracy** – the transcript against what was actually read:

- *WER (no vowels)*: are the words right at all?
- *WER (with vowels)*: words with every vowel correct
- *DER*: vowel-mark error rate, split into *inside words* and *case endings*
  (إعراب). A missing mark counts as an error; *DER on marked letters* only counts
  marks the model wrote, and *vowel coverage* says how many it wrote.
- Pausal endings (sukun at punctuation or at the end) are not counted.

**Mistake detection** – the number that matters for the product. For each
error type: how many planted mistakes were *caught* (recall) and how many
reported mistakes were real (precision), plus false alarms on correct readings.
The key risk to look for is a model that "corrects" the student: a planted wrong
ending that comes back with the right ending shows up as *missed* in
`ending_vowel`.

Share `results/<name>/report.md` (and `summary.json`) to discuss the results.

## 5. Use it in the app

```bash
pip install -r requirements-server.txt
python serve_asr.py            # --device cpu|mps|cuda, --host 0.0.0.0, --api-key <secret>
```

Then set `ASR_BASE_URL=http://127.0.0.1:8090/v1` (and `PRONUNCIATION_ENGINE=asr`) in `backend/.env` and restart
the backend. See "Vowelized pronunciation check" in the main README.
