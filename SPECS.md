# BloomLunas prototype specs

Source of truth for game rules: the interactive GDD (1 Nov 2026). Plan doc: https://claude.ai/artifact/1VDXa751o9x39pXZkQhz17
If this file and the GDD differ, the GDD wins. Ask the user, then update this file.

## 1. Purpose and scope

- Plays one full PDCA month (`JAM_MONTHS` = 1). Plan, Do, Check each week; Act at month-end.
- Readers: the Unity dev (logic structure) and the technical artist (scene, asset slots, states).
- Balance testbed: logic runs headless with a bot; results export to CSV for the balancing sheet.

| Feature | Prototype | Full scope (extension point only) |
| --- | --- | --- |
| Do activities | Open shop, Sell to organization, Hand craft, Gather/Harvest (wild spots), Buy, Commission (guild quest board), Rest, Respond to event, 1 organization visit (service) | Explore, Plant, Farm harvest, Run machine, Upkeep, Family time |
| Entities | Shop, Market, 4 guilds (Merchant, Apothecary, Artisan/Smith, Adventurer) for buy, sell, quest board; gathering area | City Hall, Eagle Brigade, family, community, full guild services |
| Events | Scheduled + random, small set (about 6) | 4 types, level scaling |
| Act | Pay debt, pay utilities, 1 investment (Upgrade), book 1 service appointment | Permit, Training, refinancing |
| Costs | 1 weekly (living), 1 monthly (utilities) | All |
| Products | Jamu, Salep | Full list |
| Skills | XP through use; 1 path active | Sun, Moon, Earth; training |
| Endings | Good, Bad | 4 endings, unlimited mode |
| Not in prototype | Audio, localization, mobile layout, accessibility settings | |

## 2. Architecture

```
View (three.js + DOM)  --intent.*-->  EventBus  --intent.*-->  Logic (GameManager, PhaseMachine, Phases, Systems)
View  <--*.changed / phase.*--  EventBus  <--results--  Logic
Logic --reads/writes--> Model (GameState)        Logic --reads--> Data (ContentDB, data/*.json)
View --reads only--> Model
```

## 3. Phase machine

```
PlanPhase -> DoPhase (<-> event card) -> CheckPhase -> [last week of month?]
   no  -> PlanPhase (next week)
   yes -> ActPhase -> EndingChecker -> [ending?] yes -> EndingPhase ; no -> PlanPhase (next month)
```

| Phase | enter() | Player input | exit() writes |
| --- | --- | --- | --- |
| PlanPhase | Load forecast, ledger, public schedule, last notes | Place cards, set budget slots (expenses, purchases, buffer) | WeekPlan, budget slots |
| DoPhase | Build week event queue; avatar at home | Pick next action; answer event cards | Ledger lines, XP, plan match bonus, lost cards |
| CheckPhase | Sum the week; pay weekly living cost | Write a note | Notes, plan vs actual |
| ActPhase | Sum the month; show debt and bills | Pay debt and utilities; pick investment; book appointment | Debt, investments, appointments |
| EndingPhase | Show ending text | Restart | Nothing |

## 4. Do rules (GDD, decided 1 Nov 2026)

- The player picks each action from a menu. The avatar walks there on its own. The avatar never runs planned cards on its own.
- Each action uses time and energy (Rest restores). When the player does nothing, time does not move.
- Plan match bonus: same activity (`PLAN_MATCH_XP_BONUS_ACTIVITY`), + same day (`_DAY`), + same time slot (`_TIME`).
- An event that uses the time of a planned card removes that card.
- Change the plan only for days that have not started.
- Appointments have fixed times. Late or missed: `APPOINTMENT_MISS_RELATIONSHIP_PENALTY`.
- Each action writes gold in or out to the ledger at once. Check shows the weekly total.
- Buy and sell at an organization only in its opening hours. Market and shop need no appointment.
- Commission (quest board job) has a deadline (`QUEST_DEADLINE_DAYS`); it gives income and relationship points.

## 5. EventBus messages

