/* Hablamos: Spanisch sprechen lernen.
 * Läuft auf zwei Wegen:
 *  1. Lokal über spanish/server.py: KI-Gespräch mit Ollama, live-TTS mit Kokoro,
 *     Spracherkennung über den Browser (Web Speech API).
 *  2. Als claude.ai-Artifact: KI-Gespräch über Claude (sample), Spracherkennung über
 *     dictation, Vorlesen über tts, Fortschritt im db-Speicher.
 * Die Kurs-Audios (Kokoro-82M) sind in beiden Fällen vorab erzeugte MP3-Sprites.
 */
"use strict";

/* ===================== Hilfsfunktionen ===================== */
const $ = (s, r = document) => r.querySelector(s);
function h(tag, attrs, ...kids) {
  const [name, ...cls] = tag.split(".");
  const el = document.createElement(name || "div");
  if (cls.length) el.className = cls.join(" ");
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "style" && typeof v === "object") for (const [p, val] of Object.entries(v)) { if (p.startsWith("--")) el.style.setProperty(p, val); else el.style[p] = val; }
    else if (k === "html") el.innerHTML = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat(Infinity)) if (c != null && c !== false) el.append(c.nodeType ? c : String(c));
  return el;
}
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const DAY = 86400000;
function dayKey(t = Date.now()) { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function toast(msg) { const t = h("div.toast", { role: "status" }, msg); document.body.append(t); setTimeout(() => t.remove(), 2600); }

/** Kleines Markup für Grammatik: **fett**, *kursiv*, Zeilen mit • als Liste. */
function richText(src) {
  const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");
  return src.split(/\n\s*\n/).map((block) => {
    const lines = block.split("\n");
    const out = []; let list = [];
    const flush = () => { if (list.length) { out.push("<ul>" + list.map((l) => `<li>${inline(l)}</li>`).join("") + "</ul>"); list = []; } };
    for (const l of lines) {
      if (/^\s*•\s?/.test(l)) list.push(l.replace(/^\s*•\s?/, ""));
      else { flush(); if (l.trim()) out.push(`<p>${inline(l)}</p>`); }
    }
    flush();
    return out.join("");
  }).join("");
}

/* ---------- Textvergleich ---------- */
const PUNCT = /[¿?¡!.,;:…"«»“”()—–\-]/g;
function normStrict(s) { return s.toLowerCase().replace(PUNCT, " ").replace(/\s+/g, " ").trim(); }
function stripAccents(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").normalize("NFC"); }
// ñ bleibt bei loose erhalten (NFD trennt ñ in n + Tilde, deshalb Sonderbehandlung)
function normLoose(s) { return stripAccents(normStrict(s).replace(/ñ/g, "\u0001")).replace(/\u0001/g, "ñ"); }
function normBare(s) { return stripAccents(normStrict(s)); }
function lev(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
const ARTICLES = /^(el|la|los|las|un|una|unos|unas)\s+/;
/** Prüft eine getippte Antwort. Gibt {ok, note} zurück. */
function checkAnswer(input, target, kind) {
  const variants = [target];
  if (kind === "vocab") variants.push(target.replace(ARTICLES, ""));
  const si = normStrict(input), li = normLoose(input), bi = normBare(input);
  if (!si) return { ok: false };
  for (const t of variants) if (si === normStrict(t)) return { ok: true };
  for (const t of variants) if (li === normLoose(t)) return { ok: true, note: "Achte auf die Akzente: " + target };
  for (const t of variants) if (bi === normBare(t)) return { ok: true, note: "Achte auf ñ und Akzente: " + target };
  for (const t of variants) {
    const lt = normLoose(t), d = lev(li, lt);
    if ((lt.length >= 6 && d === 1) || (lt.length >= 16 && d <= 2)) return { ok: true, note: "Kleiner Tippfehler. Richtig: " + target };
  }
  return { ok: false };
}

/* ---------- Zahlen → Wörter (für Spracherkennung, die Ziffern liefert) ---------- */
const N0 = "cero uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciséis diecisiete dieciocho diecinueve veinte veintiuno veintidós veintitrés veinticuatro veinticinco veintiséis veintisiete veintiocho veintinueve".split(" ");
const N10 = { 3: "treinta", 4: "cuarenta", 5: "cincuenta", 6: "sesenta", 7: "setenta", 8: "ochenta", 9: "noventa" };
const N100 = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];
function numToEs(n) {
  if (n < 30) return N0[n];
  if (n < 100) return N10[Math.floor(n / 10)] + (n % 10 ? " y " + N0[n % 10] : "");
  if (n === 100) return "cien";
  if (n < 1000) return N100[Math.floor(n / 100)] + (n % 100 ? " " + numToEs(n % 100) : "");
  if (n < 10000) return (n < 2000 ? "mil" : numToEs(Math.floor(n / 1000)) + " mil") + (n % 1000 ? " " + numToEs(n % 1000) : "");
  return String(n);
}
const digitsToWords = (s) => s.replace(/\d+/g, (d) => " " + numToEs(parseInt(d, 10)) + " ");

/** Vergleicht Gesprochenes mit dem Zielsatz auf Wortebene (LCS). */
function scoreSpeech(heard, target) {
  const T = normBare(target).split(" ").filter(Boolean);
  const H = normBare(digitsToWords(heard)).split(" ").filter(Boolean);
  const dp = Array.from({ length: T.length + 1 }, () => new Array(H.length + 1).fill(0));
  for (let i = T.length - 1; i >= 0; i--) for (let j = H.length - 1; j >= 0; j--)
    dp[i][j] = T[i] === H[j] || lev(T[i], H[j]) <= (T[i].length > 5 ? 1 : 0) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const hit = new Array(T.length).fill(false);
  let i = 0, j = 0;
  while (i < T.length && j < H.length) {
    if ((T[i] === H[j] || lev(T[i], H[j]) <= (T[i].length > 5 ? 1 : 0)) && dp[i][j] === dp[i + 1][j + 1] + 1) { hit[i] = true; i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++;
  }
  const words = target.split(/\s+/).filter(Boolean);
  // Wörter des Originals (mit Satzzeichen) auf normalisierte Tokens abbilden
  let k = 0;
  const marked = words.map((w) => { const n = normBare(w); if (!n) return { w, ok: true }; const ok = hit[k] ?? false; k++; return { w, ok }; });
  return { score: T.length ? hit.filter(Boolean).length / T.length : 0, marked };
}

/* ===================== Zustand & Speicher ===================== */
const STORE_KEY = "hablamos.v1";
const BOX_DAYS = [0, 1, 2, 4, 8, 16, 32, 64, 120];
function freshState() {
  return { v: 1, updated: 0, items: {}, days: {}, chat: {}, settings: { goal: 60, slow: false, model: "", autoplay: true } };
}
let S = freshState();
function loadLocal() {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) S = Object.assign(freshState(), JSON.parse(raw)); } catch (e) { /* privates Fenster o. ä. */ }
  S.settings = Object.assign(freshState().settings, S.settings || {});
}
let saveTimer = null;
function save() {
  S.updated = Date.now();
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* ignorieren */ }
  Sync.schedule();
  renderTopStats();
}
function today() {
  const k = dayKey();
  return (S.days[k] ||= { xp: 0, lesson: 0, review: 0, talk: 0, listen: false, secs: 0 });
}
function addXP(n) { today().xp += n; }
function streak() {
  let s = 0, t = Date.now();
  if (!(S.days[dayKey(t)]?.xp > 0)) t -= DAY; // heute noch nichts gemacht: ab gestern zählen
  while (S.days[dayKey(t)]?.xp > 0) { s++; t -= DAY; }
  return s;
}
const itemState = (id) => S.items[id];
function dueItems() {
  const now = Date.now();
  return Object.entries(S.items).filter(([, st]) => st.due <= now).map(([id]) => ITEMS.get(id)).filter(Boolean);
}

/** Synchronisierung mit dem db-Speicher des Artifacts (nur wenn verfügbar). */
const Sync = {
  ref: null, busy: false, pending: false, timer: null,
  async init() {
    try {
      if (!window.claude?.use) return;
      const [db, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]);
      if (!db || !user) return;
      const id = await user.id();
      if (!id) return;
      this.ref = db.doc(`data/users/${id}/progress`);
      const snap = await this.ref.get();
      if (snap.exists) {
        const remote = snap.data();
        if ((remote.updated || 0) > (S.updated || 0) && remote.json) {
          S = Object.assign(freshState(), JSON.parse(remote.json));
          try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* */ }
          route();
          toast("Fortschritt synchronisiert");
        } else if ((S.updated || 0) > (remote.updated || 0)) this.schedule();
      } else if (S.updated) this.schedule();
    } catch (e) { console.warn("Sync nicht verfügbar", e); this.ref = null; }
  },
  schedule() {
    if (!this.ref) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.push(), 3000);
  },
  async push() {
    if (!this.ref) return;
    if (this.busy) { this.pending = true; return; }
    this.busy = true;
    try { await this.ref.set({ updated: S.updated, json: JSON.stringify(S) }); }
    catch (e) { console.warn("Sync-Fehler", e); }
    this.busy = false;
    if (this.pending) { this.pending = false; this.push(); }
  },
};

