import { Dom } from './Dom.js';
import { PlaceView } from './PlaceView.js';

const h = Dom.h;

/** RestView: short break, eat a meal, sleep (ends the day). */
export class RestView {
  constructor(ui) { this.ui = ui; }

  render() {
    const ui = this.ui, st = ui.st;
    const card = (icon, title, id, gain, cost, extra) => {
      const pv = ui.preview(id);
      return Dom.slim('', h('div.mini', Dom.medal(icon, 72), h('h5', title),
        h('div.costrow', gain, cost), extra,
        Dom.btn(title, () => ui.act(id), { cls: id === 'sleep' ? 'gold.sm' : 'sm', icon, disabled: !!pv.reason, title: ui.why(pv.reason) })));
    };
    const goal = st.plan.goals[st.cal.day - 1];
    const met = goal ? ui.sys.plan.goalMet(goal, st.day) : null;
    return PlaceView.win(ui, 'bed', 'Rest', [h('div.cardgrid',
      card('rest', 'Short break', 'shortBreak', h('span', Dom.icon('energy', 16), `+${ui.num('SHORT_BREAK_ENERGY')}`), h('span', Dom.icon('clock', 16), Dom.mins(ui.num('SHORT_BREAK_MIN')))),
      card('meal', 'Eat a meal', 'eat', h('span', Dom.icon('energy', 16), `+${ui.num('MEAL_ENERGY')}`), h('span', Dom.icon('meal', 16), `${st.inv['meal|pack|'] ?? 0}`), Dom.dots(ui.num('MEALS_PER_DAY'), Array.from({ length: ui.num('MEALS_PER_DAY') }, (_, i) => i < st.day.meals ? 'f' : ''))),
      card('sleep', 'Sleep', 'sleep', h('span', Dom.icon('energy', 16), st.day.meals ? 'full' : `${ui.num('ENERGY_HUNGRY_MAX')}`), h('span', Dom.icon('star', 16), met ? Dom.icon('check', 16) : Dom.icon('x', 14))))
    ], [], 'one');
  }
}
