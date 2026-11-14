import pack from 'virtual:art-pack';

/**
 * ArtPack: hand-drawn UI art (user, 14 Nov 2026).
 * Put a PNG in assets/art/ui/ with the same file name as its Unity sprite (assets/unity-export/png/),
 * for example ui_ic01_gold.png or ui_sk15_gold_button_normal.png. The game then uses the PNG in place of
 * the code-drawn icon or skin. A sprite with no PNG keeps the current look, so art can come in parts.
 * The same PNG works in Unity: same name, same size, same 9-slice borders (manifest.json).
 * The list of files comes from the Vite plugin in vite.config.js (virtual:art-pack). View layer only.
 */

/**
 * Where each skin shows in the game. [code, variant, CSS selector, 1x size [w, h], 9-slice [l, r, t, b] or null, extra CSS].
 * Size and 9-slice are the CSS box of the sprite (as in UnityAssets.js); the PNG adds room for outlines and the 3D lip.
 */
const B = (cls) => `.btn${cls}`;
const BTN = (code, cls, size, nine) => [
  [code, 'normal', B(cls), size, nine],
  [code, 'hover', `${B(cls)}:hover:not(:disabled)`, size, nine],
  [code, 'pressed', `${B(cls)}:active:not(:disabled)`, size, nine],
  [code, 'disabled', `${B(cls)}:disabled`, size, nine]
];
const SKINS = [
  ['SK-01', 'default', '.rf', [72, 72], [28, 28, 28, 28]],
  ['SK-02', 'default', '.sf', [40, 40], [16, 16, 16, 16]],
  ['SK-02', 'selected', '.sf.on', [40, 40], [16, 16, 16, 16]],
  ['SK-03', 'default', '.book', [96, 96], [32, 32, 32, 32]],
  ['SK-04', 'default', '.book .spineband', [40, 32], null],
  ['SK-05', 'left', '.pg.l', [100, 72], [12, 48, 12, 12], '.pg.l::after { display: none; }'],
  ['SK-05', 'right', '.pg.r', [100, 72], [48, 12, 12, 12], '.pg.r::before { display: none; }'],
  ['SK-06', 'default', '.stat', [28, 28], [11, 11, 11, 11]],
  ['SK-07', 'default', '.tlst', [28, 28], [10, 10, 10, 10]],
  ['SK-08', 'default', '.logbox', [28, 28], [10, 10, 10, 10]],
  ['SK-09', 'default', '.shelf', [28, 28], [11, 11, 11, 11]],
  ['SK-10', 'default', '.trail', [28, 28], [11, 11, 11, 11]],
  ['OR-01', 'tl', 'svg.corner.tl', [72, 72], null, 'svg.corner.tl { transform: none !important; } svg.corner.tl > use { display: none; }'],
  ['OR-01', 'tr', 'svg.corner.tr', [72, 72], null, 'svg.corner.tr { transform: none !important; } svg.corner.tr > use { display: none; }'],
  ['OR-01', 'bl', 'svg.corner.bl', [72, 72], null, 'svg.corner.bl { transform: none !important; } svg.corner.bl > use { display: none; }'],
  ['OR-01', 'br', 'svg.corner.br', [72, 72], null, 'svg.corner.br { transform: none !important; } svg.corner.br > use { display: none; }'],
  ['OR-02', 'default', 'svg.divider', [400, 16], null, 'svg.divider > use { display: none; }'],
  ['SK-11', 'default', '.plate', [136, 32], [60, 60, 0, 0]],
  ['SK-12', 'default', '.tlh', [32, 28], null],
  ...BTN('SK-13', ':not(.alt):not(.gold):not(.sm)', [56, 40], [20, 20, 18, 18]),
  ...BTN('SK-14', '.alt:not(.sm)', [56, 40], [20, 20, 18, 18]),
  ...BTN('SK-15', '.gold:not(.sm)', [56, 40], [20, 20, 18, 18]),
  ...BTN('SK-16', '.sm:not(.alt):not(.gold)', [40, 32], [16, 16, 14, 14]),
  ...BTN('SK-17', '.alt.sm', [40, 32], [16, 16, 14, 14]),
  ...BTN('SK-18', '.gold.sm', [40, 32], [16, 16, 14, 14]),
  ['SK-19', 'normal', '.rb', [56, 56], null],
  ['SK-19', 'on', '.rb.on', [56, 56], null],
  ['SK-20', 'normal', '.iconbtn', [32, 32], null],
  ['SK-20', 'disabled', '.iconbtn:disabled', [32, 32], null],
  ['SK-21', 'normal', '.mstep button', [20, 20], null],
  ['SK-21', 'disabled', '.mstep button:disabled', [20, 20], null],
  ['SK-22', 'normal', '.ib', [28, 28], null],
  ['SK-22', 'hover', '.ib:hover', [28, 28], null],
  ['SK-23', 'default', '.helpq', [18, 18], null],
  ['SK-24', 'normal', '.tab', [64, 54], null],
  ['SK-24', 'on', '.tab.on', [64, 54], null],
  ...['low', 'fair', 'high'].flatMap((l) => [
    ['SK-25', l, `.lvpick .lv-${l}`, [32, 32], [10, 10, 10, 10]],
    ['SK-25', `${l} on`, `.lvpick .lv-${l}.on`, [32, 32], [10, 10, 10, 10]]
  ]),
  ['SK-26', 'normal', '.notepick button', [28, 28], [10, 10, 10, 10]],
  ['SK-26', 'on', '.notepick button.on', [28, 28], [10, 10, 10, 10]],
  ['SK-28', 'normal', '.daydial .en', [28, 20], [10, 10, 9, 9]],
  ['SK-28', 'low', '.daydial .en.low', [28, 20], [10, 10, 9, 9]],
  ['SK-29', 'default', '.pill', [44, 36], [18, 18, 17, 17]],
  ['SK-30', 'default', '.hint', [96, 32], null],
  ['SK-31', 'cream', '.hint i', [20, 20], [6, 6, 6, 6]],
  ['SK-31', 'teal', 'i.key', [20, 20], [6, 6, 6, 6]],
  ['SK-32', 'normal', '.tlr', [24, 36], [6, 6, 0, 0]],
  ['SK-32', 'selected', '.tlr.on', [24, 36], [6, 6, 0, 0]],
  ['SK-32', 'has', '.tlr.has', [24, 36], [6, 6, 0, 0]],
  ['SK-33', 'hover', '.srow:hover', [28, 28], [10, 10, 10, 10]],
  ['SK-33', 'selected', '.srow.on', [28, 28], [10, 10, 10, 10]],
  ['SK-34', 'normal', '.drow', [28, 28], [10, 10, 10, 10]],
  ['SK-34', 'today', '.drow.now', [28, 28], [10, 10, 10, 10]],
  ['SK-34', 'drop here', '.drow.over', [28, 28], [10, 10, 10, 10]],
  ['SK-35', 'warn', '.warn', [20, 20], [7, 7, 7, 7]],
  ['SK-35', 'ok', '.warn.ok', [20, 20], [7, 7, 7, 7]],
  ['SK-37', 'default', '.gcard.sm', [28, 28], [10, 10, 10, 10]],
  ['SK-38', 'filled', '.goalchip', [28, 28], [10, 10, 10, 10]],
  ['SK-38', 'empty', '.goalchip.empty', [28, 28], [10, 10, 10, 10]],
  ['SK-39', 'default', '.deck.over', [28, 28], [11, 11, 11, 11]],
  ['SK-40', 'default', '.helppop', [28, 28], [10, 10, 10, 10]],
  ['SK-41', 'normal', '.toast', [48, 44], [21, 21, 20, 20]],
  ['SK-41', 'refusal', '.toast.bad', [48, 44], [21, 21, 20, 20]],
  ['SK-41', 'news', '.toast.news', [48, 44], [21, 21, 20, 20]],
  ['SK-42', 'default', '.walkbar', [56, 48], [24, 24, 22, 22]],
  ['SK-43', 'default', '.line.speech', [28, 28], [11, 11, 11, 11]],
  ['SK-44', 'default', '.line.speech .speaker', [24, 20], [10, 10, 9, 9]],
  ['SK-45', 'normal', '.qchip', [36, 28], [14, 14, 13, 13]],
  ['SK-45', 'ok', '.qchip.ok', [36, 28], [14, 14, 13, 13]],
  ['SK-45', 'missing', '.qchip.miss', [36, 28], [14, 14, 13, 13]],
  ['SK-45', 'hours', '.hchip', [36, 28], [14, 14, 13, 13]],
  ['SK-45', 'closed', '.hchip.shut', [36, 28], [14, 14, 13, 13]],
  ['SK-46', 'red', '.badge', [28, 20], [10, 10, 9, 9]],
  ['SK-46', 'ok', '.badge.ok', [28, 20], [10, 10, 9, 9]],
  ['SK-47', 'default', '.lv', [32, 24], [12, 12, 11, 11]],
  ['SK-48', 'over', '.jartag.over', [36, 28], [14, 14, 13, 13]],
  ...['low', 'fair', 'high'].map((l) => ['SK-49', l, `.slot .p.lv-${l}`, [16, 14], [5, 5, 5, 5]]),
  ['SK-50', 'normal', '.hot', [36, 30], [15, 15, 14, 14]],
  ['SK-50', 'open', '.hot.on', [36, 30], [15, 15, 14, 14]],
  ['SK-50', 'you are here', '.hot.place.here', [36, 30], [15, 15, 14, 14]],
  ['SK-50', 'closed', '.hot:disabled', [36, 30], [15, 15, 14, 14]],
  ['SK-52', 'default', 'i.dot', [14, 14], null],
  ['SK-53', 'default', '.stepper .n', [28, 28], [9, 9, 9, 9]],
  ['SK-54', 'default', '.bar', [20, 12], [6, 6, 5, 5]],
  ['SK-56', 'empty', '.dots i', [12, 12], null],
  ['SK-56', 'filled', '.dots i.f', [12, 12], null],
  ['SK-56', 'ok', '.dots i.ok', [12, 12], null],
  ['SK-56', 'missed', '.dots i.no', [12, 12], null],
  ['SK-58', 'normal', '.slot', [28, 28], [9, 9, 9, 9]],
  ['SK-58', 'selected', '.slot.sel', [28, 28], [9, 9, 9, 9]],
  ['SK-59', 'normal', '.hours .h', [20, 20], [6, 6, 6, 3]],
  ['SK-59', 'now', '.hours .h.now', [20, 20], [6, 6, 6, 3]],
  ['SK-60', 'default', '.hours .h i', [16, 8], [3, 3, 3, 3]],
  ['SK-61', 'default', '.ico', [96, 96], null]
];