/* ===================== Kursdaten ===================== */
let COURSE = null;
const ITEMS = new Map(); // id -> item (mit unit-Referenz)
async function loadCourse() {
  const r = await fetch("data/course.json");
  COURSE = await r.json();
  for (const u of COURSE.units) for (const it of u.items) { it.unit = u.id; ITEMS.set(it.id, it); }
}
const unitById = (id) => COURSE.units.find((u) => u.id === id);
function unitProgress(u) {
  let seen = 0, master = 0;
  for (const it of u.items) { const st = S.items[it.id]; if (st) { seen++; if (st.b >= 4) master++; } }
  return { seen, master, total: u.items.length, pct: Math.round((seen / u.items.length) * 100) };
}
function nextUnit() { return COURSE.units.find((u) => unitProgress(u).seen < u.items.length) || COURSE.units[COURSE.units.length - 1]; }
const unitNo = (u) => parseInt(u.id.slice(1), 10);

/* ===================== Audio ===================== */
const ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>';
const ICON_SLOW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 17h15a3 3 0 0 0 3-3v-1a2 2 0 0 0-2-2h-1"/><path d="M6 17a6 6 0 1 1 12 0"/><path d="M8 17v2M15 17v2"/></svg>';
const ICON_MIC = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11h-2z"/></svg>';
const ICON_SEND = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 20.5 21 12 3 3.5v6.6l12 1.9-12 1.9z"/></svg>';

const Audio_ = {
  ctx: null, buffers: new Map(), loading: new Map(), current: null, el: null,
  ensureCtx() {
    if (!this.ctx) { const C = window.AudioContext || window.webkitAudioContext; if (C) this.ctx = new C(); }
    if (this.ctx?.state === "suspended") this.ctx.resume();
    return this.ctx;
  },
  async load(unitId, speed) {
    const u = unitById(unitId); const a = u?.audio?.[speed];
    if (!a) return null;
    const key = a.file;
    if (this.buffers.has(key)) return this.buffers.get(key);
    if (!this.loading.has(key)) this.loading.set(key, (async () => {
      const ctx = this.ensureCtx();
      const data = await (await fetch(a.file)).arrayBuffer();
      const buf = await new Promise((res, rej) => ctx.decodeAudioData(data, res, rej));
      this.buffers.set(key, buf);
      return buf;
    })().catch((e) => { this.loading.delete(key); throw e; }));
    return this.loading.get(key);
  },
  preload(unitIds) { for (const id of new Set(unitIds)) this.load(id, S.settings.slow ? "s" : "n").catch(() => {}); },
  stop() {
    try { this.current?.stop(); } catch (e) { /* */ }
    this.current = null;
    if (this.el) { this.el.pause(); this.el = null; }
    window.speechSynthesis?.cancel();
    Speak.stopClaude();
  },
  /** Spielt den Clip eines Kurs-Items. speed: "n" oder "s". Resolves, wenn fertig. */
  async play(item, speed, btn) {
    speed ||= S.settings.slow ? "s" : "n";
    this.stop();
    const ctx = this.ensureCtx();
    const u = unitById(item.unit);
    const clip = u?.audio?.[speed]?.clips?.[item.id];
    if (!ctx || !clip) return Speak.say(item.es, { rate: speed === "s" ? 0.7 : 0.95, btn });
    btn?.classList.add("playing");
    try {
      const buf = await this.load(item.unit, speed);
      await new Promise((res) => {
        const src = ctx.createBufferSource();
        src.buffer = buf; src.connect(ctx.destination);
        src.onended = res;
        src.start(0, clip[0], clip[1]);
        this.current = src;
      });
    } catch (e) { console.warn(e); toast("Audio konnte nicht geladen werden"); }
    finally { btn?.classList.remove("playing"); }
  },
};

function playBtn(item, opts = {}) {
  const b = h("button.play" + (opts.big ? ".big" : ""), { "aria-label": opts.slow ? "Langsam abspielen" : "Abspielen", html: opts.slow ? ICON_SLOW : ICON_PLAY });
  b.addEventListener("click", (e) => { e.stopPropagation(); Audio_.play(item, opts.slow ? "s" : undefined, b); });
  return b;
}

/* ===================== Backend & Fähigkeiten ===================== */
const Env = { mode: "web", local: null, caps: {}, ready: false };
async function detectEnv() {
  try {
    const r = await fetch("api/status", { cache: "no-store" });
    if (r.ok) { const j = await r.json(); if (j.app === "hablamos") { Env.mode = "local"; Env.local = j; } }
  } catch (e) { /* kein lokaler Server */ }
  if (Env.mode === "web" && window.claude?.use) {
    const names = ["sample", "dictation", "tts"];
    const res = await Promise.all(names.map((n) => window.claude.use(n).catch(() => null)));
    names.forEach((n, i) => (Env.caps[n] = res[i]));
  }
  Env.ready = true;
}

/** Vorlesen von freiem Text (KI-Antworten): Kokoro lokal → Claude-Stimme → Browser-Stimme. */
const Speak = {
  claudeBusy: false, ctrl: null,
  stopClaude() {
    this.ctrl?.abort(); this.ctrl = null; if (this.claudeBusy) { try { Env.caps.tts?.stop(); } catch (e) { /* */ } this.claudeBusy = false; } },
  available() { return !!(Env.local?.tts || Env.caps.tts || window.speechSynthesis); },
  async say(text, { rate = 1, btn } = {}) {
    Audio_.stop();
    btn?.classList.add("playing");
    const ctrl = (this.ctrl = new AbortController());
    try {
      if (Env.local?.tts) {
        const r = await fetch("api/tts", { method: "POST", signal: ctrl.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, speed: rate < 0.9 ? 0.7 : 0.92 }) });
        if (ctrl.signal.aborted) return;
        if (r.ok) {
          const url = URL.createObjectURL(await r.blob());
          const el = new Audio(url); Audio_.el = el;
          await new Promise((res) => { el.onended = res; el.onerror = res; el.play().catch(res); });
          URL.revokeObjectURL(url);
          return;
        }
      }
      if (Env.caps.tts) {
        this.claudeBusy = true;
        try { await Env.caps.tts.speak(text.slice(0, 2000), { language: "es", rate: Math.max(0.7, rate) }); return; }
        catch (e) { if (e?.code !== "viewer_stopped") console.warn("tts", e); if (e?.code !== "not_granted" && e?.code !== "unavailable") return; }
        finally { this.claudeBusy = false; }
      }
      if (window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "es-ES"; u.rate = rate;
        const v = speechSynthesis.getVoices().find((v) => v.lang?.startsWith("es-ES")) || speechSynthesis.getVoices().find((v) => v.lang?.startsWith("es"));
        if (v) u.voice = v;
        await new Promise((res) => { u.onend = res; u.onerror = res; speechSynthesis.speak(u); });
      }
    } catch (e) { if (e.name !== "AbortError") console.warn("Sprachausgabe", e); }
    finally { btn?.classList.remove("playing"); }
  },
};

/** Spracherkennung: Browser (lokal) oder Claude-Diktat (Artifact). */
const Listen = {
  rec: null, active: false,
  kind() {
    if (Env.mode === "web" && Env.caps.dictation) return "dictation";
    if ((window.SpeechRecognition || window.webkitSpeechRecognition) && (Env.mode === "local" || !window.claude)) return "browser";
    return null;
  },
  available() { return !!this.kind(); },
  /** Muss direkt aus einem Klick aufgerufen werden. onUpdate(text, final) */
  start(onUpdate, onEnd) {
    const kind = this.kind();
    this.active = true;
    if (kind === "browser") {
      const R = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new R(); this.rec = rec;
      rec.lang = "es-ES"; rec.interimResults = true; rec.maxAlternatives = 1; rec.continuous = false;
      let finalText = "";
      rec.onresult = (e) => {
        let interim = ""; finalText = "";
        for (const r of e.results) (r.isFinal ? (finalText += r[0].transcript) : (interim += r[0].transcript));
        onUpdate((finalText + " " + interim).trim(), false);
      };
      rec.onerror = (e) => { if (e.error === "not-allowed") toast("Mikrofon blockiert. Erlaube den Zugriff im Browser."); else if (e.error !== "no-speech" && e.error !== "aborted") toast("Spracherkennung: " + e.error); };
      rec.onend = () => { this.active = false; this.rec = null; onEnd(finalText.trim()); };
      try { rec.start(); } catch (e) { this.active = false; onEnd(""); }
      return;
    }
    if (kind === "dictation") {
      const d = Env.caps.dictation;
      let text = "", partial = "";
      const offs = [
        d.onPartial(({ text: p }) => { partial = p; onUpdate((text + " " + partial).trim(), false); }),
        d.onFinal(({ text: f }) => { text = (text + f).trim(); partial = ""; onUpdate(text, false); }),
        d.onState(({ state, reason }) => {
          if (state === "idle") {
            offs.forEach((f) => f()); this.active = false;
            if (reason === "not_granted") toast("Diktat ist für diese Seite ausgeschaltet.");
            else if (reason === "unavailable") { toast("Diktat ist hier nicht verfügbar."); Env.caps.dictation = null; }
            onEnd((text + " " + partial).trim());
          }
        }),
      ];
      d.start({ language: "es" }).catch((e) => {
        if (e?.code === "unavailable") { Env.caps.dictation = null; }
        if (e?.code === "not_granted") toast("Mikrofon nicht erlaubt. Du kannst stattdessen tippen.");
      });
      return;
    }
    this.active = false; onEnd("");
  },
  stop() {
    if (this.rec) { try { this.rec.stop(); } catch (e) { /* */ } }
    if (Env.caps.dictation && this.active) Env.caps.dictation.stop().catch(() => {});
  },
};

