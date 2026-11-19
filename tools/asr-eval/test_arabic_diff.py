"""Self-checks for arabic_diff.py and sentences.json.   Run:  python test_arabic_diff.py"""

import json
import sys
from pathlib import Path

# Windows: when output is redirected (file, pipe, some IDE consoles) Python uses the legacy code page
# and crashes on the emoji / Arabic this code prints. Force UTF-8 output on every platform.
for _stream in (sys.stdout, sys.stderr):
    try:
        if (getattr(_stream, "encoding", "") or "").lower().replace("-", "") != "utf8":
            _stream.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from arabic_diff import diff_reading, parse, rates, strip_diacritics, transcription_counts

HERE = Path(__file__).resolve().parent
failures = 0


def check(cond, msg):
    global failures
    if not cond:
        failures += 1
    print(("  ok   " if cond else "  FAIL ") + msg)


def types(reference, reading):
    return sorted(e.type for e in diff_reading(reference, reading).errors)


print("Planted-error variants in sentences.json produce exactly the expected errors:")
items = json.loads((HERE / "sentences.json").read_text(encoding="utf-8"))["items"]
n_variants = 0
for item in items:
    for v in item["variants"]:
        n_variants += 1
        got = types(item["reference"], v["read_as"])
        check(got == sorted(v["expect"]), f"{item['id']}/{v['id']}: expected {v['expect']}, got {got}")

S1 = "ذَهَبَ الطَّالِبُ إِلَى الْمَدْرَسَةِ صَبَاحًا."
print("\nPausal forms (waqf) at the end are accepted:")
check(types(S1, "ذَهَبَ الطَّالِبُ إِلَى الْمَدْرَسَةِ صَبَاحْ") == [], "صَبَاحْ (sukun) at the end")
check(types(S1, "ذَهَبَ الطَّالِبُ إِلَى الْمَدْرَسَةِ صَبَاحَا") == [], "صَبَاحَا (fatha + alif) at the end")
check(types(S1, "ذَهَبَ الطَّالِبُ إِلَى الْمَدْرَسَةِ صَبَاحُ") == ["ending_vowel"], "صَبَاحُ (wrong vowel) at the end is still an error")
check(types("مَنْ جَدَّ وَجَدَ، وَمَنْ زَرَعَ حَصَدَ.", "مَنْ جَدَّ وَجَدْ، وَمَنْ زَرَعَ حَصَدْ") == [], "sukun at a comma and at the end")
check(types(S1, "ذَهَبْ الطَّالِبُ إِلَى الْمَدْرَسَةِ صَبَاحًا") == ["ending_dropped"], "sukun mid-sentence -> ending_dropped")
check(types(S1, "ذَهَبْ، الطَّالِبُ إِلَى الْمَدْرَسَةِ صَبَاحًا") == [], "…unless the transcript shows a pause there (comma)")
check(types("سَافَرَ أَبِي إِلَى الدَّوْحَةِ بِالطَّائِرَةِ.", "سَافَرَ أَبِي إِلَى الدَّوْحَةْ") == ["word_omitted"], "pause before a skipped final word is not an extra error")
check(types(S1, "ذَهَبَ، الطَّالِبَ إِلَى الْمَدْرَسَةِ صَبَاحًا") == ["ending_vowel"], "a wrong vowel at a pause is still an error")

print("\nMissing marks are 'unmarked', not errors:")
r = diff_reading(S1, strip_diacritics(S1))
check(r.errors == [] and r.unmarked_letters > 0, f"fully unvowelled reading: {len(r.errors)} errors, {r.unmarked_letters} unmarked")
r = diff_reading(S1, "ذهب الطالب الى المدرسة سباحا")
check([e.type for e in r.errors] == ["letter_error"] and "ص→س" in r.errors[0].detail, "unvowelled ص→س still detected")

print("\nSpelling variants are normalised:")
check(types("تَشْرَبُ كُوبًا", "تَشْرَبُ كُوباً") == [], "tanween written on the alif (كوباً)")
check(types("جَدَّ", "جَدَّ") == [], "shadda+fatha vs fatha+shadda order (جَدَّ)")
check(types("جَدَّ", "جَدَ") == ["shadda"], "…and a dropped shadda is still caught")
check(types("يُضِيءُ", "يُضِيئُ") == [], "hamza seat ء/ئ")
check(types("إِلَى الْمَدْرَسَةِ", "اِلَى الْمَدْرَسَةِ") == [], "hamza on alif أ/إ/ا")
check(types("الْمَدْرَسَةِ", "المَدرَسَهِ") == [], "ة vs ه, missing sukun")
check(types("هٰذَا", "هَذَا") == [], "dagger alif")
check(len(parse("كُوبًا")[0].letters) == 3, "alif of tanween fath is not counted as a letter")

print("\nTranscription metrics:")
c = transcription_counts(S1, S1)
m = rates(c)
check(m["WER_undiacritized"] == 0 and m["WER_diacritized"] == 0 and m["DER_all"] == 0, f"identical text: {m}")
m = rates(transcription_counts(S1, strip_diacritics(S1)))
check(m["WER_undiacritized"] == 0 and m["diacritic_coverage"] == 0 and m["DER_all"] == 100, f"unvowelled: WER {m['WER_undiacritized']}, coverage {m['diacritic_coverage']}, DER {m['DER_all']}")
m = rates(transcription_counts(S1, "ذَهَبَ الطَّالِبَ إِلَى الْمَدْرَسَةِ صَبَاحَا"))
check(m["WER_undiacritized"] == 0 and m["WER_diacritized"] == 20 and m["DER_case_endings"] > 0, f"one wrong ending: WER_d {m['WER_diacritized']}, DER_end {m['DER_case_endings']}")
m = rates(transcription_counts(S1, "ذَهَبَ الطَّالِبُ الْمَدْرَسَةِ سَبَاحًا"))
check(m["WER_undiacritized"] == 40, f"one skipped + one wrong letter word: WER {m['WER_undiacritized']}")

print(f"\n{n_variants} variants checked. {'ALL PASSED' if failures == 0 else f'{failures} FAILED'}")
sys.exit(1 if failures else 0)
