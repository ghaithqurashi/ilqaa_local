#!/usr/bin/env python3
"""
Smoke test for the practice / oratory AI endpoints (/api/analyze, /api/tts).

Sends one realistic request per task to a running backend and checks that each
reply has the shape the React frontend expects. It also fails replies that came
from the offline fallback instead of a real model, replies in the wrong
language, and a pronunciation check that misjudges the test reading (which
skips 'إِلَى' and says 'سباحا' for 'صَبَاحًا').

Usage (backend already running on :8000):

    python scripts/smoke_test_practice.py
    python scripts/smoke_test_practice.py --label gpt-4.1-mini --out results-gpt.json
    python scripts/smoke_test_practice.py --tasks pronunciation_feedback oratory_debrief --show
    python scripts/smoke_test_practice.py --lang en
    python scripts/smoke_test_practice.py --tts           # also fetch one TTS clip

Only the Python standard library is used. The API key is never printed.
Exit code is 0 when every check passes, 1 otherwise.
"""

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.parse
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

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))
try:  # used to recognise offline-fallback replies
    from app.services.practice_fallbacks import fallback_response
except Exception:  # pragma: no cover - script still works without it
    fallback_response = None

ARABIC_RE = re.compile(r"[؀-ۿ]")
HARAKAT_RE = re.compile(r"[ً-ْ]")

# ---------------------------------------------------------------------------
# Test requests (shaped like the ones the React components send)
# ---------------------------------------------------------------------------

def build_requests(lang: str) -> dict:
    return {
        # A reading with two deliberate mistakes: صباحا read as سباحا (ص -> س)
        # and the word إِلَى skipped. A real model should flag at least one.
        "pronunciation_feedback": {
            "task": "pronunciation_feedback",
            "language": "ar",
            "grade": "Grade 6",
            "targetText": "ذَهَبَ الطَّالِبُ إِلَى الْمَدْرَسَةِ صَبَاحًا",
            "text": "ذهب الطالب المدرسة سباحا",
            "standardCode": "المعيار 1.1",
            "standardName": "الفصاحة ومخارج الحروف",
            "indicator": "ينطق الحروف من مخارجها الصحيحة ويضبط أواخر الكلمات",
        },
        "generate_challenge": {
            "task": "generate_challenge",
            "language": lang,
            "grade": "Grade 5",
            "standardName": "مخارج الحروف المفخمة" if lang == "ar" else "Clear consonant articulation",
            "indicatorAr": "يميز في النطق بين الصاد والسين",
            "category": "pronunciation",
        },
        "interactive_coach": {
            "task": "interactive_coach",
            "language": lang,
            "grade": "Grade 5",
            "userQuestion": "كيف أفرّق في النطق بين الصاد والسين؟" if lang == "ar"
            else "How do I stop rushing when I read aloud?",
            "currentPhrase": "صَبَاحُ الْخَيْرِ يَا سَلْمَى",
            "standardName": "مخارج الحروف",
            "indicatorAr": "يميز في النطق بين الصاد والسين",
        },
        "academic_report": {
            "task": "academic_report",
            "language": lang,
            "grade": "Grade 7",
            "subjects": [
                {"name": "Arabic Literature", "score": 84},
                {"name": "Grammar", "score": 71},
                {"name": "Vocabulary", "score": 90},
                {"name": "Speech Pronunciation", "score": 77},
            ],
        },
        "oratory_live_prompt": {
            "task": "oratory_live_prompt",
            "language": lang,
            "sector": "academic_student",
            "speechType": "Lecture",
            "topic": "أهمية القراءة" if lang == "ar" else "Why reading matters",
            "currentTranscript": (
                "السلام عليكم ورحمة الله. اليوم سأتحدث عن أهمية القراءة في حياتنا، فالقراءة يعني هي غذاء "
                "العقل، وكل كتاب نقرؤه يفتح لنا نافذة جديدة على العالم."
                if lang == "ar" else
                "Good morning everyone. Today I want to talk about why reading matters. Um, every book "
                "we read opens a new window on the world."
            ),
        },
        "oratory_debrief": {
            "task": "oratory_debrief",
            "language": lang,
            "sector": "academic_student",
            "speechType": "Lecture",
            "speechTitle": "أهمية القراءة" if lang == "ar" else "Why reading matters",
            "durationSeconds": 95,
            "wpm": 128,
            "fillerCount": 3,
            "eyeContactPercent": 74,
            "convictionScore": 80,
            "pitchVarianceHz": 35,
            "grade": "Grade 7",
            "transcript": (
                "السلام عليكم ورحمة الله. اليوم سأتحدث عن أهمية القراءة في حياتنا. القراءة يعني غذاء العقل، "
                "وهي الطريق إلى العلم والمعرفة. وأدعوكم جميعاً أن تجعلوا لكم ورداً يومياً من القراءة."
                if lang == "ar" else
                "Good morning everyone. Today I want to talk about why reading matters. Reading is, um, "
                "food for the mind and the road to knowledge. I invite you all to read a little every day."
            ),
        },
    }


