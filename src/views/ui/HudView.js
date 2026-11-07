import { MSG } from '../../core/EventBus.js';
import { DAYS, hm } from '../../systems/PlanValidator.js';
import { ic, iconFor, colorFor } from './icons.js';
import './game.css';
import './screens.css';

/**
 * HudView: Do phase heads-up display. Day, clock, gold, energy, fatigue, current activity,
 * today's planned cards (plan match shows when earned), message log, "Change plan", "End the day", "Go to Check".
 * Reads GameState; sends intents only. Unity: HUD canvas.
 */
export class HudView {
  /** @param {HTMLElement} root @param {import('../../core/GameManager.js').GameManager} gm @param {{openPlan:()=>void, openMap:()=>void, openLocation:(id:string)=>void}} hooks */
  constructor(root, gm, hooks) {
    this.gm = gm; this.s = gm.state; this.c = gm.content; this.hooks = hooks;
    this.el = document.createElement('div');
    this.el.className = 'hud';
    this.el.hidden = true;
    this.el.innerHTML = `
      <header class="hud-bar">
        <div class="brand">BloomLunas <small>Do</small></div>
        <div class="steps"><span class="step">Plan</span><span class="step on">Do</span><span class="step">Check</span></div>
        <div class="rs"><span class="k" id="hWeek"></span><span class="v disp" id="hDay"></span></div>
        <div class="rs"><span class="k">Clock</span><span class="v num" id="hClock"></span></div>
        <div class="sep"></div>
        <div class="rs"><span class="k">Gold</span><span class="v num gold" id="hGold"></span></div>
        <div class="rs"><span class="k">Energy</span><span class="ebar"><i id="hEnergy"></i></span><span class="num tiny" id="hEnergyN"></span></div>
        <div id="hFat"></div>
        <div class="rs"><span class="k">Activity</span><span class="v" id="hAct">–</span></div>
        <div class="spacer"></div>
        <button class="tbtn" id="hMap">${ic('flag')}Town map</button>
        <button class="tbtn" id="hPlan" title="The Journal: plan, ledger, market, town, notes, skills, settings">${ic('scroll')}Journal</button>
        <button class="tbtn" id="hEat" title="Breakfast, lunch and dinner have set times. Food is paid by the weekly living cost.">${ic('bowl')}<span>Eat</span></button>
        <button class="tbtn" id="hNap" title="Rest a short time for energy. Sleep is at the bed, from the night.">${ic('leaf')}Small rest</button>
        <button class="go" id="hCheck" hidden>Week done · Go to Check</button>
      </header>
      <aside class="hud-today"><div id="hGoals"></div><h3>Today's plan</h3><div id="hCards"></div><p class="hint">Click a place in the town, or a card here, to act. Matching the plan gives bonus XP. Sleep at the bed from 18:00 to end the day.</p></aside>
      <div class="hud-log" id="hLog" role="log" aria-live="polite"></div>`;
    root.appendChild(this.el);
    const $ = (s) => this.el.querySelector(s);
    this.$ = $;
    $('#hPlan').onclick = () => hooks.openPlan();
    $('#hMap').onclick = () => hooks.openMap();
    $('#hEat').onclick = () => gm.bus.emit(MSG.INTENT_RUN_ACTION, { actionId: 'eat', params: {} });
    $('#hNap').onclick = () => gm.bus.emit(MSG.INTENT_RUN_ACTION, { actionId: 'small-rest', params: {} });
    $('#hCheck').onclick = () => gm.bus.emit(MSG.INTENT_NEXT_PHASE);
    $('#hCards').addEventListener('click', (e) => {
      const c = e.target.closest('[data-loc]');
      if (c) hooks.openLocation(c.dataset.loc);
    });
    const bus = gm.bus;
    bus.on(MSG.PHASE_ENTERED, ({ phase }) => { this.el.hidden = phase !== 'Do'; if (phase === 'Do') { this.$('#hLog').innerHTML = ''; this.render(); } });
    for (const m of [MSG.CLOCK_CHANGED, MSG.LEDGER_CHANGED, MSG.PLAN_VALIDATED, MSG.INVENTORY_CHANGED]) bus.on(m, () => this.render());
    bus.on(MSG.ACTION_STARTED, (r) => { if (r.bonus) this.log(`Plan match: +${r.bonus} XP`, 'ok'); this.render(); });
    bus.on(MSG.ACTION_COMPLETED, (r) => { this.log(describe(r, this.c), 'ok'); this.render(); });
    bus.on(MSG.ACTION_REFUSED, (r) => this.log(`Cannot do it: ${r.reason}.`, 'bad'));
  }

  /** @param {string} msg @param {string} [cls] */
  log(msg, cls = '') {
    const p = document.createElement('p');
    p.className = cls;
    p.textContent = `${this.s.calendar.clock()} · ${msg}`;
    const box = this.$('#hLog');
    box.prepend(p);
    while (box.children.length > 6) box.lastChild.remove();
  }

