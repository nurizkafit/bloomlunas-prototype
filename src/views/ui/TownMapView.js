import { Dom } from './Dom.js';
import { Calendar } from '../../model/Calendar.js';
import { PlaceView } from './PlaceView.js';

const h = Dom.h;

/**
 * TownMapView: move by menu over the 3D town (Interface Reference "City Overworld"; user decision 8 Nov 2026).
 * Left: the place list (hours today, travel time) and the card of the picked place with Go.
 * In the 3D town: a name pill over each place; a click picks it. Travel costs time and energy.
 * User feedback 8 Nov 2026: the town opens on the whole map (all places in view); a pick zooms the camera to that
 * place; Go plays the player walk (UiRoot.travel), then the place opens.
 */
export class TownMapView {
  constructor(ui) { this.ui = ui; }

  render() {
    const ui = this.ui, st = ui.st, L = ui.local;
    const places = ui.c.all('places').sort((a, b) => a.travelMin - b.travelMin);
    const sel = ui.c.find('places', L.pick.place) ?? places.find((p) => p.id !== st.place);
    if (L.pick.place !== sel?.id) L.pick = { ...L.pick, place: sel?.id };
    const pickP = (id) => ui.set({ pick: { ...L.pick, place: id, zoom: true } });
    const rows = places.map((p) => {
      const here = p.id === st.place;
      const pv = ui.preview('travel', { place: p.id });
      return h(`button.srow${p === sel ? '.on' : ''}${here ? '.here' : ''}`, { onclick: () => pickP(p.id) },
        h('span.si', Dom.icon(p.icon, 22)), h('span.t', p.name),
        h('span.m', here ? h('span.small', { title: 'You are here' }, Dom.icon('walk', 16)) : h('span.small', Dom.icon('clock', 14), Dom.mins(pv.min)), PlaceView.hoursChip(ui, p)));
    });
    for (const p of places) {
      ui.spot('place', p.id, h(`button.hot.place${p === sel ? '.on' : ''}${p.id === st.place ? '.here' : ''}`, { onclick: () => pickP(p.id) }, Dom.icon(p.icon, 18), p.name));
    }
    return [h('div.side',
      PlaceView.header(ui, 'map', 'Town', h('span.hchip', Dom.icon('clock', 14), Calendar.clock(st.cal.minute))),
      Dom.slim('smenu', ...rows, h('div.sdiv'),
        L.pick.zoom ? h('button.srow', { onclick: () => ui.set({ pick: { ...L.pick, zoom: false } }) }, h('span.si', Dom.icon('map', 22)), h('span.t', 'Whole town')) : null,
        h('button.srow', { onclick: () => ui.set({ map: false }) }, h('span.si', Dom.icon('back', 22)), h('span.t', 'Back'), h('span.m', h('i.key', 'M')))),
      sel ? this.#info(sel) : null)];
  }

  #info(p) {
    const ui = this.ui, st = ui.st;
    const pv = ui.preview('travel', { place: p.id });
    const arrive = st.cal.minute + pv.min;
    const here = p.id === st.place;
    return Dom.slim('pinfo',
      h('div.row', Dom.medal(p.icon, 36), h('b', p.name)),
      h('div.chipline', p.stations.map((s) => { const sd = ui.c.get('stations', s); return h('span.qchip.named', { title: sd.name }, Dom.icon(sd.icon, 16), sd.name); })),
      h('div.costrow', { style: { justifyContent: 'flex-start' } },
        h('span', { title: 'Travel time' }, Dom.icon('clock', 16), Dom.mins(pv.min)), h('span', { title: 'Energy' }, Dom.icon('energy', 16), `-${pv.energy}`),
        h('span', { title: 'Arrive at' }, Dom.icon('walk', 16), `arrive ${Calendar.clock(Math.min(arrive, 24 * 60 - 1))}`)),
      here ? h('span.qchip.ok', Dom.icon('walk', 16), 'You are here')
        : Dom.btn('Go', () => ui.travel(p.id), { cls: 'gold.sm', icon: 'walk', disabled: !!pv.reason, title: ui.why(pv.reason) }),
      pv.reason && !here ? h('div.small', { style: { color: 'var(--red)' } }, ui.why(pv.reason)) : null);
  }
}
