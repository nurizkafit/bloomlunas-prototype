import { EventBus, MSG } from './EventBus.js';
import { Rng } from './Rng.js';
import { GameState } from '../model/GameState.js';
import { Ledger } from '../systems/Ledger.js';
import { SkillSystem } from '../systems/SkillSystem.js';
import { EffectApplier } from '../systems/EffectApplier.js';
import { TimeSystem } from '../systems/TimeSystem.js';
import { EconomySystem } from '../systems/EconomySystem.js';
import { StoreSystem } from '../systems/StoreSystem.js';
import { ProductionSystem } from '../systems/ProductionSystem.js';
import { ExploreSystem } from '../systems/ExploreSystem.js';
import { QuestSystem } from '../systems/QuestSystem.js';
import { DebtSystem } from '../systems/DebtSystem.js';
import { EventSystem } from '../systems/EventSystem.js';
import { PlanSystem } from '../systems/PlanSystem.js';
import { ActivityLog } from '../systems/ActivityLog.js';
import { ActionRunner } from '../systems/ActionRunner.js';
import { ObjectiveSystem } from '../systems/ObjectiveSystem.js';
import { PlanPhase } from '../phases/PlanPhase.js';
import { DoPhase } from '../phases/DoPhase.js';
import { CheckPhase } from '../phases/CheckPhase.js';
import { ActPhase } from '../phases/ActPhase.js';
import { RetroPhase } from '../phases/RetroPhase.js';

/**
 * GameManager: builds the state, the systems and the phases, and handles the intents of the views.
 * Phase order: Plan -> Do -> Check -> (last week of the month: Act) -> Plan ... -> after the last month: Retro.
 * Runs in the browser and headless in Node (no DOM, no three.js). Unity: MonoBehaviour singleton.
 */
export class GameManager {
  /** @param {import('./ContentDB.js').ContentDB} content @param {{save?:{state:any, rng:number}, seed?:number, onSave?:(gm:GameManager)=>void}} [opts] */
  constructor(content, opts = {}) {
    this.content = content;
    this.bus = new EventBus();
    this.rng = new Rng(opts.save?.rng ?? opts.seed ?? content.num('SEED'));
    this.state = opts.save?.state ?? GameState.create(content);
    this.resumed = !!opts.save;
    this.onSave = opts.onSave ?? (() => {});
    const ctx = { content, bus: this.bus, rng: this.rng, sys: /** @type {any} */ ({}) };
    Object.defineProperty(ctx, 'state', { get: () => this.state });
    this.ctx = ctx;
    const s = ctx.sys;
    s.ledger = new Ledger(ctx); s.skills = new SkillSystem(ctx); s.effects = new EffectApplier(ctx); s.time = new TimeSystem(ctx);
    s.economy = new EconomySystem(ctx); s.store = new StoreSystem(ctx); s.production = new ProductionSystem(ctx); s.explore = new ExploreSystem(ctx);
    s.quests = new QuestSystem(ctx); s.debt = new DebtSystem(ctx); s.events = new EventSystem(ctx); s.plan = new PlanSystem(ctx); s.log = new ActivityLog(ctx);
    s.actions = new ActionRunner(ctx);
    s.objectives = new ObjectiveSystem(ctx);
    this.sys = s;
    this.phases = { plan: new PlanPhase(ctx), do: new DoPhase(ctx), check: new CheckPhase(ctx), act: new ActPhase(ctx), retro: new RetroPhase(ctx) };
    this.#wire();
  }

  #wire() {
    const b = this.bus, s = this.sys;
    b.on(MSG.INTENT_SET_GOAL, ({ index, goal }) => { s.plan.setGoal(index, goal); this.#changed(); });
    b.on(MSG.INTENT_SET_PRODUCT, ({ product, qty }) => { s.plan.setProduct(product, qty); this.#changed(); });
    b.on(MSG.INTENT_SET_BUDGET, (budget) => { s.plan.setBudget(budget); this.#changed(); });
    b.on(MSG.INTENT_LOCK_PLAN, () => this.lockPlan());
    b.on(MSG.INTENT_ACTION, ({ id, params }) => this.action(id, params));
    b.on(MSG.INTENT_RESPOND_EVENT, ({ index }) => this.action('respondEvent', { index }));
    b.on(MSG.INTENT_FINISH_CHECK, (note) => this.finishCheck(note));
    b.on(MSG.INTENT_PAY_DEBT, ({ amount }) => { s.debt.pay(amount); this.#changed(); });
    b.on(MSG.INTENT_PAY_UTILITIES, () => { s.debt.payUtilities(); this.#changed(); });
    b.on(MSG.INTENT_BOOK_SERVICE, ({ id }) => { this.phases.act.book(id); this.#changed(); });
    b.on(MSG.INTENT_FINISH_ACT, () => this.finishAct());
    b.on(MSG.INTENT_TUTORIAL_SEEN, ({ id, all }) => {
      const st = this.state;
      st.tutorialSeen ??= [];
      if (id && !st.tutorialSeen.includes(id)) st.tutorialSeen.push(id);
      if (all) st.tutorialOff = true;
      this.#changed();
    });
  }

  #changed() { this.bus.emit(MSG.STATE_CHANGED, {}); }

  /** Start a new game, or resume the saved phase. */
  start() {
    if (this.resumed) this.bus.emit(MSG.PHASE_ENTERED, { phase: this.state.phase, resumed: true });
    else this.#enter('plan');
  }

  /** @param {string} name */
  #enter(name) {
    const prev = this.state.phase;
    if (prev && prev !== name) this.bus.emit(MSG.PHASE_EXITED, { phase: prev, next: name });
    this.state.phase = name;
    this.phases[name].enter();
    this.save();
    this.bus.emit(MSG.PHASE_ENTERED, { phase: name });
    this.#changed();
  }

  save() { this.onSave(this); }

  lockPlan() {
    if (this.state.phase !== 'plan') return;
    this.state.plan.locked = true;
    this.#enter('do');
  }

  /** @param {string} id @param {any} [params] */
  action(id, params) {
    const r = this.sys.actions.run(id, params);
    if (r.ok && r.endDay) {
      const next = this.phases.do.endDay();
      if (next === 'weekDone') this.#enter('check');
      else { this.save(); this.#changed(); }
    }
    return r;
  }

  /** @param {{ids?:string[], text?:string}} [note] */
  finishCheck(note = {}) {
    const st = this.state, c = this.content;
    if (st.phase !== 'check') return;
    const sum = { ...st.checkSummary, note: { ids: note.ids ?? [], text: note.text ?? '' } };
    st.weeks.push(sum);
    if (note.ids?.length || note.text) st.notes.push({ absWeek: sum.absWeek, ...sum.note });
    if (st.cal.week >= c.num('WEEKS_PER_MONTH')) { this.#enter('act'); return; }
    st.cal.week += 1;
    this.#enter('plan');
  }

  finishAct() {
    const st = this.state, c = this.content;
    if (st.phase !== 'act') return;
    this.phases.act.close();
    if (st.cal.month >= c.num('JAM_MONTHS')) { this.#enter('retro'); return; }
    st.cal.month += 1;
    st.cal.week = 1;
    this.#enter('plan');
  }

  /** Last weekly recap (Check page). */
  get lastNote() { return this.state.notes.at(-1) ?? null; }
}
