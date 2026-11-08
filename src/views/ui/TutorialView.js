import { MSG } from '../../core/EventBus.js';
import { Dom } from './Dom.js';

const h = Dom.h;

/**
 * TutorialView: the first-week guide (user decision 8 Nov 2026). A neighbour talks in a dialogue box at the
 * bottom of the screen, the first time the player sees a screen (data/tutorial/tutorial.json).
 * Next shows the next line; Skip closes this step; Skip all tips turns the guide off.
 * Seen steps go to GameState through an intent (the view never changes GameState).
 */
export class TutorialView {
  constructor(ui) { this.ui = ui; }

  /** The step to show now, or null. */
  step() {
    const ui = this.ui, st = ui.st, L = ui.local;
    if (L.screen !== 'game' || st.tutorialOff || L.walk || L.card || L.recap || L.review || st.pendingEvent) return null;
    const t = ui.c.find('tutorial', 'tutorial');
    if (!t) return null;
    const seen = st.tutorialSeen ?? [];
    const week = ui.sys.time.absWeek();
    return t.steps.find((s) => !seen.includes(s.id) && this.#match(s.when ?? {}, week)) ?? null;
  }

  #match(w, week) {
    const st = this.ui.st, L = this.ui.local;
    if (w.phase && w.phase !== st.phase) return false;
    if (w.week && w.week !== week) return false;
    if (w.month && w.month !== st.cal.month) return false;
    if (w.place && (w.place !== st.place || L.map || L.journal || L.station)) return false;
    if (w.station && (L.station !== w.station || L.journal || L.map)) return false;
    return true;
  }

  /** @param {{id:string, lines:string[]}} step */
  render(step) {
    const ui = this.ui, L = ui.local;
    const sp = ui.c.get('tutorial', 'tutorial').speaker;
    if (L.tut?.id !== step.id) L.tut = { id: step.id, i: 0 };
    const i = Math.min(L.tut.i, step.lines.length - 1);
    const last = i >= step.lines.length - 1;
    const done = () => { L.tut = null; ui.send(MSG.INTENT_TUTORIAL_SEEN, { id: step.id }); };
    return Dom.rattan('tutor',
      h('div.who', Dom.medal(sp.icon, 64), h('b', sp.name), h('small', sp.role)),
      h('div.say',
        h('p', ui.fill(step.lines[i])),
        h('div.row',
          Dom.dots(step.lines.length, step.lines.map((_, k) => (k <= i ? 'f' : ''))),
          h('span.spacer'),
          Dom.btn('Skip all tips', () => { L.tut = null; ui.send(MSG.INTENT_TUTORIAL_SEEN, { id: step.id, all: true }); }, { cls: 'alt.sm' }),
          last ? null : Dom.btn('Skip', done, { cls: 'alt.sm', icon: 'skip' }),
          Dom.btn(last ? 'Got it' : 'Next', () => { if (last) done(); else ui.set({ tut: { id: step.id, i: i + 1 } }); }, { cls: 'gold.sm', icon: last ? 'check' : 'next' }))));
  }
}
