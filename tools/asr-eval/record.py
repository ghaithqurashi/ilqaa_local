#!/usr/bin/env python3
"""
Record the read-aloud test set (sentences.json) from the microphone.

    python record.py --speaker ahmed
    python record.py --speaker ahmed --only s01 s05       # just some sentences
    python record.py --speaker ahmed --redo s01/ending    # re-record one clip
    python record.py --list-devices

Each clip is saved as 16 kHz mono WAV in recordings/<speaker>/ and listed in
recordings/<speaker>/manifest.csv. Clips already recorded are skipped, so you
can stop (q) and resume any time.

For clips with a planted error, the line to read already contains the error and
the hint says what to do. Read every word with its full vowels and pause only
at punctuation.

macOS: the first run asks for microphone access for your terminal app
(System Settings → Privacy & Security → Microphone).
"""

import argparse
import csv
import json
import sys
import threading
import time
from pathlib import Path

# Windows: when output is redirected (file, pipe, some IDE consoles) Python uses the legacy code page
# and crashes on the emoji / Arabic this code prints. Force UTF-8 output on every platform.
for _stream in (sys.stdout, sys.stderr):
    try:
        if (getattr(_stream, "encoding", "") or "").lower().replace("-", "") != "utf8":
            _stream.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import numpy as np

HERE = Path(__file__).resolve().parent
SR = 16000
FIELDS = ["file", "speaker", "item", "variant", "reference", "read_as", "expect", "duration_s"]


def load_clips():
    data = json.loads((HERE / "sentences.json").read_text(encoding="utf-8"))
    for item in data["items"]:
        for v in item["variants"]:
            yield {"item": item["id"], "variant": v["id"], "reference": item["reference"],
                   "read_as": v["read_as"], "expect": v["expect"], "hint": v.get("hint", "")}


def read_manifest(path: Path) -> dict:
    if not path.exists():
        return {}
    with path.open(encoding="utf-8", newline="") as f:
        return {(r["item"], r["variant"]): r for r in csv.DictReader(f)}


def write_manifest(path: Path, rows: dict) -> None:
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        w.writeheader()
        for key in sorted(rows):
            w.writerow({k: rows[key].get(k, "") for k in FIELDS})


def record_until_enter(sd, device=None, max_seconds=60) -> np.ndarray:
    chunks, stop = [], threading.Event()

    def callback(indata, frames, t, status):
        chunks.append(indata.copy())

    with sd.InputStream(samplerate=SR, channels=1, dtype="float32", device=device, callback=callback):
        t0 = time.time()
        waiter = threading.Thread(target=lambda: (input(), stop.set()), daemon=True)
        waiter.start()
        while not stop.is_set() and time.time() - t0 < max_seconds:
            time.sleep(0.05)
    if not stop.is_set():
        print(f"   ⏱ Stopped at {max_seconds:.0f}s. Press Enter to continue.")
        stop.wait()
    audio =np.concatenate(chunks)[:, 0] if chunks else np.zeros(0, dtype="float32")
    return audio


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--speaker", help="speaker name/code, e.g. ahmed or student01")
    ap.add_argument("--only", nargs="+", help="only these sentence ids (e.g. s01 s02)")
    ap.add_argument("--variants", nargs="+", help="only these variant ids (e.g. ok ending)")
    ap.add_argument("--redo", nargs="+", default=[], help="re-record these clips, e.g. s01/ending")
    ap.add_argument("--device", type=int, help="input device index (see --list-devices)")
    ap.add_argument("--max-seconds", type=float, default=60, help="stop a clip automatically after this long")
    ap.add_argument("--out", default=str(HERE / "recordings"), help="recordings folder")
    ap.add_argument("--list-devices", action="store_true")
    args = ap.parse_args()

    try:
        import sounddevice as sd
        import soundfile as sf
    except ImportError:
        print("Install the requirements first:  pip install -r requirements.txt")
        return 1

    if args.list_devices:
        print(sd.query_devices())
        return 0
    if not args.speaker:
        ap.error("--speaker is required")

    folder = Path(args.out) / args.speaker
    folder.mkdir(parents=True, exist_ok=True)
    manifest_path = folder / "manifest.csv"
    rows = read_manifest(manifest_path)

    clips = [c for c in load_clips()
             if (not args.only or c["item"] in args.only)
             and (not args.variants or c["variant"] in args.variants)]
    redo = {tuple(r.split("/", 1)) for r in args.redo}
    todo = [c for c in clips if (c["item"], c["variant"]) not in rows or (c["item"], c["variant"]) in redo]

    print(f"\n{len(clips)} clips selected, {len(clips) - len(todo)} already recorded, {len(todo)} to go.")
    print("Read each line exactly as shown, with full vowels; pause only at punctuation.\n")

    for n, c in enumerate(todo, 1):
        key = (c["item"], c["variant"])
        while True:
            print("─" * 70)
            print(f"[{n}/{len(todo)}]  {c['item']}/{c['variant']}"
                  + ("   (correct reading)" if not c["expect"] else f"   PLANTED ERROR: {', '.join(c['expect'])}"))
            if c["hint"]:
                print(f"   ⚠ {c['hint']}")
            print(f"\n      {c['read_as']}\n")
            cmd = input("Enter = start recording   s = skip   q = quit > ").strip().lower()
            if cmd == "q":
                write_manifest(manifest_path, rows)
                print(f"Saved. {len(rows)} clips in {manifest_path}")
                return 0
            if cmd == "s":
                break
            print("🔴 Recording… press Enter when you finish reading.")
            audio = record_until_enter(sd, args.device, args.max_seconds)
            dur = len(audio) / SR
            peak = float(np.abs(audio).max()) if len(audio) else 0.0
            print(f"   {dur:.1f}s, peak level {peak:.2f}")
            if peak < 0.02:
                print("   ⚠ Almost silent – check the microphone permission/device (--list-devices).")
            nxt = input("Enter = keep   r = record again   p = play back > ").strip().lower()
            while nxt == "p":
                sd.play(audio, SR); sd.wait()
                nxt = input("Enter = keep   r = record again   p = play back > ").strip().lower()
            if nxt == "r":
                continue
            fname = f"{c['item']}_{c['variant']}.wav"
            sf.write(folder / fname, audio, SR, subtype="PCM_16")
            rows[key] = {"file": fname, "speaker": args.speaker, "item": c["item"], "variant": c["variant"],
                         "reference": c["reference"], "read_as": c["read_as"],
                         "expect": json.dumps(c["expect"]), "duration_s": f"{dur:.2f}"}
            write_manifest(manifest_path, rows)
            break

    print(f"\nDone. {len(rows)} clips listed in {manifest_path}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\nStopped.")
        sys.exit(1)
