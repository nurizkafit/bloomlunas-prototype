# Graph Report - bloomlunas-prototype  (2026-11-08)

## Corpus Check
- 144 files · ~53,940 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 2, .css 2, .glb 1)

## Summary
- 586 nodes · 1565 edges · 32 communities (14 shown, 18 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 75 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `070f5529`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Dom
- SceneView
- .count
- ActivityLog
- StoreSystem
- BloomLunas jam build specs
- runMonths.js
- package.json
- flow.cjs
- GameManager.js
- Phase
- PlanSystem
- .h
- Milestones (game jam overhaul)
- Rng
- ActionRunner
- DebtSystem
- InterfaceSheet
- UiRoot
- EventSystem
- SkillSystem
- GameState
- TimeSystem
- helpers.js
- DoPhase
- ContentDB
- .constructor
- QuestSystem
- ExploreSystem
- .mcp.json
- EventBus

## God Nodes (most connected - your core abstractions)
1. `Dom` - 43 edges
2. `UiRoot` - 27 edges
3. `Inventory` - 26 edges
4. `9. Class catalog (JS -> Unity)` - 26 edges
5. `SceneView` - 25 edges
6. `EconomySystem` - 24 edges
7. `PlaceView` - 23 edges
8. `7. Views (DOM, `src/views/ui/`)` - 22 edges
9. `GameManager` - 20 edges
10. `Bot` - 18 edges

## Surprising Connections (you probably didn't know these)
- `7. Views (DOM, `src/views/ui/`)` --references--> `JournalView`  [INFERRED]
  SPECS.md → src/views/ui/JournalView.js
- `2. Architecture` --references--> `GameManager`  [INFERRED]
  SPECS.md → src/core/GameManager.js
- `9. Class catalog (JS -> Unity)` --references--> `GameManager`  [INFERRED]
  SPECS.md → src/core/GameManager.js
- `9. Class catalog (JS -> Unity)` --references--> `EventBus`  [INFERRED]
  SPECS.md → src/core/EventBus.js
- `9. Class catalog (JS -> Unity)` --references--> `ContentDB`  [INFERRED]
  SPECS.md → src/core/ContentDB.js

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

## Communities (32 total, 18 thin omitted)

### Community 0 - "Dom"
Cohesion: 0.07
Nodes (28): 7. Views (DOM, `src/views/ui/`), Calendar, WEEKDAYS, REASON_TEXT, ActView, CheckView, CraftView, Dom (+20 more)

### Community 2 - ".count"
Cohesion: 0.08
Nodes (5): 6. EventBus messages (`MSG` in `src/core/EventBus.js`), Bot, EconomySystem, round1(), ProductionSystem

### Community 5 - "BloomLunas jam build specs"
Cohesion: 0.18
Nodes (7): 10. Open questions, 1. Scope (jam vs full game), 4. Do rules, 5. Data files, 8. 3D City View (`src/views/scene/SceneView.js`), BloomLunas jam build specs, ObjectiveSystem

### Community 6 - "runMonths.js"
Cohesion: 0.12
Nodes (10): toCsv(), loadDataNode(), args, content, quiet, root, rows, runs (+2 more)

### Community 7 - "package.json"
Cohesion: 0.09
Nodes (21): dependencies, three@0.187.0, devDependencies, vite@8.3.5, vitest@5.0.5, name, private, scripts (+13 more)

### Community 9 - "GameManager.js"
Cohesion: 0.24
Nodes (4): KNOWN, MSG, Inventory, Ledger

### Community 10 - "Phase"
Cohesion: 0.14
Nodes (7): 3. Phase flow (Scene & Flow), 9. Class catalog (JS -> Unity), ActPhase, CheckPhase, Phase, PlanPhase, RetroPhase

### Community 12 - ".h"
Cohesion: 0.09
Nodes (8): box(), ib(), jarTag(), page(), JournalView, trendIcon(), StallView, StoreView

### Community 13 - "Milestones (game jam overhaul)"
Cohesion: 0.29
Nodes (6): J1 Jam rules, logic and headless bot, J2 Jam screens (style board v3), J3 3D City View with Kenney placeholders, J4 Playtest, balance targets, polish, J5 Jam build and handoff, Milestones (game jam overhaul)

### Community 16 - "DebtSystem"
Cohesion: 0.19
Nodes (5): DebtSystem, clamp(), EffectApplier, round2(), tiersLowFirst()

### Community 17 - "InterfaceSheet"
Cohesion: 0.17
Nodes (3): InterfaceSheet, noop(), HudView

### Community 18 - "UiRoot"
Cohesion: 0.07
Nodes (12): SaveSystem, app, content, files, gm, q, save, scene (+4 more)

### Community 23 - "helpers.js"
Cohesion: 0.24
Nodes (5): vitest, files, gameInDo(), newContent(), root

### Community 25 - "ContentDB"
Cohesion: 0.18
Nodes (3): ContentDB, content, files

## Knowledge Gaps
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SceneView` connect `SceneView` to `UiRoot`, `package.json`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Are the 25 inferred relationships involving `9. Class catalog (JS -> Unity)` (e.g. with `ContentDB` and `EventBus`) actually correct?**
  _`9. Class catalog (JS -> Unity)` has 25 INFERRED edges - model-reasoned connections that need verification._
- **Should `Dom` be split into smaller, more focused modules?**
  _Cohesion score 0.07404664938911515 - nodes in this community are weakly interconnected._
- **Why does `UiRoot` connect `UiRoot` to `Dom`, `.h`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Should `.count` be split into smaller, more focused modules?**
  _Cohesion score 0.0803633822501747 - nodes in this community are weakly interconnected._
- **Why does `Dom` connect `Dom` to `GameManager.js`, `.h`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Should `runMonths.js` be split into smaller, more focused modules?**
  _Cohesion score 0.12105263157894737 - nodes in this community are weakly interconnected._