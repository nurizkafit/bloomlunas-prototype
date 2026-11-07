import { MSG } from '../../core/EventBus.js';
import { DAYS } from '../../systems/PlanValidator.js';
import { ic } from './icons.js';
import './screens.css';

/**
 * TownMapView: move in the city overworld by menu (Scene & Flow, user decision 7 Nov 2026: keep the 3D town and add this list).
 * Lists the town places with walk time and today's hours. Picking one opens its menu or station screen
 * (onPick, set by main.js); the avatar walks there when an activity starts.
 * Reads GameState; sends no state changes. Unity: town map panel.
 */
export class TownMapView {
  /** @param {HTMLElement} root @param {import('../../core/GameManager.js').GameManager} gm */
  constructor(root, gm) {
    this.gm = gm; this.c = gm.content; this.s = gm.state;
    /** Set by main.js. @param {string} _id */
    this.onPick = (_id) => {};
    this.el = document.createElement('aside');
    this.el.className = 'tmap';
    this.el.hidden = true;
    root.appendChild(this.el);
    this.el.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) { this.close(); return; }
      const b = e.target.closest('[data-place]');
      if (b) { this.close(); this.onPick(b.dataset.place); }
    });
    gm.bus.on(MSG.PHASE_ENTERED, () => this.close());
  }

  toggle() { if (this.el.hidden) this.open(); else this.close(); }

  open() { this.el.hidden = false; this.render(); }

  close() { this.el.hidden = true; }

  render() {
    const p = this.s.player, day = this.s.calendar.day, min = this.s.calendar.minute, sys = this.gm.ctx.sys.actions;
    const outer = (id) => this.c.get('locations', id).building ?? id;
    const here = outer(p.location);
    const places = this.c.all('locations').filter((l) => !l.building && l.position);
    const name = (l) => this.c.all('interiors').find((i) => i.buildingId === l.id)?.name ?? l.name;
    const rows = places.map((l) => {
      const h = l.openHours?.[day];
      const open = h && (h[0] === 0 && h[1] >= 24 ? true : min >= h[0] * 60 && min < h[1] * 60);
      const hrs = !h ? `Closed on ${DAYS[day]}` : h[0] === 0 && h[1] >= 24 ? 'Open all day' : `${h[0]}:00–${h[1]}:00`;
      const walk = l.id === here ? 0 : sys.walkMinutes(p.location, l.id);
      return `<button class="tm-row${l.id === here ? ' here' : ''}" data-place="${l.id}">
        <span class="tm-dot ${open ? 'open' : 'shut'}"></span>
        <span class="tm-n"><b>${name(l)}</b><small>${hrs}</small></span>
        <span class="tm-w num">${l.id === here ? 'You are here' : `${walk} min`}</span></button>`;
    }).join('');
    this.el.innerHTML = `<button class="x" data-close aria-label="Close">×</button>
      <h3>${ic('flag')}Town map</h3><p class="sub">Pick a place. You walk there when you start an activity.</p>${rows}`;
  }
}
