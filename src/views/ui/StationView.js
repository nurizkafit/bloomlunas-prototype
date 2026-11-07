import { MSG } from '../../core/EventBus.js';
import { ic } from './icons.js';
import './screens.css';

/**
 * StationView: the 2D interface of one station (Scene & Flow, 7 Nov 2026). It opens over the 3D scene.
 * Screens (location -> screen):
 * - Store (loc_home_shop): Shelf stocking (price and quantity), Open store (serve customers, shop result).
 * - Crafting (loc_home_atelier): Prepare (pick materials), Methods (Brew, Concoct, Blend), Packing (container, label).
 *   The atelier also has the Processing screen (Grind).
 * - Processing (loc_home_drying_yard, atelier): Start batch, Collect batch (yard), Grind (atelier).
 *   The screen differs per station: it lists only the actions of this station (actions/*.locationIds).
 * - Rest (loc_home, the bed): Short break, Eat, Sleep.
 * Each button starts the activity and walks to the station when needed, then runs the action.
 * Reads GameState; sends intents only. Unity: one UI panel per station.
 */
export class StationView {
  /** @param {HTMLElement} root @param {import('../../core/GameManager.js').GameManager} gm */
  constructor(root, gm) {
    this.gm = gm; this.c = gm.content; this.s = gm.state;
    this.el = document.createElement('div');
    this.el.className = 'station';
    this.el.hidden = true;
    root.appendChild(this.el);
    /** Last shop result (Open store). */
    this.result = null;
    this.recipe = null;
    this.el.addEventListener('click', (e) => this.#click(e));
    this.el.addEventListener('change', (e) => this.#change(e));
    const rerender = () => { if (!this.el.hidden) this.render(); };
    for (const m of [MSG.ACTION_COMPLETED, MSG.ACTION_REFUSED, MSG.INVENTORY_CHANGED, MSG.CLOCK_CHANGED]) gm.bus.on(m, rerender);
    gm.bus.on(MSG.ACTION_COMPLETED, (r) => {
      if (r.actionId === 'serve-customer') {
        const day = this.s.calendar.day;
        if (!this.today || this.today.day !== day) this.today = { day, customers: 0, sold: 0, gold: 0 };
        this.today.customers += r.customers; this.today.sold += r.sold; this.today.gold += r.gold;
        this.result = r;
        rerender();
      }
      if (r.actionId === 'sleep') this.close();
    });
    gm.bus.on(MSG.ACTION_REFUSED, (r) => { this.refused = r.reason; });
    gm.bus.on(MSG.PHASE_ENTERED, () => this.close());
  }

  /** True if this location has a station screen. @param {string} locId */
  has(locId) { return !!SCREENS[locId]; }

  /** @param {string} locId @param {string} [fn] function tab to open */
  open(locId, fn) {
    const sc = SCREENS[locId];
    if (!sc) return false;
    this.locId = locId;
    this.fn = fn && sc.tabs.some((t) => t.id === fn) ? fn : sc.tabs[0].id;
    this.refused = null;
    this.el.hidden = false;
    this.render();
    return true;
  }

  close() { this.el.hidden = true; this.locId = null; }

  /** Start the activity and walk to the station if needed, then run the action. */
  #run(activityId, actionId, params = {}) {
    const bus = this.gm.bus, p = this.s.player;
    this.refused = null;
    if (p.activityId !== activityId) bus.emit(MSG.INTENT_START_ACTIVITY, { activityId });
    if (p.location !== this.locId) bus.emit(MSG.INTENT_RUN_ACTION, { actionId: 'travel', params: { to: this.locId } });
    if (this.s.player.location !== this.locId) return;
    bus.emit(MSG.INTENT_RUN_ACTION, { actionId, params });
  }

  #act(id) { return this.c.get('actions', id); }
  #cost(a) {
    const e = a.energyKey ? this.c.num(a.energyKey) : 0;
    const t = a.timeKey ? this.c.num(a.timeKey) : a.timeMin;
    const tt = a.kind === 'grind' ? `${t} min per unit` : a.kind === 'craft' ? 'recipe time' : t ? `${t} min` : '';
    return [tt, e ? `${e} energy` : ''].filter(Boolean).join(' · ');
  }

