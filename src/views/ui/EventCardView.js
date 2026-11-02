import { MSG } from '../../core/EventBus.js';
import { ic } from './icons.js';

/**
 * EventCardView: the event card that interrupts Do. Situation text and the options with their costs.
 * An option the player cannot pay for is disabled with the reason. Sends intent.respondEvent only.
 * Unity: modal card prefab.
 */
export class EventCardView {
  /** @param {HTMLElement} root @param {import('../../core/GameManager.js').GameManager} gm */
  constructor(root, gm) {
    this.gm = gm; this.c = gm.content;
    this.el = document.createElement('div');
    this.el.className = 'scrim2 evscrim';
    this.el.hidden = true;
    root.appendChild(this.el);
    gm.bus.on(MSG.EVENT_FIRED, ({ event }) => this.show(event));
    gm.bus.on(MSG.EVENT_RESOLVED, () => { this.el.hidden = true; });
    gm.bus.on(MSG.PHASE_ENTERED, () => { this.el.hidden = true; });
    this.el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-resp]');
      if (b && !b.disabled) gm.bus.emit(MSG.INTENT_RESPOND_EVENT, { eventId: this.event.id, responseIndex: Number(b.dataset.resp) });
    });
  }

  /** @param {any} event EventData */
  show(event) {
    this.event = event;
    const sys = this.gm.ctx.sys.events;
    const typeTxt = { scheduled: 'Scheduled event', random: 'Random event', predicted: 'Predicted event', unexpected: 'Unexpected event' }[event.type];
    this.el.innerHTML = `<div class="modal2 evcard" role="dialog" aria-label="${event.title}">
      <div class="evtype">${ic('alert')} ${typeTxt} · ${event.theme}</div>
      <h2>${event.title}</h2>
      <p class="evtext">${event.text}</p>
      <div class="evopts">${event.responses.map((r, i) => {
        const why = sys.blocked(r);
        return `<button class="evopt" data-resp="${i}" ${why ? 'disabled' : ''}><b>${r.label}</b><small>${costText(r.effects, this.c) || 'No cost'}${why ? ` · <span class="bad">${why}</span>` : ''}</small></button>`;
      }).join('')}</div>
      <p class="hint">Time an answer uses can remove planned cards. Lesson: ${event.lesson}.</p>
    </div>`;
    this.el.hidden = false;
  }
}

/** Short cost text for an EffectData list. */
export function costText(effects, c) {
  return effects.map((e) => {
    switch (e.type) {
      case 'gold': return `${e.amount > 0 ? '+' : '−'}${Math.abs(e.amount)} G`;
      case 'time': return `${e.amount >= 60 ? `${e.amount / 60} h` : `${e.amount} min`}`;
      case 'energy': return `${e.amount > 0 ? '+' : '−'}${Math.abs(e.amount)} energy`;
      case 'item': return `${e.amount > 0 ? '+' : '−'}${Math.abs(e.amount)} ${c.get('items', e.target).name}`;
      case 'relation': return `${e.amount > 0 ? '+' : '−'}${Math.abs(e.amount)} relation`;
      case 'debt': return `${e.amount > 0 ? '+' : '−'}${Math.abs(e.amount)} G debt`;
      default: return '';
    }
  }).filter(Boolean).join(' · ');
}
