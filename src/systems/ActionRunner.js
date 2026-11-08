import { MSG } from '../core/EventBus.js';
import { Inventory } from '../model/Inventory.js';

/**
 * ActionRunner: the one door for every Do action. It checks place, opening hours, time and energy,
 * runs the system call, spends time and energy, writes the station time (for daily goals) and the log.
 * Views send `intent.action` {id, params}; the result goes back as `action.done` or `action.refused`.
 * Unity: plain C# service with one method per action.
 */
export class ActionRunner {
  /** @param {any} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  get #n() { return (k) => this.ctx.content.num(k); }

  /** Cost preview for a button: {min, energy, reason}. @param {string} id @param {any} [params] */
  preview(id, params = {}) {
    const a = this.#def(id, params);
    if (!a) return { min: 0, energy: 0, reason: 'unknown' };
    return { min: a.min ?? 0, energy: a.energy ?? 0, reason: this.#why(a, params) };
  }

  /** @param {string} id @param {any} [params] */
  run(id, params = {}) {
    const { bus, state } = this.ctx;
    const a = this.#def(id, params);
    const reason = a ? this.#why(a, params) : 'unknown';
    if (reason) {
      const r = { ok: false, id, reason, text: REASON_TEXT[reason] ?? reason };
      bus.emit(MSG.ACTION_REFUSED, r);
      return r;
    }
    const out = a.run() ?? {};
    if (out.ok === false) {
      const r = { ok: false, id, reason: out.reason, text: REASON_TEXT[out.reason] ?? out.reason };
      bus.emit(MSG.ACTION_REFUSED, r);
      return r;
    }
    const min = out.min ?? a.min ?? 0, energy = out.energy ?? a.energy ?? 0;
    if (min || energy) this.ctx.sys.time.spend(min, energy, a.work !== false);
    if (a.station && min) state.day.stations[a.station] = (state.day.stations[a.station] ?? 0) + min;
    if (a.skill && a.xp) this.ctx.sys.skills.add(a.skill, a.xp);
    if (a.log) this.ctx.sys.log.add(a.station ?? 'town', typeof a.log === 'function' ? a.log(out) : a.log, a.icon);
    const r = { ok: true, id, min, energy, ...out };
    bus.emit(MSG.ACTION_DONE, r);
    bus.emit(MSG.STATE_CHANGED, { id });
    return r;
  }

  #why(a, params) {
    const { state, content, sys } = this.ctx;
    if (state.phase !== 'do') return 'phase';
    if (state.pendingEvent && a.id !== 'respondEvent') return 'event';
    if (a.station) {
      const st = content.get('stations', a.station);
      if (st.place !== state.place) return 'place';
      const place = content.get('places', st.place);
      if (a.needsOpen !== false && !sys.time.isOpen(place, a.min ?? 0)) return 'closed';
    }
    if (a.check) { const c = a.check(params); if (c) return c; }
    return sys.time.check(a.min ?? 0, a.energy ?? 0);
  }

