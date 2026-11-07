/** @param {Record<string, any>[]} rows */
export function toCsv(rows) {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const esc = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [keys.join(','), ...rows.map((r) => keys.map((k) => esc(r[k])).join(','))].join('\n') + '\n';
}
