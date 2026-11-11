import { Dom } from '../ui/Dom.js';
import { Icons } from '../ui/Icons.js';
import { Ornaments } from '../ui/Ornaments.js';
import { InterfaceSheet } from './InterfaceSheet.js';
import { SheetDownloads } from './SheetDownloads.js';
import { SpriteMap } from './SpriteMap.js';

const h = Dom.h;

/**
 * UnityAssets: the Unity assets page (unity.html, user 11 Nov 2026).
 * It shows only the sprites a Unity UI needs: text-free skins (frames, buttons, plates, chips, bars, slots),
 * ornaments and icons. A skin that stretches is drawn as a compact 9-slice sprite: corners and edges,
 * with a small stretch area in the middle. The dashed lines show the 9-slice borders.
 * Each button state is its own sprite (Unity Sprite Swap). Soft drop shadows are left out (add them in Unity);
 * outlines and the hard 3D lip under a button stay in the sprite.
 * npm run export:unity writes the PNGs (2x) and the manifest to assets/unity-export/.
 */
export class UnityAssets {
  /** @param {import('../../core/ContentDB.js').ContentDB} content */
  constructor(content) {
    this.c = content;
    this.sheet = new InterfaceSheet(content);
    this.downloads = new SheetDownloads({
      base: './unity-export/', zipName: 'bloomlunas-unity', cmd: 'npm run export:unity',
      intro: 'Unity sprites: PNG at 2x, clear background, no text. Tick the sprites you want, or use the PNG link under a sprite.'
    });
  }

  /** @param {HTMLElement} root */
  mount(root) {
    Ornaments.mount(document.body);
    const secs = this.sections();
    root.append(this.header(secs), this.downloads.bar(), ...secs.map((s) => this.section(s)), this.notes());
    UnityAssets.flatten();
    this.measure();
    document.fonts?.ready?.then(() => this.measure());
    this.downloads.mount();
    document.body.dataset.ready = '1';
  }

  /**
   * Find the room each sprite needs around its box (outlines, the 3D lip, ornaments that stick out),
   * the same on all states of one part, so Sprite Swap states have the same size. Then draw the 9-slice lines.
   */
  measure() {
    document.querySelectorAll('.u-big').forEach((w) => w.classList.remove('u-big'));
    for (const card of document.querySelectorAll('.sh-card')) {
      const pad = [0, 0, 0, 0];
      const vars = [...card.querySelectorAll('.sh-var[data-file]')];
      for (const v of vars) {
        const box = v.firstElementChild.getBoundingClientRect();
        for (const n of v.firstElementChild.querySelectorAll('*')) {
          if (n.classList.contains('u-guide')) continue;
          const cs = getComputedStyle(n);
          if (cs.visibility === 'hidden' || cs.display === 'none') continue;
          const q = n.getBoundingClientRect();
          if (q.width && q.height) { pad[0] = Math.max(pad[0], box.left - q.left); pad[1] = Math.max(pad[1], q.right - box.right); pad[2] = Math.max(pad[2], box.top - q.top); pad[3] = Math.max(pad[3], q.bottom - box.bottom); }
          for (const s of UnityAssets.shadows(cs.boxShadow)) {
            if (s.inset) continue;
            pad[0] = Math.max(pad[0], box.left - (q.left + s.x - s.spread)); pad[1] = Math.max(pad[1], q.right + s.x + s.spread - box.right);
            pad[2] = Math.max(pad[2], box.top - (q.top + s.y - s.spread)); pad[3] = Math.max(pad[3], q.bottom + s.y + s.spread - box.bottom);
          }
        }
      }
      // +2 px: anti-aliasing and the 1-2 px move of the hover and pressed states.
      const p = pad.map((x) => Math.ceil(Math.max(0, x)) + 2).join(',');
      for (const v of vars) {
        v.dataset.pad = p;
        UnityAssets.guides(v);
      }
    }
    // Small sprites show at 2x on the page, so the 9-slice lines are easy to see. The export draws them at 1x.
    for (const w of document.querySelectorAll('.u-spr')) if (Math.max(w.offsetWidth, w.offsetHeight) <= 64) w.classList.add('u-big');
  }

  /** Take out soft drop shadows (blur, outside) and drop-shadow filters. Outlines, insets and the hard 3D lip stay. */
  static flatten() {
    for (const n of document.querySelectorAll('.u-spr *')) {
      const cs = getComputedStyle(n);
      const parts = cs.boxShadow === 'none' ? [] : cs.boxShadow.split(/,(?![^(]*\))/);
      const keep = parts.filter((x) => { const s = UnityAssets.shadows(x)[0]; return s.inset || s.blur === 0; });
      if (keep.length !== parts.length) n.style.boxShadow = keep.length ? keep.join(',') : 'none';
      if (/drop-shadow/.test(cs.filter)) n.style.filter = cs.filter.replace(/drop-shadow\((?:[^()]|\([^()]*\))*\)/g, '').trim() || 'none';
    }
  }

