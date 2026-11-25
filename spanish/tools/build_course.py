#!/usr/bin/env python3
"""Baut course.json und die Audio-Dateien der App.

Alle Wörter, Sätze und Dialogzeilen werden mit XTTS-v2 gesprochen (kostenloses
Open-Source-Sprachmodell von Coqui, Lizenz: Coqui Public Model License, nur
nicht-kommerziell). Jeder Clip wird anschließend von Whisper (OpenAI, MIT-Lizenz)
angehört: Nur wenn Whisper genau den Zieltext versteht und vor einem Vokal kein
Hauch zu messen ist, wird der Clip übernommen; sonst wird er neu erzeugt (bis zu
MAX_TRIES Versuche, danach der beste Versuch mit Eintrag im Prüfbericht).

Pro Einheit, Stimme und Tempo entsteht eine MP3-Datei („Audio-Sprite“);
course.json enthält Start und Länge jedes Clips.

Benutzung:
    python spanish/tools/build_course.py                 # alle Stimmen, alle Einheiten
    python spanish/tools/build_course.py --voices m      # nur die männliche Stimme
    python spanish/tools/build_course.py --units u01 u02
    python spanish/tools/build_course.py --json-only     # nur course.json, Audio unverändert

Benötigt (siehe spanish/requirements-audio.txt): coqui-tts[codec], torch,
transformers<5, faster-whisper, soundfile, scipy, ffmpeg. Modelle lädt
spanish/tools/download_models.sh herunter.
"""
import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "course"))
from units_a1 import UNITS_A1  # noqa: E402
from units_a2 import UNITS_A2  # noqa: E402

APP = ROOT / "app"
MODELS = ROOT / "models"
XTTS_DIR = Path(os.environ.get("XTTS_DIR", MODELS / "xtts"))
WHISPER_DIR = Path(os.environ.get("WHISPER_DIR", MODELS / "whisper-medium"))
CACHE = ROOT / ".tts-cache" / "xtts"

# Stimmen der App. „speaker“ ist einer der eingebauten XTTS-v2-Sprecher.
VOICES = {
    "m": dict(label="Männlich", speaker="Ferran Simen"),
    "f": dict(label="Weiblich", speaker="Daisy Studious"),
}
DIALOG_VOICE = {"A": "f", "B": "m"}   # Dialoge immer mit zwei Stimmen
SLOW = 0.75                           # langsames Tempo (Zeitdehnung ohne Tonhöhenänderung)
TEMPERATURE = 0.5
MAX_TRIES = 5
MAX_TRIES_SHORT = 10                  # kurze Wörter: XTTS „plappert“ öfter etwas dazu
PAD = 0.30                            # Stille zwischen Clips (Sekunden)
MARGIN = 0.10                         # Sicherheitsrand beim Abspielen
SR = 24000
BITRATE = "40k"


def build_items(unit):
    uid = unit["id"]
    items = [dict(id=f"{uid}-v{i:02d}", kind="vocab", es=es, de=de) for i, (es, de) in enumerate(unit["vocab"], 1)]
    items += [dict(id=f"{uid}-p{i:02d}", kind="phrase", es=es, de=de) for i, (es, de) in enumerate(unit["phrases"], 1)]
    items += [dict(id=f"{uid}-d{i:02d}", kind="dialogue", es=es, de=de, speaker=spk)
              for i, (spk, es, de) in enumerate(unit["dialogue"], 1)]
    return items


def voice_of(item, vid):
    return VOICES[DIALOG_VOICE[item["speaker"]] if item["kind"] == "dialogue" else vid]["speaker"]


def tts_text(es):
    t = es.strip()
    if t[-1] not in ".!?…":
        t += "."
    return t


def words(s):
    """Normalisierte Wortliste zum Vergleich (ohne Akzente und Satzzeichen, ñ bleibt)."""
    s = unicodedata.normalize("NFD", s.lower()).replace("ñ", "ñ")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-zñ0-9 ]", " ", s).split()


def wer(target, heard):
    a, b = words(target), words(heard)
    d = list(range(len(b) + 1))
    for i in range(1, len(a) + 1):
        p = d[:]
        d[0] = i
        for j in range(1, len(b) + 1):
            d[j] = min(p[j] + 1, d[j - 1] + 1, p[j - 1] + (a[i - 1] != b[j - 1]))
    return d[len(b)] / max(1, len(a))


