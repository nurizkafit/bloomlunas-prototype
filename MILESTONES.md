# Milestones

Status values: `Not started` · `Approved` (user says go) · `In progress` · `Review` (Claude done, waiting for user) · `Done` (user accepted).

Rule: Claude works only on the milestone that is `Approved` or `In progress`. After its exit criteria pass, Claude sets it to `Review`, reports, and stops. The user sets `Done` and approves the next one.

| # | Milestone | Status |
| --- | --- | --- |
| M0 | Project skeleton | Done |
| M1 | Logic core, headless month | Done |
| M2 | Plan phase (Planner Book port) | Review |
| M3 | Do phase (town, avatar, actions) | Review |
| M4 | Events and Check | In progress |
| M5 | Act, endings, save | Approved |
| M6 | Balance testbed and CSV export | Not started |
| M7 | Full-month playtest and handoff | Not started |

---

## M0 Project skeleton

Goal: the folder layout from `CLAUDE.md` exists and runs.

Tasks:
- [x] `package.json` with exact versions: `three`, `vite`, `vitest`. Scripts: `dev`, `build`, `test`, `sim`, `check`.
- [x] Folder layout from `CLAUDE.md`, with empty class files and JSDoc headers.
- [x] `EventBus` (on, off, emit; typed message names from `SPECS.md` §7).
- [x] `PhaseMachine` + `Phase` base with empty `PlanPhase`, `DoPhase`, `CheckPhase`, `ActPhase`, `EndingPhase` that only log enter and exit.
- [x] `ContentDB` loads `data/` in Node and in the browser.
- [x] `data/BalanceConfig.json` with the placeholder values from `SPECS.md` §9.
- [x] npm scripts `graph:update` and `graph:query`. First graph build with `/graphify .`: NOT DONE (graphify could not be installed in the build environment; run it once on your machine).

Exit criteria:
- [x] `npm run sim` steps through Plan → Do → Check × `WEEKS_PER_MONTH` → Act → ending check, and prints each phase.
- [x] `npm run dev` shows an empty page with the phase name, and a "Next phase" button that sends `intent.nextPhase`.
- [x] `npm run check` passes.

Result:
- `npm run sim` runs Plan > Do > Check x 4 weeks > Act > Ending (14 phases) and prints each phase.
- `npm run dev` shows the phase name and calendar, with a "Next phase" button that sends `intent.nextPhase`. Tested in headless Chromium: Plan to Ending in 13 clicks, button off at Ending, no console errors.
- `npm run check` passes: 3 tests, 1 headless month, build.
- `EventBus` refuses unknown message names. `ContentDB.num()` refuses missing BalanceConfig keys, so no number can hide in code.
- All classes from the folder layout exist as stubs with a JSDoc line and their milestone.
- Open: the first graphify build (see the task above). `ActPhase` ends the game after `JAM_MONTHS`; the real `EndingChecker` comes in M5.

---

## M1 Logic core, headless month

Goal: one month plays in Node with a bot, with no view.

Tasks:
- [x] Model classes: `GameState`, `Calendar`, `Wallet`, `Inventory` (variants, age), `DebtAccount`, `SkillBook`, `Relationships`, `WeekPlan`, `Ledger`.
- [x] `TimeSystem`: clock moves only when an action runs; `ENERGY_MAX`, energy cost per action, fatigue, late wake-up, day end (`SPECS.md` §5).
- [x] `EffectApplier` for every effect type in `SPECS.md` §8.
- [x] `ActionRunner`: runs one action inside an activity (`SPECS.md` §4): rule checks (opening hours, materials, energy, gold), time and energy cost, effects, ledger lines, XP, plan match bonus.
- [x] `ProductionSystem` + `QualityCalculator`: 4 jam recipes, quality tiers, shelf life and spoilage, Sun drying and Grinding (`SPECS.md` §6).
- [x] `DebtSystem`: riba loan with monthly compound interest and hidden fee; unpaid amount becomes debt up to `DEBT_LIMIT`.
- [x] `EconomySystem`: hidden real price inside the forecast range; quality price multiplier; relationship price modifier; shop customers; buy and sell.
- [x] Data files for the prototype activities, actions, locations, products, recipes, materials, debt and quality config (`SPECS.md` §8).
- [x] `Bot` that follows a simple fixed plan. `runMonths.js` prints the ledger.

