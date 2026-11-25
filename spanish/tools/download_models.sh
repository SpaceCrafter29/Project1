#!/usr/bin/env bash
# Lädt die kostenlosen Sprachmodelle herunter. Nur nötig, um die Audios neu zu bauen
# (oder für Live-Sprachausgabe). Die fertigen Kurs-Audios liegen schon in spanish/app/audio.
#
#   XTTS-v2        Sprachausgabe (Coqui Public Model License: nur nicht-kommerziell)  ~1,9 GB
#   Whisper medium Qualitätsprüfung der Clips (MIT)                                   ~1,5 GB
#   Kokoro-82M     optionale schnelle Live-Sprachausgabe im lokalen Server (Apache 2.0) ~350 MB
set -euo pipefail
M="$(cd "$(dirname "$0")/.." && pwd)/models"
get() { mkdir -p "$(dirname "$2")"; [ -s "$2" ] || { echo "Lade $(basename "$2") …"; curl -L --fail -o "$2" "$1"; }; }

HF=https://huggingface.co
for f in config.json vocab.json speakers_xtts.pth model.pth; do
  get "$HF/coqui/XTTS-v2/resolve/main/$f" "$M/xtts/$f"
done
for f in config.json model.bin tokenizer.json vocabulary.txt; do
  get "$HF/Systran/faster-whisper-medium/resolve/main/$f" "$M/whisper-medium/$f"
done
if [ "${1:-}" = "--kokoro" ]; then
  K=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
  get "$K/kokoro-v1.0.onnx" "$M/kokoro/kokoro-v1.0.onnx"
  get "$K/voices-v1.0.bin" "$M/kokoro/voices-v1.0.bin"
fi
echo "Fertig: $M"
