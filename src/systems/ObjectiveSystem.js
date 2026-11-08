/**
 * ObjectiveSystem: the objectives list in the Journal (mini tutorial). Each objective in
 * data/objectives/objectives.json names a check; a check reads GameState only. Unity: plain C# service.
 */
export class ObjectiveSystem {
  /** @param {any} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  /** @returns {{id:string, icon:string, text:string, done:boolean}[]} */
  status() {
    const list = this.ctx.content.find('objectives', 'objectives')?.list ?? [];
    return list.map((o) => ({ id: o.id, icon: o.icon, text: o.text, done: !!this.#check(o.check) }));
  }

  #check(id) {
    const { state, sys } = this.ctx;
    const log = (station) => state.log.some((l) => l.station === station);
    switch (id) {
      case 'allGoalsSet': return state.plan.goals.every(Boolean) || state.weeks.length > 0;
      case 'productsPlanned': return sys.plan.storeGoal() > 0 || state.weeks.some((w) => w.storeGoal > 0);
      case 'jarsFilled': { const b = state.plan.budget; return (b.store > 0 && b.personal > 0 && b.buffer > 0) || state.weeks.length > 0; }
      case 'boughtMaterials': return state.ledger.some((l) => l.cat === 'store' && l.amount < 0);
      case 'crafted': return log('crafting');
      case 'dried': return log('drying');
      case 'openedStore': return log('store');
      case 'gathered': return log('explore') && state.skills.earth > 0;
      case 'questDone': return state.quests.done.length > 0;
      case 'paidMinimum': return state.debt.months.some((m) => m.shortfall === 0) || state.debt.paidThisMonth >= sys.debt.minPayment();
      default: return false;
    }
  }
}
