"""
Offline fallback responses for the practice / oratory tasks.

Used when no AI provider is configured, so the student-facing features keep
working. This is a faithful port of ``handleFallbackTask`` from ILQAA-LAB's
``server.ts`` – the output shapes and wording are unchanged.

Note: apart from ``pronunciation_feedback`` (which does a real word-by-word
comparison of the transcript against the target text), these responses are
canned demo content, not an analysis of the student's performance.
"""

import math
import re
from typing import Any, Dict, List, Optional

_PUNCT_RE = re.compile(r"[.,/#!$%\^&*;:{}=\-_`~()؟?،\"']")
_HARAKAT_RE = re.compile(r"[ً-ٰٟـ]")
_ENDING_VOWEL_RE = re.compile(r"[ً-ْ]$")
_IMPERFECT_VERB_RE = re.compile(r"^(ي|ت|ن|أ)[a-zA-Z؀-ۿ]")

_PREPOSITIONS = ["في", "الي", "على", "من", "عن", "ب", "ل", "ك"]

_VOWEL_NAMES = {
    "َ": "الفتحة",
    "ُ": "الضمة",
    "ِ": "الكسرة",
    "ْ": "السكون",
    "ً": "تنوين الفتح",
    "ٌ": "تنوين الضم",
    "ٍ": "تنوين الكسر",
}

# (char heard, char expected, description)
_PHONETIC_DISTORTIONS = [
    ("س", "ص", "إبدال صوتي: نطق السين المرققة بدلاً من الصاد المفخمة المستعلية."),
    ("ص", "س", "إبدال صوتي: نطق الصاد بدلاً من السين."),
    ("ت", "ط", "إبدال صوتي: ترقيق الطاء لتنطق تاءً."),
    ("ط", "ت", "إبدال صوتي: تفخيم التاء لتنطق طاءً."),
    ("ك", "ق", "إبدال صوتي: تقديم مخرج القاف لتنطق كافاً."),
    ("ق", "ك", "إبدال صوتي: نطق الكاف قافاً."),
    ("د", "ض", "إبدال صوتي: إبدال الضاد دالاً مفخمة وفقدان استطالة الضاد العربية."),
    ("ظ", "ذ", "إبدال صوتي: ترقيق الظاء لتنطق ذالاً."),
]


def _js_round(x: float) -> int:
    """Math.round semantics (half rounds up), unlike Python's banker's rounding."""
    return int(math.floor(x + 0.5))


def _clean_str(s: str) -> str:
    return _PUNCT_RE.sub("", s.lower()).strip()


def _strip_harakat(s: str) -> str:
    return _HARAKAT_RE.sub("", s)


def _clean_ar(s: str) -> str:
    s = _strip_harakat(s)
    s = re.sub(r"[أإآءئؤ]", "ا", s)
    s = s.replace("ة", "ه")
    return re.sub(r"[ىي]", "ي", s)


def _ending_vowel(word: str) -> str:
    m = _ENDING_VOWEL_RE.search(word)
    return m.group(0) if m else ""


