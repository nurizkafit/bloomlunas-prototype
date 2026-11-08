import { Dom } from './Dom.js';
import { PlaceView } from './PlaceView.js';
import { StallView } from './StallView.js';
import { Icons } from './Icons.js';

const h = Dom.h;

/**
 * QuestBoardView: the Guild quest board (separate from the receptionist).
 * Take: town commissions in a compact list with a detail card (Interface Reference request list).
 * Give (user feedback D3): post your own request; pay now from the Store jar, the items come later.
 */
export class QuestBoardView {
  constructor(ui) { this.ui = ui; }

  render() {
    const ui = this.ui, L = ui.local;
    const mode = L.pick.mode ?? 'take';
    const tabs = StallView.tabs(ui, mode, [['take', 'quest', 'Town asks'], ['give', 'note', 'You ask']]);
    const [list, panel] = mode === 'give' ? this.#give() : this.#take();
    return PlaceView.win(ui, 'quest', 'Quest board', [h('div.col', tabs, list), panel], [], 'cols-7-5');
  }

  #take() {
    const ui = this.ui, st = ui.st, L = ui.local, q = ui.sys.quests;
    const today = ui.sys.time.absDay();
    const all = [...st.quests.active.map((a) => ({ id: a.id, a })), ...st.quests.board.map((id) => ({ id, a: null }))];
    const sel = all.find((x) => x.id === L.pick.quest) ?? all[0];
    const rows = all.map((x) => {
      const d = ui.c.get('quests', x.id), it = ui.c.get('items', d.item);
      const days = x.a ? Math.max(0, x.a.due - today) : ui.num('QUEST_DEADLINE_DAYS');
      return {
        on: x === sel, onclick: () => ui.set({ pick: { mode: 'take', quest: x.id } }),
        cells: [Dom.icon(it.icon, 20), h('span', d.name), `${q.have(x.id)}/${d.qty}`, String(d.reward), `${days}d`, x.a ? h('span.badge.ok', 'yours') : '']
      };
    });
    const list = Dom.tlist('28px 1fr 52px 48px 36px 52px', ['', 'Commission', 'Have', h('span', Dom.icon('gold', 12)), Dom.icon('calendar', 12), ''], rows, 'No commissions now. New ones come on Monday.');
    if (!sel) return [list, h('div')];
    const d = ui.c.get('quests', sel.id), it = ui.c.get('items', d.item);
    const have = q.have(sel.id);
    const pvT = ui.preview('questTake', { id: sel.id }), pvH = ui.preview('questHandIn', { id: sel.id });
    const full = st.quests.active.length >= ui.num('QUEST_MAX_ACTIVE');
    const panel = h('div.tpanel',
      h('div.kick', d.client),
      h('div.row', { style: { gap: '12px' } }, ui.itemBtn(d.item, 'product', null, 30), h('div', { style: { fontFamily: 'var(--head)', fontSize: '20px', lineHeight: 1.15 } }, d.name)),
      d.text ? h('p.small', d.text) : null,
      h('div', h('div.ln.sm', Dom.icon(it.icon, 18), `Bring ${it.name}`, h(`span.v${have >= d.qty ? '.pos' : ''}`, `${have}/${d.qty}`)),
        h('div.ln.sm', Dom.icon('gold', 18), 'Reward', h('span.v.pos', `+${d.reward}`)),
        h('div.ln.sm', Dom.icon('sun', 18), 'Sun XP', h('span.v', `+${d.xp ?? 0}`)),
        h('div.ln.sm', Dom.icon('calendar', 18), sel.a ? 'Days left' : 'Time to finish', h('span.v', `${sel.a ? Math.max(0, sel.a.due - today) : ui.num('QUEST_DEADLINE_DAYS')}d`))),
      h('div.row', Dom.chip('quest', `${st.quests.active.length}/${ui.num('QUEST_MAX_ACTIVE')}`), h('span.spacer'),
        sel.a ? Dom.btn('Deliver', () => ui.act('questHandIn', { id: sel.id }), { cls: 'gold', icon: 'check', disabled: !!pvH.reason || have < d.qty, title: ui.why(pvH.reason) || (have < d.qty ? 'You do not have enough yet.' : '') })
          : Dom.btn('Accept', () => ui.act('questTake', { id: sel.id }), { cls: 'gold', icon: 'quest', disabled: !!pvT.reason || full, title: full ? ui.why('full') : ui.why(pvT.reason) })));
    return [list, panel];
  }

  #give() {
    const ui = this.ui, st = ui.st, L = ui.local, q = ui.sys.quests;
    const today = ui.sys.time.absDay();
    const opts = ui.c.all('items').filter((i) => i.kind === 'material').flatMap((it) => it.variants.map((v) => ({ it, v })));
    const sel = opts.find((o) => o.it.id === L.pick.item && o.v === L.pick.variant) ?? opts[0];
    const step = ui.num('REQUEST_QTY_STEP');
    const qty = Math.max(step, L.pick.qty ?? step);
    const rows = opts.map((o) => ({
      on: o === sel, onclick: () => ui.set({ pick: { mode: 'give', item: o.it.id, variant: o.v, qty } }),
      cells: [ui.itemBtn(o.it.id, o.v), h('span', o.it.name, h('small.muted', ` ${o.v}`)), String(q.requestUnit(o.it.id, o.v))]
    }));
    const list = Dom.tlist('28px 1fr 64px', ['', 'Ask for', h('span', Dom.icon('gold', 12), 'each')], rows);
    const cost = q.requestCost(sel.it.id, sel.v, qty);
    const p = { item: sel.it.id, variant: sel.v, qty };
    const pv = ui.preview('questPost', p);
    const open = st.quests.requests ?? [];
    const panel = h('div.tpanel',
      h('div.kick', 'Ask the town'),
      h('div.row', { style: { gap: '12px' } }, Dom.medal(Icons.forItem(sel.it, sel.v), 44), h('div', h('div', { style: { fontFamily: 'var(--head)', fontSize: '20px' } }, sel.it.name), h('div.small.muted', sel.v))),
      h('div.row.center', Dom.stepper(qty, (d) => ui.set({ pick: { ...L.pick, mode: 'give', item: sel.it.id, variant: sel.v, qty: Math.max(step, qty + d) } }), { min: step, step })),
      h('div', h('div.ln.sm', Dom.icon('calendar', 18), 'Arrives in', h('span.v', `${ui.num('REQUEST_DAYS')}d`)),
        h('div.ln.sm', Dom.icon('note', 18), 'Posting fee', h('span.v', String(ui.num('REQUEST_FEE'))))),
      h('div.row', h('span.tot.neg', Dom.icon('gold', 26), `-${cost}`), h('span.spacer'), ui.jarTag('store', cost)),
      h('div.row', Dom.chip('note', `${open.length}/${ui.num('REQUEST_MAX_OPEN')}`), h('span.spacer'),
        Dom.btn('Pin it up', () => ui.act('questPost', p), { cls: 'gold', icon: 'note', min: pv.min, disabled: !!pv.reason, title: ui.why(pv.reason) })),
      open.length ? h('div', h('div.kick', 'Waiting for'), open.map((r) => { const it = ui.c.get('items', r.item); return h('div.ln.sm', ui.itemBtn(r.item, r.variant, null, 18), h('span', `${it.name} ×${r.qty}`), h('span.v', `${Math.max(0, r.readyDay - today)}d`)); })) : null);
    return [list, panel];
  }
}
