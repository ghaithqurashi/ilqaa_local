#!/usr/bin/env python3
"""
Benchmark NAMAA-Space/Cohere-Speech-Tashkeel-2B on the recorded read-aloud clips.

    python run_eval.py --name mac-mps                 # all clips under recordings/
    python run_eval.py --name quick --limit 5         # first 5 clips only
    python run_eval.py --name cpu --device cpu        # force CPU
    python run_eval.py --dry-run --name check         # no model: checks recordings + scoring
    python run_eval.py --rescore results/mac-mps      # re-score saved transcripts (no model)

Writes results/<name>/clips.jsonl (every transcript), summary.json and
report.md. Measures:

  * speed: model load time, latency per clip, real-time factor, memory
  * transcription accuracy against what was actually read (read_as):
    WER without / with vowels, CER, DER (all / word-internal / case endings),
    diacritic coverage
  * error detection against the reference text: for each error type, how many
    planted errors were caught (recall), how many reported errors were real
    (precision), and false alarms on correct readings
"""

import argparse
import csv
import json
import os
import platform
try:
    import resource                 # Unix only (peak memory); not available on Windows
except ImportError:
    resource = None
import statistics
import sys
import time
from collections import Counter, defaultdict
from pathlib import Path

# Windows: when output is redirected (file, pipe, some IDE consoles) Python uses the legacy code page
# and crashes on the emoji / Arabic this code prints. Force UTF-8 output on every platform.
for _stream in (sys.stdout, sys.stderr):
    try:
        if (getattr(_stream, "encoding", "") or "").lower().replace("-", "") != "utf8":
            _stream.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

os.environ.setdefault("PYTORCH_ENABLE_MPS_FALLBACK", "1")   # run unsupported ops on CPU instead of failing

from arabic_diff import diff_reading, rates, transcription_counts

HERE = Path(__file__).resolve().parent
REPO = "NAMAA-Space/Cohere-Speech-Tashkeel-2B"
SR = 16000
ERROR_TYPES = ["letter_error", "word_omitted", "wrong_word", "ending_vowel", "internal_vowel",
               "shadda", "ending_dropped", "word_inserted"]


# ---------------------------------------------------------------------------
# Data
# ---------------------------------------------------------------------------

def load_manifest_rows(root: Path):
    rows = []
    for manifest in sorted(root.glob("**/manifest.csv")):
        with manifest.open(encoding="utf-8", newline="") as f:
            for r in csv.DictReader(f):
                r["path"] = str((manifest.parent / r["file"]).resolve())
                r["expect"] = json.loads(r.get("expect") or "[]")
                r.setdefault("speaker", manifest.parent.name)
                rows.append(r)
    return rows


def load_audio(path: str):
    import librosa
    wav, _ = librosa.load(path, sr=SR, mono=True)
    return wav


# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------

