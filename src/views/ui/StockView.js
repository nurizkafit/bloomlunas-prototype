import { MSG } from '../../core/EventBus.js';

/**
 * StockView: the shelf panel inside the home and shop. Lists the stock lots (item, variant or tier, quantity, age).
 * View only: restock is the "Restock shelf" action of Open shop at the counter.
 * Reads GameState; sends no intents. Unity: inventory panel.
 */
export class StockView {
  /** @param {HTMLElement} root @param {import('../../core/GameManager.js').GameManager} gm */
  constructor(root, gm) {
    this.gm = gm; this.c = gm.content; this.s = gm.state;
    this.el = document.createElement('aside');
    this.el.className = 'amenu stock';
    this.el.hidden = true;
    root.appendChild(this.el);
    this.el.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) this.close(); });
    gm.bus.on(MSG.INVENTORY_CHANGED, () => { if (!this.el.hidden) this.render(); });
    gm.bus.on(MSG.PHASE_ENTERED, () => this.close());
  }

  open() { this.el.hidden = false; this.render(); }

  close() { this.el.hidden = true; }

  render() {
    const today = this.s.calendar.absDay();
    const lots = this.s.inventory.find().sort((a, b) => a.item.localeCompare(b.item) || a.born - b.born);
    const row = (l) => {
      const it = this.c.get('items', l.item);
      const kind = l.tier ?? l.variant;
      return `<tr${l.spoiled ? ' class="bad"' : ''}><td>${it.name}</td><td>${kind}${l.spoiled ? ' · spoiled' : ''}</td><td class="num" style="text-align:right">${l.qty}</td><td class="num" style="text-align:right">${today - l.born} d</td></tr>`;
    };
    this.el.innerHTML = `<button class="x" data-close aria-label="Close">×</button>
      <h3>Shelf</h3>
      <p class="sub">Your stock. Old stock spoils.</p>
      ${lots.length ? `<table class="t2"><tr><th>Item</th><th>Kind</th><th style="text-align:right">Qty</th><th style="text-align:right">Age</th></tr>${lots.map(row).join('')}</table>` : '<p class="hint">The shelf is empty. Buy materials at the market, then craft.</p>'}
      <p class="hint">To restock the shop, use "Open shop" at the counter.</p>`;
  }
}
