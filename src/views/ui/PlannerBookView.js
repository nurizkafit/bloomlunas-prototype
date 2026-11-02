import { MSG } from '../../core/EventBus.js';
import { DAYS, hm } from '../../systems/PlanValidator.js';
import { ic, KC, iconFor, colorFor } from './icons.js';
import './planner.css';

/**
 * PlannerBookView: the Plan phase screen, ported from the Planner Book v2 (prototypes/plan-phase-book).
 * Same look and interactions: ribbon, two-page book, divider tabs (Week, Ledger, Market, Town, Journal),
 * card deck, drag to a time (30 min snap), card settings, problems and warnings, review, "Start the week".
 * Reads GameState and PlanValidator results. Changes go out as intents only.
 * Unity: UI screen (UI Toolkit or uGUI) + drag handler.
 */
export class PlannerBookView {
  /** @param {HTMLElement} root @param {import('../../core/GameManager.js').GameManager} gm */
  constructor(root, gm) {
    this.gm = gm;
    this.bus = gm.bus;
    this.s = gm.state;
    this.c = gm.content;
    this.v = gm.ctx.sys.plan;
    this.tab = 'week';
    /** 'plan' in the Plan phase; 'do' when opened from the HUD (only days not started can change). */
    this.mode = 'plan';
    this.mkSel = 'fresh_jamu';
    this.R = null;
    /** Deck drafts: settings per activity before it is placed. */
    this.draft = {};
    this.deck = this.c.all('activities').filter((a) => a.plannable);
    for (const a of this.deck) this.draft[a.id] = this.#defaults(a);
    this.DS = this.c.num('DAY_START_HOUR');
    this.DE = this.c.num('DAY_END_HOUR');
    this.NE = this.c.num('NIGHT_END_HOUR');

    root.insertAdjacentHTML('beforeend', `<div class="pb-fit" id="pbFit" hidden><div id="stage">
      <header id="ribbon">
        <div class="brand">BloomLunas <small>Planner</small></div>
        <div class="steps"><span class="step on">Plan</span><span class="step">Do</span><span class="step">Check</span></div>
        <div class="rs"><span class="k" id="rWeek">–</span><span class="v" style="font-family:var(--f-display)" id="rDays">–</span></div>
        <div class="sep"></div>
        <div class="rs"><span class="k">Gold now</span><span class="v num" style="color:var(--gold)" id="rGold">–</span></div>
        <div class="rs"><span class="k">End of week</span><span class="v num" id="rEnd">–</span></div>
        <div class="rs"><span class="k" id="rDebtK">Debt</span><span class="v num" style="color:#f0947f" id="rDebt">–</span></div>
        <div class="sep"></div>
        <div id="rIssues" style="display:flex;gap:6px"></div>
        <div class="spacer"></div>
        <button class="go" id="confirmBtn">Review plan</button>
      </header>
      <div id="bookWrap"><div id="book"><div class="spine"></div>
        <div class="spread" data-tab="week">
          <section class="page l"><div class="ph"><h2>This week · Mon – Thu</h2><span class="tag">Drag cards to a time · snaps to 30 min · card height = hours</span></div><div class="wk l" id="wkL"></div><span class="folio" id="fL">left</span></section>
          <section class="page r"><div class="ph"><h2>Fri – Sun</h2><span class="tag" id="dayTag"></span></div><div class="wk r" id="wkR"></div><span class="folio" id="fR">right</span></section>
        </div>
        <div class="spread" data-tab="ledger" hidden><section class="page l" id="ledL"></section><section class="page r" id="ledR"></section></div>
        <div class="spread" data-tab="market" hidden><section class="page l" id="mkL"></section><section class="page r" id="mkR"></section></div>
        <div class="spread" data-tab="town" hidden><section class="page l" id="twL"></section><section class="page r" id="twR"></section></div>
        <div class="spread" data-tab="journal" hidden><section class="page l" id="jnL"></section><section class="page r" id="jnR"></section></div>
      </div><nav id="tabs" role="tablist" aria-label="Planner sections"></nav></div>
    </div></div>`);
    this.fit = root.querySelector('#pbFit');
    this.stage = root.querySelector('#stage');
    this.$ = (sel) => this.stage.querySelector(sel);
    this.#wire();
    this.bus.on(MSG.PHASE_ENTERED, ({ phase }) => {
      this.fit.hidden = phase !== 'Plan';
      this.mode = 'plan';
      this.$('#confirmBtn').textContent = 'Review plan';
      if (phase === 'Plan') { this.tab = 'week'; this.#fitScale(); this.render(); }
    });
    this.bus.on(MSG.PLAN_VALIDATED, (r) => { this.R = r; if (!this.fit.hidden) this.render(); });
    addEventListener('resize', () => this.#fitScale());
  }

  /** Open the book during Do. Only days that have not started can change. */
  openInDo() {
    this.mode = 'do';
    this.tab = 'week';
    this.fit.hidden = false;
    this.$('#confirmBtn').textContent = 'Back to town';
    this.#fitScale();
    this.render();
  }

  /** Why a day cannot change now (Do mode), or the location reason. */
  #dayProblem(card, d) {
    if (this.mode === 'do' && d <= this.s.calendar.day) return `${DAYS[d]} has started. Change only later days`;
    return this.v.dayProblem(card, d);
  }

  #defaults(a) {
    const d = { durationMin: a.planDurationMin };
    if (a.locationIds.length > 1) d.locationId = a.locationIds[0];
    if (a.id === 'craft') d.recipeId = this.c.all('recipes')[0].id;
    return d;
  }