def _infer_arabic_grammar(word: str, index: int, total: int, prev_word: Optional[str]) -> Dict[str, str]:
    bare = _clean_ar(word)
    prev_bare = _clean_ar(prev_word) if prev_word else ""
    has_definite_article = word.startswith(("ال", "الْ", "الشَّ", "الرَّ"))

    if prev_bare and prev_bare in _PREPOSITIONS:
        return {
            "i_rab": "اسم مجرور بحرف الجر وعلامة جره الكسرة الظاهرة تحت آخره",
            "phoneticRule": "تحقيق كسر الحرف الأخير مع الترقيق السليم للمخرج",
        }

    if index == 0:
        if _IMPERFECT_VERB_RE.search(bare) and not has_definite_article and len(bare) >= 4:
            return {
                "i_rab": "فعل مضارع مرفوع وعلامة رفعه الضمة الظاهرة على آخره",
                "phoneticRule": "ضم حرف المضارعة أو فتحه بحسب وزن الفعل وتحقيق مخرج الحرف",
            }
        if bare.endswith("ت") or len(bare) == 3 or bare.startswith(("استغفر", "احسن", "علم")):
            return {
                "i_rab": "فعل ماضٍ مبني على الفتح الظاهر على آخره",
                "phoneticRule": "فتح الحرف الأخير وثبات المخرج الصوتي دون إمالة",
            }
        return {
            "i_rab": "مبتدأ مرفوع وعلامة رفعه الضمة الظاهرة على آخره",
            "phoneticRule": "مراعاة حكم اللام (شمسية مدغمة أو قمرية مظهرة)" if has_definite_article
            else "تمكين التنوين أو الضمة",
        }

    if index == 1 and prev_bare:
        return {
            "i_rab": "فاعل مرفوع وعلامة رفعه الضمة الظاهرة على آخره",
            "phoneticRule": "تحقيق ضم الحرف الأخير دلالة على الفاعلية وتمكين مخرج الحرف",
        }

    if index == 2 and total >= 3:
        return {
            "i_rab": "مفعول به منصوب وعلامة نصبه الفتحة الظاهرة على آخره",
            "phoneticRule": "نصب الحرف الأخير بالفتحة الظاهرة ومراعاة الفصاحة",
        }

    if index == 1 and total == 2:
        return {
            "i_rab": "خبر المبتدأ مرفوع وعلامة رفعه الضمة الظاهرة (أو تنوين الضم)",
            "phoneticRule": "إتمام الضم أو التنوين دون زيادة مد زائد",
        }

    if "ً" in word or bare.endswith("ا"):
        return {
            "i_rab": "حال أو مفعول لأجله منصوب وعلامة نصبه الفتحة أو تنوين الفتح",
            "phoneticRule": "تحقيق رنين التنوين دون تشويه النون الساكنة المنطوقة",
        }

    return {
        "i_rab": "متمم الجملة / مضاف إليه أو نعت تابع لما قبله، ويجوز الوقف عليه بالسكون"
        if index == total - 1 else "كلمة معربة بحسب موقعها التركيبي في سياق الجملة",
        "phoneticRule": "استيفاء مخارج الحروف والصفات الصوتية وضبط الحركة",
    }


