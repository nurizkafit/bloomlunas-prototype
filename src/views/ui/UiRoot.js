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
import { ItemCardView } from './ItemCardView.js';
import { TutorialView } from './TutorialView.js';
import { Icons } from './Icons.js';
import { Calendar, WEEKDAYS } from '../../model/Calendar.js';

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
    this.spotLayer = h('div.layer.pass.spots');
    this.hud = h('div.layer.pass');
    this.screen = h('div.layer.pass');
    this.modal = h('div.layer.pass');
    this.toasts = h('div.toasts');
    this.hint = h('div.hint');
    this.pop = h('div.helppop');
    this.fx = h('div.layer.pass.fx');
    this.stage.append(this.sceneLayer, h('div.paperveil'), h('div.vignette'), this.spotLayer, this.hud, this.screen, this.modal, this.toasts, this.hint, this.pop, this.fx);
    this.stage.addEventListener('mousemove', (e) => this.#hover(e.target));
    this.stage.addEventListener('mouseleave', () => this.#hover(null));
    this.stage.addEventListener('click', (e) => { if (e.target.closest?.('.helpq')) this.#hover(e.target); });
    host.append(this.stage);
    Ornaments.mount(this.stage);
    this.views = { hud: new HudView(this), start: new StartView(this), journal: new JournalView(this), map: new TownMapView(this), place: new PlaceView(this), event: new EventCardView(this), retro: new RetroView(this), card: new ItemCardView(this), tutor: new TutorialView(this) };
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
  /**
   * Travel with the walk (user feedback 8 Nov 2026): the player walks along the town roads, then the new place opens.
   * @param {string} place
   */
  travel(place) {
    const from = this.st.place;
    Object.assign(this.local, { map: false, station: null, pick: {} });
    this.act('travel', { place });
    if (this.st.place !== place) return;
    const ms = this.o.scene?.walk?.(from, place) ?? 0;
    if (!ms) return;
    this.local.walk = { to: place };
    this.render();
    clearTimeout(this.#walkT);
    this.#walkT = setTimeout(() => this.set({ walk: null }), ms + 150);
  }
  #walkT = 0;

  /** Cost preview for a button. */
  preview(id, params = {}) { return this.sys.actions.preview(id, params); }

  /** A 3D hotspot (DOM pill kept over its 3D anchor by the SceneView). @param {'station'|'place'} kind */
  spot(kind, id, el) { this.spotList.push({ kind, id, el }); return el; }
  spotList = [];

  /** Budget jar of a cost kind: badge with the jar colour and the gold left after the cost. @param {'store'|'personal'} jar @param {number} cost */
  jarTag(jar, cost = 0) {
    const st = this.st, b = st.plan.budget[jar] ?? 0, spent = st.week.spent[jar] ?? 0;
    const left = Math.round(b - spent - cost);
    const color = JAR_COLOR[jar];
    return h(`span.jartag${left < 0 ? '.over' : ''}`, { 'data-help': jar === 'store' ? 'jarStore' : 'jarPersonal', style: { '--jc': color } },
      Dom.raw(Dom.jarSvg(b ? (b - spent - cost) / b : 0, color, 18)), h('b', jar === 'store' ? 'Store jar' : 'Personal jar'), h('span', `${left < 0 ? 'over by' : 'left'} ${Math.abs(left)}`));
  }

  /** Item icon that opens the item card. */
  itemBtn(item, variant, tier, size = 22) {
    const it = this.c.get('items', item);
    return h('button.ib', { title: `${it.name}: details`, onclick: (e) => { e.stopPropagation(); this.set({ card: { item, variant, tier } }); } }, Dom.icon(Icons.forItem(it, variant), size));
  }

  /**
   * Story text with numbers from BalanceConfig: {KEY} shows the number, {KEY%} shows it as a percent.
   * @param {string} text
   */
  fill(text) {
    return String(text ?? '').replace(/\{([A-Z_]+)(%?)\}/g, (m, k, pc) => {
      const v = this.num(k);
      if (typeof v !== 'number') return m;
      return pc ? `${Math.round(v * 1000) / 10}%` : v.toLocaleString('en');
    });
  }

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
    if (r.id === 'exploreEnd') { this.local.recap = r.recap; this.local.station = null; }
    if (['marketBuy', 'marketSell', 'wholesaleBuy', 'wholesaleSell'].includes(r.id) && this.local.pick.cart) this.local.pick = { ...this.local.pick, cart: {} };
    const t = DONE_TOAST[r.id];
    if (t) this.toast(t[0], t[1](r, this));
    if (r.endDay) this.#sleep();
  }

  /**
   * Sleep (user feedback 8 Nov 2026): close all windows, fade to night, show the new day, fade in on a fresh day
   * at home. The overlay lives in its own layer, so redraws do not remove it.
   */
  #sleep() {
    const st = this.st, L = this.local;
    Object.assign(L, { station: null, map: false, journal: false, recap: null, pick: {}, card: null, walk: null });
    const weekEnd = st.cal.day >= this.num('DAYS_PER_WEEK');
    const day = weekEnd ? null : st.cal.day + 1;
    const wd = day ? WEEKDAYS[Calendar.weekday({ day })] : '';
    const ms = this.num('SLEEP_FADE_MS');
    const el = h('div.nightfx', { style: { '--fx': `${ms}ms` } },
      h('div.nf-sky', h('span.nf-moon'), h('span.nf-sun')),
      h('div.nf-t', h('small', weekEnd ? 'Good night' : 'A new morning'), h('b', weekEnd ? 'The week is over' : `Day ${day}`), weekEnd ? null : h('span', `${wd} · ${Calendar.clock(this.num('DAY_START_HOUR') * 60)}`)));
    this.fx.replaceChildren(el);
    setTimeout(() => el.remove(), ms + 100);
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
    this.spotList = [];
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
        else if (L.walk) {
          const p = this.c.get('places', L.walk.to);
          this.screen.append(h('div.walkbar', Dom.medal('walk', 32), h('span', 'On the way to'), h('b', p.name)));
          hint = [];
        }
        else if (L.map) { this.screen.append(...this.views.map.render()); hint = [['M', 'Close town'], ['Click', 'Pick a place']]; }
        else { this.screen.append(...this.views.place.render()); hint = [['M', 'Town'], ['J', 'Journal'], ['Esc', 'Back']]; }
        if (st.pendingEvent && !L.walk) this.modal.append(this.views.event.render());
      }
    }
    if (L.card && L.screen === 'game') this.modal.append(this.views.card.render());
    const tip = this.views.tutor.step();
    if (tip) this.modal.append(this.views.tutor.render(tip));
    this.spotLayer.replaceChildren(...this.spotList.map((s) => s.el));
    this.o.scene?.setSpots?.(this.spotList);
    this.hint.replaceChildren(...hint.map(([k, t]) => h('span', h('i', k), t)));
    if (this.#helpEl && !this.#helpEl.isConnected) { this.#helpEl = null; this.pop.classList.remove('on'); }
  }

  drawNow() { cancelAnimationFrame(this.#raf); this.#raf = 0; this.#draw(); }

  #key(e) {
    if (this.local.screen !== 'game') return;
    if (e.key === 'Escape' && this.local.card) { this.set({ card: null }); return; }
    if (this.st.phase !== 'do' || this.st.pendingEvent || this.local.walk) return;
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

const JAR_COLOR = { store: '#5FA39A', personal: '#D9A326', buffer: '#9C87C0' };
const PHASE_TOAST = { do: 'The week begins.', check: 'The week is over. Look back.', act: 'Month end. The guild waits.', retro: 'The guild clerk is here.' };
const DONE_TOAST = {
  craft: ['cauldron', (r) => `+${r.out} made`],
  marketBuy: ['cart', (r) => `-${Math.round(r.cost)} G`],
  questPost: ['quest', (r) => `-${Math.round(r.cost)} G`],
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
