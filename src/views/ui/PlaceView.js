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
 * PlaceView: the Do screen at one place, inside its 3D room (user decisions 8 Nov 2026).
 * Left: one location header frame and a compact station menu (Interface Reference command list).
 * In the room: a hotspot pill over each station. Right: the open station window (rattan main frame).
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
    if (L.station && !place.stations.includes(L.station)) L.station = null;
    const open = ui.sys.time.isOpen(place);
    const homeMin = ui.preview('travel', { place: 'home' }).min;
    const side = h('div.side',
      PlaceView.header(ui, place.icon, place.name, PlaceView.hoursChip(ui, place)),
      Dom.slim('smenu',
        ...place.stations.map((id) => this.#row(id, open)),
        h('div.sdiv'),
        h('button.srow', { onclick: () => ui.set({ map: true, station: null, pick: {} }), 'data-help': 'town' }, h('span.si', Dom.icon('map', 22)), h('span.t', 'Town'), h('span.m', h('i.key', 'M'))),
        st.place !== 'home' ? h('button.srow', { onclick: () => ui.travel('home') }, h('span.si', Dom.icon('house', 22)), h('span.t', 'Go home'), h('span.m', Dom.icon('clock', 14), Dom.mins(homeMin))) : null));
    for (const id of L.station || L.recap ? [] : place.stations) {
      const s = ui.c.get('stations', id);
      const shut = !open && id !== 'store' && id !== 'rest';
      ui.spot('station', id, h(`button.hot${L.station === id ? '.on' : ''}`, { onclick: () => ui.set({ station: L.station === id ? null : id, pick: {} }), disabled: shut }, Dom.icon(s.icon, 18), s.name));
    }
    // Whole-room GLB (user, 14 Nov 2026): each action has its own hotspot and runs at once (Rest: sleep, eat, short break).
    for (const x of L.station || L.recap ? [] : ui.o.scene?.actions?.() ?? []) {
      const pv = ui.preview(x.id);
      ui.spot('action', x.id, h('button.hot.act', { onclick: () => ui.act(x.id), disabled: !!pv.reason, title: ui.why(pv.reason) }, Dom.icon(x.icon, 18), x.label));
    }
    // Home doors: move between the rooms.
    for (const d of L.station || L.recap ? [] : ui.o.scene?.doors?.() ?? []) {
      ui.spot('door', d.to, h('button.hot.door', { onclick: () => ui.set({ door: { to: d.to }, station: null }) }, Dom.icon('house', 18), d.label));
    }
    const els = [side];
    if (L.station) els.push(this.stations[L.station].render());
    if (L.recap) els.push(this.#recap(L.recap));
    return els;
  }

  /** One location header frame (icon, name, a chip). Used by the place and the town list. */
  static header(ui, icon, name, chip) {
    return Dom.slim('lochead', Dom.medal(icon, 40), h('div.t', name), chip);
  }

  /** Today's hours, tinted open or closed. */
  static hoursChip(ui, place) {
    const hrs = ui.sys.time.hoursToday(place), open = ui.sys.time.isOpen(place);
    return h(`span.hchip${open ? '' : '.shut'}`, { 'data-help': 'hours' }, Dom.icon(open ? 'clock' : 'lock', 14), hrs ? (hrs[0] === 0 && hrs[1] === 24 ? 'Open' : `${hrs[0]}–${hrs[1]}`) : 'Closed');
  }

  #row(id, open) {
    const ui = this.ui, L = ui.local;
    const s = ui.c.get('stations', id);
    const shut = !open && id !== 'store' && id !== 'rest';
    return h(`button.srow${L.station === id ? '.on' : ''}`, { onclick: () => ui.set({ station: L.station === id ? null : id, pick: {} }), disabled: shut, title: shut ? 'Closed at this hour' : s.name },
      h('span.si', Dom.icon(s.icon, 22)), h('span.t', s.name), h('span.m', this.#badge(id)));
  }

  /** Exploration recap (user feedback D10). */
  #recap(r) {
    const ui = this.ui;
    const close = (map) => ui.set({ recap: null, map });
    return h('div.veil', Dom.rattan('card.recap',
      h('div.kick', 'Back from the outskirt'), h('h3', 'Your herb basket'),
      h('div.costrow', h('span', { title: 'Walks' }, Dom.icon('walk', 18), String(r.walks)), h('span', { title: 'Gathered' }, Dom.icon('leaf', 18), String(r.gathered)), h('span', { title: 'Skipped' }, Dom.icon('skip', 18), String(r.skipped))),
      h('div', { style: { width: '100%' } },
        r.items.length ? r.items.map((l) => { const it = ui.c.get('items', l.item); return h('div.ln.sm', ui.itemBtn(l.item, l.variant, null, 20), h('span', it.name), h('span.small.muted', l.variant), h('span.v.pos', `+${l.qty}`)); })
          : h('div.small.muted', { style: { textAlign: 'center' } }, 'Your basket is empty this time.'),
        h('div.ln.sm', Dom.icon('clock', 18), 'Time', h('span.v', Dom.mins(r.min))),
        h('div.ln.sm', Dom.icon('energy', 18), 'Energy', h('span.v.neg', `-${r.energy}`)),
        h('div.ln.sm', Dom.icon('earth', 18), 'Earth XP', h('span.v.pos', `+${r.xp}`))),
      h('div.row', { style: { gap: '16px' } },
        Dom.btn('Stay', () => close(false), { cls: 'alt', icon: 'back' }),
        Dom.btn('Town', () => close(true), { cls: 'gold', icon: 'map' }))));
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
