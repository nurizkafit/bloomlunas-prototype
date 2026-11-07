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
import { StockView } from './views/ui/StockView.js';
import { SaveSystem } from './core/SaveSystem.js';
import { StartMenuView } from './views/ui/StartMenuView.js';
import { StationView } from './views/ui/StationView.js';
import { TownMapView } from './views/ui/TownMapView.js';
import './style.css';

// Browser entry: load all data files, build the GameManager and the views.
const files = import.meta.glob('../data/**/*.json', { eager: true, import: 'default' });
const content = new ContentDB(files);
const storage = (() => { try { const t = '__t'; localStorage.setItem(t, t); localStorage.removeItem(t); return localStorage; } catch { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) }; } })();
const save = new SaveSystem(storage);
// URL: no param = start menu; ?new = fresh game (then ?play); ?new&story = fresh game with the story premise; ?play = skip the menu.
const q = new URLSearchParams(location.search);
const fresh = q.has('new'), story = q.has('story'), skipMenu = fresh || q.has('play');
if (fresh) { save.clear(); history.replaceState(null, '', `${location.pathname}?play`); }
const saved = save.read();
const gm = new GameManager(content, { log: (l) => console.info(l), save: saved ?? undefined });
save.attach(gm);
const newGame = () => { save.clear(); location.href = `${location.pathname}?new&story`; };
const loadGame = () => { location.href = `${location.pathname}?play`; };
const app = document.querySelector('#app');

const town = new TownView(app, gm);
const craft = new CraftView(app, gm);
const menu = new ActionMenuView(app, gm, craft);
const planner = new PlannerBookView(app, gm);
planner.hooks = { saveInfo: () => save.read(), onLoad: loadGame, onNewGame: newGame };
const stock = new StockView(app, gm);
const station = new StationView(app, gm);
const townMap = new TownMapView(app, gm);
const hasInterior = (id) => content.all('interiors').some((i) => i.buildingId === id);
/** One route for every place pick: building menu (town click on a building), else the station screen, else the action menu. */
const openPlace = (id, o = {}) => {
  stock.close(); townMap.close();
  if (o.fromTown && hasInterior(id)) { station.close(); menu.open(id, o); return; }
  if (station.has(id)) { menu.close(); station.open(id); return; }
  station.close(); menu.open(id, o);
};
new HudView(app, gm, { openPlan: () => planner.openInDo(), openMap: () => { menu.close(); station.close(); townMap.toggle(); }, openLocation: (id) => openPlace(id) });
town.onPick = (id, o) => openPlace(id, o);
townMap.onPick = (id) => openPlace(id, { fromTown: true });
menu.onEnter = (id) => town.enterBuilding(id);
menu.onStation = (loc, act) => station.has(loc) && station.open(loc, act === 'processing' ? 'processing' : undefined);
town.onPanel = (panel) => { if (panel === 'stock') { menu.close(); station.open('loc_home_shop', 'shelf'); } };
new EventCardView(app, gm);
const recap = new RecapView(app, gm);
const monthEnd = new MonthEndView(app, gm);
recap.onJournal = monthEnd.onJournal = () => planner.openJournal();
new EndingView(app, gm, newGame);
new DevOverlay(app, gm.bus, newGame);
gm.start();
const opening = new StartMenuView(app, content, { hasSave: !!saved, savedAt: saved?.savedAt, onNew: newGame, onLoad: () => opening.close() });
if (story) opening.showStory();
else if (!skipMenu) opening.showMenu();
window.__gm = gm; // dev only: inspect state in the console
window.__ui = { town, menu, craft, planner, save, stock, station, townMap, opening }; // dev only: used by browser tests
