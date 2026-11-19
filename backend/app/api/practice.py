"""
Practice & oratory AI tasks for the React frontend.

Ported from ILQAA-LAB's Express ``server.ts``. The HTTP contract is unchanged so
the frontend keeps calling the same URLs:

    POST /api/analyze   {"task": "<task>", ...}  -> task-specific JSON
    GET  /api/tts?text=&lang=&voice=             -> audio/wav or audio/mpeg

Tasks: pronunciation_feedback, generate_challenge, interactive_coach,
academic_report, oratory_live_prompt, oratory_debrief.

Which AI engine answers the text tasks (``PRACTICE_AI_ENGINE``):
    auto   (default) the text LLM (LLM_* settings) if configured, else the audio model, else offline fallback
    llm    always the text LLM
    audio  always the audio model (AUDIO_* settings; "gemini" is accepted as an old name)

How pronunciation feedback uses the student's recording (``PRONUNCIATION_ENGINE``):
    auto   (default) asr if a vowelized ASR is configured, else audio, else text
    asr    vowelized ASR (ASR_* settings, e.g. Cohere-Speech-Tashkeel-2B) writes what was said with its
           short vowels; app.services.reading_check compares it with the reference word by word, and
           the text LLM explains the errors found. Word statuses and the score come from the comparison.
    audio  the audio model listens to the recording itself (AUDIO_* settings)
    text   only the browser's speech-recognition transcript (no vowels) is judged
A mode that is not available falls back along asr -> audio -> text.

Text-to-speech (/api/tts) uses the audio TTS model (AUDIO_TTS_* / AUDIO_* settings), falling back to
Google Translate's voice.

With no AI engine configured, every task returns the offline fallback
(``app.services.practice_fallbacks``), as server.ts did.
"""

import asyncio
import json
import logging
import os
import re
from collections import OrderedDict
from typing import Any, Dict, List, Optional, Tuple

import aiohttp
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, PlainTextResponse, Response

from app.clients import asr_client, audio_client
from app.clients.llm_client import LLMClient, LLMProvider
from app.services.practice_fallbacks import fallback_response
from app.services.reading_check import check_reading, summary_for_prompt

logger = logging.getLogger(__name__)

router = APIRouter(tags=["practice"])

TASKS = {
    "pronunciation_feedback",
    "diacritize_script",
    "generate_challenge",
    "interactive_coach",
    "academic_report",
    "oratory_live_prompt",
    "oratory_debrief",
}

# ---------------------------------------------------------------------------
# Engine selection
# ---------------------------------------------------------------------------

def _llm_configured() -> bool:
    """True when LLMClient has what it needs (cloud providers need an API key)."""
    try:
        client = LLMClient()
    except Exception:  # pragma: no cover - defensive
        return False
    if client.provider in (LLMProvider.LM_STUDIO, LLMProvider.OLLAMA):
        return True
    key = (client.api_key or "").strip()
    return bool(key) and not key.lower().startswith("your-")


def _text_engine() -> Optional[str]:
    """'llm', 'audio' or None (offline fallback)."""
    choice = os.getenv("PRACTICE_AI_ENGINE", "auto").strip().lower()
    if choice == "llm":
        return "llm" if _llm_configured() else None
    if choice in ("audio", "gemini"):
        return "audio" if audio_client.is_configured() else None
    if _llm_configured():
        return "llm"
    if audio_client.is_configured():
        return "audio"
    return None


def _pronunciation_mode(language: str, has_audio: bool, mime: str) -> str:
    """'asr', 'audio' or 'text' for one pronunciation request (see PRONUNCIATION_ENGINE above)."""
    if not has_audio:
        return "text"
    asr_ok = asr_client.is_configured() and language == "ar"
    audio_ok = audio_client.is_configured() and audio_client.accepts_audio(mime)
    choice = os.getenv("PRONUNCIATION_ENGINE", "auto").strip().lower()
    order = {"asr": ["asr", "audio"], "audio": ["audio"], "text": []}.get(choice, ["asr", "audio"])
    for mode in order:
        if (mode == "asr" and asr_ok) or (mode == "audio" and audio_ok):
            return mode
    return "text"


def pronunciation_engine_summary() -> Dict[str, Any]:
    """What /api/health reports for pronunciation feedback (assuming an Arabic WAV recording)."""
    return {"setting": os.getenv("PRONUNCIATION_ENGINE", "auto").strip().lower() or "auto",
            "with_recording": _pronunciation_mode("ar", True, "audio/wav")}


# ---------------------------------------------------------------------------
# JSON generation helpers
# ---------------------------------------------------------------------------

def _schema_for_prompt(schema: Dict[str, Any]) -> Dict[str, Any]:
    """Gemini schema (``"type": "OBJECT"``) -> lowercase JSON-Schema style for text prompts."""
    if isinstance(schema, dict):
        return {k: (v.lower() if k == "type" and isinstance(v, str) else _schema_for_prompt(v))
                for k, v in schema.items()}
    if isinstance(schema, list):
        return [_schema_for_prompt(v) for v in schema]
    return schema


def _json_instructions(schema: Dict[str, Any]) -> str:
    return (
        "You are an assistant that answers ONLY with one valid JSON object – no markdown, no code fences, "
        "no text before or after it. Escape any double quotes inside string values.\n"
        "The JSON object must follow this JSON schema:\n"
        + json.dumps(_schema_for_prompt(schema), ensure_ascii=False)
    )