  render() {
    const sc = SCREENS[this.locId], p = this.s.player, loc = this.c.get('locations', this.locId);
    const here = p.location === this.locId;
    const walk = here ? 0 : this.gm.ctx.sys.actions.walkMinutes(p.location, this.locId);
    const h = loc.openHours?.[this.s.calendar.day];
    const open = !h ? 'Closed today' : h[0] === 0 && h[1] >= 24 ? 'Open all day' : `Open ${h[0]}:00–${h[1]}:00`;
    const tabs = sc.tabs.map((t) => `<button class="fn${t.id === this.fn ? ' on' : ''}" data-fn="${t.id}">${ic(t.i)}<span><b>${t.n}</b><small>${t.sub}</small></span></button>`).join('');
    const other = sc.links?.map((l) => `<button class="lnk2" data-goto="${l.loc}" data-gofn="${l.fn ?? ''}">${ic(l.i)}${l.n}</button>`).join('') ?? '';
    this.el.innerHTML = `<div class="st-panel" role="dialog" aria-label="${sc.name}">
      <aside class="st-side">
        <div class="st-kind">Station</div>
        <h2>${sc.name}</h2>
        <p class="st-sub">${loc.name} · ${open}${here ? '' : ` · walk ${walk} min`}</p>
        <nav class="st-fns">${tabs}</nav>
        ${other ? `<div class="st-links">${other}</div>` : ''}
        <button class="st-close" data-close>Close</button>
      </aside>
      <section class="st-main">${this.#body()}
        ${this.refused ? `<p class="st-bad">✕ Cannot do it: ${esc(this.refused)}.</p>` : ''}
      </section>
    </div>`;
  }

