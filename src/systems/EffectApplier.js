import { MSG } from '../core/EventBus.js';

/**
 * EffectApplier: applies EffectData lists. All effects of activities, events, services and investments go here.
 * EffectData = { type, target, amount, variant?, tier?, label? }
 *   gold: wallet +/- amount (ledger line) · item: target item, variant, +/- amount · xp: target "path.sub" or "path"
 *   relation: target entity · energy: +/- amount (0..ENERGY_MAX) · debt: +/- debt balance · time: minutes on the clock
 *   stat: lasting change to a BalanceConfig value (target = key), read with ctx.stat(key) (investments)
 * Unity: static class or ScriptableObject-driven command list.
 */
export class EffectApplier {
  /** @param {any} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  /** @param {{type:string, target?:string, amount:number, variant?:string, tier?:string, label?:string}[]} effects @param {string} [source] */
  apply(effects, source = 'effect') {
    for (const e of effects ?? []) this.applyOne(e, source);
  }

  applyOne(e, source) {
    const { state, content, bus } = this.ctx;
    switch (e.type) {
      case 'gold':
        state.wallet.add(e.amount);
        state.ledger.add(state.calendar, e.label ?? source, e.amount, source);
        bus.emit(MSG.LEDGER_CHANGED, { gold: state.wallet.gold });
        break;
      case 'item':
        if (e.amount >= 0) state.inventory.add(e.target, e.variant ?? 'product', e.amount, { tier: e.tier ?? null, born: state.calendar.absDay() });
        else state.inventory.take(e.target, e.variant, -e.amount, { includeSpoiled: true });
        bus.emit(MSG.INVENTORY_CHANGED, { item: e.target });
        break;
      case 'xp': {
        const [path, sub] = String(e.target).split('.');
        state.skills.addXp(path, sub, e.amount);
        bus.emit(MSG.SKILL_CHANGED, { path, sub });
        break;
      }
      case 'relation':
        state.relations.add(e.target, e.amount);
        bus.emit(MSG.RELATIONSHIP_CHANGED, { entityId: e.target, points: state.relations.points[e.target] });
        break;
      case 'energy': {
        const max = content.num('ENERGY_MAX');
        state.player.energy = Math.max(0, Math.min(max, state.player.energy + e.amount));
        break;
      }
      case 'debt':
        state.debt.balance += e.amount;
        bus.emit(MSG.DEBT_CHANGED, { balance: state.debt.balance });
        break;
      case 'stat':
        state.modifiers = state.modifiers ?? {};
        state.modifiers[e.target] = (state.modifiers[e.target] ?? 0) + e.amount;
        break;
      case 'time':
        this.ctx.sys.time.advance(e.amount);
        break;
      default:
        throw new Error(`EffectApplier: unknown effect type ${e.type}`);
    }
  }
}
