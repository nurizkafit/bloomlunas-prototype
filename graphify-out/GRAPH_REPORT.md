# Graph Report - bloomlunas-prototype  (2026-11-08)

## Corpus Check
- 140 files · ~43,858 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .css 1, .glb 1)

## Summary
- 551 nodes · 1431 edges · 27 communities (10 shown, 17 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 75 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `29cbaa88`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Dom
- SceneView
- .count
- 9. Class catalog (JS -> Unity)
- StoreSystem
- GameManager
- runMonths.js
- package.json
- flow.cjs
- .count
- Phase
- BloomLunas jam build specs
- .h
- Milestones (game jam overhaul)
- QuestSystem
- GameManager.js
- DebtSystem
- PlanSystem
- UiRoot
- ActionRunner
- EventBus
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
6. `SceneView` - 23 edges
7. `7. Views (DOM, `src/views/ui/`)` - 23 edges
8. `PlaceView` - 22 edges
9. `GameManager` - 20 edges
10. `Bot` - 18 edges

## Surprising Connections (you probably didn't know these)
- `2. Architecture` --references--> `EventBus`  [INFERRED]
  SPECS.md → src/core/EventBus.js
- `2. Architecture` --references--> `GameManager`  [INFERRED]
  SPECS.md → src/core/GameManager.js
- `2. Architecture` --references--> `GameState`  [INFERRED]
  SPECS.md → src/model/GameState.js
- `2. Architecture` --references--> `Inventory`  [INFERRED]
  SPECS.md → src/model/Inventory.js
- `3. Phase flow (Scene & Flow)` --references--> `DoPhase`  [INFERRED]
  SPECS.md → src/phases/DoPhase.js

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
Cohesion: 0.07
Nodes (27): 7. Views (DOM, `src/views/ui/`), WEEKDAYS, ActView, CheckView, CraftView, Dom, DryingView, EventCardView (+19 more)

### Community 2 - ".count"
Cohesion: 0.09
Nodes (5): 6. EventBus messages (`MSG` in `src/core/EventBus.js`), Bot, ExploreSystem, ProductionSystem, travel()

### Community 3 - "9. Class catalog (JS -> Unity)"
Cohesion: 0.17
Nodes (6): 3. Phase flow (Scene & Flow), 9. Class catalog (JS -> Unity), ActPhase, CheckPhase, PlanPhase, Ledger

### Community 6 - "runMonths.js"
Cohesion: 0.05
Nodes (21): ContentDB, SaveSystem, app, content, files, gm, q, save (+13 more)

### Community 7 - "package.json"
Cohesion: 0.10
Nodes (20): dependencies, three@0.187.0, devDependencies, vite@8.3.5, vitest@5.0.5, name, private, scripts (+12 more)

### Community 11 - "BloomLunas jam build specs"
Cohesion: 0.18
Nodes (7): 10. Open questions, 1. Scope (jam vs full game), 4. Do rules, 5. Data files, 8. 3D City View (`src/views/scene/SceneView.js`), BloomLunas jam build specs, ObjectiveSystem

### Community 12 - ".h"
Cohesion: 0.09
Nodes (4): JournalView, trendIcon(), StallView, StoreView

### Community 13 - "Milestones (game jam overhaul)"
Cohesion: 0.29
Nodes (6): J1 Jam rules, logic and headless bot, J2 Jam screens (style board v3), J3 3D City View with Kenney placeholders, J4 Playtest, balance targets, polish, J5 Jam build and handoff, Milestones (game jam overhaul)

### Community 15 - "GameManager.js"
Cohesion: 0.09
Nodes (13): vitest, KNOWN, MSG, Calendar, Inventory, REASON_TEXT, ActivityLog, EventSystem (+5 more)

### Community 16 - "DebtSystem"
Cohesion: 0.19
Nodes (5): DebtSystem, clamp(), EffectApplier, round2(), tiersLowFirst()

## Knowledge Gaps
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Dom` connect `Dom` to `.h`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Are the 25 inferred relationships involving `9. Class catalog (JS -> Unity)` (e.g. with `ContentDB` and `EventBus`) actually correct?**
  _`9. Class catalog (JS -> Unity)` has 25 INFERRED edges - model-reasoned connections that need verification._
- **Should `Dom` be split into smaller, more focused modules?**
  _Cohesion score 0.07355242566510173 - nodes in this community are weakly interconnected._
- **Why does `UiRoot` connect `UiRoot` to `Dom`, `.h`, `runMonths.js`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Should `.count` be split into smaller, more focused modules?**
  _Cohesion score 0.08879492600422834 - nodes in this community are weakly interconnected._
- **Why does `SceneView` connect `SceneView` to `runMonths.js`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Should `runMonths.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05272895467160037 - nodes in this community are weakly interconnected._