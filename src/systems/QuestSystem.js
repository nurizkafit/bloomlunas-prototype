import { Inventory } from '../model/Inventory.js';

/**
 * QuestSystem: the Guild quest board. Each week shows QUEST_BOARD_SIZE commissions.
 * Take up to QUEST_MAX_ACTIVE. Hand in before the deadline for the reward. Unity: plain C# service.
 */
export class QuestSystem {
  /** @param {any} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  /** Plan phase: new board (without the taken ones). */
  rollBoard() {
    const { state, content, rng } = this.ctx;
    const taken = new Set(state.quests.active.map((q) => q.id));
    const pool = content.all('quests').filter((q) => !taken.has(q.id));
    const board = [];
    while (board.length < content.num('QUEST_BOARD_SIZE') && pool.length) board.push(pool.splice(Math.floor(rng.next() * pool.length), 1)[0].id);
    state.quests.board = board;
  }

  /** @param {string} id */
  take(id) {
    const { state, content, sys } = this.ctx;
    if (!state.quests.board.includes(id)) return { ok: false, reason: 'none' };
    if (state.quests.active.length >= content.num('QUEST_MAX_ACTIVE')) return { ok: false, reason: 'full' };
    state.quests.board = state.quests.board.filter((q) => q !== id);
    state.quests.active.push({ id, due: sys.time.absDay() + content.num('QUEST_DEADLINE_DAYS') });
    return { ok: true };
  }

  /** Products the player has for a quest (any tier, not on the shelf). @param {string} id */
  have(id) {
    const q = this.ctx.content.get('quests', id);
    const tiers = Object.keys(this.ctx.content.num('QUALITY_TIERS'));
    return tiers.reduce((s, t) => s + Math.max(0, this.ctx.sys.economy.freeStock(q.item, t)), 0);
  }

  /** @param {string} id */
  handIn(id) {
    const { state, content, sys } = this.ctx;
    const a = state.quests.active.find((q) => q.id === id);
    if (!a) return { ok: false, reason: 'none' };
    const q = content.get('quests', id);
    if (this.have(id) < q.qty) return { ok: false, reason: 'stock' };
    let left = q.qty;
    for (const t of Object.keys(content.num('QUALITY_TIERS'))) {
      const n = Math.min(left, Math.max(0, sys.economy.freeStock(q.item, t)));
      if (n) { Inventory.add(state.inv, q.item, 'product', -n, t); left -= n; }
    }
    state.quests.active = state.quests.active.filter((x) => x.id !== id);
    state.quests.done.push({ id, day: sys.time.absDay() });
    sys.ledger.add(q.reward, `Commission: ${q.name}`, 'quest');
    state.week.sold[q.item] = (state.week.sold[q.item] ?? 0) + q.qty;
    sys.skills.add('sun', q.xp);
    return { ok: true, reward: q.reward };
  }

  /** Day end: drop late quests. */
  expire() {
    const { state, sys } = this.ctx;
    const today = sys.time.absDay();
    for (const a of state.quests.active.filter((x) => x.due < today)) state.quests.missed.push({ id: a.id, day: today });
    state.quests.active = state.quests.active.filter((x) => x.due >= today);
  }
}
