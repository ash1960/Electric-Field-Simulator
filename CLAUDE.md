# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Electric Field Simulator** — a single-page, zero-dependency (except vendored uPlot) interactive physics tool for university-level electrostatics. Deployed on GitHub Pages as a static site.

- No build step. No npm. No bundler. Pure ES6 modules served directly.
- Canvas 1200 × 800 px = 120 cm × 80 cm (1 px = 1 mm = 10⁻³ m)
- All physics in exact SI units. No fudge constants.

## Running Locally

ES6 modules require HTTP (not `file://`). Use any local static server:

```bash
python -m http.server 8080
# or
npx serve .
```

Open `http://localhost:8080` in Chrome/Edge/Firefox.

## Architecture

Three decoupled layers — physics never touches the DOM; renderers never compute physics.

### Data Flow

```
ui-controls.js → main.js (orchestrator) → physics/ + renderer/ + interaction/
```

`main.js` owns all mutable state: `charges[]`, `particles[]` (max 3), `gridResult` (from Worker), `paused`, `timeScale`, `selectedId/Type`, `scrubTimestamp`.

The render loop (`requestAnimationFrame`) in `main.js`:
1. If `needsGridRecompute`: post to `grid-worker.js` (2× spacing during drag, full otherwise)
2. If `!paused`: call `particlePhysics.step()` for each `'moving'` particle
3. Compute probe field at `mousePos` (if not dragging)
4. `canvasManager.render(all state)` — single call renders everything
5. If `showEnergyPanel`: `energyPanel.update(particles)`

### Physics Layer (`js/physics/`)

- **`engine.js`** — `computeFieldAt(x_px, y_px, charges[])`: converts px → m, applies Coulomb superposition with **signed Q** (no manual sign flip on r̂), singularity clamp at r_min = 2 cm. Returns `{ex, ey, magnitude, angle_deg, pos_cm}`.
- **`particle-physics.js`** — Velocity Verlet integration, 50 sub-steps/frame. Anti-tunneling via segment-to-charge distance check each sub-step. Capture triggers when `segDist < R_CAPTURE = 3 cm`.
- **`energy.js`** — `computeU`: Coulomb pair-sum `Σ k·Qᵢ·q/rᵢ`. `computeK`: `½mv²`. Both return joules.
- **`grid-worker.js`** — Web Worker (self-contained, no ES6 imports). Includes inlined Vector2D, Coulomb math, and Viridis LUT. Receives `{charges, canvasW, canvasH, spacingPx}`, posts back `{grid, maxMag, minMag}`.
- **`vector.js`** — Immutable `Vector2D`. Key method: `distanceToSegment(A, B)` used by anti-tunneling.

### Renderer Layer (`js/renderer/`)

`canvas-manager.js` owns render ordering — sequence matters:
1. Clear + background grid → 2. Color bar → 3. Field arrows → 4. Particle trails → 5. Charges + labels → 6. Particles + F⃗/v⃗ → 7. Scale bar → 8. Probe overlay → 9. Scrub crosshair → 10. Fullscreen button → 11. Help button

Arrow sizing is tied to `gridSpacing` to prevent overlap:
```
MAX_ARROW = gridSpacing × 0.7
MIN_ARROW = gridSpacing × 0.2
length = MIN + (MAX − MIN) × log₁₀(1 + |E|/maxMag × 99) / 2
```

Viridis color mapping: `t = log₁₀(1 + |E|/maxMag × 999) / 3`, `alpha = 0.25 + t × 0.7`.

`energy-panel.js` manages the uPlot instance (bottom drawer). Scrub callback fires → `main.js` stores `scrubTimestamp` → `canvas-manager` draws crosshair; trail segments after scrub timestamp are dimmed to alpha × 0.2.

### Interaction Layer (`js/interaction/`)

- **`drag-manager.js`** — Hit-tests charges then particles. Sets `isDraggingCharge` to trigger sub-sampled grid during drag. Shift+drag = axis lock.
- **`ui-controls.js`** — Emits named callbacks (`onChargeAdd`, `onParticleAdd`, etc.) consumed by `main.js`. Updates IN come via explicit calls (`updateChargeCount`, `showChargeProperties`, etc.).

