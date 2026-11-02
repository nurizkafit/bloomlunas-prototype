/**
 * ContentDB: holds all data files and finds them by id.
 * It does not read files itself. The entry point gives it a map of path -> JSON:
 * Node uses src/sim/loadDataNode.js; the browser uses import.meta.glob in src/main.js.
 * Unity: Resources or Addressables lookup.
 */
export class ContentDB {
  /** @param {Record<string, any>} files map of path (for example "data/activities/craft.json") to parsed JSON */
  constructor(files) {
    /** @type {Record<string, any>} */
    this.balance = {};
    /** @type {Map<string, Map<string, any>>} type folder -> id -> record */
    this.tables = new Map();
    for (const [path, json] of Object.entries(files)) this.#add(path, json);
  }

  #add(path, json) {
    const rel = path.replace(/\\/g, '/').replace(/^.*?data\//, '');
    if (rel === 'BalanceConfig.json') { this.balance = json; return; }
    const parts = rel.split('/');
    const type = parts.length > 1 ? parts[0] : parts[0].replace(/\.json$/, '');
    if (!this.tables.has(type)) this.tables.set(type, new Map());
    const id = json.id ?? parts.at(-1).replace(/\.json$/, '');
    this.tables.get(type).set(id, json);
  }

  /** Read one BalanceConfig value. Throws if it is missing, so no number hides in code. @param {string} key */
  num(key) {
    const v = this.balance[key];
    if (v === undefined) throw new Error(`BalanceConfig is missing ${key}`);
    return typeof v === 'object' && v !== null && 'value' in v ? v.value : v;
  }

  /** @param {string} type @param {string} id */
  get(type, id) {
    const r = this.tables.get(type)?.get(id);
    if (!r) throw new Error(`ContentDB: no ${type}/${id}`);
    return r;
  }

  /** @param {string} type @returns {any[]} */
  all(type) {
    return [...(this.tables.get(type)?.values() ?? [])];
  }
}