  /** Action table. @param {string} id @param {any} p */
  #def(id, p) {
    const { state, content, sys } = this.ctx;
    const n = this.#n;
    const D = {
      travel: () => {
        const place = content.find('places', p.place);
        const from = content.find('places', state.place);
        return {
          min: Math.max(place?.travelMin ?? 0, from?.travelMin ?? 0), energy: n('TRAVEL_ENERGY'), work: false, icon: place?.icon,
          check: () => !place ? 'unknown' : place.id === state.place ? 'here' : (!sys.time.openOnArrival(place, Math.max(place.travelMin, from?.travelMin ?? 0)) ? 'closed' : null),
          run: () => {
            if (state.store.open) sys.store.close();
            state.place = place.id; state.explore.spot = null;
            // Early arrival waits at the door until opening time.
            const hrs = sys.time.hoursToday(place), min = Math.max(place.travelMin, from?.travelMin ?? 0);
            const wait = hrs ? Math.max(0, hrs[0] * 60 - (state.cal.minute + min)) : 0;
            return { min: min + wait, wait };
          },
          log: `Went to ${place?.name}`
        };
      },
      shortBreak: () => ({ min: n('SHORT_BREAK_MIN'), energy: -n('SHORT_BREAK_ENERGY'), work: false, icon: 'rest', log: 'Short break', run: () => {} }),
      eat: () => ({
        min: n('MEAL_MIN'), energy: -n('MEAL_ENERGY'), work: false, icon: 'meal', log: 'Ate a meal',
        check: () => state.day.meals >= n('MEALS_PER_DAY') ? 'meals' : Inventory.count(state.inv, 'meal', 'pack', '') < 1 ? 'food' : null,
        run: () => { Inventory.add(state.inv, 'meal', 'pack', -1); state.day.meals += 1; }
      }),
      // Sleep works anywhere: the player walks home at night (no time cost, the day is over).
      sleep: () => ({
        min: 0, energy: 0, work: false, icon: 'bed', log: 'Slept',
        run: () => { if (state.store.open) sys.store.close(); state.place = 'home'; state.explore.spot = null; return { endDay: true }; }
      }),
      craft: () => {
        const r = content.find('recipes', p.recipe);
        const b = Math.max(1, Math.min(p.batches ?? 1, n('CRAFT_MAX_BATCHES')));
        const c = r ? sys.production.craftCost(r, b) : null;
        return {
          station: 'crafting', min: c?.min, energy: c?.energy, icon: 'cauldron',
          check: () => !r ? 'unknown' : c.missing.length ? 'materials' : null,
          run: () => sys.production.craft(r, b),
          log: (o) => `Crafted ${o.out} ${r.name}`
        };
      },
      dryStart: () => ({
        station: 'drying', min: n('DRYING_TASK_MIN'), energy: n('DRYING_TASK_ENERGY'), icon: 'rack',
        run: () => sys.production.dryStart(p.item, p.qty), log: `Started drying ${p.qty} ${p.item}`
      }),
      dryCollect: () => ({
        station: 'drying', min: n('DRYING_TASK_MIN'), energy: n('DRYING_TASK_ENERGY'), icon: 'rack',
        run: () => sys.production.dryCollect(), log: 'Collected dried herbs'
      }),
      grind: () => ({
        station: 'grinding', min: n('GRIND_MIN_PER_UNIT') * (p.qty ?? 0), energy: n('GRIND_ENERGY_PER_UNIT') * (p.qty ?? 0), icon: 'grinder',
        check: () => !(p.qty > 0) ? 'qty' : null,
        run: () => sys.production.grind(p.item, p.qty), log: `Ground ${p.qty} ${p.item}`
      }),
      stockShelf: () => ({ station: 'store', min: 0, energy: 0, needsOpen: false, run: () => sys.economy.stockShelf(p) }),
      storeOpen: () => ({
        station: 'store', min: 0, energy: n('STORE_OPEN_ENERGY'), icon: 'store', needsOpen: false,
        check: () => state.store.open ? 'open' : !sys.economy.shelfUnits() ? 'shelf' : !sys.store.inHours() ? 'storeHours' : null,
        run: () => sys.store.open(), log: 'Opened the store'
      }),
      storeHour: () => ({
        station: 'store', min: 60, energy: 0, icon: 'store', needsOpen: false, xp: 2, skill: 'sun',
        check: () => !state.store.open ? 'notOpen' : sys.store.stopReason(),
        run: () => sys.store.hour()
      }),
      storeClose: () => ({ station: 'store', min: 0, energy: 0, needsOpen: false, check: () => !state.store.open ? 'notOpen' : null, run: () => sys.store.close(), log: 'Closed the store' }),
      // Trade actions take one line ({item, variant, qty}) or many (lines: [...]) for one TRADE_MIN.
      marketBuy: () => {
        const lines = p.lines ?? [{ item: p.item, variant: p.variant, qty: p.qty }];
        return {
          station: 'stall', min: n('TRADE_MIN'), energy: 0, icon: 'cart',
          check: () => sys.economy.checkLines(lines, (l) => sys.economy.buyPrice(l.item, l.variant) * l.qty),
          run: () => sys.economy.buyLines(lines.map((l) => ({ ...l, unit: sys.economy.buyPrice(l.item, l.variant), label: `Market: ${l.qty} ${l.item}` }))),
          log: `Bought ${lines.reduce((s, l) => s + l.qty, 0)} materials`
        };
      },
      buyFood: () => ({ station: 'stall', min: n('TRADE_MIN'), energy: 0, icon: 'meal', run: () => sys.economy.buy('meal', 'pack', p.qty, n('FOOD_PRICE'), `Food: ${p.qty} meals`), log: `Bought ${p.qty} meals` }),
      marketSell: () => {
        const lines = p.lines ?? [{ item: p.item, tier: p.tier, qty: p.qty }];
        return {
          station: 'stall', min: n('TRADE_MIN'), energy: 0, icon: 'gold', xp: 2, skill: 'sun',
          check: () => sys.economy.checkSell(lines),
          run: () => sys.economy.sellLines(lines.map((l) => ({ ...l, unit: sys.economy.marketSellPrice(l.item, l.tier), cat: 'market', label: `Market sale: ${l.qty} ${l.item}` }))),
          log: `Sold ${lines.reduce((s, l) => s + l.qty, 0)} products at the market`
        };
      },
      wholesaleBuy: () => {
        const lot = n('WHOLESALE_LOT');
        const lines = p.lines ?? [{ item: p.item, variant: p.variant, lots: p.lots }];
        return {
          station: 'receptionist', min: n('TRADE_MIN'), energy: 0, icon: 'cart',
          check: () => sys.economy.checkLines(lines, (l) => sys.economy.wholesaleLotPrice(l.item, l.variant) * l.lots),
          run: () => sys.economy.buyLines(lines.map((l) => ({ item: l.item, variant: l.variant, qty: l.lots * lot, unit: sys.economy.wholesaleLotPrice(l.item, l.variant) / lot, label: `Guild lot: ${l.lots * lot} ${l.item}` }))),
          log: `Bought ${lines.reduce((s, l) => s + l.lots, 0)} guild lots`
        };
      },
      wholesaleSell: () => {
        const lines = p.lines ?? [{ item: p.item, tier: p.tier, qty: p.qty }];
        return {
          station: 'receptionist', min: n('TRADE_MIN'), energy: 0, icon: 'gold', xp: 3, skill: 'sun',
          check: () => sys.economy.checkSell(lines),
          run: () => sys.economy.sellLines(lines.map((l) => ({ ...l, unit: sys.economy.wholesaleSellPrice(l.item, l.tier), cat: 'guild', label: `Guild sale: ${l.qty} ${l.item}` }))),
          log: `Sold ${lines.reduce((s, l) => s + l.qty, 0)} products to the guild`
        };
      },
      service: () => {
        const s = content.find('services', p.id);
        return {
          station: 'receptionist', min: 60, energy: 5, icon: 'guild',
          check: () => !s?.inDo ? 'unknown' : state.gold < s.price ? 'gold' : null,
          run: () => { sys.ledger.add(-s.price, s.name, 'store'); sys.effects.apply(s.effects, s.name); state.servicesBought.push({ id: s.id, day: sys.time.absDay() }); },
          log: `Service: ${s?.name}`
        };
      },
      questTake: () => ({ station: 'questboard', min: 5, energy: 0, icon: 'quest', run: () => sys.quests.take(p.id), log: 'Took a commission' }),
      questHandIn: () => ({ station: 'questboard', min: 15, energy: 0, icon: 'quest', run: () => sys.quests.handIn(p.id), log: 'Finished a commission' }),
      // The player posts a request: pays now, the items come in REQUEST_DAYS days.
      questPost: () => ({
        station: 'questboard', min: 10, energy: 0, icon: 'quest',
        check: () => sys.quests.postCheck(p.item, p.variant, p.qty),
        run: () => sys.quests.post(p.item, p.variant, p.qty), log: `Posted a request: ${p.qty} ${p.item}`
      }),
      exploreWalk: () => {
        const min = state.explore.walkMin ?? (state.explore.walkMin = sys.explore.walkMinutes());
        return {
          station: 'explore', min, energy: n('EXPLORE_WALK_ENERGY'), icon: 'explore',
          check: () => state.explore.spot ? 'spot' : sys.explore.spotsLeft() <= 0 ? 'spots' : null,
          run: () => { state.explore.walkMin = null; sys.explore.addWalk(min); return { spot: sys.explore.findSpot() }; },
          log: 'Explored the outskirt'
        };
      },
      exploreGather: () => {
        const s = state.explore.spot && content.get('spots', state.explore.spot.id);
        return {
          station: 'explore', min: s?.gatherMin ?? 0, energy: s?.gatherEnergy ?? 0, icon: 'leaf',
          check: () => !s ? 'none' : null, run: () => sys.explore.gather(), log: `Gathered at ${s?.name}`
        };
      },
      exploreSkip: () => ({ station: 'explore', min: 0, energy: 0, check: () => !state.explore.spot ? 'none' : null, run: () => sys.explore.skip() }),
      exploreEnd: () => ({ station: 'explore', min: 0, energy: 0, check: () => state.explore.spot ? 'spot' : null, run: () => ({ recap: sys.explore.end() }) }),
      respondEvent: () => ({ min: 0, energy: 0, run: () => sys.events.respond(p.index) })
    };
    const f = D[id];
    if (!f) return null;
    return { id, ...f() };
  }
}

export const REASON_TEXT = {
  phase: 'Not now.', event: 'Answer the event first.', place: 'Go there first.', closed: 'Closed now.',
  late: 'Not enough time today.', tired: 'Too tired. Rest or eat.', here: 'You are here.', meals: 'No more meals today.',
  food: 'No food. Buy meals at the market.', materials: 'Missing materials.', stock: 'Not enough stock.', rack: 'The rack is full.',
  none: 'Nothing to do.', qty: 'Pick a quantity.', open: 'The store is open.', shelf: 'The shelf is empty.',
  storeHours: 'Store hours are over.', notOpen: 'The store is closed.', soldOut: 'Sold out.', closing: 'Closing time.',
  gold: 'Not enough gold.', full: 'You hold the most commissions.', spot: 'Gather or skip first.', spots: 'No more spots today.',
  unknown: 'Unknown action.', requests: 'You have the most open requests.', empty: 'Pick some items first.', item: 'Pick a product.', variant: 'Cannot grind this.', requires: 'You do not have it.'
};