class Transcriber:
    def __init__(self, device: str, dtype: str):
        import torch
        import transformers
        from transformers import AutoProcessor
        try:
            from transformers import CohereAsrForConditionalGeneration as ModelCls
        except ImportError:
            sys.exit("This transformers version has no CohereAsrForConditionalGeneration.\n"
                     "Upgrade it:  pip install -U transformers accelerate")
        self.torch = torch
        self.device = self._pick_device(device)
        self.dtype = self._pick_dtype(dtype)
        print(f"Loading {REPO} on {self.device} ({str(self.dtype).replace('torch.', '')}) – "
              f"the first run downloads the weights…")
        t0 = time.monotonic()
        self.proc = AutoProcessor.from_pretrained(REPO)
        try:
            model = ModelCls.from_pretrained(REPO, dtype=self.dtype)
        except TypeError:                                   # older transformers
            model = ModelCls.from_pretrained(REPO, torch_dtype=self.dtype)
        self.model = model.to(self.device).eval()
        self._sync()
        self.load_seconds = time.monotonic() - t0
        self.versions = {"torch": torch.__version__, "transformers": transformers.__version__}
        self.prompt = self.proc.get_decoder_prompt_ids(language="ar", punctuation=True)

    def _pick_device(self, device):
        t = self.torch
        if device != "auto":
            return device
        if t.cuda.is_available():
            return "cuda"
        if getattr(t.backends, "mps", None) and t.backends.mps.is_available():
            return "mps"
        return "cpu"

    def _pick_dtype(self, dtype):
        t = self.torch
        if dtype != "auto":
            return getattr(t, dtype)
        return t.float32 if self.device == "cpu" else t.bfloat16

    def _sync(self):
        t = self.torch
        if self.device == "cuda":
            t.cuda.synchronize()
        elif self.device == "mps":
            t.mps.synchronize()

    def memory_gb(self):
        t = self.torch
        out = {}
        if self.device == "cuda":
            out["gpu_peak_gb"] = round(t.cuda.max_memory_allocated() / 1e9, 2)
        elif self.device == "mps":
            out["mps_driver_gb"] = round(t.mps.driver_allocated_memory() / 1e9, 2)
        if resource is not None:
            rss = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
            out["process_peak_rss_gb"] = round(rss / (1e9 if sys.platform == "darwin" else 1e6), 2)
        return out

    def _run(self, wav):
        t = self.torch
        feats = self.proc.feature_extractor([wav], sampling_rate=SR, return_tensors="pt",
                                            padding="longest", return_attention_mask=True)
        chunk_index = feats.pop("audio_chunk_index", None)
        dec = t.tensor([self.prompt], dtype=t.long, device=self.device)
        with t.inference_mode():
            out = self.model.generate(
                input_features=feats["input_features"].to(self.device, self.dtype),
                attention_mask=feats["attention_mask"].to(self.device),
                decoder_input_ids=dec,
                max_new_tokens=448,
            )
        kwargs = {"skip_special_tokens": True, "language": "ar"}
        if chunk_index is not None:
            kwargs["audio_chunk_index"] = chunk_index
        text = self.proc.decode(out, **kwargs)
        if isinstance(text, (list, tuple)):
            text = " ".join(str(x) for x in text)
        return text.strip()

    def warmup(self, wav):
        """First call; on dtype/device problems fall back to float32, then to CPU."""
        t = self.torch
        try:
            return self._run(wav)
        except Exception as exc:
            if self.dtype != t.float32:
                print(f"⚠ {self.device}/{self.dtype} failed ({type(exc).__name__}: {str(exc)[:120]}); "
                      f"retrying in float32")
                self.dtype = t.float32
                self.model = self.model.float()
                try:
                    return self._run(wav)
                except Exception as exc2:
                    exc = exc2
            if self.device != "cpu":
                print(f"⚠ {self.device} failed ({type(exc).__name__}: {str(exc)[:120]}); falling back to CPU")
                self.device, self.dtype = "cpu", t.float32
                self.model = self.model.to("cpu").float()
                return self._run(wav)
            raise

    def transcribe(self, wav):
        self._sync()
        t0 = time.monotonic()
        text = self._run(wav)
        self._sync()
        return text, time.monotonic() - t0


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------

def score_clip(c: dict) -> dict:
    truth = diff_reading(c["reference"], c["read_as"])
    pred = diff_reading(c["reference"], c["transcript"])
    c["truth_errors"] = [e.to_dict() for e in truth.errors]
    c["detected_errors"] = [e.to_dict() for e in pred.errors]
    c["unmarked_letters"] = pred.unmarked_letters
    c["counts"] = transcription_counts(c["read_as"], c["transcript"])
    t_keys = Counter(e.key for e in truth.errors)
    p_keys = Counter(e.key for e in pred.errors)
    c["tp"] = [list(k) for k in (t_keys & p_keys).elements()]
    c["fp"] = [list(k) for k in (p_keys - t_keys).elements()]
    c["fn"] = [list(k) for k in (t_keys - p_keys).elements()]
    return c


