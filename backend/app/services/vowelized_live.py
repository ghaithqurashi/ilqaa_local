"""
Live vowel check for the speaking stage: Tashkeel-ASR on each spoken sentence while the speech goes on.

The /ws/audio stream already carries 16 kHz float32 PCM. ``LiveVowelizer`` keeps the last minute of
it, cuts a segment at every pause (energy-based; a case ending is the last vowel of a word, so cuts
must never fall inside a word), and a single worker sends each segment to the vowelized ASR
(``asr_client``, e.g. Cohere-Speech-Tashkeel-2B via tools/asr-eval/serve_asr.py).

For every segment the client gets a ``vowelized_segment`` message, about a second after the pause:

* with a prepared script: the segment is located in the script and compared with it letter by
  letter (``arabic_diff``) – skipped words, wrong letters, case endings, inner vowels, shadda;
* free speech: the vowelized text; every few segments the text LLM reviews the i'rab and the
  client gets a ``vowel_review`` message with the clear mistakes it found.

A segment where Tashkeel and Speechmatics disagree on the words themselves is marked ``uncertain``
and not judged – one of the two recognisers misheard, and a wrong verdict is worse than none.

As the *primary* live transcriber (LIVE_TRANSCRIBER=asr, no Speechmatics) each segment's text is
also handed to ``on_transcript`` for the live transcript and the speaking metrics; segments are then
never dropped (the transcript must be complete) and there is no cross-check.
``summary()`` gives the totals for the end-of-session evaluation.
"""

import asyncio
import base64
import io
import logging
import re
import time
import wave
from collections import Counter, deque
from dataclasses import dataclass, field
from difflib import SequenceMatcher
from typing import Any, Awaitable, Callable, Deque, Dict, List, Optional, Tuple

import numpy as np

from app.clients import asr_client
from app.services.arabic_diff import parse
from app.services.reading_check import ERROR_LABEL_AR, check_reading

logger = logging.getLogger(__name__)

SR = 16000
FRAME = 480                      # 30 ms
PAD_S = 0.25                     # audio kept before/after the speech in a segment
PAUSE_S = 0.45                   # silence that ends a segment
MIN_SEGMENT_S = 1.0              # shorter speech before a pause is merged with the next
MIN_KEEP_S = 0.5                 # ...unless followed by a long silence; below this it is dropped
LONG_SILENCE_S = 2.0
MAX_SEGMENT_S = 15.0             # longer speech is cut at its quietest point
BUFFER_S = 60.0                  # audio kept in memory
MAX_QUEUE = 3                    # segments waiting for the ASR; older ones are dropped beyond this
MAX_QUEUE_PRIMARY = 1000         # as the live transcriber: lag instead of losing sentences
SM_WAIT_S = 2.5                  # how long to wait for Speechmatics' words of a segment
AGREEMENT_MIN = 0.6              # word-level similarity Tashkeel vs Speechmatics to judge a segment
SCRIPT_MATCH_MIN = 0.5           # similarity to accept a script passage as what was being read
REVIEW_EVERY = 3                 # free speech: segments per LLM i'rab review
MAX_ASR_FAILURES = 3


def has_vowels(text: str) -> bool:
    """True when the text is (mostly) vowelized – at least a third of its letters carry a mark."""
    words = parse(text or "")
    letters = [l for w in words for l in w.letters]
    if not letters:
        return False
    return sum(1 for l in letters if l.vowel or l.shadda) / len(letters) >= 0.33


_SPELLING = str.maketrans({"أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا", "ى": "ي", "ة": "ه", "ؤ": "و", "ئ": "ي", "ء": ""})


def _skeleton_words(text: str) -> List[str]:
    """Words without vowels, spelling variants unified (Speechmatics writes ان/الى where Tashkeel writes إِنَّ/إِلَى)."""
    return [k for k in (_norm_skeleton(w.skeleton) for w in parse(text or "")) if k]


def _norm_skeleton(skeleton: str) -> str:
    k = skeleton.translate(_SPELLING)
    # the alif of tanween al-fath (صَبَاحًا) is a mark for arabic_diff but a letter in plain text
    return k[:-1] if len(k) >= 3 and k.endswith("ا") else k


def _similarity(a: List[str], b: List[str]) -> float:
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a, b, autojunk=False).ratio()


_VOWEL_MARKS = re.compile(r"[\u064B-\u0652\u0670\u0640]")


