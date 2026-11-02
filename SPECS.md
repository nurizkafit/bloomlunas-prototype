# BloomLunas prototype specs

Source of truth for game rules: the BloomLunas Docs repo `nurizkafit/bloomlunas-docs` (site: https://bloomlunas-docs.nurizka.workers.dev/, team password).
Paths below like `docs:pages/products/salep.md` mean `content/pages/products/salep.md` in that repo.
If this file and the docs differ, the docs win. Ask the user, then update this file.
Last aligned with the docs: 2 Nov 2026.

## 1. Purpose and scope

- Plays one full PDCA month (`JAM_MONTHS` = 1). Plan, Do, Check each week; Act at month-end.
- Readers: the Unity dev (logic structure) and the technical artist (scene, asset slots, states).
- Balance testbed: logic runs headless with a bot; results export to CSV for the balancing sheet.
- Scope follows the Jam column of `docs:gdd/19-scope-and-plans.md` and the pages tagged `Jam`.

| Feature | Prototype | Full scope (extension point only) |
| --- | --- | --- |
| Activities (docs:pages/activities) | Open shop, Sell to organization, Buy, Craft (Brew, Concoct), Sun drying, Grinding, Explore (City zone only), Commission, Organization visit (1 service), Rest, Respond to event | Explore outside the City zone (permit), Farm, Run machine, Oil pressing, Distilling, Infusing, Fermenting, Family time, Blend line |
| Products (docs:gdd/09a) | Fresh jamu, Salep; 2 jam recipes each | 9 types, 2 to 4 recipes each |
| Materials (docs:gdd/09b) | 9 Common: turmeric, kencur, ginger, lemongrass, tamarind, palm sugar, rice, coconut oil, beeswax | 32 materials, 4 rarity tiers |
| Entities | Home (shop, atelier, drying yard), Market, 4 guilds (Merchant, Apothecary, Artisan/Smith, Adventurer) for buy, sell, quest board; gathering area | City Hall, Eagle Brigade, extended family, community, full guild services |
| Events | Scheduled + random, small set | Predicted, unexpected, level scaling |
| Debt | Riba loan: compound interest + hidden fees (docs:pages/debt/riba-loan.md) | Flat-rate Sharia financing, refinancing, new loans |
| Act | Pay debt, pay utilities, 1 investment (Upgrade), book 1 service appointment | Permit, Training |
| Costs | `WEEKLY_EXPENSES` (Check), `MONTHLY_UTILITIES` (Act) | All costs |
| Skills | XP through use; Moon skill level drives craft quality | Sun, Moon, Earth paths; training |
| Endings | Good, Bad | True, Hidden Bad, unlimited mode |
| Not in prototype | Audio, localization, mobile layout. Accessibility basics (text size, colorblind-safe colors) are jam scope but not prototype scope | |

## 2. Architecture

```
View (three.js + DOM)  --intent.*-->  EventBus  --intent.*-->  Logic (GameManager, PhaseMachine, Phases, Systems)
View  <--*.changed / phase.*--  EventBus  <--results--  Logic
Logic --reads/writes--> Model (GameState)        Logic --reads--> Data (ContentDB, data/*.json)
View --reads only--> Model
```

## 3. Phase machine (docs:gdd/06-core-loop.md, docs:pages/loop/)

```
PlanPhase -> DoPhase (<-> event card) -> CheckPhase -> [last week of month?]
   no  -> PlanPhase (next week)
   yes -> ActPhase -> EndingChecker -> [ending?] yes -> EndingPhase ; no -> PlanPhase (next month)
```

| Phase | enter() | Player input | exit() writes |
| --- | --- | --- | --- |
| PlanPhase | Load forecast, ledger, public schedule, last notes | Place activity cards, set budget slots (expenses, purchases, buffer) | WeekPlan, budget slots |
| DoPhase | Build week event queue; avatar at home | Start each activity; run its actions; answer event cards | Ledger lines, XP, plan match bonus, lost cards |
| CheckPhase | Sum the week; pay `WEEKLY_EXPENSES` | Write a note | Notes, plan vs actual, XP per path |
| ActPhase | Sum the month; apply riba interest and fees; show debt and bills | Pay debt and utilities; pick investment; book appointment | Debt, investments, appointments |
| EndingPhase | Show ending text | Restart | Nothing |

## 4. Activities and actions

Two levels (docs:pages/activities, docs:pages/actions):
- An **activity** is a card on the Plan calendar. It has a location, a category, a skill path and a list of actions.
- An **action** is one turn inside an activity. It uses time (`ACTION_TIME_<ACTION>`) and energy (`ENERGY_COST_<ACTION>`). The player picks each action.

| Activity | Location | Actions inside (jam) | Skill XP |
| --- | --- | --- | --- |
| Open shop | Home shop | travel, serve-customer, restock-shelf | Sun |
| Sell to organization | A guild | travel, sell-item | Sun |
| Buy | Market or a guild | travel, buy-item | Sun |
| Craft | Home atelier | travel, prepare, brew, concoct, package | Moon (Cooking, Alchemy) |
| Sun drying | Home drying yard | travel, start-batch, collect-batch (passive, days, needs sun) | Moon (Cooking) [Proposal] |
| Grinding | Home atelier | travel, grind | Moon (Crafting) [Proposal] |
| Explore (City zone) | Gathering area | travel, gather-harvest, pick-response | Earth |
| Commission | Guild quest board, then job location | travel, take-quest, hand-in-quest | Path of the job |
| Organization visit | Guild (1 service visit) | travel, service | Depends |
| Rest | Home | travel, sleep (ends the day) | None |
| Respond to event | Where the event is | pick-response | Depends |

## 5. Do rules (docs:pages/loop/do.md, docs:pages/systems/time-and-energy.md, docs:pages/systems/activity-cards.md)

- The player starts each activity on purpose. The avatar walks there on its own. The avatar never runs planned cards on its own.
- Every action is a turn. Idle time does not move the clock. Day runs `DAY_START_HOUR` to `DAY_END_HOUR`.
- Energy: start each day with up to `ENERGY_MAX`. Every action except Rest uses `ENERGY_COST_<ACTION>`. At 0 energy the player can only rest. Rest restores `ENERGY_REST_RECOVERY` and ends the day.
- Fatigue: energy below `FATIGUE_THRESHOLD` or work after `DAY_END_HOUR` gives fatigue: `LATE_WAKE_CHANCE` and `FATIGUE_EFFICIENCY_PENALTY`.
- Plan match bonus: same activity (`PLAN_MATCH_XP_BONUS_ACTIVITY`), + same day (`_DAY`), + same time slot (`_TIME`).
- An event that uses the time of a planned card removes that card.
- Change the plan only for days that have not started.
- Appointments have fixed times. Late or missed: `APPOINTMENT_MISS_RELATIONSHIP_PENALTY`.
- Relationship points `RELATIONSHIP_<ORG>` change guild prices and rates (`RELATIONSHIP_PRICE_MODIFIER`). Gain: completed Commissions. Loss: missed appointment.
- Each action writes gold in or out to the ledger at once. Check shows the weekly total.
- Buy and sell at a guild only in its opening hours (`<ENTITY>_OPEN_HOURS`). Market and shop need no appointment.
- Commission has a deadline (`QUEST_DEADLINE_DAYS`).

## 6. Production, quality and shelf life (docs:pages/systems/production.md, docs:pages/systems/materials.md)

Recipe slots: main herb (weight x3), aroma (x1), sweetener (x1), carrier (x1). "-" = empty slot. Water is free.

| Product | Line (Moon skill) | Shelf life | Jam recipes (main herb / aroma / sweetener / carrier) |
| --- | --- | --- | --- |
| Fresh jamu | Brew (Cooking) | Short | Kunyit asam: turmeric (Fresh) / tamarind (Paste) / palm sugar (Block) / - |
| | | | Beras kencur: kencur (Fresh) / ginger (Fresh) / palm sugar (Block) / rice (Grain) |
| Salep | Concoct (Alchemy) | Long | Turmeric salep: turmeric (Fresh) / - / - / coconut oil (Oil) + beeswax (Block) |
| | | | Lemongrass balm: lemongrass (Fresh) / - / - / coconut oil (Oil) + beeswax (Block) |

Amounts and craft time per recipe: TBD in the docs. Use placeholders (§9).

Quality (decided 2 Nov 2026, placeholder numbers):
- Score = weighted average of material points x skill multiplier. The score picks the tier. The player sees only the tier.
- Material points: Common 50, Rare 70, Epic 90, Legendary 100, Spoiled 20.
- Skill multiplier by level 1–10: 50, 75, 100, 120, 140, 160, 180, 195, 210, 225 %.
- Tiers (score from → price multiplier): Failed <25 (no sale, compost) · Amateur 25 → x0.75 · Standard 50 → x1.0 · Fine 100 → x1.25 · Premium 150 → x1.5 · Masterwork 200 → x2.0.
- The craft screen shows input cost next to expected sell price (gross profit choice).

Material variants and shelf life:

| Variant | Made by | Shelf life |
| --- | --- | --- |
| Fresh | Gather/harvest, buy | Short |
| Dried | Sun drying | Long |
| Powder | Grinding | Long |
| Spoiled | Fresh stock that is too old | Quality points 20 |

Shelf life lengths in days: TBD in the docs (placeholder §9).

## 7. EventBus messages

| Message | Sender | Payload |
| --- | --- | --- |
| `intent.nextPhase` | View (dev) | none |
| `intent.placeCard` / `intent.moveCard` / `intent.removeCard` | PlannerBookView | placeCard: card; moveCard: { uid, ...changes }; removeCard: { uid } |
| `intent.setBudget` | PlannerBookView | expenses, purchases, buffer |
| `intent.lockPlan` | PlannerBookView | none |
| `intent.startActivity` | ActionMenuView | activityId, locationId |
| `intent.runAction` | ActionMenuView | actionId, settings (for example recipe and chosen materials) |
| `intent.respondEvent` | EventCardView | eventId, responseIndex |
| `intent.writeNote` | RecapView | text |
| `intent.payDebt` / `intent.payUtilities` / `intent.invest` / `intent.bookAppointment` | MonthEndView | amount or id |
| `phase.entered` / `phase.exited` | PhaseMachine | phase name, calendar |
| `clock.changed` | TimeSystem | day, minute, energy, fatigue |
| `ledger.changed` | ActionRunner, EffectApplier | line |
| `inventory.changed`, `skill.changed`, `debt.changed`, `relationship.changed` | EffectApplier | delta |
| `action.started` / `action.completed` / `action.refused` | ActionRunner | action, reason, planMatch, quality |
| `event.fired` / `event.resolved` | EventSystem | event, response |
| `plan.validated` | PlanValidator | problems, warnings, forecast |
| `game.ended` | EndingChecker | endingId |

## 8. Data files (data/*.json → Unity ScriptableObjects, same field names)

| Type | Main fields | Prototype files |
| --- | --- | --- |
| BalanceConfig | all variables (§9), names as in docs:gdd/08-economy-and-variables.md | 1 |
| ActivityData | id, category, locationIds, actionIds[], skillPath, canMiss, importance, needsAppointment, needsPermit, build | 11 |
| ActionData | id, timeCost, energyCost, inputs, outputs, effects[] | about 20 |
| LocationData | id, entityId, openHours per weekday, view (exterior, interior), assetSlotId, door point, walkTimes, polyforkAssetId? | 9 |
| EntityData | id, type (organization, people), services[], buys[], sells[], questBoard, relationshipStart | 6 |
| ProductData | id, line, moonSkill, shelfLifeDays, basePrice, forecast lo/hi, recipes[] | 2 |
| RecipeData | id, productId, slots {main, aroma, sweetener, carrier[]} (materialId + variant), output count, craft time | 4 |
| MaterialData | id, tier, role, plantPart, variants[] (id, shelfLifeDays), baseCost, forecast lo/hi | 9 |
| EventData | id, type (scheduled, random), source, trigger (day, chance, level), text, responses[] (label, cost, effects) | about 6 |
| EffectData | type (gold, item, xp, relation, energy, debt, time), target, amount | inside other types |
| CostData | id, period (weekly, monthly), amount, paidIn (Check, Act) | 2 |
| DebtData | id, kind (riba, flat), principal, monthlyRate, hiddenFees[], minPayment, limit | 1 (riba) |
| InvestmentData | id, branch (permit, upgrade, training), price, requirement, effects[] | 1 (Upgrade) |
| QualityConfig | material points, skill multipliers, tier thresholds, price multipliers | 1 |
| SkillPathData | path, sub-skills, levels, xpPerLevel | 3 (only Moon affects quality in the prototype) |
| EndingData | id, rule, text | Good, Bad |

## 9. Placeholder values (not balanced)

The docs list these variables as TBD. Use these values in `BalanceConfig.json` with `"_placeholder": true`, so the testbed can tune them.

| Variable | Placeholder | Source |
| --- | --- | --- |
| `WEEKS_PER_MONTH` | 4 | Core Loop doc |
| `JAM_MONTHS` | 1 | Scope |
| `DAY_START_HOUR` / `DAY_END_HOUR` | 7 / 19 | Planner Book |
| `GOLD_START` | 240 | Planner Book |
| `WEEKLY_EXPENSES` | 40 | Planner Book |
| `MONTHLY_UTILITIES` | 120 | Planner Book (shop rent) |
| `DEBT_START` | 3000 | placeholder |
| `DEBT_MIN_PAYMENT` | 300 | Planner Book (installment) |
| `DEBT_INTEREST_RATE` | 2 % per month, compound on unpaid balance | placeholder |
| `HIDDEN_FEE_<TYPE>` | 1 fee: `HIDDEN_FEE_LATE` 25 | placeholder |
| `DEBT_LIMIT` | 4500 | placeholder |
| `ENERGY_MAX` / `ENERGY_REST_RECOVERY` | 100 / 100 | placeholder |
| `ENERGY_COST_<ACTION>` | 10 (Explore actions 20) | placeholder |
| `FATIGUE_THRESHOLD` / `LATE_WAKE_CHANCE` / `FATIGUE_EFFICIENCY_PENALTY` | 20 / 0.3 / 0.25 | placeholder |
| `ACTION_TIME_<ACTION>` | 30 to 120 min | placeholder |
| `PRICE_FRESH_JAMU` / `PRICE_SALEP` | 6 / 12 (forecast 5–8 / 9–14) | Planner Book |
| `COST_<MATERIAL>` | 2 to 9 per unit | placeholder |
| Shelf life (days) | Fresh material 3, Fresh jamu 2, Salep 28, Dried / Powder 28 | placeholder |
| Recipe output / craft time | Fresh jamu 6 per batch, 3 h; Salep 4 per batch, 4 h | Planner Book |
| `PLAN_MATCH_XP_BONUS_ACTIVITY` / `_DAY` / `_TIME` | 1 / 2 / 3 | placeholder |
| `RELATIONSHIP_PRICE_MODIFIER` | 2 % per level | placeholder |
| `QUEST_DEADLINE_DAYS` | 7 | placeholder |
| `EVENTS_PER_WEEK_MIN` / `_MAX` | 1 / 2 | Docs (early levels) |
| `NIGHT_END_HOUR` / `LATE_WAKE_DELAY_MIN` | 23 / 120 min | placeholder (M1) |
| `CUSTOMERS_PER_HOUR` / `SHOP_BUY_CHANCE` | 2 / 0.7 | placeholder (M1) |
| `SHOP_PRICE_RATIO` / `MARKET_SELL_RATIO` / `GUILD_BUY_RATIO` / `GUILD_SELL_RATIO` | 1.0 / 1.0 / 0.8 / 0.9 x real price | placeholder (M1) |
| `RELATIONSHIP_POINTS_PER_LEVEL` | 10 | placeholder (M1) |
| `SUN_DRYING_DAYS` / `SUN_DRYING_RACK_CAPACITY` | 2 / 10 | placeholder (M1) |

Price rule (M1): each Plan phase rolls a hidden real price per item inside its forecast range. Material price = real price x variant `priceMult`. Product price = real price x quality tier `priceMult`. The `COST_<MATERIAL>` keys are not used yet (the forecast range replaces them).

## 10. Planner Book port

| Planner Book part | Goes to |
| --- | --- |
| Constants | BalanceConfig (docs names: `GOLD_START`, `WEEKLY_EXPENSES`, `MONTHLY_UTILITIES`) |
| 6 card types with settings | ActivityData (names from §4) |
| Plan state (placed cards, slots, test notes) | WeekPlan, Wallet |
| Plan check (problems, warnings, forecast) | PlanValidator |
| Market forecast, price history | EconomySystem + item data |
| Week 1 recap and notes | CheckPhase output of last week |
| Tabs: Week, Ledger, Market, Town, Journal | PlannerBookView tabs |
| Review modal, "Start the week" | PlanPhase.exit() → DoPhase |
| Spec and Sheet overlays | DevOverlay |

Card renames: Sell → Open shop; Craft → Craft (recipe picks Brew or Concoct); Gather → Explore (City zone); Errand (clinic order) → Organization visit (service); Errand (quest board) → Commission. Add Sell to organization, Sun drying, Grinding. Jamu → Fresh jamu. Recipes and materials from §6, not from the Planner Book.

## 11. Town scene and asset slots

- Isometric orthographic camera; pan and zoom limits; click-only input.
- 1 unit = 1 m; Y up; model pivot at ground centre, facing +Z.
- Avatar walks on a path graph between door points (no navmesh).
- `AssetSlot` shows a greybox; if `assets/models/<slot id>.glb` exists, it loads that model. States = named child nodes or material swap.

| Slot id | Greybox | States |
| --- | --- | --- |
| loc_home_shop | box + roof | open, closed, busy |
| int_home_atelier | room box | idle, crafting |
| loc_home_drying_yard | flat racks | empty, drying, ready |
| loc_market | low wide box | day, night |
| loc_merchant_guild, loc_apothecary_guild, loc_artisan_guild, loc_adventurer_guild | tall box | open, closed |
| loc_gather_area | green plane + cones | full, gathered |
| chr_avatar | capsule | idle, walk, work, tired |
| chr_customer | small capsule | walk, buy |
| prop_event_marker | floating diamond | idle, alert |
| env_ground, env_paths, env_sky | planes | day, evening, night |

## 12. Class catalog (JS → Unity)

| Class | Layer | Unity form |
| --- | --- | --- |
| GameManager | Logic | MonoBehaviour singleton |
| PhaseMachine, Phase + 5 subclasses (enter, finish, next, exit) | Logic | C# State pattern |
| Rng (seeded, mulberry32) | Logic | System.Random with a seed |
| GameState, Calendar, Wallet, Inventory (with variants and age), DebtAccount, SkillBook, Relationships, WeekPlan, Ledger | Model | [Serializable] classes → JSON |
| TimeSystem (energy, fatigue), ActionRunner, EconomySystem, ProductionSystem (recipes, quality, spoilage), DebtSystem (riba interest, fees), EventSystem, EndingChecker | Logic | C# services |
| EffectApplier, PlanValidator, QualityCalculator | Logic | C# static classes |
| EventBus | Glue | C# events or ScriptableObject event channels |
| ContentDB | Data | Resources or Addressables lookup |
| TownView, AssetSlot, Avatar | View | Town scene, prefabs, Cinemachine |
| PlannerBookView, ActionMenuView, CraftView, HudView, EventCardView, RecapView, MonthEndView, EndingView | View | UI screens |

## 13. Extension points for full scope

Do not change for growth: the `Phase` interface, the `GameState` shape (add fields only), `EventBus` message names, the `EffectData` contract, the activity → action model.
New activities, actions, products, recipes, materials, events, investments, skills, endings = new data files. New rules = small new system classes (for example MachineSystem, FarmSystem, TutorialDirector, a flat-rate `DebtAccount` subclass for Sharia financing and refinancing).

## 14. Open questions

- Real values for all TBD variables (docs:gdd/08-economy-and-variables.md). The prototype uses §9 until then.
- Recipe amounts and craft times (docs say TBD).
- Flat-rate Sharia financing in the jam build: TBD in the docs.
- Balancing sheet link (for the CSV import).
