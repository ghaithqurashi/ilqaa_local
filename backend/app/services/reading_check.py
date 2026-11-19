"""
Read-aloud check from a vowelized transcript.

The vowelized ASR (Cohere-Speech-Tashkeel-2B) writes what the student said *with* short vowels;
``arabic_diff`` compares it with the vowelized reference. This module turns that comparison into

* a per-word table (status + the errors found in each word) that the LLM must respect,
* a deterministic score, so the same reading always gets the same mark,
* a compact Arabic summary for the LLM prompt, which then explains the errors (i'rab, makhraj).
"""

from typing import Any, Dict, List

from app.services.arabic_diff import align_words, diff_reading, match_pausal_alif, parse

ERROR_LABEL_AR = {
    "word_omitted": "كلمة لم تُقرأ",
    "word_inserted": "كلمة زائدة",
    "wrong_word": "كلمة مختلفة",
    "letter_error": "خطأ في حرف (إبدال/حذف/زيادة)",
    "ending_vowel": "لحن في حركة الإعراب (آخر الكلمة)",
    "internal_vowel": "خطأ في حركة داخل الكلمة (ضبط البنية)",
    "shadda": "خطأ في الشدة",
    "ending_dropped": "تسكين آخر الكلمة في وسط الكلام (ترك الإعراب)",
}

# Points deducted per error (in line with the scoring rules in the pronunciation prompt)
PENALTY = {
    "ending_vowel": 10, "ending_dropped": 8, "internal_vowel": 6, "shadda": 5,
    "letter_error": 8, "wrong_word": 12, "word_omitted": 12, "word_inserted": 4,
}


def check_reading(reference: str, transcript: str) -> Dict[str, Any]:
    ref_words, hyp_words = parse(reference), parse(transcript)
    result = diff_reading(reference, transcript)

    # what the student said for each reference word, from the same alignment the diff uses
    spoken = {}
    for ri, hi in align_words(ref_words, hyp_words):
        if ri is not None and hi is not None:
            spoken[ri] = match_pausal_alif(ref_words[ri], hyp_words[hi]).text

    by_word: Dict[int, List[Dict[str, Any]]] = {}
    inserted = []
    for e in result.errors:
        item = {"type": e.type, "label": ERROR_LABEL_AR.get(e.type, e.type), "detail": e.detail}
        if e.type == "word_inserted":
            inserted.append({"beforeWordIndex": e.ref_index, "word": e.hyp_word, **item})
        else:
            by_word.setdefault(e.ref_index, []).append(item)

    words = []
    for i, w in enumerate(ref_words):
        errs = by_word.get(i, [])
        status = ("omitted" if any(x["type"] == "word_omitted" for x in errs)
                  else "mispronounced" if errs else "correct")
        words.append({"index": i, "word": w.text, "spokenWord": spoken.get(i, ""), "status": status,
                      "errors": errs})

    penalty = sum(PENALTY.get(e.type, 5) for e in result.errors)
    judged, unmarked = result.judged_letters, result.unmarked_letters
    return {
        "transcript": transcript,
        "words": words,
        "insertedWords": inserted,
        "errorCount": len(result.errors),
        "score": max(0, min(100, 100 - penalty)),
        "pausalEndingsAccepted": result.pausal_endings,
        # share of vowel marks the ASR actually wrote where the reference has one
        "vowelCoverage": round(judged / (judged + unmarked), 2) if (judged + unmarked) else None,
        "referenceHasVowels": any(l.vowel for w in ref_words for l in w.letters),
    }


def summary_for_prompt(check: Dict[str, Any]) -> str:
    """The comparison as short Arabic lines for the LLM."""
    lines = []
    for w in check["words"]:
        if w["status"] == "correct":
            lines.append(f"{w['index'] + 1}. {w['word']} ← نُطقت: {w['spokenWord']} ✓ صحيحة")
        elif w["status"] == "omitted":
            lines.append(f"{w['index'] + 1}. {w['word']} ← لم تُقرأ ✗")
        else:
            details = "؛ ".join(f"{e['label']}: {e['detail']}" for e in w["errors"])
            lines.append(f"{w['index'] + 1}. {w['word']} ← نُطقت: {w['spokenWord']} ✗ {details}")
    for x in check["insertedWords"]:
        lines.append(f"• زيادة قبل الكلمة رقم {x['beforeWordIndex'] + 1}: {x['word']}")
    return "\n".join(lines)