  /** Parse a computed box-shadow list. @param {string} s */
  static shadows(s) {
    if (!s || s === 'none') return [];
    return s.split(/,(?![^(]*\))/).map((x) => {
      const nums = x.replace(/rgba?\([^)]*\)|#[0-9a-f]+/gi, '').match(/-?[\d.]+px/g)?.map(parseFloat) ?? [];
      return { inset: /inset/.test(x), x: nums[0] ?? 0, y: nums[1] ?? 0, blur: nums[2] ?? 0, spread: nums[3] ?? 0 };
    });
  }

  /** Dashed 9-slice lines over the sprite (not in the PNG). @param {HTMLElement} v */
  static guides(v) {
    const wrap = v.firstElementChild;
    wrap.querySelectorAll(':scope > .u-guide').forEach((g) => g.remove());
    if (!v.dataset.nine) return;
    const [l, r, t, b] = v.dataset.nine.split(',').map(Number);
    const line = (side, at) => wrap.append(h(`i.u-guide.${side}`, { style: { [side]: `${at}px` } }));
    if (l) line('left', l); if (r) line('right', r); if (t) line('top', t); if (b) line('bottom', b);
  }

  /* ---------- page parts ---------- */

  header(secs) {
    const n = secs.reduce((a, s) => a + s.items.reduce((m, it) => m + it.vars.length, 0), 0);
    return h('header.sh-head',
      h('div',
        h('h1', 'BloomLunas Unity assets'),
        h('p', `${n} sprites for the Unity UI, with no text: skins, ornaments and icons. Put the text on top with TextMeshPro. `,
          'A part that stretches is a compact 9-slice sprite. The dashed lines show its borders. Each button state is its own sprite. ',
          'The IDs are the IDs of the interface sheet (sheet.html). The art is placeholder until the hand-drawn art is ready.'),
        h('div.sh-index', secs.map((s) => h('a', { href: `#${s.code}` }, `${s.code} ${s.title}`)), h('a', { href: '#notes' }, 'How to use in Unity'), h('a', { href: './sheet.html' }, 'Interface sheet'))),
      h('div.sh-key',
        h('span', h('i.u-key'), '9-slice border'),
        h('span', 'Sprites up to 64 px show at 2x here'),
        h('span', h('b', 'Sliced'), ' stretch the middle'),
        h('span', h('b', 'Tiled'), ' repeat the middle (texture)'),
        h('span', h('b', 'Simple'), ' fixed sprite')));
  }

  section(s) {
    return h('section.sh-sec', { id: s.code },
      h('h2', h('code', s.code), s.title, s.sub ? h('small', s.sub) : null),
      h('div.sh-grid', s.items.map((it) => this.card(it))));
  }

  /**
   * @param {{id:string, name:string, used:string, mode:'Sliced'|'Tiled'|'Simple', size:[number, number], nine?:number[], bg?:string, w?:number, note?:string,
   *   vars:[string, HTMLElement][]}} it  size and nine are in 1x px; nine = left, right, top, bottom.
   */
  card(it) {
    const [w, ht] = it.size;
    const vars = it.vars.map(([tag, el]) => {
      const tgt = el.classList.contains('u-tgt') ? el : (el.querySelector('.u-tgt') ?? el);
      Object.assign(tgt.style, { width: `${w}px`, height: `${ht}px`, minWidth: '0', minHeight: '0', margin: '0', flex: 'none' });
      const wrap = h('div.u-spr', { style: { width: `${w}px`, height: `${ht}px` } }, el);
      return h('div.sh-var', { 'data-id': it.id, 'data-name': it.name, 'data-variant': tag, 'data-mode': it.mode, 'data-nine': it.nine ? it.nine.join(',') : '',
        'data-file': this.sheet.fileName(it.id, it.name, tag) }, wrap, h('span.sh-tag', tag));
    });
    const nine = it.nine ? `9-slice L ${it.nine[0]} R ${it.nine[1]} T ${it.nine[2]} B ${it.nine[3]} (1x px)` : 'No 9-slice';
    // Links to the sheet parts that use this sprite (SpriteMap). The sheet links back to this card by its anchor.
    const uses = SpriteMap.uses(it.id, it.name);
    return h('div.sh-card', { style: { width: `${Math.max(260, it.w ?? 320)}px` }, id: SpriteMap.anchor(it.id, it.name) },
      h(`div.sh-stage.bg-${it.bg ?? 'paper'}`, vars),
      h('div.sh-meta',
        h('div.sh-id', h('code', it.id), h('b', it.name)),
        h('div.sh-cls', `${it.mode} · ${w} x ${ht} · ${nine}`),
        h('div.sh-used', h('b', 'Use for: '), it.used),
        h('div.sh-links', h('b', 'Used by (sheet): '), uses.map((id) => h('a', { href: `./sheet.html#${id}`, title: `Open ${id} on the interface sheet` }, id))),
        it.note ? h('div.sh-note', it.note) : null));
  }

