import { Dom } from './Dom.js';
import { Calendar, WEEKDAYS } from '../../model/Calendar.js';

const h = Dom.h;

/**
 * HudView: top band. Clock dial (user feedback 8 Nov 2026: a 12-hour clock face with hands and AM/PM, sky colour by
 * the hour, an energy ring around it; the weekday and 24-hour time on a plate under it), calendar, gold, debt and food pills,
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
          h('div.pill.time', { 'data-help': 'day' }, h('span', Dom.icon('clock', 18), h('small', wd), h('b', Calendar.clock(st.cal.minute)), h('i', st.cal.minute < 720 ? 'AM' : 'PM'))),
          h('div.pill', { 'data-help': 'gold' }, h('span', Dom.icon('gold', 22), Math.round(st.gold).toLocaleString('en'))),
          h('div.pill.debt', { 'data-help': 'debt' }, h('span', Dom.icon('debt', 22), Math.round(st.debt.balance).toLocaleString('en'))),
          h('div.pill', { 'data-help': 'food' }, h('span', Dom.icon('meal', 22), String(this.#food())))),
        goal ? Dom.slim('goalcard', { 'data-help': 'todayGoal' }, Dom.medal(goal.icon, 26), h('small', 'TODAY'), h('span.gn', goal.name), h('span.st', met ? Dom.icon('check', 18) : Dom.icon('clock', 16))) : null),
      st.phase === 'do' ? h('div.hright',
        this.#rb('map', 'Town', L.map, () => ui.set({ map: !L.map, journal: false })),
        this.#rb('journal', 'Journal', L.journal, () => ui.set({ journal: !L.journal, map: false }))) : null);
  }

  /**
   * Clock dial with the energy ring (user feedback 8 Nov 2026: a normal 12-hour clock face with AM/PM; the digital
   * time stays in 24-hour form). Hour and minute hands, 12 numbers, sky colour by the hour, sun or moon mark.
   */
  #dial(wd, phaseIcon, start, end, eRatio) {
    const st = this.ui.st, m = st.cal.minute;
    const pt = (a, r) => [50 + r * Math.sin(a * Math.PI / 180), 50 - r * Math.cos(a * Math.PI / 180)];
    const f = (n) => n.toFixed(2);
    const hr = m / 60, sky = HudView.sky(hr), night = hr >= 19 || hr < 6;
    const ink = night ? '#F2E9D8' : '#1F3A3D';
    let face = '';
    for (let i = 0; i < 60; i++) {
      const a = i * 6, big = i % 5 === 0;
      const [x0, y0] = pt(a, big ? 36 : 38), [x1, y1] = pt(a, 39.5);
      face += `<path d="M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}" stroke="${ink}" stroke-opacity="${big ? 0.85 : 0.35}" stroke-width="${big ? 1.4 : 0.6}" stroke-linecap="round"/>`;
    }
    for (let n = 1; n <= 12; n++) {
      const [x, y] = pt(n * 30, 29.5);
      face += `<text x="${f(x)}" y="${f(y)}" text-anchor="middle" dominant-baseline="central" font-family="Marcellus, Georgia, serif" font-size="${n % 3 === 0 ? 9 : 7}" fill="${ink}" fill-opacity="${n % 3 === 0 ? 1 : 0.7}">${n}</text>`;
    }
    const hAng = ((hr % 12) / 12) * 360, mAng = ((m % 60) / 60) * 360;
    const [hx, hy] = pt(hAng, 18), [mx, my] = pt(mAng, 30), [tx, ty] = pt(hAng + 180, 4), [ux, uy] = pt(mAng + 180, 5);
    const e = Math.max(0, Math.min(1, eRatio)), low = e < 0.25;
    const eLen = 2 * Math.PI * 45.5;
    const ampm = hr < 12 ? 'AM' : 'PM';
    const mark = night
      ? `<circle cx="50" cy="66" r="4" fill="#E9EEF8"/><circle cx="51.8" cy="64.8" r="3.3" fill="${sky}"/>`
      : `<circle cx="50" cy="66" r="3.6" fill="#F2C14E" stroke="#B5523B" stroke-width=".6"/>`;
    const svg = `<svg viewBox="0 0 100 100" width="128" height="128" aria-hidden="true">
      <circle cx="50" cy="50" r="49" fill="#7A5634"/><circle cx="50" cy="50" r="48" fill="none" stroke="#D9B077" stroke-width="1"/>
      <circle cx="50" cy="50" r="45.5" fill="none" stroke="#2A1E14" stroke-opacity=".55" stroke-width="5"/>
      <circle cx="50" cy="50" r="45.5" fill="none" stroke="${low ? '#C0583F' : '#8DBA5A'}" stroke-width="4" stroke-linecap="round"
        stroke-dasharray="${f(e * eLen)} ${f(eLen)}" transform="rotate(-90 50 50)"/>
      <circle cx="50" cy="50" r="41" fill="${sky}" stroke="#5A3D22" stroke-width="1.4"/>
      ${face}
      <text x="50" y="38" text-anchor="middle" dominant-baseline="central" font-family="Marcellus, Georgia, serif" font-size="7" letter-spacing=".6" fill="${ink}">${ampm}</text>
      ${mark}
      <path d="M${f(tx)} ${f(ty)}L${f(hx)} ${f(hy)}" stroke="#1F3A3D" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M${f(ux)} ${f(uy)}L${f(mx)} ${f(my)}" stroke="#B5523B" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="50" cy="50" r="2.6" fill="#D9A326" stroke="#5A3D22" stroke-width=".8"/>
    </svg>`;
    return h('div.daydial', { 'data-help': 'day' },
      Dom.raw(svg),
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
