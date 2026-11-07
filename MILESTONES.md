# Milestones (game jam overhaul)

Status values: `Not started` · `Approved` (user says go) · `In progress` · `Review` (Claude done, waiting for user) · `Done` (user accepted).

Rule: Claude works only on the milestone that is `Approved` or `In progress`. After its exit criteria pass, Claude sets it to `Review`, reports, and stops. The user sets `Done` and approves the next one.
The pre-overhaul milestones M0-M7 and their results are on branch `backup/pre-overhaul-2026-11-07`.

| # | Milestone | Status |
| --- | --- | --- |
| J1 | Jam rules, logic and headless bot | Review |
| J2 | Jam screens (style board v3) | Review |
| J3 | 3D City View with Kenney placeholders | Review |
| J4 | Playtest, balance targets, polish | Not started |
| J5 | Jam build and handoff (deadline 15 Nov 2026) | Not started |

---

## J1 Jam rules, logic and headless bot

Scope: SPECS sections 1-6. Two months, weekly Plan/Do/Check, Act at month end, retrospective.
Exit criteria:
- `npm test` passes (loop, actions, economy, debt carry-over).
- `npm run sim -- --runs 20` ends every run at the retrospective after 8 weeks.

Result:
- 13 logic tests pass. 20 bot runs reach the retrospective (avg: gold 1,718, debt 2,194, 458 sold, goals 99%).
- Open: balance targets are not set (placeholders).

## J2 Jam screens (style board v3)

Scope: SPECS section 7. Start menu, story, Journal (Plan, Ledger, Market, Stock, Skills, Log), Review plan, HUD, town map,
all station windows, event card, Check, Act, retrospective.
Exit criteria:
- `npm run test:browser` walks the whole flow with no page error.
- Screenshots at 1280x720 and 1920x1080 in `out/browser/`.

Result:
- The flow test passes at both sizes (24 screens each).
- Open: placeholder icons; text sizes need a playtest check.

## J3 3D City View with Kenney placeholders

Scope: SPECS section 8.
Exit criteria:
- The town loads with no missing model; the camera moves to each place; day and moon light.
- Only used GLB files are committed, with each kit's License.txt.

Result:
- Home, market, guild and outskirt areas, 4 walkers and the player (Mini Characters, walk and idle clips).
- Open: Furniture and Factory kits are not used (no 3D interiors in the jam build).

## J4 Playtest, balance targets, polish

Scope: play two months by hand, set balance targets with the user, tune numbers, fix UX issues.

## J5 Jam build and handoff

Scope: `npm run build`, upload, short how-to-play, known issues.