def summarize(clips: list, meta: dict) -> dict:
    def agg(cs):
        total = Counter()
        for c in cs:
            total.update(c["counts"])
        return rates(total)

    by_type = {t: {"planted": 0, "caught": 0, "missed": 0, "false_alarms": 0} for t in ERROR_TYPES}
    for c in clips:
        for _, t in c["tp"]:
            by_type[t]["planted"] += 1; by_type[t]["caught"] += 1
        for _, t in c["fn"]:
            by_type[t]["planted"] += 1; by_type[t]["missed"] += 1
        for _, t in c["fp"]:
            by_type[t]["false_alarms"] += 1
    for t, d in by_type.items():
        reported = d["caught"] + d["false_alarms"]
        d["recall"] = round(100 * d["caught"] / d["planted"], 1) if d["planted"] else None
        d["precision"] = round(100 * d["caught"] / reported, 1) if reported else None

    tp = sum(len(c["tp"]) for c in clips)
    fp = sum(len(c["fp"]) for c in clips)
    fn = sum(len(c["fn"]) for c in clips)
    correct = [c for c in clips if not c["truth_errors"]]
    planted = [c for c in clips if c["truth_errors"]]
    lat = [c["latency_s"] for c in clips if c.get("latency_s") is not None]
    audio = [c["audio_s"] for c in clips if c.get("audio_s")]

    return {
        "meta": meta,
        "clips": len(clips),
        "speakers": sorted({c["speaker"] for c in clips}),
        "speed": {
            "audio_total_s": round(sum(audio), 1),
            "latency_mean_s": round(statistics.mean(lat), 2) if lat else None,
            "latency_p50_s": round(statistics.median(lat), 2) if lat else None,
            "latency_max_s": round(max(lat), 2) if lat else None,
            "real_time_factor": round(sum(lat) / sum(audio), 3) if lat and audio else None,
        },
        "transcription": agg(clips),
        "transcription_by_speaker": {s: agg([c for c in clips if c["speaker"] == s])
                                     for s in sorted({c["speaker"] for c in clips})},
        "detection": {
            "precision": round(100 * tp / (tp + fp), 1) if tp + fp else None,
            "recall": round(100 * tp / (tp + fn), 1) if tp + fn else None,
            "planted_clips_fully_caught": f"{sum(1 for c in planted if not c['fn'])}/{len(planted)}",
            "correct_clips_with_false_alarm": f"{sum(1 for c in correct if c['fp'])}/{len(correct)}",
            "false_alarms_per_correct_clip": round(sum(len(c['fp']) for c in correct) / len(correct), 2) if correct else None,
            "by_type": {t: d for t, d in by_type.items() if d["planted"] or d["false_alarms"]},
        },
    }


def fmt(v, suffix=""):
    return "–" if v is None else f"{v}{suffix}"


