import { Dom } from './Dom.js';
import { Icons } from './Icons.js';
import { PlaceView } from './PlaceView.js';

const h = Dom.h;

/**
 * ExploreView: City Outskirt, auto-explore one area (user decision). Walk on until a spot shows up;
 * the spot card shows the materials, time and energy; the player picks Gather or Skip.
 */
export class ExploreView {
  constructor(ui) { this.ui = ui; }

  render() {
    const ui = this.ui, st = ui.st;
    const per = ui.num('EXPLORE_SPOTS_PER_DAY');
    const n = st.explore.spotsToday;
    const spot = st.explore.spot;
    const pvW = ui.preview('exploreWalk');
    const x = 8 + (n / per) * 84;
    const trail = h('div.trail',
      Dom.raw(TRAIL_SVG),
      ...Array.from({ length: per }, (_, i) => h('span', { style: { position: 'absolute', left: `${8 + ((i + 1) / per) * 84}%`, bottom: '56px', transform: 'translateX(-50%)' } }, Dom.icon(i < n ? 'leaf' : 'info', 20))),
      h('div.walker', { style: { left: `${x}%` } }, Dom.medal('walk', 44)));
    const found = st.explore.found.slice(-8);
    const area = ui.c.all('spots');
    const info = h('div.grid2', { style: { marginTop: '8px' } },
      h('div', h('div.kick', 'Found today'), h('div.chipline', { style: { marginTop: '8px' } }, found.length ? found.flatMap((f) => f.loot.map((l) => Dom.chip(Icons.forItem(ui.c.get('items', l.item), l.variant), `+${l.qty}`, 'ok'))) : h('span.small.muted', '—'))),
      h('div', h('div.kick', 'This area'), h('div', { style: { display: 'grid', gridTemplateColumns: '1fr', gap: '4px', marginTop: '8px' } },
        area.map((a) => h('div.row.small', { title: a.name }, a.loot.map((l) => Dom.icon(Icons.forItem(ui.c.get('items', l.item), l.variant), 18)), h('span', a.name), h('span.spacer'), Dom.icon('clock', 12), Dom.mins(a.gatherMin))))));
    let card = null;
    if (spot) {
      const d = ui.c.get('spots', spot.id);
      const pvG = ui.preview('exploreGather');
      card = h('div.veil', { style: { position: 'absolute', borderRadius: '8px', background: 'rgba(31,58,61,.35)' } }, Dom.rattan('card', ...Dom.corners(),
        h('div.kick', 'Spot found'), h('h3', d.name),
        h('div.row', { style: { gap: '16px', justifyContent: 'center' } }, spot.loot.map((l) => { const it = ui.c.get('items', l.item); return h('div', { style: { textAlign: 'center' } }, Dom.medal(Icons.forItem(it, l.variant), 64), h('div.num', `+${l.qty}`)); })),
        h('div.costrow', h('span', Dom.icon('clock', 18), Dom.mins(d.gatherMin)), h('span', Dom.icon('energy', 18), String(d.gatherEnergy)), h('span', Dom.icon('earth', 18), `+${d.xp}`)),
        h('div.row', { style: { gap: '16px' } },
          Dom.btn('Skip', () => ui.act('exploreSkip'), { cls: 'alt', icon: 'skip' }),
          Dom.btn('Gather', () => ui.act('exploreGather'), { cls: 'gold', icon: 'leaf', disabled: !!pvG.reason, title: ui.why(pvG.reason) }))));
    }
    const body = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '16px' } },
      h('div.row', { style: { gap: '16px' } }, Dom.chip('leaf', `${per - n}/${per}`), Dom.chip('earth', `Lv ${ui.sys.skills.level('earth')}`), Dom.chip('energy', Math.round(st.energy))), info);
    return PlaceView.win(ui, 'explore', 'City outskirt', [h('div', { style: { display: 'flex', flexDirection: 'column', gap: '16px' } }, trail, body), card],
      spot ? [] : [Dom.btn('Walk on', () => ui.act('exploreWalk'), { cls: 'gold', icon: 'walk', min: pvW.min, energy: pvW.energy, disabled: !!pvW.reason, title: ui.why(pvW.reason) })], 'one');
  }
}

const TRAIL_SVG = `<svg viewBox="0 0 800 160" preserveAspectRatio="none">
 <rect width="800" height="160" fill="#F1E8D4"/>
 <g style="mix-blend-mode:multiply">
  <ellipse cx="400" cy="140" rx="520" ry="80" fill="#6E9A6A" fill-opacity=".45" filter="url(#wc)"/>
  <ellipse cx="120" cy="40" rx="160" ry="60" fill="#B9C98A" fill-opacity=".5" filter="url(#wc)"/>
  <ellipse cx="660" cy="50" rx="200" ry="60" fill="#A9B8E8" fill-opacity=".35" filter="url(#wc)"/>
  <path d="M0 120 C160 100 260 130 400 112 C540 96 640 124 800 108" stroke="#C8955A" stroke-opacity=".6" stroke-width="22" fill="none" filter="url(#wc)"/>
 </g>
 <path d="M0 120 C160 100 260 130 400 112 C540 96 640 124 800 108" stroke="#2D3B3A" stroke-width="1.2" stroke-dasharray="5 7" fill="none"/>
 <g opacity=".85"><use href="#tree" x="40" y="30" width="44" height="55"/><use href="#tree" x="250" y="20" width="50" height="62"/><use href="#tree" x="520" y="26" width="46" height="58"/><use href="#tree" x="700" y="14" width="56" height="70"/></g>
</svg>`;
