import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/** Read every JSON file under data/ into a map of path -> JSON (Node only). @param {string} root repo root */
export function loadDataNode(root) {
  const out = {};
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name.endsWith('.json')) out[relative(root, p).replace(/\\/g, '/')] = JSON.parse(readFileSync(p, 'utf8'));
    }
  };
  walk(join(root, 'data'));
  return out;
}
