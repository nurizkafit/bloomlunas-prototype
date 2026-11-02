import { MSG } from '../../core/EventBus.js';
import { DAYS } from '../../systems/PlanValidator.js';
import { ic, iconFor, colorFor } from './icons.js';

/**
 * ActionMenuView: click a location -> its activities -> their actions (SPECS §4).
 * Starting an activity sends intent.startActivity, then intent.runAction travel (the avatar walks there).
 * Each action has its own small form (item, quantity, recipe, quest, service). Results show in the HUD log.
 * Reads GameState; sends intents only. Unity: radial or list menu on the location.
 */
export class ActionMenuView {
  /** @param {HTMLElement} root @param {import('../../core/GameManager.js').GameManager} gm @param {import('./CraftView.js').CraftView} craft */
  constructor(root, gm, craft) {
    this.gm = gm; this.c = gm.content; this.s = gm.state; this.craft = craft;
    this.el = document.createElement('aside');
    this.el.className = 'amenu';
    this.el.hidden = true;
    root.appendChild(this.el);
    this.locId = null;
    this.el.addEventListener('click', (e) => this.#click(e));
    const rerender = () => { if (!this.el.hidden) this.render(); };
    for (const m of [MSG.ACTION_COMPLETED, MSG.ACTION_REFUSED, MSG.ACTION_STARTED, MSG.INVENTORY_CHANGED]) gm.bus.on(m, rerender);
    gm.bus.on(MSG.PHASE_ENTERED, () => this.close());
  }

  /** @param {string} locId */
  open(locId) {
    this.locId = locId;
    this.el.hidden = false;
    this.render();
  }

  close() { this.el.hidden = true; this.locId = null; }

  #activitiesHere() {
    return this.c.all('activities').filter((a) => a.locationIds.includes(this.locId));
  }

  render() {
    const loc = this.c.get('locations', this.locId), p = this.s.player, day = this.s.calendar.day;
    const h = loc.openHours?.[day];
    const here = p.location === this.locId;
    const cur = p.activityId && this.c.get('activities', p.activityId);
    const active = cur && here && cur.locationIds.includes(this.locId) ? cur : null;
    const acts = this.#activitiesHere();
    const list = acts.map((a) => `<button class="arow${active?.id === a.id ? ' on' : ''}" data-act="${a.id}" style="--k:${colorFor(a)}">${ic(iconFor(a))}<span><b>${a.name}</b><small>${a.actionIds.filter((x) => x !== 'travel').map((x) => this.c.get('actions', x).name).join(' · ')}</small></span></button>`).join('');
    let body = `<div class="sec">Activities here</div>${list}`;
    if (!here) body += `<p class="hint">Walk time from ${this.c.get('locations', p.location).name}: ${this.gm.ctx.sys.actions.walkMinutes(p.location, this.locId)} min.</p>`;
    if (active) body += `<div class="sec">${active.name} · actions</div>${active.actionIds.filter((x) => x !== 'travel').map((x) => this.#actionForm(this.c.get('actions', x))).join('')}`;
    this.el.innerHTML = `<button class="x" data-close aria-label="Close">×</button>
      <h3>${loc.name}</h3>
      <p class="sub">${h ? (h[0] === 0 && h[1] === 24 ? 'Open all day' : `Open ${DAYS[day]} ${h[0]}:00–${h[1]}:00`) : `Closed on ${DAYS[day]}`}${here ? ' · You are here' : ''}</p>
      ${body}`;
  }

