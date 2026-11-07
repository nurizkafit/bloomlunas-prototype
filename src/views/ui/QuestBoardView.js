import { Dom } from './Dom.js';
import { PlaceView } from './PlaceView.js';

const h = Dom.h;

/** QuestBoardView: the Guild quest board (separate from the receptionist). Take commissions, hand them in. */
export class QuestBoardView {
  constructor(ui) { this.ui = ui; }

  render() {
    const ui = this.ui, st = ui.st, q = ui.sys.quests;
    const today = ui.sys.time.absDay();
    const card = (id, active) => {
      const d = ui.c.get('quests', id), it = ui.c.get('items', d.item);
      const have = q.have(id);
      const pvT = ui.preview('questTake', { id }), pvH = ui.preview('questHandIn', { id });
      return Dom.slim(active ? 'on' : '', h('div.mini',
        h('div.kick', d.client), Dom.medal(it.icon, 64), h('h5', d.name),
        h('div.costrow', h('span', Dom.icon(it.icon, 16), `${have}/${d.qty}`), h('span', Dom.icon('gold', 16), String(d.reward))),
        active ? h('div.row.small', Dom.icon('calendar', 14), `${Math.max(0, active.due - today)}d`) : h('div.row.small', Dom.icon('calendar', 14), `${ui.num('QUEST_DEADLINE_DAYS')}d`),
        active ? Dom.btn('Hand in', () => ui.act('questHandIn', { id }), { cls: 'gold.sm', icon: 'check', disabled: !!pvH.reason || have < d.qty, title: ui.why(pvH.reason) })
          : Dom.btn('Take', () => ui.act('questTake', { id }), { cls: 'sm', icon: 'quest', disabled: !!pvT.reason || st.quests.active.length >= ui.num('QUEST_MAX_ACTIVE'), title: ui.why(pvT.reason) })));
    };
    return PlaceView.win(ui, 'quest', 'Quest board', [
      h('div', h('h4', { style: { fontFamily: 'var(--head)', fontWeight: 400, fontSize: '18px', marginBottom: '8px', display: 'flex', gap: '8px', alignItems: 'center' } }, Dom.icon('quest', 20), 'Board'),
        h('div.cardgrid', st.quests.board.length ? st.quests.board.map((id) => card(id, null)) : h('div.small.muted', 'New board next week.'))),
      h('div', h('h4', { style: { fontFamily: 'var(--head)', fontWeight: 400, fontSize: '18px', marginBottom: '8px', display: 'flex', gap: '8px', alignItems: 'center' } }, Dom.icon('note', 20), `Taken ${st.quests.active.length}/${ui.num('QUEST_MAX_ACTIVE')}`),
        h('div.cardgrid', st.quests.active.map((a) => card(a.id, a))))
    ], [], 'one');
  }
}