Exit criteria:
- [x] `npm run sim -- --months 1 --runs 1` prints a week-by-week ledger and the end gold and debt.
- [x] Unit tests for `ActionRunner`, `EffectApplier`, `TimeSystem`, `QualityCalculator` (match the examples in docs `systems/production.md`), `DebtSystem`.
- [x] No three.js or DOM import under `src/model`, `src/systems`, `src/phases`, `src/core`.

Result:
- `npm run check` passes: 32 tests (6 files), 1 headless month, build.
- `npm run sim -- --months 1 --runs 1` prints the week ledger (income, expenses, net, gold, debt, sold, waste, tiers made), the Act line (paid, interest, fee, unpaid utilities, debt), XP and relations. `--runs N` prints one line per run. `--months N` sets the month count.
- Bot run, seed 1: about +27 to +65 G net per week; end debt 2787.57 after paying 291.60. Products are mostly Amateur; Standard comes in week 3 or 4 (cooking level 3).
- New: `Rng` (seeded), `Phase.finish()` (end rules before `next()`), `ContentDB.config()`, `loc_market.sells`, 7 balance keys (see `SPECS.md` §9).
- Rules I had to choose (not in the docs, please confirm): (1) Weekly expenses that gold cannot pay become debt. (2) Act order: interest, then late fee, then unpaid utilities. (3) Spoiled materials can still go in a recipe at 20 points; spoiled products are waste. (4) Travel has no night limit, so the player can always walk home. (5) Late for an appointment = same penalty as missed.
- Not done: graphify graph (not installed here). EndingChecker, events, CSV come in later milestones.

---

## M2 Plan phase (Planner Book port)

Goal: the player builds a week plan in the browser, on real `GameState`.

Tasks:
- [x] Port the Planner Book v2 (`prototypes/plan-phase-book/index.html`) into `PlannerBookView`. Keep look and interactions.
- [x] Move its constants to `BalanceConfig`, its card types to `ActivityData`, its plan check to `PlanValidator`.
- [x] Card names and recipes follow the docs (`SPECS.md` §10).
- [x] Tabs read the current week and real data, not week 2 placeholders.
- [x] "Start the week" sends `intent.lockPlan`; `PlanPhase` writes `WeekPlan` and budget slots.

Exit criteria:
- [x] Place, move (30 min snap) and set cards; problems and warnings show; lock the plan; the game moves to Do.
- [x] `PlanValidator` has unit tests.

Result:
- `npm run check` passes: 40 tests (8 tests for `PlanValidator`), headless month, build.
- Browser test (Playwright): drag Open shop to Mon 09:00, Explore to Tue 07:00, Craft to Wed 13:00; drop on Sunday shop is refused (closed); card popover opens; all 5 tabs render; "Start the week" locks the plan and goes to Do. No console errors.
- Port: same CSS and layout as Planner Book v2. Deck = all plannable activities from `data/activities` (`planDurationMin`, `planDurationOptions`). Settings: location (guild cards), hours, recipe (Craft). Budget slots exp, buy, buf.
- `intent.moveCard` carries `{ uid, ...changes }` (day, startMin, durationMin, locationId, recipeId). `PlanPhase` runs `PlanValidator` after each change and sends `plan.validated`.
- Not ported: Spec and Sheet overlays (M7), "Test this idea" note checks (notes come in M4), festival and wholesale cards (not in the jam scope).

---

## M3 Do phase (town, avatar, actions)

Goal: the player plays a week in the greybox town.

Tasks:
- [x] `TownView`: isometric orthographic camera, pan and zoom limits, ground, paths, light by time of day.
- [x] `AssetSlot`: greybox per slot id; loads `assets/models/<slot id>.glb` if the file exists; state switch.
- [x] `PathGraph` + `Avatar` walk between location door points.
- [x] `ActionMenuView` (click a location → its activities → their actions), `CraftView` (pick recipe and material variants; shows input cost next to expected sell price and quality tier), `HudView` (day, clock, gold, energy, fatigue).
- [x] Planned cards show in the HUD; plan match bonus shows on completion.
- [x] Change plan only for days not started (`SPECS.md` §4).

