/**
 * Session report: the full transcript with the mistakes highlighted, and the numbered list of mistakes.
 *
 *   raw view        Speechmatics transcript; language mistakes (from the live vowel check) and filler words marked
 *   vowelized view  each sentence as the vowelized ASR heard it, with the same mistakes marked
 */
import React, { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import type { VowelSegment } from "../lib/liveCoach";
import { markTranscript, normWord } from "../lib/transcriptMarks";

const PRINT = "[print-color-adjust:exact] [-webkit-print-color-adjust:exact]";
const LANG_MARK = `bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 rounded px-0.5 underline decoration-wavy decoration-rose-500 underline-offset-4 ${PRINT}`;
const FILLER_MARK = `bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded px-0.5 ${PRINT}`;

interface Props {
  isRtl: boolean;
  transcript: string;
  segments: VowelSegment[];
  fillers: string[];
}

export function TranscriptReport({ isRtl, transcript, segments, fillers }: Props) {
  const [view, setView] = useState<"raw" | "vowelized">("raw");
  const result = useMemo(() => markTranscript(transcript, segments, fillers), [transcript, segments, fillers]);
  const judged = segments.filter((s) => !s.uncertain);
  const hasVowelized = segments.length > 0;

  // mistake numbers per sentence, to mark the same words in the vowelized view
  const bySegment = useMemo(() => {
    const map = new Map<number, typeof result.mistakes>();
    for (const m of result.mistakes) {
      if (!map.has(m.segmentId)) map.set(m.segmentId, []);
      map.get(m.segmentId)!.push(m);
    }
    return map;
  }, [result]);

  if (!transcript.trim()) return null;
  const fillerCounts = Object.entries(result.fillers) as [string, number][];
  const fillerTotal = fillerCounts.reduce((a, [, n]) => a + n, 0);

  return (
    <div className="bg-white dark:bg-[#1C0A15] rounded-3xl p-6 border border-slate-100 dark:border-[#3D1426] shadow-sm space-y-4 break-inside-avoid" id="transcript-report">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#8A1538] dark:text-amber-400" />
          <span>{isRtl ? "النص المفرّغ للخطاب مع تحديد الأخطاء" : "Speech transcript with the mistakes highlighted"}</span>
        </h4>
        {hasVowelized && (
          <div className="flex gap-1 text-[11px] font-bold print:hidden">
            {(["raw", "vowelized"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg border cursor-pointer ${view === v
                  ? "bg-[#8A1538] text-white border-[#8A1538]"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"}`}
              >
                {v === "raw" ? (isRtl ? "النص كما فُرّغ" : "As transcribed") : (isRtl ? "النص بالتشكيل" : "With vowels")}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* legend */}
      <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 dark:text-slate-400">
        <span><span className={LANG_MARK}>كلمة</span> {isRtl ? `خطأ في النطق أو الإعراب (${result.mistakes.length})` : `pronunciation / case-ending mistake (${result.mistakes.length})`}</span>
        <span><span className={FILLER_MARK}>يعني</span> {isRtl ? `كلمة حشو أو تردد (${fillerTotal})` : `filler word (${fillerTotal})`}</span>
        {!hasVowelized && (
          <span>{isRtl ? "· التحقق من التشكيل لم يكن مفعّلاً في هذه الجلسة" : "· the vowel check was off in this session"}</span>
        )}
      </div>

      {view === "raw" || !hasVowelized ? (
        <p dir="auto" className="font-serif text-base leading-[2.4] text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
          {result.tokens.map((t, i) => {
            const m = result.marks[i];
            const sep = i ? " " : "";
            if (!m) return <React.Fragment key={i}>{sep}{t}</React.Fragment>;
            return (
              <React.Fragment key={i}>
                {sep}
                <span title={m.title} className={m.kind === "language" ? LANG_MARK : FILLER_MARK}>
                  {t}
                  {m.kind === "language" && <sup className="text-[9px] font-sans font-black text-rose-600 mx-0.5">{m.mistakes.join(",")}</sup>}
                </span>
              </React.Fragment>
            );
          })}
        </p>
      ) : (
        <div dir="rtl" className="font-serif text-base leading-[2.4] text-slate-800 dark:text-slate-100 space-y-1">
          {segments.map((seg) => {
            const ms = (bySegment.get(seg.id) ?? []).filter((m) => m.kind === "language" || m.kind === "inserted");
            const used = new Set<number>();
            return (
              <p key={seg.id} className={seg.uncertain ? "text-slate-400 italic" : ""}
                 title={seg.uncertain ? (isRtl ? "جملة غير مؤكدة – لم تُقيَّم" : "Unclear sentence – not judged") : undefined}>
                {seg.text.split(/\s+/).map((w, i) => {
                  const m = ms.find((x) => !used.has(x.n) && normWord(x.spoken) === normWord(w));
                  if (m) used.add(m.n);
                  return (
                    <React.Fragment key={i}>
                      {i ? " " : ""}
                      {m ? (
                        <span className={LANG_MARK} title={`${m.correct ? `${isRtl ? "الصواب" : "Correct"}: ${m.correct}\n` : ""}${m.explanation}`}>
                          {w}<sup className="text-[9px] font-sans font-black text-rose-600 mx-0.5">{m.n}</sup>
                        </span>
                      ) : w}
                    </React.Fragment>
                  );
                })}
              </p>
            );
          })}
        </div>
      )}

      {/* numbered list of mistakes */}
      {result.mistakes.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {isRtl ? "الأخطاء المرصودة وتصويبها:" : "Mistakes found and corrections:"}
          </p>
          <ol className="space-y-1 text-xs">
            {result.mistakes.map((m) => (
              <li key={m.n} dir="rtl" className="flex flex-wrap items-baseline gap-x-2 p-2 rounded-xl bg-rose-50/60 dark:bg-rose-950/20">
                <span className="font-mono font-black text-rose-600">{m.n}.</span>
                {m.kind === "omitted" ? (
                  <span className="font-serif text-sm"><span className="font-black">{m.correct}</span> — {isRtl ? "لم تُقرأ" : "skipped"}</span>
                ) : m.kind === "inserted" ? (
                  <span className="font-serif text-sm"><span className="font-black">{m.spoken}</span> — {isRtl ? "كلمة زائدة على النص" : "extra word"}</span>
                ) : (
                  <span className="font-serif text-sm">
                    <span className="line-through decoration-rose-400">{m.spoken}</span> ← <span className="font-black text-emerald-700 dark:text-emerald-400">{m.correct}</span>
                  </span>
                )}
                {m.explanation && <span className="text-slate-500 dark:text-slate-400">— {m.explanation}</span>}
                {m.kind === "language" && !m.inTranscript && (
                  <span className="text-[10px] text-slate-400">{isRtl ? "· لم تُحدَّد في النص المفرّغ" : "· not located in the transcript"}</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {fillerTotal > 0 && (
        <p className="text-xs text-slate-600 dark:text-slate-300">
          <span className="font-bold">{isRtl ? "كلمات الحشو: " : "Filler words: "}</span>
          {[...fillerCounts].sort((a, b) => b[1] - a[1]).map(([w, n]) => `${w} ×${n}`).join("، ")}
        </p>
      )}

      {hasVowelized && (
        <p className="text-[10px] text-slate-400">
          {isRtl
            ? `قُيّمت ${judged.length} من ${segments.length} جملة بمحرك تعرّف صوتي مُشكِّل قد يخطئ في السماع؛ الجمل غير المؤكدة لم تُقيَّم.`
            : `${judged.length} of ${segments.length} sentences judged by a vowelized speech recogniser that can mishear; unclear sentences were not judged.`}
        </p>
      )}
    </div>
  );
}