async def _llm_json(prompt: str, schema: Dict[str, Any], max_tokens: int) -> Dict[str, Any]:
    client = LLMClient()
    system_prompt = _json_instructions(schema)
    raw = await asyncio.to_thread(client.generate_response, system_prompt, prompt, max_tokens=max_tokens)
    cleaned = client._extract_and_repair_json(raw)
    result = json.loads(cleaned)
    if not isinstance(result, dict):
        raise ValueError("LLM did not return a JSON object")
    return result


def _language_rule(language: str) -> str:
    """Closing instruction so every free-text field comes back in the requested language."""
    if language == "ar":
        return ("\n\nLANGUAGE RULE (mandatory): write EVERY free-text value in the JSON – summaries, feedback, "
                "judgements, strengths, improvements, tips, advice, badge titles – in Modern Standard Arabic "
                "(العربية الفصحى). Do not write any of them in English. Keep the JSON keys exactly as in the schema.")
    return ("\n\nLANGUAGE RULE (mandatory): write EVERY free-text value in the JSON in English. "
            "Keep the JSON keys exactly as in the schema.")


async def _generate(engine: str, prompt: str, schema: Dict[str, Any], *, language: str,
                    gemini_model: Optional[str] = None, audio: Optional[Tuple[str, str]] = None,
                    max_tokens: int = 2000) -> Dict[str, Any]:
    prompt = prompt + _language_rule(language)
    if engine in ("audio", "gemini"):
        # gemini_model is only a preference for the Gemini provider; other providers use AUDIO_MODELS
        return await audio_client.generate_json(prompt, schema, json_instructions=_json_instructions(schema),
                                                audio=audio, preferred_model=gemini_model, max_tokens=max_tokens)
    return await _llm_json(prompt, schema, max_tokens)


def _lang_name(language: str) -> str:
    return "Arabic" if language == "ar" else "English"


# ---------------------------------------------------------------------------
# Schemas (Gemini format, also rendered into text prompts for the LLM)
# ---------------------------------------------------------------------------

S, I, N, A, O = "STRING", "INTEGER", "NUMBER", "ARRAY", "OBJECT"

PRONUNCIATION_SCHEMA = {
    "type": O,
    "properties": {
        "overallScore": {"type": I, "description": "A strict accuracy percentage score from 0 to 100 based on exact word matches, diacritics, and phonetic precision"},
        "evaluationMethod": {"type": S, "description": "multimodal_audio or linguistic_transcript"},
        "feedback": {"type": S, "description": "Detailed, objective diagnostic critique highlighting strengths and specific errors detected"},
        "grammaticalSummary": {"type": S, "description": "Brief grammatical parsing of the key syntactic structure"},
        "corrections": {
            "type": A,
            "items": {
                "type": O,
                "properties": {
                    "word": {"type": S, "description": "The target word with diacritics"},
                    "spokenWord": {"type": S, "description": "What was actually detected from the student"},
                    "status": {"type": S, "description": "Must be: 'correct', 'mispronounced', or 'omitted'"},
                    "i_rab": {"type": S, "description": "Detailed grammatical role and case inflection in Arabic"},
                    "errorReason": {"type": S, "description": "Specific phonetic or syntactic cause if mispronounced"},
                    "phoneticRule": {"type": S, "description": "Phonetic articulation rule or makhraj"},
                    "note": {"type": S, "description": "Detailed reason for error (سبب الخطأ) or phonetic praise with the grammatical/articulatory rule"},
                },
                "required": ["word", "status", "note"],
            },
            "description": "Sequential breakdown of each word in the target text",
        },
        "recommendations": {"type": A, "items": {"type": S}, "description": "Actionable points for the student to practice next"},
    },
    "required": ["overallScore", "feedback", "corrections", "recommendations"],
}

CHALLENGE_SCHEMA = {
    "type": O,
    "properties": {
        "targetPhrase": {"type": S, "description": "The diacritized sentence or phrase to practice"},
        "explanation": {"type": S, "description": "Brief note on why this sentence was generated and what indicator it tests"},
        "focusTips": {"type": A, "items": {"type": S}, "description": "2 phonetic or pronunciation focus tips"},
    },
    "required": ["targetPhrase", "explanation", "focusTips"],
}

COACH_SCHEMA = {
    "type": O,
    "properties": {
        "reply": {"type": S, "description": "The AI coach response text"},
        "suggestedPracticeWord": {"type": S, "description": "An optional single word to practice based on the advice"},
    },
    "required": ["reply"],
}

REPORT_SCHEMA = {
    "type": O,
    "properties": {
        "summary": {"type": S, "description": "A paragraph summarizing student's progress and efforts"},
        "strengths": {"type": A, "items": {"type": S}, "description": "Highlights and key areas of strength"},
        "actionPlan": {
            "type": A,
            "items": {
                "type": O,
                "properties": {
                    "subject": {"type": S, "description": "The subject name"},
                    "advice": {"type": S, "description": "Specific advice or classroom exercises for this subject"},
                },
                "required": ["subject", "advice"],
            },
        },
        "closingMessage": {"type": S, "description": "Encouraging concluding note to motivate the student"},
    },
    "required": ["summary", "strengths", "actionPlan", "closingMessage"],
}

