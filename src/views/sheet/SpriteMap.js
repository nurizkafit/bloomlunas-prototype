/**
 * SpriteMap: which interface sheet parts (sheet.html) each Unity sprite (unity.html) builds (user, 11 Nov 2026).
 * Key = "<sprite ID>|<sprite name>" as in UnityAssets. Value = sheet IDs that use the sprite.
 * unity.html shows the list as links to the sheet. sheet.html shows the reverse: the sprites of each part.
 * Icons (ICN-02) are on almost every part, so the map lists only the ICN-02 card itself.
 */
export class SpriteMap {
  static USES = {
    'FRM-01|Rattan frame skin': ['FRM-01', 'FRM-04', 'CRD-01', 'CRD-02', 'CRD-03', 'CRD-04', 'CRD-05', 'CRD-06', 'CRD-19', 'CRD-20', 'DLG-02', 'DLG-03'],
    'FRM-02|Slim frame skin': ['FRM-02', 'FRM-03', 'TTL-01', 'TTL-04', 'HUD-05', 'LST-03', 'CRD-09', 'CRD-10'],
    'FRM-05|Planner Book cover': ['FRM-05'],
    'FRM-05|Planner Book spine': ['FRM-05'],
    'FRM-05|Planner Book page': ['FRM-05'],
    'FRM-07|Inset panel': ['FRM-07', 'CRD-11', 'CRD-12', 'CRD-13', 'LST-10'],
    'LST-02|Table frame': ['LST-02'],
    'LST-12|Log box': ['LST-12'],
    'STN-01|Shelf board': ['STN-01', 'STN-03'],
    'STN-05|Trail panel': ['STN-05'],
    'ORN-01|Corner ornament': ['ORN-01', 'FRM-05', 'CRD-02', 'CRD-03', 'CRD-06', 'CRD-20', 'DLG-03'],
    'ORN-02|Divider': ['ORN-02'],
    'TTL-02|Window title plate': ['TTL-02', 'FRM-04'],
    'LST-02|Table header bar': ['LST-02'],
    'BTN-01|Teal button skin': ['BTN-01', 'BTN-06', 'BTN-08'],
    'BTN-02|Paper button skin': ['BTN-02', 'BTN-09'],
    'BTN-03|Gold button skin': ['BTN-03', 'BTN-06', 'BTN-07'],
    'BTN-04|Small teal button skin': ['BTN-04', 'BTN-15'],
    'BTN-04|Small paper button skin': ['BTN-04', 'BTN-05', 'BTN-15'],
    'BTN-04|Small gold button skin': ['BTN-04', 'BTN-15'],
    'BTN-10|Round HUD button': ['BTN-10', 'HUD-06'],
    'BTN-11|Round icon button': ['BTN-11', 'VAL-01', 'VAL-02', 'FRM-04', 'CRD-05'],
    'VAL-03|Mini round button': ['VAL-03'],
    'BTN-12|Item icon ring': ['BTN-12', 'LST-03', 'CRD-16'],
    'BTN-13|Help mark disc': ['BTN-13', 'TTL-05'],
    'BTN-14|Book tab': ['BTN-14', 'FRM-05'],
    'BTN-16|Price level button': ['BTN-16'],
    'BTN-17|Note pick skin': ['BTN-17'],
    'HUD-01|Day dial sample': ['HUD-01', 'HUD-06'],
    'HUD-03|Energy badge skin': ['HUD-03', 'HUD-01'],
    'HUD-04|Stat pill skin': ['HUD-04', 'HUD-06'],
    'HUD-07|Hint bar': ['HUD-07'],
    'HUD-08|Key cap': ['HUD-08', 'HUD-07', 'LST-03'],
    'LST-02|Table row': ['LST-02'],
    'LST-03|Station menu row': ['LST-03'],
    'LST-07|Day goal row': ['LST-07'],
    'LST-09|Warning line': ['LST-09'],
    'CRD-07|Goal card skin': ['CRD-07'],
    'CRD-08|Small goal card skin': ['CRD-08', 'LST-07'],
    'CRD-13|Goal chip skin': ['CRD-13'],
    'CRD-07|Deck over limit': ['CRD-07'],
    'CRD-15|Help popup skin': ['CRD-15'],
    'CRD-16|Toast skin': ['CRD-16'],
    'CRD-18|Walk banner skin': ['CRD-18'],
    'DLG-01|Speech bubble': ['DLG-01', 'CRD-21', 'CRD-19', 'CRD-20', 'DLG-02', 'DLG-03'],
    'DLG-01|Speaker tag': ['DLG-01', 'CRD-21', 'CRD-19', 'CRD-20', 'DLG-02', 'DLG-03'],
    'CHP-01|Chip skin': ['CHP-01', 'TTL-04', 'BTN-09', 'LST-07'],
    'CHP-04|Count badge skin': ['CHP-04', 'LST-03'],
    'CHP-05|Level chip skin': ['CHP-05', 'LST-10'],
    'CHP-06|Jar badge skin': ['CHP-06'],
    'CHP-07|Price level tag': ['CHP-07', 'STN-02'],
    'CHP-09|Hotspot pill skin': ['CHP-09'],
    'CHP-09|Hotspot arrow': ['CHP-09'],
    'CHP-11|News dot': ['CHP-11', 'BTN-10', 'BTN-14'],
    'VAL-01|Number box': ['VAL-01', 'VAL-02'],
    'VAL-04|Bar track': ['VAL-04', 'LST-10'],
    'VAL-04|Bar fill': ['VAL-04', 'LST-10'],
    'VAL-05|Dot': ['VAL-05'],
    'VAL-09|Budget jar': ['VAL-09', 'CRD-12', 'CHP-06'],
    'STN-02|Shelf slot skin': ['STN-02', 'STN-03'],
    'STN-04|Hour bar': ['STN-04'],
    'STN-04|Hour bar block': ['STN-04'],
    'ICN-01|Medallion': ['ICN-01', 'HUD-02', 'TTL-01', 'TTL-04', 'CRD-02', 'CRD-05', 'CRD-07', 'CRD-20', 'DLG-03', 'LST-10'],
    'ICN-02|Icon': ['ICN-02']
  };

  static slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

  /** Anchor of a sprite card on unity.html. */
  static anchor(id, name) { return `u-${id}-${SpriteMap.slug(name)}`; }

  /** Sheet IDs that use a sprite. @returns {string[]} */
  static uses(id, name) {
    const u = SpriteMap.USES[`${id}|${name}`];
    if (!u) throw new Error(`SpriteMap: no entry for "${id}|${name}". Add it to src/views/sheet/SpriteMap.js.`);
    return u;
  }

  /** Sprites that build one sheet part. @param {string} sheetId @returns {{id:string, name:string}[]} */
  static sprites(sheetId) {
    return Object.entries(SpriteMap.USES).filter(([, ids]) => ids.includes(sheetId)).map(([k]) => { const [id, name] = k.split('|'); return { id, name }; });
  }
}
