import { MSG } from './EventBus.js';
import { GameState } from '../model/GameState.js';

/**
 * SaveSystem: auto-saves GameState as JSON at each phase end, and loads it on start.
 * A save holds the state "between phases" and the name of the next phase, so a load enters that phase.
 * Storage is injected (localStorage in the browser, a Map in Node tests): no DOM import here.
 * Unity: JsonUtility + Application.persistentDataPath.
 */
export class SaveSystem {
  /** @param {{getItem:(k:string)=>string|null, setItem:(k:string,v:string)=>void, removeItem:(k:string)=>void}} storage @param {string} [key] */
  constructor(storage, key = 'bloomlunas.save') {
    this.storage = storage;
    this.key = key;
    this.version = 1;
  }

  /** Save on every phase.exited. @param {import('./GameManager.js').GameManager} gm */
  attach(gm) {
    gm.bus.on(MSG.PHASE_EXITED, ({ next }) => this.save(gm, next));
  }

  /** @param {any} gm @param {string|null} nextPhase */
  save(gm, nextPhase) {
    const data = { version: this.version, savedAt: new Date().toISOString(), nextPhase, rng: gm.rng.state, state: gm.state };
    this.storage.setItem(this.key, JSON.stringify(data));
  }

  /** @returns {{nextPhase:string, rng:number, state:any} | null} */
  read() {
    try {
      const raw = this.storage.getItem(this.key);
      const data = raw ? JSON.parse(raw) : null;
      return data?.version === this.version && data.nextPhase ? data : null;
    } catch {
      return null;
    }
  }

  clear() {
    this.storage.removeItem(this.key);
  }

  /** Put saved data back into a fresh GameState (keeps the class instances and their methods). @param {any} content @param {any} saved */
  static restore(content, saved) {
    const s = GameState.create(content);
    for (const [k, v] of Object.entries(saved)) {
      if (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k]) && v && typeof v === 'object') Object.assign(s[k], v);
      else s[k] = v;
    }
    return s;
  }
}