| Message | Sender | Payload |
| --- | --- | --- |
| `intent.nextPhase` | View (dev) | none |
| `intent.placeCard` / `intent.moveCard` / `intent.removeCard` | PlannerBookView | card, day, start, settings |
| `intent.setBudget` | PlannerBookView | expenses, purchases, buffer |
| `intent.lockPlan` | PlannerBookView | none |
| `intent.runAction` | ActionMenuView | activityId, settings, locationId |
| `intent.respondEvent` | EventCardView | eventId, responseIndex |
| `intent.writeNote` | RecapView | text |
| `intent.payDebt` / `intent.payUtilities` / `intent.invest` / `intent.bookAppointment` | MonthEndView | amount or id |
| `phase.entered` / `phase.exited` | PhaseMachine | phase name, calendar |
| `clock.changed` | TimeSystem | day, minute, energy |
| `ledger.changed` | ActionRunner, EffectApplier | line |
| `inventory.changed`, `skill.changed`, `debt.changed` | EffectApplier | delta |
| `action.started` / `action.completed` / `action.refused` | ActionRunner | activity, reason, planMatch |
| `event.fired` / `event.resolved` | EventSystem | event, response |
| `plan.validated` | PlanValidator | problems, warnings, forecast |
| `game.ended` | EndingChecker | endingId |

## 6. Data files (data/*.json → Unity ScriptableObjects, same field names)

| Type | Main fields | Prototype files |
| --- | --- | --- |
| BalanceConfig | all variables (§8) | 1 |
| ActivityData | id, category, skillPath, locationIds, settings[] (option → duration, cost, inputs, outputs), canMiss, importance, needsAppointment, needsPermit | 9 |
| LocationData | id, entityId, openHours per weekday, view (exterior, interior), assetSlotId, door point, walkTimes | 7 |
| EntityData | id, type (organization, people), services[], buys[], sells[], questBoard, relationshipStart | 6 |
| ProductData / MaterialData | id, basePrice, forecast lo/hi, volatility, recipe (inputs → outputs) | 2 products, 4 materials |
| EventData | id, type (scheduled, random), source, trigger (day, chance, level), text, responses[] (label, cost, effects) | about 6 |
| EffectData | type (gold, item, xp, relation, energy, debt, time), target, amount | inside other types |
| CostData | id, period (weekly, monthly), amount, paidIn (Check, Act) | 2 |
| InvestmentData | id, branch (permit, upgrade, training), price, requirement, effects[] | 1 (Upgrade) |
| SkillPathData | path, levels, xpPerLevel, unlocks | 1 active |
| EndingData | id, rule, text | Good, Bad |

Prototype content (names from the GDD and the Planner Book):
- Products: Jamu, Salep. Materials: Turmeric, Ginger, Beeswax, Coconut oil.
- Recipes: Jamu batch = 2 Turmeric + 1 Ginger → 6 Jamu, 3 h. Salep batch = 1 Turmeric + 1 Beeswax + 1 Coconut oil → 4 Salep, 4 h.
- Locations: `loc_home_shop`, `loc_market`, `loc_merchant_guild`, `loc_apothecary_guild`, `loc_artisan_guild`, `loc_adventurer_guild`, `loc_gather_area`.

## 7. Planner Book port

| Planner Book part | Goes to |
| --- | --- |
| Constants (DAY_START, DAY_END, NIGHT_END, WEEKLY_EXPENSES, MONTHLY_BILLS) | BalanceConfig |
| 6 card types with settings | ActivityData |
| Plan state (placed cards, slots, test notes) | WeekPlan, Wallet |
| Plan check (problems, warnings, forecast) | PlanValidator |
| Market forecast, price history | EconomySystem + item data |
| Week 1 recap and notes | CheckPhase output of last week |
| Tabs: Week, Ledger, Market, Town, Journal | PlannerBookView tabs |
| Review modal, "Start the week" | PlanPhase.exit() → DoPhase |
| Spec and Sheet overlays | DevOverlay |

