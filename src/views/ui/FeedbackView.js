import { MSG } from '../../core/EventBus.js';
import { Dom } from './Dom.js';
import { AudioView } from './AudioView.js';

const h = Dom.h;
const SKILL_NAME = { moon: 'Moon', sun: 'Sun', earth: 'Earth' };
const SALES = ['marketSell', 'wholesaleSell', 'questHandIn'];
const MADE = { craft: 'cauldron', dryCollect: 'rack', grind: 'grinder', exploreGather: 'leaf' };

/**
 * FeedbackView: game feel (user 14 Nov 2026). Sound cues, HUD numbers that count up or down with a +/- pop,
 * coins that fly to the gold pill on a sale, a burst when a product is made, banners for level-up, goal and
 * quest done, and a short result card after each night. Numbers and cues: data/feedback/feedback.json.
 * It listens to the EventBus and reads GameState. It never changes GameState. It draws in its own layer,
 * so the full redraw of UiRoot does not remove running effects.
 */
export class FeedbackView {
  /** @param {import('./UiRoot.js').UiRoot} ui */
  constructor(ui) {
    this.ui = ui;
    this.cfg = ui.c.find('feedback', 'feedback') ?? { sounds: {}, actionSounds: {}, fx: {} };
    this.fx = this.cfg.fx;
    this.audio = new AudioView(this.cfg);
    this.layer = h('div.layer.pass.juice');
    this.mute = h('button.mutebtn', { title: 'Sound on or off', onclick: (e) => { e.stopPropagation(); this.#setMute(this.audio.toggle()); } });
    this.#setMute(this.audio.muted);
    ui.stage.append(this.layer, this.mute);
    /** HUD numbers that count: key -> {from, to, t0} */
    this.tw = {};
    this.last = null;
    this.ptr = { x: 640, y: 360 };
    this.quietUntil = 0;
    this.reduce = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    ui.stage.addEventListener('pointerdown', (e) => {
      this.ptr = this.#local(e.clientX, e.clientY);
      if (e.target.closest?.('button, .tab, [role=button]')) this.audio.play('click');
    }, true);
    this.#listen();
  }

  /** HUD value to show now (counting) or the real value. @param {'gold'|'debt'} k @param {number} real */
  shown(k, real) {
    const t = this.tw[k];
    if (!t) return real;
    const p = Math.min(1, (performance.now() - t.t0) / this.fx.countMs);
    return t.from + (t.to - t.from) * (1 - (1 - p) ** 3);
  }

  #listen() {
    const b = this.ui.gm.bus, ui = this.ui;
    b.on(MSG.STATE_CHANGED, () => this.#diff());
    b.on(MSG.CLOCK_CHANGED, () => this.#diff());
    b.on(MSG.ACTION_DONE, (r) => this.#done(r));
    b.on(MSG.ACTION_REFUSED, (r) => { if (!(ui.local.storeRun && r.id === 'storeHour')) this.audio.play('refuse'); });
    b.on(MSG.NOTICE_ADDED, (n) => {
      if (!this.#live()) return;
      if (n.icon === 'check' && /^Objective done:/.test(n.text)) this.#banner('check', 'Objective done', n.text.replace(/^Objective done:\s*/, ''));
      else this.audio.play('notice');
    });
    b.on(MSG.PHASE_ENTERED, ({ phase }) => {
      if (this.#live()) this.audio.play('page');
      this.audio.ambience(this.#live() && (this.cfg.ambience?.phases ?? []).includes(phase));
      this.last = null;
    });
    b.on(MSG.DAY_STARTED, () => { this.day = this.#snap(); });
    b.on(MSG.DAY_ENDED, ({ day, met }) => this.#dayEnded(day, met));
    b.on(MSG.GAME_FINISHED, () => this.audio.play('fanfare'));
  }

  /** True when the player is in a run (not the start menu). */
  #live() { return this.ui.local.screen === 'game'; }

  #snap() {
    const st = this.ui.st, sum = (o) => Object.values(o ?? {}).reduce((s, v) => s + v, 0);
    return { gold: st.gold, debt: st.debt.balance, income: sum(st.week.income), spent: sum(st.week.spent), energy: st.energy };
  }

  /** Compare with the last seen state: count HUD numbers, pop +/-, level-up and goal banners. */
  #diff() {
    const ui = this.ui, st = ui.st;
    if (!this.#live()) { this.last = null; this.audio.ambience(false); return; }
    if (st.phase === 'do' && !this.audio.ambOn) this.audio.ambience((this.cfg.ambience?.phases ?? []).includes('do'));
    const lv = Object.fromEntries(Object.keys(SKILL_NAME).map((k) => [k, ui.sys.skills.level(k)]));
    const goalId = st.plan.goals[st.cal.day - 1];
    const met = st.phase === 'do' && goalId ? !!ui.sys.plan.goalMet(goalId, st.day) : false;
    const now = { gold: st.gold, debt: st.debt.balance, lv, met, day: st.cal.day, week: st.cal.week, energy: st.energy };
    const was = this.last;
    this.last = now;
    if (!was) return;
    for (const k of ['gold', 'debt']) {
      const d = Math.round(now[k] - was[k]);
      if (!d) continue;
      this.tw[k] = { from: this.shown(k, was[k]), to: now[k], t0: performance.now() };
      this.#pop(k, d);
    }
    if (Object.keys(this.tw).length) this.#tick();
    for (const k of Object.keys(lv)) {
      if (lv[k] > was.lv[k]) this.#later(() => this.#banner('star', `${SKILL_NAME[k]} skill`, `Level ${lv[k]}`));
    }
    if (met && !was.met && now.day === was.day && now.week === was.week) this.#banner('check', 'Today\'s goal', 'Goal met!');
  }

  /** Run a step after the sleep fade, so it is not hidden by the night screen. */
  #later(fn) {
    const wait = this.quietUntil - performance.now();
    if (wait > 0) setTimeout(fn, wait); else fn();
  }

  /** Count the HUD numbers each frame (only the number text changes, no full redraw). */
  #tick() {
    if (this.#raf) return;
    const step = () => {
      this.#raf = 0;
      const t = performance.now();
      for (const [k, w] of Object.entries(this.tw)) {
        const el = this.ui.hud.querySelector(`[data-k="${k}"]`);
        if (el) el.textContent = Math.round(this.shown(k, w.to)).toLocaleString('en');
        if (t - w.t0 >= this.fx.countMs) delete this.tw[k];
      }
      if (Object.keys(this.tw).length) this.#raf = requestAnimationFrame(step);
    };
    this.#raf = requestAnimationFrame(step);
  }
  #raf = 0;

  #done(r) {
    const ui = this.ui;
    const cue = this.cfg.actionSounds?.[r.id];
    if (cue) this.audio.play(cue);
    if (r.endDay) this.quietUntil = performance.now() + ui.num('SLEEP_FADE_MS');
    if (r.id === 'storeHour' && r.hour?.sold?.length) {
      this.audio.play('coin');
      const src = ui.screen.querySelector('.bigtotal');
      this.#coins(src ? this.#center(src) : this.ptr, r.hour.income);
    }
    if (SALES.includes(r.id)) this.#coins(this.ptr, r.income ?? r.reward ?? 0);
    if (r.id === 'questHandIn') this.#banner('quest', 'Commission done', `+${Math.round(r.reward ?? 0)} G`);
    if (MADE[r.id]) {
      const n = r.id === 'craft' ? r.out : r.id === 'dryCollect' ? (r.collected ?? []).reduce((s, x) => s + x.qty, 0)
        : r.id === 'exploreGather' ? (r.loot ?? []).reduce((s, x) => s + x.qty, 0) : null;
      const stars = r.id === 'craft' && r.tier ? ui.num('QUALITY_TIERS')[r.tier]?.stars : 0;
      this.#burst(this.ptr, MADE[r.id], n, stars);
    }
  }

  /** +/- number that floats up from a HUD pill. @param {'gold'|'debt'} k @param {number} d */
  #pop(k, d) {
    const pill = this.ui.hud.querySelector(`[data-help="${k}"]`);
    if (!pill) return;
    const c = this.#center(pill);
    const good = k === 'gold' ? d > 0 : d < 0;
    const el = h(`div.numpop${good ? '.up' : '.down'}`, { style: { left: `${c.x}px`, top: `${c.y + 18}px`, '--ms': `${this.fx.popMs}ms` } }, `${d > 0 ? '+' : '−'}${Math.abs(d).toLocaleString('en')}`);
    this.#add(el, this.fx.popMs);
    pill.classList.remove('bump');
    void pill.offsetWidth;
    pill.classList.add('bump');
  }

  /** Coins fly from a point to the gold pill. @param {{x:number,y:number}} from @param {number} gold */
  #coins(from, gold) {
    const pill = this.ui.hud.querySelector('[data-help="gold"]');
    if (!pill || gold <= 0) return;
    const to = this.#center(pill);
    const n = Math.max(1, Math.min(this.fx.coinsMax, Math.ceil(gold / this.fx.goldPerCoin)));
    for (let i = 0; i < n; i++) {
      const el = h('div.coinfly', Dom.icon('gold', 22));
      el.style.left = `${from.x}px`; el.style.top = `${from.y}px`;
      this.layer.append(el);
      if (this.reduce || !el.animate) { el.remove(); continue; }
      const jx = (i % 3 - 1) * 24, lift = 60 + (i % 4) * 14;
      const a = el.animate([
        { transform: 'translate(-50%,-50%) scale(.6)', opacity: 0 },
        { transform: `translate(calc(-50% + ${jx}px), calc(-50% - ${lift}px)) scale(1.1)`, opacity: 1, offset: 0.3 },
        { transform: `translate(calc(-50% + ${to.x - from.x}px), calc(-50% + ${to.y - from.y}px)) scale(.7)`, opacity: 1 }
      ], { duration: this.fx.coinFlyMs, delay: i * this.fx.coinStaggerMs, easing: 'cubic-bezier(.5,0,.75,1)', fill: 'both' });
      a.onfinish = () => el.remove();
    }
  }

  /** Burst with sparkles where the player clicked: icon, +N and quality stars. */
  #burst(at, icon, n, stars) {
    const sparks = Array.from({ length: 10 }, (_, i) => h('i', { style: { '--a': `${i * 36}deg` } }));
    const el = h('div.burst', { style: { left: `${at.x}px`, top: `${at.y}px`, '--ms': `${this.fx.burstMs}ms` } },
      h('div.bsp', sparks), h('div.bcore', Dom.medal(icon, 44), n ? h('b', `+${n}`) : null, stars ? Dom.stars(stars) : null));
    this.#add(el, this.fx.burstMs);
  }

  /** Big banner at the top centre (level-up, goal met, quest done). */
  #banner(icon, kick, text) {
    this.audio.play('fanfare');
    const el = h('div.fbanner', { style: { '--ms': `${this.fx.bannerMs}ms` } },
      h('div.fbr', Array.from({ length: 12 }, (_, i) => h('i', { style: { '--a': `${i * 30}deg` } }))),
      Dom.medal(icon, 52), h('div', h('small', kick), h('b', text)));
    this.layer.querySelectorAll('.fbanner').forEach((x) => x.remove());
    this.#add(el, this.fx.bannerMs);
  }

  /** Result card after the night: sales, spending, gold change, goal, energy left. */
  #dayEnded(day, met) {
    const ui = this.ui, s = this.day, now = this.#snap(), was = this.last;
    if (!s || !this.#live()) return;
    this.quietUntil = performance.now() + ui.num('SLEEP_FADE_MS');
    if (day >= ui.num('DAYS_PER_WEEK')) return;
    const sales = Math.round(now.income - s.income), spent = Math.round(now.spent - s.spent), dg = Math.round(now.gold - s.gold);
    const energy = Math.round(was?.energy ?? 0);
    const sign = (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toLocaleString('en')}`;
    const row = (icon, label, v, cls = '') => h(`div.dcr${cls}`, Dom.icon(icon, 18), h('span', label), h('b', v));
    setTimeout(() => {
      if (!this.#live()) return;
      this.audio.play('dayEnd');
      const el = h('div.daycard', { style: { '--ms': `${this.fx.dayCardMs}ms` }, title: 'Click to close', onclick: () => el.remove() },
        h('div.dch', h('small', 'Yesterday'), h('b', `Day ${day} result`)),
        row('gold', 'Sales', sign(sales), sales > 0 ? '.good' : ''),
        row('cart', 'Spent', sign(-spent), spent > 0 ? '.bad' : ''),
        row('note', 'Gold change', sign(dg), dg > 0 ? '.good' : dg < 0 ? '.bad' : ''),
        row(met ? 'check' : 'x', 'Day goal', met ? 'Met' : met === null ? 'None' : 'Not met', met ? '.good' : ''),
        row('energy', 'Energy at bedtime', String(energy), energy < 0 ? '.bad' : ''));
      this.layer.querySelectorAll('.daycard').forEach((x) => x.remove());
      this.#add(el, this.fx.dayCardMs);
    }, ui.num('SLEEP_FADE_MS'));
  }

  #add(el, ms) {
    this.layer.append(el);
    setTimeout(() => el.remove(), ms + 100);
  }

  /** Stage point (1280x720) of a screen point. */
  #local(cx, cy) {
    const r = this.ui.stage.getBoundingClientRect(), k = this.ui.scale || 1;
    return { x: (cx - r.left) / k, y: (cy - r.top) / k };
  }

  #center(el) {
    const r = el.getBoundingClientRect();
    return this.#local(r.left + r.width / 2, r.top + r.height / 2);
  }

  #setMute(m) {
    this.mute.classList.toggle('off', m);
    this.mute.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/>${m
      ? '<path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
      : '<path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'}</svg>`;
    this.mute.setAttribute('aria-label', m ? 'Sound off' : 'Sound on');
  }
}
