# Graph Report - bloomlunas-prototype  (2026-11-10)

## Corpus Check
- 151 files · ~59,951 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 2, .css 2, .glb 1)

## Summary
- 615 nodes · 1662 edges · 29 communities (13 shown, 16 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 77 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `73b02329`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Dom
- SceneView
- .count
- EconomySystem
- StoreSystem
- GameManager
- runMonths.js
- package.json
- flow.cjs
- 9. Class catalog (JS -> Unity)
- GameManager.js
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
- helpers.js
- NoticeSystem
- ExploreSystem
- .mcp.json

## God Nodes (most connected - your core abstractions)
1. `Dom` - 46 edges
2. `UiRoot` - 28 edges
3. `9. Class catalog (JS -> Unity)` - 27 edges
4. `Inventory` - 27 edges
5. `SceneView` - 25 edges
6. `EconomySystem` - 24 edges
7. `7. Views (DOM, `src/views/ui/`)` - 23 edges
8. `PlaceView` - 23 edges
9. `GameManager` - 21 edges
10. `MSG` - 18 edges

## Surprising Connections (you probably didn't know these)
- `9. Class catalog (JS -> Unity)` --references--> `EventBus`  [INFERRED]
  SPECS.md → src/core/EventBus.js
- `9. Class catalog (JS -> Unity)` --references--> `GameManager`  [INFERRED]
  SPECS.md → src/core/GameManager.js
- `2. Architecture` --references--> `GameState`  [INFERRED]
  SPECS.md → src/model/GameState.js
- `9. Class catalog (JS -> Unity)` --references--> `GameState`  [INFERRED]
  SPECS.md → src/model/GameState.js
- `2. Architecture` --references--> `ActionRunner`  [INFERRED]
  SPECS.md → src/systems/ActionRunner.js

## Import Cycles
- 2-file cycle: `src/views/ui/GrindView.js -> src/views/ui/PlaceView.js -> src/views/ui/GrindView.js`
- 2-file cycle: `src/views/ui/PlaceView.js -> src/views/ui/ReceptionView.js -> src/views/ui/PlaceView.js`
- 2-file cycle: `src/views/ui/PlaceView.js -> src/views/ui/StallView.js -> src/views/ui/PlaceView.js`
- 2-file cycle: `src/views/ui/ExploreView.js -> src/views/ui/PlaceView.js -> src/views/ui/ExploreView.js`
- 2-file cycle: `src/views/ui/CraftView.js -> src/views/ui/PlaceView.js -> src/views/ui/CraftView.js`
- 2-file cycle: `src/views/ui/PlaceView.js -> src/views/ui/RestView.js -> src/views/ui/PlaceView.js`
- 2-file cycle: `src/views/ui/DryingView.js -> src/views/ui/PlaceView.js -> src/views/ui/DryingView.js`
- 2-file cycle: `src/views/ui/PlaceView.js -> src/views/ui/QuestBoardView.js -> src/views/ui/PlaceView.js`
- 2-file cycle: `src/views/ui/PlaceView.js -> src/views/ui/StoreView.js -> src/views/ui/PlaceView.js`
- 3-file cycle: `src/views/ui/PlaceView.js -> src/views/ui/ReceptionView.js -> src/views/ui/StallView.js -> src/views/ui/PlaceView.js`
- 3-file cycle: `src/views/ui/PlaceView.js -> src/views/ui/QuestBoardView.js -> src/views/ui/StallView.js -> src/views/ui/PlaceView.js`

## Communities (29 total, 16 thin omitted)

### Community 0 - "Dom"
Cohesion: 0.05
Nodes (33): 7. Views (DOM, `src/views/ui/`), KNOWN, MSG, Calendar, WEEKDAYS, REASON_TEXT, ActView, CheckView (+25 more)

### Community 2 - ".count"
Cohesion: 0.09
Nodes (3): Bot, ProductionSystem, QuestSystem

### Community 5 - "GameManager"
Cohesion: 0.24
Nodes (3): 2. Architecture, EventBus, GameManager

### Community 6 - "runMonths.js"
Cohesion: 0.11
Nodes (10): toCsv(), loadDataNode(), args, content, quiet, root, rows, runs (+2 more)

### Community 7 - "package.json"
Cohesion: 0.09
Nodes (21): dependencies, three@0.187.0, devDependencies, vite@8.3.5, vitest@5.0.5, name, private, scripts (+13 more)

### Community 8 - "flow.cjs"
Cohesion: 0.25
Nodes (3): { chromium }, { chromium }, { chromium }

### Community 9 - "9. Class catalog (JS -> Unity)"
Cohesion: 0.09
Nodes (10): 3. Phase flow (Scene & Flow), 9. Class catalog (JS -> Unity), ActPhase, CheckPhase, DoPhase, Phase, PlanPhase, RetroPhase (+2 more)

### Community 12 - ".h"
Cohesion: 0.09
Nodes (7): box(), ib(), jarTag(), page(), JournalView, trendIcon(), StallView

### Community 13 - "Milestones (game jam overhaul)"
Cohesion: 0.29
Nodes (6): J1 Jam rules, logic and headless bot, J2 Jam screens (style board v3), J3 3D City View with Kenney placeholders, J4 Playtest, balance targets, polish, J5 Jam build and handoff, Milestones (game jam overhaul)

### Community 16 - "DebtSystem"
Cohesion: 0.19
Nodes (5): DebtSystem, clamp(), EffectApplier, round2(), tiersLowFirst()

### Community 23 - "main.js"
Cohesion: 0.08
Nodes (13): ContentDB, SaveSystem, app, content, files, gm, q, save (+5 more)

### Community 24 - "helpers.js"
Cohesion: 0.26
Nodes (5): vitest, files, gameInDo(), newContent(), root

### Community 29 - "ExploreSystem"
Cohesion: 0.11
Nodes (9): 10. Open questions, 1. Scope (jam vs full game), 4. Do rules, 5. Data files, 6. EventBus messages (`MSG` in `src/core/EventBus.js`), 8. 3D City View (`src/views/scene/SceneView.js`), BloomLunas jam build specs, ExploreSystem (+1 more)

## Knowledge Gaps
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Dom` connect `Dom` to `.h`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Are the 26 inferred relationships involving `9. Class catalog (JS -> Unity)` (e.g. with `ContentDB` and `EventBus`) actually correct?**
  _`9. Class catalog (JS -> Unity)` has 26 INFERRED edges - model-reasoned connections that need verification._
- **Should `Dom` be split into smaller, more focused modules?**
  _Cohesion score 0.0547022932884494 - nodes in this community are weakly interconnected._
- **Why does `UiRoot` connect `UiRoot` to `Dom`, `.h`, `main.js`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Should `.count` be split into smaller, more focused modules?**
  _Cohesion score 0.08970099667774087 - nodes in this community are weakly interconnected._
- **Why does `SceneView` connect `SceneView` to `package.json`, `main.js`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Should `runMonths.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11428571428571428 - nodes in this community are weakly interconnected._