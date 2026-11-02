/**
 * PathGraph: walk graph between location doors (data/locations/_paths.json). No navmesh.
 * route(fromLocation, toLocation) returns a list of [x, z] points: door -> hubs (shortest) -> door.
 * View helper only (walk animation). Walk minutes for the rules come from _walk.json in logic.
 * Unity: waypoint graph + simple A* or Dijkstra.
 */
export class PathGraph {
  /** @param {any} paths _paths.json @param {(id:string)=>any} getLocation */
  constructor(paths, getLocation) {
    this.paths = paths;
    this.getLocation = getLocation;
    /** @type {Map<string, string[]>} */
    this.adj = new Map();
    for (const n of Object.keys(paths.nodes)) this.adj.set(n, []);
    for (const [a, b] of paths.edges) { this.adj.get(a).push(b); this.adj.get(b).push(a); }
  }

  #dist(a, b) {
    const p = this.paths.nodes[a], q = this.paths.nodes[b];
    return Math.hypot(p[0] - q[0], p[1] - q[1]);
  }

  /** Dijkstra between hubs. @param {string} from @param {string} to @returns {string[]} */
  hubs(from, to) {
    const dist = new Map([[from, 0]]), prev = new Map(), todo = new Set(this.adj.keys());
    while (todo.size) {
      let u = null;
      for (const n of todo) if (dist.has(n) && (u === null || dist.get(n) < dist.get(u))) u = n;
      if (u === null || u === to) break;
      todo.delete(u);
      for (const v of this.adj.get(u)) {
        const d = dist.get(u) + this.#dist(u, v);
        if (d < (dist.get(v) ?? Infinity)) { dist.set(v, d); prev.set(v, u); }
      }
    }
    const out = [to];
    while (out[0] !== from && prev.has(out[0])) out.unshift(prev.get(out[0]));
    return out;
  }

  /** @param {string} fromLoc @param {string} toLoc @returns {[number, number][]} */
  route(fromLoc, toLoc) {
    if (fromLoc === toLoc) return [this.getLocation(toLoc).door];
    const a = this.paths.doors[fromLoc], b = this.paths.doors[toLoc];
    const mid = this.hubs(a, b).map((n) => this.paths.nodes[n]);
    return [this.getLocation(fromLoc).door, ...mid, this.getLocation(toLoc).door];
  }
}
