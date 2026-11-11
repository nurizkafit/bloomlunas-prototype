# Graph Report - bloomlunas-prototype  (2026-11-11)

## Corpus Check
- 158 files · ~68,348 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: .css 3, (none) 2, .glb 1)

## Summary
- 673 nodes · 1731 edges · 28 communities (14 shown, 14 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 90 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dd338c68`
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
- SceneView
- ExploreSystem
- GameManager
- Rng
- EventSystem
- .h
- Milestones (game jam overhaul)
- Phase
- ActionRunner
- DebtSystem
- InterfaceSheet
- UiRoot
- SkillSystem
- GameState
- TimeSystem
- main.js
- NoticeSystem
- DoPhase
- ExploreSystem
- .mcp.json

## God Nodes (most connected - your core abstractions)
1. `Dom` - 47 edges
2. `UiRoot` - 28 edges
3. `Inventory` - 27 edges
4. `9. Class catalog (JS -> Unity)` - 27 edges
5. `SceneView` - 25 edges
6. `EconomySystem` - 24 edges
7. `PlaceView` - 23 edges
8. `7. Views (DOM, `src/views/ui/`)` - 23 edges
9. `InterfaceSheet` - 22 edges
10. `GameManager` - 21 edges

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

## Communities (28 total, 14 thin omitted)

### Community 0 - "Dom"
Cohesion: 0.07
Nodes (30): 7. Views (DOM, `src/views/ui/`), Calendar, WEEKDAYS, Inventory, REASON_TEXT, box(), page(), CraftView (+22 more)

### Community 1 - "SceneView"
Cohesion: 0.08
Nodes (23): dependencies, three@0.187.0, devDependencies, vite@8.3.5, vitest@5.0.5, name, private, scripts (+15 more)

### Community 2 - ".count"
Cohesion: 0.06
Nodes (7): 6. EventBus messages (`MSG` in `src/core/EventBus.js`), Bot, EconomySystem, round1(), PlanSystem, ProductionSystem, sleep()

### Community 3 - "9. Class catalog (JS -> Unity)"
Cohesion: 0.16
Nodes (4): 9. Class catalog (JS -> Unity), ActPhase, ActivityLog, Ledger

### Community 6 - "runMonths.js"
Cohesion: 0.06
Nodes (24): toCsv(), loadDataNode(), args, content, quiet, root, rows, runs (+16 more)

### Community 9 - "GameManager"
Cohesion: 0.13
Nodes (8): vitest, KNOWN, MSG, GameManager, files, gameInDo(), newContent(), root

### Community 12 - ".h"
Cohesion: 0.07
Nodes (9): ib(), jarTag(), noop(), ActView, CheckView, JournalView, trendIcon(), StallView (+1 more)

### Community 13 - "Milestones (game jam overhaul)"
Cohesion: 0.29
Nodes (6): J1 Jam rules, logic and headless bot, J2 Jam screens (style board v3), J3 3D City View with Kenney placeholders, J4 Playtest, balance targets, polish, J5 Jam build and handoff, Milestones (game jam overhaul)

### Community 14 - "Phase"
Cohesion: 0.18
Nodes (5): 3. Phase flow (Scene & Flow), CheckPhase, Phase, PlanPhase, RetroPhase

### Community 16 - "DebtSystem"
Cohesion: 0.19
Nodes (5): DebtSystem, clamp(), EffectApplier, round2(), tiersLowFirst()

### Community 17 - "InterfaceSheet"
Cohesion: 0.07
Nodes (7): InterfaceSheet, h(), SheetDownloads, SpriteMap, UnityAssets, ZipWriter, HudView

### Community 23 - "main.js"
Cohesion: 0.07
Nodes (15): ContentDB, SaveSystem, app, content, files, gm, q, save (+7 more)

### Community 25 - "NoticeSystem"
Cohesion: 0.19
Nodes (3): 2. Architecture, EventBus, NoticeSystem

### Community 29 - "ExploreSystem"
Cohesion: 0.18
Nodes (7): 10. Open questions, 1. Scope (jam vs full game), 4. Do rules, 5. Data files, 8. 3D City View (`src/views/scene/SceneView.js`), BloomLunas jam build specs, ObjectiveSystem

## Knowledge Gaps
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Dom` connect `Dom` to `GameManager`, `.h`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Are the 26 inferred relationships involving `9. Class catalog (JS -> Unity)` (e.g. with `ContentDB` and `EventBus`) actually correct?**
  _`9. Class catalog (JS -> Unity)` has 26 INFERRED edges - model-reasoned connections that need verification._
- **Should `Dom` be split into smaller, more focused modules?**
  _Cohesion score 0.06827309236947791 - nodes in this community are weakly interconnected._
- **Why does `SceneView` connect `SceneView` to `SceneView`, `main.js`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Should `SceneView` be split into smaller, more focused modules?**
  _Cohesion score 0.08307692307692308 - nodes in this community are weakly interconnected._
- **Why does `UiRoot` connect `UiRoot` to `Dom`, `.h`, `main.js`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Should `.count` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._