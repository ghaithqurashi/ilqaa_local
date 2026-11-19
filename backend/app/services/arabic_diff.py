"""
Compare vowelized (diacritized) Arabic text against a vowelized reference.
Used by the read-aloud check in the backend (app/api/practice.py, PRONUNCIATION_ENGINE=asr)
and by the ASR benchmark (tools/asr-eval). The ASR writes down what the student actually
said, *with* vowels, and this module finds the differences deterministically.

Error types (``Error.type``):

    word_omitted     a reference word was not read
    word_inserted    an extra word was read
    wrong_word       a different word was read (letters mostly different)
    letter_error     a letter was replaced / dropped / added (e.g. ص -> س)
    ending_vowel     wrong final vowel (i'rab / case ending), e.g. الطَّالِبَ for الطَّالِبُ
    internal_vowel   wrong short vowel inside the word
    shadda           missing or extra gemination (shadda)
    ending_dropped   final vowel replaced by sukun in the middle of a sentence

Pausal forms (الوقف) are allowed where the reference has punctuation, at the
end of the text, or where the transcript shows the reader paused (punctuation
in the ASR output, or the end of what was read): a sukun or no vowel on the
last letter, or ـَا for tanween fath, is not an error there. A *wrong* vowel is
still an error at a pause.

Letters the transcript leaves completely unmarked are counted as "unmarked"
(coverage), not as errors.

Normalisation: hamza seats are merged (أ إ آ ٱ -> ا, ؤ ئ -> ء), ة -> ه, ى -> ي;
tatweel, dagger alif and Quranic annotation marks are dropped. So this does not
judge hamza or alif-maqsura spelling.
"""

from __future__ import annotations

import difflib
import re
import unicodedata
from collections import Counter
from dataclasses import dataclass, field, asdict
from typing import Dict, List, Optional, Sequence, Tuple

FATHATAN, DAMMATAN, KASRATAN = "ً", "ٌ", "ٍ"
FATHA, DAMMA, KASRA, SHADDA, SUKUN = "َ", "ُ", "ِ", "ّ", "ْ"

VOWEL_OF = {FATHA: "a", DAMMA: "u", KASRA: "i", FATHATAN: "an", DAMMATAN: "un", KASRATAN: "in", SUKUN: "0"}
REAL_VOWELS = {"a", "u", "i", "an", "un", "in"}
VOWEL_NAME_AR = {"a": "فتحة", "u": "ضمة", "i": "كسرة", "an": "تنوين فتح", "un": "تنوين ضم",
                 "in": "تنوين كسر", "0": "سكون", None: "بلا حركة"}

_OPEN_TANWEEN = {"ࣰ": FATHATAN, "ࣱ": DAMMATAN, "ࣲ": KASRATAN}
_DROP_RE = re.compile("[ـٰٕٖٓٔ-ٟۖ-ۭ]")
_SKELETON = {"أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا", "ة": "ه", "ى": "ي", "ؤ": "ء", "ئ": "ء"}
_PAUSE_PUNCT = set(".،,؛;:!?؟…—-\n")

# Commonly confused pairs (expected -> heard), used only to label letter errors
CONFUSIONS = {
    ("ص", "س"): "ص→س (ترقيق الصاد)", ("س", "ص"): "س→ص",
    ("ض", "د"): "ض→د", ("ض", "ظ"): "ض→ظ", ("ظ", "ض"): "ظ→ض",
    ("ط", "ت"): "ط→ت (ترقيق الطاء)", ("ت", "ط"): "ت→ط",
    ("ق", "ك"): "ق→ك", ("ق", "ء"): "ق→ء", ("ق", "ا"): "ق→ء",
    ("ظ", "ذ"): "ظ→ذ", ("ظ", "ز"): "ظ→ز", ("ذ", "ز"): "ذ→ز", ("ذ", "د"): "ذ→د",
    ("ث", "س"): "ث→س", ("ث", "ت"): "ث→ت",
    ("ح", "ه"): "ح→ه", ("ع", "ء"): "ع→ء", ("ع", "ا"): "ع→ء", ("غ", "ق"): "غ→ق",
}


