import { MSG } from '../../core/EventBus.js';

/**
 * DevOverlay: small developer panel in a corner. Shows the phase and calendar, and a "Next phase" button
 * (skips the current screen). M7 adds Spec pins. It sends intents only. It never changes GameState.
 */
export class DevOverlay {
  /** @param {HTMLElement} root @param {import('../../core/EventBus.js').EventBus} bus */
  constructor(root, bus) {
    root.insertAdjacentHTML('beforeend', `
      <section class="dev" aria-label="Developer panel">
        <span class="dev-kicker">DEV</span>
        <b id="dev-phase">–</b>
        <span id="dev-cal">–</span>
        <button type="button" id="dev-next" title="Skip to the next phase">Next phase ›</button>
      </section>`);
    const phaseEl = root.querySelector('#dev-phase'), calEl = root.querySelector('#dev-cal'), next = root.querySelector('#dev-next');
    next.addEventListener('click', () => bus.emit(MSG.INTENT_NEXT_PHASE));
    bus.on(MSG.PHASE_ENTERED, ({ phase, calendar }) => {
      phaseEl.textContent = phase;
      calEl.textContent = `M${calendar.month} W${calendar.week}`;
      next.disabled = phase === 'Ending';
    });
  }
}
