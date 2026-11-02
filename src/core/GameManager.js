import { EventBus, MSG } from './EventBus.js';
import { PhaseMachine } from './PhaseMachine.js';
import { GameState } from '../model/GameState.js';
import { PlanPhase } from '../phases/PlanPhase.js';
import { DoPhase } from '../phases/DoPhase.js';
import { CheckPhase } from '../phases/CheckPhase.js';
import { ActPhase } from '../phases/ActPhase.js';
import { EndingPhase } from '../phases/EndingPhase.js';

/**
 * GameManager: boots the game. Owns the EventBus, GameState, systems and PhaseMachine.
 * Unity: MonoBehaviour singleton in a boot scene.
 */
export class GameManager {
  /** @param {import('./ContentDB.js').ContentDB} content @param {{log?: (line:string)=>void}} [opts] */
  constructor(content, opts = {}) {
    this.content = content;
    this.bus = new EventBus();
    this.state = GameState.create(content);
    this.log = opts.log ?? (() => {});
    const phases = {
      Plan: new PlanPhase(),
      Do: new DoPhase(),
      Check: new CheckPhase(),
      Act: new ActPhase(),
      Ending: new EndingPhase()
    };
    this.ctx = { state: this.state, content, bus: this.bus, log: this.log };
    this.machine = new PhaseMachine(this.bus, phases, this.ctx);
    this.bus.on(MSG.INTENT_NEXT_PHASE, () => this.machine.advance());
  }

  start() {
    this.machine.start('Plan');
  }
}
