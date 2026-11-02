import { ContentDB } from './core/ContentDB.js';
import { GameManager } from './core/GameManager.js';
import { DevOverlay } from './views/ui/DevOverlay.js';
import { PlannerBookView } from './views/ui/PlannerBookView.js';
import './style.css';

// Browser entry: load all data files, build the GameManager and the views.
const files = import.meta.glob('../data/**/*.json', { eager: true, import: 'default' });
const content = new ContentDB(files);
const gm = new GameManager(content, { log: (l) => console.info(l) });
const app = document.querySelector('#app');
new PlannerBookView(app, gm);
new DevOverlay(app, gm.bus);
gm.start();
window.__gm = gm; // dev only: inspect state in the console
