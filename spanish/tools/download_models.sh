#!/usr/bin/env bash
# Lädt das kostenlose Sprachmodell Kokoro-82M (Apache 2.0) für die Sprachausgabe herunter.
# Nur nötig, wenn du die Audios neu bauen oder KI-Antworten live vorlesen lassen willst.
# Die Kurs-Audios sind schon fertig im Repo (spanish/app/audio).
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)/models/kokoro"
mkdir -p "$DIR"
BASE=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
for f in kokoro-v1.0.onnx voices-v1.0.bin; do
  if [ ! -s "$DIR/$f" ]; then
    echo "Lade $f …"
    curl -L --fail -o "$DIR/$f" "$BASE/$f"
  fi
done
echo "Fertig: $DIR (ca. 350 MB)"
