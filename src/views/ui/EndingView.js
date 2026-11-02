import { MSG } from '../../core/EventBus.js';

/**
 * EndingView: shows the ending text from EndingData and the key numbers. "New game" clears the save.
 * Unity: ending scene.
 */
export class EndingView {
  /** @param {HTMLElement} root @param {import('../../core/GameManager.js').GameManager} gm @param {()=>void} onRestart */
  constructor(root, gm, onRestart) {
    this.gm = gm;
    this.el = document.createElement('div');
    this.el.className = 'screen';
    this.el.hidden = true;
    root.appendChild(this.el);
    gm.bus.on(MSG.PHASE_ENTERED, ({ phase }) => { this.el.hidden = phase !== 'Ending'; if (phase === 'Ending') this.render(); });
    this.el.addEventListener('click', (e) => { if (e.target.closest('#restart')) onRestart(); });
  }

  render() {
    const s = this.gm.state, e = this.gm.content.get('endings', s.endingId);
    this.el.innerHTML = `<div class="sheet ending ${e.id}">
      <p class="lead">Month ${s.calendar.month}</p>
      <h1>${e.title}</h1>
      <p class="endtext">${e.text}</p>
      <div class="kv2"><span>Debt</span><b class="num">${s.debt.balance.toFixed(2)} G</b><span>Gold</span><b class="num">${s.wallet.gold.toFixed(2)} G</b>
        <span>Interest paid in total</span><b class="num">${s.debt.interestTotal.toFixed(2)} G</b><span>Hidden fees in total</span><b class="num">${s.debt.feesTotal.toFixed(2)} G</b></div>
      <div class="acts"><button class="go" id="restart">New game</button></div>
    </div>`;
  }
}
