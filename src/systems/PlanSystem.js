import { MSG } from '../core/EventBus.js';
import { Inventory } from '../model/Inventory.js';

/**
 * PlanSystem: the week plan in the Journal. Daily goals (one per day), store planning
 * (products to sell -> materials needed), budget jars (Store, Personal, Buffer).
 * forecast() is the plan check: numbers and warnings, never a block. Unity: plain C# service.
 */
export class PlanSystem {
  /** @param {any} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  /** @param {number} dayIndex 0..6 @param {string|null} goalId */
  setGoal(dayIndex, goalId) {
    const { state } = this.ctx;
    if (state.phase !== 'plan' && dayIndex < state.cal.day) return false; // only days not started
    state.plan.goals[dayIndex] = goalId;
    return true;
  }

  /** @param {string} productId @param {number} qty */
  setProduct(productId, qty) {
    const p = this.ctx.state.plan.products;
    if (qty > 0) p[productId] = qty; else delete p[productId];
  }

  /** @param {{store?:number, personal?:number, buffer?:number}} b */
  setBudget(b) {
    const cur = this.ctx.state.plan.budget;
    for (const k of ['store', 'personal', 'buffer']) if (b[k] !== undefined) cur[k] = Math.max(0, Math.round(b[k]));
  }

  /** A first plan the player can change: last week's goals, a fair budget split. */
  suggest() {
    const { state, content } = this.ctx;
    const last = state.weeks.at(-1)?.goals;
    state.plan.goals = last ? [...last] : ['craft', 'store', 'trade', 'explore', 'craft', 'store', 'free'];
    if (!Object.keys(state.plan.products).length) state.plan.products = { kunyit_asam: 12 };
    const personal = content.num('FOOD_PRICE') * content.num('MEALS_PER_DAY') * content.num('DAYS_PER_WEEK');
    const buffer = Math.min(Math.round(state.gold * 0.3 / 10) * 10, Math.max(0, state.gold - personal));
    const store = Math.max(0, Math.floor((state.gold - personal - buffer) / 10) * 10);
    state.plan.budget = { store, personal: Math.min(personal, state.gold), buffer };
  }

  /** Materials for the store plan: per input, need, have, buy, cost. */
  materials() {
    const { state, content, sys } = this.ctx;
    const need = {};
    for (const [pid, qty] of Object.entries(state.plan.products)) {
      const r = content.get('recipes', pid);
      const batches = Math.ceil(qty / r.outputPerBatch);
      for (const i of r.inputs) {
        const k = `${i.item}|${i.variant}`;
        need[k] = (need[k] ?? 0) + i.qty * batches;
      }
    }
    return Object.entries(need).map(([k, n]) => {
      const [item, variant] = k.split('|');
      const have = Inventory.count(state.inv, item, variant, '');
      const process = variant === 'dried' || variant === 'powder' ? variant : null;
      const buyVariant = process ? 'fresh' : variant;
      const buy = Math.max(0, n - have);
      const unit = sys.economy.buyPrice(item, buyVariant);
      return { item, variant, need: n, have, buy, buyVariant, process, unit, cost: Math.round(buy * unit) };
    });
  }

  /** Store's goal: units to sell this week. */
  storeGoal() {
    return Object.values(this.ctx.state.plan.products).reduce((s, q) => s + q, 0);
  }

  /** Plan check: numbers for the top lines and warnings (never blocks). */
  forecast() {
    const { state, content, sys, bus } = this.ctx;
    const b = state.plan.budget;
    const mats = this.materials();
    const matCost = mats.reduce((s, m) => s + m.cost, 0);
    const living = content.num('WEEKLY_EXPENSES');
    const sales = Object.entries(state.plan.products).reduce((s, [pid, q]) => s + q * sys.economy.productValue(pid, sys.skills.tier()), 0);
    const monthEnd = state.cal.week === content.num('WEEKS_PER_MONTH');
    const due = monthEnd ? sys.debt.dueLeft() + content.num('MONTHLY_UTILITIES') : 0;
    const goldAfter = Math.round(state.gold - matCost - b.personal - living + sales * 0.8);
    const warnings = [];
    const total = b.store + b.personal + b.buffer;
    if (total > state.gold) warnings.push({ id: 'over', icon: 'gold', text: 'Jars hold more gold than you have.' });
    if (matCost > b.store) warnings.push({ id: 'store', icon: 'cart', text: 'Materials cost more than the Store jar.' });
    if (b.personal < content.num('FOOD_PRICE') * content.num('DAYS_PER_WEEK')) warnings.push({ id: 'food', icon: 'meal', text: 'Personal jar is low for food.' });
    if (state.plan.goals.some((g) => !g)) warnings.push({ id: 'goals', icon: 'calendar', text: 'Some days have no goal.' });
    if (monthEnd && goldAfter < due) warnings.push({ id: 'due', icon: 'debt', text: 'Gold after plan is below the month-end bills.' });
    const f = { matCost, living, sales: Math.round(sales), goldAfter, due, monthEnd, storeGoal: this.storeGoal(), warnings, materials: mats };
    bus.emit(MSG.PLAN_VALIDATED, f);
    return f;
  }

  /** Was the goal of a day met? Uses the stations used that day and work time. @param {string} goalId @param {{stations:Record<string,number>, workMin:number}} day */
  goalMet(goalId, day) {
    if (!goalId) return null;
    const { content } = this.ctx;
    const g = content.get('goals', goalId);
    if (goalId === 'free') return day.workMin <= content.num('FREE_TIME_MAX_WORK_MIN');
    return g.stations.some((s) => (day.stations[s] ?? 0) > 0);
  }
}