LIVE_PROMPT_SCHEMA = {
    "type": O,
    "properties": {
        "contentSummary": {"type": S, "description": "Short summary of recent content"},
        "speakingGuidance": {"type": S, "description": "Next step advice for the speaker"},
        "bodyLanguageTip": {"type": S, "description": "Physical gesture or eye contact tip"},
        "sentiment": {"type": S, "description": "Detected tone/intent"},
        "lexicalScore": {"type": N, "description": "Lexical diversity score 0-100"},
    },
    "required": ["contentSummary", "speakingGuidance", "bodyLanguageTip", "sentiment", "lexicalScore"],
}

DEBRIEF_SCHEMA = {
    "type": O,
    "properties": {
        "overallScore": {"type": N},
        "vocalVarietyScore": {"type": N},
        "bodyLanguageScore": {"type": N},
        "structureAndLogicScore": {"type": N},
        "convictionScore": {"type": N},
        "rhetoricalPauses": {"type": N},
        "brevityScore": {"type": N},
        "triad": {
            "type": O,
            "properties": {"logos": {"type": N}, "ethos": {"type": N}, "pathos": {"type": N}},
            "required": ["logos", "ethos", "pathos"],
        },
        "strengths": {"type": A, "items": {"type": S}},
        "areasForImprovement": {"type": A, "items": {"type": S}},
        "summaryJudgement": {"type": S},
        "awardedBadge": {"type": S},
    },
    "required": ["overallScore", "vocalVarietyScore", "bodyLanguageScore", "structureAndLogicScore",
                 "strengths", "areasForImprovement", "summaryJudgement", "awardedBadge"],
}


def _opt(body: Dict[str, Any], key: str, default: Any) -> Any:
    """JS destructuring default: only replaces a missing/null value."""
    value = body.get(key)
    return default if value is None else value


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------