def _is_letter(ch: str) -> bool:
    o = ord(ch)
    return 0x0621 <= o <= 0x063A or 0x0641 <= o <= 0x064A or o == 0x0671


@dataclass
class Letter:
    char: str
    vowel: Optional[str] = None   # a u i an un in 0  (None = no mark)
    shadda: bool = False

    @property
    def base(self) -> str:
        return _SKELETON.get(self.char, self.char)

    @property
    def marked(self) -> bool:
        return self.vowel is not None or self.shadda


@dataclass
class Word:
    letters: List[Letter]
    pause_after: bool = False

    @property
    def skeleton(self) -> str:
        return "".join(l.base for l in self.letters)

    @property
    def text(self) -> str:
        inv = {v: k for k, v in VOWEL_OF.items()}
        out = []
        for l in self.letters:
            out.append(l.char + (SHADDA if l.shadda else "") + (inv[l.vowel] if l.vowel else ""))
        last = self.letters[-1] if self.letters else None
        if last is not None and last.vowel == "an" and last.char not in "ةءى":
            out.append("ا")
        return "".join(out)


@dataclass
class Error:
    type: str
    ref_index: int                 # index of the reference word (insertions: index of the next ref word)
    ref_word: str = ""
    hyp_word: str = ""
    letter_index: Optional[int] = None
    expected: Optional[str] = None
    got: Optional[str] = None
    detail: str = ""

    @property
    def key(self) -> Tuple[int, str]:
        return (self.ref_index, self.type)

    def to_dict(self) -> dict:
        return asdict(self)


# ---------------------------------------------------------------------------
# Parsing
# ---------------------------------------------------------------------------

def normalize(text: str) -> str:
    text = unicodedata.normalize("NFC", text or "")
    for k, v in _OPEN_TANWEEN.items():
        text = text.replace(k, v)
    return _DROP_RE.sub("", text)


def parse(text: str) -> List[Word]:
    """Split vowelized text into words of letters with their marks."""
    words: List[Word] = []
    current: List[Letter] = []

    def flush():
        nonlocal current
        if current:
            letters = _fix_tanween_alif(current)
            # the alif after tanween fath (ـًا) is spelling only: drop it so كُوبًا / كُوبٌ share a skeleton
            if len(letters) >= 2 and letters[-1].base == "ا" and letters[-1].vowel is None \
                    and not letters[-1].shadda and letters[-2].vowel == "an":
                letters = letters[:-1]
            words.append(Word(letters))
            current = []

    for ch in normalize(text):
        if _is_letter(ch):
            current.append(Letter(ch))
        elif ch == SHADDA:
            if current:
                current[-1].shadda = True
        elif ch in VOWEL_OF:
            if current:
                current[-1].vowel = VOWEL_OF[ch]
        else:
            flush()
            if ch in _PAUSE_PUNCT and words:
                words[-1].pause_after = True
    flush()
    if words:
        words[-1].pause_after = True
    return words


def _fix_tanween_alif(letters: List[Letter]) -> List[Letter]:
    """'كتاباً' (tanween written on the alif) -> 'كتابًا' (on the letter before)."""
    for i in range(1, len(letters)):
        l, prev = letters[i], letters[i - 1]
        if l.base == "ا" and l.vowel == "an" and prev.vowel in (None, "a"):
            prev.vowel, l.vowel = "an", None
    return letters


def strip_diacritics(text: str) -> str:
    return " ".join(w.skeleton for w in parse(text))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _silent(v: Optional[str]) -> Optional[str]:
    return None if v in (None, "0") else v