/* ===================== KI-Gesprächspartner ===================== */
const AI = {
  kind() {
    if (Env.mode === "local" && Env.local?.ollama) return "ollama";
    if (Env.caps.sample) return "claude";
    return null;
  },
  label() {
    const k = this.kind();
    if (k === "ollama") return "Ollama · " + (S.settings.model || Env.local.defaultModel || "Modell");
    if (k === "claude") return "Claude";
    return "nicht verbunden";
  },
  system(scn) {
    const lvl = scn.level;
    const lvlRule = {
      A1: "Nivel A1: frases muy cortas y simples, vocabulario básico, solo presente. Máximo 2 frases.",
      A2: "Nivel A2: frases sencillas, puedes usar pretérito perfecto, indefinido y ir a + infinitivo. Máximo 3 frases.",
      B1: "Nivel B1: lenguaje natural de conversación cotidiana, todos los tiempos verbales, expresiones coloquiales de España. Máximo 4 frases.",
    }[lvl] || "";
    return [
      "Eres un compañero de conversación para un estudiante de español cuya lengua materna es el alemán.",
      `Situación del juego de rol: ${scn.roleplay}`,
      "Hablas español de España (usa tú, no usted, salvo que la situación lo pida). Interpreta tu papel con naturalidad y simpatía.",
      lvlRule,
      "Termina casi siempre con una pregunta para que la conversación continúe. No hagas listas. Nunca respondas en alemán en la parte principal.",
      "FORMATO OBLIGATORIO de cada respuesta:",
      "1) Tu respuesta en español (solo texto plano, sin markdown).",
      "2) Una línea que contenga solo: ---",
      "3) Una línea que empiece con 'Korrektur:' y, en alemán, la versión corregida del último mensaje del estudiante con una explicación muy breve de cada error importante. Si no hubo errores o es tu primer mensaje, escribe exactamente 'Korrektur: ✓'.",
      "4) Una línea que empiece con 'Übersetzung:' con la traducción al alemán de tu respuesta en español.",
    ].join("\n");
  },
  /** messages: [{role:'assistant'|'user', content}] – content der KI ist der Rohtext. */
  async reply(scn, messages, onText, signal) {
    const k = this.kind();
    const sys = this.system(scn);
    if (k === "ollama") {
      const r = await fetch("api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal,
        body: JSON.stringify({ model: S.settings.model || Env.local.defaultModel, messages: [{ role: "system", content: sys }, ...(messages.length ? messages : [{ role: "user", content: "(Empieza tú la conversación.)" }])] }),
      });
      if (!r.ok) throw new Error((await r.text()) || "Ollama-Fehler");
      const reader = r.body.getReader(); const dec = new TextDecoder();
      let buf = "", text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
          if (!line) continue;
          try { const j = JSON.parse(line); if (j.error) throw new Error(j.error); if (j.message?.content) { text += j.message.content; onText(text); } } catch (e) { if (e.message && !e.message.startsWith("Unexpected")) throw e; }
        }
      }
      return text;
    }
    if (k === "claude") {
      const input = [{ role: "user", content: sys + "\n\n(Empieza tú la conversación con tu primer mensaje.)" }];
      for (const m of messages) input.push({ role: m.role, content: m.content });
      if (input[input.length - 1].role !== "user") input.push({ role: "user", content: "(Continúa.)" });
      // Claude braucht abwechselnde Rollen; die erste KI-Antwort folgt auf die Anweisung.
      const res = await Env.caps.sample(input, { onText: ({ text }) => onText(text), cache: false, signal });
      return res.text;
    }
    throw new Error("Kein KI-Modell verbunden");
  },
};
function parseAI(t) {
  const parts = t.split(/\n\s*-{3,}\s*(?:\n|$)/);
  const es = (parts[0] || "").trim();
  const rest = parts.slice(1).join("\n");
  let fix = (/Korrektur:\s*([\s\S]*?)(?=\n\s*Übersetzung:|$)/i.exec(rest)?.[1] || "").trim();
  const tr = (/Übersetzung:\s*([\s\S]*)$/i.exec(rest)?.[1] || "").trim();
  if (/^(✓|✔|-|–|keine?\b.*|none|ok)\.?$/i.test(fix)) fix = "";
  return { es, fix, tr };
}

/* ===================== Router ===================== */
const VIEWS = { hoy: viewHoy, kurs: viewKurs, hablar: viewHablar, plan: viewPlan };
function route() {
  if (!COURSE) return;
  const hash = location.hash.slice(1) || "hoy";
  const view = $("#view");
  view.replaceChildren();
  let tab = hash;
  if (hash.startsWith("einheit-")) { tab = "kurs"; viewUnit(view, hash.slice(8)); }
  else (VIEWS[hash] || viewHoy)(view);
  document.querySelectorAll(".tabbar a").forEach((a) => a.classList.toggle("active", a.dataset.tab === tab));
  document.querySelectorAll(".tabbar a").forEach((a) => a.toggleAttribute("aria-current", a.dataset.tab === tab));
  renderTopStats();
  window.scrollTo(0, 0);
}
function renderTopStats() {
  const el = $("#topstats"); if (!el || !COURSE) return;
  el.replaceChildren(
    h("span.chip.sun", { title: "Tage in Folge" }, "🔥 ", String(streak())),
    h("span.chip.acc", { title: "Punkte heute" }, String(today().xp), " XP"),
  );
}

/* ===================== Ansicht: Heute ===================== */
function viewHoy(v) {
  const d = today(), goal = S.settings.goal;
  const nu = nextUnit(), np = unitProgress(nu);
  const due = dueItems().length;
  const seenTotal = Object.keys(S.items).length;
  const hr = new Date().getHours();
  const greet = hr < 12 ? "¡Buenos días!" : hr < 20 ? "¡Buenas tardes!" : "¡Buenas noches!";

  v.append(h("section.card.hero", null,
    h("div.spread", null,
      h("div.stack", { style: { gap: "6px" } },
        h("span.eyebrow", null, greet),
        h("h1", null, seenTotal ? "Weiter geht's." : "Fang heute an."),
        h("p.muted", null, `Tagesziel: ${Math.min(d.xp, goal)} von ${goal} XP`),
      ),
      h("div.ring", { style: { "--p": Math.min(100, Math.round((d.xp / goal) * 100)) }, "aria-hidden": "true" }, h("span", null, `${Math.min(100, Math.round((d.xp / goal) * 100))}%`)),
    ),
    h("div.stack", { style: { gap: "4px" } },
      h("span.eyebrow", null, `Einheit ${unitNo(nu)} · ${nu.level}`),
      h("h2", null, nu.title),
      h("div.bar", { style: { background: "rgba(255,255,255,.25)" } }, h("i", { style: { width: np.pct + "%", background: "var(--sun)" } })),
    ),
    h("button.btn.light.wide", { onclick: () => startLesson(nu) }, np.seen ? "Lektion fortsetzen" : "Erste Lektion starten"),
  ));

  v.append(h("div.grid2", null,
    h("button.card.tap", { onclick: () => (due ? startReview() : toast("Nichts fällig. Mach eine neue Lektion!")) },
      h("span.eyebrow", null, "Wiederholen"),
      h("h3", null, due ? `${due} fällig` : "Alles wiederholt"),
      h("p.small.muted", null, "Das System wiederholt jedes Wort kurz bevor du es vergisst."),
    ),
    h("button.card.tap", { onclick: () => { location.hash = "hablar"; } },
      h("span.eyebrow", null, "Sprechen"),
      h("h3", null, "Rollenspiel mit KI"),
      h("p.small.muted", null, nu.roleplay.split(".")[0] + "."),
    ),
    nu.items.some((i) => i.kind === "dialogue") ? h("button.card.tap", { onclick: () => openDialogue(nu) },
      h("span.eyebrow", null, "Hören"),
      h("h3", null, "Dialog der Einheit"),
      h("p.small.muted", null, "Anhören, mitlesen, dann selbst eine Rolle übernehmen."),
    ) : null,
    h("button.card.tap", { onclick: () => startShadowing() },
      h("span.eyebrow", null, "Aussprache"),
      h("h3", null, "Nachsprechen"),
      h("p.small.muted", null, "Sätze hören und nachsprechen, mit Bewertung."),
    ),
  ));

  // Tagesplan
  const talkDone = d.talk >= 6;
  const checks = [
    { done: d.lesson > 0, t: "Neue Lektion", s: "ca. 15 Minuten · neue Wörter und Sätze" },
    { done: d.review > 0 || (!due && seenTotal > 0), t: "Wiederholung", s: "ca. 10 Minuten · fällige Karten" },
    { done: talkDone, t: "Sprechen", s: "ca. 10 Minuten · mindestens 6 Nachrichten an die KI oder ein Tandem" },
    { done: d.listen, t: "Spanisch hören", s: "ca. 10 Minuten · Podcast, Video oder Serie (Tipps im Plan)", manual: "listen" },
  ];
  v.append(h("section.card", null,
    h("div.spread", null, h("h2", null, "Dein Tagesplan"), h("span.chip" + (checks.every((c) => c.done) ? ".good" : ""), null, `${checks.filter((c) => c.done).length}/4`)),
    h("div.checklist", null, checks.map((c) => h("button.check" + (c.done ? ".done" : ""), {
      onclick: () => {
        if (c.manual) { today()[c.manual] = !today()[c.manual]; if (today()[c.manual]) addXP(10); save(); route(); }
        else if (c.t === "Neue Lektion") startLesson(nu);
        else if (c.t === "Wiederholung") due ? startReview() : toast("Nichts fällig");
        else location.hash = "hablar";
      },
    }, h("span.box", null, c.done ? "✓" : ""), h("span", null, h("b.t", null, c.t), h("br"), h("span.small.muted", null, c.s))))),
  ));

  // Woche
  const now = new Date(); const dow = (now.getDay() + 6) % 7; const monday = Date.now() - dow * DAY;
  const names = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  v.append(h("section.card", null,
    h("div.spread", null, h("h2", null, "Diese Woche"), h("span.muted.small", null, `${seenTotal} Wörter & Sätze gelernt`)),
    h("div.week", null, names.map((n, i) => { const k = dayKey(monday + i * DAY); return h("div", null, h("b" + (S.days[k]?.xp > 0 ? ".on" : "") + (i === dow ? ".today" : ""), { title: `${S.days[k]?.xp || 0} XP` }), n); })),
  ));
}

