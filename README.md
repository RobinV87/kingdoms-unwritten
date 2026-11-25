# Kingdoms Unwritten

A browser-local fantasy world simulator. Milestone 1 creates a seeded 64×64 landscape and five settlements that produce and consume resources, experience seasons and food shortages, and change population and stability. Select a settlement on the map or from the list; drag to pan and scroll to zoom. Play, pause, choose a speed or advance days. The Chronicle records founded settlements, famine, recovery and population thresholds.

## Run

Requires Node 20.19+ or 22+. Run `npm ci`, `npm run dev`, `npm test`, and `npm run build`. `npm run test:browser` runs the Playwright smoke test after installing Chromium with `npx playwright install chromium`.

## GitHub Pages

Push to GitHub, then in Settings → Pages choose **GitHub Actions** as the build source. The workflow tests and builds on pushes to `main` and may also be run manually. Vite uses relative asset paths so the same build works at a project subpath. Enabling the workflow on a repository can publish the site; do not do so without approval.

## Saves

Use Worlds to create multiple named slots, load, export and import JSON. The current slot autosaves every 30 seconds after its first manual save; closing the tab pauses time. Storage is device and browser specific and can be cleared; export backups. Imports are validated before loading. Version 1 snapshots include all current world and random state. Existing saves are not automatically migrated from future versions.

## Scope and limitations

This is milestone 1. Terrain, settlement stocks, seasonal food production, consumption, famine, population and stability are simulated. Rivers are stylized, not a hydrological model. Population uses monthly aggregates. The map supports pan, zoom and settlement selection; terrain clicks, overlays and caravan rendering are future work. Observer interventions include a temporary harvest blessing and emergency food; influence replenishes seasonally. Towns autonomously request scarce resources, paying gold or bartering for goods that the other town needs. Deals reserve cargo and payment, then settle on arrival; gold markers move along land routes. Prices depend on stocks and local reserve targets, and travel increases the quoted cost. There are no migration, kingdoms or diplomacy yet. There is no offline progression. The simulation runs on the main thread; large advances may briefly pause rendering. Saves are local and validation is structural, not a security boundary. The development inspector and more comprehensive browser tests are future work. Subsequent milestones add economics, politics, interventions and long-run balancing after review.

A fun game!


## Trade limitations
A town checks shortages every 10 days and can participate in one active caravan. Reservations remove cargo and payment immediately; completion transfers them on arrival. Barter is chosen if the buyer lacks enough gold and can offer something the seller needs. Routes avoid water and charge extra travel time for difficult terrain. The travel surcharge is included in the seller's payment, rather than paid to a separate merchant. Caravans cannot be attacked or rerouted. Storage and production are aggregate approximations. Older saves receive a starting treasury when trade first advances.
