# Graph Report - bloomlunas-prototype  (2026-11-02)

## Corpus Check
- 158 files · ~44,887 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: .css 3, (none) 2, .glb 1)

## Summary
- 594 nodes · 1234 edges · 33 communities (12 shown, 21 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 85 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ca32bf81`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- GameManager.js
- TownView
- PlannerBookView
- Phase
- ActionRunner
- EventSystem
- runMonths.js
- package.json
- ref_playwright
- Bot
- BloomLunas prototype specs
- ProductionSystem
- GameState.js
- PlanValidator
- ActionMenuView
- actions/package.json
- EconomySystem
- QualityCalculator
- M1 Logic core, headless month
- Calendar
- CraftView
- .constructor
- TimeSystem
- Rng
- DebtSystem
- Inventory
- WeekPlan
- Ledger
- SkillBook
- EffectApplier
- .mcp.json

## God Nodes (most connected - your core abstractions)
1. `PlannerBookView` - 39 edges
2. `ActionRunner` - 35 edges
3. `MSG` - 33 edges
4. `TownView` - 24 edges
5. `Bot` - 23 edges
6. `Phase` - 20 edges
7. `M1 Logic core, headless month` - 20 edges
8. `ProductionSystem` - 17 edges
9. `InteriorView` - 17 edges
10. `PlanValidator` - 16 edges

## Surprising Connections (you probably didn't know these)
- `11. Town scene and asset slots` --references--> `AssetSlot`  [INFERRED]
  SPECS.md → src/views/town/AssetSlot.js
- `M0 Project skeleton` --references--> `ContentDB`  [INFERRED]
  MILESTONES.md → src/core/ContentDB.js
- `M0 Project skeleton` --references--> `EventBus`  [INFERRED]
  MILESTONES.md → src/core/EventBus.js
- `13. Extension points for full scope` --references--> `EventBus`  [INFERRED]
  SPECS.md → src/core/EventBus.js
- `M1 Logic core, headless month` --references--> `Rng`  [INFERRED]
  MILESTONES.md → src/core/Rng.js

## Import Cycles
- None detected.

## Communities (33 total, 21 thin omitted)

### Community 0 - "GameManager.js"
Cohesion: 0.06
Nodes (31): M7 Full-month playtest and handoff, vitest, KNOWN, MSG, GameManager, SaveSystem, app, content (+23 more)

### Community 1 - "TownView"
Cohesion: 0.08
Nodes (12): M3 Do phase (town, avatar, actions), three, AssetSlot, buildGreybox(), mat(), mesh(), put(), STATE_TINT (+4 more)

### Community 2 - "PlannerBookView"
Cohesion: 0.09
Nodes (16): hm(), cap(), describe(), HudView, COLOR_BY_ACTIVITY, colorFor(), ic(), ICON_BY_ACTIVITY (+8 more)

### Community 3 - "Phase"
Cohesion: 0.06
Nodes (8): M0 Project skeleton, PhaseMachine, ActPhase, DoPhase, EndingPhase, Phase, PlanPhase, EndingChecker

### Community 5 - "EventSystem"
Cohesion: 0.10
Nodes (7): M4 Events and Check, CheckPhase, round2(), EventSystem, pickWeighted(), EventCardView, RecapView

### Community 6 - "runMonths.js"
Cohesion: 0.12
Nodes (11): ContentDB, loadDataNode(), args, content, months, quiet, results, root (+3 more)

### Community 7 - "package.json"
Cohesion: 0.10
Nodes (19): dependencies, three@0.187.0, devDependencies, vite@8.3.5, vitest@5.0.5, name, private, scripts (+11 more)

### Community 8 - "ref_playwright"
Cohesion: 0.10
Nodes (9): { chromium }, { chromium }, { chromium }, fs, { chromium }, { chromium }, { chromium }, { chromium } (+1 more)

### Community 10 - "BloomLunas prototype specs"
Cohesion: 0.13
Nodes (14): 10. Planner Book port, 11. Town scene and asset slots, 12. Class catalog (JS → Unity), 14. Open questions, 1. Purpose and scope, 2. Architecture, 3. Phase machine (docs:gdd/06-core-loop.md, docs:pages/loop/), 4. Activities and actions (+6 more)

### Community 12 - "GameState.js"
Cohesion: 0.18
Nodes (3): DebtAccount, Relationships, Wallet

### Community 15 - "actions/package.json"
Cohesion: 0.17
Nodes (11): energyKey, id, kind, name, _placeholder, source, timeMin, xp (+3 more)

### Community 18 - "M1 Logic core, headless month"
Cohesion: 0.24
Nodes (8): M1 Logic core, headless month, M2 Plan phase (Planner Book port), M5 Act, endings, save, M6 Balance testbed and CSV export, Milestones, 13. Extension points for full scope, GameState, Testbed

## Knowledge Gaps
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ActionRunner` connect `ActionRunner` to `GameManager.js`, `M1 Logic core, headless month`, `.constructor`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Should `GameManager.js` be split into smaller, more focused modules?**
  _Cohesion score 0.060534822215692036 - nodes in this community are weakly interconnected._
- **Why does `PlannerBookView` connect `PlannerBookView` to `GameManager.js`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Should `TownView` be split into smaller, more focused modules?**
  _Cohesion score 0.07834101382488479 - nodes in this community are weakly interconnected._
- **Why does `M1 Logic core, headless month` connect `M1 Logic core, headless month` to `Phase`, `ActionRunner`, `runMonths.js`, `Bot`, `ProductionSystem`, `GameState.js`, `EconomySystem`, `QualityCalculator`, `TimeSystem`, `Rng`, `DebtSystem`, `Inventory`, `WeekPlan`, `Ledger`, `SkillBook`, `EffectApplier`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Should `PlannerBookView` be split into smaller, more focused modules?**
  _Cohesion score 0.08646616541353383 - nodes in this community are weakly interconnected._
- **Should `Phase` be split into smaller, more focused modules?**
  _Cohesion score 0.06342780026990553 - nodes in this community are weakly interconnected._