def _pronunciation_feedback(body: Dict[str, Any], is_ar: bool, grade: str) -> Dict[str, Any]:
    target_words = (body.get("targetText") or "").split()
    spoken_words = (body.get("text") or "").split()

    error_count = 0
    spoken_idx = 0
    corrections: List[Dict[str, Any]] = []

    for idx, target_word in enumerate(target_words):
        norm_target = _clean_ar(_clean_str(target_word))
        grammar = _infer_arabic_grammar(target_word, idx, len(target_words),
                                        target_words[idx - 1] if idx > 0 else None)
        target_ending = _ending_vowel(target_word)

        candidate = spoken_words[spoken_idx] if spoken_idx < len(spoken_words) else ""
        found_idx = -1

        # Closest spoken match within a 2-word lookahead
        for offset in range(3):
            c_idx = spoken_idx + offset
            if c_idx < len(spoken_words):
                norm_c = _clean_ar(_clean_str(spoken_words[c_idx]))
                if norm_c == norm_target or norm_target in norm_c or norm_c in norm_target:
                    found_idx = c_idx
                    candidate = spoken_words[c_idx]
                    spoken_idx = c_idx + 1
                    break

        if found_idx == -1:
            error_count += 1
            corrections.append({
                "word": target_word,
                "spokenWord": "—",
                "status": "omitted",
                "i_rab": grammar["i_rab"],
                "errorReason": "إسقاط الكلمة: لم يتم رصد الكلمة في التسجيل الصوتي." if is_ar else "Word omitted from speech.",
                "phoneticRule": grammar["phoneticRule"],
                "note": f"سقطت كلمة ({target_word}) من القراءة. يجب استيفاء جميع كلمات النص." if is_ar else "Word was missed.",
            })
            continue

        norm_candidate = _clean_ar(_clean_str(candidate))
        candidate_ending = _ending_vowel(candidate)

        # 1. Ending-vowel (i'rab) mismatch, when the transcript carries diacritics
        if target_ending and candidate_ending and target_ending != candidate_ending:
            error_count += 1
            heard = _VOWEL_NAMES.get(candidate_ending, "حركة أخرى")
            expected = _VOWEL_NAMES.get(target_ending, "الحركة المعيارية")
            corrections.append({
                "word": target_word,
                "spokenWord": candidate,
                "status": "mispronounced",
                "i_rab": grammar["i_rab"],
                "errorReason": f"لحن إعرابي في حركة آخر الكلمة: نُطقت بـ ({heard}) وحقها الإعرابي ({expected}) وفق المعيار الوزاري."
                if is_ar else f"Syntactic inflection error: pronounced with {heard} instead of {expected}.",
                "phoneticRule": grammar["phoneticRule"],
                "note": f"لحن إعرابي: الموقع الإعرابي هو ({grammar['i_rab']})، مما يستوجب الضبط بـ ({expected})."
                if is_ar else "Grammatical inflection mismatch.",
            })
            continue

        # 2. Consonant substitution (e.g. س for ص)
        phonetic_reason = ""
        if norm_candidate != norm_target and len(norm_candidate) == len(norm_target):
            for heard_char, expected_char, desc in _PHONETIC_DISTORTIONS:
                if heard_char in norm_candidate and expected_char in norm_target:
                    phonetic_reason = desc
                    break

        if phonetic_reason:
            error_count += 1
            corrections.append({
                "word": target_word,
                "spokenWord": candidate,
                "status": "mispronounced",
                "i_rab": grammar["i_rab"],
                "errorReason": phonetic_reason if is_ar else "Phonetic articulation mismatch.",
                "phoneticRule": grammar["phoneticRule"],
                "note": f"تنبيه لمخارج الحروف: {phonetic_reason} يرجى التدرب على مخرج الحرف المستهدف."
                if is_ar else "Articulated wrong consonant.",
            })
            continue

        # 3. Match
        corrections.append({
            "word": target_word,
            "spokenWord": candidate,
            "status": "correct",
            "i_rab": grammar["i_rab"],
            "errorReason": None,
            "phoneticRule": grammar["phoneticRule"],
            "note": f"نطق فصيح ومتقن مطابق للمعيار الوزاري؛ {grammar['i_rab']}."
            if is_ar else f"Flawlessly articulated '{target_word}' according to MoEHE standards.",
        })

    total_words = len(target_words) or 1
    score = 100
    if error_count > 0:
        score = max(25, _js_round((total_words - error_count) / total_words * 100))

    if is_ar:
        if score >= 95:
            feedback = (f"قراءة فصيحة ومتقنة بمستوى ممتاز لطالب {grade}! التزام تام بمخارج الحروف الصحيحة "
                        f"والضبط الإعرابي المعتمد في مناهج وزارة التربية والتعليم بدولة قطر.")
        elif score >= 75:
            feedback = (f"أداء طيب لطالب {grade} بنسبة إتقان {score}%. معظم الكلمات نُطقت بفصاحة مع وجود ملاحظات "
                        f"دقيقة في ضبط أواخر الكلمات أو مخارج الحروف كما هو مبين بجدول التدقيق.")
        else:
            feedback = (f"تم رصد ملاحظات في الضبط الإعرابي ومخارج بعض الحروف (نسبة الإتقان {score}%). "
                        f"يُنصح بمراجعة مواقع الكلمات الإعرابية وإعادة الاستماع إلى النموذج الفصيح.")
    else:
        feedback = (f"Eloquent and precise articulation for {grade} ({score}%). Complies with Qatari educational standards."
                    if score >= 90 else
                    f"Performance scored {score}%. Specific syntax and pronunciation corrections recommended below.")

    return {
        "overallScore": score,
        "evaluationMethod": "linguistic_transcript",
        "feedback": feedback,
        "grammaticalSummary": "الجملة مضبوطة ضبطاً نحوياً كاملاً وفق المناهج القطرية: تميز بين الفاعل والمفعول وحروف الجر ومكملات الجملة."
        if is_ar else "Standard grammatical sentence structure parsed according to Qatari curriculum.",
        "corrections": corrections,
        "recommendations": [
            "مراعاة الضبط الإعرابي السليم لحركات أواخر الكلمات (الرفع بالضمة، النصب بالفتحة، الجر بالكسرة).",
            "إعطاء كل حرف حقه ومستحقه من المخارج والصفات الصوتية (كالاستعلاء والترقيق والهمس والجهر).",
            "الاستفادة من ميزة الاستماع للنموذج الصوتي الفصيح بالمنصة لتثبيت النغم اللغوي الصحيح.",
        ] if is_ar else [
            "Observe accurate terminal vowel inflections (I'rab) for nominative, accusative, and genitive cases.",
            "Articulate consonants with standard resonance and correct point of articulation.",
            "Compare student audio with the platform's master acoustic reference model.",
        ],
    }