async def _pronunciation_feedback(body: Dict[str, Any], engine: str) -> Dict[str, Any]:
    language = body.get("language") or "ar"
    grade = body.get("grade") or "Grade 5"
    text = body.get("text") or ""
    target_text = body.get("targetText") or ""
    audio_b64 = body.get("audioBase64")
    audio_raw = re.sub(r"^data:[^;]+;base64,", "", audio_b64) if isinstance(audio_b64, str) else ""
    data_url_mime = re.match(r"^data:([^;,]+)", audio_b64 or "") if isinstance(audio_b64, str) else None
    audio_mime = (body.get("audioMimeType") or (data_url_mime.group(1) if data_url_mime else "") or "audio/webm")

    mode = _pronunciation_mode(language, len(audio_raw) > 200, audio_mime)
    check = None
    asr_error = None
    if mode == "asr":
        try:
            transcript = await asr_client.transcribe(audio_raw, audio_mime, language)
            if not transcript:
                raise asr_client.ASRError("the ASR returned no words")
            check = check_reading(target_text, transcript)
        except asr_client.ASRError as exc:
            asr_error = str(exc)
            mode = "audio" if (audio_client.is_configured() and audio_client.accepts_audio(audio_mime)) else "text"
            logger.warning("Vowelized ASR failed (%s) – pronunciation falls back to %s", exc, mode)

    if check is not None and engine is None:          # no text LLM: the comparison alone still grades it
        return _feedback_from_check(check, language)

    has_audio = mode == "audio"
    audio = (audio_mime, audio_raw) if has_audio else None
    if has_audio:
        engine = "audio"  # the audio model listens to the recording itself
    elif engine is None:
        return {**fallback_response("pronunciation_feedback", body), "offline_fallback": True,
                **({"asrError": asr_error} if asr_error else {})}

    standard_name = body.get("standardName") or "الفصاحة ومخارج الحروف وسلامة الضبط الإعرابي"
    standard_code = body.get("standardCode") or "معايير القراءة الجهرية"
    indicator = body.get("indicator") or "ينطق الكلمات مضبوطة بالحركات الإعرابية ومستوفية للمخارج الصوتية الصحيحة"
    spoken = (check["transcript"] if check else text) or ("(تم إرسال التسجيل الصوتي المباشر للطالب)" if has_audio else "")
    language_label = "اللغة العربية الفصحى" if language == "ar" else "English"

    if check is not None:
        coverage = check.get("vowelCoverage")
        coverage_note = ""
        if coverage is not None and coverage < 0.6:
            coverage_note = ("\nتنبيه: محرك التفريغ لم يكتب كثيراً من الحركات في هذا التسجيل، فلا تحكم على حركات "
                             "الكلمات التي لم تُرصد فيها أخطاء.")
        method_note = (
            "🎯 النص المفرغ أعلاه كتبه محرك تعرّف صوتي مُشكِّل (Vowelized ASR) استمع إلى تسجيل المتعلم الحقيقي وكتب ما "
            "نطقه بحركاته القصيرة. ثم قورن آلياً بالنص المعياري حرفاً بحرف وحركة بحركة، وهذه نتيجة المقارنة لكل كلمة:\n"
            + summary_for_prompt(check) + coverage_note + "\n\n"
            "التزم بنتيجة المقارنة: الكلمة المعلّمة ✓ صحيحة، والمعلّمة ✗ فيها الخطأ المذكور بالضبط. لا تخترع أخطاء "
            "غير مرصودة ولا تتجاهل خطأ مرصوداً. مهمتك أن تشرح كل خطأ للمتعلم: الموقع الإعرابي والعلامة الصحيحة "
            "(i_rab)، والمخرج أو القاعدة الصوتية (phoneticRule)، وسبب الخطأ (errorReason)، بترتيب كلمات النص المعياري."
        )
    elif has_audio:
        method_note = (
            "🎯 تم تزويدك بالتسجيل الصوتي الحقيقي للمتعلم مباشرة عبر ملف الصوت المرفق (Audio).\n"
            "استمع بأعلى درجات الدقة الصوتية إلى أداء المتعلم الصوتي، وحلل مخارج حروفه وصفاتها (الجهر، الهمس، "
            "الاستعلاء، الاستفال، الصفير، القلقلة، التفخيم والترقيق، أحكام اللام الشمسية والقمرية)، وحركات أواخر "
            "الكلمات (الرفع، النصب، الجر، الجزم، الوقف بالسكون، التنوين)."
        )
    else:
        method_note = (
            "⚠️ تنبيه منهجي: التقييم الحالي يستند إلى التفريغ اللغوي. اعلم أن تقنية التعرف الصوتي بالمتصفحات تسقط "
            "الحركات التشكيلية تلقائياً. إذا كانت الكلمات المنطوقة مطابقة تسلسلياً للنص المعياري، فلا تحكم باللحن "
            "لمجرد غياب التشكيل في النص المكتوب، بل اعتبر النطق صحيحاً وأعرب الكلمات وفق سياقها الفصيح، ما لم يكن "
            "هناك استبدال أو تحريف أو حذف حقيقي."
        )

    prompt = f"""أنت الموجه العام والمدقق الأكاديمي المعتمد للغة العربية وعلم الأصوات والنحو لدى وزارة التربية والتعليم والتعليم العالي بدولة قطر (Senior Inspector of Arabic Phonetics, Syntax & Diacritics - MoEHE Qatar).

المستوى الدراسي للطالب: "{grade}".
لغة التقييم: {language_label}.
المعيار المستهدف: "{standard_name}" ({standard_code}).
مؤشر الأداء: "{indicator}".

النص المعياري المشكول الواجب قراءته وضبطه:
"{target_text}"

النص المفرغ من محرك الصوت (إن توفر):
"{spoken}"

{method_note}

قواعد التقييم الصارم والنزيه المعتمدة من التوجيه التربوي:
1. معايير الإتقان والفصاحة (95% - 100%):
   - إذا نطق المتعلم الكلمات نطقاً عربياً سليماً ومخارج صحيحة وضبطاً إعرابياً سليماً، امنحه التقييم الكامل العادل (من 95% إلى 100%) واذكر في خانة 'note' إعراب الكلمة السليم ومخرجها الصوتي المتقن.
   - الوقف بالسكون على آخر حرف في نهاية الجملة أو الآية أو عند علامة الترقيم هو سنة عربية فصيحة مستحبة ("سكن تسلم")، ولا يجوز أبداً اعتباره خطأً أو خصم أي درجة بسببه.

2. رصد اللحن والأخطاء الحقيقية (إن وجدت):
   - اللحن الإعرابي في حركات أواخر الكلمات (Syntactic Inflection Error):
     إذا نطق حركة مخالفة للموقع النحوي (مثل فتح الفاعل المرفوع، أو كسر المفعول به المنصوب، أو ضم الاسم المجرور):
     * اجعل status: "mispronounced"
     * اذكر في 'errorReason': سبب الخطأ النحوي (مثال: "لحن إعرابي: نُطقت بالفتح وحقها الرفع بالضمة لأنها فاعل مرفوع").
     * اذكر في 'i_rab': الموقع الإعرابي والعلامة بدقة (مثال: "فاعل مرفوع وعلامة رفعه الضمة الظاهرة على آخره").
   - عيوب المخارج الصوتية والصفات (Phonetic Articulation Error):
     إذا أبدل صوتاً بآخر (مثل: إبدال الصاد سيناً، أو الضاد دالاً/ظاءً، أو الطاء تاءً، أو القاف كافاً، أو إظهار اللام الشمسية بدلاً من إدغامها في الحرف الشمسي):
     * اجعل status: "mispronounced"
     * اذكر في 'errorReason': المخرج الصوتي المستهدف (مثال: "إبدال صوتي: رُققت الصاد حتى قاربت السين، والواجب تفخيم الصاد كمستعلٍ مطبق").
     * اذكر في 'phoneticRule': القاعدة الصوتية المعتمدة.
   - إسقاط الكلمات أو التحريف:
     اجعل status: "omitted".

3. حساب الدرجة الشاملة overallScore:
   - احسب النسبة المئوية الواقعية بدقة دون مجاملة زائفة ولا ظلم تعسفي.
   - القراءة الفصيحة الكاملة تستحق 95 - 100.
   - الخطأ الإعرابي الواحد يخصم بمقدار وزنه في المعيار (8-15 درجة).
   - إبدال مخرج حرف يخصم (5-10 درجات).

أخرج التحليل كـ JSON ملتزماً تماماً بالمخطط (Schema)."""

    if check is not None:
        try:
            data = await _generate(engine, prompt, language=language, schema=PRONUNCIATION_SCHEMA,
                                   gemini_model="gemini-3.8-flash", max_tokens=4000)
        except Exception as exc:          # the comparison is still a valid assessment without the explanations
            logger.error("Pronunciation explanation by %s failed: %s – returning the comparison only", engine, exc)
            return _feedback_from_check(check, language)
        return _apply_check(data, check)

    data = await _generate(engine, prompt, language=language, schema=PRONUNCIATION_SCHEMA, gemini_model="gemini-3.8-flash",
                           audio=audio, max_tokens=4000)
    data["evaluationMethod"] = "multimodal_audio" if has_audio else "linguistic_transcript"
    if asr_error:
        data["asrError"] = asr_error
    return data


