import { Dom } from './Dom.js';

const h = Dom.h;

/**
 * RetroView: the end of the jam build (no Good or Bad ending). The guild looks back at two months:
 * gold and debt per week, goals, store goal, buffer habit, sales, quests, debt costs, skills.
 */
export class RetroView {
  constructor(ui) { this.ui = ui; }

  render() {
    const ui = this.ui, r = ui.gm.phases.retro.summary();
    const pct = (x) => `${Math.round(x * 100)}%`;
    const weeks = r.weekList;
    const gold = [r.startGold, ...weeks.map((w) => w.endGold)];
    const debt = [r.startDebt, ...weeks.map((w) => w.debt ?? r.endDebt)];
    const left = [
      h('h3', Dom.icon('chart', 28), 'Two months'),
      h('div.legend', { style: { marginTop: '8px' } }, h('span', h('i', { style: { background: '#D9A326' } }), 'Gold'), h('span', h('i', { style: { background: '#B5523B' } }), 'Debt')),
      Dom.raw(this.#chart(gold, debt)),
      h('h4', Dom.icon('calendar', 18), 'Weeks', h('span.aside', Dom.icon('star', 14), 'goals')),
      h('div', { style: { display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, weeks.length)}, 1fr)`, gap: '8px' } }, weeks.map((w) => h('div.stat', h('span.k', `W${w.absWeek}`), Dom.dots(7, w.goalsMet.map((m) => m ? 'ok' : 'no')).cloneNode(true), h('span.small.num', `${w.sold}/${w.storeGoal}`)))),
      h('h4', Dom.icon('debt', 18), 'Debt'),
      h('div.statgrid',
        h('div.stat', h('span.k', Dom.icon('gold', 16), 'Paid'), h('span.v', String(Math.round(r.paid)))),
        h('div.stat', h('span.k', Dom.icon('trend_up', 16), 'Interest'), h('span.v', String(Math.round(r.interest)))),
        h('div.stat', h('span.k', Dom.icon('warn', 16), 'Fees'), h('span.v', `${Math.round(r.fees)}`)))
    ];
    const right = [
      h('h3', Dom.icon('star', 28), 'Habits'),
      h('div.statgrid', { style: { marginTop: '8px' } },
        h('div.stat', h('span.k', Dom.icon('star', 16), 'Goals'), h('span.v', pct(r.goalRate))),
        h('div.stat', h('span.k', Dom.icon('tag', 16), 'Sell goal'), h('span.v', pct(r.storeRate))),
        h('div.stat', h('span.k', Dom.icon('buffer', 16), 'Buffer'), h('span.v', pct(r.bufferRate)))),
      h('div.statgrid', { style: { marginTop: '16px' } },
        h('div.stat', h('span.k', Dom.icon('jamu', 16), 'Sold'), h('span.v', String(r.sold))),
        h('div.stat', h('span.k', Dom.icon('quest', 16), 'Quests'), h('span.v', `${r.quests}`)),
        h('div.stat', h('span.k', Dom.icon('calendar', 16), 'Late'), h('span.v', `${r.missedMonths}`))),
      h('h4', Dom.icon('skills', 18), 'Skills'),
      h('div.chipline', ['moon', 'sun', 'earth'].map((k) => Dom.chip(k, `Lv ${ui.sys.skills.level(k)}`))),
      h('h4', Dom.icon('debt', 18), 'Balance'),
      h('div.ln', Dom.icon('gold', 20), 'Gold', h('span.v', `${r.startGold} → ${Math.round(r.endGold)}`)),
      h('div.ln', Dom.icon('debt', 20), 'Debt', h('span.v.neg', `${r.startDebt} → ${Math.round(r.endDebt)}`)),
      r.carried ? h('div.ln', Dom.icon('house', 20), 'Unpaid bills', h('span.v.neg', `+${Math.round(r.carried)}`)) : null,
      h('div.row.end', { style: { marginTop: 'auto' } }, Dom.btn('New game', () => ui.o.onNewGame(), { cls: 'gold', icon: 'herb' }))
    ];
    return [
      h('div.phasebar', Dom.slim('plaque', Dom.medal('guild', 38), h('div', h('small', `MONTH ${ui.st.cal.month}`), h('b', 'Retrospective')))),
      h('div.book', { style: { top: '84px' } }, h('div.tool'), h('div.tool2'), h('div.spineband'),
        h('div.pages', h('div.pg.l', ...left), h('div.pg.r', ...right)),
        ...Dom.corners().map((c) => { c.style.zIndex = 3; return c; }))
    ];
  }

  #chart(gold, debt) {
    const W = 440, H = 160, P = 32;
    const max = Math.max(...gold, ...debt, 1);
    const pts = (a) => a.map((v, i) => `${P + (i / Math.max(1, a.length - 1)) * (W - 2 * P)},${H - P - (v / max) * (H - 2 * P)}`).join(' ');
    const grid = [0, .5, 1].map((t) => `<line x1="${P}" x2="${W - P}" y1="${H - P - t * (H - 2 * P)}" y2="${H - P - t * (H - 2 * P)}" stroke="#B9AE8E" stroke-dasharray="3 4"/><text x="0" y="${H - P - t * (H - 2 * P) + 4}" font-size="10" fill="#2E5A56">${Math.round(max * t)}</text>`).join('');
    const dots = (a, c) => a.map((v, i) => `<circle cx="${P + (i / Math.max(1, a.length - 1)) * (W - 2 * P)}" cy="${H - P - (v / max) * (H - 2 * P)}" r="3" fill="${c}" stroke="#2D3B3A" stroke-width=".8"/>`).join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}">${grid}<polyline points="${pts(debt)}" fill="none" stroke="#B5523B" stroke-width="2.4"/><polyline points="${pts(gold)}" fill="none" stroke="#D9A326" stroke-width="2.4"/>${dots(debt, '#B5523B')}${dots(gold, '#D9A326')}</svg>`;
  }
}
