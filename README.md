# Project1

## Hablamos: Spanisch sprechen lernen (`spanish/`)

Eine Lern-App im Stil von Duolingo, aber mit Fokus aufs **Sprechen**:

- **26 Einheiten von A1 bis B1** mit 788 Wörtern, Sätzen und Dialogzeilen, Grammatik auf Deutsch erklärt
- **Echte Aussprache:** alle Inhalte mit dem kostenlosen Open-Source-Sprachmodell Kokoro-82M vertont, normal und langsam
- **Übungen:** Hören und wählen, Übersetzen, Satzbau mit Wortkacheln, Tippen und Diktat (mit Akzent-Tastatur), Nachsprechen mit Aussprache-Bewertung, Dialoge mit Rollenübernahme
- **Wiederholung nach dem Lernkarten-Prinzip** (Spaced Repetition): jedes Wort kommt zurück, kurz bevor du es vergisst
- **KI-Gesprächspartner:** Rollenspiele passend zu jeder Einheit, mit Korrekturen und Übersetzung auf Deutsch (lokal über Ollama)
- **Tagesplan, Serie, Lernplan für 12 Monate:** siehe [`spanish/PLAN.md`](spanish/PLAN.md)

### Starten (Mac)

```sh
# 1. KI-Gesprächspartner (einmalig)
brew install ollama
ollama serve &
ollama pull gemma3:12b        # oder qwen3:8b / llama3.1:8b

# 2. App starten (nur Python nötig)
python3 spanish/server.py
# → http://localhost:8765 in Chrome oder Safari öffnen
```

Optional: KI-Antworten mit derselben natürlichen Stimme vorlesen lassen:

```sh
pip install -r spanish/requirements.txt
bash spanish/tools/download_models.sh     # Kokoro-82M, ca. 350 MB
```

Weitere Optionen: `python3 spanish/server.py --model qwen3:8b`, und mit `--host 0.0.0.0` ist die App im WLAN erreichbar.

### Aufbau

| Pfad | Inhalt |
|---|---|
| `spanish/course/units_*.py` | Kursinhalte (Wörter, Sätze, Dialoge, Grammatik, Rollenspiele) |
| `spanish/tools/build_course.py` | erzeugt `app/data/course.json` und die Audios mit Kokoro |
| `spanish/app/` | die Web-App (HTML/CSS/JS, keine Abhängigkeiten) |
| `spanish/server.py` | lokaler Server: App, Ollama-Proxy, Live-Sprachausgabe |

Nach Änderungen an den Inhalten: `python spanish/tools/build_course.py` (baut nur neu, was sich geändert hat).

---

## KI-Assistent (`main.py`)

A local AI assistant using Ollama + LangGraph with tool calling.

```sh
ollama pull llama3.1
ollama serve
uv sync
uv run python main.py
```