def _generate_challenge(body: Dict[str, Any], is_ar: bool, grade: str) -> Dict[str, Any]:
    standard_name = body.get("standardName") or "الفصاحة ومخارج الحروف"
    phrase = (f"يَقْرَأُ طَالِبُ {grade} النُّصُوصَ المَعْيَارِيَّةَ بِفَصَاحَةٍ وَإِتْقَانٍ تَامٍّ" if is_ar
              else f"A {grade} student articulates national standard phrases with precision and eloquence")
    return {
        "targetPhrase": phrase,
        "explanation": f"تحدي تدريبي لقياس مهارة ({standard_name}) وضبط أواخر الكلم بالحركات الإعرابية."
        if is_ar else f"Custom practice targeting {standard_name} with complete diacritics.",
        "focusTips": ["إخراج الحروف من مخارجها الصحيحة (الحلق، اللسان، الشفتين)", "مراعاة الضبط النحوي السليم"]
        if is_ar else ["Clear articulation of vowels and consonants", "Balanced rhythm and intonation"],
        "phrase": phrase,
        "tip": "تدريب على فصاحة النطق وضبط الحركات الإعرابية" if is_ar else "Practice speech articulation",
    }


def _interactive_coach(body: Dict[str, Any], is_ar: bool, grade: str) -> Dict[str, Any]:
    q = body.get("userQuestion") or body.get("question") or ""
    reply = (f"أهلاً بك! بخصوص سؤالك: \"{q}\"، في المنهاج الوطني القطري نحرص على إخراج الحروف من مخارجها الدقيقة "
             f"(كالحلق للهمزة والهاء، وأقصى اللسان للقاف والكاف). تدرب على نطق الكلمة مجزأة إلى مقاطع صوتية مع مد "
             f"الحركات ثم دمجها بانسيابية." if is_ar else
             f"Regarding your question: \"{q}\", focus on steady vocal projection and distinct phoneme separation. "
             f"Segment the word into syllables first, then pronounce it smoothly.")
    return {"reply": reply, "answer": reply, "suggestedPracticeWord": "الْمُسْتَقْبَلُ" if is_ar else "Future"}


def _academic_report(body: Dict[str, Any], is_ar: bool, grade: str) -> Dict[str, Any]:
    return {
        "summary": f"يُظهر الطالب تقدماً لافتاً في معايير اللغة العربية والخطابة للصف {grade}. يتميز بطلاقة لغوية ومخارج "
                   f"حروف واضحة، مع التزام عالٍ بالمعايير الوطنية لوزارة التربية والتعليم والتعليم العالي بدولة قطر."
        if is_ar else f"The student demonstrates outstanding progress in Arabic and speech articulation for {grade}, "
                      f"showing confident delivery and adherence to national curriculum standards.",
        "strengths": [
            "سلامة مخارج الحروف الشفهية والحلقية بنسبة إتقان تتجاوز 90%.",
            "الثقة العالية في مواجهة الجمهور والوقفة المنبرية المتزنة.",
            "توظيف سليم للحركات الإعرابية في الكلمات المشكولة.",
        ] if is_ar else [
            "Flawless articulation of complex phonemes (90%+).",
            "High confidence and poised stage presence.",
            "Strong command of grammatical cases and rhythm.",
        ],
        "actionPlan": [
            {
                "subject": "الإلقاء والخطابة" if is_ar else "Public Speaking",
                "advice": "مواصلة التدرب على تنويع طبقات الصوت والنبر المناسب للمعنى." if is_ar
                else "Practice vocal range modulation.",
            },
            {
                "subject": "النحو والضبط الإعرابي" if is_ar else "Grammar & Syntax",
                "advice": "قراءة نصوص غير مشكولة وتشكيل أواخر الكلمات شفهياً." if is_ar
                else "Practice oral syntax case vocalization.",
            },
        ],
        "closingMessage": "أداء يدعو للفخر ومستقبل واعد في المحافل والمنابر الوطنية! بارك الله في هذه الجهود المخلصة."
        if is_ar else "Proud of these accomplishments! A promising orator in the making.",
    }


