import { MSG } from '../../core/EventBus.js';
import { Dom } from './Dom.js';
import { WEEKDAYS } from '../../model/Calendar.js';

const h = Dom.h;

/**
 * CheckView: weekly recap pages in the Journal (Scene & Flow: Check). Goals met per day, store goal,
 * income and costs, budget jars vs actual, XP; the player picks a short note for next week.
 */
export class CheckView {
  constructor(ui) { this.ui = ui; }

  pages() {
    const ui = this.ui, st = ui.st, s = st.checkSummary;
    if (!s) return [[], []];
    const picked = ui.local.pick.notes ?? [];
    const opts = ui.c.get('notes', 'notes').options;
    const goalCell = (g, i) => {
      const goal = g ? ui.c.get('goals', g) : null;
      return h('div.day', { style: { minHeight: '96px' } }, h('span.dn', WEEKDAYS[i]),
        goal ? h('div.goalchip', { style: { background: goal.color, height: '40px' } }, Dom.icon(goal.icon, 22)) : h('div.goalchip.empty', { style: { height: '40px' } }, '-'),
        s.goalsMet[i] ? Dom.icon('check', 18) : Dom.icon('x', 16));
    };
    const ratio = s.storeGoal ? s.sold / s.storeGoal : 0;
    const left = [
      h('h3', Dom.icon('note', 28), `Week ${s.absWeek}, looking back`),
      h('h4', Dom.icon('star', 18), 'Goals met', h('span.aside', `${s.goalHits}/7`)),
      h('div.days', s.goals.map(goalCell)),
      h('h4', Dom.icon('tag', 18), 'Sold', h('span.aside', `${s.sold}/${s.storeGoal}`)),
      Dom.bar(ratio, ratio >= 1 ? '' : 'gold'),
      h('div.chipline', { style: { marginTop: '8px' } }, Object.entries(s.soldBy).map(([id, q]) => Dom.chip(ui.c.get('items', id).icon, q))),
      h('div.statgrid', { style: { marginTop: '16px' } },
        h('div.stat', h('span.k', Dom.icon('trend_up', 16), 'Earned'), h('span.v', `+${s.incomeTotal}`)),
        h('div.stat', h('span.k', Dom.icon('trend_down', 16), 'Spent'), h('span.v', `-${s.spentTotal}`)),
        h('div.stat', h('span.k', Dom.icon('gold', 16), 'Gold'), h('span.v', `${Math.round(s.endGold)}`))),
      s.unpaidLiving ? h('div.warn', { style: { marginTop: '8px' } }, Dom.icon('debt', 18), `You could not pay ${s.unpaidLiving} of living costs. It went onto the debt.`) : null
    ];
    const jar = (k, icon) => h('div.ln', Dom.icon(icon, 20), h('span', { style: { width: '72px' } }, k[0].toUpperCase() + k.slice(1)), Dom.bar(s.budget[k] ? s.spent[k] / s.budget[k] : 0, s.spent[k] > s.budget[k] ? 'low' : 'ver', 176), h('span.v', `${Math.round(s.spent[k])}/${s.budget[k]}`));
    const right = [
      h('h3', Dom.icon('jar', 28), 'Jars'),
      jar('store', 'cart'), jar('personal', 'meal'),
      h('div.ln', Dom.icon('buffer', 20), h('span', { style: { width: '72px' } }, 'Buffer'), h('span.spacer'), s.bufferKept ? Dom.icon('check', 20) : Dom.icon('x', 18), h('span.v', String(s.budget.buffer))),
      h('h4', Dom.icon('skills', 18), 'XP'),
      h('div.chipline', Object.entries(s.xp).map(([k, v]) => Dom.chip(k, `+${v}`))),
      h('h4', Dom.icon('note', 18), 'A note for next week', h('span.aside', `${picked.length}/2`)),
      h('div.notepick', opts.map((o) => h(`button${picked.includes(o.id) ? '.on' : ''}`, {
        onclick: () => {
          const n = picked.includes(o.id) ? picked.filter((x) => x !== o.id) : [...picked, o.id].slice(-2);
          ui.set({ pick: { ...ui.local.pick, notes: n } });
        }
      }, Dom.icon(o.icon, 20), o.text)))
    ];
    return [left, right];
  }

  ribbon() {
    const ui = this.ui;
    const last = ui.st.cal.week >= ui.num('WEEKS_PER_MONTH');
    return Dom.btn(last ? 'Month end' : 'Next week', () => { const ids = ui.local.pick.notes ?? []; ui.local.pick = {}; ui.send(MSG.INTENT_FINISH_CHECK, { ids }); }, { cls: 'gold.ribbon', icon: 'check' });
  }
}