## Core Principles

- **Config as source of truth.** Every dimension, count, and domain value derives from `config.js` at runtime. Hardcoded magic numbers outside `config.js` are a bug.
- **Explicit over implicit.** Use clear, traceable models. Never hide computation inside a helper that silently falls back. If something is computed, show the computation.
- **Decoupled layers.** Physics returns pure data. Display logic (colors, arrow sizing, trail alpha) belongs exclusively in the renderer. Never let presentation concerns bleed into `physics/`.
- **Authoritative membership.** When iterating over "all charges" or "all particles," derive the list from the state arrays in `main.js` — never from keys of an incoming event or message dict.
- **Compute, don't store.** Derived values (field vectors, colors, arrow lengths) are computed at render time. Storing them alongside state creates desync.

## Key Constants (`js/config.js`)

All physics constants are MKS/SI. Authoritative table:

```javascript
CONSTANTS = {
  K_COULOMB:  9e9,        // Coulomb's constant   [N·m²/C²]
  EPSILON_0:  8.85e-12,   // Vacuum permittivity  [F/m]
  E_CHARGE:   1.602e-19,  // Elementary charge    [C]
  M_PROTON:   1.67e-27,   // Proton mass          [kg]
  M_ELECTRON: 9.11e-31,   // Electron mass        [kg]
}

UNITS = {
  force:          'Newton (N)',
  electric_field: 'N/C',
  charge:         'Coulomb (C)',
  mass:           'kg',
  energy:         'Joule (J)',
}
```

Other runtime knobs:

```javascript
PIXELS_PER_CM: 10,   PX_TO_M: 1e-3
R_MIN_M: 0.02,       R_CAPTURE_M: 0.03
UC_TO_C: 1e-6,       NC_TO_C: 1e-9,   UG_TO_KG: 1e-9
MAX_CHARGES: 10,     MAX_PARTICLES: 3
SUB_STEPS: 50,       MAX_TRAIL_SECONDS: 10
DEFAULT_GRID_SPACING: 25   // px, range 15–50
PARTICLE_COLORS: ['#00ff88', '#ff6fff', '#ffaa00']
```

Config is the single source of truth. No hardcoded magic numbers outside `config.js`.

## Critical Physics Invariant

Q enters the Coulomb formula **with its sign**:
```
E⃗ᵢ = K_COULOMB * (magnitude_uc * sign * 1e-6) / r² * r̂
```
**Do not flip r̂ based on sign.** The signed Q handles direction automatically. Violations produce inverted field arrows for negative charges.

## Naming Conventions

Variable suffixes are mandatory for unit clarity:
- `_px` = pixels, `_m` = meters, `_ms` = m/s, `_C` = coulombs
- `_uc` = microcoulombs, `_nc` = nanocoulombs, `_kg` = kilograms

## Development Workflow

1. **Load context** — read the latest `.sessions/` handoff file and `bugs.md` before starting any task. Never assume the previous session left things in a known state.
2. **Explore** — use targeted `grep -C 5` or symbol lookup before reading full files.
3. **Plan** — write plan to `tasks/todo.md` listing files to change and risks. Stop and wait for approval.
4. **Implement** — follow the approved plan exactly. Mark items complete as you go.
5. **Verify** — open the browser and test visually. Screenshot or live interaction is the minimum bar for canvas UI work. "The code looks correct" is not sufficient.

**Never declare a feature complete without visual proof in the browser.**

**Always verify and merge the previous phase before starting the next one.**

**Never commit without explicit user request.**

## Git 
- https://github.com/ash1960/Electric-Field-Simulator.git

- Every task gets its own branch: `feature/<task>` or `bugfix/<task>`. Never commit directly to `main`.
- Commit message format: `type(scope): description` (e.g., `feat(renderer): add scrub crosshair`).
- Require explicit user confirmation before: `push --force`, merge to `main`, branch deletion.
- Convert all relative dates in session notes to absolute dates (e.g., "Thursday" → "2026-04-24").
- No AI attribution (`Co-Authored-By`, "Generated with Claude Code") in commits or PRs.

