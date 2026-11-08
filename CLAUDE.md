# BloomLunas core loop prototype

three.js + Vite prototype of the BloomLunas core loop (Plan, Do, Check weekly; Act monthly).
It is a living spec and a balance testbed for the Unity build. It is not the shipping game.

Read these first:
- `SPECS.md`: what to build (scope, architecture, classes, data, scene).
- `MILESTONES.md`: the order of work and the status of each milestone.

## Milestone gate (most important rule)

- Work on ONE milestone at a time: the first milestone in `MILESTONES.md` with status `In progress` or `Approved`.
- Do not start the next milestone until the user approves it in the chat.
- When the exit criteria of a milestone pass:
  1. Run `npm run check`.
  2. Set the milestone status to `Review` in `MILESTONES.md`. Fill its "Result" lines.
  3. Commit. Then stop and give the user a short report: what works, how to see it, open issues.
- Only the user sets a milestone to `Done` and the next one to `Approved`.
- User override (2 Nov 2026): run M2 to M5 in one go, with no stop for approval between them. Each milestone still runs its test loop (`npm run check` + its exit criteria). After each milestone passes: commit and push to `main`. Stop after M5 and report.
- If a task needs a design decision that `SPECS.md` does not answer, check the BloomLunas Docs repo (`nurizkafit/bloomlunas-docs`, the source of truth). If the docs do not answer it either, stop and ask. Do not invent game rules.

## Architecture rules

- Keep data, logic and view in separate classes.
  - `data/*.json`: all content and numbers. No numbers in code (use `BalanceConfig`).
  - `src/model/`: plain data classes. No three.js, no DOM.
  - `src/systems/`, `src/phases/`, `src/core/`: logic. No three.js, no DOM.
  - `src/views/`: three.js and DOM only. A view reads `GameState` and sends intents. A view never changes `GameState`.
- Logic and view talk only through `EventBus` (`intent.*` from views, `*.changed` / `phase.*` from logic).
- Logic must run headless in Node (`npm run sim`). If an import breaks the headless run, the layer rule is broken.
- Class and field names match `SPECS.md`. The Unity dev maps them one to one to C#. Do not rename without updating `SPECS.md`.
- All effects of activities, events and investments are `EffectData` lists, applied by `EffectApplier`.

## Folder layout

```
CLAUDE.md  SPECS.md  MILESTONES.md
index.html  package.json  vite.config.js
data/          BalanceConfig.json, items/, recipes/, places/, stations/, goals/, skills/, spots/, quests/, services/, events/, debt/, notes/, help/, objectives/, story/, start/, scene/town.json
src/main.js    browser entry: builds GameManager, SceneView and UiRoot
src/core/      GameManager, EventBus, ContentDB, SaveSystem, Rng
src/model/     GameState, Calendar, Inventory
src/systems/   ActionRunner, TimeSystem, EffectApplier, EconomySystem, StoreSystem, ProductionSystem, ExploreSystem, QuestSystem, DebtSystem, EventSystem, PlanSystem, SkillSystem, ObjectiveSystem, Ledger, ActivityLog
src/phases/    Phase, PlanPhase, DoPhase, CheckPhase, ActPhase, RetroPhase
src/views/ui/    UiRoot, Dom, Icons, Ornaments, theme.css, HudView, StartView, JournalView, CheckView, ActView, RetroView, TownMapView, PlaceView, ItemCardView, station views, EventCardView
src/views/scene/ SceneView (3D City View)
src/views/sheet/ InterfaceSheet + sheet.css (sheet.html: all UI components with IDs, for the art audit)
src/sim/       Bot, runMonths.js (headless CLI), loadDataNode, csv.js
assets/models/kenney/<kit>/  used Kenney GLB files + Textures/colormap.png + License.txt (CC0)
tests/         *.test.js (Vitest, logic only), browser/ (Playwright flow test)
```

## Commands

