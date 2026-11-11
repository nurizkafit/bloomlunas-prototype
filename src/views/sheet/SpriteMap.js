/**
 * SpriteMap: which interface sheet parts (sheet.html) each Unity sprite (unity.html) builds (user, 11 Nov 2026).
 * Key = Unity sprite code (SK-nn skin, OR-nn ornament, IC = the icon set, one code per icon: IC-nn).
 * The Unity codes are not the sheet codes (BTN-03 ...). Never reuse a code; add a new sprite with the next free number.
 * Value = sprite name + the sheet IDs that use the sprite.
 * unity.html shows the list as links to the sheet. sheet.html shows the reverse: the sprites of each part.
 * Icons (ICN-02) are on almost every part, so the map lists only the ICN-02 card itself.
 */
export class SpriteMap {
  static USES = {
    'SK-01': { name: 'Rattan frame skin', sheet: ['FRM-01', 'FRM-04', 'CRD-01', 'CRD-02', 'CRD-03', 'CRD-04', 'CRD-05', 'CRD-06', 'CRD-19', 'CRD-20', 'DLG-02', 'DLG-03'] },
    'SK-02': { name: 'Slim frame skin', sheet: ['FRM-02', 'FRM-03', 'TTL-01', 'TTL-04', 'HUD-05', 'LST-03', 'CRD-09', 'CRD-10'] },
    'SK-03': { name: 'Planner Book cover', sheet: ['FRM-05'] },
    'SK-04': { name: 'Planner Book spine', sheet: ['FRM-05'] },
    'SK-05': { name: 'Planner Book page', sheet: ['FRM-05'] },
    'SK-06': { name: 'Inset panel', sheet: ['FRM-07', 'CRD-11', 'CRD-12', 'CRD-13', 'LST-10'] },
    'SK-07': { name: 'Table frame', sheet: ['LST-02'] },
    'SK-08': { name: 'Log box', sheet: ['LST-12'] },
    'SK-09': { name: 'Shelf board', sheet: ['STN-01', 'STN-03'] },
    'SK-10': { name: 'Trail panel', sheet: ['STN-05'] },
    'OR-01': { name: 'Corner ornament', sheet: ['ORN-01', 'FRM-05', 'CRD-02', 'CRD-03', 'CRD-06', 'CRD-20', 'DLG-03'] },
    'OR-02': { name: 'Divider', sheet: ['ORN-02'] },
    'SK-11': { name: 'Window title plate', sheet: ['TTL-02', 'FRM-04'] },
    'SK-12': { name: 'Table header bar', sheet: ['LST-02'] },
    'SK-13': { name: 'Teal button skin', sheet: ['BTN-01', 'BTN-06', 'BTN-08'] },
    'SK-14': { name: 'Paper button skin', sheet: ['BTN-02', 'BTN-09'] },
    'SK-15': { name: 'Gold button skin', sheet: ['BTN-03', 'BTN-06', 'BTN-07'] },
    'SK-16': { name: 'Small teal button skin', sheet: ['BTN-04', 'BTN-15'] },
    'SK-17': { name: 'Small paper button skin', sheet: ['BTN-04', 'BTN-05', 'BTN-15'] },
    'SK-18': { name: 'Small gold button skin', sheet: ['BTN-04', 'BTN-15'] },
    'SK-19': { name: 'Round HUD button', sheet: ['BTN-10', 'HUD-06'] },
    'SK-20': { name: 'Round icon button', sheet: ['BTN-11', 'VAL-01', 'VAL-02', 'FRM-04', 'CRD-05'] },
    'SK-21': { name: 'Mini round button', sheet: ['VAL-03'] },
    'SK-22': { name: 'Item icon ring', sheet: ['BTN-12', 'LST-03', 'CRD-16'] },
    'SK-23': { name: 'Help mark disc', sheet: ['BTN-13', 'TTL-05'] },
    'SK-24': { name: 'Book tab', sheet: ['BTN-14', 'FRM-05'] },
    'SK-25': { name: 'Price level button', sheet: ['BTN-16'] },
    'SK-26': { name: 'Note pick skin', sheet: ['BTN-17'] },
    'SK-27': { name: 'Day dial sample', sheet: ['HUD-01', 'HUD-06'] },
    'SK-28': { name: 'Energy badge skin', sheet: ['HUD-03', 'HUD-01'] },
    'SK-29': { name: 'Stat pill skin', sheet: ['HUD-04', 'HUD-06'] },
    'SK-30': { name: 'Hint bar', sheet: ['HUD-07'] },
    'SK-31': { name: 'Key cap', sheet: ['HUD-08', 'HUD-07', 'LST-03'] },
    'SK-32': { name: 'Table row', sheet: ['LST-02'] },
    'SK-33': { name: 'Station menu row', sheet: ['LST-03'] },
    'SK-34': { name: 'Day goal row', sheet: ['LST-07'] },
    'SK-35': { name: 'Warning line', sheet: ['LST-09'] },
    'SK-36': { name: 'Goal card skin', sheet: ['CRD-07'] },
    'SK-37': { name: 'Small goal card skin', sheet: ['CRD-08', 'LST-07'] },
    'SK-38': { name: 'Goal chip skin', sheet: ['CRD-13'] },
    'SK-39': { name: 'Deck over limit', sheet: ['CRD-07'] },
    'SK-40': { name: 'Help popup skin', sheet: ['CRD-15'] },
    'SK-41': { name: 'Toast skin', sheet: ['CRD-16'] },
    'SK-42': { name: 'Walk banner skin', sheet: ['CRD-18'] },
    'SK-43': { name: 'Speech bubble', sheet: ['DLG-01', 'CRD-21', 'CRD-19', 'CRD-20', 'DLG-02', 'DLG-03'] },
    'SK-44': { name: 'Speaker tag', sheet: ['DLG-01', 'CRD-21', 'CRD-19', 'CRD-20', 'DLG-02', 'DLG-03'] },
    'SK-45': { name: 'Chip skin', sheet: ['CHP-01', 'TTL-04', 'BTN-09', 'LST-07'] },
    'SK-46': { name: 'Count badge skin', sheet: ['CHP-04', 'LST-03'] },
    'SK-47': { name: 'Level chip skin', sheet: ['CHP-05', 'LST-10'] },
    'SK-48': { name: 'Jar badge skin', sheet: ['CHP-06'] },
    'SK-49': { name: 'Price level tag', sheet: ['CHP-07', 'STN-02'] },
    'SK-50': { name: 'Hotspot pill skin', sheet: ['CHP-09'] },
    'SK-51': { name: 'Hotspot arrow', sheet: ['CHP-09'] },
    'SK-52': { name: 'News dot', sheet: ['CHP-11', 'BTN-10', 'BTN-14'] },
    'SK-53': { name: 'Number box', sheet: ['VAL-01', 'VAL-02'] },
    'SK-54': { name: 'Bar track', sheet: ['VAL-04', 'LST-10'] },
    'SK-55': { name: 'Bar fill', sheet: ['VAL-04', 'LST-10'] },
    'SK-56': { name: 'Dot', sheet: ['VAL-05'] },
    'SK-57': { name: 'Budget jar', sheet: ['VAL-09', 'CRD-12', 'CHP-06'] },
    'SK-58': { name: 'Shelf slot skin', sheet: ['STN-02', 'STN-03'] },
    'SK-59': { name: 'Hour bar', sheet: ['STN-04'] },
    'SK-60': { name: 'Hour bar block', sheet: ['STN-04'] },
    'SK-61': { name: 'Medallion', sheet: ['ICN-01', 'HUD-02', 'TTL-01', 'TTL-04', 'CRD-02', 'CRD-05', 'CRD-07', 'CRD-20', 'DLG-03', 'LST-10'] },
    'IC': { name: 'Icon', sheet: ['ICN-02'] }
  };

  /** Anchor of a sprite card on unity.html. */
  static anchor(code) { return code.toLowerCase(); }

  /** Sheet IDs that use a sprite. @returns {string[]} */
  static uses(code, name) {
    const u = SpriteMap.USES[code];
    if (!u) throw new Error(`SpriteMap: no entry for ${code}. Add it to src/views/sheet/SpriteMap.js.`);
    if (u.name !== name) throw new Error(`SpriteMap: ${code} is "${u.name}" in the map but "${name}" on the page.`);
    return u.sheet;
  }

  /** Sprites that build one sheet part. @param {string} sheetId @returns {{code:string, name:string}[]} */
  static sprites(sheetId) {
    return Object.entries(SpriteMap.USES).filter(([, u]) => u.sheet.includes(sheetId)).map(([code, u]) => ({ code, name: u.name }));
  }
}
