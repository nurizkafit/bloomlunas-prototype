import { MSG } from '../../core/EventBus.js';
import { DAYS, hm } from '../../systems/PlanValidator.js';
import { ic, KC, iconFor, colorFor } from './icons.js';
import './planner.css';

/**
 * PlannerBookView: the Plan phase screen, ported from the Planner Book v2 (prototypes/plan-phase-book).
 * Same look: ribbon, two-page book, divider tabs (Week, Ledger, Market, Town, Journal), review, "Start the week".
 * Prototype Iteration (2 Nov 2026): the week has 3-hour slots (06:00 to 03:00). The side panel is the card stock:
 * category tiles first, then the cards of one category. Drag a card to a slot, or click an empty slot and then pick a card.
 * A placed card opens a popup beside it (settings, info, issues, Remove). Click a placed card to open it again.
 * Activities with the same planGroup (sun_drying, grinding = "processing") share one deck card; the popup picks one.
 * The ribbon is the Plan top bar
 * (gold, debt, next payment, weekly living cost, gold after the plan, energy).
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
    /** Deck entries: one per plannable activity, or one per planGroup (the popup picks the activity). */
    this.deck = [];
    for (const a of this.c.all('activities').filter((x) => x.plannable)) {
      const g = a.planGroup && this.deck.find((e) => e.key === a.planGroup);
      if (g) { g.activityIds.push(a.id); continue; }
      const G = a.planGroup ? GROUPS[a.planGroup] : null;
      this.deck.push({ key: a.planGroup ?? a.id, activityIds: [a.id], category: a.category, name: G?.n ?? a.name, a });
    }
    /** Default settings of each deck card (activity, length, location, recipe). */
    this.draft = {};
    for (const e of this.deck) this.draft[e.key] = this.#defaults(e.a);
    /** Deck side panel: 'cats' (category tiles) or 'cards' (one category). */
    this.deckView = { mode: 'cats', cat: null };
    /** Placed card shown in the popup beside it. @type {number|null} */
    this.popUid = null;
    /** Empty slot picked by a click: the next card picked goes there. @type {{d:number, start:number}|null} */
    this.target = null;
    this.SLOT = this.c.num('PLAN_SLOT_HOURS');
    this.DS = this.c.num('DAY_START_HOUR');
    this.DE = this.c.num('DAY_END_HOUR');
    this.NE = this.c.num('NIGHT_END_HOUR');
    this.SLEEP = this.c.num('SLEEP_EARLIEST_HOUR');

    root.insertAdjacentHTML('beforeend', `<div class="pb-fit" id="pbFit" hidden><div id="stage">
      <header id="ribbon">
        <div class="brand">BloomLunas <small>Planner</small></div>
        <div class="steps"><span class="step on">Plan</span><span class="step">Do</span><span class="step">Check</span></div>
        <div class="rs"><span class="k" id="rWeek">–</span><span class="v" style="font-family:var(--f-display)" id="rDays">–</span></div>
        <div class="sep"></div>
        <div class="stat gold"><span class="k">Gold</span><span class="v num" id="rGold">–</span></div>
        <div class="stat debt"><span class="k">Debt</span><span class="v num" id="rDebt">–</span></div>
        <div class="stat"><span class="k">Next payment</span><span class="v num" id="rPay">–</span><small id="rPayD"></small></div>
        <div class="stat"><span class="k">Weekly living cost</span><span class="v num" id="rLive">–</span><small>paid in Check</small></div>
        <div class="stat"><span class="k">Gold after plan</span><span class="v num" id="rEnd">–</span><small>end of week, forecast</small></div>
        <div class="stat"><span class="k">Energy</span><span class="ebar"><i id="rEn"></i></span><small class="num" id="rEnN"></small></div>
        <div class="spacer"></div>
        <div id="rIssues" style="display:flex;flex-direction:column;gap:4px;align-items:flex-end"></div>
        <button class="go" id="confirmBtn">Review plan</button>
      </header>
      <div id="bookWrap"><div id="book"><div class="spine"></div>
        <div class="spread" data-tab="week">
          <section class="page l"><div class="ph"><h2>This week · Mon – Thu</h2><span class="tag">3-hour slots · drag a card, or click a free slot</span></div><div class="wk l" id="wkL"></div><span class="folio" id="fL">left</span></section>
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
      this.popUid = null;
      if (phase === 'Plan') { this.tab = 'week'; this.target = null; this.deckView = { mode: 'cats', cat: null }; this.#fitScale(); this.render(); }
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
    const d = { activityId: a.id, durationMin: a.planDurationMin };
    if (a.locationIds.length > 1) d.locationId = a.locationIds[0];
    if (a.id === 'craft') d.recipeId = this.c.all('recipes')[0].id;
    return d;
  }

  #fitScale() {
    const sc = Math.min(innerWidth / 1600, innerHeight / 900);
    this.stage.style.transform = `scale(${sc})`;
  }

  #scale() { return this.stage.getBoundingClientRect().width / 1600; }
  /** Pixels per hour in the week columns (unscaled). */
  #hpx() {
    const col = this.stage.querySelector('.col');
    return col ? col.getBoundingClientRect().height / this.#scale() / (this.NE - this.DS) : 29;
  }
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
    this.$('#rEnd').textContent = `${R.endLo}–${R.endHi} G`;
    this.$('#rEnd').style.color = R.endLo < 0 ? '#f0947f' : 'var(--text)';
    const monthDays = cal.weeksPerMonth * 7, daysLeft = monthDays - (cal.week - 1) * 7 - cal.day;
    this.$('#rDebt').textContent = `${Math.round(this.s.debt.balance).toLocaleString('en')} G`;
    this.$('#rPay').textContent = `${this.c.num('DEBT_MIN_PAYMENT') + this.c.num('MONTHLY_UTILITIES')} G`;
    this.$('#rPayD').textContent = `Month end (day ${monthDays}) · in ${daysLeft} days`;
    this.$('#rLive').textContent = `${this.c.num('WEEKLY_EXPENSES')} G`;
    const max = this.c.num('ENERGY_MAX'), en = this.s.player.energy;
    this.$('#rEn').style.width = `${(en / max) * 100}%`;
    this.$('#rEnN').textContent = `${en}/${max}`;
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
    this.#renderPop(R);
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
      const b = this.$('#book');
      b.classList.remove('turn'); void b.offsetWidth; b.classList.add('turn');
    }
    this.render();
  }

  // ---- week (3-hour slots)
  #hoursCol() {
    let h = '<div class="hours">';
    for (const m of this.v.slots()) h += `<span class="num" style="top:calc(var(--hour) * ${m / 60 - this.DS})">${hm(m)}</span>`;
    return h + `<span class="num" style="top:calc(var(--hour) * ${this.NE - this.DS})">${hm(this.NE * 60)}</span></div>`;
  }

  #dayCol(d, R) {
    const cards = this.s.plan.cards.filter((c) => c.day === d).sort((a, b) => a.startMin - b.startMin);
    const late = d > 0 && R.dayEnd[d - 1] > this.DE * 60;
    const work = cards.filter((c) => c.activityId !== 'rest').reduce((n, c) => n + this.#dur(c), 0) / (this.SLOT * 60);
    const chips = this.#chips(d) + (late ? '<span class="chip late">Late wake?</span>' : '');
    let html = '';
    const busy = (m) => cards.some((c) => m >= c.startMin && m < c.startMin + this.#dur(c));
    for (const m of this.v.slots()) {
      if (busy(m)) continue;
      const on = this.target && this.target.d === d && this.target.start === m;
      html += `<button class="slotbtn${on ? ' on' : ''}" data-slot="${d}:${m}" style="top:calc(var(--hour) * ${m / 60 - this.DS} + 2px);height:calc(var(--hour) * ${this.SLOT} - 4px)" aria-label="${DAYS[d]} ${hm(m)}–${hm(m + this.SLOT * 60)}: pick a card">${on ? 'Pick a card →' : '+'}</button>`;
    }
    for (const c of cards) {
      const a = this.c.get('activities', c.activityId);
      const iss = R.issues[c.uid] ?? [], b = iss.find((i) => i.lvl === 'bad'), w = iss.find((i) => i.lvl === 'warn');
      const h = this.#dur(c) / 60, s = c.startMin / 60, e = s + h;
      const sel = this.popUid === c.uid;
      html += `<div class="bc${e > this.DE ? ' ot' : ''}${sel ? ' sel' : ''}" data-uid="${c.uid}" tabindex="0" style="--k:${colorFor(a)};top:calc(var(--hour) * ${s - this.DS} + 1px);height:calc(var(--hour) * ${h} - 2px)">
        <div class="t">${ic(iconFor(a))}${a.name}</div><div class="m num"><span>${hm(c.startMin)}–${hm(c.startMin + this.#dur(c))}</span></div><div class="m">${this.#sum(c)}</div>
        ${b ? '<span class="flag">✕</span>' : w ? '<span class="flag w">!</span>' : ''}</div>`;
    }
    const first = (this.s.calendar.week - 1) * 7 + 1;
    return `<div class="day"><div class="dh"><div class="dn"><b>${DAYS[d]}</b><span class="num">Day ${first + d}</span></div><div class="chips">${chips}</div><div class="capl num">${work} slot${work === 1 ? '' : 's'} of work</div></div>
      <div class="col" data-d="${d}"><span class="moonlbl n1">${ic('moon')}Night</span><span class="moonlbl n2">${ic('moon')}Midnight</span>${html}</div></div>`;
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
    this.$('#dayTag').textContent = `${hm(this.DS * 60)}–${hm(this.SLEEP * 60)} day · ${hm(this.SLEEP * 60)}–${hm(this.DE * 60)} night · ${hm(this.DE * 60)}–${hm(this.NE * 60)} midnight`;
    this.$('#fL').textContent = this.$('#fR').textContent = `Week ${this.s.calendar.week}`;
    this.$('#wkL').innerHTML = this.#hoursCol() + [0, 1, 2, 3].map((d) => this.#dayCol(d, R)).join('');
    this.$('#wkR').innerHTML = this.#hoursCol() + [4, 5, 6].map((d) => this.#dayCol(d, R)).join('') + `<div class="deck" id="deck">${this.#deckHtml()}</div>`;
  }

  /** Deck tile id of a category. */
  #catOf(category) { return CATS.find((k) => k.cats.includes(category))?.id ?? 'other'; }
  /** Deck entry of a placed card. */
  #entryOf(activityId) { return this.deck.find((e) => e.activityIds.includes(activityId)); }

  #deckHtml() {
    const v = this.deckView;
    const tgt = this.target ? `<div class="tgt">${ic('flag')}<span>Slot: <b>${DAYS[this.target.d]} ${hm(this.target.start)}–${hm(this.target.start + this.SLOT * 60)}</b></span><button class="lnk" data-untarget>Clear</button></div>` : '';
    if (v.mode === 'cards') {
      const cat = CATS.find((k) => k.id === v.cat);
      const list = this.deck.filter((e) => this.#catOf(e.category) === v.cat).map((e) => {
        const card = this.draft[e.key], a = e.a;
        const used = this.s.plan.cards.filter((p) => e.activityIds.includes(p.activityId)).length;
        const set = e.activityIds.length > 1 ? e.activityIds.map((id) => this.#name(id)).join(' or ') : a.id === 'craft' ? 'Pick a recipe' : a.locationIds.length > 1 ? 'Pick a place' : this.#loc(card);
        const icon = GROUPS[e.key]?.i ?? iconFor(a);
        return `<div class="dc" data-type="${e.key}" tabindex="0" style="--k:${colorFor(a)}">${used ? `<span class="used">×${used}</span>` : ''}
          <div class="t">${ic(icon)}${e.name}</div>
          <span class="m set">${set}</span>
          <span class="m num">${this.#dur(card) / (this.SLOT * 60)} slot${this.#dur(card) > this.SLOT * 60 ? 's' : ''} · ${this.#openTxt(card)}</span></div>`;
      }).join('');
      return `<button class="back" data-back>‹ All categories</button><h3 style="--k:${cat.c}">${ic(cat.i)}${cat.n}</h3>${tgt}
        <div class="hint">${this.target ? 'Click a card to put it in the slot.' : 'Drag a card onto a slot. Its settings open beside it.'}</div><div class="list">${list}</div>`;
    }
    const tiles = CATS.map((k) => {
      const es = this.deck.filter((e) => this.#catOf(e.category) === k.id);
      const used = this.s.plan.cards.filter((p) => this.#catOf(this.c.get('activities', p.activityId).category) === k.id).length;
      return es.length ? `<button class="cat" data-cat="${k.id}" style="--k:${k.c}">${ic(k.i)}<b>${k.n}</b><small>${es.map((e) => e.name).join(', ')}</small><span class="cnt">${es.length} card${es.length > 1 ? 's' : ''}${used ? ` · ${used} planned` : ''}</span></button>` : '';
    }).join('');
    return `<h3>Card deck</h3>${tgt}<div class="hint">${this.target ? 'Pick a category, then a card for the slot.' : 'Pick a category. Then drag a card onto a slot, or click a free slot first.'} Sleep, meals and small rests happen in Do.</div><div class="cats">${tiles}</div>`;
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
      { k: 'buy', n: 'Purchases', i: 'basket', why: 'Gold for Visit cards (buy at the Market or a guild). Real prices show only when you buy.', hint: b.buy > 0 ? ['ok', `✓ ${b.buy} G for purchases`] : ['', 'No gold for purchases'] },
      { k: 'buf', n: 'Buffer (savings)', i: 'lock', why: 'Carries to month-end: debt installment and utilities.', hint: ['', `Month-end bills: ${this.c.num('DEBT_MIN_PAYMENT') + this.c.num('MONTHLY_UTILITIES')} G`] }
    ];
    const seg = [['Weekly expenses', b.exp, '#c98a3c'], ['Purchases', b.buy, '#4f8fc4'], ['Buffer', b.buf, '#7a6fd6'], ['No job', Math.max(0, R.unassigned), '#b8a77e']];
    this.$('#ledR').innerHTML = `<div class="ph"><h2>Budget</h2><span class="tag">Step 1c · give every gold a job</span></div>
      <div class="big unas2"><div class="coin" aria-hidden="true"></div><div><div class="v num" style="color:${R.unassigned < 0 ? 'var(--coral-ink)' : R.unassigned > 0 ? 'var(--gold-ink)' : 'var(--jade-ink)'}">${R.unassigned} G</div><div style="font-size:12.5px;color:var(--ink-2)">Gold with no job · ${R.unassigned > 0 ? 'give it a job below' : R.unassigned < 0 ? 'you planned more gold than you have' : 'every gold has a job'}</div></div></div>
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
    const cell = (h) => (h ? (h[0] === 0 && h[1] === 24 ? 'All day' : `${h[0]}:00–${h[1]}:00`) : 'Closed');
    // Consecutive days with the same hours merge into one block.
    const blocks = (oh) => {
      const out = [];
      oh.forEach((h, d) => {
        const k = JSON.stringify(h), last = out.at(-1);
        if (last && last.k === k) last.n++; else out.push({ k, h, d, n: 1 });
      });
      return out.map((b) => {
        const days = b.n === 1 ? DAYS[b.d] : `${DAYS[b.d]}–${DAYS[b.d + b.n - 1]}`;
        return `<div class="hb ${b.h ? '' : 'cl'}" style="grid-column:${b.d + 1} / span ${b.n}" title="${days}: ${cell(b.h)}"><b class="num">${cell(b.h)}</b>${b.n > 1 && b.h ? `<small>${days}</small>` : ''}</div>`;
      }).join('');
    };
    this.$('#twR').innerHTML = `<div class="ph"><h2>Opening hours · week ${cal.week}</h2><span class="tag"><span class="var">locations/*.openHours</span></span></div>
      <div class="hgrid"><span></span><div class="hdays">${DAYS.map((d) => `<span>${d}</span>`).join('')}</div>
      ${locs.map((l) => `<span class="hn">${l.name}</span><div class="hrow">${blocks(l.openHours)}</div>`).join('')}</div>
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

  // ---------------------------------------------------------------- card popup, toast, review
  #closePop() { if (this.popUid != null) { this.popUid = null; this.$('#cardPop')?.remove(); this.stage.querySelector('.bc.sel')?.classList.remove('sel'); } }

  /** Open the popup beside a placed card. @param {number} uid */
  #openPop(uid) { this.popUid = uid; this.render(); }

  /** The popup beside the placed card: settings, info, issues, Remove. */
  #renderPop(R) {
    this.$('#cardPop')?.remove();
    const card = this.popUid != null && this.s.plan.cards.find((x) => x.uid === this.popUid);
    const el = card && this.tab === 'week' && this.stage.querySelector(`.bc[data-uid="${card.uid}"]`);
    if (!el) { this.popUid = null; return; }
    const a = this.c.get('activities', card.activityId), e = this.#entryOf(a.id);
    const iss = R.issues[card.uid] ?? [];
    const slots = (m) => `${m / (this.SLOT * 60)} slot${m > this.SLOT * 60 ? 's' : ''}`;
    const sets = [];
    if (e.activityIds.length > 1) sets.push({ key: 'activityId', label: GROUPS[e.key]?.ask ?? 'Kind', opt: e.activityIds.map((id) => [id, this.#name(id)]) });
    if (a.locationIds.length > 1) sets.push({ key: 'locationId', label: a.category === 'organization' ? 'Organization' : 'Where', opt: a.locationIds.map((id) => [id, this.c.get('locations', id).name.replace(/ guild$/i, '')]) });
    if (a.id === 'craft') sets.push({ key: 'recipeId', label: 'Recipe', opt: this.c.all('recipes').map((r) => [r.id, `${r.name} (${slots(Math.ceil(r.timeMin / (this.SLOT * 60)) * this.SLOT * 60)})`]) });
    else if (a.planDurationOptions?.length > 1) sets.push({ key: 'durationMin', label: 'Length', opt: a.planDurationOptions.map((m) => [m, slots(m)]) });
    const cur = (k) => (k === 'locationId' ? this.v.location(card) : card[k]);
    const settings = sets.length ? `<div class="sets">${sets.map((x) => `<div class="setrow"><span>${x.label}</span><div class="seg" role="radiogroup" aria-label="${x.label}">${x.opt.map(([val, l]) => `<button role="radio" aria-checked="${String(cur(x.key)) === String(val)}" data-set="${x.key}" data-val="${val}">${l}</button>`).join('')}</div></div>`).join('')}</div>` : '';
    const actions = a.actionIds.filter((x) => x !== 'travel').map((x) => this.c.get('actions', x).name).join(', ');
    const pop = document.createElement('div');
    pop.className = 'pop';
    pop.id = 'cardPop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', `${a.name} settings`);
    pop.innerHTML = `<button class="x" data-popx aria-label="Close">×</button>
      <div class="kind">${e.activityIds.length > 1 ? e.name : 'Planned card'} · ${DAYS[card.day]} ${hm(card.startMin)}–${hm(card.startMin + this.#dur(card))}</div>
      <h3 style="--k:${colorFor(a)}">${ic(iconFor(a))}${a.name}</h3>
      <div class="sub">Actions: ${actions}.</div>${settings}
      <table><tr><td>Location</td><td>${this.#loc(card)}</td></tr><tr><td>Length</td><td class="num">${this.#dur(card) / 60} h</td></tr>
      <tr><td>Open</td><td>${this.#openTxt(card)}</td></tr>
      <tr><td>Importance</td><td><span class="pips">${'●'.repeat(a.importance)}${'○'.repeat(3 - a.importance)}</span>${a.canMiss ? '' : ' · must not miss'}</td></tr>
      ${a.skillPath ? `<tr><td>Skill path</td><td>${a.skillPath}</td></tr>` : ''}</table>
      ${iss.map((i) => `<div class="issue ${i.lvl === 'warn' ? 'w' : ''}">${i.lvl === 'bad' ? '✕' : '!'} ${i.msg}</div>`).join('')}
      <div class="pacts"><button class="rm" id="rmBtn">Remove</button><button class="go" data-popx>Done</button></div>`;
    this.stage.appendChild(pop);
    // Beside the card: right of it if there is room, else left.
    const sc = this.#scale(), sr = this.stage.getBoundingClientRect(), r = el.getBoundingClientRect();
    const L = (r.left - sr.left) / sc, R2 = (r.right - sr.left) / sc, T = (r.top - sr.top) / sc;
    const w = pop.offsetWidth, h = pop.offsetHeight;
    const left = R2 + 10 + w <= 1590 ? R2 + 10 : L - 10 - w;
    pop.style.left = `${Math.max(10, left)}px`;
    pop.style.top = `${Math.min(900 - h - 10, Math.max(10, T - 6))}px`;
    pop.classList.add(left === R2 + 10 ? 'right' : 'left');
  }

  /** A setting changed in the popup. */
  #setPop(key, raw) {
    const card = this.s.plan.cards.find((x) => x.uid === this.popUid);
    if (!card) return;
    let ch = { [key]: key === 'durationMin' ? Number(raw) : raw };
    if (key === 'activityId') { const a = this.c.get('activities', raw); ch = { activityId: raw, durationMin: a.planDurationMin, locationId: undefined, recipeId: raw === 'craft' ? card.recipeId : undefined }; }
    const next = { ...card, ...ch };
    if (this.mode === 'do' && card.day <= this.s.calendar.day) { this.#toast('This day has started.', 'bad'); return; }
    const why = this.v.dayProblem(next, card.day);
    if (why) { this.#toast(`${why}. Move the card first.`, 'bad'); return; }
    const chk = this.v.slotCheck(next, card.day, card.startMin);
    if (chk.lvl === 'bad') { this.#toast(`${chk.msg}. The new setting does not fit here.`, 'bad'); return; }
    this.bus.emit(MSG.INTENT_MOVE_CARD, { uid: card.uid, ...ch });
    this.render();
  }

  /** Put a deck card into the picked slot, then open its popup. @param {any} card */
  #placeAtTarget(card) {
    const { d, start } = this.target;
    const why = this.#dayProblem(card, d), chk = this.v.slotCheck(card, d, start);
    if (why || chk.lvl === 'bad') { this.#toast(`${why ?? chk.msg}. Pick another card or slot.`, 'bad'); return; }
    this.bus.emit(MSG.INTENT_PLACE_CARD, { ...card, day: d, startMin: start });
    const placed = this.s.plan.cards.at(-1);
    this.target = null;
    this.#openPop(placed.uid);
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
      : { ...this.draft[src.dataset.type] });

    st.addEventListener('pointerdown', (e) => {
      const src = e.target.closest('.dc,.bc');
      if (!src || e.button > 0 || e.target.closest('.pop')) return;
      const isB = src.classList.contains('bc');
      if (isB && this.mode === 'do' && Number(src.closest('.col').dataset.d) <= this.s.calendar.day) { this.#toast('This day has started. You cannot move this card.', 'bad'); return; }
      const grab = isB ? (e.clientY - src.getBoundingClientRect().top) / this.#scale() / this.#hpx() : this.SLOT / 2;
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
      const k = Math.round(raw / this.SLOT);
      return Math.min(this.NE - durH, Math.max(this.DS, this.DS + k * this.SLOT)) * 60;
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
        this.target = null;
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
      if (!d0.moving) {
        if (d0.uid) this.#openPop(d0.uid);
        else if (this.target) this.#placeAtTarget(d0.c);
        else this.#toast('Drag the card onto a slot, or click a free slot first.');
        return;
      }
      d0.ghost.remove();
      d0.src.classList.remove('dragging');
      const el = document.elementFromPoint(e.clientX, e.clientY);
      clearCols();
      if (d0.uid && el?.closest('#deck')) { this.bus.emit(MSG.INTENT_REMOVE_CARD, { uid: d0.uid }); if (this.popUid === d0.uid) this.popUid = null; this.#toast('Card removed from the plan.'); this.render(); return; }
      if (!d0.target) { if (el?.closest('.col')) this.#toast(this.#dayProblem(d0.c, Number(el.closest('.col').dataset.d)) ?? 'You cannot drop it here.', 'bad'); this.render(); return; }
      const { d, start, chk } = d0.target;
      if (chk.lvl === 'bad') { this.#toast(`${chk.msg}. Drop it in a free slot.`, 'bad'); this.render(); return; }
      if (d0.uid) this.bus.emit(MSG.INTENT_MOVE_CARD, { uid: d0.uid, day: d, startMin: start });
      else this.bus.emit(MSG.INTENT_PLACE_CARD, { ...d0.c, day: d, startMin: start });
      const placed = d0.uid ? this.s.plan.cards.find((x) => x.uid === d0.uid) : this.s.plan.cards.at(-1);
      this.popUid = placed.uid;
      this.render();
    });

    st.addEventListener('pointercancel', () => {
      if (drag?.ghost) { drag.ghost.remove(); drag.src.classList.remove('dragging'); clearCols(); }
      drag = null;
    });

    st.addEventListener('click', (e) => {
      const pop = e.target.closest('#cardPop');
      if (pop) {
        const set = e.target.closest('[data-set]');
        if (set) { this.#setPop(set.dataset.set, set.dataset.val); return; }
        if (e.target.closest('[data-popx]')) { this.#closePop(); return; }
        if (e.target.closest('#rmBtn')) {
          this.bus.emit(MSG.INTENT_REMOVE_CARD, { uid: this.popUid });
          this.popUid = null;
          this.#toast('Card removed. It is back in the deck.');
          this.render();
        }
        return;
      }
      if (this.popUid != null && !e.target.closest('.bc,.dc')) this.#closePop();
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
      const sl = e.target.closest('[data-slot]');
      if (sl) {
        const [d, m] = sl.dataset.slot.split(':').map(Number);
        if (this.mode === 'do' && d <= this.s.calendar.day) { this.#toast('This day has started.', 'bad'); return; }
        this.target = this.target && this.target.d === d && this.target.start === m ? null : { d, start: m };
        this.render();
        return;
      }
      if (e.target.closest('[data-untarget]')) { this.target = null; this.render(); return; }
      const cat = e.target.closest('[data-cat]');
      if (cat) { this.deckView = { mode: 'cards', cat: cat.dataset.cat }; this.render(); return; }
      if (e.target.closest('[data-back]')) { this.deckView = { mode: 'cats', cat: null }; this.render(); return; }
      const mk = e.target.closest('[data-mk]');
      if (mk) { this.mkSel = mk.dataset.mk; this.render(); return; }
      if (e.target.closest('#confirmBtn')) { if (this.mode === 'do') { this.fit.hidden = true; this.#closePop(); } else this.#openReview(); return; }
    });

    document.addEventListener('keydown', (e) => {
      if (this.fit.hidden) return;
      if (e.key === 'Escape') { this.#closeModal(); this.#closePop(); if (this.target) { this.target = null; this.render(); } return; }
      if (this.scrim || e.target.matches?.('input,textarea')) return;
      const i = Number(e.key);
      if (i >= 1 && i <= 5) { this.#go(TABS[i - 1].id); return; }
      const fc = e.target.closest?.('.bc');
      if (fc && /^Arrow/.test(e.key)) {
        e.preventDefault();
        const p = this.s.plan.cards.find((x) => x.uid === Number(fc.dataset.uid));
        const dd = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0, dm = (e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0) * this.SLOT * 60;
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
        if (c?.classList.contains('bc')) this.#openPop(Number(c.dataset.uid));
        else if (c && this.target) this.#placeAtTarget(cardOf(c));
      }
    });
  }
}

/** Deck categories (activity.category -> tile). */
const CATS = [
  { id: 'production', n: 'Production', cats: ['production'], i: 'bowl', c: '#c98a3c' },
  { id: 'shop', n: 'Shop', cats: ['shop'], i: 'coin', c: '#e9b44c' },
  { id: 'fieldwork', n: 'Fieldwork', cats: ['fieldwork'], i: 'leaf', c: '#5cc29b' },
  { id: 'organization', n: 'Guild / Organization', cats: ['organization'], i: 'scroll', c: '#b7adff' }
];

/** Deck cards that hold several activities (activity.planGroup). The popup picks one. */
const GROUPS = { processing: { n: 'Processing', ask: 'Process', i: 'mill' } };

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
