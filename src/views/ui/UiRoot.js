import { MSG } from '../../core/EventBus.js';
import { REASON_TEXT } from '../../systems/ActionRunner.js';
import { Dom } from './Dom.js';
import { Ornaments } from './Ornaments.js';
import { HudView } from './HudView.js';
import { StartView } from './StartView.js';
import { JournalView } from './JournalView.js';
import { TownMapView } from './TownMapView.js';
import { PlaceView } from './PlaceView.js';
import { EventCardView } from './EventCardView.js';
import { RetroView } from './RetroView.js';

const h = Dom.h;

/**
 * UiRoot: the DOM side of the game. Builds the 1280x720 stage (scaled to the window), the layers
 * (3D scene, HUD, screen, modal, toasts, hint bar) and renders the screen for the current phase.
 * It reads GameState and sends intents on the EventBus. It never changes GameState.
 * View-only state (open station, Journal tab, picks) lives in `this.local`.
 */
export class UiRoot {
  /** @param {HTMLElement} host @param {import('../../core/GameManager.js').GameManager} gm @param {{save?:any, onNewGame:()=>void, onContinue:()=>void, scene?:any}} o */
  constructor(host, gm, o) {
    this.gm = gm;
    this.o = o;
    this.local = { screen: o.startScreen ?? 'start', station: null, journal: false, tab: 'schedule', map: false, pick: {}, story: 0, storeRun: null };
    this.stage = h('div.stage');
    this.sceneLayer = h('div.layer.scene3d');
    this.hud = h('div.layer.pass');
    this.screen = h('div.layer.pass');
    this.modal = h('div.layer.pass');
    this.toasts = h('div.toasts');
    this.hint = h('div.hint');
    this.pop = h('div.helppop');
    this.stage.append(this.sceneLayer, h('div.paperveil'), h('div.vignette'), this.hud, this.screen, this.modal, this.toasts, this.hint, this.pop);
    this.stage.addEventListener('mousemove', (e) => this.#hover(e.target));
    this.stage.addEventListener('mouseleave', () => this.#hover(null));
    this.stage.addEventListener('click', (e) => { if (e.target.closest?.('.helpq')) this.#hover(e.target); });
    host.append(this.stage);
    Ornaments.mount(this.stage);
    this.views = { hud: new HudView(this), start: new StartView(this), journal: new JournalView(this), map: new TownMapView(this), place: new PlaceView(this), event: new EventCardView(this), retro: new RetroView(this) };
    this.#fit();
    addEventListener('resize', () => this.#fit());
    addEventListener('keydown', (e) => this.#key(e));
    this.#listen();
    this.render();
  }

  get st() { return this.gm.state; }
  get c() { return this.gm.content; }
  get sys() { return this.gm.sys; }
  num(k) { return this.gm.content.num(k); }

  /** Send an intent. @param {string} msg @param {any} [payload] */
  send(msg, payload = {}) { this.gm.bus.emit(msg, payload); }
  /** Ask for a Do action. @param {string} id @param {any} [params] */
  act(id, params = {}) { this.send(MSG.INTENT_ACTION, { id, params }); }
  /** Cost preview for a button. */
  preview(id, params = {}) { return this.sys.actions.preview(id, params); }

  /** Short text for a refusal reason. */
  why(r) { return r ? REASON_TEXT[r] ?? r : ''; }

  /** Change view-only state and redraw. @param {any} patch */
  set(patch) { Object.assign(this.local, patch); this.render(); }

  #listen() {
    const b = this.gm.bus;
    const redraw = () => this.render();
    b.on(MSG.STATE_CHANGED, redraw);
    b.on(MSG.CLOCK_CHANGED, redraw);
    b.on(MSG.PHASE_ENTERED, ({ phase }) => {
      this.local.journal = false; this.local.map = false; this.local.station = null;
      this.local.tab = phase === 'plan' ? 'schedule' : this.local.tab;
      if (phase !== 'plan' && this.local.screen === 'game') this.toast(phase === 'do' ? 'calendar' : phase === 'check' ? 'note' : phase === 'act' ? 'debt' : 'star', PHASE_TOAST[phase]);
      this.render();
    });
    b.on(MSG.ACTION_REFUSED, (r) => { if (!this.local.storeRun || r.id !== 'storeHour') this.toast('warn', r.text, true); });
    b.on(MSG.ACTION_DONE, (r) => this.#done(r));
  }

  #done(r) {
    const t = DONE_TOAST[r.id];
    if (t) this.toast(t[0], t[1](r, this));
    if (r.endDay && this.st.phase === 'do') this.toast('sleep', `Day ${this.st.cal.day + 1}`);
  }

  /** Show a short toast: icon + few words. */
  toast(icon, text, bad = false) {
    const t = h(`div.toast${bad ? '.bad' : ''}`, h('span.ti', Dom.icon(icon, 20)), text);
    this.toasts.append(t);
    while (this.toasts.children.length > 3) this.toasts.firstElementChild.remove();
    setTimeout(() => t.remove(), 3000);
  }

  render() {
    if (this.#raf) return;
    this.#raf = requestAnimationFrame(() => { this.#raf = 0; this.#draw(); });
  }
  #raf = 0;

  /** Draw now (tests and first frame). */
  #draw() {
    const st = this.st, L = this.local;
    this.o.scene?.sync?.(st, L);
    this.hud.replaceChildren();
    this.screen.replaceChildren();
    this.modal.replaceChildren();
    let hint = [['Click', 'Select']];
    if (L.screen !== 'game') {
      this.screen.append(this.views.start.render());
      hint = [['Click', 'Select']];
    } else if (st.phase === 'retro') {
      this.screen.append(...this.views.retro.render());
    } else {
      this.hud.append(this.views.hud.render());
      if (st.phase === 'plan' || st.phase === 'check' || st.phase === 'act') {
        this.screen.append(this.views.journal.render(st.phase));
        hint = [['Click', 'Select'], ['Tabs', 'Pages']];
      } else if (st.phase === 'do') {
        if (L.journal) { this.screen.append(this.views.journal.render('do')); hint = [['J', 'Close book'], ['Tabs', 'Pages']]; }
        else if (L.map) { this.screen.append(...this.views.map.render()); hint = [['M', 'Close map'], ['Click', 'Travel']]; }
        else { this.screen.append(...this.views.place.render()); hint = [['M', 'Map'], ['J', 'Journal'], ['Esc', 'Back']]; }
        if (st.pendingEvent) this.modal.append(this.views.event.render());
      }
    }
    this.hint.replaceChildren(...hint.map(([k, t]) => h('span', h('i', k), t)));
    if (this.#helpEl && !this.#helpEl.isConnected) { this.#helpEl = null; this.pop.classList.remove('on'); }
  }

  drawNow() { cancelAnimationFrame(this.#raf); this.#raf = 0; this.#draw(); }

  #key(e) {
    if (this.local.screen !== 'game' || this.st.phase !== 'do' || this.st.pendingEvent) return;
    if (e.key === 'j' || e.key === 'J') this.set({ journal: !this.local.journal, map: false });
    else if (e.key === 'm' || e.key === 'M') this.set({ map: !this.local.map, journal: false });
    else if (e.key === 'Escape') this.set({ journal: false, map: false, station: null });
  }

  /** Help popup: any element with data-help="<key>" shows the text from data/help/help.json. */
  #hover(target) {
    const el = target?.closest?.('[data-help]');
    if (el === this.#helpEl && el?.isConnected) return;
    this.#helpEl = el ?? null;
    const item = el ? this.c.find('help', 'help')?.items?.[el.dataset.help] : null;
    if (!item) { this.pop.classList.remove('on'); return; }
    this.pop.replaceChildren(h('b', item.title), h('p', item.text));
    const sr = this.stage.getBoundingClientRect(), r = el.getBoundingClientRect(), k = this.scale || 1;
    const x = (r.left - sr.left) / k, y = (r.top - sr.top) / k, w = r.width / k, hh = r.height / k;
    this.pop.classList.add('on');
    const pw = this.pop.offsetWidth, ph = this.pop.offsetHeight;
    const left = Math.max(16, Math.min(1280 - pw - 16, x + w / 2 - pw / 2));
    const top = y + hh + 8 + ph > 704 ? y - ph - 8 : y + hh + 8;
    Object.assign(this.pop.style, { left: `${left}px`, top: `${Math.max(8, top)}px` });
  }
  #helpEl = null;

  #fit() {
    const s = Math.min(innerWidth / 1280, innerHeight / 720);
    this.stage.style.transform = `scale(${s})`;
    this.scale = s;
  }
}

const PHASE_TOAST = { do: 'Plan locked. Go!', check: 'Week done. Check.', act: 'Month end. Act.', retro: 'Two months done.' };
const DONE_TOAST = {
  craft: ['cauldron', (r) => `+${r.out} made`],
  marketBuy: ['cart', (r) => `-${Math.round(r.cost)} G`],
  wholesaleBuy: ['cart', (r) => `-${Math.round(r.cost)} G`],
  buyFood: ['meal', (r) => `-${Math.round(r.cost)} G`],
  marketSell: ['gold', (r) => `+${Math.round(r.income)} G`],
  wholesaleSell: ['gold', (r) => `+${Math.round(r.income)} G`],
  questHandIn: ['quest', (r) => `+${r.reward} G`],
  exploreGather: ['leaf', (r) => r.loot.map((l) => `+${l.qty}`).join(' ')],
  dryCollect: ['rack', (r) => `+${r.collected.reduce((s, b) => s + b.qty, 0)} dried`],
  travel: ['walk', (r, ui) => ui.c.get('places', ui.st.place).name],
  eat: ['meal', () => '+energy'],
  shortBreak: ['rest', () => '+energy']
};
