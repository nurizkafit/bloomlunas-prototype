# Graph Report - bloomlunas-prototype  (2026-11-08)

## Corpus Check
- 138 files · ~37,480 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .css 1, .glb 1)

## Summary
- 513 nodes · 1299 edges · 19 communities (10 shown, 9 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 71 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3921825f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Dom
- PlanSystem
- 9. Class catalog (JS -> Unity)
- StoreSystem
- EventSystem
- runMonths.js
- package.json
- flow.cjs
- .count
- .h
- Milestones (game jam overhaul)
- QuestSystem
- SkillSystem
- DebtSystem
- UiRoot
- TimeSystem
- .constructor
- .mcp.json

## God Nodes (most connected - your core abstractions)
1. `Dom` - 38 edges
2. `9. Class catalog (JS -> Unity)` - 26 edges
3. `Inventory` - 24 edges
4. `UiRoot` - 22 edges
5. `GameManager` - 20 edges
6. `7. Views (DOM, `src/views/ui/`)` - 20 edges
7. `EconomySystem` - 20 edges
8. `PlaceView` - 18 edges
9. `Bot` - 18 edges
10. `JournalView` - 17 edges

## Surprising Connections (you probably didn't know these)
- `9. Class catalog (JS -> Unity)` --references--> `GameManager`  [INFERRED]
  SPECS.md → src/core/GameManager.js
- `5. Data files` --references--> `ObjectiveSystem`  [INFERRED]
  SPECS.md → src/systems/ObjectiveSystem.js
- `7. Views (DOM, `src/views/ui/`)` --references--> `HudView`  [INFERRED]
  SPECS.md → src/views/ui/HudView.js
- `7. Views (DOM, `src/views/ui/`)` --references--> `JournalView`  [INFERRED]
  SPECS.md → src/views/ui/JournalView.js
- `7. Views (DOM, `src/views/ui/`)` --references--> `UiRoot`  [INFERRED]
  SPECS.md → src/views/ui/UiRoot.js

## Import Cycles
- 2-file cycle: `src/views/ui/GrindView.js -> src/views/ui/PlaceView.js -> src/views/ui/GrindView.js`
- 2-file cycle: `src/views/ui/PlaceView.js -> src/views/ui/ReceptionView.js -> src/views/ui/PlaceView.js`
- 2-file cycle: `src/views/ui/PlaceView.js -> src/views/ui/StallView.js -> src/views/ui/PlaceView.js`
- 2-file cycle: `src/views/ui/ExploreView.js -> src/views/ui/PlaceView.js -> src/views/ui/ExploreView.js`
- 2-file cycle: `src/views/ui/CraftView.js -> src/views/ui/PlaceView.js -> src/views/ui/CraftView.js`
- 2-file cycle: `src/views/ui/DryingView.js -> src/views/ui/PlaceView.js -> src/views/ui/DryingView.js`
- 2-file cycle: `src/views/ui/PlaceView.js -> src/views/ui/QuestBoardView.js -> src/views/ui/PlaceView.js`
- 2-file cycle: `src/views/ui/PlaceView.js -> src/views/ui/RestView.js -> src/views/ui/PlaceView.js`
- 2-file cycle: `src/views/ui/PlaceView.js -> src/views/ui/StoreView.js -> src/views/ui/PlaceView.js`
- 3-file cycle: `src/views/ui/PlaceView.js -> src/views/ui/ReceptionView.js -> src/views/ui/StallView.js -> src/views/ui/PlaceView.js`

## Communities (19 total, 9 thin omitted)

### Community 0 - "Dom"
Cohesion: 0.07
Nodes (26): 7. Views (DOM, `src/views/ui/`), Calendar, WEEKDAYS, ActView, CheckView, CraftView, Dom, DryingView (+18 more)

### Community 3 - "9. Class catalog (JS -> Unity)"
Cohesion: 0.06
Nodes (17): 10. Open questions, 1. Scope (jam vs full game), 3. Phase flow (Scene & Flow), 4. Do rules, 5. Data files, 8. 3D City View (`src/views/scene/SceneView.js`), 9. Class catalog (JS -> Unity), BloomLunas jam build specs (+9 more)

### Community 6 - "runMonths.js"
Cohesion: 0.07
Nodes (20): vitest, ContentDB, KNOWN, MSG, Inventory, toCsv(), loadDataNode(), args (+12 more)

### Community 7 - "package.json"
Cohesion: 0.08
Nodes (21): dependencies, three@0.187.0, devDependencies, vite@8.3.5, vitest@5.0.5, name, private, scripts (+13 more)

### Community 9 - ".count"
Cohesion: 0.09
Nodes (5): 6. EventBus messages (`MSG` in `src/core/EventBus.js`), Bot, EconomySystem, round1(), ProductionSystem

### Community 12 - ".h"
Cohesion: 0.10
Nodes (5): HudView, JournalView, trendIcon(), StallView, StoreView

### Community 13 - "Milestones (game jam overhaul)"
Cohesion: 0.29
Nodes (6): J1 Jam rules, logic and headless bot, J2 Jam screens (style board v3), J3 3D City View with Kenney placeholders, J4 Playtest, balance targets, polish, J5 Jam build and handoff, Milestones (game jam overhaul)

### Community 16 - "DebtSystem"
Cohesion: 0.19
Nodes (5): DebtSystem, clamp(), EffectApplier, round2(), tiersLowFirst()

### Community 18 - "UiRoot"
Cohesion: 0.07
Nodes (12): SaveSystem, app, content, files, gm, q, save, scene (+4 more)

### Community 23 - ".constructor"
Cohesion: 0.08
Nodes (7): 2. Architecture, EventBus, GameManager, Rng, ActionRunner, ExploreSystem, gameInDo()

## Knowledge Gaps
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Dom` connect `Dom` to `.h`, `runMonths.js`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Are the 25 inferred relationships involving `9. Class catalog (JS -> Unity)` (e.g. with `ContentDB` and `EventBus`) actually correct?**
  _`9. Class catalog (JS -> Unity)` has 25 INFERRED edges - model-reasoned connections that need verification._
- **Should `Dom` be split into smaller, more focused modules?**
  _Cohesion score 0.07246376811594203 - nodes in this community are weakly interconnected._
- **Why does `UiRoot` connect `UiRoot` to `Dom`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `GameManager` (e.g. with `2. Architecture` and `9. Class catalog (JS -> Unity)`) actually correct?**
  _`GameManager` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `9. Class catalog (JS -> Unity)` be split into smaller, more focused modules?**
  _Cohesion score 0.06285714285714286 - nodes in this community are weakly interconnected._
- **Why does `9. Class catalog (JS -> Unity)` connect `9. Class catalog (JS -> Unity)` to `PlanSystem`, `StoreSystem`, `EventSystem`, `runMonths.js`, `.count`, `QuestSystem`, `SkillSystem`, `DebtSystem`, `UiRoot`, `TimeSystem`, `.constructor`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._