# ---------------------------------------------------------------------------
# Shape checks – what the frontend reads from each reply
# ---------------------------------------------------------------------------

STR, NUM, LIST, DICT = "string", "number", "list", "object"

REQUIRED = {
    "pronunciation_feedback": {"overallScore": NUM, "feedback": STR, "corrections": LIST, "recommendations": LIST},
    "generate_challenge": {"targetPhrase": STR, "explanation": STR, "focusTips": LIST, "phrase": STR},
    "interactive_coach": {"reply": STR, "answer": STR},
    "academic_report": {"summary": STR, "strengths": LIST, "actionPlan": LIST, "closingMessage": STR},
    "oratory_live_prompt": {"contentSummary": STR, "speakingGuidance": STR, "bodyLanguageTip": STR,
                            "sentiment": STR, "lexicalScore": NUM},
    "oratory_debrief": {"overallScore": NUM, "vocalVarietyScore": NUM, "bodyLanguageScore": NUM,
                        "structureAndLogicScore": NUM, "strengths": LIST, "areasForImprovement": LIST,
                        "summaryJudgement": STR, "awardedBadge": STR},
}

# Fields whose text should be in the requested language
TEXT_FIELDS = {
    "pronunciation_feedback": ["feedback", "recommendations"],
    "generate_challenge": ["targetPhrase", "explanation"],
    "interactive_coach": ["reply"],
    "academic_report": ["summary", "strengths", "closingMessage"],
    "oratory_live_prompt": ["contentSummary", "speakingGuidance", "bodyLanguageTip"],
    "oratory_debrief": ["summaryJudgement", "strengths", "areasForImprovement", "awardedBadge"],
}

# Expected statuses for the standard pronunciation test reading
EXPECTED_PRONUNCIATION = {
    "ذَهَبَ": ("correct",),
    "الطَّالِبُ": ("correct",),
    "إِلَى": ("omitted",),
    "الْمَدْرَسَةِ": ("correct",),
    "صَبَاحًا": ("mispronounced",),
}


def bare(word) -> str:
    """Letters only: no vowel marks, hamza seats / ta marbuta / alif maqsura unified."""
    w = re.sub(r"[\u064B-\u0652\u0670\u0640]", "", str(word or ""))
    for a, b in (("أ", "ا"), ("إ", "ا"), ("آ", "ا"), ("ٱ", "ا"), ("ة", "ه"), ("ى", "ي")):
        w = w.replace(a, b)
    return w.strip()

SCORE_FIELDS = ["overallScore", "vocalVarietyScore", "bodyLanguageScore", "structureAndLogicScore",
                "lexicalScore", "convictionScore", "brevityScore"]


def type_ok(value, kind) -> bool:
    if kind == STR:
        return isinstance(value, str) and value.strip() != ""
    if kind == NUM:
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    if kind == LIST:
        return isinstance(value, list)
    if kind == DICT:
        return isinstance(value, dict)
    return True