def _norm_word(w: str) -> str:
    return re.sub(r"[\u064B-\u0652\u0670\u0640]", "", w or "").strip()


def _apply_check(data: Dict[str, Any], check: Dict[str, Any]) -> Dict[str, Any]:
    """Make the LLM's answer agree with the deterministic comparison (statuses, spoken words, score)."""
    llm_corr = [c for c in (data.get("corrections") or []) if isinstance(c, dict)]
    used = set()
    corrections = []
    for w in check["words"]:
        match = None
        if w["index"] < len(llm_corr) and _norm_word(llm_corr[w["index"]].get("word")) == _norm_word(w["word"]):
            match = w["index"]
        else:
            for i, c in enumerate(llm_corr):
                if i not in used and _norm_word(c.get("word")) == _norm_word(w["word"]):
                    match = i
                    break
        c = dict(llm_corr[match]) if match is not None else {}
        if match is not None:
            used.add(match)
        details = "؛ ".join(f"{e['label']}: {e['detail']}" for e in w["errors"])
        agrees = c.get("status") == w["status"]
        c.update({"word": w["word"], "spokenWord": w["spokenWord"], "status": w["status"]})
        if w["status"] == "correct":
            c["errorReason"] = None
            if not agrees or not c.get("note"):
                c["note"] = "نطق سليم مطابق للضبط المعياري." + (f" ({c['i_rab']})" if c.get("i_rab") else "")
        else:
            c["errorReason"] = c.get("errorReason") if agrees and c.get("errorReason") else details
            if not agrees or not c.get("note"):
                c["note"] = details
        c["detectedErrors"] = w["errors"]
        corrections.append(c)

    data["corrections"] = corrections
    data["overallScore"] = check["score"]
    data["evaluationMethod"] = "vowelized_asr"
    data["asrTranscript"] = check["transcript"]
    data["asrModel"] = asr_client.model()
    data["insertedWords"] = check["insertedWords"]
    data["vowelCoverage"] = check["vowelCoverage"]
    return data


def _feedback_from_check(check: Dict[str, Any], language: str) -> Dict[str, Any]:
    """Pronunciation feedback from the comparison alone (no LLM available or it failed)."""
    wrong = [w for w in check["words"] if w["status"] != "correct"]
    if language == "ar":
        feedback = ("قراءة سليمة مطابقة للنص المعياري." if not wrong and not check["insertedWords"] else
                    f"رُصد {check['errorCount']} خطأ في القراءة: " +
                    "؛ ".join(f"{w['word']} ({'، '.join(e['label'] for e in w['errors'])})" for w in wrong))
        recs = [f"أعد قراءة: {w['word']}" for w in wrong[:5]] or ["واصل التدريب على نصوص أطول."]
    else:
        feedback = "Reading matches the reference." if not wrong else f"{check['errorCount']} reading error(s) found."
        recs = [f"Practise: {w['word']}" for w in wrong[:5]] or ["Keep practising longer texts."]
    data = {
        "overallScore": check["score"],
        "feedback": feedback,
        "grammaticalSummary": "",
        "corrections": [],
        "recommendations": recs,
    }
    return _apply_check(data, check)


async def _generate_challenge(body: Dict[str, Any], engine: str) -> Dict[str, Any]:
    language = body.get("language") or "ar"
    grade = body.get("grade") or "Grade 5"
    standard_name = body.get("standardName") or "Voice Articulation"
    indicator = body.get("indicator") or body.get("indicatorAr") or "Exact phoneme match & diacritics"

    prompt = f"""You are an expert Qatari curriculum supervisor for the Ministry of Education & Higher Education (MoEHE Qatar).
Generate a custom, highly relevant diacritized practice phrase/sentence for a student in "{grade}".
Standard / Skill: "{standard_name}"
Performance Indicator: "{indicator}"
Language Mode: {_lang_name(language)}.

Directives:
1. Provide a clear, diacritized target sentence (كامل التشكيل بالإعراب والحركات للمرحلة الدراسية).
2. Write a brief 1-sentence explanation of what phonetic or grammatical rule is being tested in this sentence.
3. Provide 2 phonetic focus tips for the student.

Return as a JSON object adhering strictly to the schema provided."""

    data = await _generate(engine, prompt, language=language, schema=CHALLENGE_SCHEMA, gemini_model="gemini-3.7-flash")
    tips = data.get("focusTips")
    return {
        **data,
        "phrase": data.get("targetPhrase"),
        "tip": data.get("explanation") or (" • ".join(tips) if isinstance(tips, list) else ""),
    }


