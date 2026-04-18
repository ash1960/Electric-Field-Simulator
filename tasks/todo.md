# Phase 1 — Physics Engine

**Branch:** `feature/phase-1-physics`
**Predecessor:** `feature/phase-0-scaffold` @ 4eb1d40

## Goal

Build the physics core. All SI units. No fudge constants. No DOM, no rendering, no presentation logic.

## Files to populate

### 1. `js/physics/vector.js` — `Vector2D`

Immutable 2D vector.
- `feature/phase-1-physics` check
- `constructor(x, y)`
- `add(v) → Vector2D` (new instance)
- `sub(v) → Vector2D`
- `scale(s) → Vector2D`
- `dot(v) → number` *(internal helper — needed by `distanceToSegment`; not in README spec but trivially required)*
- `magnitude() → number`
- `normalize() → Vector2D` — zero-safe (returns `Vector2D(0, 0)` if magnitude is 0)
- `angle() → number` — degrees, via `atan2`, range (−180, 180]
- `distanceToSegment(A, B) → number` — minimum distance from this point to segment AB
- `closestPointOnSegment(A, B) → Vector2D` — **added** for Phase 4 anti-tunneling (spec says Phase 4 will "interpolate exact capture point"; cheaper and cleaner to expose it here)
- `static fromAngle(deg, mag) → Vector2D`

### 2. `js/physics/constants.js`

Pure re-export of physics constants from `config.js`:
`K_COULOMB, R_MIN_M, R_CAPTURE_M, UC_TO_C, NC_TO_C, UG_TO_KG, PX_TO_M, PIXELS_PER_CM`.
Keeps physics modules decoupled from UI/canvas constants in config.

### 3. `js/physics/engine.js` — `FieldEngine`

- `computeFieldAt(x_px, y_px, charges[]) → {ex, ey, magnitude, angle_deg, pos_cm: {x, y}}`
  - Convert point px → m.
  - For each charge:
    - `Q_C = charge.magnitude_uc * charge.sign * UC_TO_C` **(signed, no flip on r̂)**
    - `r_vec = P_m − C_m`
    - `r = max(|r_vec|, R_MIN_M)`
    - `E_i_scalar = K_COULOMB * Q_C / r²` *(signed — sign of Q determines field direction)*
    - `r_hat = r_vec / r`
    - `E_i_vec = r_hat * E_i_scalar`
  - Superpose, return totals.
- `formatField(magnitude) → string` — scientific notation with Unicode superscripts (e.g., `"8.99 × 10⁵"`). Handles negative exponents via `⁻`.

### 4. `js/physics/energy.js`

- `computePotentialEnergy(particle, charges) → joules`
  - `U = Σᵢ K_COULOMB · Qᵢ_C · q_C / rᵢ_m` (rᵢ clamped to `R_MIN_M`, distances in meters)
  - Uses `particle.charge_C` (signed) and `particle.x_px, y_px`.
- `computeKineticEnergy(particle) → joules`
  - `K = ½ · particle.mass_kg · (vx² + vy²)`

### 5. `js/physics/grid-worker.js` — Web Worker

Self-contained (no ES6 imports).

- Inlined: minimal `Vector2D` ops (`sub`, `magnitude`), Coulomb math.
- `onmessage({charges, canvasW, canvasH, spacingPx})`:
  - Grid points centered in cells: `x = spacingPx/2 + i·spacingPx`, same for y.
    (At spacing=25 → 48×32 = 1,536 points, matching README spec.)
  - Compute E at each point (same signed-Q formula).
  - Track `maxMag`, `minMag` across all points.
  - `postMessage({grid: [{x_px, y_px, ex, ey, magnitude}, …], maxMag, minMag})`.
- **Viridis LUT inlining deferred** — not required for field computation; Phase 2 owns color mapping.

### 6. `js/main.js` — temporary bootstrap (Phase 3 will replace)

Minimal validation runner on page load:
1. Single charge: Q = +1 μC at (600, 400)px, probe (700, 400)px → expect |E| = 8.99×10⁵ V/m (assert <0.01% error).
2. Dipole symmetry: +5 μC at (450, 400), −5 μC at (750, 400), probe midpoint (600, 400) → expect |E| = 4.00×10⁶ V/m, θ = 0°.
3. Log `formatField(899000)` → `"8.99 × 10⁵"`.
4. Worker round-trip: post a one-charge config, log `{grid.length, maxMag, minMag}`.

Console output: `[Phase 1] ✅ validations passed` or detailed failure.

## Risks

- **Sign error in Coulomb formula.** Mitigation: validation #2 (dipole) explicitly tests that a negative charge produces field *toward* itself via signed Q, not via manual r̂ flip.
- **Angle convention.** `atan2` returns radians in (−π, π]. Must convert to degrees; document range. Validation #2 asserts `θ = 0°` (not 360° or −0°).
- **Worker grid-point spacing mismatch.** Centered cells (spacing/2 offset) vs edge-anchored. I'll use centered per arrow-renderer convention; if Phase 2 expects different, adjust there (not here).
- **Float32Array vs object array for grid transfer.** Using objects for clarity; can optimize in Phase 6 if profiling shows jank.
- **Unicode superscript mapping.** Must handle `-` in exponent (e.g., `10⁻³`). Test case: `formatField(0.00899)` → `"8.99 × 10⁻³"`.
- **Zero-magnitude normalize.** Must return `(0,0)`, not `NaN`. Covered by guard.

## Verification

Browser at `http://localhost:8080`:
- DevTools console shows `[Phase 1] ✅ validations passed`.
- No errors, no NaN warnings.
- Worker posts back within one frame for 1,536 points.

## Commit

`feat: SI physics engine + grid worker + energy` on `feature/phase-1-physics`. Do not merge to main until user confirms.
