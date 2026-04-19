# Lessons Log

Append-only log of lessons learned. Every lesson must produce an actionable rule.
Format: `[YYYY-MM-DD] <Mistake> → <Root Cause> → <Rule added>`.

---

[2026-04-18] Wrote `U = 8.99×10⁻²` as the expected energy in the Phase 1 validation, off by a factor of 1000. → Mental arithmetic on `k·Q·q/r = 8.99e9 · 1e-6 · 1e-9 / 0.1` skipped a power of ten when chaining the exponents. → **Rule:** Whenever an expected SI value combines four or more powers of ten, write the exponent arithmetic out longhand in the source comment (`8.99e9 · 1e-6 · 1e-9 / 0.1 → 8.99e-5`) before typing the assertion. The comment doubles as the regression-proof of the test.

[2026-04-18] [token-efficiency] Read all 1,225 lines of `README.md` during `/sc:load` when only the "Phase 0/1" sections and the architecture diagram were needed. → Defaulted to `Read` instead of using `Grep -C 5` for targeted lookup, because the file was already the "authoritative" doc. → **Rule:** For files >300 lines, never `Read` whole; first `Grep -C 5` for the section needed (e.g. `^## Phase 1`, `### File Structure`). `Read` the full file only after grep proves the answer is scattered across many sections.

[2026-04-18] `input[type=range]` initialized to max value (50) despite `slider.value = 25` assignment. → Browser sets range default to midpoint of its own [0,100] default when `type='range'` is first applied; subsequent `.min/.max` assignments don't re-clamp to intended default, and `slider.value = value` may not override if the browser has already settled on max. → **Rule:** After creating an `input[type=range]`, always set min/max/step first, then verify the effective value via `parseFloat(slider.value)` after assignment. If it doesn't match, use `requestAnimationFrame(() => slider.value = value)` or call `slider.dispatchEvent(new Event('change'))` to force re-render without triggering callbacks.

[2026-04-19] Referenced `particle.charge_C` in `energy.js` without checking the actual particle schema → particle-manager.js stores `magnitude_nc + sign`, not a pre-computed `charge_C` → **Rule:** Before writing any function that consumes an object from another module, read that module's constructor/factory first to confirm the exact field names. Never infer schema from a spec doc alone.

[2026-04-19] Declared unit rename ("V/m → N/C") complete after updating `canvas-manager.js`, but `color-bar.js` had its own hardcoded `"V/m"` string → user saw stale label in the browser → **Rule:** For any string that could appear in multiple renderer files, always `grep -rn "old_string" js/` before closing the task. One-file fixes for cross-cutting concerns are almost always incomplete.

[2026-04-19] [token-efficiency] Attempted `browser_console_messages` tool before loading its schema via ToolSearch, causing an InputValidationError and a wasted round-trip → **Rule:** Check the deferred-tools reminder at conversation start; any tool not already loaded needs `ToolSearch select:ToolName` before calling it.

[2026-04-18] Browser showed "module does not export CHARGE_RADIUS_PX" even though the file was correct on disk. Wasted time restarting the server and doubting the code. → ES6 modules are cached per-origin by the browser. The previous session had loaded `config.js` without `CHARGE_RADIUS_PX`; that cached copy was reused. → **Rule:** After adding exports to a module, always navigate with a cache-busting query param (`?v=N`) or `Ctrl+Shift+R` before concluding the code is wrong. The first instinct should be "browser cached an old module", not "the file is wrong".