async def _interactive_coach(body: Dict[str, Any], engine: str) -> Dict[str, Any]:
    language = body.get("language") or "ar"
    grade = body.get("grade") or "Grade 5"
    q_text = body.get("userQuestion") or body.get("question")

    prompt = f"""You are an interactive AI Speech & Phonetics Coach for Qatari MoEHE Arabic and English curriculum.
Student Grade: {grade}.
Standard: "{body.get("standardName") or ""}"
Indicator: "{body.get("indicatorAr") or ""}"
Current Practice Phrase: "{body.get("currentPhrase") or ""}"
Student Question/Request: "{q_text or ""}"

Directives:
1. Answer directly, warmly, and constructively in {_lang_name(language)}.
2. Provide step-by-step articulation advice (مخارج الحروف، التشكيل والإعراب، مخارج الشفتين والحلق).
3. Keep your response encouraging, concise, and structured with bullet points if explaining rules.

Return as a JSON object adhering strictly to the schema provided."""

    data = await _generate(engine, prompt, language=language, schema=COACH_SCHEMA, gemini_model="gemini-3.7-flash")
    return {**data, "answer": data.get("reply")}


async def _academic_report(body: Dict[str, Any], engine: str) -> Dict[str, Any]:
    language = body.get("language") or "ar"
    grade = body.get("grade") or "Grade 5"
    subjects = body.get("subjects") or []
    subjects_str = "\n".join(
        f"- {s.get('name')}: {s.get('score')}% (Average)" for s in subjects if isinstance(s, dict)
    )
    lang = _lang_name(language)

    prompt = f"""You are a warm, highly professional academic counselor and educator.
Generate an encouraging and professional academic report card summary for a student in {grade}.
Language mode is: {lang}.

Student Subject Performance Scores:
{subjects_str}

Generate:
1. An executive summary describing overall student performance, language development, and voice metrics.
2. Strengths & highlight areas.
3. Tailored advice and developmental action plan for each subject (Arabic/English Literature, Grammar, Vocabulary, Speech Pronunciation).
4. A warm concluding motivational message.

Make sure the entire report, headings, and details are written elegantly in {lang}.
Return as a JSON object adhering strictly to the schema."""

    return await _generate(engine, prompt, language=language, schema=REPORT_SCHEMA, gemini_model="gemini-3.7-flash", max_tokens=3000)


async def _oratory_live_prompt(body: Dict[str, Any], engine: str) -> Dict[str, Any]:
    language = body.get("language") or "ar"
    speech_type = _opt(body, "speechType", "Lecture")
    transcript = _opt(body, "currentTranscript", "")
    topic = _opt(body, "topic", "")
    sector = _opt(body, "sector", "entrepreneur_pitch")

    prompt = f"""You are an elite live speech & debate AI coach sitting beside a public speaker.
Vertical/Sector: "{sector}".
Speech Type: "{speech_type}".
Topic/Theme: "{topic}".
What they have said so far (live transcript):
"{transcript}"

Generate real-time coaching assistance in {_lang_name(language)} tailored to the {sector} vertical:
1. "contentSummary": 1-2 sentences summarizing what the speaker just said.
2. "speakingGuidance": 1 actionable sentence telling the speaker what point or rhetorical technique to do next (e.g. strategic pause, ROI emphasis, or rebuttal).
3. "bodyLanguageTip": A short tip on eye contact sweeping, open gesture box, or stage posture.
4. "sentiment": Sentiment classification (e.g. "حاسم وإيجابي" / "إقناعي" / "تحفيزي").
5. "lexicalScore": Estimated lexical richness (0 to 100).

Return as a JSON object strictly following the schema."""

    return await _generate(engine, prompt, language=language, schema=LIVE_PROMPT_SCHEMA, gemini_model="gemini-3.7-flash")


# Session measurements the speaking stage can send (key, label, format)
_DEBRIEF_METRICS = [
    ("durationSeconds", "Duration", "{:.0f} s"),
    ("wpm", "Average pace", "{:.0f} words per minute"),
    ("fillerCount", "Filler words", "{:.0f}"),
    ("rhetoricalPauses", "Effective pauses (0.8-2 s)", "{:.0f}"),
    ("hesitationPauses", "Long hesitation pauses (over 2 s)", "{:.0f}"),
    ("vocabDiversity", "Vocabulary diversity (unique / total words)", "{:.0%}"),
    ("eyeContactPercent", "Head facing the camera/audience", "{:.0f}% of the time"),
    ("postureQuality", "Shoulders level (posture quality)", "{:.0f}/100"),
    ("handsVisiblePercent", "Hands detected by the camera", "{:.0f}% of frames"),
    ("slouchPercent", "Time slouching (ear-shoulder-hip angle)", "{:.0f}% of the time"),
    ("stillPercent", "Time standing too still (almost no head movement)", "{:.0f}% of the time"),
    ("gesturesPerMinute", "Hand movement rate", "{:.1f} per minute"),
    ("liveSentiment", "Tone detected during the speech", "{}"),
    # sent by older clients
    ("convictionScore", "Conviction index (client estimate)", "{}"),
    ("pitchVarianceHz", "Pitch variance", "{} Hz"),
]


