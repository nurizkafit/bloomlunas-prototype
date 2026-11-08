import { Dom } from './Dom.js';
import { Calendar, WEEKDAYS } from '../../model/Calendar.js';

const h = Dom.h;

/**
 * HudView: top band. Day medal (weekday and clock), calendar, gold, debt and food pills, energy bar, day bar,
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
    return h('div.hud',
      h('div.daymedal', { 'data-help': 'day' },
        h('div', h('small', wd.toUpperCase()), h('b', Calendar.clock(st.cal.minute))),
        h('span.ph', Dom.medal(phaseIcon, 32))),
      h('div.hcol',
        h('div.prow',
          h('div.pill.cal', { 'data-help': 'calendar' }, h('span', Dom.icon('calendar', 20), `M${st.cal.month}`, h('i', '·'), `W${st.cal.week}`, h('i', '·'), `D${st.cal.day}`)),
          h('div.pill', { 'data-help': 'gold' }, h('span', Dom.icon('gold', 22), Math.round(st.gold).toLocaleString('en'))),
          h('div.pill.debt', { 'data-help': 'debt' }, h('span', Dom.icon('debt', 22), Math.round(st.debt.balance).toLocaleString('en'))),
          h('div.pill', { 'data-help': 'food' }, h('span', Dom.icon('meal', 22), String(this.#food())))),
        h('div.energyrow',
          h('span.row', { 'data-help': 'energy', style: { gap: '8px' } }, Dom.icon('energy', 18), Dom.bar(eRatio, eRatio < .25 ? 'low' : ''), `${Math.round(st.energy)}`),
          h('span', { style: { width: '16px' } }),
          h('span.row', { 'data-help': 'day', style: { gap: '8px' } }, Dom.icon('clock', 18), h('div.daybar', h('i', { style: { width: `${Math.max(0, Math.min(1, dayRatio)) * 100}%` } }))))),
      goal ? Dom.slim('goalcard', { 'data-help': 'todayGoal' }, Dom.medal(goal.icon, 36), h('div', h('small', 'TODAY'), goal.name), h('span.st', met ? Dom.icon('check', 22) : Dom.icon('clock', 20))) : null,
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