def plain_text(text: str) -> str:
    """Remove the vowel marks only – spelling (إ، ة، ى، tanween alif) stays as written."""
    return " ".join(_VOWEL_MARKS.sub("", text or "").split())


def _wav_b64(pcm: np.ndarray) -> str:
    pcm16 = (np.clip(pcm, -1.0, 1.0) * 32767).astype("<i2")
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm16.tobytes())
    return base64.b64encode(buf.getvalue()).decode()


@dataclass
class Segment:
    id: int
    start: float                 # seconds from the start of the stream (same clock as Speechmatics)
    end: float
    queued_at: float = field(default_factory=time.monotonic)


class Script:
    """The prepared text, as words, with a reading position that follows the speaker."""

    def __init__(self, text: str):
        self.words = parse(text)
        self.skeletons = [_norm_skeleton(w.skeleton) for w in self.words]
        self.pointer = 0
        self.read = [False] * len(self.words)

    def locate(self, spoken_skeletons: List[str]) -> Tuple[Optional[int], Optional[int], float]:
        """Best-matching script passage [start, end) near the current position, and its similarity."""
        n = len(spoken_skeletons)
        if not n or not self.words:
            return None, None, 0.0
        best = (None, None, 0.0)
        for s in range(max(0, self.pointer - 10), min(len(self.words), self.pointer + 60)):
            for length in range(max(1, n - 3), n + 4):
                e = min(len(self.words), s + length)
                score = _similarity(spoken_skeletons, self.skeletons[s:e])
                if score > best[2]:
                    best = (s, e, score)
            if best[2] > 0.95:
                break
        return best

    def passage(self, start: int, end: int) -> str:
        return " ".join(w.text for w in self.words[start:end])

    def mark_read(self, start: int, end: int) -> None:
        for i in range(start, end):
            self.read[i] = True
        self.pointer = max(self.pointer, end)

    def coverage(self) -> Dict[str, Any]:
        total = len(self.words)
        done = sum(self.read)
        skipped, run = [], []
        for i in range(min(self.pointer, total)):          # unread passages before where the speaker got to
            if not self.read[i]:
                run.append(i)
            elif run:
                if len(run) >= 4:
                    skipped.append(" ".join(self.words[j].text for j in run))
                run = []
        if len(run) >= 4:
            skipped.append(" ".join(self.words[j].text for j in run))
        return {"words": total, "wordsRead": done, "coveragePercent": round(100 * done / total) if total else 0,
                "reachedPercent": round(100 * min(self.pointer, total) / total) if total else 0,
                "skippedPassages": skipped[:5]}