def check_reply(task: str, body: dict, data, lang: str, engine: str) -> tuple:
    """Return (failures, warnings) lists of strings."""
    fails, warns = [], []
    if not isinstance(data, dict):
        return [f"reply is not a JSON object ({type(data).__name__})"], warns

    for key, kind in REQUIRED[task].items():
        if key not in data:
            fails.append(f"missing '{key}'")
        elif not type_ok(data[key], kind):
            fails.append(f"'{key}' should be a non-empty {kind}, got {json.dumps(data[key], ensure_ascii=False)[:60]}")

    for key in SCORE_FIELDS:
        v = data.get(key)
        if isinstance(v, (int, float)) and not (0 <= v <= 100):
            fails.append(f"'{key}'={v} is outside 0-100")

    if task == "pronunciation_feedback" and isinstance(data.get("corrections"), list):
        bad = [c for c in data["corrections"]
               if not isinstance(c, dict) or c.get("status") not in ("correct", "mispronounced", "omitted")
               or not c.get("word") or not c.get("note")]
        if bad:
            fails.append(f"{len(bad)} correction(s) missing word/note or with an invalid status")
        flagged = [c for c in data["corrections"] if isinstance(c, dict) and c.get("status") != "correct"]
        if flagged:
            warns.append("info: flagged " + ", ".join(f"{c.get('word')}={c.get('status')}" for c in flagged))
        # Content check for the standard test reading: 'إِلَى' skipped, 'صَبَاحًا' read as 'سباحا',
        # the other three words read correctly (without vowel marks, as browser ASR delivers them).
        if body.get("targetText") == build_requests("ar")["pronunciation_feedback"]["targetText"]:
            status = {bare(c.get("word")): c.get("status") for c in data["corrections"] if isinstance(c, dict)}
            for word, want in EXPECTED_PRONUNCIATION.items():
                got = status.get(bare(word))
                if got is None:
                    fails.append(f"'{word}' is missing from corrections")
                elif got not in want:
                    fails.append(f"'{word}' marked '{got}', expected {' or '.join(want)}"
                                 + (" (missing vowel marks in the transcript are not mistakes)" if "correct" in want else ""))
            score = data.get("overallScore")
            if isinstance(score, (int, float)) and len(flagged) >= 2 and score > 90:
                warns.append(f"overallScore {score} looks too high for {len(flagged)} flagged words")

    if task == "academic_report" and isinstance(data.get("actionPlan"), list):
        if any(not isinstance(i, dict) or not i.get("subject") or not i.get("advice") for i in data["actionPlan"]):
            fails.append("actionPlan items need 'subject' and 'advice'")

    if task == "generate_challenge" and lang == "ar" and isinstance(data.get("targetPhrase"), str):
        if not HARAKAT_RE.search(data["targetPhrase"]):
            warns.append("targetPhrase has no diacritics (تشكيل), which the prompt asks for")

    want_ar = (body.get("language") == "ar")
    for key in TEXT_FIELDS[task]:
        value = data.get(key)
        texts = value if isinstance(value, list) else [value]
        texts = [t for t in texts if isinstance(t, str) and t.strip()]
        if not texts:
            continue
        not_ar = [t for t in texts if not ARABIC_RE.search(t)]
        if want_ar and not_ar:
            fails.append(f"'{key}' is not in Arabic: {short(not_ar[0], 60)}")
        if not want_ar and task != "generate_challenge" and any(ARABIC_RE.search(t) for t in texts):
            fails.append(f"'{key}' contains Arabic but English was requested")

    if engine != "offline_fallback":
        if data.get("offline_fallback") or (fallback_response is not None and data == fallback_response(task, body)):
            fails.append("this is the offline fallback reply, not a model reply")

    return fails, warns


# ---------------------------------------------------------------------------
# HTTP
# ---------------------------------------------------------------------------

def http_json(method: str, url: str, payload=None, timeout: float = 180):
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method,
                                 headers={"Content-Type": "application/json"} if data else {})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8") or "null")
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", "replace")
        try:
            return exc.code, json.loads(raw)
        except json.JSONDecodeError:
            return exc.code, raw


