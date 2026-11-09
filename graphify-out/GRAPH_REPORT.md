# Graph Report - bloomlunas-prototype  (2026-11-09)

## Corpus Check
- 148 files · ~57,935 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 2, .css 2, .glb 1)

## Summary
- 600 nodes · 1630 edges · 33 communities (12 shown, 21 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 78 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `18f66d59`
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
- 9. Class catalog (JS -> Unity)
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
- main.js
- DoPhase
- ContentDB
- scripts
- QuestSystem
- ExploreSystem
- ObjectiveSystem
- .mcp.json
- sheet.js

## God Nodes (most connected - your core abstractions)
1. `Dom` - 46 edges
2. `UiRoot` - 28 edges
3. `9. Class catalog (JS -> Unity)` - 26 edges
4. `Inventory` - 26 edges
5. `SceneView` - 25 edges
6. `EconomySystem` - 24 edges
7. `PlaceView` - 23 edges
8. `7. Views (DOM, `src/views/ui/`)` - 23 edges
9. `GameManager` - 21 edges
10. `Bot` - 18 edges

## Surprising Connections (you probably didn't know these)
- `9. Class catalog (JS -> Unity)` --references--> `EventBus`  [INFERRED]
  SPECS.md → src/core/EventBus.js
- `2. Architecture` --references--> `GameManager`  [INFERRED]
  SPECS.md → src/core/GameManager.js
- `9. Class catalog (JS -> Unity)` --references--> `GameManager`  [INFERRED]
  SPECS.md → src/core/GameManager.js
- `2. Architecture` --references--> `GameState`  [INFERRED]
  SPECS.md → src/model/GameState.js
- `9. Class catalog (JS -> Unity)` --references--> `GameState`  [INFERRED]
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

## Communities (33 total, 21 thin omitted)

### Community 0 - "Dom"
Cohesion: 0.06
Nodes (33): 7. Views (DOM, `src/views/ui/`), KNOWN, MSG, Calendar, WEEKDAYS, Inventory, REASON_TEXT, ActView (+25 more)

### Community 2 - ".count"
Cohesion: 0.08
Nodes (5): 6. EventBus messages (`MSG` in `src/core/EventBus.js`), Bot, EconomySystem, round1(), ProductionSystem

### Community 5 - "BloomLunas jam build specs"
Cohesion: 0.20
Nodes (7): 10. Open questions, 1. Scope (jam vs full game), 2. Architecture, 4. Do rules, 8. 3D City View (`src/views/scene/SceneView.js`), BloomLunas jam build specs, EventBus

### Community 6 - "runMonths.js"
Cohesion: 0.08
Nodes (17): vitest@5.0.5, vitest, GameManager, toCsv(), loadDataNode(), args, content, quiet (+9 more)

### Community 7 - "package.json"
Cohesion: 0.18
Nodes (10): dependencies, three@0.187.0, devDependencies, vite@8.3.5, name, private, type, version (+2 more)

### Community 9 - "9. Class catalog (JS -> Unity)"
Cohesion: 0.18
Nodes (6): 3. Phase flow (Scene & Flow), 9. Class catalog (JS -> Unity), CheckPhase, PlanPhase, RetroPhase, Ledger

### Community 12 - ".h"
Cohesion: 0.09
Nodes (7): box(), ib(), jarTag(), page(), JournalView, trendIcon(), StoreView

### Community 13 - "Milestones (game jam overhaul)"
Cohesion: 0.29
Nodes (6): J1 Jam rules, logic and headless bot, J2 Jam screens (style board v3), J3 3D City View with Kenney placeholders, J4 Playtest, balance targets, polish, J5 Jam build and handoff, Milestones (game jam overhaul)

### Community 16 - "DebtSystem"
Cohesion: 0.19
Nodes (5): DebtSystem, clamp(), EffectApplier, round2(), tiersLowFirst()

### Community 17 - "InterfaceSheet"
Cohesion: 0.16
Nodes (3): InterfaceSheet, noop(), HudView

### Community 23 - "main.js"
Cohesion: 0.15
Nodes (10): SaveSystem, app, content, files, gm, q, save, scene (+2 more)

### Community 26 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, check, dev, graph:query, graph:update, sheet, sim (+2 more)

## Knowledge Gaps
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Dom` connect `Dom` to `.h`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Are the 25 inferred relationships involving `9. Class catalog (JS -> Unity)` (e.g. with `ContentDB` and `EventBus`) actually correct?**
  _`9. Class catalog (JS -> Unity)` has 25 INFERRED edges - model-reasoned connections that need verification._
- **Should `Dom` be split into smaller, more focused modules?**
  _Cohesion score 0.06013745704467354 - nodes in this community are weakly interconnected._
- **Why does `UiRoot` connect `UiRoot` to `Dom`, `.h`, `main.js`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Should `.count` be split into smaller, more focused modules?**
  _Cohesion score 0.07878787878787878 - nodes in this community are weakly interconnected._
- **Why does `SceneView` connect `SceneView` to `package.json`, `main.js`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Should `runMonths.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0821256038647343 - nodes in this community are weakly interconnected._