/* ===================== Ansicht: Kurs ===================== */
function viewKurs(v) {
  v.append(h("div.stack", null, h("h1", null, "Kurs"), h("p.muted", null, "26 Einheiten von A1 bis B1. Arbeite sie der Reihe nach durch, etwa eine pro Woche.")));
  const nu = nextUnit();
  const labels = { A1: "Anfänger", A2: "Grundlagen", B1: "Selbstständig" };
  for (const lvl of ["A1", "A2", "B1"]) {
    v.append(h("div.level-head", null, h("span.level-badge", null, lvl), h("h2", null, labels[lvl])));
    const list = h("div.stack");
    for (const u of COURSE.units.filter((x) => x.level === lvl)) {
      const p = unitProgress(u);
      list.append(h("button.unit" + (u === nu ? ".next" : ""), { onclick: () => (location.hash = "einheit-" + u.id) },
        h("div.tile" + (p.seen === p.total ? ".done" : ""), null, h("span", null, String(unitNo(u)))),
        h("div.meta", null, h("h3", null, u.title), h("div.bar", null, h("i", { style: { width: p.pct + "%" } }))),
        h("span.pct", null, p.pct + " %"),
      ));
    }
    v.append(list);
  }
}

function viewUnit(v, id) {
  const u = unitById(id);
  if (!u) { v.append(h("p", null, "Einheit nicht gefunden.")); return; }
  const p = unitProgress(u);
  v.append(h("div.stack", null,
    h("a.small", { href: "#kurs" }, "← Alle Einheiten"),
    h("span.eyebrow", null, `Einheit ${unitNo(u)} · ${u.level}`),
    h("h1", null, u.title),
    h("p", null, u.goal),
    h("div.row", null, h("span.chip", null, `${p.seen}/${p.total} gelernt`), h("span.chip.good", null, `${p.master} sicher`)),
  ));
  v.append(h("div.grid2", null,
    h("button.btn.wide", { onclick: () => startLesson(u) }, p.seen < p.total ? (p.seen ? "Lektion fortsetzen" : "Lektion starten") : "Einheit üben"),
    u.items.some((i) => i.kind === "dialogue") ? h("button.btn.ghost.wide", { onclick: () => openDialogue(u) }, "Dialog hören") : null,
    h("button.btn.ghost.wide", { onclick: () => { Chat.setScenario(u.id); location.hash = "hablar"; } }, "Rollenspiel mit KI"),
    h("button.btn.ghost.wide", { onclick: () => startShadowing(u) }, "Aussprache üben"),
  ));
  v.append(h("details.card", { open: p.seen === 0 }, h("summary", null, "Grammatik und Tipps"), h("div.grammar", { html: richText(u.grammar) })));
  const sec = (title, kind) => {
    const its = u.items.filter((i) => i.kind === kind);
    if (!its.length) return null;
    return h("section.card", null, h("h2", null, title), h("div.wordlist", null, its.map((it) => {
      const st = S.items[it.id];
      return h("div.word", null, playBtn(it), h("div", null,
        h("div.es", null, kind === "dialogue" ? `${it.speaker}: ${it.es}` : it.es, st ? h("span.dot" + (st.b >= 4 ? ".b4" : ".b1"), { title: st.b >= 4 ? "sicher" : "gelernt" }) : null),
        h("div.de", null, it.de)));
    })));
  };
  v.append(sec("Wörter", "vocab"), sec("Sätze", "phrase"), sec("Dialog", "dialogue"));
  v.append(h("section.card", null, h("span.eyebrow", null, "Rollenspiel"), h("p", null, u.roleplay)));
  Audio_.preload([u.id]);
}

/* ===================== Übungs-Engine ===================== */
let SES = null;
function openSheet() { $("#sheet").hidden = false; document.body.style.overflow = "hidden"; }
function closeSheet() {
  Audio_.stop(); Listen.stop();
  $("#sheet").hidden = true; document.body.style.overflow = "";
  if (SES && !SES.finished) commitSession(SES);
  SES = null; route();
}
$("#sheet-close").addEventListener("click", closeSheet);

function distractors(item, field, n = 3) {
  const sameKind = (i) => (item.kind === "vocab" ? i.kind === "vocab" : i.kind !== "vocab");
  const unit = unitById(item.unit).items.filter((i) => i !== item && sameKind(i));
  const other = shuffle([...ITEMS.values()].filter((i) => i.unit !== item.unit && sameKind(i))).slice(0, 30);
  const seen = new Set([normBare(item[field])]);
  const out = [];
  for (const c of [...shuffle(unit), ...other]) {
    const k = normBare(c[field]);
    if (seen.has(k)) continue;
    seen.add(k); out.push(c[field]);
    if (out.length === n) break;
  }
  return out;
}
function exerciseTypes(item, stage) {
  const voc = item.kind === "vocab";
  const recog = voc ? ["listen_choose", "es_de", "de_es"] : ["listen_choose", "es_de"];
  const prod = voc ? ["type_es", "speak", "listen_type"] : ["tiles", "dictation", "speak", "tiles"];
  if (stage === "recog") return pick(recog);
  if (stage === "prod") return pick(prod);
  return pick([...recog, ...prod]);
}
function newSession(kind, title, queue, extra = {}) {
  SES = { kind, title, queue, done: 0, ok: 0, bad: 0, xp: 0, results: new Map(), started: Date.now(), finished: false, ...extra };
  Audio_.preload(queue.map((q) => q.item.unit));
  openSheet();
  nextStep();
}
function startLesson(u) {
  const fresh = u.items.filter((i) => !S.items[i.id]);
  let newOnes = fresh.slice(0, 7);
  const q = [];
  if (!newOnes.length) {
    // Einheit komplett gesehen: gemischte Übung der ganzen Einheit
    for (const it of shuffle(u.items).slice(0, 12)) q.push({ item: it, type: exerciseTypes(it) });
    return newSession("practice", u.title, q, { unit: u.id });
  }
  // je 2 neue Items einführen, dann üben (Duolingo-artig im Wechsel)
  for (let i = 0; i < newOnes.length; i += 2) {
    const group = newOnes.slice(i, i + 2);
    group.forEach((it) => q.push({ item: it, type: "intro" }));
    group.forEach((it) => q.push({ item: it, type: exerciseTypes(it, "recog") }));
  }
  for (const it of shuffle(newOnes)) q.push({ item: it, type: exerciseTypes(it, "prod") });
  // ein paar fällige Wiederholungen einstreuen
  const due = shuffle(dueItems().filter((i) => !newOnes.includes(i))).slice(0, 3);
  for (const it of due) q.splice(Math.floor(Math.random() * q.length) + 1, 0, { item: it, type: exerciseTypes(it, S.items[it.id].b > 2 ? "prod" : "recog"), review: true });
  newSession("lesson", u.title, q, { unit: u.id });
}
function startReview() {
  const due = shuffle(dueItems()).sort((a, b) => S.items[a.id].b - S.items[b.id].b).slice(0, 15);
  if (!due.length) return toast("Nichts fällig");
  newSession("review", "Wiederholung", due.map((it) => ({ item: it, type: exerciseTypes(it, S.items[it.id].b > 2 ? "prod" : "recog"), review: true })));
}
function startShadowing(u) {
  let pool;
  if (u) pool = u.items.filter((i) => i.kind !== "vocab");
  else {
    const seen = [...ITEMS.values()].filter((i) => S.items[i.id] && i.kind !== "vocab");
    pool = seen.length >= 4 ? seen : nextUnit().items.filter((i) => i.kind !== "vocab");
  }
  newSession("shadow", "Nachsprechen", shuffle(pool).slice(0, 8).map((it) => ({ item: it, type: "speak", shadow: true })));
}
function openDialogue(u) {
  const lines = u.items.filter((i) => i.kind === "dialogue");
  SES = { kind: "dialogue", title: u.title, queue: [], done: 0, ok: 0, bad: 0, xp: 0, results: new Map(), started: Date.now(), unit: u.id, lines };
  Audio_.preload([u.id]);
  openSheet();
  renderDialogue();
}

