import { MSG } from '../../core/EventBus.js';

/**
 * CraftView: pick a recipe for Brew or Concoct. Shows each slot material and variant with stock,
 * the input cost next to the expected sell price and the expected quality tier (gross profit choice, SPECS §6).
 * Costs and prices use the forecast range (real prices stay hidden). Sends intent.runAction only.
 * Unity: craft screen.
 */
export class CraftView {
  /** @param {HTMLElement} root @param {import('../../core/GameManager.js').GameManager} gm */
  constructor(root, gm) {
    this.gm = gm; this.c = gm.content; this.s = gm.state;
    this.el = document.createElement('div');
    this.el.className = 'scrim2';
    this.el.hidden = true;
    root.appendChild(this.el);
    this.el.addEventListener('click', (e) => {
      if (e.target === this.el || e.target.closest('[data-close]')) this.close();
      const r = e.target.closest('[data-recipe]');
      if (r) { this.sel = r.dataset.recipe; this.render(); }
      if (e.target.closest('[data-make]')) {
        const rec = this.c.get('recipes', this.sel);
        gm.bus.emit(MSG.INTENT_RUN_ACTION, { actionId: rec.action, params: { recipeId: rec.id } });
        this.close();
      }
    });
  }

  /** @param {string} actionId brew or concoct */
  open(actionId) {
    this.actionId = actionId;
    this.recipes = this.c.all('recipes').filter((r) => r.action === actionId);
    this.sel = this.recipes.find((r) => !this.gm.ctx.sys.production.missing(r))?.id ?? this.recipes[0].id;
    this.el.hidden = false;
    this.render();
  }

  close() { this.el.hidden = true; }

  render() {
    const prod = this.gm.ctx.sys.production, q = this.gm.ctx.sys.quality;
    const r = this.c.get('recipes', this.sel), product = this.c.get('items', r.product);
    const mid = (f) => (f.lo + f.hi) / 2;
    let cost = 0;
    const rows = Object.entries(r.slots).map(([slot, list]) => {
      if (!list.length) return `<tr><td>${slot}</td><td colspan="4" class="dim">– (empty slot)</td></tr>`;
      return list.map((s) => {
        const it = this.c.get('items', s.item), v = it.variants.find((x) => x.id === s.variant);
        const have = this.s.inventory.count(s.item, s.variant), spoiled = this.s.inventory.count(s.item, s.variant, { includeSpoiled: true }) - have;
        const unit = mid(it.forecast) * (v?.priceMult ?? 1);
        cost += unit * s.qty;
        return `<tr><td>${slot}</td><td>${it.name} <small class="dim">${s.variant}</small></td><td class="num">${s.qty}</td><td class="num ${have >= s.qty ? 'ok' : have + spoiled >= s.qty ? 'warn' : 'bad'}">${have}${spoiled ? ` +${spoiled} spoiled` : ''}</td><td class="num">~${(unit * s.qty).toFixed(1)} G</td></tr>`;
      }).join('');
    }).join('');
    const pv = prod.preview(r), mult = q.priceMult(pv.tier);
    const lo = product.forecast.lo * mult * r.output, hi = product.forecast.hi * mult * r.output;
    const miss = prod.missing(r);
    const verb = this.c.get('actions', this.actionId).name;
    this.el.innerHTML = `<div class="modal2" role="dialog" aria-label="${verb}">
      <button class="x" data-close aria-label="Close">×</button>
      <h2>${verb}</h2>
      <div class="rtabs">${this.recipes.map((x) => `<button data-recipe="${x.id}" aria-pressed="${x.id === this.sel}">${x.name}${prod.missing(x) ? '' : ' ✓'}</button>`).join('')}</div>
      <table class="t2"><tr><th>Slot</th><th>Material</th><th>Need</th><th>Have</th><th>Cost (forecast)</th></tr>${rows}</table>
      <div class="kv2">
        <span>Makes</span><b>${r.output} ${product.name} · ${r.timeMin / 60} h</b>
        <span>Expected quality</span><b>${pv.tier} <small class="dim">(skill level ${pv.level}, score ${Math.round(pv.score)})</small></b>
        <span>Input cost</span><b class="num">~${cost.toFixed(1)} G</b>
        <span>Expected sell value</span><b class="num">${lo.toFixed(0)}–${hi.toFixed(0)} G <small class="dim">(×${mult} for ${pv.tier})</small></b>
        <span>Gross profit</span><b class="num ${hi - cost > 0 ? 'ok' : 'bad'}">${(lo - cost).toFixed(0)} to ${(hi - cost).toFixed(0)} G</b>
      </div>
      ${miss ? `<p class="bad">✕ ${miss}</p>` : ''}
      <div class="acts"><button class="sec2" data-close>Cancel</button><button class="go" data-make ${miss ? 'disabled' : ''}>${verb} ${r.name}</button></div>
    </div>`;
  }
}
