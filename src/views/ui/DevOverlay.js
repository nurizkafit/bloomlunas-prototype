import { MSG } from '../../core/EventBus.js';

/**
 * DevOverlay: developer panel. M0: shows the current phase and calendar, and a "Next phase" button.
 * It reads state from EventBus messages and sends intents. It never changes GameState.
 */
export class DevOverlay {
  /** @param {HTMLElement} root @param {import('../../core/EventBus.js').EventBus} bus */
  constructor(root, bus) {
    this.bus = bus;
    root.innerHTML = `
      <section class="dev" aria-label="Developer panel">
        <p class="dev-kicker">BloomLunas prototype · M0</p>
        <h1 class="dev-phase" id="dev-phase">–</h1>
        <p class="dev-cal" id="dev-cal">–</p>
        <button type="button" id="dev-next">Next phase</button>
      </section>`;
    this.phaseEl = root.querySelector('#dev-phase');
    this.calEl = root.querySelector('#dev-cal');
    root.querySelector('#dev-next').addEventListener('click', () => bus.emit(MSG.INTENT_NEXT_PHASE));
    bus.on(MSG.PHASE_ENTERED, ({ phase, calendar }) => {
      this.phaseEl.textContent = phase;
      this.calEl.textContent = `Month ${calendar.month} · Week ${calendar.week}`;
      root.querySelector('#dev-next').disabled = phase === 'Ending';
    });
  }
}
