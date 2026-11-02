import { ContentDB } from './core/ContentDB.js';
import { GameManager } from './core/GameManager.js';
import { DevOverlay } from './views/ui/DevOverlay.js';
import { PlannerBookView } from './views/ui/PlannerBookView.js';
import { TownView } from './views/town/TownView.js';
import { HudView } from './views/ui/HudView.js';
import { CraftView } from './views/ui/CraftView.js';
import { ActionMenuView } from './views/ui/ActionMenuView.js';
import './style.css';

// Browser entry: load all data files, build the GameManager and the views.
const files = import.meta.glob('../data/**/*.json', { eager: true, import: 'default' });
const content = new ContentDB(files);
const gm = new GameManager(content, { log: (l) => console.info(l) });
const app = document.querySelector('#app');

const town = new TownView(app, gm);
const craft = new CraftView(app, gm);
const menu = new ActionMenuView(app, gm, craft);
const planner = new PlannerBookView(app, gm);
new HudView(app, gm, { openPlan: () => planner.openInDo(), openLocation: (id) => menu.open(id) });
town.onPick = (id) => menu.open(id);
new DevOverlay(app, gm.bus);
gm.start();
window.__gm = gm; // dev only: inspect state in the console
window.__ui = { town, menu, craft, planner }; // dev only: used by browser tests
