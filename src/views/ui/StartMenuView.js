import './screens.css';

/**
 * StartMenuView: the opening of the game (Scene & Flow, 7 Nov 2026).
 * Start menu: New game, Load game (only when a save exists). New game shows the Story premise (data/story/premise.json),
 * then the first Plan phase. Load game continues the saved phase.
 * View only: the start and load are done by main.js callbacks (they reload the page). Unity: title scene.
 */
export class StartMenuView {
  /**
   * @param {HTMLElement} root @param {import('../../core/ContentDB.js').ContentDB} content
   * @param {{hasSave:boolean, savedAt?:string, onNew:()=>void, onLoad:()=>void}} hooks
   */
  constructor(root, content, hooks) {
    this.c = content; this.hooks = hooks;
    this.el = document.createElement('div');
    this.el.className = 'opening';
    this.el.hidden = true;
    root.appendChild(this.el);
    this.el.addEventListener('click', (e) => {
      if (e.target.closest('#smNew')) hooks.onNew();
      if (e.target.closest('#smLoad')) hooks.onLoad();
      if (e.target.closest('#smBegin')) this.close();
    });
  }

  /** The start menu. */
  showMenu() {
    const h = this.hooks;
    const when = h.savedAt ? new Date(h.savedAt).toLocaleString() : '';
    this.el.innerHTML = `<div class="op-menu" role="dialog" aria-label="Start menu">
      <div class="op-title"><small>Herb shop · core loop prototype</small><h1>BloomLunas</h1></div>
      <nav class="op-btns">
        <button class="op-b" id="smNew">New game</button>
        <button class="op-b" id="smLoad" ${h.hasSave ? '' : 'disabled'}>Load game${when ? `<small>Saved ${when}</small>` : '<small>No save yet</small>'}</button>
      </nav>
      <p class="op-foot">Plan · Do · Check every week. Act at the end of each month.</p>
    </div>`;
    this.el.hidden = false;
  }

  /** The story premise: a letter, then "Begin". */
  showStory() {
    const p = this.c.get('story', 'premise');
    this.el.innerHTML = `<div class="op-letter" role="dialog" aria-label="Story premise">
      <div class="st-kind">${p.from}</div>
      <h2>${p.title}</h2>
      ${p.paragraphs.map((t) => `<p>${t}</p>`).join('')}
      <p class="sign">${p.sign}</p>
      <button class="go" id="smBegin">Begin the first week</button>
    </div>`;
    this.el.hidden = false;
  }

  close() { this.el.hidden = true; }
}
