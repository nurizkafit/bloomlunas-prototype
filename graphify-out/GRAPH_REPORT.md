# Graph Report - bloomlunas-prototype  (2026-11-08)

## Corpus Check
- 140 files · ~44,402 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .css 1, .glb 1)

## Summary
- 553 nodes · 1441 edges · 27 communities (12 shown, 15 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 75 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d93591e8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Dom
- SceneView
- .count
- 9. Class catalog (JS -> Unity)
- StoreSystem
- .constructor
- runMonths.js
- package.json
- flow.cjs
- .count
- Phase
- EventBus.js
- .h
- Milestones (game jam overhaul)
- Bot
- GameManager.js
- DebtSystem
- ExploreSystem
- UiRoot
- helpers.js
- SkillSystem
- GameState
- TimeSystem
- ActView
- DoPhase
- .mcp.json

## God Nodes (most connected - your core abstractions)
1. `Dom` - 42 edges
2. `9. Class catalog (JS -> Unity)` - 26 edges
3. `Inventory` - 26 edges
4. `UiRoot` - 25 edges
5. `EconomySystem` - 24 edges
6. `7. Views (DOM, `src/views/ui/`)` - 23 edges
7. `SceneView` - 23 edges
8. `PlaceView` - 22 edges
9. `GameManager` - 20 edges
10. `Bot` - 18 edges

## Surprising Connections (you probably didn't know these)
- `7. Views (DOM, `src/views/ui/`)` --references--> `ActView`  [INFERRED]
  SPECS.md → src/views/ui/ActView.js
- `7. Views (DOM, `src/views/ui/`)` --references--> `CheckView`  [INFERRED]
  SPECS.md → src/views/ui/CheckView.js
- `7. Views (DOM, `src/views/ui/`)` --references--> `JournalView`  [INFERRED]
  SPECS.md → src/views/ui/JournalView.js
- `2. Architecture` --references--> `GameState`  [INFERRED]
  SPECS.md → src/model/GameState.js
- `2. Architecture` --references--> `Inventory`  [INFERRED]
  SPECS.md → src/model/Inventory.js

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

## Communities (27 total, 15 thin omitted)

### Community 0 - "Dom"
Cohesion: 0.08
Nodes (23): 7. Views (DOM, `src/views/ui/`), CraftView, Dom, DryingView, EventCardView, ExploreView, GrindView, C (+15 more)

### Community 2 - ".count"
Cohesion: 0.06
Nodes (8): 6. EventBus messages (`MSG` in `src/core/EventBus.js`), ActionRunner, clamp(), tiersLowFirst(), PlanSystem, ProductionSystem, QuestSystem, travel()

### Community 3 - "9. Class catalog (JS -> Unity)"
Cohesion: 0.14
Nodes (5): 9. Class catalog (JS -> Unity), ActivityLog, EffectApplier, EventSystem, Ledger

### Community 5 - ".constructor"
Cohesion: 0.08
Nodes (11): 10. Open questions, 1. Scope (jam vs full game), 2. Architecture, 4. Do rules, 5. Data files, 8. 3D City View (`src/views/scene/SceneView.js`), BloomLunas jam build specs, EventBus (+3 more)

### Community 6 - "runMonths.js"
Cohesion: 0.08
Nodes (11): ContentDB, toCsv(), loadDataNode(), args, content, quiet, root, rows (+3 more)

### Community 7 - "package.json"
Cohesion: 0.09
Nodes (20): dependencies, three@0.187.0, devDependencies, vite@8.3.5, vitest@5.0.5, name, private, scripts (+12 more)

### Community 10 - "Phase"
Cohesion: 0.13
Nodes (6): 3. Phase flow (Scene & Flow), ActPhase, CheckPhase, Phase, PlanPhase, RetroPhase

### Community 11 - "EventBus.js"
Cohesion: 0.21
Nodes (5): KNOWN, MSG, Calendar, WEEKDAYS, TABS

### Community 12 - ".h"
Cohesion: 0.09
Nodes (5): HudView, JournalView, trendIcon(), StallView, StoreView

### Community 13 - "Milestones (game jam overhaul)"
Cohesion: 0.29
Nodes (6): J1 Jam rules, logic and headless bot, J2 Jam screens (style board v3), J3 3D City View with Kenney placeholders, J4 Playtest, balance targets, polish, J5 Jam build and handoff, Milestones (game jam overhaul)

### Community 18 - "UiRoot"
Cohesion: 0.07
Nodes (11): SaveSystem, app, content, files, gm, q, save, scene (+3 more)

### Community 19 - "helpers.js"
Cohesion: 0.39
Nodes (5): vitest, files, gameInDo(), newContent(), root

## Knowledge Gaps
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Dom` connect `Dom` to `EventBus.js`, `.h`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Are the 25 inferred relationships involving `9. Class catalog (JS -> Unity)` (e.g. with `ContentDB` and `EventBus`) actually correct?**
  _`9. Class catalog (JS -> Unity)` has 25 INFERRED edges - model-reasoned connections that need verification._
- **Should `Dom` be split into smaller, more focused modules?**
  _Cohesion score 0.08408249603384453 - nodes in this community are weakly interconnected._
- **Why does `SceneView` connect `SceneView` to `UiRoot`, `package.json`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Should `.count` be split into smaller, more focused modules?**
  _Cohesion score 0.06471631205673758 - nodes in this community are weakly interconnected._
- **Why does `UiRoot` connect `UiRoot` to `Dom`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Should `9. Class catalog (JS -> Unity)` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._