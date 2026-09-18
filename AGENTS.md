# AGENTS.md

Vanilla HTML5 Canvas clone of Asteroids. No build system, no dependencies, no tests, no package.json.

## Running / verifying
- Open `index.html` in a browser (double-click), or `npx serve .` → http://localhost:3000.
- There is no lint, typecheck, or test command. Verify manually in the browser.

## Code structure
- All game logic and rendering live in a single file: `game.js` (entities as classes + top-level state and `update(dt)`/`draw()` driven by `requestAnimationFrame`).
- `index.html` loads `game.js` as a classic script (`<script src="game.js">`), **not** a module. Do not add `import`/`export` — keep ES6 classes and top-level globals.
- Canvas size and constants `W = 800` / `H = 600` in `game.js:5-6` must stay in sync with the hardcoded `width`/`height` attributes in `index.html:23`.

## Conventions
- Comments, HUD strings (e.g. `NIVEL`, `PUNTAJE`), README, and git history are in **Spanish** — keep new code/UI text in Spanish.
- Fixed 800x600 canvas, white wireframe vector style (`strokeStyle '#fff'`, `lineWidth 1.5`), arcade controls: ←/→ rotate, ↑ thrust, Space shoot (Ship uses `justPressed` for edge-triggered shooting).