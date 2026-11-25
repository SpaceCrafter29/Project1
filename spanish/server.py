#!/usr/bin/env python3
"""Lokaler Server für die Spanisch-App „Hablamos“.

    python3 spanish/server.py            # http://localhost:8765
    python3 spanish/server.py --port 9000 --model gemma3:12b

Was er macht:
  • liefert die Web-App aus spanish/app aus
  • /api/chat   leitet Gespräche an Ollama weiter (lokales LLM, kostenlos)
  • /api/tts    spricht beliebigen spanischen Text mit Kokoro-82M (falls installiert)
  • /api/status sagt der App, was verfügbar ist

Nur Python-Standardbibliothek nötig. Für Live-Sprachausgabe der KI-Antworten
zusätzlich: pip install kokoro-onnx soundfile  (und spanish/tools/download_models.sh)
"""
import argparse
import io
import json
import os
import sys
import threading
import urllib.error
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
APP = ROOT / "app"
MODELS = Path(os.environ.get("KOKORO_DIR", ROOT / "models" / "kokoro"))

OLLAMA = os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/")
if not OLLAMA.startswith("http"):
    OLLAMA = "http://" + OLLAMA
# Reihenfolge der bevorzugten Modelle, falls keins angegeben ist (gute Spanisch-Kenntnisse)
PREFERRED = ["gemma3", "qwen3", "qwen2.5", "llama3.1", "llama3.2", "mistral", "gpt-oss"]

SKELETON_HEAD = (
    '<!doctype html><html lang="de"><head><meta charset="utf-8">'
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
    '<meta name="theme-color" content="#1d48c9"></head><body>'
)

_tts = None
_tts_lock = threading.Lock()
_tts_error = None


def get_tts():
    """Lädt Kokoro beim ersten Gebrauch (dauert ein paar Sekunden)."""
    global _tts, _tts_error
    if _tts or _tts_error:
        return _tts
    with _tts_lock:
        if _tts or _tts_error:
            return _tts
        try:
            from kokoro_onnx import Kokoro
            _tts = Kokoro(str(MODELS / "kokoro-v1.0.onnx"), str(MODELS / "voices-v1.0.bin"))
        except Exception as e:  # nicht installiert oder Modelle fehlen
            _tts_error = str(e)
    return _tts


def tts_available():
    if _tts:
        return True
    if _tts_error:
        return False
    try:
        import importlib.util
        return bool(importlib.util.find_spec("kokoro_onnx")) and (MODELS / "kokoro-v1.0.onnx").exists()
    except Exception:
        return False


def ollama_models():
    try:
        with urllib.request.urlopen(OLLAMA + "/api/tags", timeout=2) as r:
            return [m["name"] for m in json.load(r).get("models", [])]
    except Exception:
        return None


def default_model(models, wanted):
    if wanted:
        return wanted
    for p in PREFERRED:
        for m in models:
            if m.startswith(p):
                return m
    return models[0] if models else ""


class Handler(SimpleHTTPRequestHandler):
    server_version = "Hablamos/1.0"

    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(APP), **kw)

    def log_message(self, fmt, *args):
        if "/api/" in (self.path or ""):
            sys.stderr.write("%s\n" % (fmt % args))

    def end_headers(self):
        if self.path.endswith((".js", ".css", ".html", "/")) or self.path.startswith("/data/"):
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _body(self):
        n = int(self.headers.get("Content-Length") or 0)
        return json.loads(self.rfile.read(n) or b"{}")

    def do_GET(self):
        path = self.path.split("?")[0]
        if path in ("/", "/index.html"):
            html = (APP / "index.html").read_text(encoding="utf-8")
            body = (SKELETON_HEAD + html + "</body></html>").encode()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if path == "/api/status":
            models = ollama_models()
            return self._json(200, {
                "app": "hablamos",
                "ollama": bool(models),
                "models": models or [],
                "defaultModel": default_model(models or [], self.server.model),
                "tts": tts_available(),
            })
        return super().do_GET()

    def do_POST(self):
        path = self.path.split("?")[0]
        if path == "/api/chat":
            return self.chat()
        if path == "/api/tts":
            return self.tts()
        self._json(404, {"error": "unbekannt"})

    def chat(self):
        req = self._body()
        payload = json.dumps({
            "model": req.get("model") or default_model(ollama_models() or [], self.server.model),
            "messages": req.get("messages", []),
            "stream": True,
            "options": {"temperature": 0.7},
        }).encode()
        try:
            up = urllib.request.urlopen(urllib.request.Request(
                OLLAMA + "/api/chat", data=payload, headers={"Content-Type": "application/json"}), timeout=300)
        except urllib.error.HTTPError as e:
            return self._json(502, {"error": f"Ollama: {e.read().decode(errors='ignore')[:300]}"})
        except Exception as e:
            return self._json(502, {"error": f"Ollama nicht erreichbar ({e}). Läuft „ollama serve“?"})
        self.send_response(200)
        self.send_header("Content-Type", "application/x-ndjson")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        try:
            for line in up:
                self.wfile.write(line)
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            pass
        finally:
            up.close()

    def tts(self):
        req = self._body()
        text = (req.get("text") or "").strip()[:1500]
        k = get_tts()
        if not k or not text:
            return self._json(503, {"error": _tts_error or "kein Text"})
        import soundfile as sf
        voice = req.get("voice") if req.get("voice") in ("ef_dora", "em_alex", "em_santa") else "em_alex"
        speed = min(1.2, max(0.6, float(req.get("speed") or 0.92)))
        with _tts_lock:
            samples, sr = k.create(text, voice=voice, speed=speed, lang="es")
            try:  # Hauch/Zischen vor dem ersten Laut entfernen (wie bei den Kurs-Audios)
                sys.path.insert(0, str(ROOT / "tools"))
                from build_course import clean_onset
                samples = clean_onset(samples, k.tokenizer.phonemize(text, "es"))
            except Exception:
                pass
        buf = io.BytesIO()
        sf.write(buf, samples, sr, format="WAV")
        body = buf.getvalue()
        self.send_response(200)
        self.send_header("Content-Type", "audio/wav")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    ap = argparse.ArgumentParser(description="Hablamos – Spanisch lernen")
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--host", default="127.0.0.1", help="0.0.0.0, um vom Handy im WLAN zuzugreifen")
    ap.add_argument("--model", default=os.environ.get("HABLAMOS_MODEL", ""), help="Ollama-Modell, z. B. gemma3:12b")
    args = ap.parse_args()
    srv = ThreadingHTTPServer((args.host, args.port), Handler)
    srv.model = args.model
    models = ollama_models()
    print(f"\n  ¡Hola! Hablamos läuft auf  http://localhost:{args.port}\n")
    print(f"  Ollama:  {'verbunden, Modell: ' + default_model(models, args.model) if models else 'nicht gefunden (KI-Gespräch aus). Starte: ollama serve'}")
    print(f"  Kokoro:  {'bereit für Live-Sprachausgabe' if tts_available() else 'nicht installiert (Browser-Stimme wird genutzt)'}")
    print("  Beenden mit Strg+C\n")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
