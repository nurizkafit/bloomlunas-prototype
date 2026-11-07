import { MSG } from '../../core/EventBus.js';
import { DAYS } from '../../systems/PlanValidator.js';
import { costText } from './EventCardView.js';

/**
 * MonthEndView: the Act screen (docs loop/act.md). Month summary, bills (debt installment with interest and
 * hidden fee preview, utilities), Pay, 1 investment (Upgrade), book 1 service appointment for next month,
 * "Close the month". Reads GameState; sends intents only. Unity: month-end screen.
 */
export class MonthEndView {
  /** @param {HTMLElement} root @param {import('../../core/GameManager.js').GameManager} gm */
  constructor(root, gm) {
    this.gm = gm; this.c = gm.content; this.s = gm.state;
    this.el = document.createElement('div');
    this.el.className = 'screen';
    this.el.hidden = true;
    root.appendChild(this.el);
    const bus = gm.bus;
    bus.on(MSG.PHASE_ENTERED, ({ phase }) => { this.el.hidden = phase !== 'Act'; if (phase === 'Act') { this.msg = ''; this.render(); } });
    for (const m of [MSG.LEDGER_CHANGED, MSG.DEBT_CHANGED]) bus.on(m, () => { if (!this.el.hidden) this.render(); });
    /** Set by main.js: open the Journal (read only). */
    this.onJournal = () => {};
    this.el.addEventListener('click', (e) => {
      const t = e.target.closest('button');
      if (!t) return;
      if (t.dataset.journal !== undefined) { this.onJournal(); return; }
      const val = (n) => this.el.querySelector(`[name="${n}"]`)?.value;
      if (t.id === 'payMin') bus.emit(MSG.INTENT_PAY_DEBT, { amount: Math.max(0, this.c.num('DEBT_MIN_PAYMENT') - this.s.debt.paidThisMonth) });
      if (t.id === 'payAmt') bus.emit(MSG.INTENT_PAY_DEBT, { amount: Number(val('amt')) || 0 });
      if (t.id === 'payUtil') bus.emit(MSG.INTENT_PAY_UTILITIES);
      if (t.dataset.invest) { bus.emit(MSG.INTENT_INVEST, { investmentId: t.dataset.invest }); this.render(); }
      if (t.id === 'bookAppt') {
        const [entityId, serviceId] = val('svc').split('|');
        bus.emit(MSG.INTENT_BOOK_APPOINTMENT, { entityId, serviceId, week: Number(val('wk')), day: Number(val('dy')), hour: Number(val('hr')) });
        this.msg = this.s.actThisMonth.booked ? '' : 'That time is closed. Pick another day or hour.';
        this.render();
      }
      if (t.id === 'closeMonth') bus.emit(MSG.INTENT_NEXT_PHASE);
    });
  }

