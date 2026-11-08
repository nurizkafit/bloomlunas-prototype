# Graph Report - bloomlunas-prototype  (2026-11-08)

## Corpus Check
- 140 files · ~43,167 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .css 1, .glb 1)

## Summary
- 548 nodes · 1424 edges · 27 communities (10 shown, 17 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 75 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8bd3d79e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Dom
- SceneView
- .count
- 9. Class catalog (JS -> Unity)
- StoreSystem
- EventSystem
- runMonths.js
- package.json
- flow.cjs
- .count
- GameManager.js
- BloomLunas jam build specs
- .h
- Milestones (game jam overhaul)
- QuestSystem
- SkillSystem
- DebtSystem
- ExploreSystem
- UiRoot
- ActionRunner
- ObjectiveSystem
- GameState
- TimeSystem
- Rng
- DoPhase
- .mcp.json

## God Nodes (most connected - your core abstractions)
1. `Dom` - 42 edges
2. `9. Class catalog (JS -> Unity)` - 26 edges
3. `Inventory` - 26 edges
4. `UiRoot` - 25 edges
5. `EconomySystem` - 24 edges
6. `7. Views (DOM, `src/views/ui/`)` - 23 edges
7. `PlaceView` - 22 edges
8. `SceneView` - 20 edges
9. `GameManager` - 20 edges
10. `Bot` - 18 edges

## Surprising Connections (you probably didn't know these)
- `2. Architecture` --references--> `GameState`  [INFERRED]
  SPECS.md → src/model/GameState.js
- `9. Class catalog (JS -> Unity)` --references--> `GameState`  [INFERRED]
  SPECS.md → src/model/GameState.js
- `3. Phase flow (Scene & Flow)` --references--> `DoPhase`  [INFERRED]
  SPECS.md → src/phases/DoPhase.js
- `9. Class catalog (JS -> Unity)` --references--> `DoPhase`  [INFERRED]
  SPECS.md → src/phases/DoPhase.js
- `2. Architecture` --references--> `ActionRunner`  [INFERRED]
  SPECS.md → src/systems/ActionRunner.js

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
- 3-file cycle: `src/views/ui/PlaceView.js -> src/views/ui/QuestBoardView.js -> src/views/ui/StallView.js -> src/views/ui/PlaceView.js`

## Communities (27 total, 17 thin omitted)

### Community 0 - "Dom"
Cohesion: 0.06
Nodes (32): 7. Views (DOM, `src/views/ui/`), KNOWN, MSG, Calendar, WEEKDAYS, Inventory, REASON_TEXT, ActView (+24 more)

### Community 3 - "9. Class catalog (JS -> Unity)"
Cohesion: 0.14
Nodes (7): 3. Phase flow (Scene & Flow), 9. Class catalog (JS -> Unity), CheckPhase, PlanPhase, RetroPhase, ActivityLog, Ledger

### Community 6 - "runMonths.js"
Cohesion: 0.07
Nodes (17): vitest, ContentDB, GameManager, toCsv(), loadDataNode(), args, content, quiet (+9 more)

### Community 7 - "package.json"
Cohesion: 0.09
Nodes (20): dependencies, three@0.187.0, devDependencies, vite@8.3.5, vitest@5.0.5, name, private, scripts (+12 more)

### Community 9 - ".count"
Cohesion: 0.10
Nodes (5): 6. EventBus messages (`MSG` in `src/core/EventBus.js`), EconomySystem, round1(), ProductionSystem, travel()

### Community 11 - "BloomLunas jam build specs"
Cohesion: 0.20
Nodes (7): 10. Open questions, 1. Scope (jam vs full game), 2. Architecture, 4. Do rules, 8. 3D City View (`src/views/scene/SceneView.js`), BloomLunas jam build specs, EventBus

### Community 12 - ".h"
Cohesion: 0.09
Nodes (4): JournalView, trendIcon(), StallView, StoreView

### Community 13 - "Milestones (game jam overhaul)"
Cohesion: 0.29
Nodes (6): J1 Jam rules, logic and headless bot, J2 Jam screens (style board v3), J3 3D City View with Kenney placeholders, J4 Playtest, balance targets, polish, J5 Jam build and handoff, Milestones (game jam overhaul)

### Community 16 - "DebtSystem"
Cohesion: 0.19
Nodes (5): DebtSystem, clamp(), EffectApplier, round2(), tiersLowFirst()

### Community 18 - "UiRoot"
Cohesion: 0.07
Nodes (12): SaveSystem, app, content, files, gm, q, save, scene (+4 more)

## Knowledge Gaps
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Dom` connect `Dom` to `UiRoot`, `.h`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Are the 25 inferred relationships involving `9. Class catalog (JS -> Unity)` (e.g. with `ContentDB` and `EventBus`) actually correct?**
  _`9. Class catalog (JS -> Unity)` has 25 INFERRED edges - model-reasoned connections that need verification._
- **Should `Dom` be split into smaller, more focused modules?**
  _Cohesion score 0.05972288580984233 - nodes in this community are weakly interconnected._
- **Why does `UiRoot` connect `UiRoot` to `Dom`, `.h`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Should `.count` be split into smaller, more focused modules?**
  _Cohesion score 0.13756613756613756 - nodes in this community are weakly interconnected._
- **Why does `9. Class catalog (JS -> Unity)` connect `9. Class catalog (JS -> Unity)` to `.count`, `StoreSystem`, `EventSystem`, `runMonths.js`, `.count`, `GameManager.js`, `BloomLunas jam build specs`, `QuestSystem`, `SkillSystem`, `DebtSystem`, `ExploreSystem`, `UiRoot`, `ActionRunner`, `ObjectiveSystem`, `GameState`, `TimeSystem`, `DoPhase`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Should `9. Class catalog (JS -> Unity)` be split into smaller, more focused modules?**
  _Cohesion score 0.14035087719298245 - nodes in this community are weakly interconnected._