class LiveVowelizer:
    def __init__(self, send: Callable[[Dict[str, Any]], Awaitable[None]], language: str = "ar",
                 review: Optional[Callable[[List[Dict[str, Any]]], Awaitable[List[Dict[str, Any]]]]] = None):
        self.enabled = asr_client.is_configured() and language == "ar"
        self.primary = False
        self.on_transcript: Optional[Callable[[str, float, float], None]] = None
        self.send = send
        self.review_fn = review if review is not None else _llm_review
        self.script: Optional[Script] = None

        # audio
        self._buf = np.zeros(0, dtype=np.float32)
        self._buf_offset = 0                       # sample index of _buf[0]
        self._total = 0                            # samples received
        self._frame_rest = np.zeros(0, dtype=np.float32)
        self._floor: Optional[float] = None       # background-noise level: drops fast, rises slowly
        self._recent: Deque[Tuple[float, float]] = deque(maxlen=170)   # (frame end s, rms), ~5 s
        self._seg_start: Optional[float] = None
        self._last_voice: Optional[float] = None
        self._next_id = 1

        # speechmatics finals (start, end, text)
        self._sm: List[Tuple[float, float, str]] = []

        # processing
        self._queue: "asyncio.Queue[Optional[Segment]]" = asyncio.Queue()
        self._worker: Optional[asyncio.Task] = None
        self._review_tasks: List[asyncio.Task] = []
        self._pending_review: List[Dict[str, Any]] = []
        self._failures = 0

        # results
        self.segments: List[Dict[str, Any]] = []
        self.review_issues: List[Dict[str, Any]] = []
        self.dropped = 0
        self.asr_seconds: List[float] = []
        self.last_error: Optional[str] = None

    # ------------------------------------------------------------------ setup

    def set_script(self, text: str) -> Dict[str, Any]:
        text = (text or "").strip()
        self.script = Script(text) if text else None
        info = {"status": "vowel_status", "state": "ready" if self.enabled else "off",
                "script": bool(self.script), "scriptWords": len(self.script.words) if self.script else 0,
                "scriptHasVowels": has_vowels(text) if text else False}
        if self.script and not info["scriptHasVowels"]:
            info["message"] = "The script has few vowel marks – only skipped words and wrong letters can be checked."
        return info

    def set_primary(self, on_transcript: Callable[[str, float, float], None]) -> None:
        """Make the vowelized ASR the live transcriber: ``on_transcript(plain_text, start, end)`` per sentence."""
        self.primary = True
        self.on_transcript = on_transcript

    def start(self) -> None:
        if self.enabled and self._worker is None:
            self._worker = asyncio.create_task(self._run())

    # ------------------------------------------------------------------ input

    def add_speechmatics_final(self, text: str, start: float, end: float) -> None:
        if text and end > 0:
            self._sm.append((float(start), float(end), text))
            if len(self._sm) > 400:
                self._sm = self._sm[-300:]

    def feed(self, pcm: np.ndarray) -> None:
        """Called with every audio chunk from the browser."""
        if not self.enabled:
            return
        pcm = pcm.astype(np.float32, copy=False)
        self._buf = np.concatenate([self._buf, pcm])
        self._total += len(pcm)
        excess = len(self._buf) - int(BUFFER_S * SR)
        if excess > 0:
            self._buf = self._buf[excess:]
            self._buf_offset += excess

        frames = np.concatenate([self._frame_rest, pcm])
        n = len(frames) // FRAME
        first_sample = self._total - len(frames)
        for i in range(n):
            f = frames[i * FRAME:(i + 1) * FRAME]
            t_end = (first_sample + (i + 1) * FRAME) / SR
            self._on_frame(float(np.sqrt(np.mean(f * f))), t_end)
        self._frame_rest = frames[n * FRAME:]

    def _on_frame(self, rms: float, t_end: float) -> None:
        # noise floor: follows quiet frames at once, creeps up ~6 %/s otherwise, so a long sentence
        # can't raise it to speech level (that would make speech look like silence)
        if self._floor is None or rms < self._floor:
            self._floor = max(rms, 1e-4)
        else:
            self._floor *= 1.002
        self._recent.append((t_end, rms))
        voiced = rms > max(0.008, self._floor * 3.0)
        t_start = t_end - FRAME / SR

        if self._seg_start is None:
            if voiced:
                self._seg_start = max(0.0, t_start - PAD_S)
                self._last_voice = t_end
            return

        if voiced:
            self._last_voice = t_end
        silence = t_end - (self._last_voice or t_end)
        speech = (self._last_voice or t_end) - self._seg_start

        if silence >= PAUSE_S and speech >= MIN_SEGMENT_S:
            self._emit(self._seg_start, self._last_voice + PAD_S)
        elif silence >= LONG_SILENCE_S:
            if speech >= MIN_KEEP_S:
                self._emit(self._seg_start, self._last_voice + PAD_S)
            else:
                self._seg_start = self._last_voice = None      # a click or a breath
        elif t_end - self._seg_start >= MAX_SEGMENT_S:
            window = [(t, r) for t, r in self._recent if t > t_end - 4.0]
            cut = min(window, key=lambda x: x[1])[0] if window else t_end
            self._emit(self._seg_start, cut, keep_going=True)

    def _emit(self, start: float, end: float, keep_going: bool = False) -> None:
        seg = Segment(self._next_id, round(start, 2), round(end, 2))
        self._next_id += 1
        if keep_going:
            self._seg_start = end
        else:
            self._seg_start = self._last_voice = None
        while self._queue.qsize() >= (MAX_QUEUE_PRIMARY if self.primary else MAX_QUEUE):   # can't keep up: drop the oldest
            try:
                old = self._queue.get_nowait()
                if old is not None:
                    self.dropped += 1
            except asyncio.QueueEmpty:
                break
        self._queue.put_nowait(seg)

    # ------------------------------------------------------------------ processing

    async def _run(self) -> None:
        while True:
            seg = await self._queue.get()
            if seg is None:
                break
            try:
                await self._process(seg)
            except Exception as exc:                              # never break the audio stream
                logger.exception("Vowel check of segment %s failed: %s", seg.id, exc)

    def _audio(self, seg: Segment) -> Optional[np.ndarray]:
        a = int(seg.start * SR) - self._buf_offset
        b = int(seg.end * SR) - self._buf_offset
        if b <= 0 or a >= len(self._buf):
            return None
        return self._buf[max(0, a):min(len(self._buf), b)].copy()

    def _speechmatics_text(self, seg: Segment) -> str:
        parts = []
        for s, e, text in self._sm:
            overlap = min(e, seg.end) - max(s, seg.start)
            if overlap > 0 and overlap >= 0.5 * max(0.01, e - s):
                parts.append(text)
        return " ".join(parts)

    async def _process(self, seg: Segment) -> None:
        audio = self._audio(seg)
        if audio is None or len(audio) < SR // 4:
            return
        if self._failures >= MAX_ASR_FAILURES and not self.primary:
            return

        started = time.monotonic()
        try:
            text = await asr_client.transcribe(_wav_b64(audio), "audio/wav", "ar")
            self._failures = 0
        except asr_client.ASRError as exc:
            self._failures += 1
            self.last_error = str(exc)
            logger.warning("Live vowel ASR failed (%d/%d): %s", self._failures, MAX_ASR_FAILURES, exc)
            if self._failures in (1, MAX_ASR_FAILURES) or (self.primary and self._failures % 10 == 0):
                await self.send({"status": "vowel_status", "state": "error" if self._failures >= MAX_ASR_FAILURES
                                 else "warning", "message": str(exc)})
            return
        self.asr_seconds.append(time.monotonic() - started)
        if not text.strip():
            return

        spoken = _skeleton_words(text)
        if self.primary:
            # this sentence IS the live transcript (plain text, like Speechmatics writes it)
            sm_text = plain_text(text)
            if self.on_transcript:
                try:
                    self.on_transcript(sm_text, seg.start, seg.end)
                except Exception as exc:
                    logger.warning("Live transcript update failed: %s", exc)
            agreement, uncertain = None, False
        else:
            # give Speechmatics a moment to deliver its words for the same time span
            deadline = time.monotonic() + SM_WAIT_S
            while time.monotonic() < deadline and not any(e >= seg.end - 0.4 for _, e, _ in self._sm[-5:]):
                await asyncio.sleep(0.2)
            sm_text = self._speechmatics_text(seg)
            agreement = _similarity(spoken, _skeleton_words(sm_text)) if sm_text else None
            uncertain = agreement is not None and agreement < AGREEMENT_MIN

        msg: Dict[str, Any] = {
            "status": "vowelized_segment", "id": seg.id, "start": seg.start, "end": seg.end,
            "text": text, "speechmaticsText": sm_text,
            "agreement": round(agreement, 2) if agreement is not None else None,
            "uncertain": uncertain, "mode": "free", "words": [], "insertedWords": [], "primary": self.primary,
            "lagSeconds": round(time.monotonic() - seg.queued_at, 1),
        }

        if self.script and not uncertain:
            s, e, score = self.script.locate(spoken)
            if s is not None and score >= SCRIPT_MATCH_MIN:
                reference = self.script.passage(s, e)
                check = check_reading(reference, text)
                self.script.mark_read(s, e)
                msg.update(mode="script", reference=reference, scriptRange=[s, e], scriptMatch=round(score, 2),
                           words=check["words"], insertedWords=check["insertedWords"],
                           vowelCoverage=check["vowelCoverage"])
            else:
                msg["mode"] = "off_script"

        self.segments.append(msg)
        await self.send(msg)

        if msg["mode"] in ("free", "off_script") and not uncertain:
            self._pending_review.append({"id": seg.id, "text": text})
            if len(self._pending_review) >= REVIEW_EVERY:
                self._start_review()

    def _start_review(self) -> None:
        batch, self._pending_review = self._pending_review, []
        if batch:
            self._review_tasks.append(asyncio.create_task(self._review(batch)))

    async def _review(self, batch: List[Dict[str, Any]]) -> None:
        try:
            issues = await self.review_fn(batch)
        except Exception as exc:
            logger.warning("Live i'rab review failed: %s", exc)
            return
        ids = {b["id"] for b in batch}
        issues = [i for i in issues if isinstance(i, dict) and i.get("segmentId") in ids and i.get("word")]
        self.review_issues.extend(issues)
        await self.send({"status": "vowel_review", "segmentIds": sorted(ids), "issues": issues})

    # ------------------------------------------------------------------ end of session

    async def close(self, timeout: float = 20.0) -> None:
        """Process the last segment and wait (bounded) for the queue and reviews to finish."""
        if not self.enabled or self._worker is None:
            return
        if self._seg_start is not None and self._last_voice is not None \
                and self._last_voice - self._seg_start >= MIN_KEEP_S:
            self._emit(self._seg_start, min(self._last_voice + PAD_S, self._total / SR))
        self._queue.put_nowait(None)
        try:
            await asyncio.wait_for(self._worker, timeout=timeout)
        except asyncio.TimeoutError:
            self._worker.cancel()
            logger.warning("Live vowel check did not finish within %.0f s", timeout)
        self._start_review()
        if self._review_tasks:
            await asyncio.wait(self._review_tasks, timeout=timeout)

    def summary(self) -> Dict[str, Any]:
        """Totals for the end-of-session evaluation."""
        if not self.enabled:
            return {"enabled": False}
        judged = [s for s in self.segments if not s["uncertain"]]
        counts: Counter = Counter()
        examples = []
        words = 0
        for s in judged:
            for w in s.get("words", []):
                words += 1
                for e in w.get("errors", []):
                    counts[e["type"]] += 1
                    if len(examples) < 8:
                        examples.append({"word": w["word"], "spoken": w.get("spokenWord", ""),
                                         "type": e["type"], "label": e["label"], "detail": e["detail"]})
            for x in s.get("insertedWords", []):
                counts["word_inserted"] += 1
        for i in self.review_issues:
            counts["irab_review"] += 1
        out = {
            "enabled": True,
            "mode": "script" if self.script else "free",
            "liveTranscriber": "asr" if self.primary else "speechmatics",
            "segments": len(self.segments),
            "judgedSegments": len(judged),
            "uncertainSegments": len(self.segments) - len(judged),
            "droppedSegments": self.dropped,
            "scriptWordsChecked": words,
            "errorsByType": {ERROR_LABEL_AR.get(k, "ملاحظة إعرابية (مراجعة آلية)" if k == "irab_review" else k): v
                             for k, v in counts.most_common()},
            "examples": examples,
            "reviewIssues": self.review_issues[:12],
            "medianAsrSeconds": round(float(np.median(self.asr_seconds)), 2) if self.asr_seconds else None,
            "error": self.last_error if self._failures >= MAX_ASR_FAILURES else None,
        }
        if self.script:
            out["script"] = self.script.coverage()
        return out


