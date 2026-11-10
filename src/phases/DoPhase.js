import { Phase } from './Phase.js';
import { MSG } from '../core/EventBus.js';
import { GameState } from '../model/GameState.js';
import { Inventory } from '../model/Inventory.js';

/**
 * DoPhase: the week is played day by day. A day starts at home with an optional event card.
 * Sleep ends the day: goals are checked, a history point is saved, the next day starts.
 * After the last day of the week the machine goes to Check.
 */
export class DoPhase extends Phase {
  constructor(ctx) { super('do', ctx); }

  enter() {
    this.ctx.state.cal.day = 1;
    this.startDay();
  }

  startDay() {
    const { state, content, sys, bus } = this.ctx;
    state.cal.minute = content.num('DAY_START_HOUR') * 60;
    state.place = 'home';
    state.day = GameState.freshDay();
    state.explore = { spotsToday: 0, spot: null, found: [] };
    state.store.result = null;
    sys.quests.deliver();
    sys.events.roll();
    bus.emit(MSG.DAY_STARTED, { ...state.cal });
  }

  /** Sleep. @returns {'nextDay'|'weekDone'} */
  endDay() {
    const { state, content, sys, bus } = this.ctx;
    if (state.store.open) sys.store.close();
    const d = state.cal.day - 1;
    state.week.goalsMet[d] = sys.plan.goalMet(state.plan.goals[d], state.day);
    if (state.week.goalsMet[d]) {
      const g = content.get('goals', state.plan.goals[d]);
      const st = g.stations[0] && content.get('stations', g.stations[0]);
      sys.skills.add(st?.skill ?? 'sun', content.num('GOAL_XP'));
    }
    sys.quests.expire();
    const debt = sys.time.energyDebt();
    state.energyMax = state.day.meals > 0 ? content.num('ENERGY_MAX') : content.num('ENERGY_HUNGRY_MAX');
    state.energy = Math.max(0, state.energyMax - debt);
    state.energyDebt = debt;
    state.history.push({ day: sys.time.absDay(), gold: state.gold, debt: state.debt.balance, goal: state.plan.goals[d], met: state.week.goalsMet[d], meals: state.day.meals, workMin: state.day.workMin, food: Inventory.count(state.inv, 'meal', 'pack', '') });
    bus.emit(MSG.DAY_ENDED, { day: state.cal.day, met: state.week.goalsMet[d] });
    if (state.cal.day >= content.num('DAYS_PER_WEEK')) return 'weekDone';
    state.cal.day += 1;
    this.startDay();
    return 'nextDay';
  }
}
