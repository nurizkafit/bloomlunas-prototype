import { ContentDB } from './core/ContentDB.js';
import { GameManager } from './core/GameManager.js';
import { SaveSystem } from './core/SaveSystem.js';
import { UiRoot } from './views/ui/UiRoot.js';
import { SceneView } from './views/scene/SceneView.js';
import { ArtPack } from './views/ui/ArtPack.js';
import './views/ui/theme.css';
import './views/ui/feedback.css';

// Browser entry: load the data, build the GameManager, the 3D City View and the DOM views.
// URL: no param = Start menu; ?new = fresh game with the story letter; ?new&skip = fresh game, no story; ?play = continue.
const files = import.meta.glob('../data/**/*.json', { eager: true, import: 'default' });
const content = new ContentDB(files);
const storage = (() => {
  try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return localStorage; }
  catch { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) }; }
})();
const save = new SaveSystem(storage);
const q = new URLSearchParams(location.search);
if (q.has('new')) save.clear();
const saved = q.has('play') ? save.read() : null;
const gm = new GameManager(content, { save: saved ?? undefined, seed: q.has('seed') ? Number(q.get('seed')) : undefined, onSave: (g) => save.save(g) });

// Hand-drawn UI PNGs in assets/art/ui/ replace the code-drawn icons and skins (missing PNG = current look).
ArtPack.mount();
const app = document.querySelector('#app');
const scene = new SceneView(content);
const startScreen = q.has('new') ? (q.has('skip') ? 'game' : 'story') : q.has('play') && saved ? 'game' : 'start';
const ui = new UiRoot(app, gm, {
  scene,
  startScreen,
  hasSave: () => !!save.read(),
  onNewGame: () => { location.href = `${location.pathname}?new`; },
  onContinue: () => { location.href = `${location.pathname}?play`; },
  onStoryDone: () => { ui.set({ screen: 'game' }); gm.start(); }
});
scene.mount(ui.sceneLayer);
if (startScreen === 'game') gm.start();
// Hooks for browser tests and the console (read only use is expected).
window.__bl = { gm, ui, scene };
