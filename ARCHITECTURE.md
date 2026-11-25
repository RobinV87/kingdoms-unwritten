# Architecture

A world is a serializable value containing its seed, RNG state, tile grid, settlements, clock and structured events. `engine/world.ts` owns world generation and fixed daily simulation and has no browser dependencies. Geography determines production; stocks buffer seasonal food deficits; hunger changes stability and monthly demographics. React schedules whole logical days and displays state. Pixi renders the map independently. Dexie stores complete world snapshots in versioned IndexedDB records. The minimal loop is: generate a seed, inspect settlements, advance time, observe production and consequences, then save or export and resume.

Daily updates must be deterministic and independent of frame rate. Simulation code never uses `Math.random`. Stocks never go below zero, and resource storage and population are capped. Saves must be validated before use. Later systems should be added to the engine as explicit state transitions, not UI effects.
