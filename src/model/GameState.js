import { Calendar } from './Calendar.js';
import { Inventory } from './Inventory.js';

/**
 * GameState: all data of one run, as plain JSON (saves, Unity [Serializable]).
 * Logic classes change it. Views only read it.
 */
export class GameState {
  /** @param {import('../core/ContentDB.js').ContentDB} content */
  static create(content) {
    const n = (k) => content.num(k);
    const inv = {};
    for (const s of content.get('start', 'start').inventory) Inventory.add(inv, s.item, s.variant, s.qty, s.tier ?? '');
    Inventory.add(inv, 'meal', 'pack', n('START_FOOD'));
    return {
      phase: 'plan',
      cal: Calendar.create(n('DAY_START_HOUR') * 60),
      gold: n('GOLD_START'),
      energy: n('ENERGY_MAX'),
      energyMax: n('ENERGY_MAX'),
      energyDebt: 0,
      day: GameState.freshDay(),
      debt: { balance: n('DEBT_START'), paidThisMonth: 0, utilitiesPaid: false, interestTotal: 0, feesTotal: 0, carriedTotal: 0, months: [] },
      inv,
      shelf: Array(n('SHELF_SLOTS')).fill(null),
      rack: [],
      place: 'home',
      store: { open: false, result: null },
      explore: { spotsToday: 0, spot: null, found: [] },
      market: { prices: {}, prevPrices: {}, trend: {}, demandMod: 1, demandUntil: 0 },
      plan: GameState.freshPlan(n('DAYS_PER_WEEK')),
      week: GameState.freshWeek(n('DAYS_PER_WEEK')),
      ledger: [],
      log: [],
      skills: { moon: 0, sun: 0, earth: 0 },
      quests: { board: [], active: [], done: [], missed: [], requests: [] },
      boosts: {},
      pendingBoosts: {},
      servicesBought: [],
      notes: [],
      tutorialSeen: [],
      notices: { objectives: [], ready: [], unread: { notes: false, quests: false } },
      tutorialOff: false,
      history: [],
      weeks: [],
      months: [],
      pendingEvent: null,
      firedEvents: [],
      lastRandomEvent: null,
      checkSummary: null,
      actSummary: null,
      finished: false
    };
  }

  static freshDay() {
    return { meals: 0, workMin: 0, stations: {}, events: 0 };
  }

  /** @param {number} days */
  static freshPlan(days) {
    return { goals: Array(days).fill(null), products: {}, budget: { store: 0, personal: 0, buffer: 0 }, locked: false };
  }

  /** @param {number} days */
  static freshWeek(days) {
    return { spent: { store: 0, personal: 0, bills: 0 }, income: { store: 0, market: 0, guild: 0, quest: 0, other: 0 }, goalsMet: Array(days).fill(null), sold: {}, startGold: 0, xp: { moon: 0, sun: 0, earth: 0 }, lines: [], eventDays: null };
  }
}
