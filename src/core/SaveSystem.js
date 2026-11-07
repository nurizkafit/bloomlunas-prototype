/**
 * SaveSystem: auto-saves GameState as JSON (at each phase change and at each day start) and reads it on start.
 * Storage is injected (localStorage in the browser, a Map in Node tests): no DOM import here.
 * Unity: JsonUtility + Application.persistentDataPath.
 */
export class SaveSystem {
  /** @param {{getItem:(k:string)=>string|null, setItem:(k:string,v:string)=>void, removeItem:(k:string)=>void}} storage @param {string} [key] */
  constructor(storage, key = 'bloomlunas.jam.save') {
    this.storage = storage;
    this.key = key;
    this.version = 2;
  }

  /** @param {{state:any, rng:{state:number}}} gm */
  save(gm) {
    const data = { version: this.version, savedAt: new Date().toISOString(), rng: gm.rng.state, state: gm.state };
    this.storage.setItem(this.key, JSON.stringify(data));
  }

  /** @returns {{savedAt:string, rng:number, state:any} | null} */
  read() {
    try {
      const raw = this.storage.getItem(this.key);
      const data = raw ? JSON.parse(raw) : null;
      return data?.version === this.version && data.state ? data : null;
    } catch {
      return null;
    }
  }

  clear() {
    this.storage.removeItem(this.key);
  }
}