def _measured_lines(body: Dict[str, Any]) -> Tuple[List[str], List[str]]:
    lines, missing = [], []
    for key, label, fmt in _DEBRIEF_METRICS:
        value = body.get(key)
        if value is None or value == "":
            if key not in ("convictionScore", "pitchVarianceHz"):
                missing.append(label)
            continue
        try:
            lines.append(f"- {label}: {fmt.format(value)}")
        except (ValueError, TypeError):
            missing.append(label)
    return lines, missing


async def _oratory_debrief(body: Dict[str, Any], engine: str) -> Dict[str, Any]:
    language = body.get("language") or "ar"
    sector = _opt(body, "sector", "entrepreneur_pitch")
    lines, missing = _measured_lines(body)
    measured = "\n".join(lines) if lines else "- (no measurements were received)"
    not_measured = (f"\nNot measured in this session: {', '.join(missing)}. Do not invent values for these; "
                    "where a score depends on them, judge from the transcript and say what could not be assessed.") if missing else ""

    vowel_block = _vowel_analysis_block(body.get("vowelAnalysis"))

    prompt = f"""You are a world-class oratory master, executive coach, and debate judge evaluating a speaker.
Sector/Vertical: "{sector}" (e.g., entrepreneur pitch, executive boardroom, TEDx keynote, legal debate, or academic student).
Speech Title: "{_opt(body, "speechTitle", "")}" ({_opt(body, "speechType", "Lecture")})

Measured during the session (microphone, live transcription and camera analysis):
{measured}{not_measured}
{vowel_block}
Full Spoken Transcript:
"{_opt(body, "transcript", "")}"

Evaluate the speech in {_lang_name(language)} based on the standards of the "{sector}" vertical. Ground every score in the measurements and the transcript above:
1. "overallScore": 0-100 score.
2. "vocalVarietyScore": 0-100 score (reflecting prosody and avoiding monotone; pitch is not measured, so judge from pace, pauses and wording).
3. "bodyLanguageScore": 0-100 score (eye contact, posture, hands – from the camera measurements; if they are missing, give a cautious middle score and say body language could not be assessed).
4. "structureAndLogicScore": 0-100 score.
5. "convictionScore": 0-100 score (assertiveness and certainty).
6. "rhetoricalPauses": count of effective 0.8s-2.0s pauses (use the measured count if given).
7. "brevityScore": 0-100 score (conciseness and directness).
8. "triad": {{ "logos": 0-100, "ethos": 0-100, "pathos": 0-100 }} (Aristotelian balance).
9. "strengths": Array of 2-3 specific points of brilliance.
10. "areasForImprovement": Array of 2-3 clear actionable improvements.
11. "summaryJudgement": A paragraph providing warm, inspiring executive mentor feedback.
12. "awardedBadge": Title of a honorary badge earned.

Return as a JSON object adhering strictly to the schema."""

    return await _generate(engine, prompt, language=language, schema=DEBRIEF_SCHEMA, gemini_model="gemini-3.7-flash", max_tokens=3000)


def _vowel_analysis_block(va: Any) -> str:
    """The live vowel check's totals (vowelized ASR per sentence) as prompt lines for the debrief."""
    if not isinstance(va, dict) or not va.get("enabled") or not va.get("judgedSegments"):
        return ""
    lines = ["", "Arabic pronunciation and case endings (a vowelized speech recogniser listened to each sentence; "
             "it can mishear, so treat single findings as indications and look for patterns):"]
    lines.append(f"- Sentences checked: {va.get('judgedSegments')} (skipped as unclear: {va.get('uncertainSegments', 0)})")
    if va.get("mode") == "script" and isinstance(va.get("script"), dict):
        sc = va["script"]
        lines.append(f"- Compared with the speaker's prepared script: {sc.get('coveragePercent', 0)}% of it delivered"
                     + (f"; passages skipped: {' | '.join(sc.get('skippedPassages') or [])}" if sc.get("skippedPassages") else ""))
    errors = va.get("errorsByType") or {}
    if errors:
        lines.append("- Errors found: " + "، ".join(f"{k}: {v}" for k, v in errors.items()))
    else:
        lines.append("- No pronunciation or case-ending errors found.")
    for e in (va.get("examples") or [])[:6]:
        lines.append(f"  • {e.get('word')} ← {e.get('spoken')}: {e.get('label')} ({e.get('detail')})")
    for i in (va.get("reviewIssues") or [])[:6]:
        lines.append(f"  • {i.get('word')} → {i.get('correct')}: {i.get('reason')}")
    lines.append("Mention the language accuracy (إعراب and pronunciation) in the strengths or areas for improvement "
                 "and in the summary judgement, with one or two of the examples above.")
    return "\n".join(lines) + "\n"


DIACRITIZE_SCHEMA = {
    "type": "OBJECT",
    "properties": {"vowelizedText": {"type": "STRING"}, "notes": {"type": "STRING"}},
    "required": ["vowelizedText"],
}


