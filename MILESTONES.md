# Milestones

Status values: `Not started` · `Approved` (user says go) · `In progress` · `Review` (Claude done, waiting for user) · `Done` (user accepted).

Rule: Claude works only on the milestone that is `Approved` or `In progress`. After its exit criteria pass, Claude sets it to `Review`, reports, and stops. The user sets `Done` and approves the next one.

| # | Milestone | Status |
| --- | --- | --- |
| M0 | Project skeleton | Approved |
| M1 | Logic core, headless month | Not started |
| M2 | Plan phase (Planner Book port) | Not started |
| M3 | Do phase (town, avatar, actions) | Not started |
| M4 | Events and Check | Not started |
| M5 | Act, endings, save | Not started |
| M6 | Balance testbed and CSV export | Not started |
| M7 | Full-month playtest and handoff | Not started |

---

## M0 Project skeleton

Goal: the folder layout from `CLAUDE.md` exists and runs.

Tasks:
- [ ] `package.json` with exact versions: `three`, `vite`, `vitest`. Scripts: `dev`, `build`, `test`, `sim`, `check`.
- [ ] Folder layout from `CLAUDE.md`, with empty class files and JSDoc headers.
- [ ] `EventBus` (on, off, emit; typed message names from `SPECS.md` §5).
- [ ] `PhaseMachine` + `Phase` base with empty `PlanPhase`, `DoPhase`, `CheckPhase`, `ActPhase`, `EndingPhase` that only log enter and exit.
- [ ] `ContentDB` loads `data/` in Node and in the browser.
- [ ] `data/BalanceConfig.json` with the placeholder values from `SPECS.md` §8.
- [ ] npm scripts `graph:update` and `graph:query`; first graph build with `/graphify .` (see `CLAUDE.md`).

Exit criteria:
- [ ] `npm run sim` steps through Plan → Do → Check × `WEEKS_PER_MONTH` → Act → ending check, and prints each phase.
- [ ] `npm run dev` shows an empty page with the phase name, and a "Next phase" button that sends `intent.nextPhase`.
- [ ] `npm run check` passes.

Result: _(Claude fills this in at Review)_

---

## M1 Logic core, headless month

Goal: one month plays in Node with a bot, with no view.

Tasks:
- [ ] Model classes: `GameState`, `Calendar`, `Wallet`, `Inventory`, `DebtAccount`, `SkillBook`, `WeekPlan`, `Ledger`.
- [ ] `TimeSystem`: clock moves only when an action runs; energy, fatigue, day end.
- [ ] `EffectApplier` for every effect type in `SPECS.md` §6.
- [ ] `ActionRunner`: rule checks (opening hours, materials, energy, gold), time cost, effects, ledger lines, XP, plan match bonus.
- [ ] `EconomySystem`: hidden real price inside the forecast range; shop customers; buy and sell.
- [ ] Data files for the prototype activities, locations, items (`SPECS.md` §6).
- [ ] `Bot` that follows a simple fixed plan. `runMonths.js` prints the ledger.

Exit criteria:
- [ ] `npm run sim -- --months 1 --runs 1` prints a week-by-week ledger and the end gold and debt.
- [ ] Unit tests for `ActionRunner`, `EffectApplier`, `TimeSystem`.
- [ ] No three.js or DOM import under `src/model`, `src/systems`, `src/phases`, `src/core`.

Result:

---

## M2 Plan phase (Planner Book port)

Goal: the player builds a week plan in the browser, on real `GameState`.

Tasks:
- [ ] Port the Planner Book v2 (`prototypes/plan-phase-book/index.html`) into `PlannerBookView`. Keep look and interactions.
- [ ] Move its constants to `BalanceConfig`, its card types to `ActivityData`, its plan check to `PlanValidator`.
- [ ] Card names follow the GDD (`SPECS.md` §7).
- [ ] Tabs read the current week and real data, not week 2 placeholders.
- [ ] "Start the week" sends `intent.lockPlan`; `PlanPhase` writes `WeekPlan` and budget slots.

Exit criteria:
- [ ] Place, move (30 min snap) and set cards; problems and warnings show; lock the plan; the game moves to Do.
- [ ] `PlanValidator` has unit tests.

Result:

---

## M3 Do phase (town, avatar, actions)

Goal: the player plays a week in the greybox town.

Tasks:
- [ ] `TownView`: isometric orthographic camera, pan and zoom limits, ground, paths, light by time of day.
- [ ] `AssetSlot`: greybox per slot id; loads `assets/models/<slot id>.glb` if the file exists; state switch.
- [ ] `PathGraph` + `Avatar` walk between location door points.
- [ ] `ActionMenuView` (click a location → its actions), `HudView` (day, clock, gold, energy).
- [ ] Planned cards show in the HUD; plan match bonus shows on completion.
- [ ] Change plan only for days not started (`SPECS.md` §4).

Exit criteria:
- [ ] Play Mon to Sun with Open shop, Sell to organization, Hand craft, Gather/Harvest, Buy, Commission, Rest, 1 service visit.
- [ ] Replace one greybox with a test `.glb` by file name, with no code change.

Result:

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
- [ ] `ActPhase` + `MonthEndView`: month summary, pay debt (minimum or more), pay utilities, 1 investment (Upgrade), book 1 service appointment for next month.
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
