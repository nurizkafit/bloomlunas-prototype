/**
 * AudioView: plays short sound cues and the town ambience (game feel, user 14 Nov 2026).
 * Cues, files, volume and rate come from data/feedback/feedback.json. Files are CC0 (Kenney, assets/audio/kenney/).
 * Web Audio starts on the first click or key (browser autoplay rule). Mute is a viewer setting in localStorage.
 * View only: it never reads or changes GameState. Unity: AudioSource + AudioClip per cue.
 */
export class AudioView {
  /** @param {any} cfg data/feedback/feedback.json */
  constructor(cfg) {
    this.cfg = cfg;
    this.muted = AudioView.#load();
    /** @type {AudioContext|null} */
    this.ctx = null;
    /** @type {HTMLAudioElement|null} */
    this.amb = null;
    this.ambOn = false;
    this.lastClick = 0;
    const unlock = () => { this.#start(); removeEventListener('pointerdown', unlock, true); removeEventListener('keydown', unlock, true); };
    addEventListener('pointerdown', unlock, true);
    addEventListener('keydown', unlock, true);
  }

  /** Play one cue by name. @param {string} name */
  play(name) {
    const s = this.cfg.sounds?.[name];
    if (!s || this.muted || !this.ctx) return;
    if (name === 'click') {
      const now = performance.now();
      if (now - this.lastClick < this.cfg.fx.clickMinGapMs) return;
      this.lastClick = now;
    }
    this.#buffer(s.file).then((buf) => {
      if (!buf || this.muted) return;
      const src = this.ctx.createBufferSource(), g = this.ctx.createGain();
      src.buffer = buf;
      src.playbackRate.value = s.rate ?? 1;
      g.gain.value = s.volume ?? 1;
      src.connect(g).connect(this.ctx.destination);
      src.start();
    });
    if (s.then) setTimeout(() => this.play(s.then), s.thenMs ?? 0);
  }

  /** Town ambience on or off (Do phase only). @param {boolean} on */
  ambience(on) {
    this.ambOn = on;
    this.#syncAmb();
  }

  /** Mute or unmute all sound. @returns {boolean} muted */
  toggle() {
    this.muted = !this.muted;
    try { localStorage.setItem(KEY, this.muted ? '1' : '0'); } catch { /* private window: keep it for this page only */ }
    this.#syncAmb();
    return this.muted;
  }

  #start() {
    if (this.ctx) return;
    const AC = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    for (const s of Object.values(this.cfg.sounds ?? {})) this.#buffer(s.file);
    this.#syncAmb();
  }

  /** @param {string} file @returns {Promise<AudioBuffer|null>} */
  #buffer(file) {
    if (!this.#loads.has(file)) {
      this.#loads.set(file, fetch(AudioView.url(file)).then((r) => r.arrayBuffer()).then((b) => this.ctx.decodeAudioData(b)).catch(() => null));
    }
    return this.#loads.get(file);
  }
  #loads = new Map();

  #syncAmb() {
    const a = this.cfg.ambience;
    if (!a || !this.ctx) return;
    const want = this.ambOn && !this.muted;
    if (want && !this.amb) {
      this.amb = new Audio(AudioView.url(a.file));
      this.amb.loop = true;
      this.amb.volume = a.volume;
    }
    if (!this.amb) return;
    if (want) this.amb.play().catch(() => {});
    else this.amb.pause();
  }

  /** URL of a file in assets/ (served at the site root, vite publicDir). @param {string} file */
  static url(file) { return new URL(file, document.baseURI).href; }

  static #load() {
    try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
  }
}

const KEY = 'bloomlunas.muted';
