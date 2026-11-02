import { MSG } from '../../core/EventBus.js';

/**
 * RecapView: the Check screen. Income and expenses, weekly living cost paid, XP per path,
 * plan versus actual bars per activity, events and lost cards, and a note field for the next Plan.
 * Reads the last week report; sends intent.writeNote and intent.nextPhase. Unity: recap screen.
 */
export class RecapView {
  /** @param {HTMLElement} root @param {import('../../core/GameManager.js').GameManager} gm */
  constructor(root, gm) {
    this.gm = gm; this.c = gm.content; this.s = gm.state;
    this.el = document.createElement('div');
    this.el.className = 'screen';
    this.el.hidden = true;
    root.appendChild(this.el);
    gm.bus.on(MSG.PHASE_ENTERED, ({ phase }) => { this.el.hidden = phase !== 'Check'; if (phase === 'Check') this.render(); });
    this.el.addEventListener('click', (e) => {
      if (!e.target.closest('#rcNext')) return;
      const t = this.el.querySelector('#rcNote').value;
      if (t.trim()) gm.bus.emit(MSG.INTENT_WRITE_NOTE, { text: t });
      gm.bus.emit(MSG.INTENT_NEXT_PHASE);
    });
  }

  render() {
    const w = this.s.weekReports.at(-1), c = this.c;
    const lines = this.s.ledger.week(w.month, w.week).lines;
    const groups = {};
    for (const l of lines) {
      const k = l.label.replace(/\s*\(.*\)$/, '').replace(/ \d+ .*/, (m) => m.replace(/\d+ /, ''));
      const key = l.kind === 'expenses' ? 'Weekly expenses' : k;
      groups[key] = (groups[key] ?? 0) + l.amount;
    }
    const acts = [...new Set([...Object.keys(w.planned), ...Object.keys(w.actual)])].filter((a) => a !== 'rest');
    const max = Math.max(60, ...acts.map((a) => Math.max(w.planned[a] ?? 0, w.actual[a] ?? 0)));
    const last = this.c.num('WEEKS_PER_MONTH') <= this.s.calendar.week;
    this.el.innerHTML = `<div class="sheet">
      <h1>Week ${w.week} recap</h1>
      <p class="lead">Month ${w.month} · Check. Look at the gap between the plan and what happened. Write one note for next week.</p>
      <div class="cols2">
        <div>
          <h3 class="h3">Money</h3>
          <table class="t2"><tr><th>Line</th><th style="text-align:right">Gold</th></tr>
            ${Object.entries(groups).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<tr><td>${k}</td><td class="num ${v < 0 ? 'bad' : 'ok'}" style="text-align:right">${v > 0 ? '+' : ''}${v.toFixed(2)}</td></tr>`).join('')}
            <tr><td><b>Net this week</b></td><td class="num" style="text-align:right"><b>${w.net >= 0 ? '+' : ''}${w.net.toFixed(2)} G</b></td></tr></table>
          <div class="kv2"><span>Weekly living cost</span><b class="num">${w.living} G paid${w.unpaid ? ` · <span class="bad">${w.unpaid} G unpaid → debt</span>` : ''}</b>
            <span>Gold now</span><b class="num">${w.gold.toFixed(2)} G</b><span>Debt</span><b class="num">${w.debt.toFixed(2)} G</b>
            <span>Sold · waste</span><b class="num">${w.sold} · ${w.waste}</b>
            <span>Made</span><b>${Object.entries(w.made).map(([t, n]) => `${n} ${t}`).join(', ') || '–'}</b>
            <span>XP per path</span><b>${Object.entries(w.xp).map(([k, v]) => `${k} +${v}`).join(' · ') || '–'}</b></div>
        </div>
        <div>
          <h3 class="h3">Plan versus actual (hours)</h3>
          <div class="pva2">${acts.map((a) => `<span>${c.get('activities', a).name}</span><div class="bars"><i class="p" style="width:${((w.planned[a] ?? 0) / max) * 100}%"></i><i class="a" style="width:${((w.actual[a] ?? 0) / max) * 100}%"></i></div><span class="num">${((w.planned[a] ?? 0) / 60).toFixed(1)} → ${((w.actual[a] ?? 0) / 60).toFixed(1)}</span>`).join('') || '<p class="hint">No plan and no actions.</p>'}</div>
          <div class="legend2"><span><i class="p"></i>Planned</span><span><i class="a"></i>Actual</span></div>
          <h3 class="h3">Events</h3>
          ${w.events.length ? `<ul class="evlist">${w.events.map((e) => `<li><b>${e.title}</b>: ${e.response}${e.lost.length ? ` <span class="bad">· lost card: ${e.lost.map((x) => c.get('activities', x).name).join(', ')}</span>` : ''}</li>`).join('')}</ul>` : '<p class="hint">No events this week.</p>'}
          <h3 class="h3">Note for next week</h3>
          <textarea id="rcNote" rows="3" placeholder="What will you do differently? For example: craft jamu before the festival."></textarea>
        </div>
      </div>
      <div class="acts"><button class="go" id="rcNext">${last ? 'Go to month end' : `Plan week ${w.week + 1}`}</button></div>
    </div>`;
  }
}