  #body() {
    switch (this.fn) {
      case 'shelf': return this.#shelf();
      case 'store': return this.#store();
      case 'prepare': return this.#prepare();
      case 'methods': return this.#methods();
      case 'packing': return this.#packing();
      case 'processing': return this.#processing();
      case 'rest': return this.#rest();
      default: return '';
    }
  }

  // ---- Store
  #products() {
    const lots = this.s.inventory.find((l) => l.variant === 'product' && !l.spoiled && l.tier !== 'Failed');
    return [...new Set(lots.map((l) => l.item))].map((id) => ({ id, it: this.c.get('items', id), lots: lots.filter((l) => l.item === id), n: lots.filter((l) => l.item === id).reduce((a, l) => a + l.qty, 0) }));
  }

  #shelf() {
    const eco = this.gm.ctx.sys.economy, opts = this.c.num('SHELF_PRICE_OPTIONS');
    this.draft = this.draft ?? {};
    const rows = this.#products().map(({ id, it, n }) => {
      const cur = this.s.shelf?.[id];
      const d = this.draft[id] ?? { qty: cur?.qty || n, ratio: cur?.ratio ?? 1 };
      d.qty = Math.min(d.qty, n);
      this.draft[id] = d;
      const f = it.forecast;
      return `<div class="row-card" data-item="${id}">
        <div class="rc-h"><b>${it.name}</b><span class="dim">have ${n} · on shelf ${cur?.qty ?? 0}${cur ? ` at ×${cur.ratio}` : ''}</span></div>
        <div class="rc-g">
          <label>Quantity <input type="number" name="qty" min="0" max="${n}" value="${d.qty}"></label>
          <div class="seg2" role="radiogroup" aria-label="Price">${opts.map((r) => `<button role="radio" aria-checked="${d.ratio === r}" data-ratio="${r}">×${r}</button>`).join('')}</div>
          <span class="num">~${(f.lo * d.ratio).toFixed(0)}–${(f.hi * d.ratio).toFixed(0)} G each</span>
          <span class="num dim">buy chance ${Math.round(eco.buyChance(d.ratio) * 100)}%</span>
          <button class="go sm" data-stock="${id}">Put on shelf</button>
        </div></div>`;
    }).join('');
    return `<h3>Shelf stocking</h3>
      <p class="lead2">Define the price and the quantity for each product. Customers buy only what is on the shelf. A higher price earns more per sale, but fewer customers buy. <span class="tagp">Proposal</span></p>
      ${rows || '<p class="hint">You have no products. Craft some at the cauldron first.</p>'}
      <p class="hint">${this.#cost(this.#act('restock-shelf'))} per product.</p>`;
  }

  #store() {
    const shelf = Object.entries(this.s.shelf ?? {}).filter(([, v]) => v.qty > 0);
    const r = this.result, t = this.today && this.today.day === this.s.calendar.day ? this.today : null;
    return `<h3>Open store</h3>
      <p class="lead2">Serve the customers who come in. Each hour, some customers buy from the shelf.</p>
      <div class="shelfbox">${shelf.length ? shelf.map(([id, v]) => `<span class="chip2">${this.c.get('items', id).name} <b class="num">${v.qty}</b> <small>×${v.ratio}</small></span>`).join('') : '<span class="dim">The shelf is empty. Use Shelf stocking first.</span>'}</div>
      <button class="go" data-run="open_shop|serve-customer" ${shelf.length ? '' : 'disabled'}>${ic('coin')}Serve customers · ${this.#cost(this.#act('serve-customer'))}</button>
      ${r ? `<div class="result"><div class="st-kind">Last hour</div><div class="kv3"><span>Customers</span><b class="num">${r.customers}</b><span>Bought</span><b class="num">${r.sold}</b><span>Income</span><b class="num gold-ink">+${r.gold} G</b></div></div>` : ''}
      ${t ? `<div class="result"><div class="st-kind">Shop result today</div><div class="kv3"><span>Customers</span><b class="num">${t.customers}</b><span>Sold</span><b class="num">${t.sold}</b><span>Income</span><b class="num gold-ink">+${t.gold.toFixed(2)} G</b></div></div>` : ''}`;
  }

  // ---- Crafting
  #recipes() { return this.c.all('recipes'); }

  #prepare() {
    const prod = this.gm.ctx.sys.production;
    const recs = this.#recipes();
    this.recipe = this.recipe ?? (recs.find((r) => !prod.missing(r)) ?? recs[0]).id;
    const r = this.c.get('recipes', this.recipe), mid = (f) => (f.lo + f.hi) / 2;
    const rows = Object.entries(r.slots).filter(([, list]) => list.length).map(([slot, list]) => list.map((s) => {
      const it = this.c.get('items', s.item), have = this.s.inventory.count(s.item, s.variant);
      const v = it.variants.find((x) => x.id === s.variant);
      return `<tr><td class="dim">${slot}</td><td>${it.name} <small class="dim">${s.variant}</small></td><td class="num">${s.qty}</td><td class="num ${have >= s.qty ? 'ok' : 'bad'}">${have}</td><td class="num">~${(mid(it.forecast) * (v?.priceMult ?? 1) * s.qty).toFixed(1)} G</td></tr>`;
    }).join('')).join('');
    const miss = prod.missing(r);
    return `<h3>Prepare · pick materials</h3>
      <div class="rlist">${recs.map((x) => `<button data-recipe="${x.id}" aria-pressed="${x.id === this.recipe}">${x.name}${prod.missing(x) ? '' : ' ✓'}<small>${this.#act(x.action).name}</small></button>`).join('')}</div>
      <table class="t3"><tr><th>Slot</th><th>Material</th><th>Need</th><th>Have</th><th>Cost (forecast)</th></tr>${rows}</table>
      ${miss ? `<p class="st-bad">✕ ${miss}</p>` : '<p class="ok">✓ You have all materials.</p>'}
      <button class="go" data-run="craft|prepare">${ic('bowl')}Prepare · ${this.#cost(this.#act('prepare'))}</button>
      <button class="lnk2" data-fn="methods">Next: Methods ›</button>`;
  }

  #methods() {
    const prod = this.gm.ctx.sys.production, q = this.gm.ctx.sys.quality;
    const recs = this.#recipes();
    this.recipe = this.recipe ?? recs[0].id;
    const r = this.c.get('recipes', this.recipe), product = this.c.get('items', r.product);
    const pv = prod.preview(r), mult = q.priceMult(pv.tier), miss = prod.missing(r);
    const methods = [['brew', 'Brew', 'Cooking'], ['concoct', 'Concoct', 'Alchemy'], ['blend', 'Blend', 'Crafting']];
    return `<h3>Methods · ${r.name}</h3>
      <p class="lead2">The recipe sets the method. Pick another recipe in Prepare.</p>
      <div class="methods">${methods.map(([id, n, sk]) => {
        const has = this.c.tables.get('actions')?.has(id);
        const on = r.action === id;
        return `<div class="mcard${on ? ' on' : ''}${has ? '' : ' locked'}"><b>${n}</b><small>${sk}</small><span class="dim">${has ? (on ? 'This recipe' : 'Other recipes') : 'No recipe in this build'}</span></div>`;
      }).join('')}</div>
      <div class="kv3"><span>Makes</span><b>${r.output} ${product.name} · ${r.timeMin / 60} h</b>
        <span>Expected quality</span><b>${pv.tier} <small class="dim">(skill level ${pv.level})</small></b>
        <span>Expected value</span><b class="num">${(product.forecast.lo * mult * r.output).toFixed(0)}–${(product.forecast.hi * mult * r.output).toFixed(0)} G</b></div>
      ${miss ? `<p class="st-bad">✕ ${miss}</p>` : ''}
      <button class="go" data-run="craft|${r.action}" data-params='${JSON.stringify({ recipeId: r.id })}' ${miss ? 'disabled' : ''}>${ic('bowl')}${this.#act(r.action).name} ${r.name}</button>
      <button class="lnk2" data-fn="packing">Next: Packing ›</button>`;
  }

  #packing() {
    const boxes = this.c.num('PACK_CONTAINERS'), lab = this.c.num('PACK_LABEL');
    this.pk = this.pk ?? { container: Object.keys(boxes)[1] ?? Object.keys(boxes)[0], label: true };
    const lots = this.s.inventory.find((l) => l.variant === 'product' && !l.spoiled && l.tier !== 'Failed' && !l.pack);
    const groups = [...new Map(lots.map((l) => [`${l.item}|${l.tier}`, l])).values()];
    const unit = boxes[this.pk.container].cost + (this.pk.label ? lab.cost : 0);
    const mult = boxes[this.pk.container].priceMult * (this.pk.label ? lab.priceMult : 1);
    const packed = this.s.inventory.find((l) => l.variant === 'product' && l.pack);
    return `<h3>Packing · finishing</h3>
      <p class="lead2">Put products in a container and add a label. Packed products sell for more. The containers cost gold. <span class="tagp">Proposal</span></p>
      <div class="setrow2"><span>Container</span><div class="seg2" role="radiogroup" aria-label="Container">${Object.entries(boxes).map(([id, b]) => `<button role="radio" aria-checked="${this.pk.container === id}" data-container="${id}">${b.name} <small>${b.cost} G · ×${b.priceMult}</small></button>`).join('')}</div></div>
      <div class="setrow2"><span>Label</span><label class="chk"><input type="checkbox" name="label" ${this.pk.label ? 'checked' : ''}> Add a label <small>${lab.cost} G · ×${lab.priceMult}</small></label></div>
      <p class="num">Per unit: ${unit} G · price ×${mult.toFixed(2)}</p>
      ${groups.length ? groups.map((l) => { const n = lots.filter((x) => x.item === l.item && x.tier === l.tier).reduce((a, x) => a + x.qty, 0); return `<div class="row-card"><div class="rc-h"><b>${this.c.get('items', l.item).name}</b><span class="dim">${l.tier} · ${n} not packed</span></div><div class="rc-g"><span class="num">Cost ${(unit * n).toFixed(2)} G</span><button class="go sm" data-pack="${l.item}|${l.tier}">Pack ${n}</button></div></div>`; }).join('') : '<p class="hint">No unpacked products.</p>'}
      ${packed.length ? `<p class="hint">Packed: ${packed.map((l) => `${l.qty} ${this.c.get('items', l.item).name} (${l.pack.replace('+', ' + ')})`).join(', ')}.</p>` : ''}
      <p class="hint">${this.#cost(this.#act('package'))} per pack.</p>`;
  }

  // ---- Processing
  #processing() {
    const inv = this.s.inventory, here = (id) => (this.#act(id).locationIds ?? [this.locId]).includes(this.locId);
    const parts = [];
    if (here('start-batch')) {
      const items = this.c.all('items').filter((i) => i.variants?.some((v) => v.id === 'dried') && inv.count(i.id, 'fresh') > 0);
      parts.push(`<div class="row-card"><div class="rc-h"><b>Start batch</b><span class="dim">${this.#cost(this.#act('start-batch'))} · dries in ${this.c.num('SUN_DRYING_DAYS')} days, needs sun</span></div>
        ${items.length ? `<div class="rc-g"><select name="item">${items.map((i) => `<option value="${i.id}">${i.name} (fresh ${inv.count(i.id, 'fresh')})</option>`).join('')}</select><input type="number" name="qty" min="1" max="${this.c.num('SUN_DRYING_RACK_CAPACITY')}" value="2"><button class="go sm" data-runf="processing|start-batch">Start</button></div>` : '<p class="hint">No fresh material that can dry.</p>'}</div>`);
      const b = this.s.batches.map((x) => `${x.qty} ${this.c.get('items', x.item).name}, ready day ${x.readyDay - (this.s.calendar.absDay() - this.s.calendar.day) + 1 + (this.s.calendar.week - 1) * 7}`).join('; ');
      parts.push(`<div class="row-card"><div class="rc-h"><b>Collect batch</b><span class="dim">${this.#cost(this.#act('collect-batch'))}</span></div><p class="hint">${b || 'No batch on the rack.'}</p><div class="rc-g"><button class="go sm" data-run="processing|collect-batch">Collect</button></div></div>`);
    }
    if (here('grind')) {
      const items = this.c.all('items').filter((i) => inv.count(i.id, 'dried') > 0);
      parts.push(`<div class="row-card"><div class="rc-h"><b>Grind</b><span class="dim">${this.#cost(this.#act('grind'))}</span></div>
        ${items.length ? `<div class="rc-g"><select name="item">${items.map((i) => `<option value="${i.id}">${i.name} (dried ${inv.count(i.id, 'dried')})</option>`).join('')}</select><input type="number" name="qty" min="1" max="20" value="1"><button class="go sm" data-runf="processing|grind">Grind</button></div>` : '<p class="hint">No dried material to grind.</p>'}</div>`);
    }
    return `<h3>Processing</h3><p class="lead2">Make materials better or longer-lasting. This station: ${this.c.get('locations', this.locId).name}.</p>${parts.join('')}`;
  }

  // ---- Rest
  #rest() {
    const p = this.s.player, max = this.c.num('ENERGY_MAX'), a = this.gm.ctx.sys.actions;
    const meal = a.mealNow(), eaten = (p.meals ?? []).includes(meal);
    const sleepOk = this.s.calendar.minute >= this.c.num('SLEEP_EARLIEST_HOUR') * 60;
    return `<h3>Rest</h3>
      <p class="lead2">Energy <b class="num">${p.energy}/${max}</b>. Food is paid by the weekly living cost.</p>
      <div class="row-card"><div class="rc-h"><b>Short break</b><span class="dim">${this.#cost(this.#act('small-rest'))} · +${this.c.num('SMALL_REST_ENERGY')} energy</span></div><div class="rc-g"><button class="go sm" data-run="rest|small-rest">Take a break</button></div></div>
      <div class="row-card"><div class="rc-h"><b>Eat</b><span class="dim">${this.#cost(this.#act('eat'))} · +${this.c.num('MEAL_ENERGY')} energy · breakfast, lunch, dinner at set times</span></div><div class="rc-g"><button class="go sm" data-run="rest|eat" ${!meal || eaten ? 'disabled' : ''}>${meal ? (eaten ? `${meal} eaten` : `Eat ${meal}`) : 'No meal now'}</button></div></div>
      <div class="row-card"><div class="rc-h"><b>Sleep</b><span class="dim">Ends the day · from ${this.c.num('SLEEP_EARLIEST_HOUR')}:00</span></div><div class="rc-g"><button class="go sm" data-run="rest|sleep" ${sleepOk ? '' : 'disabled'}>Sleep</button></div></div>`;
  }

  // ---- input
  #click(e) {
    const t = e.target;
    if (t.closest('[data-close]')) { this.close(); return; }
    const fn = t.closest('[data-fn]');
    if (fn) { this.fn = fn.dataset.fn; this.refused = null; this.render(); return; }
    const go = t.closest('[data-goto]');
    if (go) { this.open(go.dataset.goto, go.dataset.gofn || undefined); return; }
    const rc = t.closest('[data-recipe]');
    if (rc) { this.recipe = rc.dataset.recipe; this.render(); return; }
    const rt = t.closest('[data-ratio]');
    if (rt) { const id = rt.closest('[data-item]').dataset.item; this.draft[id] = { ...this.draft[id], ratio: Number(rt.dataset.ratio) }; this.render(); return; }
    const st = t.closest('[data-stock]');
    if (st) { const d = this.draft[st.dataset.stock]; this.#run('open_shop', 'restock-shelf', { item: st.dataset.stock, qty: d.qty, ratio: d.ratio }); return; }
    const ct = t.closest('[data-container]');
    if (ct) { this.pk.container = ct.dataset.container; this.render(); return; }
    const pk = t.closest('[data-pack]');
    if (pk) { const [item, tier] = pk.dataset.pack.split('|'); this.#run('craft', 'package', { item, tier, container: this.pk.container, label: this.pk.label }); return; }
    const run = t.closest('[data-run]');
    if (run) { const [act, id] = run.dataset.run.split('|'); this.#run(act, id, run.dataset.params ? JSON.parse(run.dataset.params) : {}); return; }
    const rf = t.closest('[data-runf]');
    if (rf) {
      const [act, id] = rf.dataset.runf.split('|'), box = rf.closest('.rc-g');
      this.#run(act, id, { item: box.querySelector('[name="item"]').value, qty: Number(box.querySelector('[name="qty"]').value) });
    }
  }

  #change(e) {
    const t = e.target;
    if (t.name === 'qty' && t.closest('[data-item]')) { const id = t.closest('[data-item]').dataset.item; this.draft[id] = { ...this.draft[id], qty: Number(t.value) }; }
    if (t.name === 'label') { this.pk.label = t.checked; this.render(); }
  }
}

/** Station screens by location (Scene & Flow: Store, Crafting, Processing, Rest). */
const SCREENS = {
  loc_home_shop: { name: 'Store', tabs: [
    { id: 'shelf', n: 'Shelf stocking', sub: 'Price and quantity', i: 'crate' },
    { id: 'store', n: 'Open store', sub: 'Serve customers', i: 'coin' }] },
  loc_home_atelier: { name: 'Crafting', tabs: [
    { id: 'prepare', n: 'Prepare', sub: 'Pick materials', i: 'basket' },
    { id: 'methods', n: 'Methods', sub: 'Brew, Concoct, Blend', i: 'bowl' },
    { id: 'packing', n: 'Packing', sub: 'Container, label', i: 'crate' },
    { id: 'processing', n: 'Processing', sub: 'Grind', i: 'mill' }] },
  loc_home_drying_yard: { name: 'Processing', tabs: [
    { id: 'processing', n: 'Sun drying', sub: 'Start and collect batch', i: 'sun' }] },
  loc_home: { name: 'Rest', tabs: [
    { id: 'rest', n: 'Rest', sub: 'Short break, eat, sleep', i: 'moon' }] }
};

/** @param {string} s */
function esc(s) { return String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]); }
