/**
 * Live vowel check on the speaking stage (vowelized ASR per sentence, see backend/app/services/vowelized_live.py):
 *
 *   <VowelScriptSetup>       setup: which text the speech is compared with + "add vowels" (LLM)
 *   <VowelTranscriptPanel>   live: each sentence as heard, with its vowels, possible errors underlined
 *   <VowelSummaryCard>       debrief: totals from the session summary
 */
import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BookOpen, CheckCircle2, Loader2, Sparkles, Type } from "lucide-react";
import type { VowelCheckStatus, VowelSegment } from "../lib/liveCoach";

const MARKS = /[ً-ْ]/g;
const LETTERS = /[ء-ي]/g;

/** At least a third of the letters carry a vowel mark (same rule as the backend). */
export function textHasVowels(text: string): boolean {
  const letters = (text.match(LETTERS) || []).length;
  return letters > 0 && (text.match(MARKS) || []).length / letters >= 0.33;
}

const strip = (w: string) => w.replace(MARKS, "").replace(/[ـ.,،؛:!؟?«»"()]/g, "");

// ---------------------------------------------------------------------------- setup

export type ScriptMode = "selected" | "custom" | "none";

interface SetupProps {
  isRtl: boolean;
  selectedScript: string;                  // the preset text chosen above
  language: string;
  /** Effective text sent to the backend ("" = free speech) and shown on the teleprompter. */
  onChange: (script: string, mode: ScriptMode) => void;
}

export function VowelScriptSetup({ isRtl, selectedScript, language, onChange }: SetupProps) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [mode, setMode] = useState<ScriptMode>("selected");
  const [custom, setCustom] = useState("");
  const [vowelized, setVowelized] = useState<Record<string, string>>({});   // source text -> text with vowels
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health").then((r) => r.json()).then((h) => setAvailable(!!h?.asr?.configured)).catch(() => setAvailable(false));
  }, []);

  const source = mode === "custom" ? custom : mode === "selected" ? selectedScript : "";
  const effective = vowelized[source] ?? source;
  const hasVowels = textHasVowels(effective);

  useEffect(() => { onChange(effective.trim(), mode); }, [effective, mode]);  // eslint-disable-line react-hooks/exhaustive-deps

  if (language !== "ar") return null;

  const addVowels = async () => {
    if (!source.trim()) return;
    setBusy(true);
    setNote(null);
    try {
      const r = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: "diacritize_script", language: "ar", text: source }),
      });
      const d = await r.json();
      if (!r.ok || !d.vowelizedText) throw new Error(d.details || d.error || `HTTP ${r.status}`);
      setVowelized((v) => ({ ...v, [source]: d.vowelizedText }));
      setNote(d.offline_fallback
        ? (isRtl ? "لا يتوفر نموذج لغوي لإضافة التشكيل – بقي النص كما هو." : "No language model available – the text is unchanged.")
        : d.wordsChanged
          ? (isRtl ? "تنبيه: غيّر النموذج بعض الكلمات أثناء التشكيل – راجع النص قبل البدء." : "Warning: the model changed some words – review the text.")
          : (isRtl ? "أُضيف التشكيل آلياً – راجعه وصحّحه إن لزم، فالمقارنة تعتمد عليه." : "Vowels added automatically – review them, the check relies on them.")
          + (d.notes ? ` ${d.notes}` : ""));
    } catch (e: any) {
      setNote((isRtl ? "تعذّر إضافة التشكيل: " : "Could not add the vowels: ") + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  };

  const option = (value: ScriptMode, ar: string, en: string) => (
    <button
      type="button"
      onClick={() => setMode(value)}
      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
        mode === value
          ? "bg-[#8A1538] text-white border-[#8A1538]"
          : "bg-white dark:bg-[#15060D] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
      }`}
    >
      {isRtl ? ar : en}
    </button>
  );

  return (
    <div className="rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1A0A13] shadow-sm space-y-3" id="vowel-script-setup">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Type className="w-4 h-4 text-[#8A1538] dark:text-amber-400" />
          <span>{isRtl ? "التحقق من التشكيل والإعراب أثناء الإلقاء" : "Vowel & case-ending check while you speak"}</span>
        </h3>
        {available === false && (
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
            {isRtl ? "غير مفعّل على الخادم (يتطلب ASR_BASE_URL)" : "Not enabled on the server (needs ASR_BASE_URL)"}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        {isRtl
          ? "يكتب محرك تعرّف صوتي مُشكِّل كل جملة تنطقها بحركاتها بعد ثانية تقريباً. إذا اخترت نصاً تُقارن كل جملة به حرفاً بحرف؛ وفي الكلام الحر يراجع المساعد الإعراب. قد يخطئ المحرك في السماع، لذا تظهر الأخطاء المحتملة بخط منقّط."
          : "A vowelized speech recogniser writes each sentence with its vowels about a second after you say it. With a text, each sentence is compared with it letter by letter; in free speech the assistant reviews the case endings. The recogniser can mishear, so possible errors are only underlined."}
      </p>

      <div className="flex flex-wrap gap-2">
        {option("selected", "قارن بالنص المختار أعلاه", "Compare with the selected text")}
        {option("custom", "نصّي الخاص", "My own text")}
        {option("none", "كلام حر بلا نص", "Free speech, no text")}
      </div>

      {mode === "custom" && (
        <textarea
          dir="rtl"
          value={vowelized[custom] ?? custom}
          onChange={(e) => setCustom(e.target.value)}
          rows={5}
          placeholder={isRtl ? "الصق نص خطبتك أو كلمتك هنا (ويفضل أن يكون مشكولاً)…" : "Paste your speech here (ideally with vowels)…"}
          className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#12040B] font-serif text-sm leading-loose text-slate-900 dark:text-amber-50"
        />
      )}

      {mode !== "none" && source.trim() && (
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {hasVowels ? (
            <span className="flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              {isRtl ? "النص مشكول – سيُتحقق من الحركات والإعراب" : "Text has vowels – vowels and endings will be checked"}
            </span>
          ) : (
            <span className="flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              {isRtl ? "النص غير مشكول – ستُرصد الكلمات المتروكة والحروف فقط" : "No vowels – only skipped words and letters can be checked"}
            </span>
          )}
          {!hasVowels && (
            <button
              type="button"
              onClick={addVowels}
              disabled={busy}
              className="px-3 py-1.5 rounded-xl bg-[#D4AF37] text-slate-950 font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {isRtl ? "أضف التشكيل تلقائياً" : "Add vowels automatically"}
            </button>
          )}
        </div>
      )}

      {mode === "selected" && vowelized[selectedScript] && (
        <p dir="rtl" className="p-3 rounded-2xl bg-amber-50 dark:bg-[#15060D] border border-amber-200/80 dark:border-amber-900/30 font-serif text-sm leading-loose text-slate-900 dark:text-amber-50">
          {vowelized[selectedScript]}
        </p>
      )}
      {note && <p className="text-[11px] text-slate-600 dark:text-slate-300">{note}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------- live panel

function Flagged({ text, title }: { text: string; title: string }) {
  return (
    <span title={title} className="underline decoration-dotted decoration-amber-400 decoration-2 underline-offset-4 cursor-help text-amber-200">
      {text}
    </span>
  );
}

function SegmentLine({ seg, isRtl }: { seg: VowelSegment; isRtl: boolean }) {
  if (seg.uncertain) {
    return (
      <p className="text-slate-500 italic" title={isRtl ? "لم يتفق محركا التفريغ على الكلمات – لم تُقيَّم الجملة" : "The two recognisers disagree – not judged"}>
        {seg.text} <span className="not-italic text-[10px] px-1.5 rounded bg-slate-800 text-slate-400">؟</span>
      </p>
    );
  }
  if (seg.mode === "script" && seg.words.length) {
    return (
      <p className="text-slate-100">
        {seg.words.map((w, i) => {
          const sep = i ? " " : "";
          if (w.status === "omitted") {
            return <span key={i}>{sep}<span className="text-slate-500 line-through" title={isRtl ? "لم تُقرأ" : "Skipped"}>{w.word}</span></span>;
          }
          if (w.status === "mispronounced") {
            const title = w.errors.map((e) => `${e.label}: ${e.detail}`).join("\n") + `\n${isRtl ? "الصواب" : "Expected"}: ${w.word}`;
            return <span key={i}>{sep}<Flagged text={w.spokenWord || w.word} title={title} /></span>;
          }
          return <span key={i}>{sep}{w.spokenWord || w.word}</span>;
        })}
      </p>
    );
  }
  const issues = seg.review ?? [];
  return (
    <p className="text-slate-100">
      {seg.text.split(/\s+/).map((word, i) => {
        const issue = issues.find((x) => strip(x.word) === strip(word));
        const sep = i ? " " : "";
        return issue
          ? <span key={i}>{sep}<Flagged text={word} title={`${isRtl ? "الصواب" : "Correct"}: ${issue.correct}\n${issue.reason}`} /></span>
          : <span key={i}>{sep}{word}</span>;
      })}
      {seg.mode === "off_script" && (
        <span className="text-[10px] mx-2 px-1.5 rounded bg-slate-800 text-slate-400">{isRtl ? "خارج النص" : "off script"}</span>
      )}
    </p>
  );
}

export function VowelTranscriptPanel({ status, segments, isRtl }: { status: VowelCheckStatus; segments: VowelSegment[]; isRtl: boolean }) {
  const boxRef = React.useRef<HTMLDivElement | null>(null);
  useEffect(() => { if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight; }, [segments]);
  const flagged = useMemo(
    () => segments.reduce((n, s) => n + (s.uncertain ? 0 : s.words.filter((w) => w.status !== "correct").length + (s.review?.length ?? 0)), 0),
    [segments],
  );
  if (status.state === "off") return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-2" id="live-vowel-panel">
      <div className="flex items-center justify-between text-xs font-bold">
        <span className="flex items-center gap-2 text-slate-200">
          <BookOpen className="w-4 h-4 text-amber-400" />
          {isRtl ? "ما نطقته بالتشكيل" : "What you said, with vowels"}
          {status.script && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#8A1538]/40 text-amber-200">
              {isRtl ? "مقارنة بالنص" : "vs. your text"}
            </span>
          )}
        </span>
        <span className="text-slate-500">
          {segments.length} {isRtl ? "جملة" : "sentences"} · <span className="text-amber-300">{flagged}</span> {isRtl ? "ملاحظة" : "flags"}
        </span>
      </div>
      {status.state !== "ready" && status.message && (
        <p className={`text-[11px] ${status.state === "error" ? "text-rose-400" : "text-amber-400"}`}>
          {status.state === "error"
            ? (isRtl ? "توقف التحقق من التشكيل: " : "Vowel check stopped: ")
            : (isRtl ? "تنبيه في التحقق من التشكيل: " : "Vowel check: ")}
          <span dir="ltr">{status.message}</span>
        </p>
      )}
      <div ref={boxRef} dir="rtl" className="max-h-36 overflow-y-auto text-base leading-loose font-serif space-y-1">
        {segments.length ? segments.map((s) => <React.Fragment key={s.id}><SegmentLine seg={s} isRtl={isRtl} /></React.Fragment>) : (
          <span className="text-slate-500 text-xs font-sans">
            {isRtl ? "تظهر كل جملة هنا بحركاتها بعد أن تتوقف عندها لحظة." : "Each sentence appears here with its vowels after you pause."}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------- debrief card

export function VowelSummaryCard({ analysis, isRtl }: { analysis: Record<string, any> | null | undefined; isRtl: boolean }) {
  if (!analysis?.enabled || !analysis.segments) return null;
  const errors = Object.entries((analysis.errorsByType ?? {}) as Record<string, number>);
  return (
    <div className="bg-white dark:bg-[#1C0A15] rounded-3xl p-5 border border-slate-100 dark:border-[#3D1426] shadow-sm space-y-3" id="vowel-summary-card">
      <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
        <Type className="w-4 h-4 text-[#8A1538] dark:text-amber-400" />
        <span>{isRtl ? "الدقة اللغوية (التشكيل والإعراب):" : "Language accuracy (vowels & endings):"}</span>
      </h4>
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60">
          <span className="text-slate-500">{isRtl ? "جمل مُقيَّمة:" : "Sentences judged:"}</span>
          <span className="font-mono font-bold">
            {analysis.judgedSegments}
            {analysis.uncertainSegments ? <span className="text-slate-400"> (+{analysis.uncertainSegments} {isRtl ? "غير مؤكدة" : "unclear"})</span> : null}
          </span>
        </div>
        {analysis.script && (
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60">
            <span className="text-slate-500">{isRtl ? "ما أُلقي من النص:" : "Text delivered:"}</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{analysis.script.coveragePercent}%</span>
          </div>
        )}
        {errors.length ? errors.map(([label, n]) => (
          <div key={label} className="flex items-center justify-between p-2 rounded-xl bg-amber-50 dark:bg-amber-950/20">
            <span className="text-slate-600 dark:text-slate-300">{label}</span>
            <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{n}</span>
          </div>
        )) : (
          <p className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-bold">
            {isRtl ? "لم تُرصد أخطاء في الحركات أو الإعراب." : "No vowel or case-ending errors found."}
          </p>
        )}
        {(analysis.examples ?? []).slice(0, 4).map((e: any, i: number) => (
          <p key={i} dir="rtl" className="font-serif text-[13px] text-slate-700 dark:text-slate-200">
            <span className="font-black">{e.word}</span> ← {e.spoken} <span className="text-slate-400 text-[11px] font-sans">({e.detail})</span>
          </p>
        ))}
        {(analysis.reviewIssues ?? []).slice(0, 4).map((x: any, i: number) => (
          <p key={`r${i}`} dir="rtl" className="font-serif text-[13px] text-slate-700 dark:text-slate-200">
            {x.word} → <span className="font-black">{x.correct}</span> <span className="text-slate-400 text-[11px] font-sans">({x.reason})</span>
          </p>
        ))}
        <p className="text-[10px] text-slate-400">
          {isRtl ? "يعتمد على محرك تعرّف صوتي قد يخطئ في السماع – تعامل مع الملاحظات المفردة بحذر." : "Based on a speech recogniser that can mishear – treat single findings with care."}
        </p>
      </div>
    </div>
  );
}