  #fitScale() {
    const sc = Math.min(innerWidth / 1600, innerHeight / 900);
    this.stage.style.transform = `scale(${sc})`;
  }

  #scale() { return this.stage.getBoundingClientRect().width / 1600; }
  #hpx() { return parseFloat(getComputedStyle(this.stage).getPropertyValue('--hour')) || 36; }
  #name(id) { return this.c.get('activities', id).name; }
  #loc(card) { const l = this.v.location(card); return l ? this.c.get('locations', l).name : 'Anywhere'; }
  #dur(card) { return this.v.duration(card); }
  #sum(card) {
    if (card.activityId === 'craft') { const r = this.c.get('recipes', card.recipeId); return `${r.name} → ${r.output} ${this.c.get('items', r.product).name}`; }
    return `${this.#dur(card) / 60} h · ${this.#loc(card)}`;
  }

  // ---------------------------------------------------------------- render
  render() {
    const R = this.R ?? this.v.validate();
    const cal = this.s.calendar;
    const first = (cal.week - 1) * 7 + 1;
    this.$('#rWeek').textContent = `Month ${cal.month} · Week ${cal.week}`;
    this.$('#rDays').textContent = `Day ${first} – ${first + 6}`;
    this.$('#rGold').textContent = `${Math.floor(this.s.wallet.gold)} G`;
    this.$('#rEnd').innerHTML = `<span style="color:var(--gold)">${R.endLo}–${R.endHi} G</span>`;
    const daysLeft = cal.weeksPerMonth * 7 - (cal.week - 1) * 7;
    this.$('#rDebtK').textContent = `Debt · ${this.c.num('DEBT_MIN_PAYMENT')} G due in ${daysLeft} days`;
    this.$('#rDebt').textContent = `${Math.round(this.s.debt.balance).toLocaleString('en')} G`;
    const TI = this.#tabIssues(R);
    this.$('#rIssues').innerHTML = (R.bad ? `<button class="pill bad" data-goto="${TI.week.bad ? 'week' : 'ledger'}">✕ ${R.bad} problem${R.bad > 1 ? 's' : ''}</button>` : '')
      + (R.warn ? `<button class="pill warn" data-goto="${TI.week.warn ? 'week' : 'ledger'}">! ${R.warn} warning${R.warn > 1 ? 's' : ''}</button>` : '')
      + (!R.bad && !R.warn ? '<span class="pill ok">✓ Plan looks safe</span>' : '');
    this.$('#tabs').innerHTML = TABS.map((t, i) => {
      const s = TI[t.id];
      const bd = s.bad ? `<span class="bdg">${s.bad}</span>` : s.warn ? `<span class="bdg w">${s.warn}</span>` : '';
      return `<button class="tab" role="tab" aria-selected="${this.tab === t.id}" data-tab="${t.id}" style="--tc:${t.c}">${bd}<b>${t.n}</b><small>${t.sub}</small><kbd>${i + 1}</kbd></button>`;
    }).join('');
    this.stage.querySelectorAll('.spread').forEach((s) => { s.hidden = s.dataset.tab !== this.tab; });
    const tc = TABS.find((t) => t.id === this.tab).c;
    this.stage.querySelectorAll('.page.r').forEach((p) => {
      let e = p.querySelector(':scope > .edge');
      if (!e) { e = document.createElement('span'); e.className = 'edge'; p.appendChild(e); }
      e.style.setProperty('--tc', tc);
    });
    this[`render_${this.tab}`](R);
  }

  #tabIssues(R) {
    const card = Object.values(R.issues).flat();
    const led = R.plan.filter((x) => x.tab === 'ledger'), wk = R.plan.filter((x) => x.tab !== 'ledger');
    const n = (list, l) => list.filter((x) => x.lvl === l).length;
    return {
      week: { bad: n(card, 'bad') + n(wk, 'bad'), warn: n(card, 'warn') + n(wk, 'warn') },
      ledger: { bad: n(led, 'bad'), warn: n(led, 'warn') },
      market: { bad: 0, warn: 0 }, town: { bad: 0, warn: 0 }, journal: { bad: 0, warn: 0 }
    };
  }

  #go(tab) {
    if (!TABS.some((t) => t.id === tab)) return;
    if (tab !== this.tab) {
      this.tab = tab;
      this.#closePop();
      const b = this.$('#book');
      b.classList.remove('turn'); void b.offsetWidth; b.classList.add('turn');
    }
    this.render();
  }

  // ---- week
  #hoursCol() {
    let h = '<div class="hours">';
    for (let x = this.DS; x <= this.NE; x += 2) h += `<span class="num" style="top:calc(var(--hour) * ${x - this.DS})">${hm(x * 60)}</span>`;
    return h + '</div>';
  }

  #dayCol(d, R) {
    const cards = this.s.plan.cards.filter((c) => c.day === d).sort((a, b) => a.startMin - b.startMin);
    const late = d > 0 && R.dayEnd[d - 1] > this.DE * 60;
    const work = cards.reduce((n, c) => n + this.#dur(c), 0) / 60;
    const night = cards.reduce((n, c) => n + Math.max(0, c.startMin + this.#dur(c) - Math.max(c.startMin, this.DE * 60)), 0) / 60;
    const chips = this.#chips(d) + (late ? '<span class="chip late">Late wake?</span>' : '');
    let html = '';
    for (const c of cards) {
      const a = this.c.get('activities', c.activityId);
      const iss = R.issues[c.uid] ?? [], b = iss.find((i) => i.lvl === 'bad'), w = iss.find((i) => i.lvl === 'warn');
      const h = this.#dur(c) / 60, s = c.startMin / 60, e = s + h;
      html += `<div class="bc${e > this.DE ? ' ot' : ''}" data-uid="${c.uid}" tabindex="0" style="--k:${colorFor(a)};top:calc(var(--hour) * ${s - this.DS} + 1px);height:calc(var(--hour) * ${h} - 2px)">
        <div class="t">${ic(iconFor(a))}${a.name}</div>${h >= 1.5 ? `<div class="m num"><span>${hm(c.startMin)}–${hm(c.startMin + this.#dur(c))}</span></div>` : ''}${h >= 2 ? `<div class="m">${this.#sum(c)}</div>` : ''}
        ${h >= 1 ? `<span class="gear" title="Settings">${ic('gear')}</span>` : ''}${b ? '<span class="flag">✕</span>' : w ? '<span class="flag w">!</span>' : ''}</div>`;
    }
    const first = (this.s.calendar.week - 1) * 7 + 1;
    return `<div class="day"><div class="dh"><div class="dn"><b>${DAYS[d]}</b><span class="num">Day ${first + d}</span></div><div class="chips">${chips}</div><div class="capl num">${work} h planned${night ? ` · ${night} h night` : ''}</div></div>
      <div class="col" data-d="${d}"><span class="moonlbl">${ic('moon')}Night</span>${html}</div></div>`;
  }

  #chips(d) {
    let out = '';
    if (this.c.get('locations', 'loc_market').openHours[d]) out += '<span class="chip mkt">Market</span>';
    if (!this.c.get('locations', 'loc_home_shop').openHours[d]) out += '<span class="chip closed">Closed</span>';
    const abs = this.s.calendar.absDay() - this.s.calendar.day + d;
    if (this.s.appointments.some((a) => a.absDay === abs && !a.done)) out += '<span class="chip">Appointment</span>';
    if (this.s.quests.some((q) => q.dueDay === abs)) out += '<span class="chip closed">Deadline</span>';
    for (const e of this.gm.ctx.sys.events.scheduledThisWeek().filter((x) => x.trigger.day === d)) out += `<span class="chip fest" title="${e.text}">${e.title}</span>`;
    return out;
  }

  render_week(R) {
    this.$('#dayTag').textContent = `${hm(this.DS * 60)}–${hm(this.DE * 60)} day · ${hm(this.DE * 60)}–${hm(this.NE * 60)} night work`;
    this.$('#fL').textContent = this.$('#fR').textContent = `Week ${this.s.calendar.week}`;
    this.$('#wkL').innerHTML = this.#hoursCol() + [0, 1, 2, 3].map((d) => this.#dayCol(d, R)).join('');
    const deck = this.deck.map((a) => {
      const card = { activityId: a.id, ...this.draft[a.id] };
      const used = this.s.plan.cards.filter((p) => p.activityId === a.id).length;
      const open = this.#openTxt(card);
      return `<div class="dc" data-type="${a.id}" tabindex="0" style="--k:${colorFor(a)}">${used ? `<span class="used">×${used}</span>` : ''}
        <div class="t">${ic(iconFor(a))}${a.name}</div>
        <span class="m set">${a.id === 'craft' ? this.c.get('recipes', card.recipeId).name : this.#loc(card)}</span>
        <span class="m num">${this.#dur(card) / 60} h · ${open}</span>
        <span class="cfg">${ic('gear')}Settings</span></div>`;
    }).join('');
    this.$('#wkR').innerHTML = this.#hoursCol() + [4, 5, 6].map((d) => this.#dayCol(d, R)).join('')
      + `<div class="deck" id="deck"><h3>Card deck</h3><div class="hint">Click a card to change its settings, then drag it onto a day. It snaps to 30 minutes. Drag a planned card back here to remove it.</div><div class="list">${deck}</div></div>`;
  }

  #openTxt(card) {
    const l = this.v.location(card);
    if (!l) return 'any time';
    const h = this.c.get('locations', l).openHours;
    const days = h.map((x, i) => (x ? i : -1)).filter((i) => i >= 0);
    const first = h[days[0]];
    const dt = days.length === 7 ? 'Daily' : days.length === 6 && !days.includes(6) ? 'Mon–Sat' : days.map((d) => DAYS[d]).join(' ');
    return first[0] === 0 && first[1] === 24 ? `${dt}` : `${dt} ${first[0]}–${first[1]}`;
  }

  // ---- ledger
  render_ledger(R) {
    const inv = this.s.inventory;
    const mid = (id) => { const f = this.c.get('items', id).forecast; return (f.lo + f.hi) / 2; };
    const rows = (kind) => {
      const ids = [...new Set(inv.find((l) => this.c.get('items', l.item).kind === kind).map((l) => l.item))];
      return ids.map((id) => {
        const lots = inv.find((l) => l.item === id);
        const n = lots.reduce((a, l) => a + l.qty, 0);
        const detail = [...new Set(lots.map((l) => (l.tier ?? l.variant) + (l.spoiled ? ' (spoiled)' : '')))].join(', ');
        return `<tr><td><span class="sw" style="background:${SW[id] ?? '#b8a77e'}"></span>${this.c.get('items', id).name} <small style="color:var(--ink-3)">${detail}</small></td><td class="num">${n}</td><td class="num">~${Math.round(n * mid(id))} G</td></tr>`;
      }).join('') || '<tr><td colspan="3" style="color:var(--ink-3)">None</td></tr>';
    };
    const loan = this.c.all('debt')[0];
    this.$('#ledL').innerHTML = `<div class="ph"><h2>Assets</h2><span class="tag">Step 1a · know your position</span></div>
      <div class="big"><div class="coin" aria-hidden="true"></div><div><div class="v num">${Math.floor(this.s.wallet.gold)} G</div><div style="font-size:12.5px;color:var(--ink-2)">End of week (forecast): <b class="num" style="color:var(--gold-ink)">${R.endLo}–${R.endHi} G</b></div></div></div>
      <table class="led"><tr><th>Item</th><th>Now</th><th>Value (forecast mid)</th></tr>
      <tr><td colspan="3" class="sub-h">Materials</td></tr>${rows('material')}
      <tr><td colspan="3" class="sub-h">Products</td></tr>${rows('product')}</table>
      <div class="box debt"><h4><span>Riba loan</span><span class="num" style="color:var(--coral-ink)">${Math.round(this.s.debt.balance).toLocaleString('en')} G</span></h4>
       <div class="kv"><span>Interest (compound)</span><span>${this.c.num(loan.rateKey) * 100} % per month <span class="var">DEBT_INTEREST_RATE</span></span>
       <span>Hidden fees</span><span>Late fee ${this.c.num('HIDDEN_FEE_LATE')} G <span class="var">HIDDEN_FEE_LATE</span></span>
       <span>Minimum installment</span><span class="num">${this.c.num(loan.minPaymentKey)} G at month end</span>
       <span>Bankruptcy at</span><span class="num">${this.c.num(loan.limitKey)} G <span class="var">DEBT_LIMIT</span></span></div></div>
      <span class="folio">Ledger · assets</span>`;
    const b = this.s.plan.budget, tot = Math.max(1, Math.floor(this.s.wallet.gold));
    const exp = this.c.num('WEEKLY_EXPENSES');
    const sl = [
      { k: 'exp', n: 'Weekly expenses', i: 'home', why: 'Food, lamp oil, family allowance. Paid in Check.', hint: b.exp >= exp ? ['ok', `✓ Covers ${exp} G living costs`] : ['bad', `✕ Living costs are ${exp} G`] },
      { k: 'buy', n: 'Purchases', i: 'basket', why: 'Gold for Buy cards. Real prices show only when you buy.', hint: b.buy > 0 ? ['ok', `✓ ${b.buy} G for purchases`] : ['', 'No gold for purchases'] },
      { k: 'buf', n: 'Buffer (savings)', i: 'lock', why: 'Carries to month-end: debt installment and utilities.', hint: ['', `Month-end bills: ${this.c.num('DEBT_MIN_PAYMENT') + this.c.num('MONTHLY_UTILITIES')} G`] }
    ];
    const seg = [['Weekly expenses', b.exp, '#c98a3c'], ['Purchases', b.buy, '#4f8fc4'], ['Buffer', b.buf, '#7a6fd6'], ['No job', Math.max(0, R.unassigned), '#b8a77e']];
    this.$('#ledR').innerHTML = `<div class="ph"><h2>Budget</h2><span class="tag">Step 1c · give every gold a job</span></div>
      <div class="unas"><span>Gold with no job</span><b class="num" style="color:${R.unassigned < 0 ? 'var(--coral-ink)' : R.unassigned > 0 ? 'var(--gold-ink)' : 'var(--jade-ink)'}">${R.unassigned} G</b></div>
      ${sl.map((x) => `<div class="slot"><span class="nm">${ic(x.i)}${x.n}</span><span class="ctl"><button data-s="${x.k}" data-v="-10" aria-label="Remove 10 G">−</button><span class="num">${b[x.k] ?? 0} G</span><button data-s="${x.k}" data-v="10" aria-label="Add 10 G">+</button></span><span class="why">${x.why}</span><span class="hint ${x.hint[0]}">${x.hint[1]}</span></div>`).join('')}
      <div class="sec"><span>Where the ${tot} G goes</span></div>
      <div class="stack">${seg.filter((x) => x[1] > 0).map((x) => `<div style="width:${(x[1] / tot) * 100}%;background:${x[2]}">${x[1]}</div>`).join('')}</div>
      <div class="stackl">${seg.map((x) => `<span><i style="background:${x[2]}"></i>${x[0]}</span>`).join('')}</div>
      <span class="folio">Ledger · budget</span>`;
  }

  // ---- market
  render_market() {
    const items = this.c.all('items').filter((i) => i.forecast);
    const max = Math.max(...items.map((i) => i.forecast.hi)) + 2;
    const pct = (v) => (v / max) * 100;
    const hist = this.s.priceHistory ?? [];
    const lastReal = (id) => hist.length ? hist.at(-1).prices[id] : null;
    const row = (i) => {
      const f = i.forecast, last = lastReal(i.id);
      return `<div class="mk" role="option" tabindex="0" aria-selected="${this.mkSel === i.id}" data-mk="${i.id}"><div class="nm">${i.name}<small>${i.kind === 'product' ? 'sell / unit' : 'buy / unit'}</small></div>
        <div class="rbar"><div class="band" style="left:${pct(f.lo)}%;width:${pct(f.hi - f.lo)}%"></div><div class="mid" style="left:${pct((f.lo + f.hi) / 2)}%"></div>${last != null ? `<div class="last" style="left:${pct(last)}%"></div>` : ''}</div>
        <div class="rng num">${f.lo}–${f.hi} G</div></div>`;
    };
    this.$('#mkL').innerHTML = `<div class="ph"><h2>Price forecast</h2><span class="tag">Step 1b · Guild bulletin, week ${this.s.calendar.week}</span></div>
      <div class="legend"><span><i></i>Predicted range</span><span><em></em>Last week real price</span><span style="color:var(--ink-3)">Click a row for details</span></div>
      <div class="sec"><span>You sell</span></div>${items.filter((i) => i.kind === 'product').map(row).join('')}
      <div class="sec"><span>You buy</span></div>${items.filter((i) => i.kind !== 'product').map(row).join('')}
      <div class="box" style="margin:auto 0 18px"><div style="font-size:12.5px;line-height:1.45">Real prices stay hidden in Plan. You see a real price only when you buy or sell in Do. Quality tier changes the sell price.</div></div>
      <span class="folio">Market · list</span>`;
    const it = this.c.get('items', this.mkSel), f = it.forecast;
    const X = (w) => 90 + (w - 1) * 165, Y = (v) => 150 - (v / max) * 130;
    const weeks = this.s.calendar.weeksPerMonth, now = this.s.calendar.week;
    const pts = hist.filter((h) => h.month === this.s.calendar.month);
    const chart = `<svg viewBox="0 0 680 180" width="100%" role="img" aria-label="Real price history">
      ${[0, Math.round(max / 2), max].map((v) => `<line x1="30" x2="670" y1="${Y(v)}" y2="${Y(v)}" stroke="#2b241820"/><text x="24" y="${Y(v) + 3}" font-size="9" text-anchor="end" fill="#8f805f">${v}</text>`).join('')}
      ${Array.from({ length: weeks }, (_, k) => k + 1).map((w) => `<rect x="${X(w) - 34}" y="${Y(f.hi)}" width="68" height="${Y(f.lo) - Y(f.hi)}" rx="3" fill="${w === now ? '#4f8fc466' : 'none'}" stroke="#4f8fc4" ${w > now ? 'stroke-dasharray="4 3"' : ''}/>
        <text x="${X(w)}" y="168" font-size="10" text-anchor="middle" fill="${w === now ? '#2b2418' : '#8f805f'}" font-weight="${w === now ? 700 : 400}">W${w}${w === now ? ' (now)' : ''}</text>`).join('')}
      ${pts.map((h) => `<circle cx="${X(h.week)}" cy="${Y(h.prices[it.id])}" r="5" fill="#2b2418" stroke="#fbf5e6" stroke-width="1.5"/><text x="${X(h.week) + 10}" y="${Y(h.prices[it.id]) + 4}" font-size="10" fill="#2b2418">real ${h.prices[it.id]}</text>`).join('')}
    </svg>`;
    const uses = this.c.all('recipes').filter((r) => r.product === it.id || Object.values(r.slots).flat().some((s) => s.item === it.id)).map((r) => `<span class="cchip" style="--k:${KC.craft}">${r.name}</span>`).join('');
    const variants = it.variants ? it.variants.map((v) => `${v.id} ×${v.priceMult} · keeps ${v.shelfLifeDays} d`).join('<br>') : `keeps ${it.shelfLifeDays} d`;
    this.$('#mkR').innerHTML = `<div class="ph"><h2>${it.name}</h2><span class="tag">${it.kind}</span></div>
      <div class="dt-big"><span class="v num">${f.lo}–${f.hi} G</span><span class="conf m">Forecast</span></div>
      <div class="sec"><span>Variants and shelf life</span></div><div style="font-size:13px">${variants}</div>
      <div class="sec"><span>Real price history (this month)</span></div>${chart}
      <div class="sec"><span>Recipes that use it</span></div><div class="chipsx">${uses || '–'}</div>
      <span class="folio">Market · detail</span>`;
  }

  // ---- town
  render_town() {
    const cal = this.s.calendar, days = cal.weeksPerMonth * 7, nowStart = (cal.week - 1) * 7 + 1;
    const mk = this.c.get('locations', 'loc_market').openHours;
    let grid = DAYS.map((d) => `<div class="hd">${d}</div>`).join('');
    for (let d = 1; d <= days; d++) {
      const wd = (d - 1) % 7, abs = (cal.month - 1) * days + d - 1;
      const ev = [];
      if (mk[wd]) ev.push(['Scheduled', 'Market day']);
      for (const a of this.s.appointments.filter((x) => x.absDay === abs)) ev.push(['Scheduled', `Appointment ${a.serviceId}`]);
      for (const q of this.s.quests.filter((x) => x.dueDay === abs)) ev.push(['Predicted', `Quest due: ${q.ask.qty} ${q.ask.item}`]);
      for (const e of this.c.all('events').filter((x) => x.type === 'scheduled' && (x.trigger.month ?? cal.month) === cal.month && (x.trigger.week - 1) * 7 + x.trigger.day + 1 === d)) ev.push(['Scheduled', e.title]);
      if (d === days) ev.push(['Bill', `Bills ${this.c.num('DEBT_MIN_PAYMENT') + this.c.num('MONTHLY_UTILITIES')} G`]);
      grid += `<div class="cd ${d < nowStart ? 'past' : ''} ${d >= nowStart && d < nowStart + 7 ? 'now' : ''} ${d === days ? 'bill' : ''}"><span class="n">${d}</span>${ev.map((e) => `<span class="e ${e[0]}">${e[1]}</span>`).join('')}</div>`;
    }
    this.$('#twL').innerHTML = `<div class="ph"><h2>Month ${cal.month} calendar</h2><span class="tag">Step 1b · public schedule</span></div>
      <div class="cal">${grid}</div>
      <p style="font-size:12px;color:var(--ink-2);margin:10px 0 0">Random events never show here. Only a buffer protects against them.</p>
      <span class="folio">Town · calendar</span>`;
    const locs = this.c.all('locations').filter((l) => l.openHours);
    const cell = (h) => (h ? (h[0] === 0 && h[1] === 24 ? 'All day' : `${h[0]}–${h[1]}`) : 'Closed');
    this.$('#twR').innerHTML = `<div class="ph"><h2>Opening hours · week ${cal.week}</h2><span class="tag"><span class="var">locations/*.openHours</span></span></div>
      <table class="hrs"><tr><th>Location</th>${DAYS.map((d) => `<th>${d}</th>`).join('')}</tr>
      ${locs.map((l) => `<tr><td>${l.name}</td>${l.openHours.map((h) => `<td class="num ${h ? '' : 'x'}">${cell(h)}</td>`).join('')}</tr>`).join('')}</table>
      <div class="sec" style="margin-top:14px"><span>Quest boards</span></div>
      <div class="evl">${this.c.all('entities').filter((e) => e.questBoard?.length).flatMap((e) => e.questBoard.map((q) => `<div class="ev"><span class="d">${e.id.split('_')[0]}</span><div>${q.ask.qty} ${this.c.get('items', q.ask.item).name}<small>Reward ${q.rewardGold} G · ${q.deadlineDays} days</small></div><span class="ty Scheduled">Quest</span></div>`)).join('')}</div>
      <span class="folio">Town · hours</span>`;
  }

  // ---- journal
  render_journal() {
    const notes = this.s.notes ?? [];
    this.$('#jnL').innerHTML = `<div class="ph"><h2>Notes</h2><span class="tag">Step 1e · use last week's evidence</span></div>
      ${notes.length ? notes.slice(-4).reverse().map((n) => `<div class="notecard"><div class="from"><span>Week ${n.week} · Check</span></div><p>${esc(n.text)}</p></div>`).join('') : '<p style="color:var(--ink-3)">No notes yet. You write notes in Check at the end of each week.</p>'}
      <span class="folio">Journal · notes</span>`;
    const w = (this.s.weekReports ?? []).at(-1);
    this.$('#jnR').innerHTML = `<div class="ph"><h2>${w ? `Week ${w.week} recap` : 'Recap'}</h2><span class="tag">Last Check</span></div>
      ${w ? `<table class="led"><tr><th>Item</th><th>Amount</th></tr>
        <tr><td>Income</td><td class="num">${w.income} G</td></tr><tr><td>Expenses</td><td class="num down">${w.expenses} G</td></tr>
        <tr><td>Products sold</td><td class="num">${w.sold}</td></tr><tr><td>Waste</td><td class="num">${w.waste}</td></tr>
        <tr class="tot"><td>Net</td><td class="num">${w.net} G</td></tr></table>` : '<p style="color:var(--ink-3)">This is the first week. No recap yet.</p>'}
      <span class="folio">Journal · recap</span>`;
  }

  // ---------------------------------------------------------------- popover, toast, review
  #closePop() { this.pop?.remove(); this.pop = null; }

  #showPop(html, anchor) {
    this.#closePop();
    const pop = document.createElement('div');
    pop.className = 'pop';
    pop.innerHTML = html;
    this.stage.appendChild(pop);
    const sc = this.#scale(), sr = this.stage.getBoundingClientRect(), ar = anchor.getBoundingClientRect();
    let x = (ar.right - sr.left) / sc + 10, y = (ar.top - sr.top) / sc;
    if (x + pop.offsetWidth > 1590) x = (ar.left - sr.left) / sc - pop.offsetWidth - 10;
    if (y + pop.offsetHeight > 890) y = 890 - pop.offsetHeight;
    pop.style.left = `${Math.max(10, x)}px`;
    pop.style.top = `${Math.max(10, y)}px`;
    pop.querySelector('.x')?.addEventListener('click', () => this.#closePop());
    this.pop = pop;
  }

  /** @param {any} card placed card (has uid) or deck draft */
  #cardPop(card, anchor) {
    const a = this.c.get('activities', card.activityId);
    const R = this.R ?? this.v.validate();
    const iss = card.uid ? R.issues[card.uid] ?? [] : [];
    const sets = [];
    if (a.locationIds.length > 1) sets.push({ key: 'locationId', label: 'Where', opt: a.locationIds.map((id) => [id, this.c.get('locations', id).name]) });
    if (a.id === 'craft') sets.push({ key: 'recipeId', label: 'Recipe', opt: this.c.all('recipes').map((r) => [r.id, r.name]) });
    else if (a.planDurationOptions?.length > 1) sets.push({ key: 'durationMin', label: 'Hours', opt: a.planDurationOptions.map((m) => [m, `${m / 60} h`]) });
    const settings = sets.length ? `<div class="sets">${sets.map((s) => `<div class="setrow"><span>${s.label}</span><div class="seg" role="radiogroup" aria-label="${s.label}">${s.opt.map(([v, l]) => `<button role="radio" aria-checked="${card[s.key] === v}" data-set="${s.key}" data-val="${v}">${l}</button>`).join('')}</div></div>`).join('')}</div>` : '';
    const actions = a.actionIds.filter((x) => x !== 'travel').map((x) => this.c.get('actions', x).name).join(', ');
    this.#showPop(`<button class="x" aria-label="Close">×</button><div class="kind">${a.category} card${card.uid ? ' · planned' : ' · deck'}</div><h3>${ic(iconFor(a))}${a.name}</h3>
      <div class="sub">Actions: ${actions}.</div>${settings}<table>
      <tr><td>Location</td><td>${this.#loc(card)}</td></tr><tr><td>Duration</td><td class="num">${this.#dur(card) / 60} h</td></tr>
      <tr><td>Importance</td><td><span class="pips">${'●'.repeat(a.importance)}${'○'.repeat(3 - a.importance)}</span></td></tr>
      <tr><td>Can be missed</td><td>${a.canMiss ? 'Yes, no penalty' : '<b>No</b>, penalty'}</td></tr>
      <tr><td>Open</td><td>${this.#openTxt(card)}</td></tr>
      ${a.skillPath ? `<tr><td>Skill path</td><td>${a.skillPath} (plan match bonus XP)</td></tr>` : ''}
      ${card.uid ? `<tr><td>Planned</td><td class="num">${DAYS[card.day]} ${hm(card.startMin)}–${hm(card.startMin + this.#dur(card))}</td></tr>` : ''}</table>
      ${iss.map((i) => `<div class="issue ${i.lvl === 'warn' ? 'w' : ''}">${i.lvl === 'bad' ? '✕' : '!'} ${i.msg}</div>`).join('')}
      ${card.uid ? '<button class="rm" id="rmBtn">Remove from plan</button>' : ''}`, anchor);
    this.pop.querySelector('#rmBtn')?.addEventListener('click', () => { this.bus.emit(MSG.INTENT_REMOVE_CARD, { uid: card.uid }); this.#closePop(); this.#toast('Card removed. It is back in the deck.'); });
    this.pop.querySelectorAll('[data-set]').forEach((bt) => bt.addEventListener('click', () => {
      const key = bt.dataset.set, val = key === 'durationMin' ? Number(bt.dataset.val) : bt.dataset.val;
      if (card.uid) {
        const next = { ...card, [key]: val };
        if (this.mode === 'do' && card.day <= this.s.calendar.day) { this.#toast('This day has started.', 'bad'); return; }
        if (key === 'locationId') { const why = this.v.dayProblem(next, card.day); if (why) { this.#toast(`${why}. Move the card first.`, 'bad'); return; } }
        const chk = this.v.slotCheck(next, card.day, card.startMin);
        if (chk.lvl === 'bad') { this.#toast(`${chk.msg}. The new setting does not fit here.`, 'bad'); return; }
        this.bus.emit(MSG.INTENT_MOVE_CARD, { uid: card.uid, [key]: val });
        const p = this.s.plan.cards.find((x) => x.uid === card.uid);
        const el = this.stage.querySelector(`.bc[data-uid="${card.uid}"]`);
        if (el) this.#cardPop(p, el);
      } else {
        this.draft[a.id] = { ...this.draft[a.id], [key]: val };
        this.render();
        const el = this.stage.querySelector(`.dc[data-type="${a.id}"]`);
        if (el) this.#cardPop({ activityId: a.id, ...this.draft[a.id] }, el);
      }
    }));
  }

  #toast(msg, cls = '') {
    this.stage.querySelectorAll('.toast').forEach((n) => n.remove());
    const t = document.createElement('div');
    t.className = `toast ${cls}`;
    t.setAttribute('role', 'status');
    t.textContent = msg;
    this.stage.appendChild(t);
    clearTimeout(this.tt);
    this.tt = setTimeout(() => t.remove(), 3200);
  }

  #openReview() {
    this.#closePop();
    const R = this.R ?? this.v.validate();
    const items = R.plan.map((x) => ({ ...x, tab: x.tab ?? 'week' }));
    for (const p of this.s.plan.cards) for (const i of R.issues[p.uid] ?? []) items.push({ lvl: i.lvl, msg: `<b>${this.#name(p.activityId)}</b> (${DAYS[p.day]}): ${esc(i.msg)}`, tab: 'week' });
    items.sort((a, b) => (a.lvl === 'bad' ? 0 : 1) - (b.lvl === 'bad' ? 0 : 1));
    const bad = items.some((x) => x.lvl === 'bad'), b = this.s.plan.budget;
    const scrim = document.createElement('div');
    scrim.className = 'scrim';
    scrim.innerHTML = `<div class="modal" role="dialog" aria-label="Review the plan"><h2>Review week ${this.s.calendar.week} plan</h2>
      <p class="lead">The plan is a guide, not a script. In Do, activities that match the plan give bonus XP (<span class="num" style="color:var(--gold)">PLAN_MATCH_XP_BONUS</span>).</p>
      <table><tr><th>Item</th><th>Forecast</th></tr>
      <tr><td>Income from the shop</td><td class="num">${R.incomeLo}–${R.incomeHi} G</td></tr>
      <tr><td>Purchases slot</td><td class="num">${b.buy ?? 0} G</td></tr>
      <tr><td>Weekly expenses</td><td class="num">${this.c.num('WEEKLY_EXPENSES')} G (slot ${b.exp ?? 0} G)</td></tr>
      <tr><td>Buffer to month-end</td><td class="num">${b.buf ?? 0} G</td></tr>
      <tr><td>Gold at end of week</td><td class="num">${R.endLo}–${R.endHi} G</td></tr></table>
      <ul>${items.length ? items.map((x) => `<li><span class="pill ${x.lvl}">${x.lvl === 'bad' ? '✕ Problem' : '! Warning'}</span><span>${x.msg}</span><a data-goto="${x.tab}">Open ${TABS.find((t) => t.id === x.tab).n}</a></li>`).join('') : '<li><span class="pill ok">✓ Safe</span><span>No problems found.</span></li>'}</ul>
      <div class="acts"><button class="sec2" id="backBtn">Back to plan</button><button class="go" id="startBtn">${bad ? 'Start anyway' : 'Start the week'}</button></div></div>`;
    this.stage.appendChild(scrim);
    this.scrim = scrim;
    scrim.querySelector('#backBtn').onclick = () => this.#closeModal();
    scrim.querySelector('#startBtn').onclick = () => {
      this.#closeModal();
      this.bus.emit(MSG.INTENT_LOCK_PLAN);
      this.bus.emit(MSG.INTENT_NEXT_PHASE);
    };
    scrim.addEventListener('click', (e) => { if (e.target === scrim) this.#closeModal(); });
  }

  #closeModal() { this.scrim?.remove(); this.scrim = null; }

  // ---------------------------------------------------------------- input
  #wire() {
    const st = this.stage;
    let drag = null;
    const cardOf = (src) => (src.classList.contains('bc')
      ? this.s.plan.cards.find((x) => x.uid === Number(src.dataset.uid))
      : { activityId: src.dataset.type, ...this.draft[src.dataset.type] });

    st.addEventListener('pointerdown', (e) => {
      const src = e.target.closest('.dc,.bc');
      if (!src || e.button > 0 || e.target.closest('.pop')) return;
      const isB = src.classList.contains('bc');
      if (isB && this.mode === 'do' && Number(src.closest('.col').dataset.d) <= this.s.calendar.day) { this.#toast('This day has started. You cannot move this card.', 'bad'); return; }
      const grab = isB ? (e.clientY - src.getBoundingClientRect().top) / this.#scale() / this.#hpx() : 0.25;
      drag = { src, c: cardOf(src), uid: isB ? Number(src.dataset.uid) : null, grab, x0: e.clientX, y0: e.clientY, moving: false };
      src.setPointerCapture?.(e.pointerId);
    });

    const markCols = () => st.querySelectorAll('.col').forEach((col) => {
      const why = this.#dayProblem(drag.c, Number(col.dataset.d));
      col.classList.toggle('ok', !why);
      col.classList.toggle('no', !!why);
      if (why) { const w = document.createElement('div'); w.className = 'why'; w.textContent = why; col.appendChild(w); }
    });
    const clearCols = () => {
      st.querySelectorAll('.col').forEach((col) => { col.classList.remove('ok', 'no'); col.querySelectorAll('.why,.snap').forEach((n) => n.remove()); });
      this.$('#deck')?.classList.remove('drop-remove');
    };
    const snapStart = (col, y, durH) => {
      const raw = (y - col.getBoundingClientRect().top) / this.#scale() / this.#hpx() - drag.grab;
      return Math.min(this.NE - durH, Math.max(this.DS, this.DS + Math.round(raw * 2) / 2)) * 60;
    };
    const hover = (e) => {
      st.querySelectorAll('.snap').forEach((n) => n.remove());
      const el = document.elementFromPoint(e.clientX, e.clientY);
      this.$('#deck')?.classList.toggle('drop-remove', !!(drag.uid && el?.closest('#deck')));
      const col = el?.closest('.col');
      drag.target = null;
      if (!col || col.classList.contains('no')) { drag.ghost.style.opacity = 0.95; return; }
      const d = Number(col.dataset.d), dur = this.#dur(drag.c), start = snapStart(col, e.clientY, dur / 60);
      const chk = this.v.slotCheck({ ...drag.c, uid: drag.uid }, d, start);
      drag.target = { d, start, chk };
      drag.ghost.style.opacity = 0;
      const m = document.createElement('div');
      m.className = `snap ${chk.lvl}`;
      m.style.top = `calc(var(--hour) * ${start / 60 - this.DS} + 1px)`;
      m.style.height = `calc(var(--hour) * ${dur / 60} - 2px)`;
      m.innerHTML = `<b>${this.#name(drag.c.activityId)}</b><span class="num">${hm(start)}–${hm(start + dur)}</span>${chk.msg ? `<small>${chk.lvl === 'bad' ? '✕' : '!'} ${chk.msg}</small>` : ''}`;
      col.appendChild(m);
    };

    st.addEventListener('pointermove', (e) => {
      if (!drag) return;
      if (!drag.moving) {
        if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
        drag.moving = true;
        this.#closePop();
        const a = this.c.get('activities', drag.c.activityId);
        const g = document.createElement('div');
        g.className = 'ghost';
        g.style.setProperty('--k', colorFor(a));
        g.innerHTML = `<b>${a.name}</b><span class="num">${this.#dur(drag.c) / 60} h</span> · ${this.#loc(drag.c)}`;
        st.appendChild(g);
        drag.ghost = g;
        drag.src.classList.add('dragging');
        markCols();
      }
      const sc = this.#scale(), sr = st.getBoundingClientRect();
      drag.ghost.style.left = `${(e.clientX - sr.left) / sc + 14}px`;
      drag.ghost.style.top = `${(e.clientY - sr.top) / sc - 8}px`;
      hover(e);
    });

    st.addEventListener('pointerup', (e) => {
      if (!drag) return;
      const d0 = drag;
      drag = null;
      if (!d0.moving) { this.#cardPop(d0.c, d0.src); return; }
      d0.ghost.remove();
      d0.src.classList.remove('dragging');
      const el = document.elementFromPoint(e.clientX, e.clientY);
      clearCols();
      if (d0.uid && el?.closest('#deck')) { this.bus.emit(MSG.INTENT_REMOVE_CARD, { uid: d0.uid }); this.#toast('Card removed from the plan.'); return; }
      if (!d0.target) { if (el?.closest('.col')) this.#toast(this.#dayProblem(d0.c, Number(el.closest('.col').dataset.d)) ?? 'You cannot drop it here.', 'bad'); this.render(); return; }
      const { d, start, chk } = d0.target;
      if (chk.lvl === 'bad') { this.#toast(`${chk.msg}. Drop it in a free slot.`, 'bad'); this.render(); return; }
      if (d0.uid) this.bus.emit(MSG.INTENT_MOVE_CARD, { uid: d0.uid, day: d, startMin: start });
      else this.bus.emit(MSG.INTENT_PLACE_CARD, { ...d0.c, day: d, startMin: start });
      const placed = d0.uid ? this.s.plan.cards.find((x) => x.uid === d0.uid) : this.s.plan.cards.at(-1);
      const iss = (this.R?.issues[placed.uid] ?? []);
      const b = iss.find((i) => i.lvl === 'bad'), w = iss.find((i) => i.lvl === 'warn');
      this.#toast(b ? b.msg : w ? w.msg : `${this.#name(placed.activityId)} planned on ${DAYS[d]}, ${hm(start)}–${hm(start + this.#dur(placed))}.`, b ? 'bad' : w ? '' : 'ok');
    });

    st.addEventListener('pointercancel', () => {
      if (drag?.ghost) { drag.ghost.remove(); drag.src.classList.remove('dragging'); clearCols(); }
      drag = null;
    });

    st.addEventListener('click', (e) => {
      const tb = e.target.closest('.tab');
      if (tb) { this.#go(tb.dataset.tab); return; }
      const gt = e.target.closest('[data-goto]');
      if (gt) { this.#closeModal(); this.#go(gt.dataset.goto); return; }
      const b = e.target.closest('[data-s]');
      if (b) {
        const k = b.dataset.s, v = Number(b.dataset.v), R = this.R ?? this.v.validate();
        if (v > 0 && R.unassigned <= 0) { this.#toast('No free gold. Take gold from another slot first.', 'bad'); return; }
        const cur = this.s.plan.budget[k] ?? 0;
        this.bus.emit(MSG.INTENT_SET_BUDGET, { slot: k, amount: Math.max(0, cur + Math.min(v, v > 0 ? R.unassigned : v)) });
        return;
      }
      const mk = e.target.closest('[data-mk]');
      if (mk) { this.mkSel = mk.dataset.mk; this.render(); return; }
      if (e.target.closest('#confirmBtn')) { if (this.mode === 'do') { this.fit.hidden = true; this.#closePop(); } else this.#openReview(); return; }
      if (!e.target.closest('.pop,.dc,.bc')) this.#closePop();
    });

    document.addEventListener('keydown', (e) => {
      if (this.fit.hidden) return;
      if (e.key === 'Escape') { this.#closePop(); this.#closeModal(); return; }
      if (this.scrim || e.target.matches?.('input,textarea')) return;
      const i = Number(e.key);
      if (i >= 1 && i <= 5) { this.#go(TABS[i - 1].id); return; }
      const fc = e.target.closest?.('.bc');
      if (fc && /^Arrow/.test(e.key)) {
        e.preventDefault();
        const p = this.s.plan.cards.find((x) => x.uid === Number(fc.dataset.uid));
        const dd = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0, dm = e.key === 'ArrowUp' ? -30 : e.key === 'ArrowDown' ? 30 : 0;
        const d = p.day + dd, s = p.startMin + dm;
        if (d < 0 || d > 6 || s < this.DS * 60 || s + this.#dur(p) > this.NE * 60) return;
        const why = this.#dayProblem(p, d) ?? (this.mode === 'do' && p.day <= this.s.calendar.day ? 'This day has started' : null);
        if (why) { this.#toast(why, 'bad'); return; }
        const chk = this.v.slotCheck(p, d, s);
        if (chk.lvl === 'bad') { this.#toast(chk.msg, 'bad'); return; }
        this.bus.emit(MSG.INTENT_MOVE_CARD, { uid: p.uid, day: d, startMin: s });
        this.stage.querySelector(`.bc[data-uid="${p.uid}"]`)?.focus();
        return;
      }
      if (e.key === 'Enter') {
        const c = e.target.closest?.('.dc,.bc');
        if (c) this.#cardPop(cardOf(c), c);
      }
    });
  }
}

const TABS = [
  { id: 'week', n: 'Week', sub: 'Plan days', c: '#e9b44c' },
  { id: 'ledger', n: 'Ledger', sub: 'Assets · budget', c: '#8fcf9a' },
  { id: 'market', n: 'Market', sub: 'Forecast', c: '#8fbbe6' },
  { id: 'town', n: 'Town', sub: 'Schedule · hours', c: '#e3a07f' },
  { id: 'journal', n: 'Journal', sub: 'Notes · recap', c: '#c4bbff' }
];

const SW = { turmeric: '#d99a2b', kencur: '#d8c08a', ginger: '#c7a46a', lemongrass: '#9fbf6a', tamarind: '#8a5a3a', palm_sugar: '#a8743a', rice: '#efe6cf', coconut_oil: '#d9d3c0', beeswax: '#e6c15a', fresh_jamu: '#b8732e', salep: '#8fb59d' };

/** @param {string} s */
function esc(s) {
  return String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
}