class Engine:
    """XTTS-v2 zum Sprechen, Whisper zum Prüfen."""

    def __init__(self):
        import torch
        from faster_whisper import WhisperModel
        from TTS.tts.configs.xtts_config import XttsConfig
        from TTS.tts.models.xtts import Xtts
        torch.set_num_threads(os.cpu_count() or 4)
        cfg = XttsConfig()
        cfg.load_json(str(XTTS_DIR / "config.json"))
        self.tts = Xtts.init_from_config(cfg)
        self.tts.load_checkpoint(cfg, checkpoint_dir=str(XTTS_DIR), eval=True)
        self.whisper = WhisperModel(str(WHISPER_DIR), device="cpu", compute_type="int8")
        self.torch = torch
        self.report = []

    def _gen(self, text, speaker, seed):
        import numpy as np
        s = self.tts.speaker_manager.speakers[speaker]
        self.torch.manual_seed(seed)
        out = self.tts.inference(text, "es", s["gpt_cond_latent"], s["speaker_embedding"],
                                 temperature=TEMPERATURE, enable_text_splitting=False)
        return trim(np.asarray(out["wav"], dtype="float32"))

    def _check(self, x, text, cut=False):
        import numpy as np
        from scipy.signal import resample_poly
        segs, _ = self.whisper.transcribe(resample_poly(x, 2, 3).astype("float32"), language="es",
                                          beam_size=5, vad_filter=False, condition_on_previous_text=False,
                                          word_timestamps=cut)
        segs = list(segs)
        heard = " ".join(s.text for s in segs).strip()
        lp = float(np.mean([s.avg_logprob for s in segs])) if segs else -5.0
        lead = breath_ms(x) if starts_with_vowel(text) else 0
        w = wer(text, heard)
        dur = len(x) / SR
        too_long = dur > max_duration(text)
        q = dict(heard=heard, wer=round(w, 3), lp=round(lp, 3), lead=lead, dur=round(dur, 2),
                 ok=w == 0 and lead <= 20 and not too_long)
        if cut:
            q["_words"] = [(ww.word, ww.end) for s in segs for ww in (s.words or [])]
        return q

    def _cut_after_target(self, x, text, q):
        """XTTS spricht nach kurzen Wörtern oft weiter („¡Hola, hola!“). Beginnt das Gehörte
        mit genau dem Zieltext, wird in der Pause danach geschnitten und neu geprüft."""
        import numpy as np
        target = words(text)
        got, end = [], None
        for w_, t_end in q.get("_words", []):
            got += words(w_)
            if got[:len(target)] == target and len(got) >= len(target):
                end = t_end
                break
            if got != target[:len(got)]:
                return None
        if end is None:
            return None
        lo, hi = max(0, int((end - 0.04) * SR)), min(len(x), int((end + 0.35) * SR))
        fr = 480
        if hi - lo < fr:
            return None
        energies = [(float(np.sqrt(np.mean(x[i:i + fr] ** 2))), i) for i in range(lo, hi - fr, 120)]
        _, at = min(energies)
        y = x[:at + fr // 2].copy()
        n = min(len(y), 720)
        y[-n:] *= np.linspace(1, 0, n, dtype=y.dtype)   # 30 ms ausblenden
        q2 = self._check(trim(y), text)
        return (trim(y), q2) if q2["ok"] else None

    def clip(self, text, speaker):
        """Liefert den geprüften Clip (aus dem Cache oder neu erzeugt)."""
        import soundfile as sf
        key = hashlib.sha1(f"xtts2|{speaker}|{TEMPERATURE}|{text}".encode()).hexdigest()[:16]
        f, meta = CACHE / f"{key}.wav", CACHE / f"{key}.json"
        if not f.exists():
            CACHE.mkdir(parents=True, exist_ok=True)
            best = None
            short = len(words(text)) <= 3
            for seed in range(1, (MAX_TRIES_SHORT if short else MAX_TRIES) + 1):
                x = self._gen(spelling(text, seed), speaker, seed)
                q = self._check(x, text, cut=True)
                if not q["ok"]:
                    fixed = self._cut_after_target(x, text, q)
                    if fixed:
                        x, q = fixed
                        q["cut"] = True
                q.pop("_words", None)
                score = q["wer"] * 10 + (q["lead"] > 20) - q["lp"] * 0.1
                if best is None or score < best[0]:
                    best = (score, x, q, seed)
                if q["ok"]:
                    break
            _, x, q, seed = best
            sf.write(f, x, SR)
            meta.write_text(json.dumps(dict(text=text, speaker=speaker, seed=seed, **q), ensure_ascii=False))
        q = json.loads(meta.read_text())
        if not q["ok"]:
            self.report.append(q)
        data, _ = sf.read(f, dtype="float32")
        return data


def max_duration(text):
    """Obergrenze für eine plausible Sprechdauer; länger heißt: das Modell hat weitergeredet."""
    letters = sum(c.isalpha() for c in text)
    pauses = len(re.findall(r"[,.;:?!…]\s+\S", text))
    return 0.45 + 0.09 * letters + 0.35 * pauses


def spelling(text, attempt):
    """Andere Schreibweise je Versuch: ändert, wie XTTS den Text spricht, nicht was."""
    if len(words(text)) > 3 or attempt <= 2:
        return text
    core = text.strip().strip("¡!¿?.…")
    q = text.strip().startswith("¿")
    variants = [core[:1].upper() + core[1:] + ("?" if q else "."),
                ("¿" if q else "¡") + core[:1].upper() + core[1:] + ("?" if q else "!"),
                core + "…"]
    return variants[(attempt - 3) % len(variants)]


def starts_with_vowel(text):
    w = words(text)
    return bool(w) and (w[0][0] in "aeiouh")


def trim(x, thr=0.006):
    import numpy as np
    nz = np.where(np.abs(x) > thr)[0]
    if not len(nz):
        return x
    y = x[max(0, nz[0] - 240): nz[-1] + 960].copy()
    n = min(len(y), 96)
    y[:n] *= np.linspace(0, 1, n, dtype=y.dtype)        # 4 ms ein-/ausblenden gegen Knacken
    y[-n:] *= np.linspace(1, 0, n, dtype=y.dtype)
    return y


def breath_ms(x):
    """Dauer von stimmlosem Rauschen (Hauch) vor dem ersten stimmhaften Laut."""
    import numpy as np
    n = 0
    for i in range(0, len(x) - 480, 240):
        f = x[i:i + 480]
        if np.sqrt(np.mean(f ** 2)) < 0.008:
            continue
        f = f - f.mean()
        ac = np.correlate(f, f, "full")[479:]
        if ac[SR // 400:SR // 70].max() / max(ac[0], 1e-12) > 0.4:
            break
        n += 10
    return n


def build_sprite(engine, items, vid, base):
    """Schreibt <base>-n.mp3 und <base>-s.mp3 und liefert die Clip-Positionen."""
    import numpy as np
    import soundfile as sf
    pad = np.zeros(int(PAD * SR), dtype="float32")
    parts, pos, clips = [pad], len(pad), {}
    for it in items:
        d = engine.clip(tts_text(it["es"]), voice_of(it, vid))
        clips[it["id"]] = [round(max(0, pos / SR - MARGIN), 3), round(len(d) / SR + 2 * MARGIN, 3)]
        parts += [d, pad]
        pos += len(d) + len(pad)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        sf.write(tmp.name, np.concatenate(parts), SR)
        enc = ["-ac", "1", "-codec:a", "libmp3lame", "-b:a", BITRATE]
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", tmp.name, *enc, f"{base}-n.mp3"], check=True)
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", tmp.name, "-filter:a", f"atempo={SLOW}",
                        *enc, f"{base}-s.mp3"], check=True)
        os.unlink(tmp.name)
    slow = {k: [round(s / SLOW, 3), round(d / SLOW, 3)] for k, (s, d) in clips.items()}
    return clips, slow


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json-only", action="store_true")
    ap.add_argument("--units", nargs="*")
    ap.add_argument("--voices", nargs="*", default=list(VOICES))
    args = ap.parse_args()

    units = UNITS_A1 + UNITS_A2
    out_json = APP / "data" / "course.json"
    old = {}
    if out_json.exists():
        old = {u["id"]: u for u in json.loads(out_json.read_text())["units"]}
    engine = None if args.json_only else Engine()
    # Erst in einen Zwischenordner bauen, damit App-Audios und course.json nie auseinanderlaufen
    stage = ROOT / ".tts-cache" / "stage"
    stage.mkdir(parents=True, exist_ok=True)

    out_units = []
    for u in units:
        items = build_items(u)
        audio = {k: v for k, v in (old.get(u["id"], {}).get("audio") or {}).items() if k in VOICES}
        if engine and (not args.units or u["id"] in args.units):
            for vid in args.voices:
                base = stage / f"{u['id']}-{vid}"
                n, s = build_sprite(engine, items, vid, base)
                audio[vid] = dict(n=dict(file=f"audio/{base.name}-n.mp3", clips=n),
                                  s=dict(file=f"audio/{base.name}-s.mp3", clips=s))
            print(f"{u['id']}: {len(items)} Clips · Stimmen {', '.join(args.voices)}", flush=True)
        out_units.append(dict(id=u["id"], level=u["level"], title=u["title"], goal=u["goal"],
                              grammar=u["grammar"], roleplay=u["roleplay"], items=items, audio=audio))
    have = {k for u in out_units for k in u["audio"]}
    voices = [dict(id=k, label=v["label"], speaker=v["speaker"]) for k, v in VOICES.items() if k in have]
    (APP / "audio").mkdir(parents=True, exist_ok=True)
    for f in sorted(stage.glob("*.mp3")):
        os.replace(f, APP / "audio" / f.name)
    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps(dict(version=2, engine="XTTS-v2", voices=voices, units=out_units),
                                   ensure_ascii=False, separators=(",", ":")))
    print(f"course.json: {len(out_units)} Einheiten, {sum(len(u['items']) for u in out_units)} Items")
    if engine and engine.report:
        rep = ROOT / "tools" / "pruefbericht.json"
        uniq = {(r["speaker"], r["text"]): r for r in engine.report}
        rep.write_text(json.dumps(list(uniq.values()), ensure_ascii=False, indent=1))
        print(f"Prüfbericht: {len(uniq)} Clips nicht perfekt → {rep}")


if __name__ == "__main__":
    main()
