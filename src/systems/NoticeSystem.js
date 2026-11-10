import { MSG } from '../core/EventBus.js';

/**
 * NoticeSystem: tells the player when an objective is done, when a taken commission is ready to deliver,
 * and when a posted request arrives. Each notice is sent once (notice.added) and marks a Journal tab as unread.
 * Reads GameState only, no DOM. Unity: plain C# service.
 */
export class NoticeSystem {
  /** @param {any} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  /** Notice state. An old save has none: take what is done now as seen, with no notice. */
  get #n() {
    const st = this.ctx.state;
    if (!st.notices) {
      st.notices = { objectives: [], ready: [], unread: { notes: false, quests: false } };
      this.scan(true);
    }
    return st.notices;
  }

  /**
   * Look for new done objectives and ready commissions. @param {boolean} [silent] mark as seen, send nothing
   * @returns {number} new notices
   */
  scan(silent = false) {
    const { state, content, sys } = this.ctx;
    const n = this.#n;
    let added = 0;
    for (const o of sys.objectives.status()) {
      if (!o.done || n.objectives.includes(o.id)) continue;
      n.objectives.push(o.id);
      added++;
      if (!silent) this.add({ icon: 'check', text: `Objective done: ${o.text}`, tab: 'notes' });
    }
    const ready = state.quests.active.filter((a) => sys.quests.have(a.id) >= content.get('quests', a.id).qty).map((a) => a.id);
    for (const id of ready) {
      if (n.ready.includes(id)) continue;
      added++;
      if (!silent) this.add({ icon: 'quest', text: `Ready to deliver: ${content.get('quests', id).name}. Go to the quest board.`, tab: 'quests' });
    }
    n.ready = ready;
    return added;
  }

  /** Send one notice and mark its Journal tab as unread. @param {{icon:string, text:string, tab:string}} notice */
  add(notice) {
    const n = this.#n;
    n.unread[notice.tab] = true;
    this.ctx.bus.emit(MSG.NOTICE_ADDED, notice);
  }

  /** The player looked at a Journal tab. @param {string} tab */
  read(tab) {
    const n = this.#n;
    if (!n.unread[tab]) return false;
    n.unread[tab] = false;
    return true;
  }

  /** Is a Journal tab unread? @param {string} [tab] any tab when empty */
  unread(tab) {
    const u = this.#n.unread;
    return tab ? !!u[tab] : Object.values(u).some(Boolean);
  }
}