async def _diacritize_script(body: Dict[str, Any], engine: str) -> Dict[str, Any]:
    """Add full vowel marks (tashkeel) to a prepared speech, so each spoken sentence can be checked against it."""
    text = _opt(body, "text", "").strip()[:12000]
    if not text:
        return {"vowelizedText": "", "notes": ""}
    prompt = f"""شكّل النص العربي التالي تشكيلاً تاماً صحيحاً (حركات البنية والإعراب على كل حرف، والشدة والتنوين)،
كما ينبغي أن يُلقى بالعربية الفصحى. لا تغيّر أي كلمة ولا ترتيبها ولا علامات الترقيم، ولا تضف شرحاً داخل النص.
إن كان في النص موضع يحتمل وجهين في الإعراب فاختر الأشهر واذكره باختصار في notes.

النص:
{text}"""
    data = await _generate(engine, prompt, language="ar", schema=DIACRITIZE_SCHEMA, gemini_model="gemini-3.8-flash",
                           max_tokens=8000)
    vowelized = (data.get("vowelizedText") or "").strip()
    # guard: the words must be the same as the original (only marks added)
    from app.services.vowelized_live import _skeleton_words
    same = _skeleton_words(vowelized) == _skeleton_words(text)
    return {"vowelizedText": vowelized if vowelized else text, "notes": data.get("notes") or "",
            "wordsChanged": not same}


_TASK_HANDLERS = {
    "pronunciation_feedback": _pronunciation_feedback,
    "diacritize_script": _diacritize_script,
    "generate_challenge": _generate_challenge,
    "interactive_coach": _interactive_coach,
    "academic_report": _academic_report,
    "oratory_live_prompt": _oratory_live_prompt,
    "oratory_debrief": _oratory_debrief,
}


@router.post("/api/analyze")
async def analyze(request: Request):
    """Run one AI practice/oratory task (same contract as ILQAA-LAB's server.ts)."""
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"error": "Request body must be JSON"})
    if not isinstance(body, dict):
        return JSONResponse(status_code=400, content={"error": "Request body must be a JSON object"})

    task = body.get("task")
    engine = _text_engine()

    if engine is None:
        # pronunciation feedback can still be graded from the recording by the ASR or the audio model
        can_listen = task == "pronunciation_feedback" and _pronunciation_mode(
            body.get("language") or "ar", len(str(body.get("audioBase64") or "")) > 200,
            body.get("audioMimeType") or "audio/webm") != "text"
        if not can_listen:
            logger.warning("No AI engine configured - using offline fallback for task %s", task)
            # flagged so the frontend can label it as sample text, not an assessment
            return {**fallback_response(task, body), "offline_fallback": True}

    if task not in TASKS:
        return JSONResponse(status_code=400, content={"error": "Invalid task parameter"})

    try:
        return await _TASK_HANDLERS[task](body, engine)
    except Exception as exc:
        logger.error("AI task %s failed (%s): %s", task, engine, exc)
        return JSONResponse(
            status_code=500,
            content={"error": "An error occurred while generating AI analysis.", "details": str(exc)},
        )


# ---------------------------------------------------------------------------
# Text-to-speech
# ---------------------------------------------------------------------------

_TTS_CACHE_MAX = 256
_tts_cache: "OrderedDict[str, Tuple[bytes, str]]" = OrderedDict()

_FALLBACK_TTS_URL = "https://translate.google.com/translate_tts"
_BROWSER_UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
               "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")


def _audio_response(data: bytes, content_type: str) -> Response:
    return Response(
        content=data,
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=86400", "Accept-Ranges": "bytes"},
    )


def _cache_put(key: str, data: bytes, content_type: str) -> None:
    _tts_cache[key] = (data, content_type)
    _tts_cache.move_to_end(key)
    while len(_tts_cache) > _TTS_CACHE_MAX:
        _tts_cache.popitem(last=False)


@router.get("/api/tts")
async def text_to_speech(text: str = "", lang: str = "ar", voice: str = "Fenrir"):
    """Speak ``text`` with the audio TTS model (voices Fenrir / Charon), falling back to Google Translate TTS."""
    clean = text.strip()[:400]
    if not clean:
        return PlainTextResponse("Text is required for TTS synthesis", status_code=400)

    voice = "Charon" if voice == "Charon" else "Fenrir"
    key = f"{lang}_{voice}_{clean}"
    if key in _tts_cache:
        _tts_cache.move_to_end(key)
        return _audio_response(*_tts_cache[key])

    spoken = await audio_client.synthesize_speech(clean, voice)
    if spoken:
        _cache_put(key, *spoken)
        return _audio_response(*spoken)

    try:
        params = {"ie": "UTF-8", "q": clean, "tl": "en" if lang == "en" else "ar", "client": "tw-ob"}
        async with aiohttp.ClientSession() as session:
            async with session.get(_FALLBACK_TTS_URL, params=params, headers={"User-Agent": _BROWSER_UA},
                                   timeout=aiohttp.ClientTimeout(total=20)) as resp:
                if resp.status != 200:
                    raise RuntimeError(f"TTS upstream returned HTTP {resp.status}")
                audio = await resp.read()
        _cache_put(key, audio, "audio/mpeg")
        return _audio_response(audio, "audio/mpeg")
    except Exception as exc:
        logger.error("TTS synthesis error: %s", exc)
        return JSONResponse(status_code=500,
                            content={"error": "TTS proxy failed", "details": str(exc) or "Unknown audio synthesis error"})