export class ArtPack {
  /** PNG file names in assets/art/ui/. */
  static files = new Set(pack.files);
  /** On only in the game (main.js), so the sheet and the Unity export keep the code-drawn look. */
  static on = false;

  /** URL of a PNG in assets/art/ui/. @param {string} file */
  static url(file) { return `./art/ui/${file}`; }

  /** Manifest row of a sprite. @param {string} code @param {string} variant */
  static part(code, variant) { return pack.parts.find((p) => p.code === code && p.variant === variant); }

  /** Hand-drawn icon URL, or null. @param {string} name */
  static icon(name) {
    if (!ArtPack.on) return null;
    const p = pack.parts.find((x) => x.code.startsWith('IC-') && x.variant === name);
    return p && ArtPack.files.has(p.file) ? ArtPack.url(p.file) : null;
  }

  /** Turn the art on and add the skin rules for each PNG that exists. */
  static mount() {
    ArtPack.on = true;
    const css = SKINS.map((s) => ArtPack.rule(...s)).filter(Boolean).join('\n');
    if (!css) return;
    const st = document.createElement('style');
    st.id = 'art-pack';
    st.textContent = css;
    document.head.append(st);
  }

  /**
   * One CSS rule: the PNG as a border-image, so it stretches like a Unity 9-slice sprite.
   * Outset = the room the PNG has around the CSS box (outlines, lip), so the art sits where the code-drawn skin was.
   * A Simple sprite (no 9-slice) stretches whole over the box.
   */
  static rule(code, variant, sel, size, nine, extra = '') {
    const p = ArtPack.part(code, variant);
    if (!p || !ArtPack.files.has(p.file)) return '';
    const n = nine ?? [0, 0, 0, 0];
    const mn = p.nine ? [p.nine.left, p.nine.right, p.nine.top, p.nine.bottom] : [0, 0, 0, 0];
    const px = p.ninePx ? [p.ninePx.left, p.ninePx.right, p.ninePx.top, p.ninePx.bottom] : [0, 0, 0, 0];
    const padX = Math.max(0, p.w - size[0]), padY = Math.max(0, p.h - size[1]);
    // Each side: the 9-slice border grows by the pad on that side. Sides with no border share what is left.
    const side = (i, j, total) => {
      const a = n[i] ? mn[i] - n[i] : null, b = n[j] ? mn[j] - n[j] : null;
      if (a != null && b != null) return [a, b];
      if (a != null) return [a, total - a];
      if (b != null) return [total - b, b];
      return [total / 2, total / 2];
    };
    const [l, r] = side(0, 1, padX), [t, b] = side(2, 3, padY);
    const rep = p.mode === 'Tiled' ? 'round' : 'stretch';
    return `html body ${sel} { border-style: solid !important; border-width: 0 !important; border-image: url("${ArtPack.url(p.file)}") ${px[2]} ${px[1]} ${px[3]} ${px[0]} fill / ${mn[2]}px ${mn[1]}px ${mn[3]}px ${mn[0]}px / ${t}px ${r}px ${b}px ${l}px ${rep} !important; background: none !important; box-shadow: none !important; filter: none !important; }`
      + (extra ? `\n${extra.replace(/(^|\} )/g, '$1html body ')}` : '');
  }
}
