import { Dom } from '../ui/Dom.js';
import { Icons } from '../ui/Icons.js';
import { Ornaments } from '../ui/Ornaments.js';
import { HudView } from '../ui/HudView.js';
import { PlaceView } from '../ui/PlaceView.js';
import { REASON_TEXT } from '../../systems/ActionRunner.js';

const h = Dom.h;
const noop = () => {};

/** Item icon button as the game draws it (UiRoot.itemBtn, without the click). */
const ib = (icon, size = 22) => h('button.ib', { title: 'Item details' }, Dom.icon(icon, size));
/** Jar badge as the game draws it (UiRoot.jarTag). */
const jarTag = (kind, left, ratio) => {
  const color = { store: '#5FA39A', personal: '#D9A326' }[kind];
  return h(`span.jartag${left < 0 ? '.over' : ''}`, { style: { '--jc': color } },
    Dom.raw(Dom.jarSvg(ratio, color, 18)), h('b', kind === 'store' ? 'Store jar' : 'Personal jar'), h('span', `${left < 0 ? 'over' : 'left'} ${Math.abs(left)}`));
};
/** A box that stands in for the stage area, for parts that use absolute positions. */
const box = (w, ht, ...kids) => h('div', { style: { position: 'relative', width: `${w}px`, height: `${ht}px` } }, ...kids);
/** Book page wrapper so .pg rules (h3, h4) apply. */
const page = (w, ...kids) => h('div.pg', { style: { width: `${w}px`, borderRadius: '6px', paddingBottom: '24px' } }, ...kids);

/**
 * InterfaceSheet: one page with every UI component of the prototype and its variants.
 * Each item has an ID (family code + number), a plain name, its CSS class and where the game uses it.
 * The look comes from theme.css and the real Dom helpers, so the sheet changes when the UI changes.
 */
export class InterfaceSheet {
  /** @param {import('../../core/ContentDB.js').ContentDB} content */
  constructor(content) {
    this.c = content;
    this.count = 0;
  }

  /** @param {HTMLElement} root */
  mount(root) {
    Ornaments.mount(document.body);
    const secs = this.sections();
    root.append(this.header(secs), ...secs.map((s) => this.section(s)), this.notes());
    document.body.dataset.ready = '1';
  }

  /* ---------- page parts ---------- */

  header(secs) {
    const total = secs.reduce((n, s) => n + s.items.length, 0);
    return h('header.sh-head',
      h('div',
        h('h1', 'BloomLunas interface sheet'),
        h('p', `All ${total} interface components of the prototype and their variants, in ${secs.length} families. The art is placeholder. It will change to hand-drawn art. `,
          'Each item has an ID (family code + number) and a plain name, so you can write audit notes such as "unify BTN-02 and BTN-15". ',
          'The small grey line is the CSS class in src/views/ui/theme.css. "Used in" tells where the game shows it. Names and texts come from the game data; numbers are sample values.'),
        h('div.sh-index', secs.map((s) => h('a', { href: `#${s.code}` }, `${s.code} ${s.title}`)), h('a', { href: '#notes' }, 'Audit notes'))),
      h('div.sh-key',
        h('span', h('i', { style: { background: '#1d3537' } }), 'On the 3D scene / dark'),
        h('span', h('i', { style: { background: '#F2E9D8' } }), 'On paper (windows, cards)'),
        h('span', h('i', { style: { background: '#EADDC2' } }), 'On a Journal page'),
        h('span', h('i', { style: { background: '#9FB8B0' } }), 'Over the 3D room')));
  }

  section(s) {
    return h('section.sh-sec', { id: s.code },
      h('h2', h('code', s.code), s.title, s.sub ? h('small', s.sub) : null),
      h('div.sh-grid', s.items.map((it) => this.card(it))));
  }

  /**
   * @param {{id:string, name:string, cls:string, used:string, bg?:string, w?:number, vars:[string|null, any][], note?:string, stage?:any}} it
   */
  card(it) {
    this.count += 1;
    const vars = it.vars.map(([tag, el]) => h('div.sh-var', el, tag ? h('span.sh-tag', tag) : null));
    return h('div.sh-card', { style: { width: `${Math.max(300, it.w ?? 360)}px` }, id: it.id },
      h(`div.sh-stage.bg-${it.bg ?? 'paper'}`, { style: it.stage ?? {} }, vars),
      h('div.sh-meta',
        h('div.sh-id', h('code', it.id), h('b', it.name)),
        h('div.sh-cls', it.cls),
        h('div.sh-used', h('b', 'Used in: '), it.used),
        it.note ? h('div.sh-note', it.note) : null));
  }

  notes() {
    const li = (ids, text) => h('li', h('b.ids', ids), ' ', text);
    return h('section.sh-notes', { id: 'notes' },
      h('div.sh-box',
        h('h2', 'Style rules (unified 8 Nov 2026)'),
        h('ol',
          li('Key cap (HUD-08)', 'One shape: rounded square. Cream on dark, teal on paper.'),
          li('Chip (CHP-01, CHP-06)', 'One base: 28 px high, fully round. Tint = meaning: neutral (rattan), ok (green), missing or closed (red), open (teal). The jar badge keeps a ring in the jar colour.'),
          li('Jar (VAL-09)', 'One drawing in code (Dom.jarSvg) at two sizes: 48 px in the jar box, 18 px in the jar badge.'),
          li('Selected', 'A list row: gold fill + gold left edge (LST-02, LST-03). A tile, card, frame or picker button: gold ring (FRM-03, STN-02, CRD-07, BTN-16, BTN-17). Today or now: fern ring (LST-06, LST-07, CRD-13, STN-04).'),
          li('Big numbers', 'Three sizes (CSS --num-xl / --num-l / --num-m): XL 40 px big total and big stepper; L 28 px basket total; M 22 px stat tile, jar box and total line.'),
          li('Price level (BTN-16, CHP-07)', 'Picker look for the store buttons and the market page boxes. The shelf slot keeps a small tag in the same colours.'),
          li('Round icon holder (ICN-01)', 'Medallion look (wood ring, paper inside) for item buttons, station menu icons and toast icons. The round HUD button (BTN-10) stays a button.'),
          li('Header (TTL-01)', 'The phase plaque is the screen title in Plan, Do Journal, Check, Act and the Retrospective. The window title plate (TTL-02) and the location header (TTL-04) have other jobs and stay.'))),
      h('div.sh-box',
        h('h2', 'Retired IDs'),
        h('p', { style: { fontSize: '15px', marginBottom: '8px' } }, 'A merged item keeps the lower ID. Do not use these IDs again.'),
        h('ul',
          h('li', h('b.ids', 'TTL-03'), ' Screen ribbon tag: now TTL-01 Phase plaque.'),
          h('li', h('b.ids', 'CHP-02'), ' Hours chip and ', h('b.ids', 'CHP-03'), ' Closed place mark: now variants of CHP-01 Chip.'),
          h('li', h('b.ids', 'STN-06'), ' Price level box: now a variant of BTN-16 Price level picker.')),
        h('h2', { style: { marginTop: '16px' } }, 'Different on purpose'),
        h('ul',
          h('li', h('b.ids', 'BTN-14 / BTN-15'), ' Book tabs change the Journal page. Mode tabs change the view inside one window.'),
          h('li', h('b.ids', 'TTL-02 / TTL-04'), ' Window title plate names a window. Location header names the place.')),
        h('h2', { style: { marginTop: '16px' } }, 'How to update this sheet'),
        h('ul',
          h('li', 'Live page: ', h('code', 'npm run dev'), ', then open ', h('code', '/sheet.html'), '.'),
          h('li', 'PNG and PDF: ', h('code', 'npm run sheet'), ' writes ', h('code', 'out/browser/interface-sheet.png'), ' and ', h('code', '.pdf'), '.'),
          h('li', 'A new component: add it to ', h('code', 'src/views/sheet/InterfaceSheet.js'), ' with the next free ID. Do not reuse old IDs.'))));
  }

  /* ---------- HUD with the real HudView ---------- */

  /** A fake UiRoot for HudView: real numbers and goals from the data, a hand-made state. */
  hudUi({ minute = 8 * 60, phase = 'do', energy = 80, goal = 'craft', met = false, gold = 1250, debt = 5000, food = 6, rb = false, map = false } = {}) {
    const c = this.c;
    return {
      st: { cal: { month: 1, week: 2, day: 3, minute }, phase, energy, energyMax: 100, plan: { goals: [null, null, goal] }, day: {}, gold, debt: { balance: debt }, inv: { 'meal|pack|': food } },
      local: { map, journal: false },
      num: (k) => c.num(k),
      c: { get: (t, id) => c.get(t, id) },
      sys: { plan: { goalMet: () => met } },
      set: noop,
      rb
    };
  }