function grade(item, ok) {
  if (!SES) return;
  const r = SES.results.get(item.id) || { ok: 0, bad: 0 };
  ok ? r.ok++ : r.bad++;
  SES.results.set(item.id, r);
}
/** Übernimmt die Ergebnisse einer Sitzung ins Wiederholungssystem. */
function commitSession(ses) {
  const now = Date.now();
  for (const [id, r] of ses.results) {
    const st = S.items[id] || { b: 0, due: now, n: 0 };
    st.n = (st.n || 0) + 1;
    if (r.bad === 0) { st.b = Math.min(BOX_DAYS.length - 1, (st.b || 0) + 1); st.due = now + BOX_DAYS[st.b] * DAY - 3600000; }
    else { st.b = Math.max(1, (st.b || 1) - 1); st.due = now + (r.ok > 0 ? DAY : 4 * 3600000); }
    S.items[id] = st;
  }
  const d = today();
  if (ses.kind === "lesson" || ses.kind === "practice") d.lesson++;
  if (ses.kind === "review") d.review++;
  d.secs += Math.round((now - ses.started) / 1000);
  addXP(ses.xp);
  save();
}

function setProgress() {
  const total = SES.done + SES.queue.length;
  $("#sheet-progress").style.width = (total ? (SES.done / total) * 100 : 0) + "%";
  $("#sheet-count").textContent = `${SES.done}/${total}`;
}
function nextStep() {
  Audio_.stop();
  const body = $("#sheet-body"), foot = $("#sheet-foot");
  body.replaceChildren(); foot.replaceChildren();
  setProgress();
  if (!SES.queue.length) return finishSession();
  const step = SES.queue[0];
  (EX[step.type] || EX.es_de)(step, body, foot);
  body.querySelector("input,textarea")?.focus({ preventScroll: true });
}
/** Nach einer beantworteten Übung: Feedback zeigen und Weiter-Knopf. */
function resolve(step, ok, { solution, note, xp = 4, retry = true } = {}) {
  const foot = $("#sheet-foot");
  foot.replaceChildren();
  const fb = h("div.feedback." + (ok ? "ok" : "no"), { role: "status" },
    h("b", null, ok ? pick(["¡Muy bien!", "¡Perfecto!", "¡Genial!", "¡Eso es!", "¡Correcto!"]) : "Nicht ganz."),
    !ok && solution ? h("div.sol", null, "Richtig: ", solution) : null,
    note ? h("div.note", null, note) : null,
  );
  if (step.type !== "intro") grade(step.item, ok);
  if (ok) { SES.ok++; SES.xp += xp; } else { SES.bad++; }
  SES.queue.shift();
  SES.done++;
  if (!ok && retry) SES.queue.push({ ...step, type: step.type === "speak" ? "speak" : exerciseTypes(step.item, "recog"), retried: true });
  const next = h("button.btn.wide" + (ok ? ".good" : ".bad"), { onclick: nextStep, "data-primary": "1" }, "Weiter");
  foot.append(fb, next);
  setProgress();
  next.focus({ preventScroll: true });
  if (S.settings.autoplay && step.type !== "listen_choose" && step.type !== "dictation") Audio_.play(step.item);
}
function checkBtn(onCheck, disabled = true) {
  return h("button.btn.wide", { onclick: onCheck, disabled, "data-primary": "1" }, "Prüfen");
}
function audioRow(item) {
  return h("div.row", { style: { justifyContent: "center" } }, playBtn(item, { big: true }), playBtn(item, { slow: true }));
}
function accentBar(input) {
  return h("div.accents", { "aria-label": "Sonderzeichen" }, ["á", "é", "í", "ó", "ú", "ñ", "ü", "¿", "¡"].map((c) =>
    h("button", { type: "button", onclick: () => { const s = input.selectionStart ?? input.value.length; input.value = input.value.slice(0, s) + c + input.value.slice(input.selectionEnd ?? s); input.focus(); input.setSelectionRange(s + 1, s + 1); input.dispatchEvent(new Event("input")); } }, c)));
}

const EX = {
  intro(step, body, foot) {
    const it = step.item;
    body.append(h("div.center", null,
      h("span.prompt-label", null, it.kind === "vocab" ? "Neues Wort" : it.kind === "dialogue" ? `Neu aus dem Dialog (${it.speaker})` : "Neuer Satz"),
      h("div.big-es", null, it.es),
      h("div.big-de.muted", null, it.de),
      audioRow(it),
    ));
    foot.append(h("button.btn.wide", { "data-primary": "1", onclick: () => { SES.queue.shift(); SES.done++; SES.xp += 1; nextStep(); } }, "Verstanden"));
    Audio_.play(it);
  },
  // Hören → deutsche Bedeutung wählen
  listen_choose(step, body, foot) { choice(step, body, foot, { prompt: "Was hörst du?", showEs: false, field: "de", audio: true }); },
  // Spanisch lesen → deutsche Bedeutung wählen
  es_de(step, body, foot) { choice(step, body, foot, { prompt: "Was bedeutet das?", showEs: true, field: "de" }); },
  // Deutsch → spanisches Wort wählen
  de_es(step, body, foot) { choice(step, body, foot, { prompt: "Wie sagt man auf Spanisch?", showDe: true, field: "es" }); },

  type_es(step, body, foot) { typing(step, body, foot, { prompt: "Schreib auf Spanisch", showDe: true }); },
  listen_type(step, body, foot) { typing(step, body, foot, { prompt: "Schreib, was du hörst", audio: true }); },
  dictation(step, body, foot) { typing(step, body, foot, { prompt: "Diktat: Schreib den Satz", audio: true }); },

  tiles(step, body, foot) {
    const it = step.item;
    const words = it.es.replace(/[¿?¡!.,;:…]/g, "").split(/\s+/).filter(Boolean);
    if (words.length < 2 || words.length > 11) return EX.dictation(step, body, foot);
    const extra = shuffle(unitById(it.unit).items.filter((i) => i !== it && i.kind !== "vocab").flatMap((i) => i.es.replace(/[¿?¡!.,;:…]/g, "").split(/\s+/)))
      .filter((w) => !words.some((x) => x.toLowerCase() === w.toLowerCase())).filter((w, i, a) => a.indexOf(w) === i).slice(0, 3);
    const pool = shuffle([...words, ...extra]);
    const line = h("div.answer-line", { "aria-label": "Deine Antwort" });
    const chosen = [];
    const btn = checkBtn(() => {
      const ans = chosen.map((c) => c.w).join(" ");
      const ok = normStrict(ans) === normStrict(words.join(" "));
      const loose = !ok && normLoose(ans) === normLoose(words.join(" "));
      line.querySelectorAll("button").forEach((b) => (b.disabled = true));
      tiles.querySelectorAll("button").forEach((b) => (b.disabled = true));
      resolve(step, ok || loose, { solution: it.es, note: loose ? "Achte auf die Akzente: " + it.es : null });
    });
    const tiles = h("div.tiles", null, pool.map((w) => {
      const b = h("button.wtile", { type: "button" }, w);
      b.addEventListener("click", () => {
        if (b.classList.contains("used")) return;
        b.classList.add("used");
        const t = h("button.wtile", { type: "button" }, w);
        const entry = { w, t, src: b };
        t.addEventListener("click", () => { t.remove(); b.classList.remove("used"); chosen.splice(chosen.indexOf(entry), 1); btn.disabled = !chosen.length; });
        chosen.push(entry); line.append(t); btn.disabled = false;
      });
      return b;
    }));
    body.append(h("span.prompt-label", null, "Bilde den Satz auf Spanisch"), h("div.big-de", null, it.de), line, tiles);
    foot.append(btn);
  },

  speak(step, body, foot) {
    const it = step.item;
    const can = Listen.available();
    const heard = h("div.heard", { "aria-live": "polite" }, can ? "Tippe aufs Mikrofon und sprich." : "");
    body.append(h("div.center", null,
      h("span.prompt-label", null, step.shadow ? "Hör zu und sprich nach" : "Sprich laut"),
      h("div.big-es", null, it.es),
      h("div.muted", null, it.de),
      audioRow(it),
    ));
    if (!can) {
      body.append(h("div.notice", null,
        h("b", null, "Sprich den Satz laut nach."),
        h("span", null, "Spracherkennung ist hier nicht verfügbar (z. B. in der Claude-App auf dem Handy oder in Safari). Hör dir das Original an, sprich mehrmals nach und bewerte dich ehrlich."),
      ));
      foot.append(h("div.grid2", null,
        h("button.btn.ghost.wide", { onclick: () => resolve(step, false, { solution: it.es, retry: !step.shadow }) }, "Nochmal üben"),
        h("button.btn.good.wide", { "data-primary": "1", onclick: () => resolve(step, true, { xp: 4 }) }, "Hat geklappt"),
      ));
      Audio_.play(it);
      return;
    }
    let attempts = 0, best = 0;
    const mic = h("button.mic", { "aria-label": "Aufnahme starten", html: ICON_MIC });
    const skip = h("button.btn.ghost.wide", { onclick: () => resolve(step, false, { solution: it.es, note: "Übersprungen. Versuch es beim nächsten Mal laut.", retry: false }) }, "Gerade nicht sprechen");
    mic.addEventListener("click", () => {
      if (Listen.active) { Listen.stop(); return; }
      Audio_.stop();
      mic.classList.add("on"); heard.textContent = "Ich höre zu …";
      Listen.start((t) => { heard.textContent = t; }, (final) => {
        mic.classList.remove("on");
        if (!final) { heard.textContent = "Nichts verstanden. Nochmal?"; return; }
        attempts++;
        const { score, marked } = scoreSpeech(final, it.es);
        best = Math.max(best, score);
        heard.replaceChildren(...marked.flatMap((m) => [h("span." + (m.ok ? "w-ok" : "w-miss"), null, m.w), " "]));
        const pct = Math.round(score * 100);
        const sc = body.querySelector(".score") || h("div.score");
        sc.textContent = pct + " %";
        body.querySelector(".center").append(sc);
        if (score >= 0.8) resolve(step, true, { xp: 6, note: `Erkannt: „${final}“`, retry: false });
        else if (attempts >= 3) resolve(step, best >= 0.6, { solution: it.es, note: `Erkannt: „${final}“. Rote Wörter noch einmal üben.`, retry: false });
        else toast(pct >= 50 ? "Fast! Achte auf die roten Wörter." : "Hör dir das Original an und versuch es nochmal.");
      });
    });
    body.append(h("div.center", null, mic, heard));
    foot.append(skip);
    Audio_.play(it);
  },
};