def ending_index(word: Word) -> Optional[int]:
    """Index of the letter carrying the case ending, or None (word ends in a long vowel / sukun)."""
    n = len(word.letters)
    if n == 0:
        return None
    return n - 1 if word.letters[-1].vowel in REAL_VOWELS else None


def match_pausal_alif(rw: Word, hw: Word) -> Word:
    """صَبَاحًا read with a pause is written صَبَاحَا (or صباحا): drop that alif so the words line up."""
    if (rw.letters and rw.letters[-1].vowel == "an" and len(hw.letters) == len(rw.letters) + 1
            and hw.letters[-1].base == "ا" and not hw.letters[-1].marked
            and hw.letters[-2].vowel in (None, "a", "an")):
        return Word(hw.letters[:-1], hw.pause_after)
    return hw


def _pausal_ok(ref: Letter, hyp: Letter, word: Word, idx: int) -> bool:
    """Is hyp's ending an acceptable pausal (waqf) form of ref's ending?"""
    if hyp.vowel in (None, "0"):
        return True
    if ref.vowel == "an" and hyp.vowel == "a":     # كُوبًا -> كُوبَا at a pause
        return True
    return False


def _ratio(a: str, b: str) -> float:
    if not a and not b:
        return 1.0
    return difflib.SequenceMatcher(None, a, b, autojunk=False).ratio()


def align_words(ref: Sequence[Word], hyp: Sequence[Word]) -> List[Tuple[Optional[int], Optional[int]]]:
    """Edit-distance alignment on word skeletons; similar words pair up as substitutions."""
    n, m = len(ref), len(hyp)
    INF = float("inf")
    dp = [[INF] * (m + 1) for _ in range(n + 1)]
    bt = [[None] * (m + 1) for _ in range(n + 1)]
    dp[0][0] = 0.0
    for i in range(n + 1):
        for j in range(m + 1):
            if i == 0 and j == 0:
                continue
            best, move = INF, None
            if i > 0 and j > 0:
                r, h = ref[i - 1].skeleton, hyp[j - 1].skeleton
                sub = 0.0 if r == h else 2.0 * (1.0 - _ratio(r, h)) + 0.01
                if dp[i - 1][j - 1] + sub < best:
                    best, move = dp[i - 1][j - 1] + sub, "sub"
            if i > 0 and dp[i - 1][j] + 1.0 < best:
                best, move = dp[i - 1][j] + 1.0, "del"
            if j > 0 and dp[i][j - 1] + 1.0 < best:
                best, move = dp[i][j - 1] + 1.0, "ins"
            dp[i][j], bt[i][j] = best, move
    pairs: List[Tuple[Optional[int], Optional[int]]] = []
    i, j = n, m
    while i > 0 or j > 0:
        move = bt[i][j]
        if move == "sub":
            pairs.append((i - 1, j - 1)); i, j = i - 1, j - 1
        elif move == "del":
            pairs.append((i - 1, None)); i -= 1
        else:
            pairs.append((None, j - 1)); j -= 1
    pairs.reverse()
    return pairs


def _levenshtein(a: Sequence, b: Sequence) -> int:
    prev = list(range(len(b) + 1))
    for i, x in enumerate(a, 1):
        cur = [i] + [0] * len(b)
        for j, y in enumerate(b, 1):
            cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x != y))
        prev = cur
    return prev[-1]


# ---------------------------------------------------------------------------
# Error detection (reading vs reference)
# ---------------------------------------------------------------------------

@dataclass
class DiffResult:
    errors: List[Error] = field(default_factory=list)
    unmarked_letters: int = 0      # letters the transcript left without any mark
    judged_letters: int = 0        # letters whose marks could be compared
    pausal_endings: int = 0        # endings accepted as waqf