  hud(o) { return new HudView(this.hudUi(o)).render(); }
  /** Energy badge of the dial, kept inside a .daydial so its rules apply. */
  enBadge(energy) {
    const en = this.dial({ energy }).querySelector('.en');
    Object.assign(en.style, { position: 'static', transform: 'none' });
    return h('div.daydial', { style: { width: 'auto', height: 'auto', margin: '0', filter: 'none' } }, en);
  }

  dial(o) { const el = this.hud(o).querySelector('.daydial'); el.style.margin = '0'; return el; }

  /** Event response button as EventCardView draws it. */
  respBtn(r, disabled = false) {
    const fx = (e) => {
      const icon = { gold: 'gold', energy: 'energy', time: 'clock', demand: 'customer', item: 'bag', xp: 'skills', debt: 'debt' }[e.type] ?? 'info';
      const v = e.type === 'time' ? `-${Dom.mins(e.amount)}` : e.type === 'demand' ? `×${e.amount}` : `${e.amount > 0 ? '+' : ''}${e.amount}`;
      return Dom.chip(icon, v, (e.type === 'time' || e.amount < 0) ? 'miss' : 'ok');
    };
    return h('button.btn.alt', { style: { height: 'auto', minHeight: '48px', padding: '8px 16px', justifyContent: 'flex-start' }, disabled },
      Dom.icon(Icons.has(r.icon) ? r.icon : 'next', 22), h('span', { style: { flex: 1, textAlign: 'left' } }, r.label), h('span.row', { style: { gap: '4px' } }, (r.effects ?? []).map(fx)));
  }

  /* ---------- the catalogue ---------- */