def write_report(path: Path, s: dict, clips: list) -> None:
    m, sp, tr, de = s["meta"], s["speed"], s["transcription"], s["detection"]
    L = [f"# ASR benchmark – {m.get('name', '')}", "",
         f"Model `{REPO}` · device **{m.get('device')}** ({m.get('dtype')}) · {m.get('machine', '')}  ",
         f"{s['clips']} clips from {len(s['speakers'])} speaker(s): {', '.join(s['speakers'])} · "
         f"torch {m.get('versions', {}).get('torch', '–')}, transformers {m.get('versions', {}).get('transformers', '–')}"
         + (" · **DRY RUN (transcript = read_as)**" if m.get("dry_run") else ""), "",
         "## Speed", "",
         "| Model load | Mean latency | Median | Max | Real-time factor | Audio | Memory |",
         "|---|---|---|---|---|---|---|",
         f"| {fmt(m.get('load_seconds'), ' s')} | {fmt(sp['latency_mean_s'], ' s')} | {fmt(sp['latency_p50_s'], ' s')} | "
         f"{fmt(sp['latency_max_s'], ' s')} | {fmt(sp['real_time_factor'])} | {sp['audio_total_s']} s | "
         f"{', '.join(f'{k}={v}' for k, v in (m.get('memory') or {}).items()) or '–'} |", "",
         "Real-time factor = processing time ÷ audio length (below 1 is faster than real time).", "",
         "## Transcription accuracy (vs. what was actually read)", "",
         "| Speaker | WER (no vowels) | WER (with vowels) | CER | DER all | DER inside words | DER case endings | DER on marked letters | Vowel coverage |",
         "|---|---|---|---|---|---|---|---|---|"]
    for name, r in [("**all**", tr)] + list(s["transcription_by_speaker"].items()):
        L.append(f"| {name} | {fmt(r['WER_undiacritized'], '%')} | {fmt(r['WER_diacritized'], '%')} | {fmt(r['CER'], '%')} | "
                 f"{fmt(r['DER_all'], '%')} | {fmt(r['DER_word_internal'], '%')} | {fmt(r['DER_case_endings'], '%')} | "
                 f"{fmt(r['DER_marked_only'], '%')} | {fmt(r['diacritic_coverage'], '%')} |")
    L += ["", "DER counts a missing vowel mark as an error; *DER on marked letters* only counts marks the model "
          "wrote. Pausal endings (sukun at punctuation / end) are not counted.", "",
          "## Mistake detection (transcript compared with the reference text)", "",
          f"Overall precision **{fmt(de['precision'], '%')}**, recall **{fmt(de['recall'], '%')}** · "
          f"clips with planted errors fully caught: **{de['planted_clips_fully_caught']}** · "
          f"correct readings with a false alarm: **{de['correct_clips_with_false_alarm']}** "
          f"({fmt(de['false_alarms_per_correct_clip'])} per clip)", "",
          "| Error type | Planted | Caught | Missed | False alarms | Recall | Precision |",
          "|---|---|---|---|---|---|---|"]
    for t, d in de["by_type"].items():
        L.append(f"| {t} | {d['planted']} | {d['caught']} | {d['missed']} | {d['false_alarms']} | "
                 f"{fmt(d['recall'], '%')} | {fmt(d['precision'], '%')} |")
    L += ["", "## Clips", "", "| Clip | Planted | Detected | Transcript |", "|---|---|---|---|"]
    for c in clips:
        planted = ", ".join(sorted({e["type"] for e in c["truth_errors"]})) or "–"
        detected = "; ".join(e["detail"] or e["type"] for e in c["detected_errors"]) or "–"
        mark = "✅" if not c["fn"] and not c["fp"] else "❌"
        L.append(f"| {mark} {c['speaker']}/{c['item']}/{c['variant']} | {planted} | {detected} | {c['transcript']} |")
    path.write_text("\n".join(L) + "\n", encoding="utf-8")


def print_summary(s: dict) -> None:
    sp, tr, de = s["speed"], s["transcription"], s["detection"]
    print("\n" + "=" * 72)
    print(f"{s['clips']} clips · device {s['meta'].get('device')} ({s['meta'].get('dtype')})"
          + (" · DRY RUN" if s["meta"].get("dry_run") else ""))
    print(f"speed: load {fmt(s['meta'].get('load_seconds'), 's')} · latency mean {fmt(sp['latency_mean_s'], 's')} "
          f"· RTF {fmt(sp['real_time_factor'])} · memory {s['meta'].get('memory')}")
    print(f"transcription: WER {fmt(tr['WER_undiacritized'], '%')} (with vowels {fmt(tr['WER_diacritized'], '%')}) "
          f"· DER {fmt(tr['DER_all'], '%')} (inside words {fmt(tr['DER_word_internal'], '%')}, endings "
          f"{fmt(tr['DER_case_endings'], '%')}) · vowel coverage {fmt(tr['diacritic_coverage'], '%')}")
    print(f"detection: precision {fmt(de['precision'], '%')} · recall {fmt(de['recall'], '%')} · planted fully caught "
          f"{de['planted_clips_fully_caught']} · correct readings with false alarm {de['correct_clips_with_false_alarm']}")
    for t, d in de["by_type"].items():
        print(f"   {t:<15} planted {d['planted']:>3}  caught {d['caught']:>3}  missed {d['missed']:>3}  "
              f"false alarms {d['false_alarms']:>3}")
    print("=" * 72)


