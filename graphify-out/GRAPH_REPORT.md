# Graph Report - bloomlunas-prototype  (2026-11-11)

## Corpus Check
- 152 files · ~61,033 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 2, .css 2, .glb 1)

## Summary
- 624 nodes · 1678 edges · 32 communities (15 shown, 17 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 82 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `69ab3f95`
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
- package.json
- export.cjs
- GameManager.js
- scripts
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
- ExploreSystem
- NoticeSystem
- ContentDB
- DoPhase
- ExploreSystem
- sheet.js
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
10. `MSG` - 18 edges

## Surprising Connections (you probably didn't know these)
- `9. Class catalog (JS -> Unity)` --references--> `ContentDB`  [INFERRED]
  SPECS.md → src/core/ContentDB.js
- `9. Class catalog (JS -> Unity)` --references--> `EventBus`  [INFERRED]
  SPECS.md → src/core/EventBus.js
- `2. Architecture` --references--> `GameManager`  [INFERRED]
  SPECS.md → src/core/GameManager.js
- `9. Class catalog (JS -> Unity)` --references--> `GameManager`  [INFERRED]
  SPECS.md → src/core/GameManager.js
- `9. Class catalog (JS -> Unity)` --references--> `SaveSystem`  [INFERRED]
  SPECS.md → src/core/SaveSystem.js

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

## Communities (32 total, 17 thin omitted)

### Community 0 - "Dom"
Cohesion: 0.06
Nodes (31): 7. Views (DOM, `src/views/ui/`), KNOWN, MSG, Calendar, WEEKDAYS, Inventory, REASON_TEXT, ActView (+23 more)

### Community 2 - ".count"
Cohesion: 0.08
Nodes (6): 6. EventBus messages (`MSG` in `src/core/EventBus.js`), Bot, EconomySystem, round1(), ProductionSystem, sleep()

### Community 3 - "9. Class catalog (JS -> Unity)"
Cohesion: 0.16
Nodes (4): 9. Class catalog (JS -> Unity), ActPhase, ActivityLog, Ledger

### Community 6 - "runMonths.js"
Cohesion: 0.08
Nodes (16): vitest, GameManager, toCsv(), loadDataNode(), args, content, quiet, root (+8 more)

### Community 7 - "package.json"
Cohesion: 0.16
Nodes (11): dependencies, three@0.187.0, devDependencies, vite@8.3.5, vitest@5.0.5, name, private, type (+3 more)

### Community 8 - "export.cjs"
Cohesion: 0.12
Nodes (9): { chromium }, fs, NINE, OUT, path, SCALE, { chromium }, { chromium } (+1 more)

### Community 9 - "GameManager.js"
Cohesion: 0.18
Nodes (5): 3. Phase flow (Scene & Flow), CheckPhase, Phase, PlanPhase, RetroPhase

### Community 10 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, check, dev, export:ui, graph:query, graph:update, sheet (+3 more)

### Community 12 - ".h"
Cohesion: 0.09
Nodes (9): box(), ib(), jarTag(), noop(), page(), JournalView, trendIcon(), StallView (+1 more)

### Community 13 - "Milestones (game jam overhaul)"
Cohesion: 0.29
Nodes (6): J1 Jam rules, logic and headless bot, J2 Jam screens (style board v3), J3 3D City View with Kenney placeholders, J4 Playtest, balance targets, polish, J5 Jam build and handoff, Milestones (game jam overhaul)

### Community 16 - "DebtSystem"
Cohesion: 0.19
Nodes (5): DebtSystem, clamp(), EffectApplier, round2(), tiersLowFirst()

### Community 18 - "UiRoot"
Cohesion: 0.11
Nodes (3): RetroView, StartView, UiRoot

### Community 23 - "main.js"
Cohesion: 0.15
Nodes (10): SaveSystem, app, content, files, gm, q, save, scene (+2 more)

### Community 25 - "NoticeSystem"
Cohesion: 0.19
Nodes (3): 2. Architecture, EventBus, NoticeSystem

### Community 29 - "ExploreSystem"
Cohesion: 0.18
Nodes (7): 10. Open questions, 1. Scope (jam vs full game), 4. Do rules, 5. Data files, 8. 3D City View (`src/views/scene/SceneView.js`), BloomLunas jam build specs, ObjectiveSystem

## Knowledge Gaps
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Dom` connect `Dom` to `.h`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Are the 26 inferred relationships involving `9. Class catalog (JS -> Unity)` (e.g. with `ContentDB` and `EventBus`) actually correct?**
  _`9. Class catalog (JS -> Unity)` has 26 INFERRED edges - model-reasoned connections that need verification._
- **Should `Dom` be split into smaller, more focused modules?**
  _Cohesion score 0.06287985039738195 - nodes in this community are weakly interconnected._
- **Why does `UiRoot` connect `UiRoot` to `Dom`, `.h`, `main.js`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Should `.count` be split into smaller, more focused modules?**
  _Cohesion score 0.07662337662337662 - nodes in this community are weakly interconnected._
- **Why does `SceneView` connect `SceneView` to `package.json`, `main.js`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Should `runMonths.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08067375886524823 - nodes in this community are weakly interconnected._