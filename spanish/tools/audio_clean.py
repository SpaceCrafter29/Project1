"""Bereinigt den Anfang von TTS-Clips (Hauch oder Zischen vor dem ersten Laut).

Wird vom lokalen Server für die Live-Sprachausgabe mit Kokoro benutzt.
"""
SR = 24000


# Laute, bei denen die Stimme sofort einsetzt (Vokale, stummes h, Nasale, l, r, b/d/g …)
VOICED = set("aeiouáéíóúmnɲlʎʝbdgɾrβðɣwj")


VOWELS = set("aeiouáéíóúwj")  # inkl. hie-/hue- (ʝ/w-Anlaut zählt nicht dazu)


def trim_to_voicing(x):
    """Schneidet bei Vokal-Anlaut alles vor dem Einsatz der schwingenden Stimme ab.

    Kokoro haucht vor Vokalen oft ein deutliches „h“ (hola klang wie mit h). Ein Hauch hat
    keinen Grundton, ein Vokal schon: Gesucht wird das erste Stück mit Grundton (70–400 Hz)
    und ausreichender Lautstärke.
    """
    import numpy as np
    fr, hop = 480, 120  # 20-ms-Fenster, 5-ms-Schritt
    lo, hi = SR // 400, SR // 70
    peak = max(float(np.sqrt(np.mean(x[i:i + fr] ** 2))) for i in range(0, max(1, len(x) - fr), hop))

    def voiced(i):
        f = x[i:i + fr]
        if len(f) < fr:
            return False
        f = f - f.mean()
        rms = float(np.sqrt(np.mean(f ** 2)))
        if rms < 0.15 * peak:
            return False
        ac = np.correlate(f, f, "full")[fr - 1:]
        return ac[lo:hi].max() / max(ac[0], 1e-12) > 0.4

    v = next((i for i in range(0, min(len(x) - 2 * fr, SR // 2), hop) if voiced(i) and voiced(i + hop)), None)
    if v is None:
        return x
    y = x[v:].copy()
    n = min(len(y), 120)
    y[:n] *= np.linspace(0, 1, n, dtype=y.dtype)  # 5 ms weich einblenden
    return y


def clean_onset(x, phonemes):
    """Entfernt das Atem-/Zischgeräusch, das Kokoro manchmal vor dem ersten Laut erzeugt.

    Ohne diese Korrektur klingt z. B. „hola“ wie „sch-ola“. Nur bei stimmhaftem Anlaut:
    echte Zischlaute (s, z, j, f, ch) und Verschlusslaute (p, t, k) bleiben unangetastet.
    """
    import numpy as np
    p = phonemes.lstrip("ˈˌ ¡¿\"")
    if not p or p[0] not in VOICED:
        return x
    if p[0] in VOWELS:
        return trim_to_voicing(x)
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
