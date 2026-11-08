# BloomLunas jam build specs

Source of truth for game rules: the BloomLunas Docs repo `nurizkafit/bloomlunas-docs` (site: https://bloomlunas-docs.nurizka.workers.dev/).
If this file and the docs differ, the docs win. Ask the user, then update this file.

Game jam overhaul (7 Nov 2026, deadline 15 Nov 2026). The pre-overhaul prototype and its specs are on branch
`backup/pre-overhaul-2026-11-07` (commit 9839366). Baseline for flow: Scene & Flow PDF. Baseline for layout:
Interface Reference PDF (layout and flow only, no copied art). Gaps come from the GDD.
All numbers are placeholders (`"_placeholder": true`) until the balance pass.

## 1. Scope (jam vs full game)

Keep: the core loop (weekly Plan, Do, Check; Act at month end) and the premise (inherited herb shop, riba debt).
Reduce: crafting, processing, economics, NPC interaction and exploration.

| Topic | Jam rule (user decision, 7 Nov 2026) |
| --- | --- |
| Movement | Place list over the 3D town (M or the Town button); a name pill over each place picks it too. Go travels; travel costs time and energy. Each building (Home + Store, Market, Guild Center) has a 3D interior room (user decision, 8 Nov 2026). |
| Crafting | Pick a recipe and a batch count. Materials, method and packing come from the recipe. |
| Processing | Drying rack (fresh -> dried, takes days) and Grinding table (dried -> powder). |
| Shop price | 3 levels: Low, Fair, High. High sells fewer. Weekly market trend per product. |
| Guild Center | Receptionist desk (wholesale lots buy, product sell, one service) and a separate Quest board: Take a commission or Give (post your own material request). |
| Exploration | City Outskirt, auto-explore one area. Each walk finds a spot: a card shows materials, time and energy; Gather or Skip. End exploration shows a recap (walks, gathered, skipped, items, time, energy, Earth XP). |
| Length | Two months (8 weeks). No Good or Bad ending: a retrospective of the two months. |
| Missed debt payment | The game goes on. The unpaid amount carries over with a late fee. The retrospective shows it. |

## 2. Architecture

- `data/*.json`: all content and numbers. Code reads numbers only through `ContentDB.num(key)` (`BalanceConfig.json`).
- `src/model/`: plain data (`GameState`, `Calendar`, `Inventory`). No DOM, no three.js.
- `src/systems/`, `src/phases/`, `src/core/`: logic. No DOM, no three.js. Runs headless (`npm run sim`).
- `src/views/`: DOM (`ui/`) and three.js (`scene/`). Views read `GameState` and send intents on the `EventBus`. A view never changes `GameState`.
- `GameManager` builds the context `{content, bus, rng, sys, state}`, the systems and the phases, and handles intents.
- `ActionRunner` is the one door for every Do action: it checks phase, open event, place, opening hours, time and energy, runs the system call, spends time and energy, writes station minutes (daily goals) and the log.

## 3. Phase flow (Scene & Flow)

Start menu -> Story letter -> Plan (Journal) -> Do (town) -> Check (Journal) -> next week Plan.
After the Check of week 4: Act (Journal, month end) -> next month Plan. After month 2: Retrospective.

| Phase | Class | What happens |
| --- | --- | --- |
| Plan | `PlanPhase` | Rolls weekly prices, trends and the quest board. The player sets a daily goal per day, the store plan (products to sell -> materials) and three budget jars (Store, Personal, Buffer). "Review plan" shows the forecast and warnings (never blocks), then "Start week" locks the plan. |
| Do | `DoPhase` | Seven days. A day can start with an event card: scheduled events on their day, random events on `EVENTS_PER_WEEK` (1 to 2) random days, never two days in a row, never the same random event twice in a row. Day 06:00-22:00. Sleep ends the day (works anywhere: the player walks home). Day end: goal check (+XP), quests expire, energy restore (lower max with no meal). |
| Check | `CheckPhase` | Pays the weekly living cost (unpaid -> debt). Recap: goals per day, sold vs store goal, income and costs, jars vs actual, XP. The player picks up to two notes for next week. |
| Act | `ActPhase` | Month end: pay the debt (minimum or more) and utilities, book one guild appointment for next month. Close month: unpaid utilities -> debt, interest, late fee if the minimum is not paid. |
| Retro | `RetroPhase` | Gold and debt per week, goal rate, store goal rate, buffer habit, sales, quests, interest, fees, carried bills, skills. |

## 4. Do rules

- Places (`data/places/`): Home + Store (0-24), Market (7-17, shut Fri), Guild Center (8-16, shut Sun), City Outskirt (6-18). Travel time = the larger `travelMin` of the two places. Early arrival waits for opening time.
- Stations (`data/stations/`) belong to a place. A station needs its place open (Store and Rest do not).
- Daily goals (`data/goals/`): each Plan phase starts with empty day slots. The goals are fixed once the week starts; the Do phase cannot change them (user rule, 8 Nov 2026). A goal is met when the player used one of its stations that day. Free time is met when work time is at most `FREE_TIME_MAX_WORK_MIN`.
- Store: stock the 3x3 shelf (product group, quantity up to `SHELF_SLOT_MAX`, price level). Open store costs `STORE_OPEN_ENERGY` once, then the hours play out (`CUSTOMERS_PER_HOUR`, buy chance x price level demand, trend weights) until sold out or the end of `STORE_OPEN_HOURS`. Shop result after close.
- Trade is a basket (user feedback D4): set a quantity on many rows, then one Buy all or Sell all action trades every line for one `TRADE_MIN`. Each cost shows the jar that pays it: Store jar for materials, lots, services and requests; Personal jar for food.
- Market stall: buy materials at the weekly price, buy meal packs (`FOOD_PRICE`), sell products at `MARKET_BUY_FROM_PLAYER` x value.
- Guild receptionist: buy lots of `WHOLESALE_LOT` at `WHOLESALE_BUY_RATIO`, sell products at `WHOLESALE_SELL_RATIO`, one Do service (`data/services/`, `inDo`).
- Quest board: `QUEST_BOARD_SIZE` commissions per week, take up to `QUEST_MAX_ACTIVE`, hand in before `QUEST_DEADLINE_DAYS`.
- Quest board Give: post a request for a material (steps of `REQUEST_QTY_STEP`). Pay now from the Store jar: unit price x `REQUEST_PRICE_MULT` x qty + `REQUEST_FEE`. The items arrive at day start after `REQUEST_DAYS`. Up to `REQUEST_MAX_OPEN` open requests.
- Outskirt: each walk takes `EXPLORE_WALK_MIN` and finds one spot (`data/spots/`, weighted), up to `EXPLORE_SPOTS_PER_DAY` per day. Earth level adds loot.
- Skills: Moon (craft, process; sets the product tier through `QUALITY_BY_MOON_LEVEL`), Sun (sell, trade; more customers), Earth (gather; more loot).

## 5. Data files

`BalanceConfig.json`, `items/`, `recipes/`, `places/`, `stations/`, `goals/`, `skills/`, `spots/`, `quests/`, `services/`, `events/`, `debt/riba_loan.json`, `notes/notes.json`, `help/help.json` (help popups), `objectives/objectives.json` (Journal objectives, mini tutorial; each names a check in `ObjectiveSystem`), `story/premise.json`, `start/start.json`, `scene/town.json` (3D layout: houses, props, roads, walkers, camera spots, tints, interior `rooms` per building with props, NPC, station anchors and camera; view data only). Items carry a `text` line for the item card.
Field names map one to one to Unity ScriptableObjects.

## 6. EventBus messages (`MSG` in `src/core/EventBus.js`)

Intents (views -> logic): `intent.setGoal {index, goal}`, `intent.setProduct {product, qty}`, `intent.setBudget {store?, personal?, buffer?}`, `intent.lockPlan`, `intent.action {id, params}`, `intent.respondEvent {index}`, `intent.finishCheck {ids}`, `intent.payDebt {amount}`, `intent.payUtilities`, `intent.bookService {id}`, `intent.finishAct`.
Logic -> views: `phase.entered`, `phase.exited`, `state.changed`, `clock.changed`, `action.done`, `action.refused {reason, text}`, `plan.validated`, `event.fired`, `event.resolved`, `day.started`, `day.ended`.

Action ids: `travel`, `shortBreak`, `eat`, `sleep`, `craft`, `dryStart`, `dryCollect`, `grind`, `stockShelf`, `storeOpen`, `storeHour`, `storeClose`, `marketBuy`, `buyFood`, `marketSell`, `wholesaleBuy`, `wholesaleSell`, `service`, `questTake`, `questHandIn`, `questPost {item, variant, qty}`, `exploreWalk`, `exploreGather`, `exploreSkip`, `exploreEnd` (returns the recap), `respondEvent`. `marketBuy`, `marketSell`, `wholesaleBuy`, `wholesaleSell` take `{lines: [...]}` (one line per item).

## 7. Views (DOM, `src/views/ui/`)

Visual style: approved style board v3 (project files `screens/overhaul-style/style-board-v3.png`).
- M2 Moonbloom Rattan House colours and fonts (Marcellus titles, Redaction body, Redaction 35 big totals).
- Washed-out grunge watercolor on paper grain; thin rough ink lines. Cross-hatch only for shadow and effect.
- Rattan cane only on big main frames (station windows, map window, large cards). Small parts use a slim wood frame.
- Journal: night-teal bookcloth, gold tooling, Art Nouveau corners, die-cut tabs, purple ribbon. No rattan.
- Help popup: any element with `data-help="<key>"` shows the text from `data/help/help.json` on hover. Headers carry a "?" mark.
- Icon + number over words (user rule). Placeholder icons in `Icons.js`; the names stay when art replaces them.
- Layout: stage 1280x720 scaled to the window; 8 px spacing scale; 12-column grid (margin 32, gutter 16). Station windows start at column 4; the station list uses columns 1-3.

| Class | Screen |
| --- | --- |
| `UiRoot` | Stage, layers, phase routing, toasts, hint bar, keys (M town, J journal, Esc back), hotspot layer over the 3D view, jar badge (`jarTag`), item buttons (`itemBtn`) |
| `HudView` | Phase plaque (phase + week) and the phase action (Review plan, Next week, Close month) as a gold button at top right (user decision, 8 Nov 2026). Day dial (user decision, 8 Nov 2026): the day from `DAY_START_HOUR` to `DAY_END_HOUR` on a 270 degree dial with a moving sun or moon, sky colour by the hour, weekday and time in the centre, energy ring around it with the energy number. Calendar pill (month, week, day), gold, debt, food, today's goal, Town and Journal buttons |
| `StartView` | Start menu and story letter |
| `JournalView` | Tabs in Scene & Flow order: Daily goals (drag goal cards onto days, or click a card then a day), Store plan (products to sell + materials needed; budget jars + plan check), Ledger and assets, Market (forecast range, trend, price now), Public schedule (opening hours, events, month-end bills), Skills (level and effects), Notes (last week's notes + objectives). Do adds Log. Review plan ribbon on every Plan tab. |
| `CheckView`, `ActView`, `RetroView` | Weekly recap, month end, retrospective |
| `TownMapView` | Place list over the 3D town (travel time, hours), card of the picked place with Go, name pills over the places |
| `PlaceView` | One location header frame, station list (with Town and Go home), station hotspots in the room, station window, exploration recap |
| `ItemCardView` | Detail card of a material, product or food pack (opens from any item icon) |
| `StoreView`, `CraftView`, `DryingView`, `GrindView`, `RestView`, `StallView`, `ReceptionView`, `QuestBoardView`, `ExploreView` | Station windows |
| `EventCardView` | Event card with responses |

## 8. 3D City View (`src/views/scene/SceneView.js`)

- Kenney CC0 kits (uploaded by the user) as placeholders: Fantasy Town (houses, stalls, fountain, lanterns, banners), Nature (palms, crops, flowers), Survival (grinding bench, barrels, tent, campfire), Food, Mini Forest, Mini Shop, Mini Characters (animated walkers and the player), Furniture (room props). The Factory kit is not used yet.
- Interior rooms (`scene/town.json` `rooms`): an open-front room per building, away from the town. The Market is an open-air set (`outdoor: true`): ground, paving, stalls, trees, idle and walking shoppers, no walls (user decision, 8 Nov 2026). The camera cuts to the room when the player is in a building and the town list is shut. Station hotspots (DOM pills) follow anchor points in the room.
- Only the GLB files the town uses are committed, under `assets/models/kenney/<kit>/`, with each kit's `Textures/colormap.png` and `License.txt`.
- Roofs and ground use the M2 town colours (`scene/town.json` `tints`). Houses are built from wall pieces and a scaled roof.
- The camera moves to the current place (`places`), with a slow sway. Light goes from day light to moon light by the clock.
- A CSS filter and the paper veil give the watercolor look on top of the canvas.

## 9. Class catalog (JS -> Unity)

`GameManager` (MonoBehaviour singleton), `EventBus` (C# events), `ContentDB` (Addressables lookup), `SaveSystem` (JSON save, version 2), `GameState` ([Serializable]). Systems as plain C# services: `TimeSystem`, `ActionRunner`, `EffectApplier`, `EconomySystem`, `StoreSystem`, `ProductionSystem`, `ExploreSystem`, `QuestSystem`, `DebtSystem`, `EventSystem`, `PlanSystem`, `SkillSystem`, `ObjectiveSystem`, `Ledger`, `ActivityLog`. Phases: `PlanPhase`, `DoPhase`, `CheckPhase`, `ActPhase`, `RetroPhase`.

## 10. Open questions

- Balance: a fair bot ends two months with about 1,700 gold and 2,200 debt (`npm run sim`). Target numbers are not set yet.
- Final icon art, character art and the town layout are placeholders.
