import { Dom } from './Dom.js';
import { Calendar, WEEKDAYS } from '../../model/Calendar.js';

const h = Dom.h;

/**
 * HudView: top band. Day medal (week, day), gold and debt pills, energy bar, clock with a day bar,
 * today's goal card, and round buttons (Map, Journal). Icon + number, few words.
 */
export class HudView {
  constructor(ui) { this.ui = ui; }

  render() {
    const ui = this.ui, st = ui.st, L = ui.local;
    const wd = WEEKDAYS[Calendar.weekday(st.cal)];
    const phaseIcon = { plan: 'calendar', do: 'walk', check: 'note', act: 'debt' }[st.phase];
    const start = ui.num('DAY_START_HOUR') * 60, end = ui.num('DAY_END_HOUR') * 60;
    const dayRatio = (st.cal.minute - start) / (end - start);
    const eRatio = st.energy / st.energyMax;
    const goalId = st.plan.goals[st.cal.day - 1];
    const goal = goalId ? ui.c.get('goals', goalId) : null;
    const met = goalId && st.phase === 'do' ? ui.sys.plan.goalMet(goalId, st.day) : null;
    const due = ui.sys.debt.dueLeft();
    return h('div.hud',
      h('div.daymedal', { title: `Month ${st.cal.month}, week ${st.cal.week}` },
        h('div', h('b', wd), h('small', `W${(st.cal.month - 1) * ui.num('WEEKS_PER_MONTH') + st.cal.week} · D${st.cal.day}`)),
        h('span.ph', Dom.medal(phaseIcon, 32))),
      h('div.hcol',
        h('div.prow',
          h('div.pill', { title: 'Gold' }, h('span', Dom.icon('gold', 22), Math.round(st.gold).toLocaleString('en'))),
          h('div.pill.debt', { title: `Debt. Due this month: ${due} G` }, h('span', Dom.icon('debt', 22), Math.round(st.debt.balance).toLocaleString('en'))),
          h('div.pill', { title: 'Food packs' }, h('span', Dom.icon('meal', 22), String(this.#food())))),
        h('div.energyrow', { title: 'Energy' }, Dom.icon('energy', 18), Dom.bar(eRatio, eRatio < .25 ? 'low' : ''), `${Math.round(st.energy)}`,
          h('span', { style: { width: '16px' } }),
          Dom.icon('clock', 18), h('div.daybar', h('i', { style: { width: `${Math.max(0, Math.min(1, dayRatio)) * 100}%` } })),
          h('span.clock', Calendar.clock(st.cal.minute)))),
      goal ? Dom.slim('goalcard', Dom.medal(goal.icon, 36), h('div', h('small', 'TODAY'), goal.name), h('span.st', met ? Dom.icon('check', 22) : Dom.icon('clock', 20))) : null,
      st.phase === 'do' ? h('div.hright',
        this.#rb('map', 'Map', L.map, () => ui.set({ map: !L.map, journal: false })),
        this.#rb('journal', 'Journal', L.journal, () => ui.set({ journal: !L.journal, map: false }))) : null);
  }

  #food() {
    return this.ui.st.inv['meal|pack|'] ?? 0;
  }

  #rb(icon, label, on, onclick) {
    return h(`button.rb${on ? '.on' : ''}`, { onclick, title: label }, h('i', Dom.icon(icon, 26)), h('span', label));
  }
}