  sections() {
    const btn = (label, cls, o = {}) => Dom.btn(label, noop, { cls, ...o });
    const hover = (el) => { el.style.filter = 'brightness(1.1)'; el.style.transform = 'translateY(-1px)'; return el; };
    const press = (el) => { el.style.transform = 'translateY(2px)'; el.style.boxShadow = '0 0 0 2px var(--rattan), 0 0 0 4px var(--woodD), 0 1px 0 #0e1d1e'; return el; };
    const dis = (el) => { el.disabled = true; return el; };
    const goals = this.c.all('goals').sort((a, b) => a.order - b.order);
    const g = (id) => goals.find((x) => x.id === id) ?? goals[0];
    const home = this.c.get('places', 'home'), market = this.c.get('places', 'market');
    const story = this.c.get('story', 'premise'), rack = this.c.get('services', 'svc_rack');
    const notes = this.c.get('notes', 'notes').options, obj = this.c.get('objectives', 'objectives').list;
    const rain = this.c.get('events', 'ev_rain'), neighbour = this.c.get('events', 'ev_neighbour');
    const help = this.c.get('help', 'help').items.jarStore, tiers = this.c.num('QUALITY_TIERS'), lvls = this.c.num('PRICE_LEVELS');
    const ln = (icon, label, v, vcls = '') => h('div.ln', Dom.icon(icon, 20), label, h(`span.v${vcls}`, v));
    const lnSm = (icon, label, v, vcls = '') => h('div.ln.sm', Dom.icon(icon, 18), label, h(`span.v${vcls}`, v));
    const slot = (o) => o
      ? h(`button.slot${o.sel ? '.sel' : ''}`, h(`span.p.lv-${o.lv}`, o.lv[0].toUpperCase()), h('span.pr', Dom.icon('gold', 12), String(o.price)), Dom.icon(o.icon, 34), Dom.stars(o.stars), h('span.q', String(o.q)))
      : h('button.slot.empty', Dom.icon('plus', 22));
    const sideWrap = (w, ...kids) => h('div.side', { style: { width: `${w}px` } }, ...kids);
    const srow = (icon, t, m, cls = '') => h(`button.srow${cls}`, h('span.si', Dom.icon(icon, 22)), h('span.t', t), h('span.m', m));
    const tlRows = (o = {}) => Dom.tlist('28px 1fr 60px 40px 84px', ['', 'Material', h('span', Dom.icon('gold', 12), 'each'), 'Have', 'Qty'], [
      { cells: [ib('root'), h('span', 'Turmeric', h('small.muted', ' fresh')), '4.0', '6', Dom.mini(0, noop)] },
      { on: true, onclick: noop, cells: [ib('leaf'), h('span', 'Lemongrass', h('small.muted', ' fresh')), [Dom.icon('trend_up', 12), '3.5'], '2', Dom.mini(4, noop)] },
      { cls: 'has', cells: [ib('sugar'), h('span', 'Palm sugar', h('small.muted', ' block')), [Dom.icon('trend_down', 12), '6.0'], '0', Dom.mini(2, noop)] },
      { onclick: noop, disabled: true, cells: [ib('wax'), h('span', 'Beeswax', h('small.muted', ' block')), '9.0', '0', Dom.mini(0, noop)] }
    ], o.empty);
    const hot = (icon, t, cls = '', o = {}) => h(`button.hot${cls}`, { disabled: o.disabled }, Dom.icon(icon, 18), t);
    const plaque = (icon, small, big) => Dom.slim('plaque', Dom.medal(icon, 38), h('div', h('small', small), h('b', big)));
    const tab = (icon, on, label) => h(`button.tab${on ? '.on' : ''}`, Dom.icon(icon, 22), label ? h('span.tl', label) : null);

    return [
      /* ===== FRM: Frames and panels ===== */
      { code: 'FRM', title: 'Frames and panels', sub: 'The containers that hold all other parts', items: [
        { id: 'FRM-01', name: 'Rattan main frame', cls: '.rf > .in', used: 'Station windows, modal cards, item card, recaps, story letter.', w: 380,
          vars: [[null, Dom.rattan('', { style: { width: '300px', height: '170px' } }, h('div', { style: { padding: '24px', position: 'relative' } }, 'Cane weave border, paper inside.'))]] },
        { id: 'FRM-02', name: 'Slim wood frame', cls: '.sf > .in', used: 'Location header, station menu, place info, today goal, phase plaque, Rest and Act mini cards.', w: 380,
          vars: [[null, Dom.slim('', { style: { width: '300px', height: '120px' } }, h('div', { style: { padding: '16px', position: 'relative' } }, 'Thin wood border, paper inside.'))]] },
        { id: 'FRM-03', name: 'Slim wood frame, selected', cls: '.sf.on', used: 'Station menu frame in the left panel. Act page: booked appointment card.', w: 380, bg: 'teal',
          vars: [['normal', Dom.slim('', { style: { width: '140px' } }, h('div', { style: { padding: '8px' } }, 'Normal'))], ['selected', Dom.slim('on', { style: { width: '140px' } }, h('div', { style: { padding: '8px' } }, 'Booked'))]] },
        { id: 'FRM-04', name: 'Station window', cls: '.win (rattan + .plate + .body + .foot + .close)', used: 'Every Do station: Store, Crafting, Drying rack, Grinding table, Rest, Market stall, Guild receptionist, Quest board, City outskirt.', w: 780, bg: 'teal',
          vars: [[null, box(720, 420, (() => {
            const w = PlaceView.win({ set: noop }, 'cauldron', 'Crafting', [h('div.col', h('div.small.muted', 'Left column (list)')), h('div', h('div.small.muted', 'Right column (detail)'))], [btn('Craft', 'gold', { icon: 'cauldron', min: 60, energy: 8 })]);
            Object.assign(w.style, { left: '0', right: '0', top: '0', bottom: '0' });
            return w;
          })())]] },
        { id: 'FRM-05', name: 'Planner Book', cls: '.book (.tool .tool2 .spineband) + .pages + .pg.l / .pg.r', used: 'Journal in Plan, Do (J key), Check and Act phases. Retrospective.', w: 780, bg: 'teal',
          vars: [[null, box(700, 360, (() => {
            const b = h('div.book', h('div.tool'), h('div.tool2'), h('div.spineband'),
              h('div.pages', h('div.pg.l', h('h3', Dom.icon('calendar', 28), 'Left page'), h('div.pageno', Dom.icon('moon', 14), '3')), h('div.pg.r', h('h3', Dom.icon('star', 28), 'Right page'), h('div.pageno', '4', Dom.icon('moon', 14)))),
              h('div.tabs', tab('calendar', true, 'Goals'), tab('store', false, 'Store'), tab('ledger', false, 'Ledger')),
              ...Dom.corners().map((c) => { c.style.zIndex = 3; return c; }));
            Object.assign(b.style, { left: '0', width: '640px', top: '0', bottom: '0' });
            return b;
          })())]] },
        { id: 'FRM-06', name: 'Modal veil', cls: '.veil', used: 'Behind every modal card: review plan, event, item card, recap, spot found.', w: 380, bg: 'teal',
          vars: [[null, box(300, 170, h('div', { style: { position: 'absolute', inset: 0, background: 'var(--paper)', borderRadius: '8px', padding: '12px' } }, 'Screen under the veil'), h('div.veil', { style: { borderRadius: '8px' } }, h('div', { style: { color: 'var(--cream)', fontFamily: 'var(--head)', fontSize: '18px' } }, 'Card sits here')))]] },
        { id: 'FRM-07', name: 'Inset panel', cls: '.day / .stat / .jarbox / .skill / .drow / .notepick button', used: 'The pale tinted box with a thin line. Same fill on six parts (see CRD-11, CRD-12, CRD-13, LST-07, LST-10, BTN-17).', w: 380, bg: 'page',
          vars: [[null, h('div.stat', { style: { width: '260px', height: '80px' } }, h('span.k', 'Tint rgba(200,149,90,.1) + 1 px line'))]] }
      ] },

      /* ===== ORN: Ornaments ===== */
      { code: 'ORN', title: 'Ornaments', items: [
        { id: 'ORN-01', name: 'Corner ornament', cls: '.corner.tl / .tr / .bl / .br (svg #nouveau)', used: 'Planner Book corners, event card, spot found card, story letter.', w: 380,
          vars: [[null, Dom.rattan('', { style: { width: '300px', height: '160px' } }, ...Dom.corners(), h('div'))]] },
        { id: 'ORN-02', name: 'Divider', cls: '.divider (svg #divider)', used: 'Act page, under the appointment cards.', w: 380, bg: 'page',
          vars: [[null, h('div', { style: { width: '300px' } }, Dom.divider())]] },
        { id: 'ORN-03', name: 'Page number', cls: '.pageno', used: 'Bottom corner of each Journal page.', w: 300, bg: 'page',
          vars: [['left', h('div.pageno', { style: { position: 'static' } }, Dom.icon('moon', 14), '3')], ['right', h('div.pageno', { style: { position: 'static' } }, '4', Dom.icon('moon', 14))]] }
      ] },

      /* ===== TTL: Plaques and titles ===== */
      { code: 'TTL', title: 'Plaques, labels and titles', items: [
        { id: 'TTL-01', name: 'Phase plaque', cls: '.phasebar > .plaque', used: 'Screen title, top right: Plan, Do Journal, Check, Act and the Retrospective.', w: 760, bg: 'teal',
          vars: [['Plan', plaque('calendar', 'WEEK 2', 'Plan')], ['Do (Journal)', plaque('journal', 'WEEK 2', 'Journal')], ['Check', plaque('note', 'WEEK 2', 'Check')], ['Act', plaque('debt', 'MONTH 1', 'Act')], ['Retrospective', plaque('guild', 'MONTH 2', 'The clerk reads your books')]] },
        { id: 'TTL-02', name: 'Window title plate', cls: '.win .plate', used: 'Top of every station window.', w: 380,
          vars: [[null, h('div.plate', { style: { width: '300px' } }, Dom.icon('store', 20), 'Store')]] },
        { id: 'TTL-04', name: 'Location header', cls: '.lochead (+ .hchip)', used: 'Top of the left panel at a place, and the Town list.', w: 380, bg: 'teal',
          vars: [['place', sideWrap(292, PlaceView.header(null, home.icon, home.name, h('span.hchip', Dom.icon('clock', 14), 'Open')))], ['town list', sideWrap(292, PlaceView.header(null, 'map', 'Town', h('span.hchip', Dom.icon('clock', 14), '10:30')))]] },
        { id: 'TTL-05', name: 'Page title', cls: '.pg h3 (+ .aside, .helpq)', used: 'First line of each Journal page.', w: 460, bg: 'page',
          vars: [[null, page(400, h('h3', Dom.icon('calendar', 28), 'Week 2', Dom.help('x'), h('span.aside', Dom.icon('star', 16), '5/7')))]] },
        { id: 'TTL-06', name: 'Section title', cls: '.pg h4 (+ .aside)', used: 'Sub-sections on Journal pages.', w: 460, bg: 'page',
          vars: [[null, page(400, h('h4', Dom.icon('cart', 18), 'Materials needed', Dom.help('x'), h('span.aside', Dom.icon('gold', 14), '84')))]] },
        { id: 'TTL-07', name: 'Kicker label', cls: '.kick', used: 'Small caps over a title: cards, trade panels, store slot, recap.', w: 260,
          vars: [[null, h('div.kick', 'Your plan')]] },
        { id: 'TTL-08', name: 'Card title', cls: '.card h3 / .letter h2', used: 'Modal cards and the story letter.', w: 380,
          vars: [['card h3', h('div.card', { style: { width: 'auto' } }, h('h3', 'Start the week?'))], ['letter h2', h('div.letter', { style: { width: 'auto' } }, h('h2', { style: { margin: 0 } }, story.title))]] },
        { id: 'TTL-09', name: 'Game logo', cls: '.logo', used: 'Start menu.', w: 520, bg: 'teal',
          vars: [[null, h('div.logo', 'BloomLunas', h('small', 'A HERB SHOP · A DEBT · A NEW START'))]] }
      ] },

      /* ===== BTN: Buttons and tabs ===== */
      { code: 'BTN', title: 'Buttons and tabs', items: [
        { id: 'BTN-01', name: 'Teal button', cls: '.btn', used: 'Secondary actions: Continue, Put, Collect, Short break, Utilities.', w: 560,
          vars: [['normal', btn('Continue', '', { icon: 'journal' })], ['hover', hover(btn('Continue', '', { icon: 'journal' }))], ['pressed', press(btn('Continue', '', { icon: 'journal' }))], ['disabled', dis(btn('Continue', '', { icon: 'journal' }))]] },
        { id: 'BTN-02', name: 'Paper button', cls: '.btn.alt', used: 'Back and cancel: Edit, Skip, Stay, End exploration, Close now, Min, All.', w: 560,
          vars: [['normal', btn('Change it', 'alt', { icon: 'back' })], ['hover', hover(btn('Change it', 'alt', { icon: 'back' }))], ['pressed', press(btn('Change it', 'alt', { icon: 'back' }))], ['disabled', dis(btn('Change it', 'alt', { icon: 'back' }))]] },
        { id: 'BTN-03', name: 'Gold action button', cls: '.btn.gold', used: 'The main action of a screen: Start week, Open store, Craft, Buy all, Sell all, Take, Gather, Pay, Go.', w: 560,
          vars: [['normal', btn('Open the shop', 'gold', { icon: 'store' })], ['hover', hover(btn('Open the shop', 'gold', { icon: 'store' }))], ['pressed', press(btn('Open the shop', 'gold', { icon: 'store' }))], ['disabled', dis(btn('Open the shop', 'gold', { icon: 'store' }))]] },
        { id: 'BTN-04', name: 'Small button', cls: '.btn.sm / .btn.alt.sm / .btn.gold.sm', used: 'Inside panels: Put, Fill from plan, Fast, Go, Sleep, mode tabs.', w: 460,
          vars: [['teal', btn('Place', 'sm', { icon: 'check' })], ['paper', btn('Fill from plan', 'alt.sm', { icon: 'note' })], ['gold', btn('Go', 'gold.sm', { icon: 'walk' })], ['disabled', dis(btn('Place', 'sm', { icon: 'check' }))]] },
        { id: 'BTN-05', name: 'Small icon-only button', cls: '.btn.alt.sm (icon, no label)', used: 'Clear slot, Clear basket.', w: 260,
          vars: [['normal', btn('', 'alt.sm', { icon: 'x' })], ['disabled', dis(btn('', 'alt.sm', { icon: 'x' }))]] },
        { id: 'BTN-06', name: 'Button with cost', cls: '.btn .cost', used: 'Any action that costs time, energy or gold: Craft, Walk on, Buy all, Start drying, Open store.', w: 560,
          vars: [['time + energy', btn('Craft', 'gold', { icon: 'cauldron', min: 90, energy: 8 })], ['energy', btn('Open the shop', 'gold', { icon: 'store', energy: 10 })], ['time', btn('Collect', 'sm', { icon: 'dried', min: 30 })]] },
        { id: 'BTN-07', name: 'Ribbon action button', cls: '.btn.gold.ribbon', used: 'Next to the phase plaque: Review plan, Next week, Month end, Close month.', w: 420, bg: 'teal',
          vars: [['Plan', btn('Finish plan', 'gold.ribbon', { icon: 'check' })], ['Check', btn('Next week', 'gold.ribbon', { icon: 'check' })], ['Act', btn('Close month', 'gold.ribbon', { icon: 'check' })]] },
        { id: 'BTN-08', name: 'Start menu button', cls: '.menu .btn', used: 'Start menu: New game, Continue.', w: 380, bg: 'teal',
          vars: [[null, h('div.menu', { style: { marginTop: 0 } }, btn('New game', 'gold', { icon: 'herb' }), btn('Continue', '', { icon: 'journal' }))]] },
        { id: 'BTN-09', name: 'Event response button', cls: '.card .acts > .btn.alt (tall, effect chips)', used: 'Event card answers. Disabled when you do not have what it needs.', w: 460,
          vars: [[null, h('div.acts', { style: { width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' } }, this.respBtn(neighbour.responses[1]), this.respBtn(neighbour.responses[0], true))]] },
        { id: 'BTN-10', name: 'Round HUD button', cls: '.rb / .rb.on', used: 'HUD top right in the Do phase: Town, Journal.', w: 300, bg: 'teal', stage: { paddingBottom: '36px' },
          vars: [['off', h('button.rb', h('i', Dom.icon('map', 26)), h('span', 'Town'))], ['on', h('button.rb.on', h('i', Dom.icon('journal', 26)), h('span', 'Journal'))]] },
        { id: 'BTN-11', name: 'Round icon button', cls: '.iconbtn / .iconbtn.close', used: 'Stepper plus and minus, close X on windows, book and item card.', w: 360,
          vars: [['plus', h('button.iconbtn', { html: Icons.svg('plus', 16) })], ['minus off', h('button.iconbtn', { disabled: true, html: Icons.svg('minus', 16) })], ['close', h('button.iconbtn', { html: Icons.svg('x', 16) })]] },
        { id: 'BTN-12', name: 'Item icon button', cls: '.ib', used: 'Every item icon in lists. Click opens the item card.', w: 260,
          vars: [['normal', ib('root')], ['hover', (() => { const b = ib('root'); b.style.boxShadow = '0 0 0 2px var(--tur)'; return b; })()]] },
        { id: 'BTN-13', name: 'Help mark', cls: '.helpq', used: 'After page titles. Hover shows the help popup (CRD-15).', w: 200, bg: 'page',
          vars: [[null, Dom.help('x')]] },
        { id: 'BTN-14', name: 'Book tab', cls: '.tabs > .tab / .tab.on', used: 'Right edge of the Planner Book: Daily goals, Store plan, Ledger, Market, Public schedule, Skills, Notes, Log.', w: 360, bg: 'teal',
          vars: [['on', tab('calendar', true, 'Goals')], ['off', tab('store', false, 'Store')], ['off', tab('ledger', false, 'Ledger')], ['off', tab('log', false, 'Log')]] },
        { id: 'BTN-15', name: 'Mode tabs', cls: '.tabs2 (BTN-04 .sm = on, .alt.sm = off)', used: 'Station windows: Market stall (Buy, Food, Sell), Receptionist (Lots, Sell, Service), Quest board (Take, Give).', w: 420,
          vars: [[null, h('div.tabs2', { style: { marginBottom: 0 } }, btn('Buy', 'sm', { icon: 'cart' }), btn('Food', 'alt.sm', { icon: 'meal' }), btn('Sell', 'alt.sm', { icon: 'gold' }))]] },
        { id: 'BTN-16', name: 'Price level picker', cls: '.lvpick > button.lv-* (.on) / .lvpick > div.lv-*', used: 'Store window: price level of a shelf slot (buttons). Journal, Market page: price levels (no click).', w: 520,
          vars: [['store, Fair picked', h('div.lvpick', { style: { width: '440px' } }, ['low', 'fair', 'high'].map((k, i) => h(`button.lv-${k}${i === 1 ? '.on' : ''}`, k[0].toUpperCase() + k.slice(1), h('small.row', { style: { gap: '4px' } }, Dom.icon('gold', 12), String([8, 10, 13][i]), Dom.icon('customer', 12), '●'.repeat(3 - i)))))],
            ['market page', h('div.lvpick', { style: { width: '440px' } }, ['low', 'fair', 'high'].map((k) => h(`div.lv-${k}`, k[0].toUpperCase() + k.slice(1), h('small', `×${lvls[k].mult} · ${Math.round(lvls[k].demand * 100)}%`))))]] },
        { id: 'BTN-17', name: 'Note pick', cls: '.notepick button / button.on', used: 'Check page: note for next week.', w: 460, bg: 'page',
          vars: [[null, h('div.notepick', { style: { width: '400px' } }, h('button.on', Dom.icon(notes[0].icon, 20), notes[0].text), h('button', Dom.icon(notes[2].icon, 20), notes[2].text))]] }
      ] },

      /* ===== HUD ===== */
      { code: 'HUD', title: 'HUD', sub: 'Drawn by the real HudView', items: [
        { id: 'HUD-01', name: 'Day dial', cls: '.daydial (svg + .dt + .ph + .en)', used: 'HUD top left in every phase. One turn = 12 hours (AM, then PM). Sky colour and sun or moon follow the hour. Centre: weekday, 24-hour time, AM/PM. Ring = energy.', w: 780, bg: 'teal', stage: { paddingTop: '32px' },
          vars: [['08:00 morning', this.dial({ minute: 8 * 60, phase: 'plan' })], ['13:00 day', this.dial({ minute: 13 * 60 })], ['18:30 dusk', this.dial({ minute: 18 * 60 + 30, energy: 45, phase: 'check' })], ['21:30 night, low energy', this.dial({ minute: 21 * 60 + 30, energy: 15, phase: 'act' })]] },
        { id: 'HUD-02', name: 'Phase medal', cls: '.daydial .ph (medal)', used: 'Top right of the day dial. Icon per phase.', w: 420, bg: 'teal',
          vars: [['Plan', Dom.medal('calendar', 30)], ['Do', Dom.medal('walk', 30)], ['Check', Dom.medal('note', 30)], ['Act', Dom.medal('debt', 30)]] },
        { id: 'HUD-03', name: 'Energy badge', cls: '.daydial .en / .en.low', used: 'Under the day dial.', w: 300, bg: 'teal',
          vars: [['normal', this.enBadge(80)], ['low (under 25%)', this.enBadge(15)]] },
        { id: 'HUD-04', name: 'Stat pill', cls: '.pill / .pill.cal / .pill.debt', used: 'HUD row: calendar, gold, debt, food packs.', w: 640, bg: 'teal',
          vars: [...this.hud().querySelectorAll('.prow > .pill')].map((p, i) => [['calendar', 'gold', 'debt (red)', 'food'][i], p]) },
        { id: 'HUD-05', name: 'Today goal card', cls: '.goalcard (slim frame)', used: 'HUD, under the pills.', w: 520, bg: 'teal',
          vars: [['not met', this.hud({ goal: 'craft' }).querySelector('.goalcard')], ['met', this.hud({ goal: 'store', met: true }).querySelector('.goalcard')]] },
        { id: 'HUD-06', name: 'HUD band', cls: '.hud', used: 'Top of the screen. Do phase adds the round buttons.', w: 1240, bg: 'teal', stage: { justifyContent: 'flex-start', paddingBottom: '40px' },
          vars: [['Do phase', this.hud({ minute: 10 * 60 + 30 })]] },
        { id: 'HUD-07', name: 'Hint bar', cls: '.hint', used: 'Bottom right: key help for the screen.', w: 640, bg: 'teal',
          vars: [[null, h('div.hint', h('span', h('i', 'M'), 'Town'), h('span', h('i', 'J'), 'Journal'), h('span', h('i', 'Esc'), 'Back'))]] },
        { id: 'HUD-08', name: 'Key cap', cls: '.hint i / i.key (one shape)', used: 'Hint bar key (cream on dark), and the key on station menu rows (teal on paper).', w: 300,
          vars: [['hint bar', h('div.hint', { style: { width: 'auto', background: '#1d3537', padding: '0 12px', borderRadius: '8px' } }, h('span', h('i', 'M'), 'Town'))], ['menu row', h('i.key', 'M')]] }
      ] },

      /* ===== LST: Lists and rows ===== */
      { code: 'LST', title: 'Lists and rows', items: [
        { id: 'LST-01', name: 'Value line', cls: '.ln / .ln.sm / .ln.tot (.v .neg .pos)', used: 'Totals and facts on pages, cards and panels.', w: 460, bg: 'page',
          vars: [[null, h('div', { style: { width: '400px' } }, ln('cart', 'Materials', '-84', '.neg'), ln('store', 'Sales (est.)', '+220', '.pos'), lnSm('clock', 'Time (small)', '1h 30'), h('div.ln.tot', Dom.icon('gold', 20), 'Gold after', h('span.v', '≈ 1,386')))]] },
        { id: 'LST-02', name: 'Compact table', cls: '.tlst > .tlh + .tlb > .tlr (.on .has :disabled)', used: 'All station lists: materials, products, recipes, commissions, lots, services, found items.', w: 560,
          vars: [['rows: normal, selected, in basket, disabled', h('div', { style: { width: '500px', height: '190px', display: 'flex' } }, tlRows())], ['empty', h('div', { style: { width: '500px', height: '80px', display: 'flex' } }, Dom.tlist('28px 1fr 60px', ['', 'Product', 'Free'], [], 'No products. Craft first.'))]] },
        { id: 'LST-03', name: 'Station menu', cls: '.smenu > .srow (.on .here :disabled) + .sdiv', used: 'Left panel at a place (stations) and the Town list (places).', w: 380, bg: 'teal',
          vars: [[null, sideWrap(300, Dom.slim('smenu',
            srow('store', 'Store (selected)', [Dom.icon('shelf', 16), '12'], '.on'),
            srow('cauldron', 'Crafting', null),
            srow('rack', 'Drying rack', h('span.badge.ok', '2')),
            (() => { const r = srow('stall', 'Market stall (closed)', null); r.disabled = true; return r; })(),
            srow(home.icon, `${home.name} (you are here)`, h('span.small', Dom.icon('walk', 16)), '.here'),
            h('div.sdiv'),
            srow('map', 'Town', h('i.key', 'M'))))]] },
        { id: 'LST-04', name: 'Product plan table', cls: '.ptab.head + .ptab', used: 'Journal, Store plan: products to sell.', w: 560, bg: 'page',
          vars: [[null, page(500, h('div.ptab.head', h('span'), h('span', 'Product'), h('span', 'Trend'), h('span', Dom.icon('gold', 12), 'each'), h('span', 'Units')),
            h('div.ptab', Dom.icon('jamu', 22), h('span', 'Kunyit asam'), h('span', Dom.icon('trend_up', 16)), h('span.num', '12'), Dom.stepper(6, noop, { step: 2 })),
            h('div.ptab', Dom.icon('salep', 22), h('span', 'Lemongrass balm'), h('span', Dom.icon('trend_flat', 16)), h('span.num', '18'), Dom.stepper(0, noop, { step: 2 })))]] },
        { id: 'LST-05', name: 'Market table', cls: '.mtab.head + .mtab (.b .pos .neg)', used: 'Journal, Market page.', w: 560, bg: 'page',
          vars: [[null, page(500, h('div.mtab.head', h('span'), h('span', 'Item'), h('span', 'Trend'), h('span', 'Range'), h('span', Dom.icon('gold', 12), 'Now')),
            h('div.mtab', Dom.icon('jamu', 22), h('span', 'Kunyit asam'), h('span', Dom.icon('trend_up', 16)), h('span.num.muted', '9–14'), h('span.num.b.pos', '12.5')),
            h('div.mtab', Dom.icon('root', 22), h('span', 'Turmeric', h('small.muted', ' fresh')), h('span', h('span.muted', '·')), h('span.num.muted', '3–5'), h('span.num.b.neg', '3.2')))]] },
        { id: 'LST-06', name: 'Opening hours table', cls: '.htab + .hc (.today .shut)', used: 'Journal, Public schedule page.', w: 620, bg: 'page',
          vars: [[null, page(560, h('div.htab.head', h('span'), ...['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => h(`span${i === 2 ? '.today' : ''}`, d))),
            h('div.htab', h('span.hp', Dom.icon(market.icon, 20), h('span', h('b', market.name), h('small.muted', ` ${Dom.mins(market.travelMin)}`))), ...market.hours.map((hr, i) => h(`span.hc${i === 2 ? '.today' : ''}${hr ? '' : '.shut'}`, hr ? (hr[0] === 0 && hr[1] === 24 ? '24h' : `${hr[0]}–${hr[1]}`) : Dom.icon('x', 12)))),
            h('div.htab', h('span.hp', Dom.icon(home.icon, 20), h('span', h('b', home.name))), ...home.hours.map((hr, i) => h(`span.hc${i === 2 ? '.today' : ''}${hr ? '' : '.shut'}`, hr ? (hr[0] === 0 && hr[1] === 24 ? '24h' : `${hr[0]}–${hr[1]}`) : Dom.icon('x', 12)))))]] },
        { id: 'LST-07', name: 'Day goal row', cls: '.drow (.now .past .lock .over) + .gslot / .gcard.sm', used: 'Journal, Daily goals page (left).', w: 560, bg: 'page',
          vars: [[null, page(500, h('div.drows', { style: { marginTop: 0 } },
            ...[['', 'empty'], ['', 'set'], ['.over', 'drop over'], ['.now', 'today (Do)'], ['.past', 'past / locked']].map(([cls, t], i) => h(`div.drow${cls}`,
              h('div.dn', h('b', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][i]), h('small', `D${i + 1}`)),
              i === 0 ? h('div.gslot', 'Drop a goal') : h('div.gcard.sm', { style: { '--gc': g(['', 'craft', 'store', 'explore', 'trade'][i]).color } }, Dom.icon(g(['', 'craft', 'store', 'explore', 'trade'][i]).icon, 22), h('b', g(['', 'craft', 'store', 'explore', 'trade'][i]).name)),
              h('div.dnote', i === 1 ? h('span.qchip', Dom.icon('lantern', 16), h('span.small', this.c.get('events', 'ev_festival').title)) : null, i === 2 ? h('span.shut', Dom.icon('market', 16), h('span.small', 'Market shut')) : null, h('span.small.muted', t)),
              h('div.dmet', i === 4 ? Dom.icon('check', 18) : i === 3 ? Dom.icon('x', 16) : null)))))]] },
        { id: 'LST-08', name: 'Objective row', cls: '.obj / .obj.done', used: 'Journal, Notes page (objectives).', w: 460, bg: 'page',
          vars: [[null, page(400, h('div.obj', h('span.box'), Dom.icon(obj[1].icon, 20), h('span', obj[1].text)), h('div.obj.done', h('span.box', Dom.icon('check', 16)), Dom.icon(obj[0].icon, 20), h('span', obj[0].text)))]] },
        { id: 'LST-09', name: 'Warning line', cls: '.warn / .warn.ok', used: 'Store plan check, Review plan card, Check page.', w: 460, bg: 'page',
          vars: [[null, h('div.warns', { style: { width: '400px' } }, h('div.warn', Dom.icon('cart', 18), 'Materials cost more than the Store jar.'), h('div.warn.ok', Dom.icon('check', 18), 'The plan looks fine.'))]] },
        { id: 'LST-10', name: 'Skill row and effect block', cls: '.skill / .eff', used: 'Journal, Skills page.', w: 560, bg: 'page',
          vars: [[null, page(500,
            h('div.skill', { style: { marginTop: 0 } }, Dom.medal('moon', 48), h('div', { style: { flex: 1 } }, h('div.row', h('b.sname', 'Moon'), h('span.spacer'), h('span.lv', 'Lv 2')), Dom.bar(0.45, 'wis'), h('div.row.small.muted', { style: { marginTop: '4px' } }, h('span', 'Craft and process.'), h('span.spacer'), h('span', '45/100 XP')))),
            h('div.eff', h('div.row', Dom.medal('sun', 32), h('b', 'Sun: store customers')), h('div.ln.sm', h('span.muted', 'Now'), h('span.v', '+10% customers')), h('div.ln.sm', h('span.muted', 'Next'), h('span.v.muted', 'Lv 3: +20%'))))]] },
        { id: 'LST-11', name: 'Basket list', cls: '.tpanel .cart > .ln.sm', used: 'Trade panels: basket lines in Market stall and Receptionist.', w: 420,
          vars: [[null, h('div.cart', { style: { width: '360px' } }, h('div.ln.sm', ib('leaf', 18), h('span', 'Lemongrass'), h('span.small.muted', '×4'), h('span.v', '14')), h('div.ln.sm', ib('sugar', 18), h('span', 'Palm sugar'), h('span.small.muted', '×2'), h('span.v', '12')))]] },
        { id: 'LST-12', name: 'Log box', cls: '.logbox + .logday + .ln.sm', used: 'Journal, Log page (Do): today, and earlier days grouped by day.', w: 460, bg: 'page',
          vars: [[null, page(400, h('div.scroll.logbox', { style: { height: '150px', flex: 'none' } }, h('div.logday', 'Week 1 · Tue (D2)'), h('div.ln.sm', Dom.icon('cauldron', 18), h('span.small.muted.lt', '09:30'), h('span.small', 'Crafted 6')), h('div.ln.sm', Dom.icon('store', 18), h('span.small.muted.lt', '13:00'), h('span.small', 'Store open'))))]] }
      ] },

      /* ===== CRD: Cards and pop-ups ===== */
      { code: 'CRD', title: 'Cards and pop-ups', items: [
        { id: 'CRD-01', name: 'Modal card', cls: '.card (rattan)', used: 'Review plan (Plan phase).', w: 480, bg: 'teal',
          vars: [[null, Dom.rattan('card', h('div.kick', 'Your plan'), h('h3', 'Ready for the week?'), h('div', { style: { width: '100%' } }, ln('cart', 'Herbs', '-84', '.neg'), h('div.ln.tot', Dom.icon('gold', 20), 'Gold after', h('span.v', '≈ 1,386'))), h('div.row', { style: { gap: '16px' } }, btn('Change it', 'alt', { icon: 'back' }), btn('Begin the week', 'gold', { icon: 'lock' })))]] },
        { id: 'CRD-02', name: 'Event card', cls: '.card + .corner + medal 88', used: 'Random or scheduled event at day start (Do).', w: 480, bg: 'teal',
          vars: [[null, Dom.rattan('card', ...Dom.corners(), h('div.kick', 'Event'), Dom.medal(rain.icon, 88), h('h3', rain.title), h('p', rain.text), h('div.acts', rain.responses.map((r) => this.respBtn(r))))]] },
        { id: 'CRD-03', name: 'Spot found card', cls: '.card + .corner (in the explore window)', used: 'City outskirt, when a spot shows up.', w: 480, bg: 'teal',
          vars: [[null, Dom.rattan('card', ...Dom.corners(), h('div.kick', 'You found a spot'), h('h3', this.c.get('spots', 'lemongrass_field').name),
            h('div.row', { style: { gap: '16px', justifyContent: 'center' } }, h('div', { style: { textAlign: 'center' } }, Dom.medal('leaf', 64), h('div.num', '+3'), h('div.small', 'Lemongrass'))),
            h('div.costrow', h('span', Dom.icon('clock', 18), '45m'), h('span', Dom.icon('energy', 18), '6'), h('span', Dom.icon('earth', 18), '+4')),
            h('div.row', { style: { gap: '16px' } }, btn('Skip', 'alt', { icon: 'skip' }), btn('Gather', 'gold', { icon: 'leaf' })))]] },
        { id: 'CRD-04', name: 'Outskirt recap', cls: '.card.recap', used: 'After Head back.', w: 480, bg: 'teal',
          vars: [[null, Dom.rattan('card.recap', h('div.kick', 'Back from the outskirt'), h('h3', 'Your herb basket'),
            h('div.costrow', h('span', Dom.icon('walk', 18), '4'), h('span', Dom.icon('leaf', 18), '2'), h('span', Dom.icon('skip', 18), '1')),
            h('div', { style: { width: '100%' } }, h('div.ln.sm', ib('leaf', 20), h('span', 'Lemongrass'), h('span.small.muted', 'fresh'), h('span.v.pos', '+3')), lnSm('energy', 'Energy', '-12', '.neg')),
            h('div.row', { style: { gap: '16px' } }, btn('Stay', 'alt', { icon: 'back' }), btn('Town', 'gold', { icon: 'map' })))]] },
        { id: 'CRD-05', name: 'Item card', cls: '.card.icard', used: 'Opens from any item icon (BTN-12).', w: 520, bg: 'teal',
          vars: [[null, Dom.rattan('card.icard', h('button.iconbtn.close', { html: Icons.svg('x', 16) }),
            h('div.row', { style: { gap: '16px', width: '100%' } }, Dom.medal('jamu', 72), h('div', { style: { textAlign: 'left' } }, h('div.kick', `Product · ${tiers.fine.name}`), h('h3', this.c.get('items', 'kunyit_asam').name), Dom.stars(tiers.fine.stars))),
            h('p', { style: { textAlign: 'left', width: '100%' } }, this.c.get('items', 'kunyit_asam').text ?? ''),
            h('div.chipline', { style: { width: '100%' } }, h('span.small.muted', 'You have'), h('span.qchip', Dom.stars(2), '6')),
            h('div', { style: { width: '100%' } }, lnSm('gold', 'Worth now', '12.5'), lnSm('trend_up', 'Wanted this week', 'high')))]] },
        { id: 'CRD-06', name: 'Story letter', cls: '.letter (rattan + corners)', used: 'Story screen after New game.', w: 720, bg: 'teal',
          vars: [[null, Dom.rattan('letter', ...Dom.corners(), h('div', { style: { position: 'relative', zIndex: 1 } },
            h('div.row', Dom.medal('quest', 48), h('div', h('div.kick', story.from), h('h2', story.title))),
            h('p', story.paragraphs[0]), h('p.sign', story.sign),
            h('div.row.end', { style: { marginTop: '24px' } }, btn(story.button, 'gold', { icon: 'journal' }))))]] },
        { id: 'CRD-07', name: 'Goal card (deck)', cls: '.deck > .gcard (.on .lock) / .deck.over', used: 'Journal, Daily goals page (right): the goal deck.', w: 460, bg: 'page',
          vars: [['normal, picked, locked', h('div.deck', { style: { width: '400px', marginTop: 0 } }, ...[['craft', ''], ['store', '.on'], ['explore', '.lock']].map(([id, cls]) => h(`div.gcard${cls}`, { style: { '--gc': g(id).color } }, h('div.gi', Dom.medal(g(id).icon, 40)), h('div', h('b', g(id).name), h('p', g(id).text ?? '')))))],
            ['drop to remove', h('div.deck.over', { style: { width: '400px', marginTop: 0 } }, h('div.gcard', { style: { '--gc': g('trade').color } }, h('div.gi', Dom.medal(g('trade').icon, 40)), h('div', h('b', g('trade').name))))]] },
        { id: 'CRD-08', name: 'Goal card (small)', cls: '.gcard.sm', used: 'Journal, Daily goals rows (LST-07).', w: 460, bg: 'page',
          vars: goals.map((x) => [x.name, h('div.gcard.sm', { style: { '--gc': x.color, width: '160px' } }, Dom.icon(x.icon, 22), h('b', x.name))]) },
        { id: 'CRD-09', name: 'Mini card', cls: '.sf > .mini', used: 'Rest window (Short break, Eat, Sleep). Act page appointments.', w: 560,
          vars: [['Rest', Dom.slim('', { style: { width: '220px' } }, h('div.mini', Dom.medal('meal', 72), h('h5', 'Eat a meal'), h('div.costrow', h('span', Dom.icon('energy', 16), '+30'), h('span', Dom.icon('meal', 16), '6')), Dom.dots(3, ['f', '', '']), btn('Eat a meal', 'sm', { icon: 'meal' })))],
            ['Act', Dom.slim('', { style: { width: '220px' } }, h('div.mini', Dom.medal('rack', 56), h('h5', rack.name), h('div.small', rack.text), btn(String(rack.price), 'sm', { icon: 'gold' })))]] },
        { id: 'CRD-10', name: 'Place info card', cls: '.pinfo', used: 'Town list: the picked place, with Go.', w: 380, bg: 'teal',
          vars: [[null, sideWrap(292, Dom.slim('pinfo',
            h('div.row', Dom.medal(market.icon, 36), h('b', market.name)), h('div.chipline', market.stations.map((id) => h('span.qchip.named', Dom.icon(this.c.get('stations', id).icon, 16), this.c.get('stations', id).name))),
            h('div.costrow', { style: { justifyContent: 'flex-start' } }, h('span', Dom.icon('clock', 16), Dom.mins(market.travelMin)), h('span', Dom.icon('energy', 16), '-4'), h('span', Dom.icon('walk', 16), 'arrive 10:50')),
            btn('Go', 'gold.sm', { icon: 'walk' })))]] },
        { id: 'CRD-11', name: 'Stat tile', cls: '.statgrid > .stat', used: 'Check, Act and Retrospective pages.', w: 460, bg: 'page',
          vars: [[null, h('div.statgrid', { style: { width: '400px' } }, h('div.stat', h('span.k', Dom.icon('trend_up', 16), 'In'), h('span.v', '+420')), h('div.stat', h('span.k', Dom.icon('trend_down', 16), 'Out'), h('span.v', '-310')), h('div.stat', h('span.k', Dom.icon('gold', 16), 'Gold'), h('span.v', '1,360')))]] },
        { id: 'CRD-12', name: 'Jar box', cls: '.jars > .jarbox', used: 'Journal, Store plan: budget jars (Store, Personal, Buffer).', w: 460, bg: 'page',
          vars: [['Plan (edit)', h('div.jarbox', Dom.raw(Dom.jarSvg(0.4, '#5FA39A', 48)), h('div.row', { style: { gap: '4px' } }, Dom.icon('cart', 16), h('b.small', 'Store')), Dom.stepper(300, noop, { step: 50 }))],
            ['Do (read only)', h('div.jarbox', Dom.raw(Dom.jarSvg(0.15, '#9C87C0', 48)), h('div.row', { style: { gap: '4px' } }, Dom.icon('buffer', 16), h('b.small', 'Buffer')), h('div.v', '100'))]] },
        { id: 'CRD-13', name: 'Day cell', cls: '.days > .day + .goalchip / .goalchip.empty', used: 'Check page: goals met per day.', w: 460, bg: 'page',
          vars: [[null, h('div.days', { style: { width: '400px', gridTemplateColumns: 'repeat(4, 1fr)' } },
            h('div.day', { style: { minHeight: '96px' } }, h('span.dn', 'Mon'), h('div.goalchip', { style: { background: g('craft').color, height: '40px' } }, Dom.icon(g('craft').icon, 22)), Dom.icon('check', 18)),
            h('div.day', { style: { minHeight: '96px' } }, h('span.dn', 'Tue'), h('div.goalchip', { style: { background: g('store').color, height: '40px' } }, Dom.icon(g('store').icon, 22)), Dom.icon('x', 16)),
            h('div.day', { style: { minHeight: '96px' } }, h('span.dn', 'Wed'), h('div.goalchip.empty', { style: { height: '40px' } }, '-'), Dom.icon('x', 16)),
            h('div.day.now', { style: { minHeight: '96px' } }, h('span.dn', 'now'), h('div.goalchip', { style: { background: g('explore').color, height: '40px' } }, Dom.icon(g('explore').icon, 22))))]] },
        { id: 'CRD-14', name: 'Trade panel', cls: '.tpanel', used: 'Right side of Market stall, Receptionist and Quest board windows.', w: 460,
          vars: [[null, h('div.tpanel', { style: { width: '380px' } }, h('div.kick', 'Basket'),
            h('div.row', { style: { gap: '8px' } }, btn('Fill from plan', 'alt.sm', { icon: 'note' }), btn('', 'alt.sm', { icon: 'x' })),
            h('div.cart', h('div.ln.sm', ib('leaf', 18), h('span', 'Lemongrass'), h('span.small.muted', '×4'), h('span.v', '14'))),
            h('div.row', h('span.tot.neg', Dom.icon('gold', 26), '-14'), h('span.spacer'), jarTag('store', 186, 0.6)),
            h('div.row.end', btn('Buy', 'gold', { icon: 'cart', min: 15 })))]] },
        { id: 'CRD-15', name: 'Help popup', cls: '.helppop', used: 'Hover on any part with help (data-help).', w: 340, bg: 'teal',
          vars: [[null, h('div.helppop.on', h('b', help.title), h('p', help.text))]] },
        { id: 'CRD-16', name: 'Toast', cls: '.toast / .toast.bad', used: 'Bottom centre, 3 s: results and refusals.', w: 460, bg: 'teal',
          vars: [['good', h('div.toast', h('span.ti', Dom.icon('cauldron', 20)), '+6 made')], ['refused', h('div.toast.bad', h('span.ti', Dom.icon('warn', 20)), REASON_TEXT.tired)]] },
        { id: 'CRD-17', name: 'Sleep transition', cls: '.nightfx (.nf-sky .nf-moon .nf-sun .nf-t)', used: 'Full screen after Sleep: night falls, then the new day. Shown here at night.', w: 460, bg: 'teal',
          vars: [[null, box(400, 260, h('div.nightfx', { style: { animation: 'none', borderRadius: '8px' } }, h('div.nf-sky', h('span.nf-moon', { style: { top: '-110px', animation: 'none' } })), h('div.nf-t', { style: { animation: 'none', marginTop: '90px' } }, h('small', 'A new day'), h('b', 'Day 4'), h('span', 'Thu · 07:00'))))]] },
        { id: 'CRD-18', name: 'Walk banner', cls: '.walkbar', used: 'Bottom of the screen while the player walks to a place.', w: 460, bg: 'scene',
          vars: [[null, h('div.walkbar', { style: { position: 'relative', left: 'auto', bottom: 'auto', transform: 'none' } }, Dom.medal('walk', 32), h('span', 'On the way to'), h('b', market.name))]] },
        { id: 'CRD-19', name: 'Guide dialogue', cls: '.rf.tutor (.who, .say)', used: 'First week: the neighbour guide at the bottom of the screen (TutorialView, data/tutorial/tutorial.json).', w: 800, bg: 'scene',
          vars: [[null, (() => { const t = this.c.get('tutorial', 'tutorial'), l = t.steps[0].lines; return Dom.rattan('tutor', { style: { position: 'relative', left: 'auto', bottom: 'auto', transform: 'none' } },
            h('div.who', Dom.medal(t.speaker.icon, 64), h('b', t.speaker.name), h('small', t.speaker.role)),
            h('div.say', h('p', l[2]), h('div.row', Dom.dots(l.length, l.map((_, k) => (k <= 2 ? 'f' : ''))), h('span.spacer'), btn('Skip all tips', 'alt.sm'), btn('Skip', 'alt.sm', { icon: 'skip' }), btn('Next', 'gold.sm', { icon: 'next' })))); })()]] }
      ] },

      /* ===== CHP: Chips, badges and pills ===== */
      { code: 'CHP', title: 'Chips, badges and pills', items: [
        { id: 'CHP-01', name: 'Chip', cls: '.qchip (.ok .miss .named) / .hchip (.shut) / .shut', used: 'Have/need, effects, XP, counts, store result, hours today (location header, Town list), closed places (Daily goals), named places and items (item card, place info).', w: 780,
          vars: [['neutral', Dom.chip('shelf', '12')], ['ok', Dom.chip('leaf', '6/4', 'ok')], ['missing', Dom.chip('root', '1/4', 'miss')], ['named', h('span.qchip.named', Dom.icon('stall', 16), this.c.get('stations', 'stall').name)],
            ['open hours', h('span.hchip', Dom.icon('clock', 14), '7–17')], ['closed hours', h('span.hchip.shut', Dom.icon('lock', 14), 'Closed')], ['closed place', h('span.shut', Dom.icon('market', 16), h('span.small', 'Market shut'))]] },
        { id: 'CHP-04', name: 'Count badge', cls: '.badge / .badge.ok', used: 'Station menu (ready on rack), recipe "can make", quest "taken".', w: 300,
          vars: [['red', h('span.badge', '3')], ['green', h('span.badge.ok', '2')], ['text', h('span.badge.ok', 'taken')]] },
        { id: 'CHP-05', name: 'Level chip', cls: '.lv', used: 'Skills page.', w: 200, bg: 'page',
          vars: [[null, h('span.lv', 'Lv 2')]] },
        { id: 'CHP-06', name: 'Jar badge', cls: '.jartag / .jartag.over', used: 'Next to every cost total: which jar pays.', w: 560,
          vars: [['store', jarTag('store', 186, 0.6)], ['personal', jarTag('personal', 40, 0.3)], ['over budget', jarTag('store', -24, 0)]] },
        { id: 'CHP-07', name: 'Price level tag', cls: '.slot .p.lv-low / .lv-fair / .lv-high', used: 'Corner of a shelf slot.', w: 260,
          vars: ['low', 'fair', 'high'].map((k) => [k, h(`span.lv-${k}`, { style: { fontSize: '10px', padding: '0 4px', borderRadius: '4px', color: '#fff', fontWeight: 700 } }, k[0].toUpperCase())]) },
        { id: 'CHP-08', name: 'Quality stars', cls: '.tier', used: 'Product quality in lists, shelf slots, item card.', w: 300,
          vars: [['1', Dom.stars(1)], ['2', Dom.stars(2)], ['3', Dom.stars(3)]] },
        { id: 'CHP-09', name: 'Hotspot pill', cls: '.hot (.on .here :disabled .place)', used: 'Over a station in the 3D room, over a place in the 3D town.', w: 780, bg: 'scene',
          vars: [['station', hot('cauldron', 'Crafting')], ['hover', (() => { const b = hot('cauldron', 'Crafting'); b.style.transform = 'scale(1.06)'; return b; })()], ['open', hot('store', 'Store', '.on')], ['closed', hot('stall', this.c.get('stations', 'stall').name, '', { disabled: true })], ['place, you are here', hot(home.icon, home.name, '.place.here')]] },
        { id: 'CHP-10', name: 'Chart legend', cls: '.legend', used: 'Retrospective chart.', w: 260, bg: 'page',
          vars: [[null, h('div.legend', h('span', h('i', { style: { background: '#D9A326' } }), 'Gold'), h('span', h('i', { style: { background: '#B5523B' } }), 'Debt'))]] }
      ] },

      /* ===== VAL: Values and inputs ===== */
      { code: 'VAL', title: 'Values and inputs', items: [
        { id: 'VAL-01', name: 'Stepper', cls: '.stepper', used: 'Store plan units and budget jars, Drying quantity, Quest request.', w: 360,
          vars: [['normal', Dom.stepper(6, noop)], ['at minimum', Dom.stepper(0, noop)]] },
        { id: 'VAL-02', name: 'Big stepper', cls: '.stepper.big', used: 'Store slot quantity, Craft batches, Grind, Buy food, Debt payment.', w: 360,
          vars: [[null, Dom.stepper(4, noop, { big: true, max: 9 })]] },
        { id: 'VAL-03', name: 'Mini stepper', cls: '.mstep', used: 'Quantity column of trade tables.', w: 300,
          vars: [['zero', Dom.mini(0, noop)], ['set', Dom.mini(4, noop)]] },
        { id: 'VAL-04', name: 'Bar', cls: '.bar / .low / .gold / .wis / .ver', used: 'Skills XP, Ledger income and spending, jars used, Check sold.', w: 460, bg: 'page',
          vars: [['default (green)', Dom.bar(0.6, '', 160)], ['low (red)', Dom.bar(0.9, 'low', 160)], ['gold', Dom.bar(0.5, 'gold', 160)], ['wis (purple)', Dom.bar(0.4, 'wis', 160)], ['ver (teal)', Dom.bar(0.7, 'ver', 160)]] },
        { id: 'VAL-05', name: 'Dots', cls: '.dots i (.f .ok .no)', used: 'Meals eaten (Rest), craft batches, goals per week (Retrospective).', w: 360,
          vars: [['meals', Dom.dots(3, ['f', 'f', ''])], ['batches', Dom.dots(5, ['ok', 'ok', 'no', '', ''])], ['week goals', Dom.dots(7, ['ok', 'no', 'ok', 'ok', 'no', 'ok', 'ok'])]] },
        { id: 'VAL-06', name: 'Big total', cls: '.bigtotal', used: 'Store open and Shop result.', w: 260,
          vars: [[null, h('div.bigtotal', Dom.icon('gold', 40), '+186')]] },
        { id: 'VAL-07', name: 'Basket total', cls: '.tpanel .tot (.neg .pos)', used: 'Trade panels.', w: 420,
          vars: [['cost', h('div.tpanel', h('span.tot.neg', Dom.icon('gold', 26), '-42'))], ['income', h('div.tpanel', h('span.tot.pos', Dom.icon('gold', 26), '+96'))], ['zero', h('div.tpanel', h('span.tot', Dom.icon('gold', 26), '0'))]] },
        { id: 'VAL-08', name: 'Cost row', cls: '.costrow', used: 'Craft, Grind, Rest cards, spot card, recap, place info, service.', w: 360,
          vars: [[null, h('div.costrow', h('span', Dom.icon('jamu', 18), '+6'), h('span', Dom.icon('clock', 18), '1h 30'), h('span', Dom.icon('energy', 18), '8'))]] },
        { id: 'VAL-09', name: 'Budget jar graphic', cls: 'Dom.jarSvg(ratio, colour, size)', used: 'Jar box (48 px) and jar badge (18 px). Fill = gold left.', w: 360,
          vars: [['jar box 48 px', Dom.raw(Dom.jarSvg(0.6, '#5FA39A', 48))], ['jar badge 18 px', Dom.raw(Dom.jarSvg(0.6, '#D9A326', 18))]] },
        { id: 'VAL-10', name: 'Line chart', cls: '.chart (svg)', used: 'Retrospective: gold and debt per week.', w: 520, bg: 'page',
          vars: [[null, Dom.raw(`<svg class="chart" viewBox="0 0 440 160" style="width:440px"><line x1="32" x2="408" y1="128" y2="128" stroke="#B9AE8E" stroke-dasharray="3 4"/><line x1="32" x2="408" y1="80" y2="80" stroke="#B9AE8E" stroke-dasharray="3 4"/><line x1="32" x2="408" y1="32" y2="32" stroke="#B9AE8E" stroke-dasharray="3 4"/><polyline points="32,40 126,46 220,52 314,60 408,66" fill="none" stroke="#B5523B" stroke-width="2.4"/><polyline points="32,110 126,104 220,96 314,100 408,88" fill="none" stroke="#D9A326" stroke-width="2.4"/></svg>`)]] }
      ] },

      /* ===== STN: Station parts ===== */
      { code: 'STN', title: 'Station parts', items: [
        { id: 'STN-01', name: 'Shelf', cls: '.shelf', used: 'Store window (3 x 3), Drying rack (5 per row).', w: 420,
          vars: [[null, h('div.shelf', { style: { width: '340px' } }, slot({ lv: 'fair', price: 12, icon: 'jamu', stars: 2, q: 4, sel: true }), slot({ lv: 'low', price: 9, icon: 'salep', stars: 1, q: 6 }), slot(null))]] },
        { id: 'STN-02', name: 'Shelf slot', cls: '.slot / .slot.sel / .slot.empty', used: 'Store shelf.', w: 460,
          vars: [['filled', h('div', { style: { width: '110px', display: 'grid' } }, slot({ lv: 'high', price: 15, icon: 'jamu', stars: 3, q: 2 }))], ['selected', h('div', { style: { width: '110px', display: 'grid' } }, slot({ lv: 'fair', price: 12, icon: 'jamu', stars: 2, q: 4, sel: true }))], ['empty', h('div', { style: { width: '110px', display: 'grid' } }, slot(null))]] },
        { id: 'STN-03', name: 'Drying slot', cls: '.slot (64 px)', used: 'Drying rack cells.', w: 420,
          vars: [['drying', h('div.slot', { style: { height: '64px', width: '80px' } }, Dom.icon('leaf', 26), h('span.q', '2d'))], ['ready', h('div.slot', { style: { height: '64px', width: '80px' } }, Dom.icon('dried', 26), h('span.q', '✓'))], ['free', h('div.slot.empty', { style: { height: '64px', width: '80px' } })]] },
        { id: 'STN-04', name: 'Store hour bars', cls: '.hours > .h (.now) + .lab', used: 'Store window while open.', w: 460,
          vars: [[null, h('div', { style: { width: '400px' } }, h('div.hours', [3, 2, 4, 1, 0, 0, 0, 0, 0, 0, 0].map((n, i) => h(`div.h${i === 4 ? '.now' : ''}`, { style: { height: `${8 + (n / 4) * 80}px` } }, Array.from({ length: n }, () => h('i'))))),
            h('div.hours', { style: { height: 'auto' } }, Array.from({ length: 11 }, (_, i) => h('span.lab', String(9 + i)))))]] },
        { id: 'STN-05', name: 'Explore trail', cls: '.trail + .walker', used: 'City outskirt window, top.', w: 620,
          vars: [[null, h('div.trail', { style: { width: '560px', height: '84px' } },
            Dom.raw('<svg viewBox="0 0 800 160" preserveAspectRatio="none"><rect width="800" height="160" fill="#F1E8D4"/><g style="mix-blend-mode:multiply"><ellipse cx="400" cy="140" rx="520" ry="80" fill="#6E9A6A" fill-opacity=".45" filter="url(#wc)"/></g><path d="M0 120 C160 100 260 130 400 112 C540 96 640 124 800 108" stroke="#2D3B3A" stroke-width="1.2" stroke-dasharray="5 7" fill="none"/><g opacity=".85"><use href="#tree" x="40" y="30" width="44" height="55"/><use href="#tree" x="520" y="26" width="46" height="58"/></g></svg>'),
            h('div.walker', { style: { left: '30%' } }, Dom.medal('walk', 38)))]] },
      ] },

      /* ===== ICN: Icons ===== */
      { code: 'ICN', title: 'Icons', sub: 'Every name stays when the art changes', items: [
        { id: 'ICN-01', name: 'Medallion', cls: '.ico (--s size)', used: 'Big icons: goal cards, cards, location header, skills, item card, plaques.', w: 560,
          vars: [26, 38, 48, 72, 96].map((s) => [`${s} px`, Dom.medal('herb', s)]) },
        { id: 'ICN-02', name: 'Line icon set', cls: 'Icons.svg(name)', used: 'Everywhere. 24 x 24 view box.', w: 2304, stage: { justifyContent: 'flex-start', gap: '12px 8px' },
          vars: Icons.names().map((n) => [n, h('div', { style: { width: '76px', display: 'grid', placeItems: 'center' } }, Dom.icon(n, 32))]) }
      ] }
    ];
  }
}