def read_env_summary() -> dict:
    """Non-secret settings from backend/.env, for the report header."""
    out = {}
    env = BACKEND_DIR / ".env"
    if not env.exists():
        return out
    for line in env.read_text(encoding="utf-8", errors="replace").splitlines():
        m = re.match(r"\s*(LLM_PROVIDER|LLM_BASE_URL|LLM_MODEL|PRACTICE_AI_ENGINE|PRONUNCIATION_ENGINE|AUDIO_PROVIDER|AUDIO_MODELS|ASR_BASE_URL)\s*=\s*(.*)", line)
        if m:
            out[m.group(1)] = m.group(2).strip().strip('"').strip("'")
        m = re.match(r"\s*(AUDIO_API_KEY|GEMINI_API_KEY|LLM_API_KEY)\s*=\s*(.*)", line)
        if m:
            out[m.group(1)] = "set" if m.group(2).strip().strip('"\'') else "empty"
    return out


def short(value, n=110) -> str:
    s = value if isinstance(value, str) else json.dumps(value, ensure_ascii=False)
    s = " ".join(s.split())
    return s if len(s) <= n else s[: n - 1] + "…"


PREVIEW = {
    "pronunciation_feedback": "feedback",
    "generate_challenge": "targetPhrase",
    "interactive_coach": "reply",
    "academic_report": "summary",
    "oratory_live_prompt": "speakingGuidance",
    "oratory_debrief": "summaryJudgement",
}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--base-url", default="http://localhost:8000", help="backend URL (default %(default)s)")
    ap.add_argument("--tasks", nargs="+", choices=list(REQUIRED), help="only run these tasks")
    ap.add_argument("--lang", choices=["ar", "en"], default="ar", help="language for the non-pronunciation tasks")
    ap.add_argument("--label", default="", help="name for this run, e.g. the model (shown in the report)")
    ap.add_argument("--out", help="write full replies to this JSON file")
    ap.add_argument("--show", action="store_true", help="print each full JSON reply")
    ap.add_argument("--tts", action="store_true", help="also test /api/tts and save the clip next to --out")
    ap.add_argument("--timeout", type=float, default=180, help="seconds per request (default %(default)s)")
    args = ap.parse_args()
    base = args.base_url.rstrip("/")

    # ---- header -----------------------------------------------------------
    try:
        status, health = http_json("GET", f"{base}/api/health", timeout=10)
    except Exception as exc:
        print(f"✗ Cannot reach the backend at {base}: {exc}\n  Start it first: uvicorn app.main:app --port 8000")
        return 1
    engine = health.get("practice_ai_engine", "unknown") if isinstance(health, dict) else "unknown"
    env = read_env_summary()

    print("=" * 78)
    print(f"Practice AI smoke test {('— ' + args.label) if args.label else ''}")
    print(f"backend: {base}   engine: {engine}   audio model configured: "
          f"{health.get('audio_configured', health.get('gemini_configured')) if isinstance(health, dict) else '?'}"
          f"   pronunciation: {(health.get('pronunciation_engine') or {}).get('with_recording', '?') if isinstance(health, dict) else '?'}")
    llm = health.get("llm") if isinstance(health, dict) else None
    if isinstance(llm, dict):
        print(f"server is using: provider={llm.get('provider')}  model={llm.get('model')}  "
              f"base_url={llm.get('base_url')}")
    if env:
        print("backend/.env: " + "  ".join(f"{k}={v}" for k, v in env.items()))
    if isinstance(llm, dict) and env.get("LLM_MODEL") and llm.get("model") != env["LLM_MODEL"]:
        print(f"⚠ The server is running model '{llm.get('model')}' but backend/.env now says "
              f"'{env['LLM_MODEL']}'.\n  The backend reads .env only at startup – restart it to switch models.")
    if args.label and isinstance(llm, dict) and llm.get("model") and args.label not in llm["model"]:
        print(f"⚠ Label '{args.label}' doesn't match the model the server is using ({llm.get('model')}).")
    if engine == "offline_fallback":
        print("⚠ No AI engine is configured, so every reply will be the offline fallback.")
    if "practice_ai_engine" not in (health or {}):
        print("⚠ /api/health has no 'practice_ai_engine' – is this the ilqaa-platform backend?")
    print("=" * 78)

    # ---- tasks ------------------------------------------------------------
    requests_ = build_requests(args.lang)
    tasks = args.tasks or list(REQUIRED)
    results, n_fail = {}, 0

    for task in tasks:
        body = requests_[task]
        t0 = time.monotonic()
        try:
            status, data = http_json("POST", f"{base}/api/analyze", body, timeout=args.timeout)
        except Exception as exc:
            status, data = 0, f"request failed: {exc}"
        secs = time.monotonic() - t0

        if status != 200:
            fails, warns = [f"HTTP {status}: {short(data, 300)}"], []
        else:
            fails, warns = check_reply(task, body, data, args.lang, engine)

        n_fail += bool(fails)
        mark = "✗ FAIL" if fails else "✓ PASS"
        print(f"\n{mark}  {task:<24} {secs:6.1f}s")
        if status == 200 and isinstance(data, dict):
            preview = data.get(PREVIEW[task])
            if preview:
                print(f"        {PREVIEW[task]}: {short(preview)}")
            scores = {k: data[k] for k in SCORE_FIELDS if k in data}
            if scores:
                print("        scores: " + ", ".join(f"{k}={v}" for k, v in scores.items()))
        for f in fails:
            print(f"        ✗ {f}")
        for w in warns:
            print(f"        {'·' if w.startswith('info:') else '⚠'} {w.removeprefix('info: ')}")
        if args.show and status == 200:
            print(json.dumps(data, ensure_ascii=False, indent=2))
        results[task] = {"status": status, "seconds": round(secs, 1), "fails": fails, "warnings": warns,
                         "request": body, "reply": data}

    # ---- TTS --------------------------------------------------------------
    if args.tts:
        text = "مرحباً بكم في منصة إلقاء"
        url = f"{base}/api/tts?" + urllib.parse.urlencode({"text": text, "lang": "ar", "voice": "Charon"})
        t0 = time.monotonic()
        try:
            with urllib.request.urlopen(url, timeout=args.timeout) as resp:
                audio, ctype, code = resp.read(), resp.headers.get("Content-Type", ""), resp.status
        except urllib.error.HTTPError as exc:
            audio, ctype, code = exc.read(), "", exc.code
        except Exception as exc:
            audio, ctype, code = b"", "", f"error {exc}"
        secs = time.monotonic() - t0
        ok = code == 200 and len(audio) > 1000 and ("wav" in ctype or "mpeg" in ctype)
        n_fail += not ok
        source = "Gemini voice" if "wav" in ctype else "Google Translate fallback voice" if "mpeg" in ctype else "?"
        print(f"\n{'✓ PASS' if ok else '✗ FAIL'}  {'tts':<24} {secs:6.1f}s   HTTP {code}, {ctype or '-'}, "
              f"{len(audio)} bytes ({source})")
        if not ok and audio:
            print(f"        ✗ {short(audio.decode('utf-8', 'replace'), 300)}")
        if ok:
            clip = Path(args.out).with_suffix(".wav" if "wav" in ctype else ".mp3") if args.out \
                else Path("tts-sample.wav" if "wav" in ctype else "tts-sample.mp3")
            clip.write_bytes(audio)
            print(f"        saved {clip}")
        results["tts"] = {"status": code, "seconds": round(secs, 1), "content_type": ctype, "bytes": len(audio)}

    # ---- summary ----------------------------------------------------------
    total = len(tasks) + (1 if args.tts else 0)
    print("\n" + "=" * 78)
    print(f"{total - n_fail}/{total} passed" + (f" — {args.label}" if args.label else ""))
    if args.out:
        Path(args.out).write_text(json.dumps({"label": args.label, "engine": engine, "env": env,
                                              "results": results}, ensure_ascii=False, indent=2),
                                  encoding="utf-8")
        print(f"full replies written to {args.out}")
    return 1 if n_fail else 0


if __name__ == "__main__":
    sys.exit(main())
