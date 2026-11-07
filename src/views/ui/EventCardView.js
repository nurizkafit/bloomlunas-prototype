import { Dom } from './Dom.js';
import { Icons } from './Icons.js';

const h = Dom.h;

/** EventCardView: a random or scheduled event at day start. The player picks one response. */
export class EventCardView {
  constructor(ui) { this.ui = ui; }

  render() {
    const ui = this.ui, ev = ui.c.get('events', ui.st.pendingEvent);
    const fx = (e) => {
      const icon = { gold: 'gold', energy: 'energy', time: 'clock', demand: 'customer', item: 'bag', xp: 'skills', debt: 'debt' }[e.type] ?? 'info';
      const v = e.type === 'time' ? `-${Dom.mins(e.amount)}` : e.type === 'demand' ? `×${e.amount}` : `${e.amount > 0 ? '+' : ''}${e.amount}`;
      return Dom.chip(icon, v, (e.type === 'time' || e.amount < 0) ? 'miss' : 'ok');
    };
    return h('div.veil', Dom.rattan('card', ...Dom.corners(),
      h('div.kick', ev.type === 'scheduled' ? 'Today' : 'Event'),
      Dom.medal(Icons.has(ev.icon) ? ev.icon : 'info', 88),
      h('h3', ev.title), h('p', ev.text),
      h('div.acts', ev.responses.map((r, i) => {
        const ok = ui.sys.events.canPick(r);
        return h('button.btn.alt', { style: { height: 'auto', minHeight: '48px', padding: '8px 16px', justifyContent: 'flex-start' }, disabled: !ok, onclick: () => ui.act('respondEvent', { index: i }) },
          Dom.icon(Icons.has(r.icon) ? r.icon : 'next', 22), h('span', { style: { flex: 1, textAlign: 'left' } }, r.label), h('span.row', { style: { gap: '4px' } }, (r.effects ?? []).map(fx)));
      }))));
  }
}
