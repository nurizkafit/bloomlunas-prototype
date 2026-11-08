import { Dom } from './Dom.js';
import { Calendar, WEEKDAYS } from '../../model/Calendar.js';

const h = Dom.h;

/**
 * HudView: top band. Day dial (user decision 8 Nov 2026: the day from DAY_START_HOUR to DAY_END_HOUR with a moving
 * hand, sky colour by the hour, the time in the centre, an energy ring around it), calendar, gold, debt and food pills,
 * today's goal card, and round buttons (Map, Journal). Icon + number, few words.
 */
export class HudView {
  constructor(ui) { this.ui = ui; }

  render() {
    const ui = this.ui, st = ui.st, L = ui.local;
    const wd = WEEKDAYS[Calendar.weekday(st.cal)];
    const phaseIcon = { plan: 'calendar', do: 'walk', check: 'note', act: 'debt' }[st.phase];
    const start = ui.num('DAY_START_HOUR') * 60, end = ui.num('DAY_END_HOUR') * 60;
    const eRatio = st.energy / st.energyMax;
    const goalId = st.plan.goals[st.cal.day - 1];
    const goal = goalId ? ui.c.get('goals', goalId) : null;
    const met = goalId && st.phase === 'do' ? ui.sys.plan.goalMet(goalId, st.day) : null;
    return h('div.hud',
      this.#dial(wd, phaseIcon, start, end, eRatio),
      h('div.hcol',
        h('div.prow',
          h('div.pill.cal', { 'data-help': 'calendar' }, h('span', Dom.icon('calendar', 20), `M${st.cal.month}`, h('i', '·'), `W${st.cal.week}`, h('i', '·'), `D${st.cal.day}`)),
          h('div.pill', { 'data-help': 'gold' }, h('span', Dom.icon('gold', 22), Math.round(st.gold).toLocaleString('en'))),
          h('div.pill.debt', { 'data-help': 'debt' }, h('span', Dom.icon('debt', 22), Math.round(st.debt.balance).toLocaleString('en'))),
          h('div.pill', { 'data-help': 'food' }, h('span', Dom.icon('meal', 22), String(this.#food()))))),
      goal ? Dom.slim('goalcard', { 'data-help': 'todayGoal' }, Dom.medal(goal.icon, 36), h('div', h('small', 'TODAY'), goal.name), h('span.st', met ? Dom.icon('check', 22) : Dom.icon('clock', 20))) : null,
      st.phase === 'do' ? h('div.hright',
        this.#rb('map', 'Town', L.map, () => ui.set({ map: !L.map, journal: false })),
        this.#rb('journal', 'Journal', L.journal, () => ui.set({ journal: !L.journal, map: false }))) : null);
  }

  /** Day dial with the energy ring. Angles: -135 deg (day start) to +135 deg (day end), clockwise from the top. */
  #dial(wd, phaseIcon, start, end, eRatio) {
    const st = this.ui.st, m = st.cal.minute;
    const t = Math.max(0, Math.min(1, (m - start) / (end - start)));
    const ang = (r) => -135 + 270 * r;
    const pt = (a, r) => [50 + r * Math.sin(a * Math.PI / 180), 50 - r * Math.cos(a * Math.PI / 180)];
    const arc = (a0, a1, r) => { const [x0, y0] = pt(a0, r), [x1, y1] = pt(a1, r); return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`; };
    const hr = m / 60, sky = HudView.sky(hr), night = hr >= 19 || hr < 6;
    const hours = (end - start) / 60;
    let ticks = '';
    for (let i = 0; i <= hours; i++) {
      const hh = start / 60 + i, a = ang(i / hours), big = hh % 6 === 0;
      const [x0, y0] = pt(a, big ? 30.5 : 33), [x1, y1] = pt(a, 36.5);
      ticks += `<path d="M${x0.toFixed(2)} ${y0.toFixed(2)}L${x1.toFixed(2)} ${y1.toFixed(2)}" stroke="${night ? '#F2E9D8' : '#1F3A3D'}" stroke-opacity="${big ? 0.85 : 0.45}" stroke-width="${big ? 1.6 : 0.9}" stroke-linecap="round"/>`;
    }
    const a = ang(t), [hx, hy] = pt(a, 31);
    const e = Math.max(0, Math.min(1, eRatio)), low = e < 0.25;
    const eLen = 2 * Math.PI * 45.5;
    const svg = `<svg viewBox="0 0 100 100" width="104" height="104" aria-hidden="true">
      <circle cx="50" cy="50" r="49" fill="#7A5634"/><circle cx="50" cy="50" r="48" fill="none" stroke="#D9B077" stroke-width="1"/>
      <circle cx="50" cy="50" r="45.5" fill="none" stroke="#2A1E14" stroke-opacity=".55" stroke-width="5"/>
      <circle cx="50" cy="50" r="45.5" fill="none" stroke="${low ? '#C0583F' : '#8DBA5A'}" stroke-width="4" stroke-linecap="round"
        stroke-dasharray="${(e * eLen).toFixed(2)} ${eLen.toFixed(2)}" transform="rotate(-90 50 50)"/>
      <circle cx="50" cy="50" r="41" fill="${sky}" stroke="#5A3D22" stroke-width="1.4"/>
      <path d="${arc(-135, a, 38.5)}" fill="none" stroke="${night ? '#A9B8E8' : '#D9A326'}" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round"/>
      ${ticks}
      <circle cx="50" cy="50" r="22" fill="#1F3A3D" stroke="#D9A326" stroke-width="1.2"/>
      <path d="M50 50L${hx.toFixed(2)} ${hy.toFixed(2)}" stroke="#2D3B3A" stroke-width="2" stroke-linecap="round" opacity=".55"/>
      ${night
        ? `<circle cx="${hx.toFixed(2)}" cy="${hy.toFixed(2)}" r="5" fill="#E9EEF8" stroke="#2C3E5C" stroke-width=".8"/><circle cx="${(hx + 2).toFixed(2)}" cy="${(hy - 1.5).toFixed(2)}" r="4" fill="${sky}"/>`
        : `<circle cx="${hx.toFixed(2)}" cy="${hy.toFixed(2)}" r="5" fill="#F2C14E" stroke="#B5523B" stroke-width=".8"/>`}
    </svg>`;
    return h('div.daydial', { 'data-help': 'day' },
      Dom.raw(svg),
      h('div.dt', h('small', wd.toUpperCase()), h('b', Calendar.clock(m))),
      h('span.ph', Dom.medal(phaseIcon, 30)),
      h(`span.en${low ? '.low' : ''}`, { 'data-help': 'energy' }, Dom.icon('energy', 14), String(Math.round(st.energy))));
  }

  /** Sky colour at an hour: dawn gold, day sky, dusk amber, night blue. */
  static sky(hr) {
    const stops = [[0, '#1F2A44'], [5, '#24304D'], [6.5, '#F1D6A2'], [9, '#D3E4DA'], [15.5, '#D3E4DA'], [18, '#EDB27C'], [19.5, '#5A5F8A'], [21, '#2C3E5C'], [24, '#1F2A44']];
    let i = 0;
    while (i < stops.length - 2 && hr > stops[i + 1][0]) i++;
    const [h0, c0] = stops[i], [h1, c1] = stops[i + 1];
    const k = Math.max(0, Math.min(1, (hr - h0) / (h1 - h0)));
    const mix = (a, b) => Math.round(parseInt(a, 16) + (parseInt(b, 16) - parseInt(a, 16)) * k).toString(16).padStart(2, '0');
    return `#${mix(c0.slice(1, 3), c1.slice(1, 3))}${mix(c0.slice(3, 5), c1.slice(3, 5))}${mix(c0.slice(5, 7), c1.slice(5, 7))}`;
  }

  #food() {
    return this.ui.st.inv['meal|pack|'] ?? 0;
  }

  #rb(icon, label, on, onclick) {
    return h(`button.rb${on ? '.on' : ''}`, { onclick, title: label }, h('i', Dom.icon(icon, 26)), h('span', label));
  }
}
