import { MSG } from '../../core/EventBus.js';
import { Dom } from './Dom.js';
import { Icons } from './Icons.js';
import { WEEKDAYS } from '../../model/Calendar.js';
import { CheckView } from './CheckView.js';
import { ActView } from './ActView.js';

const h = Dom.h;
/** Journal tabs in Scene & Flow order (Plan phase). The Do phase adds the Log tab. */
const TABS = [
  { id: 'schedule', icon: 'calendar', label: 'Daily goals', help: 'tabSchedule' },
  { id: 'store', icon: 'store', label: 'Store plan', help: 'tabStore' },
  { id: 'ledger', icon: 'ledger', label: 'Ledger and assets', help: 'tabLedger' },
  { id: 'market', icon: 'chart', label: 'Market', help: 'tabMarket' },
  { id: 'hours', icon: 'clock', label: 'Public schedule', help: 'tabHours' },
  { id: 'skills', icon: 'skills', label: 'Skills', help: 'tabSkills' },
  { id: 'notes', icon: 'note', label: 'Notes', help: 'tabNotes' },
  { id: 'log', icon: 'log', label: 'Log', help: 'tabLog' }
];
const trendIcon = (t) => (t === 'high' ? 'trend_up' : t === 'low' ? 'trend_down' : 'trend_flat');

/**
 * JournalView: the Planner Book (night-teal bookcloth, gold tooling, die-cut tabs, phase plaque and gold action button at top right (user decision 8 Nov 2026), no rattan).
 * Plan phase tabs (Scene & Flow): Daily goals, Store plan, Ledger and assets, Market, Public schedule,
 * Skills, Notes (last week's notes and the objectives). The "Review plan" ribbon locks the plan.
 * Do phase: the same book to look up, plus the Log tab. Check and Act pages come from CheckView and ActView.
 */
export class JournalView {
  constructor(ui) {
    this.ui = ui;
    this.check = new CheckView(ui);
    this.act = new ActView(ui);
  }