  #cost(a) {
    const e = a.energyKey ? this.c.num(a.energyKey) : 0;
    const t = a.kind === 'grind' ? `${a.timeMin} min/unit` : a.timeMin ? `${a.timeMin} min` : a.kind === 'craft' ? 'recipe time' : '';
    return [t, e ? `${e} energy` : ''].filter(Boolean).join(' · ');
  }

  #actionForm(a) {
    const inv = this.s.inventory, ent = this.c.get('locations', this.locId).entityId;
    const entity = ent ? this.c.get('entities', ent) : null;
    const btn = (label, extra = '') => `<button class="go sm" data-run="${a.id}" ${extra}>${label}</button>`;
    const wrap = (inner) => `<div class="aform"><div class="ah"><b>${a.name}</b><small>${this.#cost(a)}</small></div>${inner}</div>`;
    const qty = (max = 20, v = 1) => `<input type="number" name="qty" min="1" max="${max}" value="${v}" aria-label="Quantity">`;
    switch (a.kind) {
      case 'buyItem': {
        const list = this.gm.ctx.sys.economy.sellsList(this.c.get('locations', this.locId));
        return wrap(`<select name="item">${list.map((id) => { const it = this.c.get('items', id); return `<option value="${id}">${it.name} (${it.variants[0].id}) · ${it.forecast.lo}–${it.forecast.hi} G</option>`; }).join('')}</select>${qty()}${btn('Buy')}`);
      }
      case 'sellItem': {
        const lots = inv.find((l) => entity?.buys?.includes(l.item) && !l.spoiled && l.tier !== 'Failed');
        const opts = [...new Map(lots.map((l) => [`${l.item}|${l.variant}|${l.tier ?? ''}`, l])).values()];
        if (!opts.length) return wrap('<p class="hint">You have nothing this guild buys.</p>');
        return wrap(`<select name="lot">${opts.map((l) => `<option value="${l.item}|${l.variant}|${l.tier ?? ''}">${this.c.get('items', l.item).name} · ${l.tier ?? l.variant} (have ${inv.count(l.item, l.variant, { tier: l.tier ?? undefined })})</option>`).join('')}</select>${qty()}${btn('Sell')}`);
      }
      case 'craft': return wrap(`<button class="go sm" data-craft="${a.id}">Choose recipe</button>`);
      case 'startBatch': {
        const items = this.c.all('items').filter((i) => i.variants?.some((v) => v.id === 'dried') && inv.count(i.id, 'fresh') > 0);
        if (!items.length) return wrap('<p class="hint">No fresh material that can dry.</p>');
        return wrap(`<select name="item">${items.map((i) => `<option value="${i.id}">${i.name} (fresh: ${inv.count(i.id, 'fresh')})</option>`).join('')}</select>${qty(this.c.num('SUN_DRYING_RACK_CAPACITY'), 2)}${btn('Start')}`);
      }
      case 'collectBatch': {
        const b = this.s.batches.map((x) => `${x.qty} ${x.item}, ready day ${x.readyDay - (this.s.calendar.absDay() - this.s.calendar.day) + 1 + (this.s.calendar.week - 1) * 7}`).join('; ');
        return wrap(`<p class="hint">${b || 'No batch on the rack.'}</p>${btn('Collect')}`);
      }
      case 'grind': {
        const items = this.c.all('items').filter((i) => inv.count(i.id, 'dried') > 0);
        if (!items.length) return wrap('<p class="hint">No dried material to grind.</p>');
        return wrap(`<select name="item">${items.map((i) => `<option value="${i.id}">${i.name} (dried: ${inv.count(i.id, 'dried')})</option>`).join('')}</select>${qty(20, 1)}${btn('Grind')}`);
      }
      case 'takeQuest': {
        const qs = (entity?.questBoard ?? []).filter((q) => !this.s.quests.some((x) => x.id === q.id));
        if (!qs.length) return wrap('<p class="hint">No new quest on the board.</p>');
        return wrap(qs.map((q) => `<div class="qrow"><span>${q.ask.qty} ${this.c.get('items', q.ask.item).name} · ${q.rewardGold} G · ${q.deadlineDays} days</span><button class="go sm" data-run="${a.id}" data-quest="${q.id}">Take</button></div>`).join(''));
      }
      case 'handInQuest': {
        const qs = this.s.quests.filter((q) => q.entityId === ent);
        if (!qs.length) return wrap('<p class="hint">No active quest for this guild.</p>');
        return wrap(qs.map((q) => `<div class="qrow"><span>${q.ask.qty} ${this.c.get('items', q.ask.item).name} (have ${inv.count(q.ask.item)})</span><button class="go sm" data-run="${a.id}" data-quest="${q.id}">Hand in</button></div>`).join(''));
      }
      case 'service': {
        const svcs = entity?.services ?? [];
        if (!svcs.length) return wrap('<p class="hint">No service here.</p>');
        return wrap(svcs.map((sv) => `<div class="qrow"><span>${sv.name} · ${sv.cost} G</span><button class="go sm" data-run="${a.id}" data-service="${sv.id}">Use</button></div>`).join('') + '<p class="hint">Needs an appointment today (book it in Act).</p>');
      }
      case 'eventResponse': return '';
      default: return wrap(btn(a.kind === 'sleep' ? 'Sleep (ends the day)' : 'Do it'));
    }
  }

  #click(e) {
    const bus = this.gm.bus;
    if (e.target.closest('[data-close]')) { this.close(); return; }
    const act = e.target.closest('[data-act]');
    if (act) {
      bus.emit(MSG.INTENT_START_ACTIVITY, { activityId: act.dataset.act });
      if (this.s.player.location !== this.locId) bus.emit(MSG.INTENT_RUN_ACTION, { actionId: 'travel', params: { to: this.locId } });
      this.render();
      return;
    }
    const cr = e.target.closest('[data-craft]');
    if (cr) { this.craft.open(cr.dataset.craft); return; }
    const run = e.target.closest('[data-run]');
    if (!run) return;
    const form = run.closest('.aform');
    const val = (n) => form.querySelector(`[name="${n}"]`)?.value;
    const params = {};
    if (val('item')) params.item = val('item');
    if (val('qty')) params.qty = Number(val('qty'));
    if (val('lot')) { const [item, variant, tier] = val('lot').split('|'); Object.assign(params, { item, variant, tier: tier || undefined }); }
    if (run.dataset.quest) params.questId = run.dataset.quest;
    if (run.dataset.service) params.serviceId = run.dataset.service;
    bus.emit(MSG.INTENT_RUN_ACTION, { actionId: run.dataset.run, params });
  }
}
