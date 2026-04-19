# Bugs Log

Append-only log of non-trivial bugs encountered during development.
Format: `<Symptom> → <Root Cause> → <Fix> (<file:line> if applicable)`.
Skip trivial typos. Log only bugs that took more than one attempt or revealed a non-obvious assumption.

---

`energy.js` referenced `particle.charge_C` but particle schema (`particle-manager.js`) stores `magnitude_nc + sign` — no `.charge_C` field exists → `computePotentialEnergy` returned NaN for all particles → Fixed: compute inline `q_C = magnitude_nc * sign * NC_TO_C` (`js/physics/energy.js:5`)

Color-bar title clipped off left canvas edge → rotated `"|E| (V/m)"` drawn at `BAR_X − 2 = 8 px` with 13 px font extends to x ≈ −5 → Fixed: `BAR_X: 10 → 30`, title offset `BAR_X−14` (`js/renderer/color-bar.js:3,47`)

Unit string `"V/m"` appeared in two separate files (`canvas-manager.js` and `color-bar.js`) — replacing only one left stale label → always `grep -rn "V/m"` across all renderer files before declaring a unit rename complete

Density slider showed 50 px on load instead of DEFAULT_GRID_SPACING=25 px → `input[type=range]` gets browser default value=50 (midpoint of [0,100]) when `type='range'` is set before min/max; subsequent `.value=25` assignment did not override it in Playwright/Chromium → Fixed by using `slider.setAttribute('value', ...)` + `slider.value = ...` together, and adding `uiCb.onGridSpacingChange(DEFAULT_GRID_SPACING)` after `ui.init()` in main.js (`js/interaction/ui-controls.js`, `js/main.js`)
