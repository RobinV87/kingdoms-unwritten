# Kingdoms Unwritten

A browser-local fantasy world simulator. Milestone 1 creates a seeded 64×64 landscape and five settlements that produce and consume resources, experience seasons and food shortages, and change population and stability. Select a settlement on the map or from the list; drag to pan and scroll to zoom. Play, pause, choose a speed or advance days. The Chronicle records founded settlements, famine, recovery and population thresholds.

## Run

Requires Node 20.19+ or 22+. Run `npm ci`, `npm run dev`, `npm test`, and `npm run build`. `npm run test:browser` runs the Playwright smoke test after installing Chromium with `npx playwright install chromium`.

## GitHub Pages

Push to GitHub, then in Settings → Pages choose **GitHub Actions** as the build source. The workflow tests and builds on pushes to `main` and may also be run manually. Vite uses relative asset paths so the same build works at a project subpath. Enabling the workflow on a repository can publish the site; do not do so without approval.

## Saves

Use Worlds to create multiple named slots, load, export and import JSON. The current slot autosaves every 30 seconds after its first manual save; closing the tab pauses time. Storage is device and browser specific and can be cleared; export backups. Imports are validated before loading. Version 1 snapshots include all current world and random state. Existing saves are not automatically migrated from future versions.

## Scope and limitations

You rule one kingdom of five autonomous towns. Terrain, settlement stocks, seasonal food production, consumption, famine, population and stability are simulated. Rivers are stylized, not a hydrological model. Population uses monthly aggregates. The map supports pan, zoom and settlement selection; terrain inspection is future work. Royal decrees include a temporary harvest blessing and emergency food; influence replenishes seasonally. Towns autonomously request scarce resources, paying gold or bartering for goods that the other town needs. Deals reserve cargo and payment, then settle on arrival; wagon markers and highlighted routes show active caravans moving along land routes. Prices depend on stocks and local reserve targets, and travel increases the quoted cost. Migration and diplomacy between realms are future work. There is no offline progression. The simulation runs on the main thread; large advances may briefly pause rendering. Saves are local and validation is structural, not a security boundary. The development inspector and more comprehensive browser tests are future work. Subsequent milestones add economics, politics, interventions and long-run balancing after review.

A fun game!


## Trade limitations
A town checks shortages every 10 days and can participate in one active caravan. Reservations remove cargo and payment immediately; completion transfers them on arrival. Barter is chosen if the buyer lacks enough gold and can offer something the seller needs. Routes avoid water and charge extra travel time for difficult terrain. The travel surcharge is included in the seller's payment, rather than paid to a separate merchant. Caravans cannot be attacked or rerouted. Storage and production are aggregate approximations. Older saves receive a starting treasury when trade first advances.

Markets display each town’s stock and reserve target. Towns prioritize the greatest relative shortfall and may purchase a smaller quantity when their gold cannot cover a full order. A town below its target might still have to wait for an available seller, a passable route, or enough gold or suitable barter.


## Town overview and ruler controls
Select a settlement and choose Open town overview. Houses shelter four residents; unhoused residents reduce stability and births. A new house costs 30 timber, 15 stone, and 25 gold paid to household savings. Each 30-day month the town pays wages (up to 0.05 gold per resident) and collects a per-capita levy (the selected percentage of one gold per resident), both limited by available funds. Tax rates above 15% gradually reduce stability. Price policies set a 50–150% multiplier on a town's supply/demand trade asking prices; they affect new deals, not existing shipments or household retail prices. Older saves initialize these fields on their next simulated day. Homes are built by the player; there are no individual workers, age groups, household retail markets, public services, construction queues or migration yet. The screen does not simulate every need of a real city.

## Your reign

Start in the King’s Council. Select a town dispatch to govern its housing, taxes and markets. In Treasury, collect gold from a prosperous town, grant it to another or set a share of future tax receipts for the Crown. The royal treasury starts empty in both new and existing worlds. Reports keep the last twelve monthly accounts.

Worlds open paused. At 1× a day takes three seconds. Play pauses at each monthly council by default. Switch this off in Reports for uninterrupted play, or use the day and month buttons to step forward.
