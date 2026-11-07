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

- [ ] T1 — S1, S2, S3 (URL), S5 · inline · Vite + TS scaffold, engine and scenes port with per-scene loading, states from URL, Vitest + Playwright, docs.
- [ ] T2 — S3 (push), S4, S5 · inline · Dev plugin: push a state to connected devices, LAN URL + QR, e2e test, docs.
- [ ] T3 — all · delegated verifier · Risk item 5 (new npm dependencies and build pipeline): independent verification at feature end.

## Log

- **L1 (2026-11-07, user):** "yo te pasare textos y explicaciones y tu lo convertiras a lo que sea necesario. mucho del guion lo iremos improvisando pero sí te pasare una linea general para que sepas como necesitarás trabajar con los escenarios. ahora que ya definimos las tecnologias, vamos con lo siguiente más importante: necesitamos la capacidad de levantar la demo de una escena concreta en un estado concreto de forma rapida y sencilla cuando la pida para poder probarlo en el telegono. empieza creando las escenas que ya habia creado claude en su demo para usarlas de primera prueba de que funciona aqui"
- **L2:** Stack agreed in the previous turn: Vite 8, TypeScript, inkjs (deferred), vite-plugin-pwa (deferred), Vitest, Playwright via npm, Python art pipeline unchanged. Node v24.11.1 locally.
- **L3:** Demo bug found while porting: the street default spawn `[150,100]` lies outside the walkable polygon (y 127–165), so returning from the test field to the street left Jessica stuck. Fixed with a valid spawn.
