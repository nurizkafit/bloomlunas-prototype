import { MSG } from '../../core/EventBus.js';
import { Dom } from './Dom.js';
import { Icons } from './Icons.js';
import { Calendar, WEEKDAYS } from '../../model/Calendar.js';
import { CheckView } from './CheckView.js';
import { ActView } from './ActView.js';

const h = Dom.h;
/** Journal tabs in Scene & Flow order (Plan phase). The Do phase adds the Log tab. */
const TABS = [
  { id: 'schedule', icon: 'calendar', label: 'Daily goals', short: 'Goals', help: 'tabSchedule' },
  { id: 'store', icon: 'store', label: 'Store plan', short: 'Store', help: 'tabStore' },
  { id: 'ledger', icon: 'ledger', label: 'Ledger and assets', short: 'Ledger', help: 'tabLedger' },
  { id: 'market', icon: 'chart', label: 'Market', help: 'tabMarket' },
  { id: 'hours', icon: 'clock', label: 'Public schedule', short: 'Hours', help: 'tabHours' },
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
      if (mode === 'plan') { ribbon = Dom.btn('Finish plan', () => ui.set({ review: true }), { cls: 'gold.ribbon', icon: 'check' }); ribbon.dataset.help = 'reviewPlan'; }
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
        tabs.length ? h('div.tabs', tabs.map((t) => h(`button.tab${L.tab === t.id ? '.on' : ''}`, { 'data-label': t.label, 'data-help': t.help, onclick: () => ui.set({ tab: t.id }) }, Dom.icon(t.icon, 22), h('span.tl', t.short ?? t.label)))) : null,
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
    const editable = () => mode === 'plan'; // fixed in the Do phase (user rule, 8 Nov 2026)
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
        : h('div.gslot', editable(i) ? (picked ? 'Click to place' : 'Drop a goal here') : '—');
      if (goal && editable(i)) dragFrom(card, `d:${i}`);
      const row = h(`div.drow${cls ? '.' + cls : ''}`, { onclick: () => { if (picked && editable(i)) { setGoal(i, picked); } } },
        h('div.dn', h('b', WEEKDAYS[i]), h('small', `D${i + 1}`)),
        card,
        h('div.dnote',
          ev ? h('span.qchip', { title: ev.title }, Dom.icon(ev.icon, 16), h('span.small', ev.title)) : null,
          ...shut.map((p) => h('span.shut', { title: `${p.name} closed` }, Dom.icon(p.icon, 16), h('span.small', `${p.name.split(' ')[0]} shut`)))),
        h('div.dmet', { 'data-help': 'goalMet' }, met === true ? Dom.icon('check', 18) : met === false ? Dom.icon('x', 16) : null));
      return editable(i) ? dropZone(row, (d) => drop(i, d)) : row;
    });

    const set = st.plan.goals.filter(Boolean).length;
    const deck = goals.map((g) => {
      const c = h(`div.gcard${picked === g.id ? '.on' : ''}`, { style: { '--gc': g.color }, title: g.name, onclick: () => ui.set({ pick: { ...L.pick, goal: picked === g.id ? null : g.id } }) },
        h('div.gi', Dom.medal(g.icon, 40)),
        h('div', h('b', g.name), h('p', g.text ?? '')));
      if (mode !== 'plan') { c.onclick = null; c.classList.add('lock'); return c; }
      return dragFrom(c, `g:${g.id}`);
    });
    const deckBox = dropZone(h('div.deck', deck), (d) => { if (d.startsWith('d:')) { const j = Number(d.slice(2)); if (editable(j)) setGoal(j, null); } });
    return [
      [h('h3', Dom.icon('calendar', 28), `Week ${absWeek}`, Dom.help('tabSchedule'), h('span.aside', Dom.icon('star', 16), `${set}/${st.plan.goals.length}`)),
        h('div.drows', rows)],
      [h('h3', Dom.icon('star', 28), 'Goal cards', Dom.help('goalDeck')), mode === 'plan' ? null : h('p.small.muted', Dom.icon('lock', 14), ' This week is set. You can change it when you plan next week.'), deckBox]
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
      Dom.raw(Dom.jarSvg(st.gold ? b[k] / st.gold : 0, color, 48)),
      h('div.row', { style: { gap: '4px' } }, Dom.icon(icon, 16), h('b.small', label)),
      edit ? Dom.stepper(b[k], (d) => ui.send(MSG.INTENT_SET_BUDGET, { [k]: Math.max(0, b[k] + d) }), { step: bstep }) : h('div.v', String(b[k])));
    const jarsTotal = b.store + b.personal + b.buffer;
    const left = [
      h('h3', Dom.icon('jamu', 28), 'Products to sell', Dom.help('products'), h('span.aside', { 'data-help': 'products' }, Dom.icon('tag', 16), `${f.storeGoal}`)),
      h('div.ptab.head', h('span'), h('span', 'Product'), h('span', { 'data-help': 'trend' }, 'Demand'), h('span', Dom.icon('gold', 12), 'each'), h('span', 'Units')),
      ...products.map((p) => {
        const q = st.plan.products[p.id] ?? 0;
        return h('div.ptab',
          Dom.icon(p.icon, 22), h('span', p.name),
          h('span', { 'data-help': 'trend' }, Dom.icon(trendIcon(st.market.trend[p.id]), 16)),
          h('span.num', `${Math.round(sys.economy.productValue(p.id, tier))}`),
          edit ? Dom.stepper(q, (d) => ui.send(MSG.INTENT_SET_PRODUCT, { product: p.id, qty: Math.max(0, q + d) }), { step }) : h('span.num', String(q)));
      }),
      h('h4', Dom.icon('cart', 18), 'Herbs you need', Dom.help('materials'), h('span.aside', Dom.icon('gold', 14), `${f.matCost}`)),
      h('div.scroll.mats', f.materials.length ? f.materials.map((m) => {
        const it = ui.c.get('items', m.item);
        const ok = m.have >= m.need;
        return h('div.ln.sm',
          Dom.icon(Icons.forItem(it, m.variant), 20), h('span', it.name), h('span.small.muted', m.variant),
          h(`span.qchip${ok ? '.ok' : '.miss'}`, { title: 'Have / need' }, `${m.have}/${m.need}`),
          m.process && !ok ? h('span.row.small', { title: m.process === 'dried' ? 'Dry on the rack' : 'Dry, then grind' }, Dom.icon(m.process === 'dried' ? 'rack' : 'grinder', 18), m.process === 'dried' ? 'Dry' : 'Dry + grind') : null,
          h('span.v', ok ? Dom.icon('check', 16) : `${m.cost}`));
      }) : h('div.small.muted', { style: { padding: '8px 0' } }, 'Choose what to sell first.'))
    ];
    const right = [
      h('h3', Dom.icon('jar', 28), 'Budget', h('span.aside', { 'data-help': 'gold' }, Dom.icon('gold', 16), `${Math.round(st.gold)}`)),
      h('div.jars', jar('store', 'cart', '#5FA39A', 'Store'), jar('personal', 'meal', '#D9A326', 'Personal'), jar('buffer', 'buffer', '#9C87C0', 'Buffer')),
      h('div', { style: { marginTop: '16px' } },
        h('div.ln', Dom.icon('jar', 20), 'In the jars', h(`span.v${jarsTotal > st.gold ? '.neg' : ''}`, `${jarsTotal} / ${Math.round(st.gold)}`)),
        h('div.ln', Dom.icon('cart', 20), 'Herbs', h('span.v.neg', `-${f.matCost}`)),
        h('div.ln', Dom.icon('house', 20), 'Living costs', h('span.v.neg', `-${f.living}`)),
        f.monthEnd ? h('div.ln', Dom.icon('debt', 20), 'Month-end payments', h('span.v.neg', `-${f.due}`)) : null,
        h('div.ln.tot', { 'data-help': 'goldAfter' }, Dom.icon('gold', 20), 'Gold after', h('span.v', `≈ ${f.goldAfter}`))),
      h('h4', Dom.icon('warn', 18), 'Plan check', Dom.help('warnings')),
      f.warnings.length ? h('div.warns', f.warnings.map((w) => h('div.warn', Dom.icon(w.icon, 18), w.text)))
        : h('div.warn.ok', Dom.icon('check', 18), 'The plan looks good.')
    ];
    return [left, right];
  }

  #review() {
    const ui = this.ui, f = ui.sys.plan.forecast();
    return h('div.veil',
      Dom.rattan('card',
        h('div.kick', 'Your plan'),
        h('h3', 'Ready for the week?'),
        h('div', { style: { width: '100%' } },
          h('div.ln', Dom.icon('tag', 20), 'Sales goal', h('span.v', String(f.storeGoal))),
          h('div.ln', Dom.icon('cart', 20), 'Herbs', h('span.v.neg', `-${f.matCost}`)),
          h('div.ln', Dom.icon('house', 20), 'Living costs', h('span.v.neg', `-${f.living}`)),
          h('div.ln', Dom.icon('store', 20), 'Sales (a guess)', h('span.v.pos', `+${f.sales}`)),
          h('div.ln.tot', Dom.icon('gold', 20), 'Gold after', h('span.v', `≈ ${f.goldAfter}`))),
        f.warnings.length ? h('div.warns', { style: { width: '100%' } }, f.warnings.map((w) => h('div.warn', Dom.icon(w.icon, 18), w.text))) : null,
        h('div.row', { style: { gap: '16px' } },
          Dom.btn('Change it', () => ui.set({ review: false }), { cls: 'alt', icon: 'back' }),
          Dom.btn('Begin the week', () => { ui.local.review = false; ui.local.pick = {}; ui.send(MSG.INTENT_LOCK_PLAN); }, { cls: 'gold', icon: 'lock' }))));
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
        h('h4', Dom.icon('trend_up', 18), 'Earned this week', h('span.aside', String(sum(inc)))), ...(inc.length ? inc.map(([k, v]) => barRow(k, v, 'ver')) : [h('div.small.muted', '—')]),
        h('h4', Dom.icon('trend_down', 18), 'Spent this week', h('span.aside', String(sum(sp)))), ...(sp.length ? sp.map(([k, v]) => barRow(k, v, 'gold')) : [h('div.small.muted', '—')]),
        h('h4', Dom.icon('jar', 18), 'Jars spent'),
        ...['store', 'personal'].map((k) => h('div.ln.sm', { 'data-help': k === 'store' ? 'jarStore' : 'jarPersonal' }, Dom.icon(k === 'store' ? 'cart' : 'meal', 18), h('span', { style: { width: '72px' } }, name(k)), Dom.bar(st.plan.budget[k] ? w.spent[k] / st.plan.budget[k] : 0, w.spent[k] > st.plan.budget[k] ? 'low' : 'ver', 144), h('span.v', `${Math.round(w.spent[k])}/${st.plan.budget[k]}`))),
        h('h4', Dom.icon('log', 18), 'Latest entries'),
        h('div.scroll', { style: { flex: 1, minHeight: 0 } }, st.ledger.length ? st.ledger.slice(-10).reverse().map((l) => h('div.ln.sm', Dom.icon(icon[l.cat] ?? 'gold', 16), h('span.small', l.label), h(`span.v${l.amount < 0 ? '.neg' : '.pos'}`, `${l.amount > 0 ? '+' : ''}${Math.round(l.amount)}`))) : h('div.small.muted', '—'))],
      [h('h3', Dom.icon('bag', 28), 'What you own'),
        h('div.ln', { 'data-help': 'gold' }, Dom.icon('gold', 20), 'Gold', h('span.v', Math.round(st.gold).toLocaleString('en'))),
        h('div.ln', { 'data-help': 'debt' }, Dom.icon('debt', 20), 'Debt', h('span.small.muted', `due ${sys.debt.dueLeft()}`), h('span.v.neg', Math.round(st.debt.balance).toLocaleString('en'))),
        h('div.scroll', { style: { flex: 1, minHeight: 0 } },
          h('h4', Dom.icon('jamu', 18), 'Products', h('span.aside', Dom.icon('shelf', 14), `${sys.economy.shelfUnits()} on shelf`)),
          prods.length ? prods.map(prodRow) : h('div.small.muted', 'No products yet. Your shelf waits.'),
          h('h4', Dom.icon('leaf', 18), 'Materials', h('span.aside', Dom.icon('rack', 14), `${sys.production.rackUsed()}/${sys.production.rackCapacity()} drying`)),
          mats.length ? h('div.two', mats.map(matRow)) : h('div.small.muted', 'No herbs yet.'),
          food.length ? food.map((r) => h('div.ln.sm', { 'data-help': 'food' }, Dom.icon('meal', 20), h('span', 'Meal packs'), h('span.v', `×${r.q}`))) : null)]
    ];
  }

  /* ---------- Market forecast and trend ---------- */
  #market() {
    const ui = this.ui, st = ui.st;
    const head = h('div.mtab.head', h('span'), h('span', 'Item'), h('span', { 'data-help': 'trend' }, 'Demand'), h('span', { 'data-help': 'priceRange' }, 'Usual'), h('span', Dom.icon('gold', 12), 'Now'));
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
        h('h4', Dom.icon('lantern', 18), 'Shelf prices'),
        h('div.lvpick', ['low', 'fair', 'high'].map((k) => { const lv = ui.num('PRICE_LEVELS')[k]; return h(`div.lv-${k}`, k[0].toUpperCase() + k.slice(1), h('small', `×${lv.mult} · ${Math.round(lv.demand * 100)}%`)); }))],
      [h('h3', Dom.icon('cart', 28), 'Herbs and materials', Dom.help('priceRange')), head.cloneNode(true), ...items.filter((i) => i.kind === 'material').map(row)]
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
        h('div.small.muted', { style: { marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center' } }, Dom.icon('walk', 16), 'The walk time is next to the name. Come early, and you wait at the door.')],
      [h('h3', Dom.icon('calendar', 28), `Week ${absWeek}`),
        h('h4', Dom.icon('festival', 18), 'In town'),
        evs.length ? evs.map((e) => h('div.ln', Dom.icon(e.icon, 20), h('b', { style: { width: '40px' } }, WEEKDAYS[e.trigger.day - 1]), h('span', e.title))) : h('div.small.muted', 'A quiet week in town.'),
        h('h4', Dom.icon('note', 18), 'Every week'),
        h('div.ln', Dom.icon('quest', 20), 'New commissions at the guild', h('span.v', 'Mon')),
        h('div.ln', Dom.icon('house', 20), 'Living costs, paid at week end', h('span.v.neg', `-${ui.num('WEEKLY_EXPENSES')}`)),
        h('h4', Dom.icon('debt', 18), monthEnd ? 'Month end (this week)' : `Month end (week ${st.cal.month * ui.num('WEEKS_PER_MONTH')})`),
        h('div.ln', { 'data-help': 'debt' }, Dom.icon('debt', 20), 'Debt payment (minimum)', h('span.v.neg', `${ui.sys.debt.dueLeft()}`)),
        h('div.ln', Dom.icon('house', 20), 'Utilities', h('span.v.neg', `${ui.num('MONTHLY_UTILITIES')}`))]
    ];
  }

  /* ---------- Skills and level ---------- */
  #skills() {
    const ui = this.ui, sk = ui.sys.skills;
    const info = { moon: ['moon', 'Moon', 'Crafting and processing.', 'wis'], sun: ['sun', 'Sun', 'Selling and trade.', 'gold'], earth: ['earth', 'Earth', 'Gathering.', ''] };
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
      h('div.small.muted', { style: { marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center' } }, Dom.icon('star', 16), `Each daily goal you meet gives ${ui.num('GOAL_XP')} XP.`)],
      [h('h3', Dom.icon('star', 28), 'What they give'),
        eff('Moon', 'moon', 'Moon: better products',
          h('span.row', { style: { gap: '8px' } }, Dom.stars(now.stars), now.name, h('span.muted', `price ×${now.mult}`)),
          nextTierLv > 0 ? h('span.row', { style: { gap: '8px' } }, `Lv ${nextTierLv}:`, Dom.stars(tierAt(nextTierLv).stars), tierAt(nextTierLv).name) : 'Max'),
        eff('Sun', 'sun', 'Sun: more customers', `${pct((sun - 1) * sunB)} customers`, sun >= maxLv ? 'Max' : `Lv ${sun + 1}: ${pct(sun * sunB)}`),
        eff('Earth', 'earth', 'Earth: more herbs', `${pct((earth - 1) * earthB)} chance of +1 herb`, earth >= maxLv ? 'Max' : `Lv ${earth + 1}: ${pct(earth * earthB)}`)]
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
      [h('h3', Dom.icon('note', 28), 'Notes to self', Dom.help('notes')),
        h('h4', Dom.icon('calendar', 18), absWeek > 1 ? `From week ${absWeek - 1}` : 'From last week'),
        last ? noteRows(last) : h('div.small.muted', absWeek > 1 ? 'You left no note last week.' : 'Your first week. At the end of each week, you leave a note here for yourself.'),
        older.length ? h('h4', Dom.icon('log', 18), 'Older notes') : null,
        ...older.map((n) => h('div', h('div.small.muted', `Week ${n.absWeek}`), noteRows(n)))],
      [h('h3', Dom.icon('quest', 28), 'First steps', Dom.help('objectives'), h('span.aside', Dom.icon('check', 16), `${done}/${obj.length}`)),
        h('div.scroll', { style: { flex: 1, minHeight: 0 } }, obj.map((o) => h(`div.obj${o.done ? '.done' : ''}`,
          h('span.box', o.done ? Dom.icon('check', 16) : null), Dom.icon(o.icon, 20), h('span', o.text))))]
    ];
  }

  /* ---------- Log (Do phase) ---------- */
  /** Two scroll boxes (user feedback 8 Nov 2026): today (newest first) and all earlier days, grouped by day. */
  #log() {
    const ui = this.ui, st = ui.st, now = ui.sys.time.absDay();
    const dpw = ui.num('DAYS_PER_WEEK');
    const today = st.log.filter((l) => l.day === now).reverse();
    const before = st.log.filter((l) => l.day !== now).reverse();
    const line = (l) => h('div.ln.sm', Dom.icon(Icons.has(l.icon) ? l.icon : 'log', 18), h('span.small.muted.lt', Calendar.clock(l.minute)), h('span.small', l.text));
    const groups = [];
    for (const l of before) {
      if (groups.at(-1)?.day !== l.day) groups.push({ day: l.day, lines: [] });
      groups.at(-1).lines.push(l);
    }
    const dayName = (d) => { const w = Math.ceil(d / dpw), dd = ((d - 1) % dpw) + 1; return `Week ${w} · ${WEEKDAYS[(dd - 1) % 7]} (D${dd})`; };
    const box = (kids, empty) => h('div.scroll.logbox', kids.length ? kids : h('div.small.muted', { style: { padding: '8px' } }, empty));
    return [
      [h('h3', Dom.icon('log', 28), 'Today', h('span.aside', `${today.length}`)), box(today.map(line), 'The day is still fresh.')],
      [h('h3', Dom.icon('calendar', 28), 'Before', h('span.aside', `${before.length}`)),
        box(groups.flatMap((g) => [h('div.logday', dayName(g.day)), ...g.lines.map(line)]), 'This is your first day.')]
    ];
  }
}
