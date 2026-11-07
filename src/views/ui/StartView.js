import { Dom } from './Dom.js';

const h = Dom.h;

/**
 * StartView: Start menu (New game, Continue) and the Story letter (Scene & Flow: Start menu -> Story -> Plan).
 */
export class StartView {
  constructor(ui) { this.ui = ui; }

  render() {
    return this.ui.local.screen === 'story' ? this.#story() : this.#menu();
  }

  #menu() {
    const ui = this.ui;
    return h('div.title',
      h('div', { style: { textAlign: 'center' } },
        h('div.logo', 'BloomLunas', h('small', 'HERB SHOP · JAM BUILD')),
        h('div.menu',
          Dom.btn('New game', () => ui.o.onNewGame(), { cls: 'gold', icon: 'herb' }),
          ui.o.hasSave?.() ? Dom.btn('Continue', () => ui.o.onContinue(), { icon: 'journal' }) : null)));
  }

  #story() {
    const ui = this.ui, p = ui.c.get('story', 'premise');
    return h('div.title',
      Dom.rattan('letter',
        ...Dom.corners(),
        h('div', { style: { position: 'relative', zIndex: 1 } },
          h('div.row', Dom.medal('quest', 48), h('div', h('div.kick', p.from), h('h2', p.title))),
          ...p.paragraphs.map((t) => h('p', t)),
          h('p.sign', p.sign),
          h('div.row.end', { style: { marginTop: '24px' } }, Dom.btn('Open the Journal', () => ui.o.onStoryDone(), { cls: 'gold', icon: 'journal' })))));
  }
}
