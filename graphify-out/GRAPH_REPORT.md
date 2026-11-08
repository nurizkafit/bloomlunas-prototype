# Graph Report - bloomlunas-prototype  (2026-11-08)

## Corpus Check
- 143 files · ~52,323 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 2, .css 2, .glb 1)

## Summary
- 581 nodes · 1545 edges · 31 communities (14 shown, 17 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 76 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6c904ea1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Dom
- SceneView
- .count
- 9. Class catalog (JS -> Unity)
- StoreSystem
- BloomLunas jam build specs
- runMonths.js
- package.json
- flow.cjs
- .count
- Phase
- InterfaceSheet
- .h
- Milestones (game jam overhaul)
- main.js
- QuestSystem
- DebtSystem
- scripts
- UiRoot
- PlanSystem
- SkillSystem
- GameState
- TimeSystem
- Rng
- DoPhase
- ContentDB
- sheet.js
- EventSystem
- SceneView.js
- .mcp.json

## God Nodes (most connected - your core abstractions)
1. `Dom` - 43 edges
2. `Inventory` - 26 edges
3. `9. Class catalog (JS -> Unity)` - 26 edges
4. `UiRoot` - 25 edges
5. `EconomySystem` - 24 edges
6. `SceneView` - 23 edges
7. `PlaceView` - 23 edges
8. `7. Views (DOM, `src/views/ui/`)` - 22 edges
9. `GameManager` - 20 edges
10. `Bot` - 18 edges

## Surprising Connections (you probably didn't know these)
- `9. Class catalog (JS -> Unity)` --references--> `ContentDB`  [INFERRED]
  SPECS.md → src/core/ContentDB.js
- `9. Class catalog (JS -> Unity)` --references--> `EventBus`  [INFERRED]
  SPECS.md → src/core/EventBus.js
- `9. Class catalog (JS -> Unity)` --references--> `GameManager`  [INFERRED]
  SPECS.md → src/core/GameManager.js
- `9. Class catalog (JS -> Unity)` --references--> `SaveSystem`  [INFERRED]
  SPECS.md → src/core/SaveSystem.js
- `2. Architecture` --references--> `GameState`  [INFERRED]
  SPECS.md → src/model/GameState.js

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

## Communities (31 total, 17 thin omitted)

### Community 0 - "Dom"
Cohesion: 0.06
Nodes (32): 7. Views (DOM, `src/views/ui/`), KNOWN, MSG, Calendar, WEEKDAYS, Inventory, REASON_TEXT, bookJar() (+24 more)

### Community 2 - ".count"
Cohesion: 0.08
Nodes (6): 6. EventBus messages (`MSG` in `src/core/EventBus.js`), Bot, ActionRunner, ExploreSystem, ProductionSystem, travel()

### Community 3 - "9. Class catalog (JS -> Unity)"
Cohesion: 0.16
Nodes (5): 9. Class catalog (JS -> Unity), RetroPhase, ActivityLog, EffectApplier, Ledger

### Community 5 - "BloomLunas jam build specs"
Cohesion: 0.18
Nodes (7): 10. Open questions, 1. Scope (jam vs full game), 4. Do rules, 5. Data files, 8. 3D City View (`src/views/scene/SceneView.js`), BloomLunas jam build specs, ObjectiveSystem

### Community 6 - "runMonths.js"
Cohesion: 0.08
Nodes (17): 2. Architecture, EventBus, GameManager, toCsv(), loadDataNode(), args, content, quiet (+9 more)

### Community 7 - "package.json"
Cohesion: 0.22
Nodes (9): devDependencies, vite@8.3.5, vitest@5.0.5, name, private, type, version, vite (+1 more)

### Community 10 - "Phase"
Cohesion: 0.17
Nodes (5): 3. Phase flow (Scene & Flow), ActPhase, CheckPhase, Phase, PlanPhase

### Community 11 - "InterfaceSheet"
Cohesion: 0.18
Nodes (3): InterfaceSheet, noop(), HudView

### Community 12 - ".h"
Cohesion: 0.09
Nodes (8): box(), ib(), jarTag(), page(), JournalView, trendIcon(), StallView, StoreView

### Community 13 - "Milestones (game jam overhaul)"
Cohesion: 0.29
Nodes (6): J1 Jam rules, logic and headless bot, J2 Jam screens (style board v3), J3 3D City View with Kenney placeholders, J4 Playtest, balance targets, polish, J5 Jam build and handoff, Milestones (game jam overhaul)

### Community 14 - "main.js"
Cohesion: 0.15
Nodes (10): SaveSystem, app, content, files, gm, q, save, scene (+2 more)

### Community 16 - "DebtSystem"
Cohesion: 0.22
Nodes (4): DebtSystem, clamp(), round2(), tiersLowFirst()

### Community 17 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, check, dev, graph:query, graph:update, sheet, sim (+2 more)

### Community 29 - "SceneView.js"
Cohesion: 0.50
Nodes (3): dependencies, three@0.187.0, three

## Knowledge Gaps
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Dom` connect `Dom` to `.h`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Are the 25 inferred relationships involving `9. Class catalog (JS -> Unity)` (e.g. with `ContentDB` and `EventBus`) actually correct?**
  _`9. Class catalog (JS -> Unity)` has 25 INFERRED edges - model-reasoned connections that need verification._
- **Should `Dom` be split into smaller, more focused modules?**
  _Cohesion score 0.06163401815575729 - nodes in this community are weakly interconnected._
- **Why does `SceneView` connect `SceneView` to `SceneView.js`, `main.js`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Should `.count` be split into smaller, more focused modules?**
  _Cohesion score 0.07755102040816327 - nodes in this community are weakly interconnected._
- **Why does `UiRoot` connect `UiRoot` to `Dom`, `.h`, `main.js`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Should `runMonths.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0782608695652174 - nodes in this community are weakly interconnected._