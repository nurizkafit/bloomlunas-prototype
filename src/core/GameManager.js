import { EventBus, MSG } from './EventBus.js';
import { PhaseMachine } from './PhaseMachine.js';
import { Rng } from './Rng.js';
import { GameState } from '../model/GameState.js';
import { TimeSystem } from '../systems/TimeSystem.js';
import { EffectApplier } from '../systems/EffectApplier.js';
import { QualityCalculator } from '../systems/QualityCalculator.js';
import { ProductionSystem } from '../systems/ProductionSystem.js';
import { EconomySystem } from '../systems/EconomySystem.js';
import { DebtSystem } from '../systems/DebtSystem.js';
import { ActionRunner } from '../systems/ActionRunner.js';
import { PlanValidator } from '../systems/PlanValidator.js';
import { EventSystem } from '../systems/EventSystem.js';
import { PlanPhase } from '../phases/PlanPhase.js';
import { DoPhase } from '../phases/DoPhase.js';
import { CheckPhase } from '../phases/CheckPhase.js';
import { ActPhase } from '../phases/ActPhase.js';
import { EndingPhase } from '../phases/EndingPhase.js';

/**
 * GameManager: boots the game. Owns the EventBus, GameState, Rng, systems and PhaseMachine.
 * ctx = { state, content, bus, rng, sys, log } is passed to every phase and system.
 * Unity: MonoBehaviour singleton in a boot scene.
 */
export class GameManager {
  /** @param {import('./ContentDB.js').ContentDB} content @param {{log?: (line:string)=>void, seed?: number}} [opts] */
  constructor(content, opts = {}) {
    this.content = content;
    this.bus = new EventBus();
    this.state = GameState.create(content);
    this.rng = new Rng(opts.seed ?? content.num('SEED'));
    this.log = opts.log ?? (() => {});
    this.ctx = { state: this.state, content, bus: this.bus, rng: this.rng, log: this.log, sys: {} };
    const sys = this.ctx.sys;
    sys.time = new TimeSystem(this.ctx);
    sys.effects = new EffectApplier(this.ctx);
    sys.quality = new QualityCalculator(content.config('QualityConfig'));
    sys.production = new ProductionSystem(this.ctx);
    sys.economy = new EconomySystem(this.ctx);
    sys.debt = new DebtSystem(this.ctx);
    sys.actions = new ActionRunner(this.ctx);
    sys.plan = new PlanValidator(this.ctx);
    sys.events = new EventSystem(this.ctx);
    const phases = {
      Plan: new PlanPhase(),
      Do: new DoPhase(),
      Check: new CheckPhase(),
      Act: new ActPhase(),
      Ending: new EndingPhase()
    };
    this.machine = new PhaseMachine(this.bus, phases, this.ctx);
    this.bus.on(MSG.INTENT_NEXT_PHASE, () => this.machine.advance());
  }

  start() {
    this.machine.start('Plan');
  }
}
