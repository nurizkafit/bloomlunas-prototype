# Graph Report - bloomlunas-prototype  (2026-11-11)

## Corpus Check
- 155 files · ~70,400 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .css 2, .csv 1)

## Summary
- 646 nodes · 1711 edges · 29 communities (12 shown, 17 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 87 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2356b7ce`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Dom
- SceneView
- .count
- 9. Class catalog (JS -> Unity)
- StoreSystem
- QuestSystem
- runMonths.js
- EconomySystem
- .constructor
- GameManager.js
- EventBus
- PlanSystem
- .h
- Milestones (game jam overhaul)
- Rng
- manifest.json
- DebtSystem
- InterfaceSheet
- UiRoot
- EventSystem
- SkillSystem
- GameState
- TimeSystem
- main.js
- NoticeSystem
- DoPhase
- ExploreSystem
- .mcp.json

## God Nodes (most connected - your core abstractions)
1. `Dom` - 46 edges
2. `UiRoot` - 28 edges
3. `Inventory` - 27 edges
4. `9. Class catalog (JS -> Unity)` - 27 edges
5. `SceneView` - 25 edges
6. `EconomySystem` - 24 edges
7. `PlaceView` - 23 edges
8. `7. Views (DOM, `src/views/ui/`)` - 23 edges
9. `GameManager` - 21 edges
10. `InterfaceSheet` - 18 edges

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

## Communities (29 total, 17 thin omitted)

### Community 0 - "Dom"
Cohesion: 0.08
Nodes (25): 7. Views (DOM, `src/views/ui/`), REASON_TEXT, CraftView, Dom, DryingView, EventCardView, ExploreView, GrindView (+17 more)

### Community 1 - "SceneView"
Cohesion: 0.06
Nodes (23): dependencies, three@0.187.0, devDependencies, vite@8.3.5, vitest@5.0.5, name, private, scripts (+15 more)

### Community 2 - ".count"
Cohesion: 0.07
Nodes (8): 6. EventBus messages (`MSG` in `src/core/EventBus.js`), Bot, ActionRunner, clamp(), tiersLowFirst(), ExploreSystem, ProductionSystem, sleep()

### Community 3 - "9. Class catalog (JS -> Unity)"
Cohesion: 0.29
Nodes (3): 9. Class catalog (JS -> Unity), ActivityLog, EffectApplier

### Community 6 - "runMonths.js"
Cohesion: 0.06
Nodes (19): toCsv(), loadDataNode(), args, content, quiet, root, rows, runs (+11 more)

### Community 9 - "GameManager.js"
Cohesion: 0.06
Nodes (20): vitest, 3. Phase flow (Scene & Flow), KNOWN, MSG, Calendar, WEEKDAYS, Inventory, ActPhase (+12 more)

### Community 12 - ".h"
Cohesion: 0.08
Nodes (10): box(), ib(), jarTag(), noop(), page(), JournalView, trendIcon(), RetroView (+2 more)

### Community 13 - "Milestones (game jam overhaul)"
Cohesion: 0.29
Nodes (6): J1 Jam rules, logic and headless bot, J2 Jam screens (style board v3), J3 3D City View with Kenney placeholders, J4 Playtest, balance targets, polish, J5 Jam build and handoff, Milestones (game jam overhaul)

### Community 15 - "manifest.json"
Cohesion: 0.40
Nodes (4): count, note, parts, scale

### Community 17 - "InterfaceSheet"
Cohesion: 0.13
Nodes (4): InterfaceSheet, h(), SheetDownloads, ZipWriter

### Community 23 - "main.js"
Cohesion: 0.08
Nodes (13): ContentDB, SaveSystem, app, content, files, gm, q, save (+5 more)

### Community 29 - "ExploreSystem"
Cohesion: 0.18
Nodes (7): 10. Open questions, 1. Scope (jam vs full game), 4. Do rules, 5. Data files, 8. 3D City View (`src/views/scene/SceneView.js`), BloomLunas jam build specs, ObjectiveSystem

## Knowledge Gaps
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Dom` connect `Dom` to `GameManager.js`, `.h`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Are the 26 inferred relationships involving `9. Class catalog (JS -> Unity)` (e.g. with `ContentDB` and `EventBus`) actually correct?**
  _`9. Class catalog (JS -> Unity)` has 26 INFERRED edges - model-reasoned connections that need verification._
- **Should `Dom` be split into smaller, more focused modules?**
  _Cohesion score 0.07757885763000852 - nodes in this community are weakly interconnected._
- **Why does `SceneView` connect `SceneView` to `main.js`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Should `SceneView` be split into smaller, more focused modules?**
  _Cohesion score 0.06377551020408163 - nodes in this community are weakly interconnected._
- **Why does `UiRoot` connect `UiRoot` to `Dom`, `.h`, `main.js`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Should `.count` be split into smaller, more focused modules?**
  _Cohesion score 0.06988120195667366 - nodes in this community are weakly interconnected._