  /** Today's goal and the Store's goal (Scene & Flow: HUD shows the goals). */
  #goals() {
    const s = this.s, cal = s.calendar;
    const mins = {};
    for (const c of s.plan.cards.filter((x) => x.day === cal.day)) {
      const g = GOALS.find((x) => x.cats.includes(this.c.get('activities', c.activityId).category));
      if (g) mins[g.n] = (mins[g.n] ?? 0) + this.gm.ctx.sys.plan.duration(c);
    }
    const top = Object.entries(mins).sort((a, b) => b[1] - a[1])[0]?.[0];
    const goal = GOALS.find((g) => g.n === top);
    const done = goal && (s.activityLog ?? []).some((l) => l.week === cal.week && l.month === cal.month && l.day === cal.day && l.activityId
      && goal.cats.includes(this.c.get('activities', l.activityId).category));
    return `<div class="goal"><span class="st-kind">Today's goal</span><b>${goal ? goal.n : 'Free time'}</b>
        <small>${goal ? (done ? '✓ Done today' : 'From your plan for today') : 'No goal set for today'}</small></div>
      <div class="goal"><span class="st-kind">Store's goal</span><b>Not set</b><small>Set in Plan · Store planning (next stage)</small></div>`;
  }

  render() {
    if (this.el.hidden) return;
    const s = this.s, cal = s.calendar, p = s.player, $ = this.$;
    $('#hWeek').textContent = `Month ${cal.month} · Week ${cal.week}`;
    $('#hDay').textContent = `${DAYS[cal.day]} · Day ${(cal.week - 1) * 7 + cal.day + 1}`;
    $('#hClock').textContent = cal.clock();
    $('#hClock').classList.toggle('late', cal.minute > this.c.num('DAY_END_HOUR') * 60);
    $('#hGold').textContent = `${s.wallet.gold.toFixed(0)} G`;
    const max = this.c.num('ENERGY_MAX');
    $('#hEnergy').style.width = `${(p.energy / max) * 100}%`;
    $('#hEnergy').className = p.energy < this.c.num('FATIGUE_THRESHOLD') ? 'low' : '';
    $('#hEnergyN').textContent = `${p.energy}/${max}`;
    $('#hFat').innerHTML = p.fatigued ? `<span class="pill warn" title="Actions take longer">Tired${p.lateWake ? ' · woke late' : ''}</span>` : '';
    $('#hAct').textContent = p.activityId ? this.c.get('activities', p.activityId).name : '–';
    $('#hCheck').hidden = !p.weekOver;
    const meal = this.gm.ctx.sys.actions.mealNow(), eaten = (p.meals ?? []).includes(meal);
    $('#hEat').hidden = p.weekOver;
    $('#hEat').disabled = !meal || eaten;
    $('#hEat').querySelector('span').textContent = meal ? (eaten ? `${cap(meal)} eaten` : `Eat ${meal}`) : 'Eat (no meal now)';
    $('#hNap').hidden = p.weekOver;
    $('#hMap').hidden = p.weekOver;
    $('#hGoals').innerHTML = this.#goals();
    const cards = s.plan.cards.filter((c) => c.day === cal.day).sort((a, b) => a.startMin - b.startMin);
    $('#hCards').innerHTML = cards.length ? cards.map((c) => {
      const a = this.c.get('activities', c.activityId);
      const loc = c.locationId ?? a.locationIds[0];
      const dur = this.gm.ctx.sys.plan.duration(c);
      const now = cal.minute >= c.startMin && cal.minute < c.startMin + dur;
      return `<button class="tc${c.used ? ' done' : ''}${now ? ' now' : ''}" data-loc="${loc}" style="--k:${colorFor(a)}">${ic(iconFor(a))}<span><b>${a.name}</b><small class="num">${hm(c.startMin)}–${hm(c.startMin + dur)} · ${this.c.get('locations', loc).name}</small></span>${c.used ? '<em>✓ bonus</em>' : ''}</button>`;
    }).join('') : '<p class="hint">No cards for today.</p>';
  }
}

/** Day goal types (Scene & Flow chart). Stage 1: the goal comes from the activity category of today's plan cards. */
const GOALS = [
  { n: 'Exploration', cats: ['fieldwork'] },
  { n: 'Crafting & processing', cats: ['production'] },
  { n: 'Open the store', cats: ['shop'] },
  { n: 'Market & guild', cats: ['organization'] }
];

/** Short text for an action result. */
function describe(r, c) {
  const name = c.get('actions', r.actionId).name;
  const t = r.minutes ? ` (${r.minutes} min)` : '';
  switch (r.actionId) {
    case 'travel': return `Walked to ${c.get('locations', r.to).name}${t}.`;
    case 'buy-item': return `Bought ${r.qty} ${c.get('items', r.item).name} for ${-r.gold} G${t}.`;
    case 'sell-item': return `Sold ${r.qty} ${c.get('items', r.item).name} for ${r.gold} G${t}.`;
    case 'serve-customer': return `${r.customers} customers, ${r.sold} bought: +${r.gold} G${t}.`;
    case 'brew': case 'concoct': return r.qty ? `Made ${r.qty} ${c.get('items', r.product).name}, quality ${r.tier}${t}.` : `Batch failed (quality ${r.tier}). It goes to compost.`;
    case 'gather-harvest': return `Gathered ${r.got.map((g) => `${g.qty} ${c.get('items', g.item).name}`).join(', ') || 'nothing'}${t}.`;
    case 'collect-batch': return `Collected ${r.collected} dried${t}.`;
    case 'sleep': return 'Slept. A new day starts.';
    case 'eat': return `Ate ${r.meal}: +${r.gained} energy${t}.`;
    case 'small-rest': return `Small rest: +${r.gained} energy${t}.`;
    default: return `${name} done${t}.`;
  }
}

/** @param {string} w */
function cap(w) { return w[0].toUpperCase() + w.slice(1); }