  render() {
    const s = this.s, c = this.c, d = s.debt, loan = c.all('debt')[0];
    const month = s.calendar.month;
    const weeks = (s.weekReports ?? []).filter((w) => w.month === month);
    const tot = weeks.reduce((a, w) => ({ income: a.income + w.income, expenses: a.expenses + w.expenses, net: a.net + w.net }), { income: 0, expenses: 0, net: 0 });
    const min = c.num(loan.minPaymentKey), rate = c.num(loan.rateKey), fee = c.num('HIDDEN_FEE_LATE');
    const util = c.num('MONTHLY_UTILITIES'), utilLeft = util - d.utilitiesPaidThisMonth;
    const interest = d.balance * rate, late = d.paidThisMonth < min;
    const after = d.balance + interest + (late ? fee : 0) + utilLeft;
    const svcs = c.all('entities').flatMap((e) => (e.services ?? []).map((sv) => ({ e, sv })));
    const booked = s.actThisMonth?.booked;
    this.el.innerHTML = `<div class="sheet">
      <h1>Month ${month} close</h1>
      <p class="lead">Act. Keep what worked; change what did not. Pay the bills, then close the month.</p>
      <div class="cols2">
        <div>
          <h3 class="h3">Month summary</h3>
          <table class="t2"><tr><th>Week</th><th style="text-align:right">Income</th><th style="text-align:right">Expenses</th><th style="text-align:right">Net</th></tr>
            ${weeks.map((w) => `<tr><td>Week ${w.week}</td><td class="num" style="text-align:right">${w.income.toFixed(0)}</td><td class="num" style="text-align:right">${w.expenses.toFixed(0)}</td><td class="num ${w.net < 0 ? 'bad' : 'ok'}" style="text-align:right">${w.net.toFixed(0)}</td></tr>`).join('')}
            <tr><td><b>Month</b></td><td class="num" style="text-align:right"><b>${tot.income.toFixed(0)}</b></td><td class="num" style="text-align:right"><b>${tot.expenses.toFixed(0)}</b></td><td class="num" style="text-align:right"><b>${tot.net.toFixed(0)}</b></td></tr></table>
          <h3 class="h3">Investment (Upgrade)</h3>
          ${c.all('investments').map((inv) => {
            const owned = s.investments?.includes(inv.id);
            const used = s.actThisMonth?.invested;
            return `<div class="aform"><div class="ah"><b>${inv.name}</b><small class="num">${inv.price} G</small></div><p class="hint" style="margin:0;width:100%">${inv.text} Effect: ${inv.effects.map((e) => `${e.target} +${e.amount}`).join(', ')}.</p>
              <button class="go sm" data-invest="${inv.id}" ${owned || used || s.wallet.gold < inv.price ? 'disabled' : ''}>${owned ? 'Owned' : 'Buy'}</button></div>`;
          }).join('')}
          <h3 class="h3">Book a service for next month</h3>
          ${booked ? `<p class="ok">Booked: ${booked.serviceId}, month ${month + 1}, week ${Math.floor((booked.absDay % (s.calendar.weeksPerMonth * 7)) / 7) + 1}, ${DAYS[booked.absDay % 7]} ${booked.minute / 60}:00.</p>` : `<div class="aform">
            <select name="svc">${svcs.map(({ e, sv }) => `<option value="${e.id}|${sv.id}">${sv.name} · ${e.id.replace('_', ' ')} · ${sv.cost} G</option>`).join('')}</select>
            <select name="wk">${[1, 2, 3, 4].map((w) => `<option value="${w}">Week ${w}</option>`).join('')}</select>
            <select name="dy">${DAYS.map((x, i) => `<option value="${i}">${x}</option>`).join('')}</select>
            <select name="hr">${[8, 9, 10, 11, 12, 13, 14].map((h) => `<option value="${h}" ${h === 9 ? 'selected' : ''}>${h}:00</option>`).join('')}</select>
            <button class="go sm" id="bookAppt">Book</button>${this.msg ? `<p class="bad" style="width:100%;margin:0">${this.msg}</p>` : ''}</div>`}
        </div>
        <div>
          <h3 class="h3">Pay</h3>
          <div class="kv2"><span>Gold</span><b class="num">${s.wallet.gold.toFixed(2)} G</b>
            <span>Riba loan</span><b class="num bad">${d.balance.toFixed(2)} G</b>
            <span>Paid this month</span><b class="num ${late ? 'warn' : 'ok'}">${d.paidThisMonth.toFixed(2)} of ${min} G minimum</b>
            <span>Utilities</span><b class="num ${utilLeft ? 'warn' : 'ok'}">${utilLeft ? `${utilLeft} G due` : 'Paid'}</b></div>
          <div class="aform"><button class="go sm" id="payUtil" ${!utilLeft || s.wallet.gold <= 0 ? 'disabled' : ''}>Pay utilities</button>
            <button class="go sm" id="payMin" ${!late || s.wallet.gold <= 0 ? 'disabled' : ''}>Pay the minimum</button>
            <input type="number" name="amt" min="0" value="${Math.max(0, Math.floor(s.wallet.gold))}" style="width:80px" aria-label="Amount"><button class="go sm" id="payAmt" ${s.wallet.gold <= 0 ? 'disabled' : ''}>Pay this amount</button></div>
          <h3 class="h3">When you close the month</h3>
          <div class="kv2"><span>Interest (${rate * 100} %)</span><b class="num bad">+${interest.toFixed(2)} G</b>
            <span>Hidden late fee</span><b class="num ${late ? 'bad' : 'ok'}">${late ? `+${fee} G (paid below minimum)` : 'none'}</b>
            <span>Unpaid utilities to debt</span><b class="num ${utilLeft ? 'bad' : 'ok'}">${utilLeft ? `+${utilLeft} G` : 'none'}</b>
            <span>Debt after close</span><b class="num">${after.toFixed(2)} G</b>
            <span>Bankruptcy at</span><b class="num">${c.num(loan.limitKey)} G · deadline month ${c.num('DEADLINE_MONTHS')}</b></div>
          ${after > c.num(loan.limitKey) ? '<p class="bad">✕ The debt will pass the limit: bankruptcy.</p>' : ''}
        </div>
      </div>
      <div class="acts"><button class="lnk2" data-journal>Open the Journal</button><button class="go" id="closeMonth">Close month ${month}</button></div>
    </div>`;
    void costText;
  }
}
