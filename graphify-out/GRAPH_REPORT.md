# Graph Report - bloomlunas-prototype  (2026-11-07)

## Corpus Check
- 134 files · ~34,884 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .css 1, .glb 1)

## Summary
- 501 nodes · 1255 edges · 25 communities (10 shown, 15 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 69 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `35118b9c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Dom
- SceneView
- PlanSystem
- Phase
- StoreSystem
- 9. Class catalog (JS -> Unity)
- runMonths.js
- package.json
- flow.cjs
- .count
- EconomySystem
- ExploreSystem
- .h
- Milestones (game jam overhaul)
- QuestSystem
- SkillSystem
- DebtSystem
- DoPhase
- UiRoot
- GameState
- TimeSystem
- Rng
- GameManager.js
- .mcp.json

## God Nodes (most connected - your core abstractions)
1. `Dom` - 36 edges
2. `9. Class catalog (JS -> Unity)` - 25 edges
3. `Inventory` - 24 edges
4. `UiRoot` - 21 edges
5. `EconomySystem` - 20 edges
6. `7. Views (DOM, `src/views/ui/`)` - 20 edges
7. `GameManager` - 19 edges
8. `PlaceView` - 18 edges
9. `Bot` - 17 edges
10. `JournalView` - 15 edges

## Surprising Connections (you probably didn't know these)
- `7. Views (DOM, `src/views/ui/`)` --references--> `JournalView`  [INFERRED]
  SPECS.md → src/views/ui/JournalView.js
- `9. Class catalog (JS -> Unity)` --references--> `GameManager`  [INFERRED]
  SPECS.md → src/core/GameManager.js
- `9. Class catalog (JS -> Unity)` --references--> `EventBus`  [INFERRED]
  SPECS.md → src/core/EventBus.js
- `9. Class catalog (JS -> Unity)` --references--> `ContentDB`  [INFERRED]
  SPECS.md → src/core/ContentDB.js
- `9. Class catalog (JS -> Unity)` --references--> `EconomySystem`  [INFERRED]
  SPECS.md → src/systems/EconomySystem.js

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

## Communities (25 total, 15 thin omitted)

### Community 0 - "Dom"
Cohesion: 0.06
Nodes (29): 7. Views (DOM, `src/views/ui/`), KNOWN, MSG, Calendar, WEEKDAYS, ActView, CheckView, CraftView (+21 more)

### Community 3 - "Phase"
Cohesion: 0.13
Nodes (6): 3. Phase flow (Scene & Flow), ActPhase, CheckPhase, Phase, PlanPhase, RetroPhase

### Community 5 - "9. Class catalog (JS -> Unity)"
Cohesion: 0.16
Nodes (5): 9. Class catalog (JS -> Unity), ActivityLog, EffectApplier, EventSystem, Ledger

### Community 6 - "runMonths.js"
Cohesion: 0.07
Nodes (18): 2. Architecture, ContentDB, EventBus, GameManager, toCsv(), loadDataNode(), args, content (+10 more)

### Community 7 - "package.json"
Cohesion: 0.09
Nodes (21): dependencies, three@0.187.0, devDependencies, vite@8.3.5, vitest@5.0.5, name, private, scripts (+13 more)

### Community 9 - ".count"
Cohesion: 0.08
Nodes (10): 10. Open questions, 1. Scope (jam vs full game), 4. Do rules, 5. Data files, 6. EventBus messages (`MSG` in `src/core/EventBus.js`), 8. 3D City View (`src/views/scene/SceneView.js`), BloomLunas jam build specs, Bot (+2 more)

### Community 12 - ".h"
Cohesion: 0.11
Nodes (4): HudView, JournalView, StallView, StoreView

### Community 13 - "Milestones (game jam overhaul)"
Cohesion: 0.29
Nodes (6): J1 Jam rules, logic and headless bot, J2 Jam screens (style board v3), J3 3D City View with Kenney placeholders, J4 Playtest, balance targets, polish, J5 Jam build and handoff, Milestones (game jam overhaul)

### Community 16 - "DebtSystem"
Cohesion: 0.22
Nodes (4): DebtSystem, clamp(), round2(), tiersLowFirst()

### Community 18 - "UiRoot"
Cohesion: 0.08
Nodes (11): SaveSystem, app, content, files, gm, q, save, scene (+3 more)

## Knowledge Gaps
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Dom` connect `Dom` to `.h`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Are the 24 inferred relationships involving `9. Class catalog (JS -> Unity)` (e.g. with `ContentDB` and `EventBus`) actually correct?**
  _`9. Class catalog (JS -> Unity)` has 24 INFERRED edges - model-reasoned connections that need verification._
- **Should `Dom` be split into smaller, more focused modules?**
  _Cohesion score 0.06296296296296296 - nodes in this community are weakly interconnected._
- **Why does `9. Class catalog (JS -> Unity)` connect `9. Class catalog (JS -> Unity)` to `PlanSystem`, `Phase`, `StoreSystem`, `runMonths.js`, `.count`, `EconomySystem`, `ExploreSystem`, `QuestSystem`, `SkillSystem`, `DebtSystem`, `DoPhase`, `UiRoot`, `GameState`, `TimeSystem`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Should `Phase` be split into smaller, more focused modules?**
  _Cohesion score 0.13043478260869565 - nodes in this community are weakly interconnected._
- **Why does `UiRoot` connect `UiRoot` to `Dom`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Should `runMonths.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06636500754147813 - nodes in this community are weakly interconnected._