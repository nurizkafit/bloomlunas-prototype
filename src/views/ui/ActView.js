import { MSG } from '../../core/EventBus.js';
import { Dom } from './Dom.js';

const h = Dom.h;

/**
 * ActView: month-end pages (Scene & Flow: Act). Month recap, debt payment and utilities,
 * one guild appointment for next month. A short payment does not end the game:
 * the gap carries over with a late fee (user decision 7 Nov 2026).
 */
export class ActView {
  constructor(ui) { this.ui = ui; }

  pages() {
    const ui = this.ui, st = ui.st, a = st.actSummary, d = st.debt;
    if (!a) return [[], []];
    const due = ui.sys.debt.dueLeft();
    const pay = Math.min(ui.local.pick.pay ?? due, Math.floor(st.gold), Math.ceil(d.balance));
    const util = ui.num('MONTHLY_UTILITIES');
    const fee = ui.num('HIDDEN_FEE_LATE');
    const interest = Math.round(d.balance * ui.num('DEBT_INTEREST_RATE'));
    const left = [
      h('h3', Dom.icon('debt', 28), `Month ${a.month}`),
      h('div.statgrid', { style: { marginTop: '8px' } },
        h('div.stat', h('span.k', Dom.icon('trend_up', 16), 'In'), h('span.v', `+${a.income}`)),
        h('div.stat', h('span.k', Dom.icon('tag', 16), 'Sold'), h('span.v', String(a.sold))),
        h('div.stat', h('span.k', Dom.icon('star', 16), 'Goals'), h('span.v', `${a.goalHits}/${a.goalDays}`))),
      h('h4', Dom.icon('debt', 18), 'Debt', h('span.aside', Dom.icon('gold', 14), `${Math.round(st.gold)}`)),
      h('div.ln', Dom.icon('debt', 20), 'Balance', h('span.v.neg', Math.round(d.balance).toLocaleString('en'))),
      h('div.ln', Dom.icon('calendar', 20), 'Minimum', h('span.v', `${d.paidThisMonth}/${a.minPayment}`)),
      h('div.row', { style: { margin: '16px 0 8px', gap: '16px' } },
        Dom.stepper(pay, (x) => ui.set({ pick: { ...ui.local.pick, pay: Math.max(0, pay + x) } }), { step: 50, max: Math.floor(st.gold), big: true }),
        h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
          Dom.btn('Min', () => ui.set({ pick: { ...ui.local.pick, pay: due } }), { cls: 'alt.sm' }),
          Dom.btn('All', () => ui.set({ pick: { ...ui.local.pick, pay: Math.floor(Math.min(st.gold, d.balance)) } }), { cls: 'alt.sm' })),
        Dom.btn('Pay', () => { ui.local.pick.pay = undefined; ui.send(MSG.INTENT_PAY_DEBT, { amount: pay }); }, { cls: 'gold', icon: 'gold', disabled: pay <= 0 })),
      h('div.ln', Dom.icon('house', 20), 'Utilities', h('span.spacer'),
        d.utilitiesPaid ? Dom.icon('check', 20) : Dom.btn(`${util}`, () => ui.send(MSG.INTENT_PAY_UTILITIES), { cls: 'sm', icon: 'gold', disabled: st.gold < util })),
      h('h4', Dom.icon('warn', 18), 'At close'),
      h('div.chipline',
        h('span.qchip.miss', { title: 'Interest' }, Dom.icon('trend_up', 16), `+${interest}`),
        due > 0 ? h('span.qchip.miss', { title: 'Late fee: minimum not paid' }, Dom.icon('warn', 16), `+${fee}`) : h('span.qchip.ok', Dom.icon('check', 16), 'no fee'),
        !d.utilitiesPaid ? h('span.qchip.miss', { title: 'Unpaid utilities go onto the debt' }, Dom.icon('house', 16), `+${util}`) : null)
    ];
    const services = ui.c.all('services').filter((s) => s.inAct);
    const right = [
      h('h3', Dom.icon('guild', 28), 'Appointment'),
      h('div.small.muted', 'One for next month.'),
      h('div.grid2', { style: { marginTop: '16px' } }, services.map((s) => Dom.slim(a.booked === s.id ? 'on' : '',
        h('div.mini', Dom.medal(s.id === 'svc_rack' ? 'rack' : 'sign', 56), h('h5', s.name), h('div.small', s.text),
          a.booked === s.id ? h('span.qchip.ok', Dom.icon('check', 16), 'Booked')
            : Dom.btn(`${s.price}`, () => ui.send(MSG.INTENT_BOOK_SERVICE, { id: s.id }), { cls: 'sm', icon: 'gold', disabled: !!a.booked || st.gold < s.price }))))),
      Dom.divider(),
      h('h4', Dom.icon('calendar', 18), st.cal.month >= ui.num('JAM_MONTHS') ? 'Next: the guild looks back' : `Next: month ${st.cal.month + 1}`)
    ];
    return [left, right];
  }

  ribbon() {
    const ui = this.ui;
    return Dom.btn('Close month', () => { ui.local.pick = {}; ui.send(MSG.INTENT_FINISH_ACT); }, { cls: 'gold.ribbon', icon: 'check' });
  }
}
