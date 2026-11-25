#!/usr/bin/env python3
"""Baut course.json und die Audio-Dateien der App.

Für jede Einheit werden alle Wörter, Sätze und Dialogzeilen mit Kokoro-82M
(kostenloses Open-Source-TTS, Apache 2.0) gesprochen und pro Einheit und Tempo
zu einer MP3-Datei zusammengefügt ("Audio-Sprite"). course.json enthält die
Start- und Endzeit jedes Clips.

Benutzung:
    python spanish/tools/build_course.py              # alles bauen (mit Cache)
    python spanish/tools/build_course.py --json-only  # nur course.json, ohne Audio
    python spanish/tools/build_course.py --units u01 u02
    python spanish/tools/build_course.py --variant latam   # lateinamerikanische Aussprache (seseo)

Benötigt: pip install kokoro-onnx soundfile numpy, dazu ffmpeg. Die Modelldateien
lädt spanish/tools/download_models.sh herunter.
"""
import argparse
import hashlib
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "course"))
from units_a1 import UNITS_A1  # noqa: E402
from units_a2 import UNITS_A2  # noqa: E402

APP = ROOT / "app"
MODELS = Path(os.environ.get("KOKORO_DIR", ROOT / "models" / "kokoro"))
CACHE = ROOT / ".tts-cache"

VOICE_F = "ef_dora"
VOICE_M = "em_alex"
SPEEDS = {"n": 0.92, "s": 0.68}   # normal / langsam
PAD = 0.30                        # Stille zwischen Clips (Sekunden)
MARGIN = 0.10                     # Sicherheitsrand beim Abspielen
SR = 24000
BITRATE = "32k"


def build_items(unit):
    """Erzeugt die Liste aller Lern-Items einer Einheit mit Stimme."""
    items = []
    uid = unit["id"]
    for i, (es, de) in enumerate(unit["vocab"], 1):
        items.append(dict(id=f"{uid}-v{i:02d}", kind="vocab", es=es, de=de,
                          voice=VOICE_F if i % 2 else VOICE_M))
    for i, (es, de) in enumerate(unit["phrases"], 1):
        items.append(dict(id=f"{uid}-p{i:02d}", kind="phrase", es=es, de=de,
                          voice=VOICE_M if i % 2 else VOICE_F))
    for i, (spk, es, de) in enumerate(unit["dialogue"], 1):
        items.append(dict(id=f"{uid}-d{i:02d}", kind="dialogue", es=es, de=de, speaker=spk,
                          voice=VOICE_F if spk == "A" else VOICE_M))
    return items


def tts_text(es):
    # Kokoro liest Wörter ohne Satzzeichen manchmal abgehackt, ein Punkt hilft.
    t = es.strip()
    if t[-1] not in ".!?…":
        t += "."
    return t


class Synth:
    def __init__(self, lang):
        from kokoro_onnx import Kokoro
        self.k = Kokoro(str(MODELS / "kokoro-v1.0.onnx"), str(MODELS / "voices-v1.0.bin"))
        self.lang = lang

    def wav(self, text, voice, speed):
        import numpy as np
        import soundfile as sf
        key = hashlib.sha1(f"{self.lang}|{voice}|{speed}|{text}".encode()).hexdigest()[:16]
        f = CACHE / f"{key}.wav"
        if not f.exists():
            CACHE.mkdir(parents=True, exist_ok=True)
            samples, sr = self.k.create(text, voice=voice, speed=speed, lang=self.lang)
            assert sr == SR
            # Stille am Anfang und Ende trimmen
            a = np.abs(samples)
            nz = np.where(a > 0.01)[0]
            if len(nz):
                samples = samples[max(0, nz[0] - 600): min(len(samples), nz[-1] + 1200)]
            sf.write(f, samples, sr)
        data, _ = sf.read(f, dtype="float32")
        return data


def build_sprite(synth, items, speed_key, out_mp3):
    import numpy as np
    import soundfile as sf
    pad = np.zeros(int(PAD * SR), dtype="float32")
    parts, pos, clips = [pad], len(pad), {}
    for it in items:
        d = synth.wav(tts_text(it["es"]), it["voice"], SPEEDS[speed_key])
        start = pos / SR
        parts += [d, pad]
        pos += len(d) + len(pad)
        clips[it["id"]] = [round(max(0, start - MARGIN), 3), round(len(d) / SR + 2 * MARGIN, 3)]
    audio = np.concatenate(parts)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        sf.write(tmp.name, audio, SR)
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", tmp.name, "-ac", "1",
                        "-codec:a", "libmp3lame", "-b:a", BITRATE, str(out_mp3)], check=True)
        os.unlink(tmp.name)
    return clips


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json-only", action="store_true")
    ap.add_argument("--units", nargs="*")
    ap.add_argument("--variant", choices=["spain", "latam"], default="spain")
    args = ap.parse_args()

    lang = "es" if args.variant == "spain" else "es-419"
    units = UNITS_A1 + UNITS_A2
    out_json = APP / "data" / "course.json"
    old = {}
    if out_json.exists():
        old = {u["id"]: u for u in json.loads(out_json.read_text())["units"]}

    synth = None if args.json_only else Synth(lang)
    (APP / "audio").mkdir(parents=True, exist_ok=True)
    out_units = []
    for u in units:
        items = build_items(u)
        audio = {}
        todo = synth and (not args.units or u["id"] in args.units)
        if todo:
            for sk in SPEEDS:
                mp3 = APP / "audio" / f"{u['id']}-{sk}.mp3"
                clips = build_sprite(synth, items, sk, mp3)
                audio[sk] = dict(file=f"audio/{mp3.name}", clips=clips)
            print(f"{u['id']}: {len(items)} Clips", flush=True)
        elif u["id"] in old and old[u["id"]].get("audio"):
            audio = old[u["id"]]["audio"]
        for it in items:
            it.pop("voice", None)
        out_units.append(dict(
            id=u["id"], level=u["level"], title=u["title"], goal=u["goal"], grammar=u["grammar"],
            roleplay=u["roleplay"], items=items, audio=audio,
        ))
    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps(dict(version=1, variant=args.variant, units=out_units),
                                   ensure_ascii=False, separators=(",", ":")))
    n = sum(len(u["items"]) for u in out_units)
    print(f"course.json: {len(out_units)} Einheiten, {n} Items")


if __name__ == "__main__":
    main()
