import { MSG } from '../../core/EventBus.js';
import { Dom } from './Dom.js';
import { Icons } from './Icons.js';
import { WEEKDAYS } from '../../model/Calendar.js';
import { CheckView } from './CheckView.js';
import { ActView } from './ActView.js';

const h = Dom.h;
const TABS = [
  { id: 'plan', icon: 'calendar', label: 'Plan' },
  { id: 'ledger', icon: 'ledger', label: 'Ledger' },
  { id: 'market', icon: 'chart', label: 'Market' },
  { id: 'stock', icon: 'bag', label: 'Stock' },
  { id: 'skills', icon: 'skills', label: 'Skills' },
  { id: 'log', icon: 'log', label: 'Log' }
];

/**
 * JournalView: the Planner Book (night-teal bookcloth, gold tooling, die-cut tabs, purple ribbon, no rattan).
 * Plan phase: weekly plan (daily goals, store plan, budget jars) and the "Review plan" ribbon.
 * Do phase: the same book to look up plan, ledger, market, stock, skills and log.
 * Check and Act pages come from CheckView and ActView.
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
      tabs = mode === 'plan' ? TABS.filter((t) => ['plan', 'market', 'stock', 'skills'].includes(t.id)) : TABS;
      if (!tabs.some((t) => t.id === L.tab)) L.tab = 'plan';
      pages = { plan: () => this.#plan(mode), ledger: () => this.#ledger(), market: () => this.#market(), stock: () => this.#stock(), skills: () => this.#skills(), log: () => this.#log() }[L.tab]();
      if (mode === 'plan' && L.tab === 'plan') ribbon = h('button.ribbon', { onclick: () => ui.set({ review: true }) }, 'Review plan');
    }
    const n = (ui.st.cal.month - 1) * ui.num('WEEKS_PER_MONTH') + ui.st.cal.week;
    const tag = { plan: ['calendar', 'Plan'], do: ['journal', 'Journal'], check: ['note', 'Check'], act: ['debt', 'Act'] }[mode];
    const els = [
      h('div.stag', Dom.icon(tag[0], 24), tag[1]),
      h('div.book',
        h('div.tool'), h('div.tool2'), h('div.spineband'),
        h('div.pages',
          h('div.pg.l', ...pages[0], h('div.pageno', Dom.icon('moon', 14), String(n * 2 - 1))),
          h('div.pg.r', ...pages[1], h('div.pageno', String(n * 2), Dom.icon('moon', 14)))),
        tabs.length ? h('div.tabs', tabs.map((t) => h(`button.tab${L.tab === t.id ? '.on' : ''}`, { 'data-label': t.label, title: t.label, onclick: () => ui.set({ tab: t.id }) }, Dom.icon(t.icon, 26)))) : null,
        ...Dom.corners().map((c) => { c.style.zIndex = 3; return c; }),
        ribbon,
        mode === 'do' ? h('button.iconbtn.close', { style: { right: '-12px', top: '-12px' }, title: 'Close', onclick: () => ui.set({ journal: false }), html: Icons.svg('x', 16) }) : null)
    ];
    const box = h('div', { style: { position: 'absolute', inset: 0 } }, ...els);
    if (mode === 'plan' && L.review) box.append(this.#review());
    return box;
  }

  /* ---------- Plan ---------- */
  #plan(mode) {
    const ui = this.ui, st = ui.st, L = ui.local;
    const goals = ui.c.all('goals').sort((a, b) => a.order - b.order);
    const sel = L.pick.day ?? (mode === 'plan' ? 0 : st.cal.day - 1);
    const editable = (i) => mode === 'plan' || i >= st.cal.day;
    const sched = ui.c.all('events').filter((e) => e.type === 'scheduled');
    const absWeek = (st.cal.month - 1) * ui.num('WEEKS_PER_MONTH') + st.cal.week;
    const evDay = (i) => sched.find((e) => e.trigger.week === absWeek && e.trigger.day === i + 1);
    const left = [
      h('h3', Dom.icon('calendar', 28), `Week ${absWeek}`, h('span.small.muted', { style: { marginLeft: 'auto', fontFamily: 'var(--body)' } }, `M${st.cal.month} · W${st.cal.week}`)),
      h('h4', Dom.icon('star', 18), 'Daily goals'),
      h('div.days', st.plan.goals.map((g, i) => {
        const goal = g ? ui.c.get('goals', g) : null;
        const met = st.week.goalsMet[i];
        const cls = [i === sel && editable(i) ? 'now' : '', mode === 'do' && i < st.cal.day - 1 ? 'past' : ''].filter(Boolean).join('.');
        return h(`button.day${cls ? '.' + cls : ''}`, { onclick: () => editable(i) && ui.set({ pick: { ...L.pick, day: i } }), title: goal?.name ?? 'No goal' },
          h('span.dn', WEEKDAYS[i]),
          evDay(i) ? h('span.ev', { title: evDay(i).title }, Dom.icon(evDay(i).icon, 16)) : null,
          goal ? h('div.goalchip', { style: { background: goal.color } }, Dom.icon(goal.icon, 28)) : h('div.goalchip.empty', '?'),
          met === true ? Dom.icon('check', 18) : met === false ? Dom.icon('x', 16) : h('span', { style: { height: '18px' } }));
      })),
      editable(sel) ? h('div.goalpick', goals.map((g) => h(`button${st.plan.goals[sel] === g.id ? '.on' : ''}`, { style: { background: g.color }, title: g.name, onclick: () => ui.send(MSG.INTENT_SET_GOAL, { index: sel, goal: g.id }) }, Dom.icon(g.icon, 26)))) : null,
      editable(sel) ? h('div.row.center.small', { style: { marginTop: '8px', gap: '16px' } }, goals.map((g) => h('span.row', { style: { gap: '4px' } }, h('i', { style: { width: '10px', height: '10px', borderRadius: '50%', background: g.color, display: 'inline-block' } }), g.name))) : null,
      Dom.divider(),
      h('h4', Dom.icon('chart', 18), 'This week', h('span.aside', 'demand')),
      h('div.chipline', ui.c.all('items').filter((i) => i.kind === 'product').map((p) => {
        const t = st.market.trend[p.id];
        return h('span.qchip', { title: `${p.name}: ${t} demand` }, Dom.icon(p.icon, 18), Dom.icon(t === 'high' ? 'trend_up' : t === 'low' ? 'trend_down' : 'trend_flat', 16));
      }))
    ];
    return [left, this.#storePlan(mode)];
  }

  #storePlan(mode) {
    const ui = this.ui, st = ui.st, sys = ui.sys;
    const f = sys.plan.forecast();
    const products = ui.c.all('items').filter((i) => i.kind === 'product');
    const edit = mode === 'plan';
    const step = ui.num('PLAN_PRODUCT_STEP'), bstep = ui.num('BUDGET_STEP');
    const b = st.plan.budget;
    const tier = sys.skills.tier();
    const jar = (k, icon, color, label) => h('div.jarbox', { title: label },
      Dom.raw(this.#jarSvg(st.gold ? b[k] / st.gold : 0, color)),
      h('div.row', { style: { gap: '4px' } }, Dom.icon(icon, 16), h('span.small', label)),
      edit ? null : h('div.v', String(b[k])),
      edit ? Dom.stepper(b[k], (d) => ui.send(MSG.INTENT_SET_BUDGET, { [k]: Math.max(0, b[k] + d) }), { step: bstep }) : null);
    return [
      h('h3', Dom.icon('store', 28), 'Store plan', h('span.row.small', { style: { marginLeft: 'auto', fontFamily: 'var(--body)', fontWeight: 700 } }, Dom.icon('tag', 16), `${f.storeGoal}`)),
      h('h4', Dom.icon('jamu', 18), 'Products', h('span.aside', Dom.icon('gold', 14), 'each')),
      ...products.map((p) => {
        const q = st.plan.products[p.id] ?? 0;
        const t = st.market.trend[p.id];
        return h('div.ln',
          Dom.icon(p.icon, 22), h('span', p.name),
          Dom.icon(t === 'high' ? 'trend_up' : t === 'low' ? 'trend_down' : 'trend_flat', 14),
          h('span.v.small', { style: { minWidth: '40px' } }, `${Math.round(sys.economy.productValue(p.id, tier))}`),
          edit ? Dom.stepper(q, (d) => ui.send(MSG.INTENT_SET_PRODUCT, { product: p.id, qty: Math.max(0, q + d) }), { step }) : h('span.v', String(q)));
      }),
      h('h4', Dom.icon('cart', 18), 'Materials', h('span.aside', Dom.icon('gold', 14), `${f.matCost}`)),
      h('div.chipline', f.materials.length ? f.materials.map((m) => {
        const it = ui.c.get('items', m.item);
        return h(`span.qchip${m.have >= m.need ? '.ok' : m.process ? '' : '.miss'}`, { title: `${it.name} (${m.variant}): need ${m.need}, have ${m.have}` },
          Dom.icon(Icons.forItem(it, m.variant), 18), `${m.have}/${m.need}`);
      }) : h('span.small.muted', '—')),
      h('h4', Dom.icon('jar', 18), 'Budget jars', h('span.aside', Dom.icon('gold', 14), `${Math.round(st.gold)}`)),
      h('div.jars', jar('store', 'cart', '#5FA39A', 'Store'), jar('personal', 'meal', '#D9A326', 'Personal'), jar('buffer', 'buffer', '#9C87C0', 'Buffer')),
      h('div.row', { style: { marginTop: '16px', gap: '16px' } },
        h('span.qchip', { title: 'Gold after this plan (estimate)' }, Dom.icon('gold', 18), `≈ ${f.goldAfter}`),
        f.monthEnd ? h('span.qchip.miss', { title: 'Bills due at month end' }, Dom.icon('debt', 18), `${f.due}`) : null,
        h('span.spacer'),
        f.warnings.length ? h('span.qchip.miss', { title: f.warnings.map((w) => w.text).join('\n') }, Dom.icon('warn', 18), String(f.warnings.length)) : h('span.qchip.ok', Dom.icon('check', 18), 'OK'))
    ];
  }

  #jarSvg(ratio, color) {
    const r = Math.max(0, Math.min(1, ratio));
    const y = 40 - r * 28;
    return `<svg width="40" height="44" viewBox="0 0 40 44"><defs><clipPath id="jc${color.slice(1)}"><path d="M9 10h22l3 6v22a4 4 0 01-4 4H10a4 4 0 01-4-4V16z"/></clipPath></defs>
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

  /* ---------- Look-up tabs ---------- */
  #ledger() {
    const ui = this.ui, st = ui.st, w = st.week;
    const inc = Object.entries(w.income), sp = Object.entries(w.spent);
    const max = Math.max(1, ...inc.map((x) => x[1]), ...sp.map((x) => x[1]));
    const icon = { store: 'store', market: 'market', guild: 'guild', quest: 'quest', other: 'star', personal: 'meal', bills: 'debt' };
    const barRow = (k, v, cls) => h('div.ln', Dom.icon(icon[k] ?? 'gold', 20), h('span', { style: { width: '72px' } }, k), Dom.bar(v / max, cls, 160), h('span.v', String(Math.round(v))));
    return [
      [h('h3', Dom.icon('ledger', 28), 'Ledger'),
        h('h4', Dom.icon('trend_up', 18), 'Income', h('span.aside', String(Math.round(inc.reduce((s, x) => s + x[1], 0))))), ...inc.map(([k, v]) => barRow(k, v, 'ver')),
        h('h4', Dom.icon('trend_down', 18), 'Spent', h('span.aside', String(Math.round(sp.reduce((s, x) => s + x[1], 0))))), ...sp.map(([k, v]) => barRow(k, v, 'gold')),
        h('h4', Dom.icon('jar', 18), 'Jars'),
        ...['store', 'personal'].map((k) => h('div.ln', Dom.icon(k === 'store' ? 'cart' : 'meal', 20), k, Dom.bar(st.plan.budget[k] ? w.spent[k] / st.plan.budget[k] : 0, w.spent[k] > st.plan.budget[k] ? 'low' : 'ver', 160), h('span.v', `${Math.round(w.spent[k])}/${st.plan.budget[k]}`)))],
      [h('h3', Dom.icon('log', 28), 'Lines'),
        h('div.scroll', { style: { flex: 1 } }, st.ledger.slice(-14).reverse().map((l) => h('div.ln', Dom.icon(icon[l.cat] ?? 'gold', 18), h('span.small', l.label), h(`span.v${l.amount < 0 ? '.neg' : '.pos'}`, `${l.amount > 0 ? '+' : ''}${Math.round(l.amount)}`))))]
    ];
  }

  #market() {
    const ui = this.ui, st = ui.st;
    const row = (it) => {
      const v = it.kind === 'product' ? 'product' : it.variants[0];
      const p = it.kind === 'product' ? st.market.prices[it.id] : ui.sys.economy.buyPrice(it.id, v);
      const prev = st.market.prevPrices[it.id];
      const d = prev ? st.market.prices[it.id] - prev : 0;
      return h('div.ln', Dom.icon(it.icon, 22), h('span', it.name),
        it.kind === 'product' ? Dom.icon(st.market.trend[it.id] === 'high' ? 'trend_up' : st.market.trend[it.id] === 'low' ? 'trend_down' : 'trend_flat', 14) : null,
        h('span.small.muted', { style: { marginLeft: 'auto' } }, `${it.forecast[0]}–${it.forecast[1]}`),
        h(`span.v${d > 0 ? '.pos' : d < 0 ? '.neg' : ''}`, `${p?.toFixed?.(1) ?? '-'}`));
    };
    const items = ui.c.all('items');
    return [
      [h('h3', Dom.icon('chart', 28), 'Market'), h('h4', Dom.icon('jamu', 18), 'Products', h('span.aside', 'range · now')), ...items.filter((i) => i.kind === 'product').map(row),
        h('h4', Dom.icon('lantern', 18), 'Price levels'),
        h('div.lvpick', ['low', 'fair', 'high'].map((k) => { const lv = ui.num('PRICE_LEVELS')[k]; return h(`div.lv-${k}`, { style: { height: '56px', borderRadius: '8px', color: '#fff', display: 'grid', placeItems: 'center', alignContent: 'center', fontFamily: 'var(--head)' } }, k[0].toUpperCase() + k.slice(1), h('small', `×${lv.mult} · ${Math.round(lv.demand * 100)}%`)); }))],
      [h('h3', Dom.icon('cart', 28), 'Materials'), h('h4', Dom.icon('leaf', 18), 'Buy price', h('span.aside', 'range · now')), ...items.filter((i) => i.kind === 'material').map(row)]
    ];
  }

  #stock() {
    const ui = this.ui, st = ui.st;
    const tiers = ui.num('QUALITY_TIERS');
    const rows = Object.entries(st.inv).filter(([, q]) => q > 0).map(([k, q]) => { const [item, variant, tier] = k.split('|'); return { item, variant, tier, q, it: ui.c.get('items', item) }; });
    const cell = (r) => h('div.slot', { title: `${r.it.name} (${r.variant})`, style: { height: '72px' } }, Dom.icon(Icons.forItem(r.it, r.variant), 30), r.tier ? Dom.stars(tiers[r.tier].stars) : h('span.small', r.variant), h('span.q', String(r.q)));
    return [
      [h('h3', Dom.icon('jamu', 28), 'Products'), h('div.grid3', rows.filter((r) => r.it.kind === 'product').map(cell)),
        h('h4', Dom.icon('shelf', 18), 'On shelf', h('span.aside', String(ui.sys.economy.shelfUnits()))),
        h('h4', Dom.icon('rack', 18), 'Drying rack', h('span.aside', `${ui.sys.production.rackUsed()}/${ui.sys.production.rackCapacity()}`))],
      [h('h3', Dom.icon('bag', 28), 'Materials'), h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' } }, rows.filter((r) => r.it.kind !== 'product').map(cell))]
    ];
  }

  #skills() {
    const ui = this.ui;
    const info = { moon: ['moon', 'Moon', 'Craft + process. Better tier.'], sun: ['sun', 'Sun', 'Sell + trade. More customers.'], earth: ['earth', 'Earth', 'Gather. More loot.'] };
    const tiers = ui.num('QUALITY_TIERS');
    const tier = ui.sys.skills.tier();
    return [
      [h('h3', Dom.icon('skills', 28), 'Skills'), ...Object.keys(info).map((k) => {
        const p = ui.sys.skills.progress(k);
        return h('div', { style: { marginTop: '16px' } },
          h('div.row', Dom.medal(info[k][0], 48), h('div', { style: { flex: 1 } }, h('div.row', h('b', { style: { fontFamily: 'var(--head)', fontSize: '20px', fontWeight: 400 } }, info[k][1]), h('span.spacer'), h('span.qchip', 'Lv', String(p.level))), Dom.bar(p.ratio, k === 'moon' ? 'wis' : k === 'sun' ? 'gold' : ''), h('div.small.muted', { style: { marginTop: '4px' } }, info[k][2]))));
      })],
      [h('h3', Dom.icon('star', 28), 'Quality'), h('div.ln', Dom.icon('moon', 20), 'Now', h('span.spacer'), Dom.stars(tiers[tier].stars), h('span.v', tiers[tier].name)),
        ...Object.entries(tiers).map(([id, t]) => h('div.ln', Dom.stars(t.stars), h('span', t.name), h('span.v', `×${t.mult}`)))]
    ];
  }

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
