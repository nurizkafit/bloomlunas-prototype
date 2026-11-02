import { ContentDB } from './core/ContentDB.js';
import { GameManager } from './core/GameManager.js';
import { DevOverlay } from './views/ui/DevOverlay.js';
import { PlannerBookView } from './views/ui/PlannerBookView.js';
import { TownView } from './views/town/TownView.js';
import { HudView } from './views/ui/HudView.js';
import { CraftView } from './views/ui/CraftView.js';
import { ActionMenuView } from './views/ui/ActionMenuView.js';
import { EventCardView } from './views/ui/EventCardView.js';
import { RecapView } from './views/ui/RecapView.js';
import { MonthEndView } from './views/ui/MonthEndView.js';
import { EndingView } from './views/ui/EndingView.js';
import { SaveSystem } from './core/SaveSystem.js';
import './style.css';

// Browser entry: load all data files, build the GameManager and the views.
const files = import.meta.glob('../data/**/*.json', { eager: true, import: 'default' });
const content = new ContentDB(files);
const storage = (() => { try { const t = '__t'; localStorage.setItem(t, t); localStorage.removeItem(t); return localStorage; } catch { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) }; } })();
const save = new SaveSystem(storage);
const fresh = new URLSearchParams(location.search).has('new');
if (fresh) { save.clear(); history.replaceState(null, '', location.pathname); }
const gm = new GameManager(content, { log: (l) => console.info(l), save: save.read() ?? undefined });
save.attach(gm);
const newGame = () => { save.clear(); location.reload(); };
const app = document.querySelector('#app');

const town = new TownView(app, gm);
const craft = new CraftView(app, gm);
const menu = new ActionMenuView(app, gm, craft);
const planner = new PlannerBookView(app, gm);
new HudView(app, gm, { openPlan: () => planner.openInDo(), openLocation: (id) => menu.open(id) });
town.onPick = (id) => menu.open(id);
new EventCardView(app, gm);
new RecapView(app, gm);
new MonthEndView(app, gm);
new EndingView(app, gm, newGame);
new DevOverlay(app, gm.bus, newGame);
gm.start();
window.__gm = gm; // dev only: inspect state in the console
window.__ui = { town, menu, craft, planner, save }; // dev only: used by browser tests
