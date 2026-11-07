# Graph Report - bloomlunas-prototype  (2026-11-07)

## Corpus Check
- 165 files · ~54,866 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .css 4, (none) 2, .glb 1)

## Summary
- 678 nodes · 1442 edges · 30 communities (15 shown, 15 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 100 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b17ab6ad`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- GameManager.js
- TownView
- PlannerBookView
- M0 Project skeleton
- ActionRunner
- EventSystem
- runMonths.js
- package.json
- ref_playwright
- Bot
- EconomySystem
- ProductionSystem
- StationView
- PlanValidator
- ActionMenuView
- actions/package.json
- DebtSystem
- Wallet
- main.js
- Calendar
- .constructor
- TimeSystem
- Rng
- Inventory
- WeekPlan
- Ledger
- EffectApplier
- .mcp.json

## God Nodes (most connected - your core abstractions)
1. `PlannerBookView` - 41 edges
2. `ActionRunner` - 40 edges
3. `MSG` - 35 edges
4. `StationView` - 28 edges
5. `TownView` - 24 edges
6. `Bot` - 23 edges
7. `ic()` - 23 edges
8. `EconomySystem` - 22 edges
9. `Phase` - 20 edges
10. `M1 Logic core, headless month` - 20 edges

## Surprising Connections (you probably didn't know these)
- `11. Town scene and asset slots` --references--> `AssetSlot`  [INFERRED]
  SPECS.md → src/views/town/AssetSlot.js
- `M0 Project skeleton` --references--> `EventBus`  [INFERRED]
  MILESTONES.md → src/core/EventBus.js
- `13. Extension points for full scope` --references--> `EventBus`  [INFERRED]
  SPECS.md → src/core/EventBus.js
- `M1 Logic core, headless month` --references--> `Rng`  [INFERRED]
  MILESTONES.md → src/core/Rng.js
- `M2 Plan phase (Planner Book port)` --references--> `GameState`  [INFERRED]
  MILESTONES.md → src/model/GameState.js

## Import Cycles
- None detected.

## Communities (30 total, 15 thin omitted)

### Community 0 - "GameManager.js"
Cohesion: 0.07
Nodes (19): KNOWN, MSG, SkillBook, DoPhase, EndingPhase, Phase, DAYS, BUILDING_CATS (+11 more)

### Community 1 - "TownView"
Cohesion: 0.08
Nodes (12): M3 Do phase (town, avatar, actions), three, AssetSlot, buildGreybox(), mat(), mesh(), put(), STATE_TINT (+4 more)

### Community 2 - "PlannerBookView"
Cohesion: 0.13
Nodes (4): hm(), colorFor(), esc(), PlannerBookView

### Community 3 - "M0 Project skeleton"
Cohesion: 0.08
Nodes (7): M0 Project skeleton, ContentDB, PhaseMachine, hasInterior(), ActPhase, PlanPhase, EndingChecker

### Community 5 - "EventSystem"
Cohesion: 0.10
Nodes (7): M4 Events and Check, CheckPhase, round2(), EventSystem, pickWeighted(), EventCardView, RecapView

### Community 6 - "runMonths.js"
Cohesion: 0.08
Nodes (20): vitest, GameManager, loadDataNode(), args, content, months, quiet, results (+12 more)

### Community 7 - "package.json"
Cohesion: 0.10
Nodes (19): dependencies, three@0.187.0, devDependencies, vite@8.3.5, vitest@5.0.5, name, private, scripts (+11 more)

### Community 8 - "ref_playwright"
Cohesion: 0.09
Nodes (10): { chromium }, { chromium }, { chromium }, fs, { chromium }, { chromium }, { chromium }, { chromium } (+2 more)

### Community 10 - "EconomySystem"
Cohesion: 0.08
Nodes (17): 10. Planner Book port, 11. Town scene and asset slots, 12. Class catalog (JS → Unity), 14. Open questions, 15. Scene & Flow (user, 7 Nov 2026), 1. Purpose and scope, 2. Architecture, 3. Phase machine (doc:core-gameplay/core-loop and its pages Plan, Do, Check, Act) (+9 more)

### Community 12 - "StationView"
Cohesion: 0.14
Nodes (8): cap(), describe(), HudView, ic(), itemIcon(), esc(), hm(), StationView

### Community 13 - "PlanValidator"
Cohesion: 0.14
Nodes (8): M2 Plan phase (Planner Book port), M6 Balance testbed and CSV export, M7 Full-month playtest and handoff, Milestones, Scene & Flow rollout (user request, 7 Nov 2026), Testbed, PlanValidator, DevOverlay

### Community 14 - "ActionMenuView"
Cohesion: 0.13
Nodes (4): openPlace(), ActionMenuView, StockView, TownMapView

### Community 15 - "actions/package.json"
Cohesion: 0.15
Nodes (12): energyKey, _flow, id, kind, name, _placeholder, source, timeMin (+4 more)

### Community 18 - "main.js"
Cohesion: 0.05
Nodes (27): M5 Act, endings, save, SaveSystem, app, content, craft, files, fresh, gm (+19 more)

### Community 28 - "Ledger"
Cohesion: 0.17
Nodes (6): M1 Logic core, headless month, 13. Extension points for full scope, DebtAccount, GameState, Ledger, Relationships

## Knowledge Gaps
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ActionRunner` connect `ActionRunner` to `GameManager.js`, `Ledger`, `.constructor`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Should `GameManager.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06846635367762129 - nodes in this community are weakly interconnected._
- **Why does `PlannerBookView` connect `PlannerBookView` to `GameManager.js`, `main.js`, `StationView`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Should `TownView` be split into smaller, more focused modules?**
  _Cohesion score 0.07834101382488479 - nodes in this community are weakly interconnected._
- **Why does `M1 Logic core, headless month` connect `Ledger` to `GameManager.js`, `M0 Project skeleton`, `ActionRunner`, `runMonths.js`, `Bot`, `EconomySystem`, `ProductionSystem`, `PlanValidator`, `DebtSystem`, `Wallet`, `TimeSystem`, `Rng`, `Inventory`, `WeekPlan`, `EffectApplier`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Should `PlannerBookView` be split into smaller, more focused modules?**
  _Cohesion score 0.13205128205128205 - nodes in this community are weakly interconnected._
- **Should `M0 Project skeleton` be split into smaller, more focused modules?**
  _Cohesion score 0.08172043010752689 - nodes in this community are weakly interconnected._