  /** @param {'plan'|'do'|'check'|'act'} mode */
  render(mode) {
    const ui = this.ui, L = ui.local;
    let pages, ribbon = null, tabs = [];
    if (mode === 'check') { pages = this.check.pages(); ribbon = this.check.ribbon(); }
    else if (mode === 'act') { pages = this.act.pages(); ribbon = this.act.ribbon(); }
    else {
      tabs = mode === 'plan' ? TABS.filter((t) => t.id !== 'log') : TABS;
      if (!tabs.some((t) => t.id === L.tab)) L.tab = 'schedule';
      const page = {
        schedule: () => this.#schedule(mode), store: () => this.#store(mode), ledger: () => this.#ledger(),
        market: () => this.#market(), hours: () => this.#hours(mode), skills: () => this.#skills(), notes: () => this.#notes(), log: () => this.#log()
      };
      pages = page[L.tab]();
      if (mode === 'plan') { ribbon = Dom.btn('Review plan', () => ui.set({ review: true }), { cls: 'gold.ribbon', icon: 'check' }); ribbon.dataset.help = 'reviewPlan'; }
    }
    const n = (ui.st.cal.month - 1) * ui.num('WEEKS_PER_MONTH') + ui.st.cal.week;
    const tag = { plan: ['calendar', 'Plan'], do: ['journal', 'Journal'], check: ['note', 'Check'], act: ['debt', 'Act'] }[mode];
    const els = [
      h(`div.phasebar${mode === 'do' ? '.do' : ''}`,
        Dom.slim('plaque', Dom.medal(tag[0], 38), h('div', h('small', mode === 'act' ? `MONTH ${ui.st.cal.month}` : `WEEK ${ui.st.cal.week}`), h('b', tag[1]))),
        ribbon),
      h('div.book',
        h('div.tool'), h('div.tool2'), h('div.spineband'),
        h('div.pages',
          h('div.pg.l', ...pages[0], h('div.pageno', Dom.icon('moon', 14), String(n * 2 - 1))),
          h('div.pg.r', ...pages[1], h('div.pageno', String(n * 2), Dom.icon('moon', 14)))),
        tabs.length ? h('div.tabs', tabs.map((t) => h(`button.tab${L.tab === t.id ? '.on' : ''}`, { 'data-label': t.label, 'data-help': t.help, onclick: () => ui.set({ tab: t.id }) }, Dom.icon(t.icon, 26)))) : null,
        ...Dom.corners().map((c) => { c.style.zIndex = 3; return c; }),
        mode === 'do' ? h('button.iconbtn.close', { style: { right: '-12px', top: '-12px' }, title: 'Close', onclick: () => ui.set({ journal: false }), html: Icons.svg('x', 16) }) : null)
    ];
    const box = h('div', { style: { position: 'absolute', inset: 0 } }, ...els);
    if (mode === 'plan' && L.review) box.append(this.#review());
    return box;
  }

  #absWeek() { return this.ui.sys.time.absWeek(); }

  /* ---------- Daily goals (Schedule) ---------- */
  #schedule(mode) {
    const ui = this.ui, st = ui.st, L = ui.local;
    const goals = ui.c.all('goals').sort((a, b) => a.order - b.order);
    const editable = (i) => mode === 'plan' || i >= st.cal.day;
    const sched = ui.c.all('events').filter((e) => e.type === 'scheduled');
    const absWeek = this.#absWeek();
    const places = ui.c.all('places');
    const picked = L.pick.goal ?? null;
    const setGoal = (i, g) => ui.send(MSG.INTENT_SET_GOAL, { index: i, goal: g });
    const drop = (i, data) => {
      if (!editable(i)) return;
      if (data.startsWith('g:')) setGoal(i, data.slice(2));
      else if (data.startsWith('d:')) {
        const j = Number(data.slice(2));
        if (j === i || !editable(j)) return;
        const a = st.plan.goals[i], b = st.plan.goals[j];
        setGoal(i, b); setGoal(j, a);
      }
    };
    const dropZone = (el, onDrop) => {
      el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('over'); });
      el.addEventListener('dragleave', () => el.classList.remove('over'));
      el.addEventListener('drop', (e) => { e.preventDefault(); el.classList.remove('over'); onDrop(e.dataTransfer.getData('text/plain')); });
      return el;
    };
    const dragFrom = (el, data) => {
      el.setAttribute('draggable', 'true');
      el.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', data); e.dataTransfer.effectAllowed = 'copyMove'; });
      return el;
    };

    const rows = st.plan.goals.map((g, i) => {
      const goal = g ? ui.c.get('goals', g) : null;
      const met = st.week.goalsMet[i];
      const ev = sched.find((e) => e.trigger.week === absWeek && e.trigger.day === i + 1);
      const shut = places.filter((p) => !p.hours[i]);
      const cls = [mode === 'do' && i === st.cal.day - 1 ? 'now' : '', mode === 'do' && i < st.cal.day - 1 ? 'past' : '', editable(i) ? '' : 'lock'].filter(Boolean).join('.');
      const card = goal
        ? h('div.gcard.sm', { style: { '--gc': goal.color } }, Dom.icon(goal.icon, 22), h('b', goal.name))
        : h('div.gslot', editable(i) ? (picked ? 'Click to set' : 'Drop a goal') : '—');
      if (goal && editable(i)) dragFrom(card, `d:${i}`);
      const row = h(`div.drow${cls ? '.' + cls : ''}`, { onclick: () => { if (picked && editable(i)) { setGoal(i, picked); } } },
        h('div.dn', h('b', WEEKDAYS[i]), h('small', `D${i + 1}`)),
        card,
        h('div.dnote',
          ev ? h('span.qchip', { title: ev.title }, Dom.icon(ev.icon, 16), h('span.small', ev.title)) : null,
          ...shut.map((p) => h('span.shut', { title: `${p.name} closed` }, Dom.icon(p.icon, 16), Dom.icon('x', 10)))),
        h('div.dmet', { 'data-help': 'goalMet' }, met === true ? Dom.icon('check', 18) : met === false ? Dom.icon('x', 16) : null));
      return editable(i) ? dropZone(row, (d) => drop(i, d)) : row;
    });

    const set = st.plan.goals.filter(Boolean).length;
    const deck = goals.map((g) => {
      const c = h(`div.gcard${picked === g.id ? '.on' : ''}`, { style: { '--gc': g.color }, title: g.name, onclick: () => ui.set({ pick: { ...L.pick, goal: picked === g.id ? null : g.id } }) },
        h('div.gi', Dom.medal(g.icon, 40)),
        h('div', h('b', g.name), h('p', g.text ?? '')));
      return dragFrom(c, `g:${g.id}`);
    });
    const deckBox = dropZone(h('div.deck', deck), (d) => { if (d.startsWith('d:')) { const j = Number(d.slice(2)); if (editable(j)) setGoal(j, null); } });
    return [
      [h('h3', Dom.icon('calendar', 28), `Week ${absWeek}`, Dom.help('tabSchedule'), h('span.aside', Dom.icon('star', 16), `${set}/${st.plan.goals.length}`)),
        h('div.drows', rows)],
      [h('h3', Dom.icon('star', 28), 'Goal cards', Dom.help('goalDeck')), deckBox]
    ];
  }

  /* ---------- Store plan ---------- */
  #store(mode) {
    const ui = this.ui, st = ui.st, sys = ui.sys;
    const f = sys.plan.forecast();
    const products = ui.c.all('items').filter((i) => i.kind === 'product');
    const edit = mode === 'plan';
    const step = ui.num('PLAN_PRODUCT_STEP'), bstep = ui.num('BUDGET_STEP');
    const b = st.plan.budget;
    const tier = sys.skills.tier();
    const jar = (k, icon, color, label) => h('div.jarbox', { 'data-help': `jar${label}` },
      Dom.raw(this.#jarSvg(st.gold ? b[k] / st.gold : 0, color)),
      h('div.row', { style: { gap: '4px' } }, Dom.icon(icon, 16), h('b.small', label)),
      edit ? Dom.stepper(b[k], (d) => ui.send(MSG.INTENT_SET_BUDGET, { [k]: Math.max(0, b[k] + d) }), { step: bstep }) : h('div.v', String(b[k])));
    const jarsTotal = b.store + b.personal + b.buffer;
    const left = [
      h('h3', Dom.icon('jamu', 28), 'Products to sell', Dom.help('products'), h('span.aside', { 'data-help': 'products' }, Dom.icon('tag', 16), `${f.storeGoal}`)),
      h('div.ptab.head', h('span'), h('span', 'Product'), h('span', { 'data-help': 'trend' }, 'Trend'), h('span', Dom.icon('gold', 12), 'each'), h('span', 'Units')),
      ...products.map((p) => {
        const q = st.plan.products[p.id] ?? 0;
        return h('div.ptab',
          Dom.icon(p.icon, 22), h('span', p.name),
          h('span', { 'data-help': 'trend' }, Dom.icon(trendIcon(st.market.trend[p.id]), 16)),
          h('span.num', `${Math.round(sys.economy.productValue(p.id, tier))}`),
          edit ? Dom.stepper(q, (d) => ui.send(MSG.INTENT_SET_PRODUCT, { product: p.id, qty: Math.max(0, q + d) }), { step }) : h('span.num', String(q)));
      }),
      h('h4', Dom.icon('cart', 18), 'Materials needed', Dom.help('materials'), h('span.aside', Dom.icon('gold', 14), `${f.matCost}`)),
      h('div.scroll.mats', f.materials.length ? f.materials.map((m) => {
        const it = ui.c.get('items', m.item);
        const ok = m.have >= m.need;
        return h('div.ln.sm',
          Dom.icon(Icons.forItem(it, m.variant), 20), h('span', it.name), h('span.small.muted', m.variant),
          h(`span.qchip${ok ? '.ok' : '.miss'}`, { title: 'Have / need' }, `${m.have}/${m.need}`),
          m.process && !ok ? h('span.row', { title: m.process === 'dried' ? 'Dry on the rack' : 'Dry, then grind' }, Dom.icon(m.process === 'dried' ? 'rack' : 'grinder', 18)) : null,
          h('span.v', ok ? Dom.icon('check', 16) : `${m.cost}`));
      }) : h('div.small.muted', { style: { padding: '8px 0' } }, 'Pick products first.'))
    ];
    const right = [
      h('h3', Dom.icon('jar', 28), 'Budget', h('span.aside', { 'data-help': 'gold' }, Dom.icon('gold', 16), `${Math.round(st.gold)}`)),
      h('div.jars', jar('store', 'cart', '#5FA39A', 'Store'), jar('personal', 'meal', '#D9A326', 'Personal'), jar('buffer', 'buffer', '#9C87C0', 'Buffer')),
      h('div', { style: { marginTop: '16px' } },
        h('div.ln', Dom.icon('jar', 20), 'In jars', h(`span.v${jarsTotal > st.gold ? '.neg' : ''}`, `${jarsTotal} / ${Math.round(st.gold)}`)),
        h('div.ln', Dom.icon('cart', 20), 'Materials', h('span.v.neg', `-${f.matCost}`)),
        h('div.ln', Dom.icon('house', 20), 'Living cost', h('span.v.neg', `-${f.living}`)),
        f.monthEnd ? h('div.ln', Dom.icon('debt', 20), 'Month-end bills', h('span.v.neg', `-${f.due}`)) : null,
        h('div.ln.tot', { 'data-help': 'goldAfter' }, Dom.icon('gold', 20), 'Gold after', h('span.v', `≈ ${f.goldAfter}`))),
      h('h4', Dom.icon('warn', 18), 'Plan check', Dom.help('warnings')),
      f.warnings.length ? h('div.warns', f.warnings.map((w) => h('div.warn', Dom.icon(w.icon, 18), w.text)))
        : h('div.warn.ok', Dom.icon('check', 18), 'The plan looks fine.')
    ];
    return [left, right];
  }

  #jarSvg(ratio, color) {
    const r = Math.max(0, Math.min(1, ratio));
    const y = 40 - r * 28;
    return `<svg width="48" height="52" viewBox="0 0 40 44"><defs><clipPath id="jc${color.slice(1)}"><path d="M9 10h22l3 6v22a4 4 0 01-4 4H10a4 4 0 01-4-4V16z"/></clipPath></defs>
      <path d="M9 10h22l3 6v22a4 4 0 01-4 4H10a4 4 0 01-4-4V16z" fill="#F4ECDB" stroke="#2D3B3A" stroke-width="1.4"/>
      <rect x="0" y="${y}" width="40" height="44" fill="${color}" clip-path="url(#jc${color.slice(1)})" opacity=".85"/>
      <path d="M9 10h22l3 6v22a4 4 0 01-4 4H10a4 4 0 01-4-4V16z" fill="none" stroke="#2D3B3A" stroke-width="1.4"/>
      <rect x="8" y="4" width="24" height="6" rx="2" fill="#C8955A" stroke="#2D3B3A" stroke-width="1.2"/></svg>`;
  }

  #review() {
    const ui = this.ui, f = ui.sys.plan.forecast();
    return h('div.veil',
      Dom.rattan('card',
        h('div.kick', 'Review plan'),
        h('h3', 'Start the week?'),
        h('div', { style: { width: '100%' } },
          h('div.ln', Dom.icon('tag', 20), 'Sell goal', h('span.v', String(f.storeGoal))),
          h('div.ln', Dom.icon('cart', 20), 'Materials', h('span.v.neg', `-${f.matCost}`)),
          h('div.ln', Dom.icon('house', 20), 'Living cost', h('span.v.neg', `-${f.living}`)),
          h('div.ln', Dom.icon('store', 20), 'Sales (est.)', h('span.v.pos', `+${f.sales}`)),
          h('div.ln.tot', Dom.icon('gold', 20), 'Gold after', h('span.v', `≈ ${f.goldAfter}`))),
        f.warnings.length ? h('div.warns', { style: { width: '100%' } }, f.warnings.map((w) => h('div.warn', Dom.icon(w.icon, 18), w.text))) : null,
        h('div.row', { style: { gap: '16px' } },
          Dom.btn('Edit', () => ui.set({ review: false }), { cls: 'alt', icon: 'back' }),
          Dom.btn('Start week', () => { ui.local.review = false; ui.local.pick = {}; ui.send(MSG.INTENT_LOCK_PLAN); }, { cls: 'gold', icon: 'lock' }))));
  }

  /* ---------- Ledger and assets ---------- */
  #ledger() {
    const ui = this.ui, st = ui.st, w = st.week, sys = ui.sys;
    const inc = Object.entries(w.income).filter((x) => x[1]), sp = Object.entries(w.spent).filter((x) => x[1]);
    const max = Math.max(1, ...inc.map((x) => x[1]), ...sp.map((x) => x[1]));
    const icon = { store: 'store', market: 'market', guild: 'guild', quest: 'quest', other: 'star', personal: 'meal', bills: 'debt' };
    const name = (k) => k[0].toUpperCase() + k.slice(1);
    const barRow = (k, v, cls) => h('div.ln.sm', Dom.icon(icon[k] ?? 'gold', 18), h('span', { style: { width: '72px' } }, name(k)), Dom.bar(v / max, cls, 144), h('span.v', String(Math.round(v))));
    const sum = (a) => Math.round(a.reduce((s, x) => s + x[1], 0));
    const tiers = ui.num('QUALITY_TIERS');
    const inv = Object.entries(st.inv).filter(([, q]) => q > 0).map(([k, q]) => { const [item, variant, tier] = k.split('|'); return { item, variant, tier, q, it: ui.c.get('items', item) }; });
    const prodRow = (r) => h('div.ln.sm', Dom.icon(Icons.forItem(r.it, r.variant), 20), h('span', r.it.name), r.tier ? Dom.stars(tiers[r.tier].stars) : null, h('span.v', `×${r.q}`));
    const matRow = (r) => h('div.ln.sm', Dom.icon(Icons.forItem(r.it, r.variant), 20), h('span', r.it.name), h('span.small.muted', r.variant), h('span.v', `×${r.q}`));
    const prods = inv.filter((r) => r.it.kind === 'product'), mats = inv.filter((r) => r.it.kind === 'material'), food = inv.filter((r) => r.it.kind === 'food');
    return [
      [h('h3', Dom.icon('ledger', 28), 'Ledger', Dom.help('tabLedger')),
        h('h4', Dom.icon('trend_up', 18), 'Income this week', h('span.aside', String(sum(inc)))), ...(inc.length ? inc.map(([k, v]) => barRow(k, v, 'ver')) : [h('div.small.muted', '—')]),
        h('h4', Dom.icon('trend_down', 18), 'Spent this week', h('span.aside', String(sum(sp)))), ...(sp.length ? sp.map(([k, v]) => barRow(k, v, 'gold')) : [h('div.small.muted', '—')]),
        h('h4', Dom.icon('jar', 18), 'Jars used'),
        ...['store', 'personal'].map((k) => h('div.ln.sm', { 'data-help': k === 'store' ? 'jarStore' : 'jarPersonal' }, Dom.icon(k === 'store' ? 'cart' : 'meal', 18), h('span', { style: { width: '72px' } }, name(k)), Dom.bar(st.plan.budget[k] ? w.spent[k] / st.plan.budget[k] : 0, w.spent[k] > st.plan.budget[k] ? 'low' : 'ver', 144), h('span.v', `${Math.round(w.spent[k])}/${st.plan.budget[k]}`))),
        h('h4', Dom.icon('log', 18), 'Last lines'),
        h('div.scroll', { style: { flex: 1, minHeight: 0 } }, st.ledger.length ? st.ledger.slice(-10).reverse().map((l) => h('div.ln.sm', Dom.icon(icon[l.cat] ?? 'gold', 16), h('span.small', l.label), h(`span.v${l.amount < 0 ? '.neg' : '.pos'}`, `${l.amount > 0 ? '+' : ''}${Math.round(l.amount)}`))) : h('div.small.muted', '—'))],
      [h('h3', Dom.icon('bag', 28), 'Assets'),
        h('div.ln', { 'data-help': 'gold' }, Dom.icon('gold', 20), 'Gold', h('span.v', Math.round(st.gold).toLocaleString('en'))),
        h('div.ln', { 'data-help': 'debt' }, Dom.icon('debt', 20), 'Debt', h('span.small.muted', `due ${sys.debt.dueLeft()}`), h('span.v.neg', Math.round(st.debt.balance).toLocaleString('en'))),
        h('div.scroll', { style: { flex: 1, minHeight: 0 } },
          h('h4', Dom.icon('jamu', 18), 'Products', h('span.aside', Dom.icon('shelf', 14), `${sys.economy.shelfUnits()} on shelf`)),
          prods.length ? prods.map(prodRow) : h('div.small.muted', 'No products yet.'),
          h('h4', Dom.icon('leaf', 18), 'Materials', h('span.aside', Dom.icon('rack', 14), `${sys.production.rackUsed()}/${sys.production.rackCapacity()} drying`)),
          mats.length ? h('div.two', mats.map(matRow)) : h('div.small.muted', 'No materials yet.'),
          food.length ? food.map((r) => h('div.ln.sm', { 'data-help': 'food' }, Dom.icon('meal', 20), h('span', 'Food packs'), h('span.v', `×${r.q}`))) : null)]
    ];
  }

  /* ---------- Market forecast and trend ---------- */
  #market() {
    const ui = this.ui, st = ui.st;
    const head = h('div.mtab.head', h('span'), h('span', 'Item'), h('span', { 'data-help': 'trend' }, 'Trend'), h('span', { 'data-help': 'priceRange' }, 'Range'), h('span', Dom.icon('gold', 12), 'Now'));
    const row = (it) => {
      const prod = it.kind === 'product';
      const v = prod ? 'product' : it.variants[0];
      const p = prod ? st.market.prices[it.id] : ui.sys.economy.buyPrice(it.id, v);
      const prev = st.market.prevPrices[it.id];
      const d = prev ? st.market.prices[it.id] - prev : 0;
      return h('div.mtab', Dom.icon(Icons.forItem(it, prod ? undefined : v), 22),
        h('span', it.name, prod ? null : h('small.muted', ` ${v}`)),
        h('span', prod ? Dom.icon(trendIcon(st.market.trend[it.id]), 16) : h('span.muted', '·')),
        h('span.num.muted', `${it.forecast[0]}–${it.forecast[1]}`),
        h(`span.num.b${d > 0 ? '.pos' : d < 0 ? '.neg' : ''}`, `${p?.toFixed?.(1) ?? '-'}`));
    };
    const items = ui.c.all('items');
    return [
      [h('h3', Dom.icon('chart', 28), 'Products', Dom.help('tabMarket')), head, ...items.filter((i) => i.kind === 'product').map(row),
        h('h4', Dom.icon('lantern', 18), 'Price levels'),
        h('div.lvpick', ['low', 'fair', 'high'].map((k) => { const lv = ui.num('PRICE_LEVELS')[k]; return h(`div.lv-${k}`, { style: { height: '56px', borderRadius: '8px', color: '#fff', display: 'grid', placeItems: 'center', alignContent: 'center', fontFamily: 'var(--head)' } }, k[0].toUpperCase() + k.slice(1), h('small', `×${lv.mult} · ${Math.round(lv.demand * 100)}%`)); }))],
      [h('h3', Dom.icon('cart', 28), 'Materials', Dom.help('priceRange')), head.cloneNode(true), ...items.filter((i) => i.kind === 'material').map(row)]
    ];
  }

  /* ---------- Public schedule and opening time ---------- */
  #hours(mode) {
    const ui = this.ui, st = ui.st;
    const today = mode === 'do' ? st.cal.day - 1 : -1;
    const places = ui.c.all('places').sort((a, b) => a.travelMin - b.travelMin);
    const cell = (hr, i) => h(`span.hc${i === today ? '.today' : ''}${hr ? '' : '.shut'}`, hr ? (hr[0] === 0 && hr[1] === 24 ? '24h' : `${hr[0]}–${hr[1]}`) : Dom.icon('x', 12));
    const absWeek = this.#absWeek();
    const evs = ui.c.all('events').filter((e) => e.type === 'scheduled' && e.trigger.week === absWeek).sort((a, b) => a.trigger.day - b.trigger.day);
    const monthEnd = st.cal.week === ui.num('WEEKS_PER_MONTH');
    return [
      [h('h3', Dom.icon('clock', 28), 'Opening hours', Dom.help('hours')),
        h('div.htab.head', h('span'), ...WEEKDAYS.map((d, i) => h(`span${i === today ? '.today' : ''}`, d))),
        ...places.map((p) => h('div.htab',
          h('span.hp', Dom.icon(p.icon, 20), h('span', h('b', p.name), h('small.muted', p.travelMin ? ` ${Dom.mins(p.travelMin)}` : ''))),
          ...p.hours.map(cell))),
        h('div.small.muted', { style: { marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center' } }, Dom.icon('walk', 16), 'Travel time is next to the name. Early arrival waits at the door.')],
      [h('h3', Dom.icon('calendar', 28), `Week ${absWeek}`),
        h('h4', Dom.icon('festival', 18), 'Events'),
        evs.length ? evs.map((e) => h('div.ln', Dom.icon(e.icon, 20), h('b', { style: { width: '40px' } }, WEEKDAYS[e.trigger.day - 1]), h('span', e.title))) : h('div.small.muted', 'No town events this week.'),
        h('h4', Dom.icon('note', 18), 'Every week'),
        h('div.ln', Dom.icon('quest', 20), 'New commissions on the quest board', h('span.v', 'Mon')),
        h('div.ln', Dom.icon('house', 20), 'Living cost, paid at Check', h('span.v.neg', `-${ui.num('WEEKLY_EXPENSES')}`)),
        h('h4', Dom.icon('debt', 18), monthEnd ? 'Month end (this week)' : `Month end (week ${st.cal.month * ui.num('WEEKS_PER_MONTH')})`),
        h('div.ln', { 'data-help': 'debt' }, Dom.icon('debt', 20), 'Debt minimum', h('span.v.neg', `${ui.sys.debt.dueLeft()}`)),
        h('div.ln', Dom.icon('house', 20), 'Utilities', h('span.v.neg', `${ui.num('MONTHLY_UTILITIES')}`))]
    ];
  }

  /* ---------- Skills and level ---------- */
  #skills() {
    const ui = this.ui, sk = ui.sys.skills;
    const info = { moon: ['moon', 'Moon', 'Craft and process.', 'wis'], sun: ['sun', 'Sun', 'Sell and trade.', 'gold'], earth: ['earth', 'Earth', 'Gather.', ''] };
    const tiers = ui.num('QUALITY_TIERS'), byLv = ui.num('QUALITY_BY_MOON_LEVEL');
    const maxLv = ui.num('XP_LEVELS').length;
    const pct = (x) => `+${Math.round(x * 100)}%`;
    const moon = sk.level('moon'), sun = sk.level('sun'), earth = sk.level('earth');
    const tierAt = (lv) => tiers[byLv[Math.min(lv, byLv.length) - 1]];
    const nextTierLv = byLv.findIndex((t, i) => i + 1 > moon && t !== byLv[moon - 1]) + 1;
    const now = tierAt(moon);
    const sunB = ui.num('SUN_CUSTOMER_BONUS'), earthB = ui.num('EARTH_LOOT_BONUS');
    const eff = (k, icon, label, nowEl, nextEl) => h('div.eff', { 'data-help': `skill${k}` },
      h('div.row', Dom.medal(icon, 32), h('b', label)),
      h('div.ln.sm', h('span.muted', 'Now'), h('span.v', nowEl)),
      h('div.ln.sm', h('span.muted', 'Next'), h('span.v.muted', nextEl)));
    return [
      [h('h3', Dom.icon('skills', 28), 'Skills', Dom.help('tabSkills')), ...Object.keys(info).map((k) => {
        const p = sk.progress(k);
        return h('div.skill', { 'data-help': `skill${info[k][1]}` },
          Dom.medal(info[k][0], 48),
          h('div', { style: { flex: 1, minWidth: 0 } },
            h('div.row', h('b.sname', info[k][1]), h('span.spacer'), h('span.lv', `Lv ${p.level}`)),
            Dom.bar(p.ratio, info[k][3]),
            h('div.row.small.muted', { style: { marginTop: '4px' } }, h('span', info[k][2]), h('span.spacer'), h('span', p.level >= maxLv ? 'Max' : `${p.xp}/${p.to} XP`))));
      }),
      h('div.small.muted', { style: { marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center' } }, Dom.icon('star', 16), `A met daily goal gives ${ui.num('GOAL_XP')} XP.`)],
      [h('h3', Dom.icon('star', 28), 'Effects'),
        eff('Moon', 'moon', 'Moon: product quality',
          h('span.row', { style: { gap: '8px' } }, Dom.stars(now.stars), now.name, h('span.muted', `price ×${now.mult}`)),
          nextTierLv > 0 ? h('span.row', { style: { gap: '8px' } }, `Lv ${nextTierLv}:`, Dom.stars(tierAt(nextTierLv).stars), tierAt(nextTierLv).name) : 'Max'),
        eff('Sun', 'sun', 'Sun: store customers', `${pct((sun - 1) * sunB)} customers`, sun >= maxLv ? 'Max' : `Lv ${sun + 1}: ${pct(sun * sunB)}`),
        eff('Earth', 'earth', 'Earth: gather loot', `${pct((earth - 1) * earthB)} chance of +1 loot`, earth >= maxLv ? 'Max' : `Lv ${earth + 1}: ${pct(earth * earthB)}`)]
    ];
  }

  /* ---------- Notes from last week + objectives ---------- */
  #notes() {
    const ui = this.ui, st = ui.st;
    const absWeek = this.#absWeek();
    const opts = ui.c.get('notes', 'notes').options;
    const last = st.notes.filter((n) => n.absWeek === absWeek - 1).at(-1);
    const older = st.notes.filter((n) => n.absWeek < absWeek - 1).slice(-3).reverse();
    const noteRows = (n) => [...n.ids.map((id) => opts.find((o) => o.id === id)).filter(Boolean).map((o) => h('div.ln', Dom.icon(o.icon, 20), o.text)),
      n.text ? h('div.ln', Dom.icon('note', 20), n.text) : null];
    const obj = ui.sys.objectives.status();
    const done = obj.filter((o) => o.done).length;
    return [
      [h('h3', Dom.icon('note', 28), 'Notes', Dom.help('notes')),
        h('h4', Dom.icon('calendar', 18), absWeek > 1 ? `From week ${absWeek - 1}` : 'From last week'),
        last ? noteRows(last) : h('div.small.muted', absWeek > 1 ? 'You did not pick a note last week.' : 'Week 1. You pick notes at the end of each week.'),
        older.length ? h('h4', Dom.icon('log', 18), 'Older notes') : null,
        ...older.map((n) => h('div', h('div.small.muted', `Week ${n.absWeek}`), noteRows(n)))],
      [h('h3', Dom.icon('quest', 28), 'Objectives', Dom.help('objectives'), h('span.aside', Dom.icon('check', 16), `${done}/${obj.length}`)),
        h('div.scroll', { style: { flex: 1, minHeight: 0 } }, obj.map((o) => h(`div.obj${o.done ? '.done' : ''}`,
          h('span.box', o.done ? Dom.icon('check', 16) : null), Dom.icon(o.icon, 20), h('span', o.text))))]
    ];
  }

  /* ---------- Log (Do phase) ---------- */
  #log() {
    const ui = this.ui, st = ui.st;
    const today = st.log.filter((l) => l.day === ui.sys.time.absDay());
    const before = st.log.filter((l) => l.day !== ui.sys.time.absDay()).slice(-12).reverse();
    const line = (l) => h('div.ln', Dom.icon(Icons.has(l.icon) ? l.icon : 'log', 18), h('span.small.muted', { style: { width: '44px' } }, `${String(Math.floor(l.minute / 60)).padStart(2, '0')}:${String(l.minute % 60).padStart(2, '0')}`), h('span.small', l.text));
    return [
      [h('h3', Dom.icon('log', 28), 'Today'), h('div.scroll', { style: { flex: 1 } }, today.slice().reverse().map(line))],
      [h('h3', Dom.icon('calendar', 28), 'Before'), h('div.scroll', { style: { flex: 1 } }, before.map(line))]
    ];
  }
}