Card names: Sell → Open shop; Craft → Hand craft; Gather → Gather/Harvest; Errand (clinic order) → Organization visit (service); Errand (quest board) → Commission; add Sell to organization.

## 8. Placeholder values (not balanced)

| Variable | Value | Source |
| --- | --- | --- |
| WEEKS_PER_MONTH | 4 | Core Loop doc |
| JAM_MONTHS | 1 | GDD scope |
| DAY_START_HOUR / DAY_END_HOUR / NIGHT_END_HOUR | 7 / 19 / 23 | Planner Book |
| START_GOLD | 240 | Planner Book |
| START_MATERIALS | Turmeric 4, Ginger 2, Beeswax 1, Coconut oil 1 | Planner Book |
| START_PRODUCTS | Jamu 3, Salep 1 | Planner Book |
| WEEKLY_LIVING_COST | 40 | Planner Book |
| MONTHLY_UTILITIES | 120 | Planner Book (shop rent) |
| DEBT_MIN_PAYMENT | 300 | Planner Book (installment) |
| DEBT_START, DEBT_LIMIT, interest or flat fee | TBD: ask the user | GDD |
| Forecast ranges | Jamu 5–8, Salep 9–14, Turmeric 3–5, Ginger 4–7, Beeswax 8–12, Coconut oil 5–8 | Planner Book |
| EVENTS_PER_WEEK_MIN / MAX | 1 / 2 | GDD (early levels) |
| PLAN_MATCH_XP_BONUS_* , ENERGY, QUEST_DEADLINE_DAYS | TBD: use 1 / 2 / 3, 100, 7 and mark `_placeholder` | — |

## 9. Town scene and asset slots

- Isometric orthographic camera; pan and zoom limits; click-only input.
- 1 unit = 1 m; Y up; model pivot at ground centre, facing +Z.
- Avatar walks on a path graph between door points (no navmesh).
- `AssetSlot` shows a greybox; if `assets/models/<slot id>.glb` exists, it loads that model. States = named child nodes or material swap.

| Slot id | Greybox | States |
| --- | --- | --- |
| loc_home_shop | box + roof | open, closed, busy |
| loc_market | low wide box | day, night |
| loc_merchant_guild, loc_apothecary_guild, loc_artisan_guild, loc_adventurer_guild | tall box | open, closed |
| loc_gather_area | green plane + cones | full, gathered |
| chr_avatar | capsule | idle, walk, work, tired |
| chr_customer | small capsule | walk, buy |
| prop_event_marker | floating diamond | idle, alert |
| env_ground, env_paths, env_sky | planes | day, evening, night |
| int_shop | room box | craft, sell, rest |

## 10. Class catalog (JS → Unity)

| Class | Layer | Unity form |
| --- | --- | --- |
| GameManager | Logic | MonoBehaviour singleton |
| PhaseMachine, Phase + 5 subclasses | Logic | C# State pattern |
| GameState, Calendar, Wallet, Inventory, DebtAccount, SkillBook, WeekPlan, Ledger | Model | [Serializable] classes → JSON |
| TimeSystem, ActionRunner, EconomySystem, EventSystem, EndingChecker | Logic | C# services |
| EffectApplier, PlanValidator | Logic | C# static classes |
| EventBus | Glue | C# events or ScriptableObject event channels |
| ContentDB | Data | Resources or Addressables lookup |
| TownView, AssetSlot, Avatar | View | Town scene, prefabs, Cinemachine |
| PlannerBookView, ActionMenuView, HudView, EventCardView, RecapView, MonthEndView, EndingView | View | UI screens |

## 11. Extension points for full scope

Do not change for growth: the `Phase` interface, the `GameState` shape (add fields only), `EventBus` message names, the `EffectData` contract.
New activities, events, investments, skills, endings = new data files. New rules = small new system classes (for example MachineSystem, TutorialDirector, a DebtAccount subclass for flat-rate financing).

## 12. Open questions

- DEBT_START, DEBT_LIMIT and the debt fee model.
- Balancing sheet link (for the CSV import).
