import { Calendar } from './Calendar.js';
import { Wallet } from './Wallet.js';
import { Inventory } from './Inventory.js';
import { DebtAccount } from './DebtAccount.js';
import { SkillBook } from './SkillBook.js';
import { Relationships } from './Relationships.js';
import { WeekPlan } from './WeekPlan.js';
import { Ledger } from './Ledger.js';

/**
 * GameState: all saved data. Plain data only: no rules here (rules are in systems).
 * Unity: [Serializable] class saved as JSON.
 */
export class GameState {
  /** @param {import('../core/ContentDB.js').ContentDB} content */
  static create(content) {
    const s = new GameState();
    s.calendar = new Calendar(content.num('WEEKS_PER_MONTH'), content.num('DAYS_PER_WEEK'));
    s.calendar.minute = content.num('DAY_START_HOUR') * 60;
    s.wallet = new Wallet(content.num('GOLD_START'));
    s.inventory = new Inventory();
    for (const l of content.num('START_INVENTORY')) s.inventory.add(l.item, l.variant, l.qty, { tier: l.tier ?? null, born: 0 });
    const debt = content.all('debt')[0];
    s.debt = new DebtAccount(debt.id, content.num(debt.principalKey));
    s.skills = new SkillBook();
    s.relations = new Relationships();
    for (const e of content.all('entities')) if (e.type === 'organization') s.relations.points[e.id] = e.relationshipStart ?? 0;
    s.plan = new WeekPlan();
    s.ledger = new Ledger();
    s.player = {
      energy: content.num('ENERGY_MAX'),
      fatigued: false,
      workedLate: false,
      location: 'loc_home',
      activityId: null,
      dayOver: false,
      weekOver: false
    };
    /** @type {{id:string, entityId:string, ask:{item:string, qty:number}, rewardGold:number, relationship:number, dueDay:number}[]} */
    s.quests = [];
    s.questsDone = [];
    /** @type {{item:string, qty:number, readyDay:number}[]} */
    s.batches = [];
    /** @type {{entityId:string, serviceId:string, absDay:number, minute:number, done:boolean}[]} */
    s.appointments = [];
    /** @type {Record<string, number>} real price per item for this week (hidden from the player) */
    s.prices = {};
    s.stats = { waste: 0, made: {}, sold: 0 };
    return s;
  }
}