function choice(step, body, foot, { prompt, showEs, showDe, field, audio }) {
  const it = step.item;
  const right = it[field];
  const opts = shuffle([right, ...distractors(it, field)]);
  body.append(h("span.prompt-label", null, prompt));
  if (audio) body.append(audioRow(it));
  if (showEs) body.append(h("div.row", null, playBtn(it), h("div.big-es", null, it.es)));
  if (showDe) body.append(h("div.big-de", null, it.de));
  let sel = null;
  const btn = checkBtn(() => {
    const ok = sel.dataset.v === right;
    list.querySelectorAll(".opt").forEach((o) => { o.disabled = true; if (o.dataset.v === right) o.classList.add("right"); else if (o === sel) o.classList.add("wrong"); });
    resolve(step, ok, { solution: field === "de" ? `${it.es} = ${it.de}` : it.es });
  });
  const list = h("div.options", { role: "listbox" }, opts.map((o, i) => h("button.opt", {
    "data-v": o, type: "button",
    onclick: (e) => { list.querySelectorAll(".opt").forEach((x) => x.classList.remove("sel")); sel = e.currentTarget; sel.classList.add("sel"); btn.disabled = false; },
  }, h("kbd", null, String(i + 1)), o)));
  body.append(list);
  foot.append(btn);
  if (audio || showEs) Audio_.play(it);
}
function typing(step, body, foot, { prompt, showDe, audio }) {
  const it = step.item;
  body.append(h("span.prompt-label", null, prompt));
  if (audio) body.append(audioRow(it));
  if (showDe) body.append(h("div.big-de", null, it.de));
  const input = h("input.text", { id: "answer", type: "text", autocomplete: "off", autocapitalize: "off", spellcheck: "false", lang: "es", placeholder: "Auf Spanisch …", "aria-label": "Deine Antwort" });
  const btn = checkBtn(() => {
    const r = checkAnswer(input.value, it.es, it.kind);
    input.disabled = true;
    resolve(step, r.ok, { solution: it.es, note: r.note });
  });
  input.addEventListener("input", () => (btn.disabled = !input.value.trim()));
  body.append(input, accentBar(input));
  foot.append(btn);
  if (audio) Audio_.play(it);
}

function finishSession() {
  SES.finished = true;
  commitSession(SES);
  const body = $("#sheet-body"), foot = $("#sheet-foot");
  const total = SES.ok + SES.bad;
  const acc = total ? Math.round((SES.ok / total) * 100) : 100;
  const mins = Math.max(1, Math.round((Date.now() - SES.started) / 60000));
  body.append(h("div.center", null,
    h("div.brand-tile.big", { "aria-hidden": "true" }),
    h("h1", null, acc >= 90 ? "¡Fantástico!" : acc >= 70 ? "¡Muy bien!" : "¡Sigue así!"),
    h("p.muted", null, SES.kind === "lesson" ? "Lektion geschafft. Die neuen Wörter kommen morgen zur Wiederholung." : "Sitzung beendet."),
  ), h("div.summary-stats", null,
    h("div.stat", null, h("b", null, "+" + SES.xp), h("span", null, "XP")),
    h("div.stat", null, h("b", null, acc + "%"), h("span", null, "richtig")),
    h("div.stat", null, h("b", null, String(mins)), h("span", null, "Min.")),
  ));
  const u = SES.unit && unitById(SES.unit);
  const more = u && unitProgress(u).seen < u.items.length;
  foot.append(
    more ? h("button.btn.wide", { "data-primary": "1", onclick: () => { const uu = u; SES = null; startLesson(uu); } }, "Nächste Lektion") : null,
    h("button.btn.wide" + (more ? ".ghost" : ""), { "data-primary": more ? null : "1", onclick: closeSheet }, "Fertig"),
  );
  setProgress();
}

/* ---------- Dialog-Player ---------- */
function renderDialogue() {
  const body = $("#sheet-body"), foot = $("#sheet-foot");
  body.replaceChildren(); foot.replaceChildren();
  $("#sheet-progress").style.width = "0%"; $("#sheet-count").textContent = "";
  let showDe = false, playing = false;
  const rows = SES.lines.map((it) => h("div.dline", null, h("span.speaker." + it.speaker, null, it.speaker), h("div", null, h("div.es", null, it.es), h("div.de", { hidden: true }, it.de)), playBtn(it)));
  body.append(h("span.prompt-label", null, "Dialog"), h("h2", null, SES.title), h("div.stack", { style: { gap: "2px" } }, rows));
  const playAll = h("button.btn.wide", { "data-primary": "1" }, "Ganzen Dialog abspielen");
  playAll.addEventListener("click", async () => {
    if (playing) { playing = false; Audio_.stop(); return; }
    playing = true; playAll.textContent = "Stopp";
    for (let i = 0; i < SES.lines.length && playing; i++) {
      rows.forEach((r, j) => r.classList.toggle("cur", j === i));
      rows[i].scrollIntoView({ block: "nearest", behavior: "smooth" });
      await Audio_.play(SES.lines[i]);
      await new Promise((r) => setTimeout(r, 350));
    }
    rows.forEach((r) => r.classList.remove("cur"));
    playing = false; playAll.textContent = "Ganzen Dialog abspielen";
    SES.xp = Math.max(SES.xp, 5);
  });
  const tr = h("button.btn.ghost.wide", { onclick: () => { showDe = !showDe; rows.forEach((r) => (r.querySelector(".de").hidden = !showDe)); tr.textContent = showDe ? "Übersetzung ausblenden" : "Übersetzung zeigen"; } }, "Übersetzung zeigen");
  const role = h("button.btn.ghost.wide", { onclick: () => startRole() }, "Rolle B übernehmen");
  foot.append(playAll, h("div.grid2", null, tr, role));
}
function startRole() {
  const lines = SES.lines;
  const q = [];
  lines.forEach((it, i) => { if (it.speaker === "B") q.push({ item: it, type: "respond", prev: lines[i - 1] }); });
  const unit = SES.unit, title = SES.title;
  newSession("role", title, q, { unit });
}
EX.respond = function (step, body, foot) {
  const it = step.item;
  body.append(h("span.prompt-label", null, "Deine Rolle (B)"));
  if (step.prev) body.append(h("div.dline", null, h("span.speaker.A", null, "A"), h("div", null, h("div.es", null, step.prev.es), h("div.de", null, step.prev.de)), playBtn(step.prev)));
  body.append(h("div.stack", null, h("span.muted.small", null, "Antworte auf Spanisch:"), h("div.big-de", null, it.de)));
  const input = h("textarea.text", { id: "answer", rows: 2, lang: "es", placeholder: "Sprich oder tippe deine Antwort …", "aria-label": "Deine Antwort" });
  const btn = checkBtn(() => {
    const r = checkAnswer(input.value, it.es, it.kind);
    const { score } = scoreSpeech(input.value, it.es);
    const ok = r.ok || score >= 0.75;
    input.disabled = true;
    resolve(step, ok, { solution: it.es, note: r.note || (!r.ok && ok ? "Fast wörtlich. Original: " + it.es : null), retry: false });
  });
  input.addEventListener("input", () => (btn.disabled = !input.value.trim()));
  const row = h("div.row", null);
  if (Listen.available()) {
    const mic = h("button.mic", { "aria-label": "Antwort sprechen", html: ICON_MIC, style: { width: "56px", height: "56px" } });
    mic.addEventListener("click", () => {
      if (Listen.active) return Listen.stop();
      Audio_.stop(); mic.classList.add("on");
      Listen.start((t) => { input.value = t; btn.disabled = !t; }, (f) => { mic.classList.remove("on"); if (f) { input.value = f; btn.disabled = false; } });
    });
    row.append(mic);
  }
  row.append(h("button.btn.ghost.sm", { onclick: () => { input.value = it.es; btn.disabled = false; Audio_.play(it); } }, "Lösung zeigen"));
  body.append(input, accentBar(input), row);
  foot.append(btn);
  if (step.prev) Audio_.play(step.prev);
};

