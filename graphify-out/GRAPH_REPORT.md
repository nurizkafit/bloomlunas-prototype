# Graph Report - bloomlunas-prototype  (2026-11-07)

## Corpus Check
- 162 files · ~51,246 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .css 4, (none) 2, .glb 1)

## Summary
- 662 nodes · 1395 edges · 38 communities (13 shown, 25 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 99 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b1e37a41`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- GameManager.js
- TownView
- PlannerBookView
- ActPhase
- ActionRunner
- EventSystem
- runMonths.js
- package.json
- ref_playwright
- Bot
- BloomLunas prototype specs
- ProductionSystem
- Relationships
- PlanValidator
- StationView
- actions/package.json
- EconomySystem
- QualityCalculator
- main.js
- Calendar
- CraftView
- .constructor
- TimeSystem
- Rng
- StockView
- Inventory
- WeekPlan
- Ledger
- SkillBook
- EffectApplier
- .mcp.json
- .constructor
- SaveSystem
- M5 Act, endings, save
- MonthEndView
- hasInterior

## God Nodes (most connected - your core abstractions)
1. `PlannerBookView` - 41 edges
2. `ActionRunner` - 38 edges
3. `MSG` - 35 edges
4. `TownView` - 24 edges
5. `Bot` - 23 edges
6. `StationView` - 23 edges
7. `ic()` - 21 edges
8. `Phase` - 20 edges
9. `M1 Logic core, headless month` - 20 edges
10. `EconomySystem` - 17 edges

## Surprising Connections (you probably didn't know these)
- `11. Town scene and asset slots` --references--> `AssetSlot`  [INFERRED]
  SPECS.md → src/views/town/AssetSlot.js
- `M0 Project skeleton` --references--> `ContentDB`  [INFERRED]
  MILESTONES.md → src/core/ContentDB.js
- `M0 Project skeleton` --references--> `EventBus`  [INFERRED]
  MILESTONES.md → src/core/EventBus.js
- `M0 Project skeleton` --references--> `PhaseMachine`  [INFERRED]
  MILESTONES.md → src/core/PhaseMachine.js
- `M1 Logic core, headless month` --references--> `Rng`  [INFERRED]
  MILESTONES.md → src/core/Rng.js

## Import Cycles
- None detected.

## Communities (38 total, 25 thin omitted)

### Community 0 - "GameManager.js"
Cohesion: 0.07
Nodes (14): M0 Project skeleton, KNOWN, MSG, GameState, CheckPhase, round2(), DoPhase, EndingPhase (+6 more)

### Community 1 - "TownView"
Cohesion: 0.08
Nodes (12): M3 Do phase (town, avatar, actions), three, AssetSlot, buildGreybox(), mat(), mesh(), put(), STATE_TINT (+4 more)

### Community 2 - "PlannerBookView"
Cohesion: 0.07
Nodes (20): DAYS, hm(), BUILDING_CATS, cap(), describe(), GOALS, HudView, COLOR_BY_ACTIVITY (+12 more)

### Community 5 - "EventSystem"
Cohesion: 0.14
Nodes (5): M4 Events and Check, EventSystem, pickWeighted(), EventCardView, RecapView

### Community 6 - "runMonths.js"
Cohesion: 0.09
Nodes (20): vitest, ContentDB, GameManager, loadDataNode(), args, content, months, quiet (+12 more)

### Community 7 - "package.json"
Cohesion: 0.10
Nodes (19): dependencies, three@0.187.0, devDependencies, vite@8.3.5, vitest@5.0.5, name, private, scripts (+11 more)

### Community 8 - "ref_playwright"
Cohesion: 0.09
Nodes (10): { chromium }, { chromium }, { chromium }, fs, { chromium }, { chromium }, { chromium }, { chromium } (+2 more)

### Community 10 - "BloomLunas prototype specs"
Cohesion: 0.08
Nodes (18): 10. Planner Book port, 11. Town scene and asset slots, 12. Class catalog (JS → Unity), 14. Open questions, 15. Scene & Flow (user, 7 Nov 2026), 1. Purpose and scope, 2. Architecture, 3. Phase machine (doc:core-gameplay/core-loop and its pages Plan, Do, Check, Act) (+10 more)

### Community 13 - "PlanValidator"
Cohesion: 0.14
Nodes (8): M2 Plan phase (Planner Book port), M6 Balance testbed and CSV export, M7 Full-month playtest and handoff, Milestones, Scene & Flow rollout (user request, 7 Nov 2026), Testbed, PlanValidator, DevOverlay

### Community 14 - "StationView"
Cohesion: 0.13
Nodes (4): openPlace(), ActionMenuView, esc(), StationView

### Community 15 - "actions/package.json"
Cohesion: 0.15
Nodes (12): energyKey, _flow, id, kind, name, _placeholder, source, timeMin (+4 more)

### Community 18 - "main.js"
Cohesion: 0.09
Nodes (19): app, content, craft, files, fresh, gm, menu, monthEnd (+11 more)

### Community 28 - "Ledger"
Cohesion: 0.17
Nodes (4): M1 Logic core, headless month, DebtAccount, Ledger, Wallet

## Knowledge Gaps
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ActionRunner` connect `ActionRunner` to `GameManager.js`, `.constructor`, `Ledger`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Should `GameManager.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06512890094979647 - nodes in this community are weakly interconnected._
- **Why does `PlannerBookView` connect `PlannerBookView` to `main.js`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Should `TownView` be split into smaller, more focused modules?**
  _Cohesion score 0.07834101382488479 - nodes in this community are weakly interconnected._
- **Why does `M1 Logic core, headless month` connect `Ledger` to `GameManager.js`, `ActionRunner`, `runMonths.js`, `Bot`, `ProductionSystem`, `Relationships`, `PlanValidator`, `EconomySystem`, `QualityCalculator`, `TimeSystem`, `Rng`, `Inventory`, `WeekPlan`, `SkillBook`, `EffectApplier`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Should `PlannerBookView` be split into smaller, more focused modules?**
  _Cohesion score 0.07323943661971831 - nodes in this community are weakly interconnected._
- **Should `ActionRunner` be split into smaller, more focused modules?**
  _Cohesion score 0.09365079365079365 - nodes in this community are weakly interconnected._