  notes() {
    const li = (ids, text) => h('li', h('b.ids', ids), ' ', text);
    return h('section.sh-notes', { id: 'notes' },
      h('div.sh-box',
        h('h2', 'How to use in Unity'),
        h('ol',
          h('li', 'Download the sprites (or all) with the bar at the top. The zip has png/ and manifest.json / manifest.csv.'),
          h('li', 'Import settings: Texture Type = Sprite (2D and UI), Mesh Type = Full Rect, Compression = None or High Quality.'),
          h('li', 'The PNGs are 2x. Set Pixels Per Unit = 200 when the Canvas Reference Pixels Per Unit is 100, so Set Native Size gives the 1x size.'),
          h('li', 'Sprite Editor > Border: use nine_*_px from the manifest (PNG pixels). The 1x values are in nine_left to nine_bottom.'),
          h('li', 'Image Type: use the mode column. Sliced for most skins. Tiled for skins with a texture (rattan, paper grain, dashed lines).'),
          h('li', 'Buttons: Transition = Sprite Swap. Normal, Highlighted (hover), Pressed and Disabled are separate sprites with the same size.'),
          h('li', 'Sprites with a white fill take their colour from the game data (goal colours). Set Image Color in Unity.'),
          h('li', 'Soft drop shadows are not in the sprites. Add a Shadow component, or a blurred shadow sprite, if you want them.'),
          h('li', 'Text, numbers and icons go on top: TextMeshPro for text, the ICN sprites for icons.'))),
      h('div.sh-box',
        h('h2', 'Parts that use the same skin'),
        h('ul',
          li('FRM-01', 'Rattan frame: station window (FRM-04), modal cards (CRD-01 to CRD-06), guide dialogue (CRD-19, DLG-02), end scene (CRD-20, DLG-03), story letter.'),
          li('FRM-02', 'Slim frame: phase plaque (TTL-01), location header (TTL-04), today goal (HUD-05), station menu (LST-03), mini card (CRD-09), place info (CRD-10).'),
          li('FRM-07', 'Inset panel: stat tile (CRD-11), jar box (CRD-12), day cell (CRD-13).'),
          li('BTN-01 / 02 / 03', 'Ribbon action (BTN-07) = gold. Start menu (BTN-08) = teal. Event response (BTN-09) = paper. The skins stretch in height too.'),
          li('BTN-04', 'Mode tabs (BTN-15): on = teal or gold small, off = paper small.'),
          li('BTN-11', 'Close X, stepper plus and minus (VAL-01, VAL-02): the round icon button with an ICN icon on top.'),
          li('VAL-01', 'The big stepper number box (VAL-02) uses the same skin.'))),
      h('div.sh-box',
        h('h2', 'Not on this page'),
        h('ul',
          h('li', 'Text-only parts: titles, kicker labels, value lines, page numbers, the game logo (TTL-09). Use TextMeshPro.'),
          h('li', 'Plain colour: the modal veil (FRM-06). Use a full-screen Image with colour #0E1B1C at 55% alpha (rgba(14,27,28,.55) in theme.css).'),
          h('li', 'Parts drawn in code: line chart (VAL-10), sleep transition (CRD-17), explore trail path (STN-05). The day dial (HUD-01) is here only as a sample.'),
          h('li', 'Tables on Journal pages (LST-04 to LST-06): lines and text only.'))));
  }

  /* ---------- the catalogue ---------- */