/* ===================== Ansicht: Sprechen (KI) ===================== */
const Chat = {
  scenario: "frei", msgs: [], busy: false, ctrl: null,
  setScenario(id) { if (this.scenario !== id) { this.scenario = id; this.msgs = []; } },
  scn() {
    if (this.scenario === "frei") {
      const nu = nextUnit();
      return { id: "frei", level: nu.level, roleplay: "Conversación libre y relajada entre amigos. Pregunta al estudiante por su día, sus planes, sus intereses y por qué aprende español." };
    }
    const u = unitById(this.scenario);
    return { id: u.id, level: u.level, roleplay: u.roleplay + " (Tema de la unidad: " + u.title + ")" };
  },
};
function viewHablar(v) {
  v.append(h("div.stack", null, h("h1", null, "Sprechen"), h("p.muted", null, "Rollenspiele mit einer KI, die dich korrigiert. Sprich oder tippe auf Spanisch.")));
  const kind = AI.kind();
  if (!kind) {
    v.append(h("div.notice", null,
      h("b", null, Env.ready ? "Kein KI-Gesprächspartner verbunden." : "Verbindung wird geprüft …"),
      h("span", null, "Am Mac: starte Ollama und dann ", h("code", null, "python3 spanish/server.py"), ". Online: öffne diese App als claude.ai-Artifact, dann spricht Claude mit dir."),
      h("span", null, "Bis dahin: Nutze die Dialoge der Einheiten mit „Rolle B übernehmen“ und den Nachsprech-Modus."),
    ));
    if (!Env.ready) setTimeout(() => location.hash === "#hablar" && route(), 1500);
    return;
  }
  const sel = h("select.text", { id: "scenario", "aria-label": "Szenario" },
    h("option", { value: "frei", selected: Chat.scenario === "frei" }, "Freies Gespräch"),
    COURSE.units.filter((u) => u.items.some((i) => i.kind !== "vocab") && u.id !== "u00").map((u) => h("option", { value: u.id, selected: Chat.scenario === u.id }, `${unitNo(u)}. ${u.title}`)),
  );
  sel.addEventListener("change", () => { Chat.setScenario(sel.value); route(); });
  const s = Chat.scn();
  const models = Env.local?.models || [];
  const modelSel = kind === "ollama" && models.length > 1 ? h("select.text", { id: "model", "aria-label": "Modell" }, models.map((m) => h("option", { value: m, selected: (S.settings.model || Env.local.defaultModel) === m }, m))) : null;
  modelSel?.addEventListener("change", () => { S.settings.model = modelSel.value; save(); });
  v.append(h("section.card", null,
    h("div.spread", null, h("span.eyebrow", null, "Szenario"), h("span.chip", null, s.level + " · " + AI.label())),
    sel, modelSel,
    h("p.small.muted", null, s.id === "frei" ? "Lockeres Gespräch passend zu deinem Niveau." : unitById(s.id).roleplay),
  ));
  const list = h("div.chat", { "aria-live": "polite" });
  v.append(list);
  const renderMsgs = () => {
    list.replaceChildren();
    Chat.msgs.forEach((m, i) => {
      if (m.role === "user") {
        list.append(h("div.msg.me", null, m.content));
        const fix = Chat.msgs[i + 1]?.parsed?.fix;
        if (fix) list.append(h("div.msg.ai", { style: { background: "var(--sun-soft)", border: "0" } }, h("b.small", null, "Korrektur"), h("span.small", null, fix)));
      } else {
        const p = m.parsed || parseAI(m.content);
        const trEl = h("div.tr", { hidden: true }, p.tr || "–");
        const speakB = h("button", { type: "button" }, "▶ Anhören");
        speakB.addEventListener("click", () => Speak.say(p.es, { rate: S.settings.slow ? 0.75 : 1 }));
        list.append(h("div.msg.ai", null, h("span", { lang: "es" }, p.es || h("span.typing", null, h("i"), h("i"), h("i"))),
          m.streaming ? null : h("div.tools", null, speakB, h("button", { type: "button", onclick: () => (trEl.hidden = !trEl.hidden) }, "Übersetzung")),
          trEl));
      }
    });
  };
  const send = async (text) => {
    if (Chat.busy) return;
    if (text) { Chat.msgs.push({ role: "user", content: text }); today().talk++; addXP(3); save(); }
    const ai = { role: "assistant", content: "", streaming: true };
    Chat.msgs.push(ai); Chat.busy = true; renderMsgs(); list.lastChild?.scrollIntoView({ block: "end", behavior: "smooth" });
    Chat.ctrl = new AbortController();
    try {
      const hist = Chat.msgs.filter((m) => m !== ai).map((m) => ({ role: m.role, content: m.content }));
      const full = await AI.reply(s, hist, (t) => { ai.content = t; ai.parsed = parseAI(t); const last = list.querySelector(".msg.ai:last-child span"); if (last) last.textContent = ai.parsed.es; }, Chat.ctrl.signal);
      ai.content = full; ai.parsed = parseAI(full); ai.streaming = false;
      renderMsgs();
      list.lastChild?.scrollIntoView({ block: "end", behavior: "smooth" });
      if (S.settings.autoplay && ai.parsed.es) Speak.say(ai.parsed.es);
    } catch (e) {
      Chat.msgs.pop(); if (text) Chat.msgs.pop();
      renderMsgs();
      if (e.name !== "AbortError") toast(e.code === "rate_limited" ? "Kurz warten, zu viele Anfragen." : "KI-Fehler: " + (e.message || e.code || e));
      if (text) input.value = text;
    } finally { Chat.busy = false; }
  };
  renderMsgs();
  const input = h("textarea.text", { id: "chat-input", rows: 1, lang: "es", placeholder: "Escribe en español …", "aria-label": "Nachricht" });
  input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendBtn.click(); } });
  const sendBtn = h("button.btn.send", { "aria-label": "Senden", html: ICON_SEND, onclick: () => { const t = input.value.trim(); if (!t) return; input.value = ""; send(t); } });
  const parts = [input];
  if (Listen.available()) {
    const mic = h("button.mic", { "aria-label": "Sprechen", html: ICON_MIC });
    mic.addEventListener("click", () => {
      if (Listen.active) return Listen.stop();
      Audio_.stop(); mic.classList.add("on");
      const before = input.value;
      Listen.start((t) => { input.value = (before + " " + t).trim(); }, (f) => { mic.classList.remove("on"); if (f) input.value = (before + " " + f).trim(); });
    });
    parts.push(mic);
  }
  parts.push(sendBtn);
  if (!Chat.msgs.length) v.append(h("button.btn.wide", { onclick: () => send(null) }, "Gespräch starten"));
  else v.append(h("div.row", null, h("button.btn.ghost.sm", { onclick: () => { Chat.ctrl?.abort(); Chat.msgs = []; route(); } }, "Neues Gespräch")));
  v.append(h("div.composer", null, parts));
}

