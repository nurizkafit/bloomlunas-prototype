import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadDataNode } from '../src/sim/loadDataNode.js';
import { ContentDB } from '../src/core/ContentDB.js';
import { GameManager } from '../src/core/GameManager.js';
import { MSG } from '../src/core/EventBus.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const files = loadDataNode(root);

/** New content per test, so a test can change a balance value. */
export function newContent() {
  return new ContentDB(structuredClone(files));
}

/** A game in the Do phase, day 1 at the day start. */
export function gameInDo(content = newContent(), seed = 1) {
  const gm = new GameManager(content, { seed });
  gm.start();
  gm.bus.emit(MSG.INTENT_LOCK_PLAN);
  gm.state.pendingEvent = null;
  return gm;
}
