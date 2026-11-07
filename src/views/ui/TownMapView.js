import { Dom } from './Dom.js';
import { Icons } from './Icons.js';
import { Calendar } from '../../model/Calendar.js';

const h = Dom.h;
/** Map positions (percent of the map window). View data only. */
const POS = { home: [22, 66], market: [48, 40], guild: [72, 26], outskirt: [80, 74] };

/**
 * TownMapView: the Town map menu (user decision: movement by map; City View is the backdrop).
 * Each place shows travel time, today's hours and open/closed. Travel costs time and energy.
 */
export class TownMapView {
  constructor(ui) { this.ui = ui; }

  render() {
    const ui = this.ui, st = ui.st;
    const places = ui.c.all('places');
    const sel = ui.c.find('places', ui.local.pick.place) ?? places.find((p) => p.id !== st.place);
    const node = (p) => {
      const pv = ui.preview('travel', { place: p.id });
      const hrs = ui.sys.time.hoursToday(p);
      const here = p.id === st.place;
      const closed = !hrs || (!here && pv.reason === 'closed');
      return h(`button.node${here ? '.here' : ''}${closed ? '.closed' : ''}`, { style: { left: `${POS[p.id][0]}%`, top: `${POS[p.id][1]}%` }, onclick: () => ui.set({ pick: { ...ui.local.pick, place: p.id } }), title: p.name },
        Dom.medal(p.icon, 64), h('span.lbl', p.name),
        h('span.meta', here ? h('span', Dom.icon('walk', 14), 'here') : h('span', Dom.icon('clock', 14), Dom.mins(pv.min)),
          h('span', Dom.icon(closed ? 'lock' : 'clock', 14), hrs ? `${hrs[0]}–${hrs[1]}` : 'shut')));
    };
    const info = sel ? this.#info(sel) : null;
    return [
      h('div.stag', Dom.icon('map', 24), 'Town map'),
      Dom.rattan('mapwin',
        Dom.raw(MAP_SVG),
        ...places.map(node),
        info,
        h('button.iconbtn.close', { title: 'Close', onclick: () => ui.set({ map: false }), html: Icons.svg('x', 16) }))
    ];
  }

  #info(p) {
    const ui = this.ui, st = ui.st;
    const pv = ui.preview('travel', { place: p.id });
    const hrs = ui.sys.time.hoursToday(p);
    const arrive = st.cal.minute + pv.min;
    const here = p.id === st.place;
    return Dom.slim('mapinfo',
      h('h5', Dom.icon(p.icon, 26), p.name),
      h('div.chipline', p.stations.map((s) => { const sd = ui.c.get('stations', s); return h('span.qchip', { title: sd.name }, Dom.icon(sd.icon, 18)); })),
      h('div.costrow', { style: { justifyContent: 'flex-start' } },
        h('span', Dom.icon('clock', 16), Dom.mins(pv.min)), h('span', Dom.icon('energy', 16), String(pv.energy)),
        h('span', Dom.icon('walk', 16), Calendar.clock(Math.min(arrive, 24 * 60 - 1)))),
      h('div.row', Dom.icon(hrs ? 'clock' : 'lock', 16), h('span.small', hrs ? `${hrs[0]}:00–${hrs[1]}:00` : 'Closed today')),
      here ? h('span.qchip.ok', Dom.icon('walk', 16), 'You are here')
        : Dom.btn('Go', () => { ui.local.map = false; ui.local.station = null; ui.local.pick = {}; ui.act('travel', { place: p.id }); }, { cls: 'gold', icon: 'walk', disabled: !!pv.reason, title: pv.reason || '' }));
  }
}

const MAP_SVG = `<svg class="mapsvg" viewBox="0 0 960 520" preserveAspectRatio="xMidYMid slice">
 <rect width="960" height="520" fill="#F1E8D4"/><rect width="960" height="520" filter="url(#paperF)"/>
 <g style="mix-blend-mode:multiply">
  <ellipse cx="480" cy="260" rx="560" ry="330" fill="#B9C98A" fill-opacity=".38" filter="url(#wc)"/>
  <ellipse cx="180" cy="380" rx="200" ry="140" fill="#6E9A6A" fill-opacity=".45" filter="url(#wc)"/>
  <ellipse cx="780" cy="400" rx="220" ry="150" fill="#6E9A6A" fill-opacity=".55" filter="url(#wc)"/>
  <ellipse cx="700" cy="120" rx="170" ry="100" fill="#9C87C0" fill-opacity=".25" filter="url(#wc)"/>
  <path d="M-20 120 C120 160 260 90 380 150 C480 200 560 150 620 60 L640 -20 L-20 -20Z" fill="#7FB5C9" fill-opacity=".42" filter="url(#wc)"/>
  <path d="M211 343 C300 300 380 260 460 208 M460 208 C540 180 620 150 691 135 M460 208 C560 260 660 330 768 385" fill="none" stroke="#C8955A" stroke-opacity=".6" stroke-width="30" filter="url(#wc)"/>
 </g>
 <path d="M211 343 C300 300 380 260 460 208 M460 208 C540 180 620 150 691 135 M460 208 C560 260 660 330 768 385" fill="none" stroke="#2D3B3A" stroke-width="1.4" stroke-dasharray="6 8" filter="url(#rough)"/>
 <g filter="url(#rough)" opacity=".9">
  <use href="#tree" x="80" y="300" width="50" height="62"/><use href="#tree" x="120" y="420" width="40" height="50"/><use href="#tree" x="300" y="420" width="44" height="55"/>
  <use href="#tree" x="840" y="300" width="56" height="70"/><use href="#tree" x="880" y="420" width="46" height="58"/><use href="#tree" x="700" y="440" width="50" height="62"/>
  <use href="#tree" x="600" y="360" width="40" height="50"/><use href="#tree" x="380" y="320" width="36" height="45"/>
  <use href="#house" x="520" y="250" width="50" height="45"/><use href="#house" x="580" y="70" width="44" height="40"/><use href="#house" x="300" y="200" width="40" height="36"/>
 </g>
 <g transform="translate(880 60)" opacity=".85"><circle r="34" fill="none" stroke="#8A6238" stroke-width="1.5"/><path d="M0 -40 L6 0 L0 40 L-6 0Z" fill="#1F3A3D"/><path d="M-40 0 L0 -5 L40 0 L0 5Z" fill="#C8955A"/><text y="-46" text-anchor="middle" font-family="Marcellus" font-size="14" fill="#1F3A3D">N</text></g>
</svg>`;