/* ===================== Ansicht: Plan ===================== */
function viewPlan(v) {
  const seen = Object.keys(S.items).length;
  const hours = Object.values(S.days).reduce((a, d) => a + (d.secs || 0), 0) / 3600;
  v.append(h("div.stack", null,
    h("h1", null, "Dein Plan: in 12 Monaten Spanisch sprechen"),
    h("p.muted", null, "Ziel ist B1: Du kannst dich im Alltag frei unterhalten, über Erfahrungen und Pläne sprechen und deine Meinung begründen."),
  ));
  v.append(h("section.card", null,
    h("span.eyebrow", null, "Niveaustufen (GER)"),
    h("div.cefr", null, ["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => h("div" + (l === "B1" ? ".goal" : l === "A1" || l === "A2" ? ".mid" : ""), null, l))),
    h("p.small.muted", null, "Für B1 brauchst du realistisch etwa 350 bis 450 Stunden. Das sind 45 bis 60 Minuten am Tag über ein Jahr. Konstanz schlägt Intensität: Lieber jeden Tag 45 Minuten als sonntags drei Stunden."),
    h("div.row", null, h("span.chip", null, `${seen} von ${ITEMS.size} Wörtern & Sätzen`), h("span.chip", null, hours < 1 ? `${Math.round(hours * 60)} Min. in der App` : `${hours.toFixed(1).replace(".", ",")} Std. in der App`), h("span.chip.sun", null, `🔥 ${streak()} Tage`)),
  ));
  v.append(h("section.card", null,
    h("h2", null, "Jeder Tag: 45 Minuten"),
    h("div.daily", null,
      h("div", null, h("b", null, "15 Min."), h("span", null, "Neue Lektion in der App (neue Wörter, Sätze, Grammatik)")),
      h("div", null, h("b", null, "10 Min."), h("span", null, "Wiederholen: alle fälligen Karten. Nie auslassen, das ist dein Gedächtnis.")),
      h("div", null, h("b", null, "10 Min."), h("span", null, "Sprechen: Rollenspiel mit der KI oder Nachsprechen. Laut! Jeden Tag.")),
      h("div", null, h("b", null, "10 Min."), h("span", null, "Hören: Podcast, Video oder Serie auf Spanisch (Ideen unten), nebenbei beim Kochen oder Pendeln.")),
    ),
    h("p.small.muted", null, "Wenig Zeit? Die Minimalversion: Wiederholen und 5 Minuten sprechen. So reißt die Serie nicht ab."),
  ));
  const phases = [
    ["Woche 1–2", "Aussprache und erste Sätze", ["Einheit 0 (Aussprache) gründlich, jeden Tag Nachsprechen", "Einheiten 1–2: grüßen, vorstellen, Herkunft", "Ziel: Du kannst dich 30 Sekunden lang vorstellen"]],
    ["Monat 1–3", "A1: Überleben im Alltag", ["Einheiten 3–12, etwa eine pro Woche", "Ab Woche 3 täglich Rollenspiele mit der KI", "Hören: Dreaming Spanish (Superbeginner), Coffee Break Spanish", "Ende Monat 3: 5 Minuten Gespräch über dich, Familie, Alltag"]],
    ["Monat 4–6", "A2: Erzählen und Vergangenheit", ["Einheiten 13–22, die Vergangenheitszeiten in Ruhe (je 1–2 Wochen)", "Ab jetzt einmal pro Woche 30 Minuten mit einem Menschen sprechen: Tandem (Tandem, HelloTalk, Sprachcafé) oder Lehrkraft (italki, Preply)", "Hören: Españolistos, Dreaming Spanish (Beginner/Intermediate), Kinderserien mit spanischen Untertiteln", "Ende Monat 6: Du erzählst, was du am Wochenende gemacht hast"]],
    ["Monat 7–9", "B1-Einstieg: natürlich klingen", ["Einheiten 23–25: Subjuntivo, Füllwörter, Telefon", "Alle Einheiten im Modus „Einheit üben“ wiederholen", "Zweimal pro Woche Gespräch mit Menschen", "Serien auf Spanisch mit spanischen Untertiteln (z. B. Valeria, Las chicas del cable)", "Einmal pro Woche 5 Sätze über deinen Tag schreiben und von der KI korrigieren lassen"]],
    ["Monat 10–12", "B1 festigen", ["Freie Gespräche mit der KI über Nachrichten, Meinungen, Pläne", "Ein einfaches Buch lesen (Lecturas graduadas, Niveau A2/B1)", "Wenn möglich: 1–2 Wochen Sprachreise oder Urlaub in Spanien, nur Spanisch sprechen", "Optional: DELE B1 oder SIELE als Ziel und Nachweis"]],
  ];
  v.append(h("section.card", null, h("h2", null, "Fahrplan"), phases.map(([when, t, list]) =>
    h("div.phase", null, h("div.when", null, when), h("div.what", null, h("h3", null, t), h("ul", null, list.map((x) => h("li", null, x))))))));
  v.append(h("section.card", null,
    h("h2", null, "Jede Woche"),
    h("ul", null,
      h("li", null, "Sonntag: kurzer Selbsttest. Sprich 2 Minuten zum Thema der Woche, nimm dich mit dem Handy auf, hör es dir an."),
      h("li", null, "Neue Einheit erst, wenn die alte zu mindestens 80 % „gelernt“ ist."),
      h("li", null, "Fehler sind Daten, keine Niederlage. Die KI-Korrekturen notierst du dir als eigene Sätze."),
    ),
  ));
  v.append(h("section.card", null,
    h("h2", null, "Kostenlose Zusatzquellen"),
    h("div.tablewrap", null, h("table.res", null,
      h("tr", null, h("th", null, "Was"), h("th", null, "Wofür"), h("th", null, "Ab")),
      h("tr", null, h("td", null, "Dreaming Spanish (YouTube)"), h("td", null, "Verständlicher Input, nach Niveau sortiert"), h("td", null, "Woche 1")),
      h("tr", null, h("td", null, "Coffee Break Spanish (Podcast)"), h("td", null, "Strukturiert, mit Erklärungen auf Englisch"), h("td", null, "A1")),
      h("tr", null, h("td", null, "Españolistos (Podcast)"), h("td", null, "Alltagsthemen langsam gesprochen"), h("td", null, "A2")),
      h("tr", null, h("td", null, "RTVE Play"), h("td", null, "Spanisches Fernsehen und Serien, kostenlos"), h("td", null, "B1")),
      h("tr", null, h("td", null, "Tandem / HelloTalk"), h("td", null, "Muttersprachler zum Austausch"), h("td", null, "A2")),
    )),
  ));
  // Einstellungen
  const goal = h("select.text", { id: "goal", "aria-label": "Tagesziel" }, [30, 60, 100, 150].map((g) => h("option", { value: g, selected: S.settings.goal === g }, `${g} XP pro Tag`)));
  goal.addEventListener("change", () => { S.settings.goal = +goal.value; save(); });
  const toggle = (key, label) => {
    const b = h("button.check" + (S.settings[key] ? ".done" : ""), { type: "button" }, h("span.box", null, S.settings[key] ? "✓" : ""), h("span.t", { style: { textDecoration: "none", color: "var(--ink)" } }, label));
    b.addEventListener("click", () => { S.settings[key] = !S.settings[key]; save(); route(); });
    return b;
  };
  const exportBox = h("textarea.text", { id: "export", rows: 3, readonly: true, hidden: true, "aria-label": "Fortschritts-Code" });
  const importBox = h("textarea.text", { id: "import", rows: 3, hidden: true, placeholder: "Code hier einfügen", "aria-label": "Fortschritts-Code einfügen" });
  const confirmReset = h("div.notice", { hidden: true }, h("b", null, "Wirklich alles löschen?"), h("div.row", null,
    h("button.btn.bad.sm", { onclick: () => { S = freshState(); save(); route(); toast("Fortschritt gelöscht"); } }, "Ja, löschen"),
    h("button.btn.ghost.sm", { onclick: () => (confirmReset.hidden = true) }, "Abbrechen")));
  v.append(h("section.card", null,
    h("h2", null, "Einstellungen"),
    goal,
    h("div.checklist", null, toggle("slow", "Langsame Aussprache als Standard"), toggle("autoplay", "Audio automatisch abspielen")),
    h("p.small.muted", null, `Verbunden: ${Env.mode === "local" ? "lokaler Server" : "Web"} · KI: ${AI.label()} · Spracherkennung: ${Listen.available() ? "ja" : "nein"} · Fortschritt: ${Sync.ref ? "in deinem Konto gespeichert" : "in diesem Browser gespeichert"}`),
    h("div.row", null,
      h("button.btn.ghost.sm", { onclick: () => { exportBox.hidden = false; exportBox.value = btoa(unescape(encodeURIComponent(JSON.stringify(S)))); exportBox.select(); navigator.clipboard?.writeText(exportBox.value).then(() => toast("Code kopiert"), () => {}); } }, "Fortschritt exportieren"),
      h("button.btn.ghost.sm", { onclick: () => { if (importBox.hidden) { importBox.hidden = false; importBox.focus(); return; } try { S = Object.assign(freshState(), JSON.parse(decodeURIComponent(escape(atob(importBox.value.trim()))))); save(); toast("Fortschritt importiert"); route(); } catch (e) { toast("Der Code ist ungültig. Bitte komplett kopieren."); } } }, "Importieren"),
      h("button.btn.ghost.sm", { onclick: () => (confirmReset.hidden = false) }, "Zurücksetzen"),
    ),
    exportBox, importBox, confirmReset,
    h("p.small.muted", null, "Aussprache: Kokoro-82M (Open Source), Stimmen „Dora“ und „Alex“, Spanisch aus Spanien."),
  ));
}

/* ===================== Tastatur & Start ===================== */
document.addEventListener("keydown", (e) => {
  if ($("#sheet").hidden) return;
  if (e.key === "Escape") return closeSheet();
  const typingTarget = e.target.matches?.("input, textarea");
  if (e.key === "Enter" && !(e.target.matches?.("textarea") && e.shiftKey)) {
    const p = $("#sheet-foot [data-primary]:not([disabled])");
    if (p && !(e.target.matches?.("button"))) { e.preventDefault(); p.click(); }
    return;
  }
  if (!typingTarget && /^[1-4]$/.test(e.key)) $$opt(+e.key - 1)?.click();
});
const $$opt = (i) => document.querySelectorAll("#sheet-body .opt")[i];
window.addEventListener("hashchange", route);

(async function boot() {
  loadLocal();
  try { await loadCourse(); }
  catch (e) { $("#boot").replaceChildren(h("p", null, "Der Kurs konnte nicht geladen werden. Läuft der Server?")); return; }
  route();
  await detectEnv();
  if (location.hash === "#hablar" || location.hash === "#plan") route();
  Sync.init();
})();