def _compare_letters(ri: int, rw: Word, hw: Word, res: DiffResult) -> None:
    """Same skeleton: compare vowels and shadda letter by letter."""
    end = ending_index(rw)
    for k, (r, h) in enumerate(zip(rw.letters, hw.letters)):
        is_end = (k == end)
        if not r.marked:          # the reference doesn't specify this letter's vowel: nothing to judge
            continue
        # vowel
        if not h.marked and (r.vowel in REAL_VOWELS or r.shadda):
            res.unmarked_letters += 1
            continue
        res.judged_letters += 1
        if is_end and (rw.pause_after or hw.pause_after) and r.vowel in REAL_VOWELS and _pausal_ok(r, h, rw, k):
            if _silent(h.vowel) != _silent(r.vowel):
                res.pausal_endings += 1
        elif _silent(r.vowel) != _silent(h.vowel):
            if h.vowel is None:                   # has shadda but no vowel: treat as unmarked vowel
                res.unmarked_letters += 1
            else:
                if is_end and h.vowel == "0" and r.vowel in REAL_VOWELS:
                    etype = "ending_dropped"
                else:
                    etype = "ending_vowel" if is_end else "internal_vowel"
                res.errors.append(Error(
                    etype, ri, rw.text, hw.text, k, r.vowel, h.vowel,
                    f"{r.char}: {VOWEL_NAME_AR.get(h.vowel)} بدل {VOWEL_NAME_AR.get(r.vowel)}"))
        # shadda (only judged when the letter carries some mark in the transcript)
        if r.shadda != h.shadda and h.marked:
            res.errors.append(Error(
                "shadda", ri, rw.text, hw.text, k, "shadda" if r.shadda else "none",
                "shadda" if h.shadda else "none",
                f"{r.char}: {'سقوط الشدة' if r.shadda else 'شدة زائدة'}"))


def _compare_skeletons(ri: int, rw: Word, hw: Word, res: DiffResult) -> None:
    """Different skeletons: letter errors (plus vowel checks on the matching parts)."""
    rs, hs = rw.skeleton, hw.skeleton
    if _ratio(rs, hs) < 0.5:
        res.errors.append(Error("wrong_word", ri, rw.text, hw.text, detail=f"{rw.text} → {hw.text}"))
        return
    sm = difflib.SequenceMatcher(None, rs, hs, autojunk=False)
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal":
            continue
        if op == "replace" and (i2 - i1) == (j2 - j1):
            for a, b in zip(range(i1, i2), range(j1, j2)):
                exp, got = rs[a], hs[b]
                res.errors.append(Error("letter_error", ri, rw.text, hw.text, a, exp, got,
                                        CONFUSIONS.get((exp, got), f"{exp}→{got}")))
        else:
            exp, got = rs[i1:i2], hs[j1:j2]
            what = "حذف" if op == "delete" else "زيادة" if op == "insert" else "تحريف"
            res.errors.append(Error("letter_error", ri, rw.text, hw.text, i1, exp or None, got or None,
                                    f"{what}: {exp or '∅'}→{got or '∅'}"))


def diff_reading(reference: str, reading: str) -> DiffResult:
    """Find the errors in ``reading`` (vowelized) relative to ``reference`` (vowelized)."""
    ref, hyp = parse(reference), parse(reading)
    res = DiffResult()
    next_ref = 0
    for ri, hi in align_words(ref, hyp):
        if ri is not None and hi is None:
            res.errors.append(Error("word_omitted", ri, ref[ri].text, "", detail=f"لم تُقرأ: {ref[ri].text}"))
        elif ri is None and hi is not None:
            res.errors.append(Error("word_inserted", next_ref, "", hyp[hi].text, detail=f"زيادة: {hyp[hi].text}"))
        else:
            rw, hw = ref[ri], match_pausal_alif(ref[ri], hyp[hi])
            if rw.skeleton == hw.skeleton:
                _compare_letters(ri, rw, hw, res)
            else:
                _compare_skeletons(ri, rw, hw, res)
        if ri is not None:
            next_ref = ri + 1
    return res


# ---------------------------------------------------------------------------
# Transcription accuracy (transcript vs what was actually said)
# ---------------------------------------------------------------------------