# ---------------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--recordings", default=str(HERE / "recordings"), help="folder with <speaker>/manifest.csv")
    ap.add_argument("--name", default=time.strftime("run-%Y%m%d-%H%M"), help="results/<name>/")
    ap.add_argument("--device", default="auto", choices=["auto", "mps", "cuda", "cpu"])
    ap.add_argument("--dtype", default="auto", choices=["auto", "bfloat16", "float16", "float32"])
    ap.add_argument("--limit", type=int, help="only the first N clips")
    ap.add_argument("--speakers", nargs="+", help="only these speakers")
    ap.add_argument("--dry-run", action="store_true", help="skip the model; use read_as as the transcript")
    ap.add_argument("--rescore", help="re-score a previous results folder without running the model")
    args = ap.parse_args()

    if args.rescore:
        out = Path(args.rescore)
        clips = [json.loads(l) for l in (out / "clips.jsonl").read_text(encoding="utf-8").splitlines() if l.strip()]
        meta = json.loads((out / "summary.json").read_text(encoding="utf-8"))["meta"]
        clips = [score_clip(c) for c in clips]
    else:
        rows = load_manifest_rows(Path(args.recordings))
        if args.speakers:
            rows = [r for r in rows if r["speaker"] in args.speakers]
        if args.limit:
            rows = rows[: args.limit]
        if not rows:
            print(f"No clips found under {args.recordings}. Record some first:  python record.py --speaker <name>")
            return 1
        out = HERE / "results" / args.name
        out.mkdir(parents=True, exist_ok=True)
        meta = {"name": args.name, "dry_run": args.dry_run,
                "machine": f"{platform.system()} {platform.release()} {platform.machine()}"
                           + (f" (macOS {platform.mac_ver()[0]})" if sys.platform == "darwin" else "")}

        model = None
        if not args.dry_run:
            model = Transcriber(args.device, args.dtype)
            meta["load_seconds"] = round(model.load_seconds, 1)
            meta["versions"] = model.versions
            print("Warming up…")
            first = model.warmup(load_audio(rows[0]["path"]))
            print(f"   warm-up transcript: {first}")
            meta["device"], meta["dtype"] = model.device, str(model.dtype).replace("torch.", "")
        else:
            meta["device"], meta["dtype"] = "none", "none"

        clips = []
        with (out / "clips.jsonl").open("w", encoding="utf-8") as f:
            for i, r in enumerate(rows, 1):
                wav = load_audio(r["path"])
                if model is not None:
                    text, secs = model.transcribe(wav)
                else:
                    text, secs = r["read_as"], None
                c = {"speaker": r["speaker"], "item": r["item"], "variant": r["variant"], "file": r["path"],
                     "reference": r["reference"], "read_as": r["read_as"], "transcript": text,
                     "audio_s": round(len(wav) / SR, 2), "latency_s": round(secs, 3) if secs is not None else None}
                f.write(json.dumps(c, ensure_ascii=False) + "\n")
                c = score_clip(c)
                clips.append(c)
                flag = "✅" if not c["fn"] and not c["fp"] else "❌"
                print(f"[{i}/{len(rows)}] {flag} {r['speaker']}/{r['item']}/{r['variant']:<9} "
                      f"{fmt(c['latency_s'], 's'):>7}  {text}")
        if model is not None:
            meta["memory"] = model.memory_gb()

    summary = summarize(clips, meta)
    (out / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    write_report(out / "report.md", summary, clips)
    print_summary(summary)
    print(f"Report: {out / 'report.md'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
