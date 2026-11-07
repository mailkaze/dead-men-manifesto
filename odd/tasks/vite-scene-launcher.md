# Vite scene launcher

Objective: migrate the demo to the agreed stack (Vite + TypeScript, own canvas 2D engine, per-scene loading) and launch any scene in a given state quickly on the phone.
Branch: `feat/vite-scene-launcher` · Delivery: `single-pr` (solo project; push/PR are the user's decision) · Runners: Vitest (`npm test`), Playwright (`npm run test:e2e`).

## Specs

- **S1 — Agreed stack.** "ahora que ya definimos las tecnologias". Vite + TypeScript, own canvas 2D engine evolved from the demo, assets as separate files loaded per scene: "tal vez ir descargando lo necesario para cada escena cuando sea necesario en vez de una carga bestia al principio". "el 3d giratorio de momento queda descartado, lo que se ve en la demo esta bien." Assumption: Tiled is dropped (Claude defines polygons); the story format is decided later because "yo te pasare textos y explicaciones y tu lo convertiras a lo que sea necesario".
- **S2 — Demo scenes.** "empieza creando las escenas que ya habia creado claude en su demo para usarlas de primera prueba de que funciona aqui". Room, street (with traffic) and test field ported with the demo's behavior.
- **S3 — Scene in a given state.** "necesitamos la capacidad de levantar la demo de una escena concreta en un estado concreto de forma rapida y sencilla cuando la pida". Named states (scene, position, direction, flags), selectable by URL, and pushable by Claude to an already open device.
- **S4 — Phone testing.** "para poder probarlo en el telegono". Dev server reachable on the LAN with a stable URL and a QR code.
- **S5 — Verification (CLAUDE.md).** "Antes de dar algo por terminado, ábrelo en un navegador sin interfaz (Playwright), revisa los errores de consola y mira capturas de los estados afectados."

## Tasks

- [x] T1 — S1, S2, S3 (URL), S5 · inline · Vite + TS scaffold, engine and scenes port with per-scene loading, states from URL, Vitest + Playwright, docs. Commit `0018148`. RED: `stateFromQuery` tests failed with missing module, then 8/8 GREEN. Street-spawn regression test fails with the demo's `[150,100]` and passes with the fix. RDD assess: medium, `under_budget`.
- [x] T2 — S3 (push), S4, S5 · inline · Dev plugin: push a state to connected devices, LAN URL + QR, e2e test, docs. Commit `f91f547`. RED: `/__dev/goto` returned index.html, then GREEN. RDD assess: medium, `under_budget`.
- [x] T3 — all · delegated verifier · Risk item 5 (new npm dependencies and build pipeline): independent verification at feature end. Verdict: S1–S5 pass, no blockers. Fixes for advisories 1–2 are in the closing commit.

## Log

- **L1 (2026-11-07, user):** "yo te pasare textos y explicaciones y tu lo convertiras a lo que sea necesario. mucho del guion lo iremos improvisando pero sí te pasare una linea general para que sepas como necesitarás trabajar con los escenarios. ahora que ya definimos las tecnologias, vamos con lo siguiente más importante: necesitamos la capacidad de levantar la demo de una escena concreta en un estado concreto de forma rapida y sencilla cuando la pida para poder probarlo en el telegono. empieza creando las escenas que ya habia creado claude en su demo para usarlas de primera prueba de que funciona aqui"
- **L2:** Stack agreed in the previous turn: Vite 8, TypeScript, inkjs (deferred), vite-plugin-pwa (deferred), Vitest, Playwright via npm, Python art pipeline unchanged. Node v24.11.1 locally.
- **L3:** Demo bug found while porting: the street default spawn `[150,100]` lies outside the walkable polygon (y 127–165), so returning from the test field to the street left Jessica stuck. Fixed with a valid spawn.
- **L4:** T1 is about 1,426 added and 699 deleted authored lines (lock file excluded), above the 400-line heuristic. A port of a single dense file cannot be split into independently working units; most deletions are the generated `index.html` and the ported `game.html`.
- **L5:** Evidence: `tsc` clean. Vitest 8/8. Playwright 10/10 on Pixel 7 emulation, with screenshots of every preset in `screenshots/`. The room matches the original demo's screenshot pixel-for-pixel apart from typewriter progress. LAN check through `http://192.168.18.100:5173`: curl push reached 1 device, the page jumped to `?state=street&x=300`, traffic renders, no console errors. The production build has no `dmm:goto` code. Main chunk is 215 kB (21 kB gzip); each scene has its own chunk.
- **L6:** Next step: T3 independent verifier (Risk item 5).
- **L7:** Verifier (scratch clone at `f91f547`):
  - Results: `npm ci` 0 vulnerabilities; tsc clean; Vitest 8/8; Playwright 10/10. Seeded, frozen-clock parity against the baseline demo is identical at 14 of 15 checkpoints; the one mismatch is the intended street-spawn fix.
  - Loading: the field chunk is never requested from the room, street assets are prefetched, and the build works from a sub-path. The fade waits while a scene is delayed and returns to the room when the load fails.
  - Fixed advisories: (1) the README Node requirement is now 22.12+, because Vitest 5 needs it; (2) the push handler could leave the origin when the page was opened at `//host/` paths. It now sets `location.search` only, pinned by an e2e test (RED, then GREEN; 11/11).
  - Open advisories: URL positions are not validated against the walkable area; failed scene loads retry with no backoff; a failed first load leaves a black screen with no message; the repo root is no longer a static site, so if GitHub Pages serves `main`, merging breaks it and a build workflow is needed; the dev server exposes project files to the LAN (documented); the QR uses the first network interface.
- **L8 (2026-11-07, user):** "vi que la atribución del primer commit esta como claude, obviamente debe ir todo a mi nombre en git". With the user's approval, the root commit was rewritten without the `Co-Authored-By`/`Claude-Session` trailers (same tree, author and dates) and force-pushed to `origin/main` with a lease. The branch was rebased; hashes above are updated (old `0b50ab0`→`e6f824d`, `7253bd0`→`0018148`, `592fd0d`→`f91f547`, `61ecda4`→ the closing commit, amended with this note).