def _word_equal_diac(rw: Word, hw: Word) -> bool:
    if rw.skeleton != hw.skeleton:
        return False
    end = ending_index(rw)
    for k, (r, h) in enumerate(zip(rw.letters, hw.letters)):
        if not r.marked:
            continue
        if k == end and (rw.pause_after or hw.pause_after) and r.vowel in REAL_VOWELS and _pausal_ok(r, h, rw, k):
            continue
        if _silent(r.vowel) != _silent(h.vowel) or r.shadda != h.shadda:
            return False
    return True


def transcription_counts(said: str, transcript: str) -> Dict[str, int]:
    """Raw counts for WER/CER/DER of ``transcript`` against the vowelized text that was ``said``."""
    ref, hyp = parse(said), parse(transcript)
    c = Counter()
    c["words"] = len(ref)
    c["chars"] = sum(len(w.skeleton) for w in ref)
    c["word_err_undiac"] = c["word_err_diac"] = c["char_err"] = 0
    matched: List[Tuple[Word, Word]] = []
    for ri, hi in align_words(ref, hyp):
        if hi is None:                                   # deletion
            c["word_err_undiac"] += 1; c["word_err_diac"] += 1; c["char_err"] += len(ref[ri].skeleton)
        elif ri is None:                                 # insertion
            c["word_err_undiac"] += 1; c["word_err_diac"] += 1; c["char_err"] += len(hyp[hi].skeleton)
        else:
            rw, hw = ref[ri], match_pausal_alif(ref[ri], hyp[hi])
            if rw.skeleton != hw.skeleton:
                c["word_err_undiac"] += 1; c["word_err_diac"] += 1
                c["char_err"] += _levenshtein(rw.skeleton, hw.skeleton)
            else:
                matched.append((rw, hw))
                if not _word_equal_diac(rw, hw):
                    c["word_err_diac"] += 1

    # DER on letters of correctly recognised words
    for rw, hw in matched:
        end = ending_index(rw)
        for k, (r, h) in enumerate(zip(rw.letters, hw.letters)):
            if not (r.vowel in REAL_VOWELS or r.shadda):
                continue
            is_end = (k == end)
            if is_end and (rw.pause_after or hw.pause_after) and _pausal_ok(r, h, rw, k):
                c["pausal_skipped"] += 1
                continue
            part = "end" if is_end else "int"
            c[f"marks_{part}"] += 1
            if not h.marked:
                c["unmarked"] += 1
                c[f"err_{part}"] += 1          # strict DER counts a missing mark as an error
                continue
            if _silent(r.vowel) != _silent(h.vowel) or r.shadda != h.shadda:
                c[f"err_{part}"] += 1
                c[f"err_marked_{part}"] += 1
    return dict(c)


def rates(c: Dict[str, int]) -> Dict[str, Optional[float]]:
    """Turn summed counts into percentages."""
    def pct(a, b):
        return round(100.0 * a / b, 2) if b else None
    marks = c.get("marks_int", 0) + c.get("marks_end", 0)
    errs = c.get("err_int", 0) + c.get("err_end", 0)
    marked_errs = c.get("err_marked_int", 0) + c.get("err_marked_end", 0)
    return {
        "WER_undiacritized": pct(c.get("word_err_undiac", 0), c.get("words", 0)),
        "WER_diacritized": pct(c.get("word_err_diac", 0), c.get("words", 0)),
        "CER": pct(c.get("char_err", 0), c.get("chars", 0)),
        "DER_all": pct(errs, marks),
        "DER_word_internal": pct(c.get("err_int", 0), c.get("marks_int", 0)),
        "DER_case_endings": pct(c.get("err_end", 0), c.get("marks_end", 0)),
        "DER_marked_only": pct(marked_errs, marks - c.get("unmarked", 0)),
        "diacritic_coverage": pct(marks - c.get("unmarked", 0), marks),
    }
