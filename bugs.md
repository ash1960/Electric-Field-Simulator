# Bugs Log

Append-only log of non-trivial bugs encountered during development.
Format: `<Symptom> → <Root Cause> → <Fix> (<file:line> if applicable)`.
Skip trivial typos. Log only bugs that took more than one attempt or revealed a non-obvious assumption.

---

Density slider showed 50 px on load instead of DEFAULT_GRID_SPACING=25 px → `input[type=range]` gets browser default value=50 (midpoint of [0,100]) when `type='range'` is set before min/max; subsequent `.value=25` assignment did not override it in Playwright/Chromium → Fixed by using `slider.setAttribute('value', ...)` + `slider.value = ...` together, and adding `uiCb.onGridSpacingChange(DEFAULT_GRID_SPACING)` after `ui.init()` in main.js (`js/interaction/ui-controls.js`, `js/main.js`)