## Windows Development

- Never pass `/FLAG`-style arguments through bash. Git Bash mangles `/FLAG` to a file path. Use `subprocess.run(['tool', '/FLAG', value])` if invoking Windows CLI tools from Python.
- Never kill a server process by name (`taskkill //IM node.exe`). This kills every instance system-wide. Always kill by port PID.

## Error Handling

- When a command fails, read the error and diagnose the root cause before switching tactics.
- Explain the root cause before proposing an alternative. Never silently pivot.
- Do not use destructive shortcuts (`--no-verify`, `--force`, `rm -rf`) to bypass failures. Investigate the underlying issue.
- A passing browser load does not guarantee the correct code is running. A working-tree edit does nothing until the file is saved and the page reloaded. Always hard-refresh (`Ctrl+Shift+R`) after edits.
- **ES6 module cache:** Browsers cache ES6 modules per-origin across navigations. After adding or renaming an export, always navigate with a cache-busting query param (`?v=N`) or `Ctrl+Shift+R`. If the browser reports "module does not export X" but the file clearly has it, suspect the cache before doubting the code.
- **Playwright MCP browser recovery:** If `browser_navigate` returns "Target page, context or browser has been closed", call `browser_close` first (clears the dead session), then `browser_navigate` again. Do not call `ToolSearch` repeatedly — the browser state, not the tool schema, is what needs resetting.

## Token & Context Management

- Prefer `grep -C 5` over reading full files. Open a full file only when targeted search is insufficient.
- Run `/compact` at approximately 50% context window. Use `/clear` when switching to an unrelated task.
- Do not re-read a file already in context.

## Response Style

- Do not narrate or summarize code just written. The user can read the diff.
- Do not add features, refactors, or "improvements" beyond what was explicitly requested.
- Do not add comments, docstrings, or type annotations to code that wasn't changed.

## End-of-Session Protocol

Run this checklist at the end of every session. No session is complete without it.

**1 — Session Handoff File** — create `.sessions/YYYY-MM-DD.md` (suffix `b`, `c`… for multiple sessions per day):
- Phase & branch — phase name, branch, last commit hash
- What Was Built — bullet list of files changed and what each does
- Verified — what was tested and how (browser visual, console validation)
- Open Items — anything blocked, deferred, or needing follow-up
- Stack Reminder — `python -m http.server 8080`

**2 — Bugs Log (`bugs.md`)** — for every non-obvious bug encountered, append:
```
<Symptom> → <Root Cause> → <Fix> (<file:line> if applicable)
```
Skip trivial typos. Log only bugs that took more than one attempt or revealed a non-obvious assumption.

**3 — Lessons Log (`tasks/lessons.md`)** — for every lesson learned, append:
```
[YYYY-MM-DD] <Mistake> → <Root Cause> → <Rule added>
```
Lessons must produce an actionable rule.

**4 — README** — if the session introduced user-visible changes (new feature, changed UX), update `README.md` to reflect current state. Keep it accurate, not aspirational.

**5 — Token Efficiency Audit** — before closing, ask: did any action this session waste tokens unnecessarily?
- Did you read a full file when `grep -C 5` would have sufficed?
- Did you re-read a file already in context?
- Did you spawn an agent for a task you could have done inline?

Log any worth correcting as a lesson tagged `[token-efficiency]`.

## Deployment

```bash
git remote add origin https://github.com/<user>/e-field-sim.git
git push -u origin main
# GitHub Settings → Pages → Source: main branch, / (root)
```

## Validation Reference

For smoke-testing physics correctness in browser console:
```
Q=1μC at (600,400)px, probe at (700,400)px → E = 9.00×10⁵ V/m
Dipole: +5μC at (450,400)px, −5μC at (750,400)px, probe at midpoint (600,400)px
  → E_total = 4.00×10⁶ V/m, θ = 0.0°
```