- `npm run dev`: Vite dev server.
- `npm run sim -- --runs 100`: headless bot runs over two months, prints a summary, writes `out/sim.csv`.
- `npm test`: Vitest (logic only).
- `npm run check`: `npm test` + two headless runs + build.
- `npm run test:browser`: Playwright browser tests in `tests/browser/` (starts Vite, screenshots in `out/browser/`). Run it at each milestone with a view.
- `npm run sheet`: writes the interface sheet (`sheet.html`) to `out/browser/interface-sheet.png` and `.pdf`. When you add or change a UI component, add it to `src/views/sheet/InterfaceSheet.js` with the next free ID (never reuse an ID).

## Conventions

- Plain JavaScript (ES modules) with JSDoc types. No framework for the UI (DOM + CSS).
- One class per file. File name = class name.
- Pin dependency versions in `package.json` (exact versions).
- Placeholder numbers come from `SPECS.md` section 9. Mark a new placeholder with `"_placeholder": true` in its JSON.
- Docs and UI text: short sentences, simple words (ASD-STE100 style).
- Commit after each completed task, with a clear message. Push after each completed milestone (user rule, 2 Nov 2026).
- One branch only (user rule, 6 Nov 2026): work, commit and push on `main`. Do not create milestone or feature branches. Revert to an old state with the commit history (`git log`), not with branches.

## Skills, plugins and tools

Project rules in this file win over skill defaults. Example: a skill may scaffold TypeScript or its own folders; use plain JS and the layout above.

Project skills (`.claude/skills/`, copied, see `THIRD_PARTY_NOTICES.md`):

| Skill | Use it in |
| --- | --- |
| prototype-fast | All milestones: keep scope small |
| threejs-gameplay-systems | M1, M3: core loop, entities, camera, input |
| threejs-scene-setup, threejs-materials-lighting, camera-systems | M3: town scene, isometric camera, day light |
| threejs-gltf-loading | M3: `AssetSlot` model loading |
| threejs-game-ui-designer, game-ui-ux | M2, M4, M5, M6: Planner Book, HUD, cards, recap, month-end, testbed |
| save-systems | M5: `SaveSystem` |
| threejs-debug-profiler | Any blank canvas, render or performance bug |
| threejs-qa-release | M7: playtest QA, bot playtests, screenshots |
| unity-scriptableobjects, unity-csharp-scripting | Check that data and class names map cleanly to Unity (no Unity code in this repo) |

Plugins (Claude Code asks to install them when you trust this folder):
- `frontend-design` (Anthropic): UI design for DOM screens.
- `caveman`: short replies to save usage. Turn it off with `/plugin` if a report becomes unclear.

MCP server `polyfork` (`.mcp.json`): search low-poly assets (`search_assets`, `get_asset`, `preview_scene`).
- Use it only from M3, and only to fill an `AssetSlot` with a stand-in model. The greybox stays the default.
- Write the chosen asset id in `data/locations/*.json` (`polyforkAssetId`), not in code.
- Licence: commercial use allowed; do not redistribute asset files. Do not commit downloaded paid files.

## graphify (knowledge graph)

Same tool and setup as the BloomLunas Docs repo: [Graphify-Labs/graphify](https://github.com/Graphify-Labs/graphify).

Rules:
- When `graphify-out/graph.json` exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question. Put this rule in every subagent prompt that explores code. Use `graphify path "<A>" "<B>"` and `graphify explain "<concept>"` for focused questions. Read `graphify-out/GRAPH_REPORT.md` only for a broad architecture review.
- After you change code, run `graphify update .` (AST only, no token cost).
- After you change `SPECS.md`, `MILESTONES.md` or other Markdown, run `/graphify . --update` (uses tokens).
- At each milestone `Review`, update the graph and commit `graphify-out/` with the milestone commit. A large diff in `graph.json` is expected.

Set up once (per machine):
- `pip install graphifyy` (Python 3.10+; the package name has two y), then `graphify install`.
- The hooks in `.claude/settings.json` do nothing when `graphify` is not installed.
- First build: run `/graphify .` at the end of M0, when code exists. Excluded paths are in `.graphifyignore`.
- M0 adds the npm scripts `"graph:update": "graphify update ."` and `"graph:query": "graphify query"`.