# ---------------------------------------------------------------------------
# Free speech: the text LLM reviews the i'rab of the vowelized sentences
# ---------------------------------------------------------------------------

REVIEW_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "issues": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "segmentId": {"type": "INTEGER"},
                    "word": {"type": "STRING"},
                    "correct": {"type": "STRING"},
                    "reason": {"type": "STRING"},
                },
                "required": ["segmentId", "word", "correct", "reason"],
            },
        }
    },
    "required": ["issues"],
}


async def _llm_review(batch: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    from app.api.practice import _generate, _text_engine   # late import: practice imports this package
    engine = _text_engine()
    if engine is None:
        return []
    sentences = "\n".join(f"[{b['id']}] {b['text']}" for b in batch)
    prompt = f"""أنت مدقق نحوي خبير في العربية الفصحى. الجمل التالية كتبها محرك تعرّف صوتي مُشكِّل من كلام خطيب أثناء إلقائه،
بالحركات كما نطقها (قد يكون في التفريغ نفسه أخطاء سماعية قليلة).

{sentences}

استخرج فقط أخطاء الإعراب أو الضبط الواضحة التي لا شك فيها (لحن جليّ: رفع المفعول، نصب الفاعل، جرّ ما لا يُجر، حركة بنية خاطئة في كلمة مشهورة).
- لا تعدّ تسكين آخر الجملة أو موضع الوقف خطأً (الوقف بالسكون جائز).
- لا تعدّ الأوجه الجائزة أو المختلف فيها خطأً، ولا تُخطّئ كلمة لا تعرف موقعها يقيناً.
- إن لم تجد خطأً واضحاً فأعد قائمة فارغة.
لكل خطأ: segmentId (رقم الجملة)، word (الكلمة كما نُطقت)، correct (الضبط الصحيح)، reason (السبب الإعرابي باختصار)."""
    data = await _generate(engine, prompt, language="ar", schema=REVIEW_SCHEMA, gemini_model="gemini-3.8-flash",
                           max_tokens=1500)
    return data.get("issues") or []