Exit criteria:
- [x] Play Mon to Sun with Open shop, Sell to organization, Buy, Craft, Sun drying, Grinding, Explore (City zone), Commission, Rest, 1 service visit.
- [x] Replace one greybox with a test `.glb` by file name, with no code change.

Result:
- `npm run check` passes (41 tests). New `npm run test:browser` (Playwright): Plan flow, a Do week through the UI, and the glTF swap. All pass with no console errors.
- Do week test (UI clicks): Mon to Sun with Buy, Craft (Brew), Open shop, Sun drying, Explore, Commission, Sell to organization, Organization visit (service, appointment set by the test until M5), Grinding, Rest. The town click opens the right menu. "Week done" goes to Check.
- glTF test: copy a test model to `assets/models/loc_market.glb`; the slot loads it and hides the greybox. No code change. (`tests/fixtures/test_model.glb`, made by `scripts/make_test_glb.py`.)
- Town layout data: `position`, `door`, `greybox` in `data/locations/*.json`; path graph in `data/locations/_paths.json`. Vite serves `assets/` as the public folder (`./models/<slot id>.glb`).
- "Change plan" in the HUD opens the Planner Book. Days that started are locked (view and `DoPhase` both check).
- Open: customers are not drawn as figures yet (the shop slot shows state "busy"). The bundle is 745 kB (three.js); fine for a prototype.

---

## M4 Events and Check

Goal: events interrupt the week; the week ends with a recap.

Tasks:
- [ ] `EventSystem`: week queue from `EventData` (scheduled + random), card fires during Do, response applies effects, time loss removes planned cards.
- [ ] `EventCardView` (situation, options with costs).
- [ ] `CheckPhase` + `RecapView`: income and expenses, weekly living cost paid, XP per path, plan vs actual bars, note field.
- [ ] Notes show in the next Plan (Journal tab).

Exit criteria:
- [ ] A week with at least 1 scheduled and 1 random event plays and ends in a correct recap.
- [ ] Ledger total in Check = sum of Do ledger lines (unit test).

Result:

---

## M5 Act, endings, save

Goal: the month closes; the game can end; progress saves.

Tasks:
- [ ] `ActPhase` + `MonthEndView`: month summary, riba interest and fees applied, pay debt (minimum or more), pay utilities, 1 investment (Upgrade), book 1 service appointment for next month.
- [ ] Unpaid amount becomes new debt up to `DEBT_LIMIT`.
- [ ] `EndingChecker` + `EndingView`: Good and Bad endings from `EndingData`.
- [ ] `SaveSystem`: auto-save `GameState` as JSON at each phase end; load on start.

Exit criteria:
- [ ] A full month plays from Plan week 1 to Act and then to the next month or an ending.
- [ ] Reload the page in any phase and continue from the last phase end.

Result:

---

## M6 Balance testbed and CSV export

Goal: tune numbers without play.

Tasks:
- [ ] `Testbed` panel (dev overlay): edit `BalanceConfig` values live; run N bot months.
- [ ] Bot profiles: careful saver, spender, random.
- [ ] Results: win rate, bankruptcy rate, gold per week (min, mean, max), debt at month end.
- [ ] CSV export (one row per run, one column per metric and per changed variable) for the balancing sheet.

Exit criteria:
- [ ] 100 runs of 1 month finish in under 10 s in the browser.
- [ ] The CSV opens in Google Sheets with correct columns.

Result:

---

## M7 Full-month playtest and handoff

Goal: the prototype is ready for the team.

Tasks:
- [ ] Play one full month by hand; fix blockers.
- [ ] `DevOverlay` Spec pins on every screen (from the Planner Book).
- [ ] Update `SPECS.md` with any change made during the build.
- [ ] `README.md`: how to run, how to add content, how to drop in a model.

Exit criteria:
- [ ] The user plays one month with no blocker.
- [ ] The Unity dev and the artist can read `SPECS.md` and map classes and slots.

Result:
