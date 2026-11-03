# BloomLunas prototype specs

Source of truth for game rules: the BloomLunas Docs repo `nurizkafit/bloomlunas-docs` (site: https://bloomlunas-docs.nurizka.workers.dev/).
Paths below like `doc:core-gameplay/core-loop/do` mean the GDD page https://bloomlunas-docs.nurizka.workers.dev/doc/core-gameplay/core-loop/do. The file is under `content/gdd/` in that repo, with number prefixes on the folder names (for example `content/gdd/03-core-gameplay/01-core-loop/02-do/index.md`). The Jam or Full build of each item is on its page (tag) and on the Mapping page (https://bloomlunas-docs.nurizka.workers.dev/map/, "Jam only").
If this file and the docs differ, the docs win. Ask the user, then update this file.
Last aligned with the docs: 2 Nov 2026.

## 1. Purpose and scope

- Plays one full PDCA month (`JAM_MONTHS` = 1). Plan, Do, Check each week; Act at month-end.
- Readers: the Unity dev (logic structure) and the technical artist (scene, asset slots, states).
- Balance testbed: logic runs headless with a bot; results export to CSV for the balancing sheet.
- Scope follows the Jam column of `doc:development-and-future-plans/scope-and-plans` and the pages tagged `Jam`.

| Feature | Prototype | Full scope (extension point only) |
| --- | --- | --- |
| Activities (doc:core-gameplay/core-loop/do) | Open shop, Sell to organization, Buy, Craft (Brew, Concoct), Sun drying, Grinding, Explore (City zone only), Commission, Organization visit (1 service), Rest, Respond to event | Explore outside the City zone (permit), Farm, Run machine, Oil pressing, Distilling, Infusing, Fermenting, Family time, Blend line |
| Products (doc:core-gameplay/content-lists/products-list) | Fresh jamu, Salep; 2 jam recipes each | 9 types, 2 to 4 recipes each |
| Materials (doc:core-gameplay/content-lists/materials-list) | 9 Common: turmeric, kencur, ginger, lemongrass, tamarind, palm sugar, rice, coconut oil, beeswax | 32 materials, 4 rarity tiers |
| Entities | Home (shop, atelier, drying yard), Market, 4 guilds (Merchant, Apothecary, Artisan/Smith, Adventurer) for buy, sell, quest board; gathering area | City Hall, Eagle Brigade, extended family, community, full guild services |
| Events | Scheduled + random, small set | Predicted, unexpected, level scaling |
| Debt | Riba loan: compound interest + hidden fees (doc:core-gameplay/system-and-mechanics/debt/riba-loan) | Flat-rate Sharia financing, refinancing, new loans |
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

## 3. Phase machine (doc:core-gameplay/core-loop and its pages Plan, Do, Check, Act)

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

Two levels (doc:core-gameplay/core-loop/do: activities are pages, actions are sections of those pages; doc:core-gameplay/system-and-mechanics/activity-and-action):
- An **activity** is a card on the Plan calendar. It has a location, a category, a skill path and a list of actions.
- An **action** is one turn inside an activity. It uses time (`ACTION_TIME_<ACTION>`) and energy (`ENERGY_COST_<ACTION>`). The player picks each action.

| Activity | Location | Actions inside (jam) | Skill XP |
| --- | --- | --- | --- |
| Open shop | Home shop | travel, serve-customer, restock-shelf | Sun |
| Visit | Market or a guild | travel, buy-item, sell-item | Sun |
| Craft | Home atelier | travel, prepare, brew, concoct, package | Moon (Cooking, Alchemy) |
| Sun drying | Home drying yard | travel, start-batch, collect-batch (passive, days, needs sun) | Moon (Cooking) [Proposal] |
| Grinding | Home atelier | travel, grind | Moon (Crafting) [Proposal] |
| Explore (City zone) | Gathering area | travel, gather-harvest, pick-response | Earth |
| Commission | Guild quest board, then job location | travel, take-quest, hand-in-quest | Path of the job |
| Appointment | Guild (1 service visit) | travel, service | Depends |
| Rest | Home | travel, sleep (ends the day) | None |
| Respond to event | Where the event is | pick-response | Depends |

## 5. Do rules (doc:core-gameplay/core-loop/do, doc:core-gameplay/system-and-mechanics/time-and-energy, doc:core-gameplay/system-and-mechanics/activity-and-action/activity-card)

- The player starts each activity on purpose. The avatar walks there on its own. The avatar never runs planned cards on its own.
- Every action is a turn. Idle time does not move the clock.
- Day (user decision, 2 Nov 2026): 06:00 (`DAY_START_HOUR`) to 03:00 (`NIGHT_END_HOUR` 27 = 03:00 next morning). The clock counts past 24:00. Night is 18:00–24:00 (`SLEEP_EARLIEST_HOUR` to `DAY_END_HOUR`); safe for sleep. Midnight is 00:00–03:00: work or sleep after `DAY_END_HOUR` gives fatigue. No action may end after `NIGHT_END_HOUR`.
- Sleep (activity `rest`, action `sleep`) is at the bed (loc_home). It ends the day. It is allowed only from `SLEEP_EARLIEST_HOUR`. It is not a plan card (user decision, 2 Nov 2026). There is no "End the day" button.
- Energy: start each day with up to `ENERGY_MAX`. Every work action uses `ENERGY_COST_<ACTION>`. Sleep restores `ENERGY_REST_RECOVERY`.
- Small rest (action `small-rest`): any time, any place, no activity needed. `SMALL_REST_MIN`, + `SMALL_REST_ENERGY` (up to `ENERGY_MAX`).
- Meals (action `eat`): breakfast, lunch, dinner, once a day each, only in their window (`MEAL_WINDOWS`). `MEAL_MIN`, + `MEAL_ENERGY`. Free: `WEEKLY_EXPENSES` pays for food. Any place, no activity needed.
- Small rest and meals are `anyActivity` actions: they do not change the current activity and do not count as activity time.
- Fatigue: energy below `FATIGUE_THRESHOLD` at sleep, or work or sleep after `DAY_END_HOUR`, gives fatigue: `LATE_WAKE_CHANCE` and `FATIGUE_EFFICIENCY_PENALTY`. A late wake starts the day `LATE_WAKE_DELAY_MIN` (3 h) late, at 09:00.
- Plan match bonus: same activity (`PLAN_MATCH_XP_BONUS_ACTIVITY`), + same day (`_DAY`), + same time slot (`_TIME`).
- An event that uses the time of a planned card removes that card.
- Change the plan only for days that have not started.
- Appointments have fixed times. Late or missed: `APPOINTMENT_MISS_RELATIONSHIP_PENALTY`.
- Relationship points `RELATIONSHIP_<ORG>` change guild prices and rates (`RELATIONSHIP_PRICE_MODIFIER`). Gain: completed Commissions. Loss: missed appointment.
- Each action writes gold in or out to the ledger at once. Check shows the weekly total.
- Buy and sell at a guild only in its opening hours (`<ENTITY>_OPEN_HOURS`). Market and shop need no appointment.
- Commission has a deadline (`QUEST_DEADLINE_DAYS`).

## 6. Production, quality and shelf life (doc:core-gameplay/system-and-mechanics/production, doc:core-gameplay/system-and-mechanics/materials)

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
| BalanceConfig | all variables (§9), names as in doc:core-gameplay/economy-and-variables | 1 |
| ActivityData | id, category, locationIds, actionIds[], skillPath, canMiss, importance, needsAppointment, needsPermit, build, plannable, planDurationMin, planDurationOptions (whole slots), planEarliestHour? | 11 |
| ActionData | id, timeCost, energyCost, inputs, outputs, effects[], anyActivity? (small rest, eat) | about 20 |
| LocationData | id, entityId, openHours per weekday, view (exterior, interior), assetSlotId, door point, walkTimes, polyforkAssetId?, building? (station inside that building: no town position) | 9 |
| InteriorData | id, name, buildingId, size, wallHeight, door, stations[] (id, label, assetSlotId, greybox, position, stand, locationId or panel) | 1 (home and shop) |
| EntityData | id, type (organization, people), services[], buys[], sells[], questBoard, relationshipStart | 6 |
| ProductData | id, line, moonSkill, shelfLifeDays, basePrice, forecast lo/hi, recipes[] | 2 |
| RecipeData | id, productId, slots {main, aroma, sweetener, carrier[]} (materialId + variant), output count, craft time | 4 |
| MaterialData | id, tier, role, plantPart, variants[] (id, shelfLifeDays), baseCost, forecast lo/hi | 9 |
| EventData | id, type (scheduled, random), source, trigger (day, chance, level), text, responses[] (label, cost, effects) | about 6 |
| EffectData | type (gold, item, xp, relation, energy, debt, time, stat), target, amount | inside other types (stat = lasting change to a BalanceConfig key, for investments) |
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
| `JAM_MONTHS` | 1 (default months for `npm run sim`; the game goes on until an ending) | Scope |
| `DAY_START_HOUR` / `DAY_END_HOUR` / `NIGHT_END_HOUR` | 6 / 24 / 27 (03:00) | User decision (2 Nov 2026) |
| `PLAN_SLOT_HOURS` / `SLEEP_EARLIEST_HOUR` | 3 / 18 | User decision (2 Nov 2026) |
| `SMALL_REST_MIN` / `SMALL_REST_ENERGY` | 30 min / 25 | placeholder (user asked for the action) |
| `MEAL_MIN` / `MEAL_ENERGY` / `MEAL_WINDOWS` | 30 min / 20 / breakfast 6–9, lunch 12–15, dinner 18–21 | placeholder (user: meals have windows, food is in the weekly cost) |
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
| `EVENTS_PER_WEEK_MIN` / `_MAX` | 1 / 2 random events, plus the scheduled ones | Docs (early levels) |
| `DEADLINE_MONTHS` | 12 | placeholder (docs: TBD) |
| `LATE_WAKE_DELAY_MIN` | 180 min (start at 09:00) | User decision (2 Nov 2026) |
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

Plan rules (user decision, 2 Nov 2026):
- The week board has 3-hour slots (`PLAN_SLOT_HOURS`): 06–09, 09–12, 12–15, 15–18, 18–21, 21–24, 00–03. A card starts on a slot edge and fills whole slots (`planDurationOptions` are multiples of 180 min). Craft fills the recipe time rounded up to whole slots. The Do phase still counts minutes. Plan match "same time" = the action starts inside the card slots.
- A location that is closed for all of a slot is a problem. Open for part of the slot is a warning. A location open all day (0–24) stays open after midnight.
- Work in 00–03 is a warning (midnight). Sleep is not a card.
- Deck (user decision, 2 Nov 2026): the side panel is only the card stock. Category tiles first, then the cards of one tile. Drag a card onto a slot, or click a free slot and then pick a card.
  - Tiles: Production (Craft, Processing), Shop (Open shop), Fieldwork (Exploration), Guild / Organization (Visit, Appointment, Commission). No Personal tile: sleep, meals and small rests are only in Do.
  - Processing is one deck card for the activities with `planGroup: "processing"` (Sun drying, Grinding). The popup picks the process.
  - Popup: when a card is dropped (or placed in a picked slot), a popup opens beside it. It holds the settings (process, organization or place, recipe, length), info, issues, Remove and Done. Click a placed card to open it again. Esc or a click outside closes it.
- Ledger: "Gold with no job" uses the same big coin look as the Assets page.
- Town tab: opening hours show as blocks per location. Days next to each other with the same hours merge into one block (example: Mon–Sat 8:00–15:00). Closed days are hatched.
- Top bar: Gold, Debt, next payment (`DEBT_MIN_PAYMENT` + `MONTHLY_UTILITIES`, month end), weekly living cost, gold after the plan (end of week forecast), energy.
- Sleep, meals and small rests are not cards. They happen in Do (the bed; HUD buttons).

Card renames: Buy + Sell to organization → Visit (Guild / Organization); Organization visit → Appointment; Explore → Exploration (category Fieldwork); Open shop category → Shop. Earlier: Sell → Open shop; Craft → Craft (recipe picks Brew or Concoct); Gather → Explore (City zone); Errand (clinic order) → Organization visit (service); Errand (quest board) → Commission. Add Sell to organization, Sun drying, Grinding. Jamu → Fresh jamu. Recipes and materials from §6, not from the Planner Book.

## 11. Town scene and asset slots

- Isometric orthographic camera; pan and zoom limits; click-only input.
- 1 unit = 1 m; Y up; model pivot at ground centre, facing +Z.
- Avatar walks on a path graph between door points (no navmesh).
- Interior view (user decision, 2 Nov 2026): only the home and shop has an interior. Other buildings open a menu only.
  - The town shows one "Home and shop" building. Home (bed) and atelier (cauldron) are stations inside it (`building: loc_home_shop`). The drying yard stays outside.
  - The view goes inside when the avatar walks through the door. "Exit to town" goes back. Exit is view only: no game time, the player location stays.
  - Building menu (user decision, 2 Nov 2026): a click on the "Home and shop" building in the town opens one menu. It has an Enter button (only when the player is in the building; view only, 0 min) and the activities of each station (Shop counter, Cauldron, Bed). Picking an activity there walks to that station.
  - Do starts inside (the player wakes at home). After "End the day", the view goes inside again.
  - Camera: cutaway isometric room. Back walls stay, front walls are hidden (low rim). Warm lamp; the window follows the time of day.
  - Stations: cauldron (craft, grinding: loc_home_atelier), shop counter (open shop: loc_home_shop; customers walk in when you serve), shelf (stock panel, view only), bed (rest: loc_home).
  - Moving between stations costs 0 min (`_walk.withinBuilding`). Inside the building, only actions use time.
- `AssetSlot` shows a greybox; if `assets/models/<slot id>.glb` exists, it loads that model. States = named child nodes or material swap.

| Slot id | Greybox | States |
| --- | --- | --- |
| loc_home_shop | box + roof ("Home and shop"; has the interior) | open, closed, busy |
| loc_home_drying_yard | flat racks | empty, drying, ready |
| loc_market | low wide box | day, night |
| loc_merchant_guild, loc_apothecary_guild, loc_artisan_guild, loc_adventurer_guild | tall box | open, closed |
| loc_gather_area | green plane + cones | full, gathered |
| chr_avatar | capsule | idle, walk, work, tired |
| chr_customer | small capsule | walk, buy |
| int_cauldron | pot on a stone patch | idle, crafting |
| int_counter | long box | open, closed, busy |
| int_shelf | tall box with jars | idle |
| int_bed | low box with a blanket | idle, sleeping |
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
| TownView, InteriorView, AssetSlot, Avatar | View | Town scene, interior scene, prefabs, Cinemachine |
| PlannerBookView, ActionMenuView, CraftView, StockView, HudView, EventCardView, RecapView, MonthEndView, EndingView | View | UI screens |

## 13. Extension points for full scope

Do not change for growth: the `Phase` interface, the `GameState` shape (add fields only), `EventBus` message names, the `EffectData` contract, the activity → action model.
New activities, actions, products, recipes, materials, events, investments, skills, endings = new data files. New rules = small new system classes (for example MachineSystem, FarmSystem, TutorialDirector, a flat-rate `DebtAccount` subclass for Sharia financing and refinancing).

## 14. Open questions

- Real values for all TBD variables (doc:core-gameplay/economy-and-variables). The prototype uses §9 until then.
- Recipe amounts and craft times (docs say TBD).
- Flat-rate Sharia financing in the jam build: TBD in the docs.
- Balancing sheet link (for the CSV import).
