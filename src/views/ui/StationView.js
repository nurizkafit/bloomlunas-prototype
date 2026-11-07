import { MSG } from '../../core/EventBus.js';
import { ic, itemIcon } from './icons.js';
import './screens.css';

/**
 * StationView: the 2D interface of one station (Scene & Flow, 7 Nov 2026). It opens over the 3D scene.
 * Screens (location -> screen):
 * - Store (loc_home_shop): Shelf stock (3x3 slots: product, quantity, price), Shop management (estimate, Open shop).
 *   Open shop (user decision 7 Nov 2026): one energy cost, then a fast replay serves customers hour by hour
 *   until the shelf is sold out or the store closes (Stop button), then the Shop result.
 * - Crafting (loc_home_atelier): one menu: recipe (sets the method), a material lot per slot, quantity (batches), packing.
 * - Drying rack (loc_home_drying_rack) and Grinding table (loc_home_grinder): the two Processing stations.
 * - Rest (loc_home, the bed): Short break, Eat, Sleep.
 * Object icons are placeholders (itemIcon). Reads GameState; sends intents only. Unity: one UI panel per station.
 */
export class StationView {
  /** @param {HTMLElement} root @param {import('../../core/GameManager.js').GameManager} gm */
  constructor(root, gm) {
    this.gm = gm; this.c = gm.content; this.s = gm.state;
    this.el = document.createElement('div');
    this.el.className = 'station';
    this.el.hidden = true;
    root.appendChild(this.el);
    /** Store run: null | {mode:'replay'|'result', stop:boolean, report?:any, timer?:number}. */
    this.run = null;
    /** Shelf: picked slot and its draft. */
    this.slot = 0; this.sd = null;
    /** Crafting draft. */
    this.cd = { recipe: null, batches: 1, lots: {}, container: '', label: false };
    this.el.addEventListener('click', (e) => this.#click(e));
    this.el.addEventListener('change', (e) => this.#change(e));
    const rerender = () => { if (!this.el.hidden) this.render(); };
    for (const m of [MSG.ACTION_COMPLETED, MSG.ACTION_REFUSED, MSG.INVENTORY_CHANGED, MSG.CLOCK_CHANGED]) gm.bus.on(m, rerender);
    gm.bus.on(MSG.ACTION_COMPLETED, (r) => {
      if (r.actionId === 'close-store' && this.run) { this.run = { mode: 'result', report: r.report }; rerender(); }
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
    if (this.run?.mode === 'replay') return true;
    this.locId = locId;
    this.fn = fn && sc.tabs.some((t) => t.id === fn) ? fn : sc.tabs[0].id;
    this.refused = null;
    this.el.hidden = false;
    this.render();
    return true;
  }

  close() {
    if (this.run?.mode === 'replay') { this.run.stop = true; return; }
    this.run = null;
    this.el.hidden = true; this.locId = null;
  }

  /** Start the activity and walk to the station if needed, then run the action. */
  #run(activityId, actionId, params = {}) {
    const bus = this.gm.bus, p = this.s.player;
    this.refused = null;
    if (p.activityId !== activityId) bus.emit(MSG.INTENT_START_ACTIVITY, { activityId });
    if (p.location !== this.locId) bus.emit(MSG.INTENT_RUN_ACTION, { actionId: 'travel', params: { to: this.locId } });
    if (this.s.player.location !== this.locId) return false;
    const before = this.s.activityLog?.length ?? 0;
    bus.emit(MSG.INTENT_RUN_ACTION, { actionId, params });
    return (this.s.activityLog?.length ?? 0) > before;
  }

  #act(id) { return this.c.get('actions', id); }
  #item(id) { return this.c.get('items', id); }
  #cost(a) {
    const e = a.energyKey ? this.c.num(a.energyKey) : 0;
    const t = a.timeKey ? this.c.num(a.timeKey) : a.timeMin;
    const tt = a.kind === 'grind' ? `${t} min per unit` : a.kind === 'craft' ? 'recipe time' : t ? `${t} min` : '';
    return [tt, e ? `${e} energy` : ''].filter(Boolean).join(' · ');
  }

  render() {
    if (this.run?.mode === 'replay') { this.#renderLive(); return; }
    this.el.classList.remove('live');
    const sc = SCREENS[this.locId], p = this.s.player, loc = this.c.get('locations', this.locId);
    const here = p.location === this.locId;
    const walk = here ? 0 : this.gm.ctx.sys.actions.walkMinutes(p.location, this.locId);
    const h = loc.openHours?.[this.s.calendar.day];
    const open = !h ? 'Closed today' : h[0] === 0 && h[1] >= 24 ? 'Open all day' : `Open ${h[0]}:00–${h[1]}:00`;
    const tabs = sc.tabs.map((t) => `<button class="fn${t.id === this.fn ? ' on' : ''}" data-fn="${t.id}">${ic(t.i)}<span><b>${t.n}</b><small>${t.sub}</small></span></button>`).join('');
    const other = sc.links?.map((l) => `<button class="lnk2" data-goto="${l.loc}">${ic(l.i)}${l.n}</button>`).join('') ?? '';
    this.el.innerHTML = `<div class="st-panel" role="dialog" aria-label="${sc.name}">
      <aside class="st-side">
        <div class="st-kind">${sc.kind ?? 'Station'}</div>
        <h2>${sc.name}</h2>
        <p class="st-sub">${loc.name} · ${open}${here ? '' : ` · walk ${walk} min`}</p>
        <nav class="st-fns">${tabs}</nav>
        ${other ? `<div class="st-links"><span class="st-kind">Other stations</span>${other}</div>` : ''}
        <button class="st-close" data-close>Close</button>
      </aside>
      <section class="st-main">${this.run?.mode === 'result' ? this.#result() : this.#body()}
        ${this.refused ? `<p class="st-bad">✕ Cannot do it: ${esc(this.refused)}.</p>` : ''}
      </section>
    </div>`;
  }

  #body() {
    switch (this.fn) {
      case 'shelf': return this.#shelf();
      case 'store': return this.#store();
      case 'craft': return this.#craft();
      case 'dry': return this.#dry();
      case 'grind': return this.#grind();
      case 'rest': return this.#rest();
      default: return '';
    }
  }

  // ---------------------------------------------------------------- Store
  #groupName(g) {
    const boxes = this.c.num('PACK_CONTAINERS');
    const pk = g.pack ? ` · ${boxes[g.pack.split('+')[0]]?.name ?? g.pack}${g.pack.includes('+label') ? ' + label' : ''}` : '';
    return `${this.#item(g.item).name} · ${g.tier}${pk}`;
  }

  #shelf() {
    const eco = this.gm.ctx.sys.economy, slots = eco.slots(), opts = this.c.num('SHELF_PRICE_OPTIONS');
    const cells = slots.map((sl, i) => {
      const on = i === this.slot ? ' on' : '';
      if (!sl) return `<button class="sl empty${on}" data-slot="${i}"><span class="sl-plus">+</span><small>Empty</small></button>`;
      return `<button class="sl${on}" data-slot="${i}">${itemIcon(sl.item, this.#item(sl.item).name, { tier: sl.tier, size: 46, shape: 'diamond' })}
        <span class="sl-q num">×${sl.qty}</span><span class="sl-p num">${ic('coin')}${eco.slotPrice(sl).toFixed(1)}</span></button>`;
    }).join('');
    // Editor for the picked slot.
    const cur = slots[this.slot];
    const groups = eco.productGroups();
    if (!this.sd || this.sd.slot !== this.slot) {
      const g = cur ? groups.find((x) => x.item === cur.item && x.tier === cur.tier && (x.pack ?? null) === (cur.pack ?? null)) : groups.find((x) => eco.freeQty(x.item, x.tier, x.pack));
      this.sd = { slot: this.slot, key: g?.key ?? null, qty: cur?.qty ?? 0, ratio: cur?.ratio ?? 1 };
    }
    const g = groups.find((x) => x.key === this.sd.key);
    const max = g ? eco.freeQty(g.item, g.tier, g.pack, this.slot) : 0;
    if (g && !this.sd.qty) this.sd.qty = max;
    this.sd.qty = Math.min(this.sd.qty, max);
    const unit = g ? eco.slotPrice({ ...g, ratio: this.sd.ratio }) : 0;
    const est = slots.reduce((n, sl) => n + (sl ? sl.qty * eco.slotPrice(sl) : 0), 0);
    const units = eco.shelfQty();
    const editor = groups.length ? `
      <div class="sh2">Product</div>
      <div class="glist">${groups.map((x) => `<button class="gpick${x.key === this.sd.key ? ' on' : ''}" data-group="${x.key}">${itemIcon(x.item, this.#item(x.item).name, { tier: x.tier, size: 28 })}<span>${this.#groupName(x)}<small>free ${eco.freeQty(x.item, x.tier, x.pack, this.slot)} of ${x.qty}</small></span></button>`).join('')}</div>
      <div class="sh2">Quantity</div>
      <div class="stepper"><button data-sq="-1" aria-label="Less">−</button><b class="num">${this.sd.qty}</b><button data-sq="1" aria-label="More">+</button><small class="dim">max ${max}</small></div>
      <div class="sh2">Price</div>
      <div class="seg2" role="radiogroup" aria-label="Price">${opts.map((r) => `<button role="radio" aria-checked="${this.sd.ratio === r}" data-ratio="${r}">×${r}</button>`).join('')}</div>
      <p class="num dim">${unit.toFixed(2)} G each · buy chance ${Math.round(eco.buyChance(this.sd.ratio) * 100)}%</p>
      <div class="rc-g"><button class="go sm" data-stock ${g && this.sd.qty ? '' : 'disabled'}>Put on shelf</button>${cur ? '<button class="lnk2" data-clear>Clear slot</button>' : ''}</div>`
      : '<p class="hint">You have no products. Craft some at the cauldron first.</p>';
    return `<h3>Shelf stock</h3>
      <p class="lead2">Pick a slot. Set the product, the quantity and the price. Customers buy only what is on the shelf. <span class="tagp">Proposal</span></p>
      <div class="shelfwrap">
        <div class="shelf3">${cells}</div>
        <div class="sl-ed"><div class="st-kind">Slot ${this.slot + 1}</div>${editor}</div>
      </div>
      <div class="estbar"><span>${ic('coin')}Est. sales if all sell</span><b class="num gold-ink">${est.toFixed(0)} G</b><span class="dim">${units} units on the shelf · ${this.#cost(this.#act('restock-shelf'))} per slot</span></div>`;
  }

  /** Hours the store can still serve today. */
  #hoursLeft() {
    const h = this.c.get('locations', 'loc_home_shop').openHours?.[this.s.calendar.day];
    if (!h) return 0;
    const m = this.s.calendar.minute, hr = this.#act('serve-customer').timeMin;
    return Math.max(0, Math.floor((h[1] * 60 - Math.max(m, h[0] * 60)) / hr));
  }

  #store() {
    const eco = this.gm.ctx.sys.economy, slots = eco.slots();
    const est = slots.reduce((n, sl) => n + (sl ? sl.qty * eco.slotPrice(sl) : 0), 0);
    const hours = this.#hoursLeft(), cph = this.gm.ctx.stat('CUSTOMERS_PER_HOUR');
    const avgChance = slots.filter(Boolean).reduce((n, sl, _i, a) => n + eco.buyChance(sl.ratio) / a.length, 0);
    const units = eco.shelfQty();
    const expSold = Math.min(units, Math.round(hours * cph * avgChance));
    const expGold = units ? est * expSold / units : 0;
    const energy = this.c.num(this.#act('open-store').energyKey);
    const stop = eco.storeStop();
    return `<h3>Shop management</h3>
      <p class="lead2">Open the shop. Customers come each hour and buy from the shelf. The shop stays open until the shelf is sold out or the store closes.</p>
      <div class="mgmt">
        <div class="shelfmini">${slots.map((sl) => sl ? itemIcon(sl.item, this.#item(sl.item).name, { tier: sl.tier, size: 30, shape: 'diamond' }) : '<span class="sl-dot"></span>').join('')}</div>
        <div class="estcard">
          <div class="st-kind">${ic('coin')}Est. sales today</div>
          <div class="big num">${expGold.toFixed(0)} G</div>
          <div class="kv3"><span>Units on the shelf</span><b class="num">${units}</b><span>Expected sold</span><b class="num">${expSold}</b>
            <span>Hours until closing</span><b class="num">${hours}</b><span>Customers per hour</span><b class="num">${cph}</b>
            <span>Energy to open</span><b class="num">${energy}</b></div>
        </div>
      </div>
      <button class="go openshop" data-openshop ${units && !stop ? '' : 'disabled'}>${ic('coin')}Open shop!</button>
      ${!units ? '<p class="hint">The shelf is empty. Use Shelf stock first.</p>' : stop === 'closing time' ? '<p class="hint">The store is closed now.</p>' : ''}`;
  }

  /** Open shop: one energy cost, then a fast replay (one hour per tick) until sold out, closing time or Stop. */
  #openShop() {
    if (!this.#run('open_shop', 'open-store')) return;
    this.run = { mode: 'replay', stop: false, startGold: this.s.wallet.gold };
    this.el.hidden = false;
    this.render();
    const tick = () => {
      if (!this.run || this.run.mode !== 'replay') return;
      if (this.s.pendingEvent) { this.run.timer = setTimeout(tick, REPLAY_MS); return; }
      const eco = this.gm.ctx.sys.economy;
      const why = this.run.stop ? 'stopped' : eco.storeStop();
      if (why || !this.#run('open_shop', 'serve-customer')) {
        this.run.why = why ?? 'stopped';
        this.gm.bus.emit(MSG.INTENT_RUN_ACTION, { actionId: 'close-store', params: {} });
        if (this.run?.mode === 'replay') this.run = null;
        if (this.run) this.run.report.why = why ?? 'stopped';
        this.render();
        return;
      }
      this.run.timer = setTimeout(tick, REPLAY_MS);
    };
    this.run.timer = setTimeout(tick, REPLAY_MS);
  }

  /** The live card while the shop is open (the 3D shop stays visible; customers walk to the counter). */
  #renderLive() {
    const st = this.s.store ?? {}, eco = this.gm.ctx.sys.economy;
    this.el.classList.add('live');
    const total = (st.sold ?? 0) + eco.shelfQty();
    this.el.innerHTML = `<div class="st-live" role="status" aria-label="Shop is open">
      <div class="st-kind">${ic('coin')}Shop is open</div>
      <div class="lv-clock num">${this.s.calendar.clock()}</div>
      <div class="kv3"><span>Hour</span><b class="num">${st.hours ?? 0}</b><span>Customers</span><b class="num">${st.customers ?? 0}</b><span>Sold</span><b class="num">${st.sold ?? 0}</b><span>Income</span><b class="num gold-ink">+${(st.gold ?? 0).toFixed(2)} G</b></div>
      <div class="bar"><i style="width:${total ? ((st.sold ?? 0) / total) * 100 : 0}%"></i></div>
      <small class="dim">${eco.shelfQty()} units left on the shelf</small>
      <button class="go sm" data-stopshop>Stop and close</button>
    </div>`;
  }

  /** Shop result: sold products and the report (reference: sales results + report card). */
  #result() {
    const r = this.run.report ?? {};
    const why = { 'sold out': 'The shelf is sold out.', 'closing time': 'The store closed.', stopped: 'You closed the store.' }[r.why] ?? '';
    const sold = Object.entries(r.items ?? {});
    return `<div class="result2">
      <div class="sales"><h3>${ic('coin')}Sales results</h3><p class="dim">${why} ${hm(r.startMin)}–${hm(r.endMin)}</p>
        <div class="soldgrid">${sold.length ? sold.map(([id, n]) => `<div class="sold">${itemIcon(id, this.#item(id).name, { size: 48 })}<span class="num">${n}</span><small>${this.#item(id).name}</small></div>`).join('') : '<p class="hint">Nothing sold.</p>'}</div></div>
      <div class="report"><div class="st-kind">Report</div>
        <div class="rp"><span>Customers</span><b class="num">${r.customers ?? 0}</b></div>
        <div class="rp"><span>Sold</span><b class="num">${r.sold ?? 0}</b></div>
        <div class="rp"><span>Hours open</span><b class="num">${r.hours ?? 0}</b></div>
        <div class="rp"><span>Unsold on the shelf</span><b class="num">${r.unsold ?? 0}</b></div>
        <div class="rp hi"><span>Income</span><b class="num">+${(r.gold ?? 0).toFixed(2)} G</b></div>
        <button class="go" data-resultok>Next</button>
      </div>
    </div>`;
  }

  // ---------------------------------------------------------------- Crafting (one menu)
  #craft() {
    const prod = this.gm.ctx.sys.production, q = this.gm.ctx.sys.quality, recs = this.c.all('recipes'), d = this.cd;
    d.recipe = d.recipe ?? (recs.find((r) => !prod.missing(r)) ?? recs[0]).id;
    const r = this.c.get('recipes', d.recipe), product = this.#item(r.product);
    const maxB = this.c.num('CRAFT_MAX_BATCHES');
    const o = { batches: d.batches, lots: d.lots };
    const miss = prod.missing(r, o), pv = prod.preview(r, o), mult = q.priceMult(pv.tier);
    const boxes = this.c.num('PACK_CONTAINERS'), lab = this.c.num('PACK_LABEL');
    const out = r.output * d.batches;
    const unit = d.container ? boxes[d.container].cost + (d.label ? lab.cost : 0) : 0;
    const pmult = d.container ? boxes[d.container].priceMult * (d.label ? lab.priceMult : 1) : 1;
    const packMin = d.container ? this.#act('package').timeMin * d.batches : 0;
    const mins = this.#act('prepare').timeMin + r.timeMin * d.batches + packMin;
    const gold = this.s.wallet.gold, noGold = unit * out > gold;
    const method = (id) => ({ brew: 'Brew · Cooking', concoct: 'Concoct · Alchemy', blend: 'Blend · Crafting' })[id] ?? id;
    const rows = Object.entries(r.slots).filter(([, list]) => list.length).map(([slot, list]) => list.map((s, i) => {
      const it = this.#item(s.item), key = `${slot}:${i}`, lots = prod.lotsFor(s), need = s.qty * d.batches;
      const have = this.s.inventory.count(s.item, s.variant, { includeSpoiled: true });
      const day = (b) => `Day ${b + 1}`;
      return `<tr><td class="dim">${slot}</td><td class="mat">${itemIcon(s.item, it.name, { size: 26 })}<span>${it.name}<small class="dim"> ${s.variant}</small></span></td>
        <td class="num">${need}</td><td class="num ${have >= need ? 'ok' : 'bad'}">${have}</td>
        <td><select name="lot" data-key="${key}" ${lots.length ? '' : 'disabled'}><option value="">Auto (best first)</option>${lots.map((l) => `<option value="${l.key}" ${d.lots[key] === l.key ? 'selected' : ''}>${day(l.born)} · ${l.spoiled ? 'spoiled' : 'good'} · ${l.qty}</option>`).join('')}</select></td></tr>`;
    }).join('')).join('');
    return `<h3>Crafting</h3>
      <p class="lead2">Pick a recipe (it sets the method), the materials, the quantity and the packing. Then craft.</p>
      <div class="sh2">1 · Recipe</div>
      <div class="rlist">${recs.map((x) => `<button data-recipe="${x.id}" aria-pressed="${x.id === d.recipe}">${itemIcon(x.product, this.#item(x.product).name, { size: 26 })}<span>${x.name}${prod.missing(x) ? '' : ' ✓'}<small>${method(x.action)}</small></span></button>`).join('')}
        <button disabled class="locked"><span>Blend<small>No recipe in this build</small></span></button></div>
      <div class="sh2">2 · Materials</div>
      <table class="t3"><tr><th>Slot</th><th>Material</th><th>Need</th><th>Have</th><th>Lot</th></tr>${rows}</table>
      <div class="craftgrid">
        <div><div class="sh2">3 · Quantity</div>
          <div class="stepper"><button data-cb="-1" aria-label="Fewer batches">−</button><b class="num">${d.batches}</b><button data-cb="1" aria-label="More batches">+</button><small class="dim">batches (max ${maxB}) · makes ${out}</small></div></div>
        <div><div class="sh2">4 · Packing <span class="tagp">Proposal</span></div>
          <div class="seg2" role="radiogroup" aria-label="Container"><button role="radio" aria-checked="${!d.container}" data-container="">None</button>${Object.entries(boxes).map(([id, b]) => `<button role="radio" aria-checked="${d.container === id}" data-container="${id}">${b.name} <small>${b.cost} G</small></button>`).join('')}</div>
          <label class="chk" style="margin-top:6px"><input type="checkbox" name="label" ${d.label ? 'checked' : ''} ${d.container ? '' : 'disabled'}> Label <small class="dim">${lab.cost} G · ×${lab.priceMult}</small></label></div>
      </div>
      <div class="result"><div class="kv3"><span>Makes</span><b>${itemIcon(r.product, product.name, { size: 20 })} ${out} ${product.name}${d.container ? ' (packed)' : ''}</b>
        <span>Expected quality</span><b>${pv.tier} <small class="dim">(skill level ${pv.level})</small></b>
        <span>Time</span><b class="num">${mins} min (prepare ${this.#act('prepare').timeMin} + ${method(r.action).split(' ')[0].toLowerCase()} ${r.timeMin * d.batches}${packMin ? ` + packing ${packMin}` : ''})</b>
        <span>Packing cost</span><b class="num">${(unit * out).toFixed(2)} G</b>
        <span>Expected value</span><b class="num">${(product.forecast.lo * mult * pmult * out).toFixed(0)}–${(product.forecast.hi * mult * pmult * out).toFixed(0)} G</b></div></div>
      ${miss ? `<p class="st-bad">✕ ${miss}</p>` : noGold ? '<p class="st-bad">✕ Not enough gold for the containers</p>' : ''}
      <button class="go" data-craftgo ${miss || noGold ? 'disabled' : ''}>${ic('bowl')}Craft ${out} ${product.name}</button>`;
  }

  #craftGo() {
    const d = this.cd, r = this.c.get('recipes', d.recipe);
    const lots = Object.fromEntries(Object.entries(d.lots).filter(([, v]) => v));
    if (!this.#run('craft', 'prepare')) return;
    this.#run('craft', r.action, { recipeId: r.id, batches: d.batches, lots, pack: d.container ? { container: d.container, label: d.label } : null });
  }

  // ---------------------------------------------------------------- Processing stations
  #dry() {
    const inv = this.s.inventory, cap = this.c.num('SUN_DRYING_RACK_CAPACITY');
    const items = this.c.all('items').filter((i) => i.variants?.some((v) => v.id === 'dried') && inv.count(i.id, 'fresh') > 0);
    const used = this.s.batches.reduce((n, b) => n + b.qty, 0), today = this.s.calendar.absDay();
    const batches = this.s.batches.map((b) => `<div class="sold">${itemIcon(b.item, this.#item(b.item).name, { size: 40 })}<span class="num">${b.qty}</span><small>${b.readyDay <= today ? 'Ready' : `Ready in ${b.readyDay - today} d`}</small></div>`).join('');
    return `<h3>Drying rack</h3>
      <p class="lead2">Sun drying: fresh material becomes dried material. It lasts longer. The rack holds ${cap} units. Drying needs the day light (open ${this.#hours('loc_home_drying_rack')}).</p>
      <div class="sh2">On the rack · ${used}/${cap}</div>
      <div class="soldgrid">${batches || '<p class="hint">The rack is empty.</p>'}</div>
      <div class="row-card"><div class="rc-h"><b>Start drying</b><span class="dim">${this.#cost(this.#act('start-batch'))} · ${this.c.num('SUN_DRYING_DAYS')} days</span></div>
        ${items.length ? `<div class="rc-g"><select name="item">${items.map((i) => `<option value="${i.id}">${i.name} (fresh ${inv.count(i.id, 'fresh')})</option>`).join('')}</select><input type="number" name="qty" min="1" max="${cap}" value="2"><button class="go sm" data-runf="processing|start-batch">Start</button></div>` : '<p class="hint">No fresh material that can dry.</p>'}</div>
      <div class="row-card"><div class="rc-h"><b>Collect</b><span class="dim">${this.#cost(this.#act('collect-batch'))}</span></div><div class="rc-g"><button class="go sm" data-run="processing|collect-batch" ${this.s.batches.some((b) => b.readyDay <= today) ? '' : 'disabled'}>Collect ready batches</button></div></div>`;
  }

  #grind() {
    const inv = this.s.inventory;
    const items = this.c.all('items').filter((i) => i.variants?.some((v) => v.id === 'powder') && inv.count(i.id, 'dried') > 0);
    return `<h3>Grinding table</h3>
      <p class="lead2">Grind dried material into powder for recipes.</p>
      <div class="row-card"><div class="rc-h"><b>Grind</b><span class="dim">${this.#cost(this.#act('grind'))}</span></div>
        ${items.length ? `<div class="rc-g"><select name="item">${items.map((i) => `<option value="${i.id}">${i.name} (dried ${inv.count(i.id, 'dried')})</option>`).join('')}</select><input type="number" name="qty" min="1" max="20" value="1"><button class="go sm" data-runf="processing|grind">Grind</button></div>` : '<p class="hint">No dried material to grind. Dry it at the drying rack first.</p>'}</div>`;
  }

  #hours(locId) {
    const h = this.c.get('locations', locId).openHours?.[this.s.calendar.day];
    return h ? `${h[0]}:00–${h[1]}:00` : 'closed today';
  }

  // ---------------------------------------------------------------- Rest
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

  // ---------------------------------------------------------------- input
  #click(e) {
    const t = e.target;
    if (t.closest('[data-stopshop]')) { if (this.run) this.run.stop = true; return; }
    if (t.closest('[data-resultok]')) { this.run = null; this.fn = 'shelf'; this.sd = null; this.render(); return; }
    if (t.closest('[data-close]')) { this.close(); return; }
    const fn = t.closest('[data-fn]');
    if (fn) { this.fn = fn.dataset.fn; this.refused = null; this.render(); return; }
    const go = t.closest('[data-goto]');
    if (go) { this.open(go.dataset.goto); return; }
    // Shelf
    const sl = t.closest('[data-slot]');
    if (sl) { this.slot = Number(sl.dataset.slot); this.sd = null; this.render(); return; }
    const gp = t.closest('[data-group]');
    if (gp) { this.sd.key = gp.dataset.group; this.sd.qty = 0; this.render(); return; }
    const sq = t.closest('[data-sq]');
    if (sq) { this.sd.qty = Math.max(0, this.sd.qty + Number(sq.dataset.sq)); if (!this.sd.qty) this.sd.qty = 1; this.render(); return; }
    const rt = t.closest('[data-ratio]');
    if (rt) { this.sd.ratio = Number(rt.dataset.ratio); this.render(); return; }
    if (t.closest('[data-stock]')) {
      const [item, tier, pack] = this.sd.key.split('|');
      this.#run('open_shop', 'restock-shelf', { slot: this.slot, item, tier, pack: pack || null, qty: this.sd.qty, ratio: this.sd.ratio });
      this.sd = null; this.render(); return;
    }
    if (t.closest('[data-clear]')) {
      const cur = this.gm.ctx.sys.economy.slots()[this.slot];
      this.#run('open_shop', 'restock-shelf', { slot: this.slot, item: cur.item, tier: cur.tier, pack: cur.pack, qty: 0, ratio: cur.ratio });
      this.sd = null; this.render(); return;
    }
    if (t.closest('[data-openshop]')) { this.#openShop(); return; }
    // Crafting
    const rc = t.closest('[data-recipe]');
    if (rc) { this.cd.recipe = rc.dataset.recipe; this.cd.lots = {}; this.render(); return; }
    const cb = t.closest('[data-cb]');
    if (cb) { this.cd.batches = Math.min(this.c.num('CRAFT_MAX_BATCHES'), Math.max(1, this.cd.batches + Number(cb.dataset.cb))); this.render(); return; }
    const ct = t.closest('[data-container]');
    if (ct) { this.cd.container = ct.dataset.container; if (!this.cd.container) this.cd.label = false; this.render(); return; }
    if (t.closest('[data-craftgo]')) { this.#craftGo(); return; }
    // Generic
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
    if (t.name === 'label') { this.cd.label = t.checked; this.render(); }
    if (t.name === 'lot') { this.cd.lots[t.dataset.key] = t.value; this.render(); }
  }
}

/** Real milliseconds per shop hour in the replay (view only). */
const REPLAY_MS = 700;

/** Station screens by location (Scene & Flow: Store, Crafting, Processing, Rest; user decisions 7 Nov 2026). */
const SCREENS = {
  loc_home_shop: { name: 'Store', tabs: [
    { id: 'shelf', n: 'Shelf stock', sub: 'Slots, quantity, price', i: 'crate' },
    { id: 'store', n: 'Shop management', sub: 'Estimate, open shop', i: 'coin' }] },
  loc_home_atelier: { name: 'Crafting', tabs: [
    { id: 'craft', n: 'Crafting', sub: 'Recipe, materials, quantity, packing', i: 'bowl' }] },
  loc_home_drying_rack: { name: 'Drying rack', kind: 'Processing station', tabs: [
    { id: 'dry', n: 'Sun drying', sub: 'Start and collect', i: 'sun' }],
  links: [{ loc: 'loc_home_grinder', n: 'Grinding table', i: 'mill' }] },
  loc_home_grinder: { name: 'Grinding table', kind: 'Processing station', tabs: [
    { id: 'grind', n: 'Grinding', sub: 'Dried to powder', i: 'mill' }],
  links: [{ loc: 'loc_home_drying_rack', n: 'Drying rack', i: 'sun' }] },
  loc_home: { name: 'Rest', tabs: [
    { id: 'rest', n: 'Rest', sub: 'Short break, eat, sleep', i: 'moon' }] }
};

/** @param {number} m minutes */
function hm(m) { return m == null ? '' : `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; }

/** @param {string} s */
function esc(s) { return String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]); }