  sections() {
    const W = '#FFFFFF';
    const btn = (cls) => h(`button.btn${cls ? '.' + cls : ''}`);
    const hover = (el) => { el.style.filter = 'brightness(1.1)'; el.style.transform = 'translateY(-1px)'; return el; };
    const press = (el) => { el.style.transform = 'translateY(2px)'; el.style.boxShadow = '0 0 0 2px var(--rattan), 0 0 0 4px var(--woodD), 0 1px 0 #0e1d1e'; return el; };
    const dis = (el) => { el.disabled = true; return el; };
    const states = (make) => [['normal', make()], ['hover', hover(make())], ['pressed', press(make())], ['disabled', dis(make())]];
    /** A parent that only gives the CSS context (no look of its own). */
    const ctx = (cls, kid, style = {}) => h(`div.${cls}.u-ctx`, { style }, kid);
    const frame = (cls) => h(`div.${cls}.u-tgt`, h('div.in'));
    const dial = (o) => { const d = this.sheet.dial(o); d.classList.add('u-dial', 'u-tgt'); return d; };

    return [
      { code: 'FRM', title: 'Frames and panels', items: [
        { id: 'FRM-01', name: 'Rattan frame skin', mode: 'Tiled', size: [72, 72], nine: [28, 28, 28, 28], bg: 'teal', used: 'Big windows and cards. Put a Sliced paper inner panel inside it, or use it as is.',
          note: 'The rattan is a woven texture: use Image Type Tiled so the weave does not stretch.', vars: [['default', frame('rf')]] },
        { id: 'FRM-02', name: 'Slim frame skin', mode: 'Sliced', size: [40, 40], nine: [16, 16, 16, 16], bg: 'teal', used: 'Small panels: plaque, location header, today goal, station menu, mini cards.',
          vars: [['default', frame('sf')], ['selected', frame('sf.on')]] },
        { id: 'FRM-05', name: 'Planner Book cover', mode: 'Sliced', size: [96, 96], nine: [32, 32, 32, 32], bg: 'scene', used: 'Book behind the Journal pages.',
          vars: [['default', h('div.book.u-tgt', { style: { position: 'relative', left: 'auto', top: 'auto', bottom: 'auto', padding: '0' } }, h('div.tool'), h('div.tool2'))]] },
        { id: 'FRM-05', name: 'Planner Book spine', mode: 'Simple', size: [40, 32], bg: 'scene', used: 'Centre of the book, between the pages. Stretch it to the book height.',
          vars: [['default', h('div.u-tgt', ctx('book', h('div.spineband', { style: { left: '0', width: '40px' } }), { position: 'relative', inset: 'auto', width: '40px', height: '32px', padding: '0', background: 'none', boxShadow: 'none' }))]] },
        { id: 'FRM-05', name: 'Planner Book page', mode: 'Sliced', size: [100, 72], nine: [12, 48, 12, 12], bg: 'teal', used: 'Left and right Journal page. The dark hatch is the fold.',
          note: 'Paper grain: Tiled keeps the grain sharp on large pages.', vars: [['left', h('div.pg.l.u-tgt')], ['right', (() => { const p = h('div.pg.r.u-tgt'); return p; })()]] },
        { id: 'FRM-07', name: 'Inset panel', mode: 'Sliced', size: [28, 28], nine: [11, 11, 11, 11], bg: 'page', used: 'Stat tile, jar box, day cell, note pick.',
          vars: [['default', h('div.stat.u-tgt')]] },
        { id: 'LST-02', name: 'Table frame', mode: 'Sliced', size: [28, 28], nine: [10, 10, 10, 10], used: 'Station lists (compact table).',
          vars: [['default', h('div.tlst.u-tgt')]] },
        { id: 'LST-12', name: 'Log box', mode: 'Sliced', size: [28, 28], nine: [10, 10, 10, 10], bg: 'page', used: 'Journal, Log page.',
          vars: [['default', h('div.logbox.u-tgt', { style: { overflow: 'hidden' } })]] },
        { id: 'STN-01', name: 'Shelf board', mode: 'Sliced', size: [28, 28], nine: [11, 11, 11, 11], used: 'Store shelf and drying rack, behind the slots.',
          vars: [['default', h('div.shelf.u-tgt', { style: { display: 'block' } })]] },
        { id: 'STN-05', name: 'Trail panel', mode: 'Sliced', size: [28, 28], nine: [11, 11, 11, 11], used: 'City outskirt window, behind the trail path.',
          vars: [['default', h('div.trail.u-tgt')]] }
      ] },
      { code: 'ORN', title: 'Ornaments', items: [
        { id: 'ORN-01', name: 'Corner ornament', mode: 'Simple', size: [72, 72], bg: 'paper', w: 400, used: 'Corners of the book, event card, spot card, story letter. One sprite per corner (or flip the top-left one).',
          vars: ['tl', 'tr', 'bl', 'br'].map((c) => [c, ctx('u-tgt', Dom.raw(`<svg class="corner ${c}" viewBox="0 0 120 120" style="position:static"><use href="#nouveau"/></svg>`))]) },
        { id: 'ORN-02', name: 'Divider', mode: 'Simple', size: [400, 16], bg: 'page', w: 460, used: 'Act page, under the appointment cards.',
          vars: [['default', h('div.u-tgt', Dom.divider())]] }
      ] },
      { code: 'TTL', title: 'Plates', items: [
        { id: 'TTL-02', name: 'Window title plate', mode: 'Sliced', size: [136, 32], nine: [60, 60, 0, 0], used: 'Top of every station window. Fixed height.',
          vars: [['default', h('div.plate.u-tgt')]] },
        { id: 'LST-02', name: 'Table header bar', mode: 'Simple', size: [32, 28], used: 'Header row of station lists. Stretch it to the table width.',
          vars: [['default', h('div.tlh.u-tgt')]] }
      ] },
      { code: 'BTN', title: 'Buttons and tabs', sub: 'One sprite per state, for Sprite Swap', items: [
        { id: 'BTN-01', name: 'Teal button skin', mode: 'Sliced', size: [56, 40], nine: [20, 20, 18, 18], w: 380, used: 'Secondary actions, Start menu buttons.', vars: states(() => btn('')) },
        { id: 'BTN-02', name: 'Paper button skin', mode: 'Sliced', size: [56, 40], nine: [20, 20, 18, 18], w: 380, used: 'Back and cancel, event response buttons.', vars: states(() => btn('alt')) },
        { id: 'BTN-03', name: 'Gold button skin', mode: 'Sliced', size: [56, 40], nine: [20, 20, 18, 18], w: 380, used: 'Main action of a screen, ribbon action button.', vars: states(() => btn('gold')) },
        { id: 'BTN-04', name: 'Small teal button skin', mode: 'Sliced', size: [40, 32], nine: [16, 16, 14, 14], w: 380, used: 'Small buttons in panels, mode tab (on).', vars: states(() => btn('sm')) },
        { id: 'BTN-04', name: 'Small paper button skin', mode: 'Sliced', size: [40, 32], nine: [16, 16, 14, 14], w: 380, used: 'Small buttons in panels, mode tab (off), icon-only button (BTN-05).', vars: states(() => btn('alt.sm')) },
        { id: 'BTN-04', name: 'Small gold button skin', mode: 'Sliced', size: [40, 32], nine: [16, 16, 14, 14], w: 380, used: 'Small main actions: Go, Sleep.', vars: states(() => btn('gold.sm')) },
        { id: 'BTN-10', name: 'Round HUD button', mode: 'Simple', size: [56, 56], bg: 'teal', w: 300, used: 'HUD: Town, Journal. Icon on top.',
          vars: [['normal', h('div.rb.u-tgt', h('i'))], ['on', h('div.rb.on.u-tgt', h('i'))]] },
        { id: 'BTN-11', name: 'Round icon button', mode: 'Simple', size: [32, 32], w: 300, used: 'Close X, stepper plus and minus. Icon on top.',
          vars: [['normal', h('button.iconbtn.u-tgt')], ['disabled', h('button.iconbtn.u-tgt', { disabled: true })]] },
        { id: 'VAL-03', name: 'Mini round button', mode: 'Simple', size: [20, 20], w: 260, used: 'Plus and minus in trade tables.',
          vars: [['normal', ctx('mstep', h('button.u-tgt'))], ['disabled', ctx('mstep', h('button.u-tgt', { disabled: true }))]] },
        { id: 'BTN-12', name: 'Item icon ring', mode: 'Simple', size: [28, 28], w: 260, used: 'Ring behind each item icon in lists, station menu and toasts.',
          vars: [['normal', h('button.ib.u-tgt')], ['hover', (() => { const b = h('button.ib.u-tgt'); b.style.boxShadow = '0 0 0 2px var(--tur), inset 0 0 0 1px var(--woodD)'; return b; })()]] },
        { id: 'BTN-13', name: 'Help mark disc', mode: 'Simple', size: [18, 18], bg: 'page', w: 260, used: 'After page titles. Put "?" on top.',
          vars: [['default', h('span.helpq.u-tgt')]] },
        { id: 'BTN-14', name: 'Book tab', mode: 'Simple', size: [64, 54], bg: 'teal', w: 300, used: 'Right edge of the Planner Book. Icon and label on top.',
          vars: [['normal', h('div.tab.u-tgt', { style: { filter: 'none' } })], ['on', (() => { const t = h('div.tab.on.u-tgt', { style: { filter: 'none' } }); return t; })()]] },
        { id: 'BTN-16', name: 'Price level button', mode: 'Sliced', size: [32, 32], nine: [10, 10, 10, 10], w: 380, used: 'Store window: low, fair, high price.',
          vars: ['low', 'fair', 'high'].flatMap((l) => [[l, ctx('lvpick', h(`button.lv-${l}.u-tgt`), { display: 'block' })], [`${l} on`, ctx('lvpick', h(`button.lv-${l}.on.u-tgt`), { display: 'block' })]]) },
        { id: 'BTN-17', name: 'Note pick skin', mode: 'Sliced', size: [28, 28], nine: [10, 10, 10, 10], bg: 'page', w: 300, used: 'Check page: note for next week.',
          vars: [['normal', ctx('notepick', h('button.u-tgt'), { display: 'block' })], ['on', ctx('notepick', h('button.on.u-tgt'), { display: 'block' })]] }
      ] },
      { code: 'HUD', title: 'HUD', items: [
        { id: 'HUD-01', name: 'Day dial sample', mode: 'Simple', size: [128, 128], bg: 'teal', w: 640, used: 'HUD top left. Sample only: the sky, sun or moon and the energy ring change with the hour.',
          note: 'Drawn in code. In Unity, build it from parts (sky disc, ring with Image Type Filled, sun and moon icons).',
          vars: [['morning', dial({ minute: 8 * 60, phase: 'plan' })], ['day', dial({ minute: 13 * 60 })], ['dusk', dial({ minute: 18 * 60 + 30, energy: 45 })], ['night', dial({ minute: 21 * 60 + 30, energy: 15 })]] },
        { id: 'HUD-03', name: 'Energy badge skin', mode: 'Sliced', size: [28, 20], nine: [10, 10, 9, 9], bg: 'teal', w: 260, used: 'Under the day dial.',
          vars: [['normal', ctx('daydial', h('span.en.u-tgt', { style: { position: 'static', transform: 'none', display: 'block' } }), { width: 'auto', height: 'auto', margin: '0', filter: 'none' })],
            ['low', ctx('daydial', h('span.en.low.u-tgt', { style: { position: 'static', transform: 'none', display: 'block' } }), { width: 'auto', height: 'auto', margin: '0', filter: 'none' })]] },
        { id: 'HUD-04', name: 'Stat pill skin', mode: 'Sliced', size: [44, 36], nine: [18, 18, 17, 17], bg: 'teal', w: 260, used: 'HUD row: calendar, gold, debt, food.',
          vars: [['default', h('div.pill.u-tgt', h('span', { style: { minWidth: '0', flex: '1', padding: '0' } }))]] },
        { id: 'HUD-07', name: 'Hint bar', mode: 'Simple', size: [96, 32], bg: 'scene', w: 260, used: 'Bottom of the screen. Stretch it to the screen width.',
          vars: [['default', h('div.hint.u-tgt', { style: { position: 'relative', left: 'auto', right: 'auto', bottom: 'auto' } })]] },
        { id: 'HUD-08', name: 'Key cap', mode: 'Sliced', size: [20, 20], nine: [6, 6, 6, 6], bg: 'scene', w: 260, used: 'Key letters in the hint bar (cream) and the station menu (teal).',
          vars: [['cream', ctx('hint', h('i.u-tgt'), { position: 'static', height: 'auto', padding: '0', background: 'none' })], ['teal', h('i.key.u-tgt')]] }
      ] },
      { code: 'LST', title: 'Rows', items: [
        { id: 'LST-02', name: 'Table row', mode: 'Sliced', size: [24, 36], nine: [6, 6, 0, 0], w: 380, used: 'Rows of station lists. Fixed height.',
          note: 'The normal row is only the dashed line at the bottom: use Image Type Tiled.',
          vars: [['normal', h('div.tlr.u-tgt')], ['selected', h('div.tlr.on.u-tgt')], ['has', h('div.tlr.has.u-tgt')]] },
        { id: 'LST-03', name: 'Station menu row', mode: 'Sliced', size: [28, 28], nine: [10, 10, 10, 10], w: 300, used: 'Left panel rows (stations and places).',
          vars: [['hover', h('div.srow.u-tgt', { style: { background: 'rgba(95,163,154,.14)' } })], ['selected', h('div.srow.on.u-tgt')]] },
        { id: 'LST-07', name: 'Day goal row', mode: 'Sliced', size: [28, 28], nine: [10, 10, 10, 10], bg: 'page', w: 300, used: 'Journal, Daily goals rows.',
          vars: [['normal', h('div.drow.u-tgt', { style: { display: 'block' } })], ['today', h('div.drow.now.u-tgt', { style: { display: 'block' } })], ['drop here', h('div.drow.over.u-tgt', { style: { display: 'block' } })]] },
        { id: 'LST-09', name: 'Warning line', mode: 'Sliced', size: [20, 20], nine: [7, 7, 7, 7], bg: 'page', w: 260, used: 'Plan checks and the Check page.',
          vars: [['warn', h('div.warn.u-tgt')], ['ok', h('div.warn.ok.u-tgt')]] }
      ] },
      { code: 'CRD', title: 'Cards, pop-ups and bubbles', items: [
        { id: 'CRD-07', name: 'Goal card skin', mode: 'Sliced', size: [82, 32], nine: [62, 12, 12, 12], bg: 'page', w: 380, used: 'Goal deck. The white band takes the goal colour.',
          note: 'White band: set Image Color to the goal colour from data/goals.',
          vars: [['normal', h('div.gcard.u-tgt', { style: { '--gc': W } })], ['selected', h('div.gcard.u-tgt', { style: { '--gc': W, boxShadow: '0 0 0 3px var(--tur), 0 0 0 4.5px var(--woodD)' } })]] },
        { id: 'CRD-08', name: 'Small goal card skin', mode: 'Sliced', size: [28, 28], nine: [10, 10, 10, 10], bg: 'page', w: 260, used: 'Daily goal rows. White: tint with the goal colour.',
          vars: [['default', h('div.gcard.sm.u-tgt', { style: { '--gc': W } })]] },
        { id: 'CRD-13', name: 'Goal chip skin', mode: 'Sliced', size: [28, 28], nine: [10, 10, 10, 10], bg: 'page', w: 300, used: 'Check page day cells. White: tint with the goal colour.',
          vars: [['filled', h('div.goalchip.u-tgt', { style: { background: W } })], ['empty', h('div.goalchip.empty.u-tgt')]] },
        { id: 'CRD-07', name: 'Deck over limit', mode: 'Sliced', size: [28, 28], nine: [11, 11, 11, 11], bg: 'page', w: 260, used: 'Goal deck when it has too many goals.',
          vars: [['default', h('div.deck.over.u-tgt', { style: { display: 'block', margin: '0' } })]] },
        { id: 'CRD-15', name: 'Help popup skin', mode: 'Sliced', size: [28, 28], nine: [10, 10, 10, 10], bg: 'teal', w: 260, used: 'Help popup on hover.',
          vars: [['default', h('div.helppop.u-tgt', { style: { position: 'relative', opacity: '1' } })]] },
        { id: 'CRD-16', name: 'Toast skin', mode: 'Sliced', size: [48, 44], nine: [21, 21, 20, 20], bg: 'scene', w: 380, used: 'Short messages at the bottom of the screen.',
          vars: [['normal', h('div.toast.u-tgt')], ['refusal', h('div.toast.bad.u-tgt')], ['news', h('div.toast.news.u-tgt')]] },
        { id: 'CRD-18', name: 'Walk banner skin', mode: 'Sliced', size: [56, 48], nine: [24, 24, 22, 22], bg: 'scene', w: 260, used: 'Bottom of the screen while the player walks.',
          vars: [['default', h('div.walkbar.u-tgt', { style: { position: 'relative', left: 'auto', bottom: 'auto', transform: 'none' } })]] },
        { id: 'DLG-01', name: 'Speech bubble', mode: 'Sliced', size: [28, 28], nine: [11, 11, 11, 11], w: 260, used: 'Dialogue lines in the guide box and the end scene.',
          vars: [['default', h('div.line.speech.u-tgt')]] },
        { id: 'DLG-01', name: 'Speaker tag', mode: 'Sliced', size: [24, 20], nine: [10, 10, 9, 9], w: 260, used: 'Name tag over a speech line.',
          vars: [['default', ctx('line.speech', h('span.speaker.u-tgt', { style: { display: 'block' } }), { background: 'none', boxShadow: 'none', padding: '0' })]] }
      ] },
      { code: 'CHP', title: 'Chips, badges and markers', items: [
        { id: 'CHP-01', name: 'Chip skin', mode: 'Sliced', size: [36, 28], nine: [14, 14, 13, 13], w: 460, used: 'Have and need, effects, counts, hours.',
          vars: [['normal', h('span.qchip.u-tgt')], ['ok', h('span.qchip.ok.u-tgt')], ['missing', h('span.qchip.miss.u-tgt')], ['hours', h('span.hchip.u-tgt')], ['closed', h('span.hchip.shut.u-tgt')]] },
        { id: 'CHP-04', name: 'Count badge skin', mode: 'Sliced', size: [28, 20], nine: [10, 10, 9, 9], w: 260, used: 'Ready counts and "can make".',
          vars: [['red', h('span.badge.u-tgt')], ['ok', h('span.badge.ok.u-tgt')]] },
        { id: 'CHP-05', name: 'Level chip skin', mode: 'Sliced', size: [32, 24], nine: [12, 12, 11, 11], bg: 'page', w: 260, used: 'Skills page.',
          vars: [['default', h('span.lv.u-tgt')]] },
        { id: 'CHP-06', name: 'Jar badge skin', mode: 'Sliced', size: [36, 28], nine: [14, 14, 13, 13], w: 380, used: 'Next to cost totals. Jar graphic and text on top.',
          vars: [['store', h('span.jartag.u-tgt', { style: { '--jc': '#5FA39A' } })], ['personal', h('span.jartag.u-tgt', { style: { '--jc': '#D9A326' } })], ['over', h('span.jartag.over.u-tgt')]] },
        { id: 'CHP-07', name: 'Price level tag', mode: 'Sliced', size: [16, 14], nine: [5, 5, 5, 5], w: 260, used: 'Corner of a shelf slot.',
          vars: ['low', 'fair', 'high'].map((l) => [l, ctx('slot', h(`span.p.lv-${l}.u-tgt`, { style: { position: 'static', display: 'block' } }), { height: 'auto', background: 'none', boxShadow: 'none', display: 'block' })]) },
        { id: 'CHP-09', name: 'Hotspot pill skin', mode: 'Sliced', size: [36, 30], nine: [15, 15, 14, 14], bg: 'scene', w: 460, used: 'Over stations and places in the 3D view. The arrow is a separate sprite.',
          vars: [['normal', h('button.hot.u-tgt')], ['open', h('button.hot.on.u-tgt')], ['you are here', h('button.hot.place.here.u-tgt')], ['closed', h('button.hot.u-tgt', { disabled: true })]] },
        { id: 'CHP-09', name: 'Hotspot arrow', mode: 'Simple', size: [10, 10], bg: 'scene', w: 260, used: 'Under the hotspot pill, centred. Tint it for the open state.',
          vars: [['default', h('div.u-tgt', { style: { background: 'rgba(244,236,219,.94)', transform: 'rotate(45deg)', boxShadow: '1.5px 1.5px 0 var(--rattanD)' } })]] },
        { id: 'CHP-11', name: 'News dot', mode: 'Simple', size: [14, 14], bg: 'teal', w: 260, used: 'On the Journal button and book tabs.',
          vars: [['default', ctx('rb', h('i.dot.u-tgt', { style: { position: 'static', display: 'block' } }), { width: 'auto', height: 'auto', background: 'none', boxShadow: 'none', display: 'block' })]] }
      ] },
      { code: 'VAL', title: 'Values and inputs', items: [
        { id: 'VAL-01', name: 'Number box', mode: 'Sliced', size: [28, 28], nine: [9, 9, 9, 9], w: 260, used: 'Stepper value (small and big).',
          vars: [['default', ctx('stepper', h('span.n.u-tgt', { style: { display: 'block' } }), { display: 'block' })]] },
        { id: 'VAL-04', name: 'Bar track', mode: 'Sliced', size: [20, 12], nine: [6, 6, 5, 5], bg: 'page', w: 260, used: 'Skill XP, ledger, jars, sold. The fill goes inside (Image Type Filled, or a masked child).',
          vars: [['default', h('div.bar.u-tgt')]] },
        { id: 'VAL-04', name: 'Bar fill', mode: 'Tiled', size: [16, 12], bg: 'page', w: 460, used: 'Inside the bar track. Green and red have a 16 px stripe: use Tiled.',
          vars: ['', 'low', 'gold', 'wis', 'ver'].map((c) => [c || 'green', ctx(`bar${c ? '.' + c : ''}`, h('i.u-tgt'), { background: 'none', boxShadow: 'none', borderRadius: '0', height: 'auto' })]) },
        { id: 'VAL-05', name: 'Dot', mode: 'Simple', size: [12, 12], w: 300, used: 'Meals, craft batches, goals per week.',
          vars: [['empty', ''], ['filled', 'f'], ['ok', 'ok'], ['missed', 'no']].map(([t, c]) => [t, ctx('dots', h(`i${c ? '.' + c : ''}.u-tgt`))]) },
        { id: 'VAL-09', name: 'Budget jar', mode: 'Simple', size: [48, 53], w: 380, used: 'Jar box and jar badge. Put the full jar over the empty jar with Image Type Filled (vertical, bottom).',
          vars: [['empty', h('div.u-tgt', Dom.raw(Dom.jarSvg(0, '#5FA39A', 48)))], ['full store', h('div.u-tgt', Dom.raw(Dom.jarSvg(1, '#5FA39A', 48)))], ['full personal', h('div.u-tgt', Dom.raw(Dom.jarSvg(1, '#D9A326', 48)))]] }
      ] },
      { code: 'STN', title: 'Station parts', items: [
        { id: 'STN-02', name: 'Shelf slot skin', mode: 'Sliced', size: [28, 28], nine: [9, 9, 9, 9], w: 300, used: 'Store shelf and drying rack cells.',
          vars: [['normal', h('div.slot.u-tgt')], ['selected', h('div.slot.sel.u-tgt')]] },
        { id: 'STN-04', name: 'Hour bar', mode: 'Sliced', size: [20, 20], nine: [6, 6, 6, 3], w: 300, used: 'Store window while open: one bar per hour.',
          vars: [['normal', ctx('hours', h('div.h.u-tgt'), { display: 'block', height: 'auto' })], ['now', ctx('hours', h('div.h.now.u-tgt'), { display: 'block', height: 'auto' })]] },
        { id: 'STN-04', name: 'Hour bar block', mode: 'Sliced', size: [16, 8], nine: [3, 3, 3, 3], w: 260, used: 'One sale in an hour bar.',
          vars: [['default', ctx('hours', ctx('h', h('i.u-tgt'), { background: 'none', padding: '0' }), { display: 'block', height: 'auto' })]] }
      ] },
      { code: 'ICN', title: 'Icons', sub: 'Full colour, 48 px (96 px PNG)', items: [
        { id: 'ICN-01', name: 'Medallion', mode: 'Simple', size: [96, 96], w: 260, used: 'Big icons: goal cards, cards, location header, skills, item card. Icon on top.',
          vars: [['default', h('div.ico.u-tgt', { style: { '--s': '96px' } }, h('i'))]] },
        { id: 'ICN-02', name: 'Icon', mode: 'Simple', size: [48, 48], w: 2304, used: 'Every icon of the game, by its name in data.',
          vars: Icons.names().map((n) => [n, h('div.u-tgt', Dom.icon(n, 48))]) }
      ] }
    ];
  }
}