def _oratory_live_prompt(body: Dict[str, Any], is_ar: bool, grade: str) -> Dict[str, Any]:
    return {
        "contentSummary": "الحديث يركز على أهمية ريادة الأعمال والابتكار التكنولوجي لتمكين الشباب القطري."
        if is_ar else "Speech emphasizes entrepreneurship and tech innovation for youth empowerment.",
        "speakingGuidance": "انتقل إلى توضيح أثر ذلك بالأرقام أو بذكر مثال واقعي، واختم بنبرة حماسية تحفز الجمهور."
        if is_ar else "Provide a concrete real-world example and build momentum toward your conclusion.",
        "bodyLanguageTip": "افتح يديك بتوازن لتوكيد الشمولية، وحافظ على مسح بصري متزن للجمهور."
        if is_ar else "Use open hand gestures to convey inclusion and maintain balanced eye contact.",
        "sentiment": "إيجابي" if is_ar else "Positive",
        "lexicalScore": 88,
    }


def _oratory_debrief(body: Dict[str, Any], is_ar: bool, grade: str) -> Dict[str, Any]:
    def _get(key: str, default: Any) -> Any:
        value = body.get(key)
        return default if value is None else value

    wpm = _get("wpm", 120)
    filler_count = _get("fillerCount", 1)
    eye_contact = _get("eyeContactPercent", 95)
    conviction = _get("convictionScore", 91)
    return {
        "overallScore": 94,
        "vocalVarietyScore": 91,
        "bodyLanguageScore": 95,
        "structureAndLogicScore": 93,
        "convictionScore": conviction,
        "rhetoricalPauses": 4,
        "brevityScore": 88,
        "triad": {"logos": 88, "ethos": 92, "pathos": 82},
        "strengths": [
            f"تواصل بصري استثنائي وثبات عالي أمام الكاميرا ({eye_contact}%).",
            f"سرعة حديث متزنة ومناسبة للإلقاء المنبري ({wpm} كلمة/دقيقة).",
            "فصاحة الكلمات واستخدام معجم لغوي ثري وراقي.",
        ] if is_ar else [
            f"Exceptional continuous eye contact ({eye_contact}%).",
            f"Well-regulated oratory pacing ({wpm} WPM).",
            "Rich vocabulary and clear phonetic articulation.",
        ],
        "areasForImprovement": [
            f"تقليل الوقفات الحشوية (تم رصد {filler_count} كلمة حشوية فقط).",
            "استثمار لغة الجسد لتوكيد النقاط الرئيسية باليدين.",
        ] if is_ar else [
            f"Minimize filler pauses (only {filler_count} detected).",
            "Integrate dynamic gestures at climax moments.",
        ],
        "summaryJudgement": "أداء خطابي متميز يُظهر تمكناً لغوياً وثقة عالية أمام الجمهور، يعكس تدريباً متقناً على معايير الخطابة القطرية."
        if is_ar else "Outstanding public speaking performance demonstrating poise, rhetorical maturity, "
                      "and mastery of Qatar national speech standards.",
        "awardedBadge": "خطيب المنبر المتميز 🏆" if is_ar else "Master Orator 🏆",
    }


_HANDLERS = {
    "pronunciation_feedback": _pronunciation_feedback,
    "generate_challenge": _generate_challenge,
    "interactive_coach": _interactive_coach,
    "academic_report": _academic_report,
    "oratory_live_prompt": _oratory_live_prompt,
    "oratory_debrief": _oratory_debrief,
}


def fallback_response(task: str, body: Dict[str, Any]) -> Dict[str, Any]:
    """Return the offline response for ``task`` (same shapes as the AI responses)."""
    language = body.get("language") or "ar"
    grade = body.get("grade") or "Grade 5"
    if task == "diacritize_script":           # no AI available: hand the text back unchanged
        return {"vowelizedText": body.get("text") or "", "notes": "", "wordsChanged": False}
    handler = _HANDLERS.get(task)
    if handler is None:
        return {"status": "success", "message": "Processed"}
    return handler(body, language == "ar", grade)
