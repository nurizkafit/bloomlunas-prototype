import { Inventory } from '../model/Inventory.js';

/**
 * EffectApplier: applies EffectData lists (events, services).
 * Types: gold, item, xp, energy, time, debt, demand, stat. Unity: static C# class.
 */
export class EffectApplier {
  /** @param {any} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  /** @param {any[]} effects @param {string} source label for the ledger */
  apply(effects, source) {
    const { state, content, sys } = this.ctx;
    for (const e of effects ?? []) {
      switch (e.type) {
        case 'gold': sys.ledger.add(e.amount, e.label ?? source, e.amount < 0 ? (e.budget ?? 'personal') : 'other'); break;
        case 'item': {
          const item = content.get('items', e.target);
          const variant = e.variant ?? item.variants[0];
          if (e.amount < 0) Inventory.take(state.inv, e.target, variant, -e.amount, item.kind === 'product' ? tiersLowFirst(content) : ['']);
          else Inventory.add(state.inv, e.target, variant, e.amount, item.kind === 'product' ? sys.skills.tier() : '');
          break;
        }
        case 'xp': sys.skills.add(e.target, e.amount); break;
        case 'energy': state.energy = clamp(state.energy + e.amount, content.num('ENERGY_MIN'), state.energyMax); break;
        case 'time': sys.time.advance(e.amount, true); break;
        case 'debt': state.debt.balance = round2(state.debt.balance + e.amount); state.debt.carriedTotal += Math.max(0, e.amount); break;
        case 'demand': state.market.demandMod = e.amount; state.market.demandUntil = sys.time.absDay() + (e.days ?? 1) - 1; break;
        case 'stat': state.boosts[e.target] = (state.boosts[e.target] ?? 0) + e.amount; break;
        default: throw new Error(`Unknown effect type ${e.type}`);
      }
    }
  }
}

/** Product tiers, lowest first (so gifts use the cheapest stock). @param {any} content */
export function tiersLowFirst(content) {
  return Object.keys(content.num('QUALITY_TIERS'));
}

/** @param {number} n @param {number} lo @param {number} hi */
export function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

/** @param {number} n */
export function round2(n) {
  return Math.round(n * 100) / 100;
}
