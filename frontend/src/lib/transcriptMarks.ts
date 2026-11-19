/**
 * Mark the mistakes inside the raw (Speechmatics) transcript for the session report.
 *
 * Language mistakes come from the live vowel check (VowelSegment): each segment carries the
 * Speechmatics words of its time span, so it is located in the transcript in order and the flagged
 * word is marked *in that sentence* – not every occurrence of the same word. Filler words are marked
 * wherever they occur.
 */
import type { VowelSegment } from "./liveCoach";

export interface Mistake {
  n: number;                          // number shown in the list and next to the word
  kind: "language" | "omitted" | "inserted";
  spoken: string;                     // what was said (as the vowelized ASR heard it)
  correct: string;                    // expected form
  explanation: string;
  segmentId: number;
  inTranscript: boolean;              // false when the word could not be found in the raw transcript
}

export interface TokenMark {
  kind: "language" | "filler";
  mistakes: number[];                 // Mistake.n for language marks
  title: string;
}

export interface MarkedTranscript {
  tokens: string[];
  marks: (TokenMark | null)[];
  mistakes: Mistake[];
  fillers: Record<string, number>;    // filler -> occurrences found in the transcript
}

const DIACRITICS = /[ً-ْٰـ]/g;
const PUNCT = /[.,،؛:!؟?«»"'()\[\]{}…\-]/g;
const SPELLING: Record<string, string> = { "أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا", "ى": "ي", "ة": "ه", "ؤ": "و", "ئ": "ي", "ء": "" };

/** Same normalisation as the backend's word comparison: no vowels, unified hamza/alif/ya/ta marbuta. */
export function normWord(word: string): string {
  let k = (word || "").replace(DIACRITICS, "").replace(PUNCT, "").toLowerCase();
  k = k.replace(/[أإآٱىةؤئء]/g, (c) => SPELLING[c] ?? c);
  return k.length >= 3 && k.endsWith("ا") ? k.slice(0, -1) : k;
}

const words = (text: string) => (text || "").split(/\s+/).filter(Boolean);

function findSpan(norm: string[], seg: string[], from: number): number {
  if (!seg.length) return -1;
  const probe = Math.min(3, seg.length);
  for (let i = from; i <= norm.length - probe; i++) {
    let ok = 0;
    for (let j = 0; j < probe; j++) if (norm[i + j] === seg[j]) ok++;
    if (ok === probe || (probe === 3 && ok === 2 && norm[i] === seg[0])) return i;
  }
  return -1;
}

export function markTranscript(transcript: string, segments: VowelSegment[], fillers: string[]): MarkedTranscript {
  const tokens = words(transcript);
  const norm = tokens.map(normWord);
  const marks: (TokenMark | null)[] = tokens.map(() => null);
  const mistakes: Mistake[] = [];
  let cursor = 0;

  const add = (m: Omit<Mistake, "n">) => {
    const full = { ...m, n: mistakes.length + 1 };
    mistakes.push(full);
    return full.n;
  };

  for (const seg of [...segments].sort((a, b) => a.start - b.start)) {
    if (seg.uncertain) continue;
    // this sentence's findings, in reading order
    type Item = { kind: Mistake["kind"]; spoken: string; correct: string; explanation: string };
    const items: Item[] = [];
    if (seg.mode === "script") {
      for (const w of seg.words) {
        const explanation = w.errors.map((e) => (e.detail ? `${e.label}: ${e.detail}` : e.label)).join("؛ ");
        if (w.status === "omitted") items.push({ kind: "omitted", spoken: "", correct: w.word, explanation });
        else if (w.status === "mispronounced") items.push({ kind: "language", spoken: w.spokenWord || w.word, correct: w.word, explanation });
      }
      for (const x of seg.insertedWords) items.push({ kind: "inserted", spoken: x.word, correct: "", explanation: x.detail || x.label });
    }
    for (const r of seg.review ?? []) items.push({ kind: "language", spoken: r.word, correct: r.correct, explanation: r.reason });
    if (!items.length) continue;

    const segNorm = words(seg.speechmaticsText).map(normWord).filter(Boolean);
    const spanStart = findSpan(norm, segNorm, cursor);
    const spanEnd = spanStart >= 0 ? Math.min(tokens.length, spanStart + segNorm.length + 2) : -1;
    if (spanStart >= 0) cursor = spanStart + Math.max(1, segNorm.length - 1);
    let searchFrom = spanStart;

    for (const it of items) {
      let at = -1;
      if (it.kind !== "omitted" && spanStart >= 0) {
        const key = normWord(it.spoken);
        for (let i = searchFrom; i < spanEnd; i++) {
          if (norm[i] === key && (!marks[i] || marks[i]!.kind === "filler")) { at = i; break; }
        }
        if (at >= 0 && it.kind === "language") searchFrom = at + 1;      // keep reading order within the sentence
      }
      const n = add({ ...it, segmentId: seg.id, inTranscript: at >= 0 });
      if (at >= 0) {
        marks[at] = {
          kind: "language",
          mistakes: [n],
          title: it.kind === "inserted" ? `كلمة زائدة: ${it.explanation}` : `${it.correct ? `الصواب: ${it.correct}\n` : ""}${it.explanation}`,
        };
      }
    }
  }

  // filler words / phrases
  const found: Record<string, number> = {};
  const phrases = [...new Set(fillers.map((f) => f.trim()).filter(Boolean))]
    .map((f) => ({ text: f, parts: words(f).map(normWord) }))
    .sort((a, b) => b.parts.length - a.parts.length);             // longest first ("يعني هو" before "يعني")
  for (let i = 0; i < norm.length; i++) {
    for (const p of phrases) {
      if (!p.parts.length || i + p.parts.length > norm.length) continue;
      if (p.parts.every((w, j) => norm[i + j] === w)) {
        for (let j = 0; j < p.parts.length; j++) {
          if (!marks[i + j]) marks[i + j] = { kind: "filler", mistakes: [], title: "كلمة حشو / تردد" };
        }
        found[p.text] = (found[p.text] ?? 0) + 1;
        i += p.parts.length - 1;
        break;
      }
    }
  }

  return { tokens, marks, mistakes, fillers: found };
}
