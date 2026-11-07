import { Dom } from './Dom.js';
import { Icons } from './Icons.js';
import { StoreView } from './StoreView.js';
import { CraftView } from './CraftView.js';
import { DryingView } from './DryingView.js';
import { GrindView } from './GrindView.js';
import { RestView } from './RestView.js';
import { StallView } from './StallView.js';
import { ReceptionView } from './ReceptionView.js';
import { QuestBoardView } from './QuestBoardView.js';
import { ExploreView } from './ExploreView.js';

const h = Dom.h;

/**
 * PlaceView: the Do screen at one place. Left: station cards (slim frames). Right: the open station
 * window (rattan main frame). With no station open, the 3D City View shows.
 */
export class PlaceView {
  constructor(ui) {
    this.ui = ui;
    this.stations = {
      store: new StoreView(ui), crafting: new CraftView(ui), drying: new DryingView(ui), grinding: new GrindView(ui), rest: new RestView(ui),
      stall: new StallView(ui), receptionist: new ReceptionView(ui), questboard: new QuestBoardView(ui), explore: new ExploreView(ui)
    };
  }

  render() {
    const ui = this.ui, st = ui.st, L = ui.local;
    const place = ui.c.get('places', st.place);
    if (st.place === 'outskirt' && !L.station) L.station = 'explore';
    if (L.station && !place.stations.includes(L.station)) L.station = null;
    const hrs = ui.sys.time.hoursToday(place);
    const open = ui.sys.time.isOpen(place);
    const side = h('div.side',
      Dom.slim('', Dom.medal(place.icon, 44), h('div', h('div', { style: { fontFamily: 'var(--head)', fontSize: '18px' } }, place.name),
        h('div.row.small', Dom.icon(open ? 'clock' : 'lock', 14), hrs ? `${hrs[0]}–${hrs[1]}` : 'Closed'))),
      ...place.stations.map((id) => this.#card(id, open)),
      h('div.row', { style: { marginTop: '8px' } }, Dom.btn('Map', () => ui.set({ map: true }), { cls: 'alt.sm', icon: 'map' }),
        st.place !== 'home' ? Dom.btn('Home', () => { L.station = null; ui.act('travel', { place: 'home' }); }, { cls: 'sm', icon: 'house', min: ui.preview('travel', { place: 'home' }).min }) : null));
    const els = [h('div.stag', Dom.icon(place.icon, 24), place.name), side];
    if (L.station) els.push(this.stations[L.station].render());
    return els;
  }

  #card(id, open) {
    const ui = this.ui, L = ui.local;
    const s = ui.c.get('stations', id);
    const badge = this.#badge(id);
    const shut = !open && id !== 'store' && id !== 'rest';
    return h(`button.stcard${L.station === id ? '.on' : ''}`, { onclick: () => ui.set({ station: L.station === id ? null : id, pick: {} }), disabled: shut, title: s.name },
      Dom.slim(L.station === id ? 'on' : '', Dom.medal(s.icon, 40), h('span.t', s.name), h('span.m', badge)));
  }

  #badge(id) {
    const ui = this.ui, st = ui.st, sys = ui.sys;
    if (id === 'store') return [Dom.icon('shelf', 16), String(sys.economy.shelfUnits())];
    if (id === 'drying') {
      const ready = st.rack.filter((b) => b.readyDay <= sys.time.absDay()).length;
      return ready ? h('span.badge.ok', String(ready)) : [Dom.icon('rack', 16), `${sys.production.rackUsed()}/${sys.production.rackCapacity()}`];
    }
    if (id === 'questboard') return [Dom.icon('quest', 16), `${st.quests.active.length}`];
    if (id === 'explore') return [Dom.icon('leaf', 16), String(sys.explore.spotsLeft())];
    if (id === 'rest') return [Dom.icon('meal', 16), `${st.day.meals}/${ui.num('MEALS_PER_DAY')}`];
    return null;
  }

  /** Shared station window. @param {string} icon @param {string} title @param {any[]} body @param {any[]} [foot] @param {string} [cols] */
  static win(ui, icon, title, body, foot = [], cols = 'cols-5-7') {
    return Dom.rattan('win',
      h('div.plate', Dom.icon(icon, 20), title),
      h(`div.body.${cols}`, ...body),
      foot.length ? h('div.foot', ...foot) : null,
      h('button.iconbtn.close', { title: 'Close', onclick: () => ui.set({ station: null, pick: {} }), html: Icons.svg('x', 16) }));
  }
}
