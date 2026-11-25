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
# Stimmensätze: "m" = nur Alex (Standard), "mix" = Dora und Alex im Wechsel
VOICE_SETS = ["m", "mix"]
SPEEDS = {"n": 0.92, "s": 0.68}   # normal / langsam
PAD = 0.30                        # Stille zwischen Clips (Sekunden)
MARGIN = 0.10                     # Sicherheitsrand beim Abspielen
SR = 24000
BITRATE = "32k"


def build_items(unit, vset="mix"):
    """Erzeugt die Liste aller Lern-Items einer Einheit mit Stimme."""
    m = vset == "m"
    items = []
    uid = unit["id"]
    for i, (es, de) in enumerate(unit["vocab"], 1):
        items.append(dict(id=f"{uid}-v{i:02d}", kind="vocab", es=es, de=de,
                          voice=VOICE_M if m or i % 2 == 0 else VOICE_F))
    for i, (es, de) in enumerate(unit["phrases"], 1):
        items.append(dict(id=f"{uid}-p{i:02d}", kind="phrase", es=es, de=de,
                          voice=VOICE_M if m or i % 2 else VOICE_F))
    for i, (spk, es, de) in enumerate(unit["dialogue"], 1):
        items.append(dict(id=f"{uid}-d{i:02d}", kind="dialogue", es=es, de=de, speaker=spk,
                          voice=VOICE_M if m or spk == "B" else VOICE_F))
    return items


def tts_text(es):
    # Kokoro liest Wörter ohne Satzzeichen manchmal abgehackt, ein Punkt hilft.
    t = es.strip()
    if t[-1] not in ".!?…":
        t += "."
    return t


# Laute, bei denen die Stimme sofort einsetzt (Vokale, stummes h, Nasale, l, r, b/d/g …)
VOICED = set("aeiouáéíóúmnɲlʎʝbdgɾrβðɣwj")


def clean_onset(x, phonemes):
    """Entfernt das Atem-/Zischgeräusch, das Kokoro manchmal vor dem ersten Laut erzeugt.

    Ohne diese Korrektur klingt z. B. „hola“ wie „sch-ola“. Nur bei stimmhaftem Anlaut:
    echte Zischlaute (s, z, j, f, ch) und Verschlusslaute (p, t, k) bleiben unangetastet.
    """
    import numpy as np
    p = phonemes.lstrip("ˈˌ ¡¿\"")
    if not p or p[0] not in VOICED:
        return x
    fr = 240  # 10 ms
    q = np.fft.rfftfreq(fr, 1 / SR)
    def voiced(i):
        f = x[i:i + fr]
        if len(f) < fr:
            return False
        rms = float(np.sqrt(np.mean(f ** 2)))
        sp = np.abs(np.fft.rfft(f * np.hanning(fr))) ** 2
        return rms > 0.006 and sp[q > 3000].sum() / max(sp.sum(), 1e-12) < 0.1

    # Stimmeinsatz = zwei stimmhafte 10-ms-Fenster hintereinander (5-ms-Raster)
    v = next((i for i in range(0, min(len(x) - 2 * fr, SR // 3), fr // 2)
              if voiced(i) and voiced(i + fr)), None)
    if v is None:
        return x
    y = x[max(0, v - 120):].copy()  # 5 ms vor dem Stimmeinsatz
    n = min(len(y), 240)
    y[:n] *= np.linspace(0, 1, n, dtype=y.dtype)  # 10 ms weich einblenden
    return y


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
        return clean_onset(data, self.k.tokenizer.phonemize(text, self.lang))


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
            for vs in VOICE_SETS:
                audio[vs] = {}
                for sk in SPEEDS:
                    mp3 = APP / "audio" / f"{u['id']}-{vs}-{sk}.mp3"
                    clips = build_sprite(synth, build_items(u, vs), sk, mp3)
                    audio[vs][sk] = dict(file=f"audio/{mp3.name}", clips=clips)
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
