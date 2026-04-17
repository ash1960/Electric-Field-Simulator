# ⚡ Electric Field Simulator

## Overview

An interactive demonstration tool for university-level electrostatics (Physics II).
Place point charges in a 2D domain, visualize the resulting electric field in real SI units, and observe test-particle dynamics in real time.

**Use case:** Lecture demonstrations, self-study  
**Deployment:** Single URL on GitHub Pages — no installation  
**Accuracy:** Coulomb's law + superposition + Newton's second law, full SI units

**Live:** `https://<username>.github.io/e-field-sim/`

---

## Physical Model

### SI Units

| Quantity | Unit | Simulation range | Notes |
|----------|------|-------------------|-------|
| Fixed charge Q | μC (microcoulomb) | ±1 to ±10 μC | Realistic electrostatic scale |
| Distance | cm | 0–120 × 0–80 cm | Canvas = 120 cm × 80 cm |
| Electric field E | V/m | Configuration-dependent | Exact SI in probe readout |
| Coulomb constant k | N·m²/C² | 8.99 × 10⁹ | Exact SI value |
| Test-particle charge q | nC | ±0.1 to ±10 nC | Slider, default 1 nC |
| Test-particle mass m | μg | 0.1 to 100 μg | Log slider, default 10 μg |
| Potential energy U | J | Computed | Pair-sum Coulomb potential |
| Kinetic energy K | J | Computed | ½mv² |

### Scale Factor

```
PIXELS_PER_CM = 10
→ Canvas 1200 × 800 px = 120 cm × 80 cm
→ 1 pixel = 1 mm = 10⁻³ m
```

### Field Computation

**Single point charge:**
```
E⃗ᵢ(P) = k · Qᵢ / rᵢ² · r̂ᵢ
```

> **Critical:** Q enters the formula **with its sign**.  
> Q > 0 → E⃗ points away from the charge.  
> Q < 0 → E⃗ points toward the charge.  
> **No manual sign flip on r̂.**

**Superposition:**
```
E⃗(P) = Σᵢ E⃗ᵢ(P)
```

**Singularity clamp:** r_min = 2 cm.

### Test-Particle Dynamics

Test-particle assumption: q is negligible — it does not alter the field, only responds to it.

**Equations of motion:**
```
F⃗ = q · E⃗(x, y)
a⃗ = F⃗ / m
```

**Integration method: Velocity Verlet**

Selected for its symplectic (energy-conserving) properties and simplicity:
```
x⃗(t+dt) = x⃗(t) + v⃗(t)·dt + ½·a⃗(t)·dt²
a⃗(t+dt) = F⃗(x⃗(t+dt)) / m
v⃗(t+dt) = v⃗(t) + ½·(a⃗(t) + a⃗(t+dt))·dt
```

**Sub-stepping:** 50 Verlet steps per frame at 60 fps.

**Time scaling:** Logarithmic slider (10⁻⁶ to 10⁻²), default 10⁻⁴.

**Anti-tunneling — Line Segment Intersection:**

A particle under extreme acceleration may leap past a charge's capture radius in a single sub-step. Simple distance checks fail in this case. The solution:

```
For each sub-step:
  segment = line from (x_prev, y_prev) to (x_next, y_next)
  For each fixed charge:
    d = minimum distance from segment to charge center
    if d < R_CAPTURE:
      interpolate exact capture point on segment
      trigger capture at that point
```

This guarantees no particle tunnels through a charge regardless of velocity.

**Capture behavior:**
- Condition: segment-to-charge distance < R_CAPTURE = 3 cm
- Visual: trail terminates smoothly inside the charge circle — no flash, no text, no gamification
- Particle is removed from the simulation

**Energy tracking (continuous, in background):**
```
U(t) = Σᵢ k · Qᵢ · q / rᵢ(t)      Coulomb potential energy (pair-sum)
K(t) = ½ · m · |v⃗(t)|²              Kinetic energy
E(t) = U(t) + K(t)                  Total mechanical energy
```

Recorded every sub-step into a circular buffer retaining the last 10 seconds of simulation time.

### Verification

```
Given: Q₁ = +5 μC at (45, 40) cm,  Q₂ = −5 μC at (75, 40) cm
Probe point: (60, 40) cm — dipole midpoint

r₁ = r₂ = 15 cm = 0.15 m
E₁ = E₂ = (8.99×10⁹)(5×10⁻⁶) / (0.15)² = 2.00×10⁶ V/m

Both vectors point in the +x direction.
E_total = 4.00×10⁶ V/m, θ = 0.0°
```

---

## Architecture

### Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Rendering | HTML5 Canvas | Main simulation view |
| Energy graphs | uPlot | Lightweight, 60 Hz–capable canvas charting |
| UI | Vanilla JS + CSS3 | Zero-dependency, LTR English |
| Physics engine | ES6 module | Isolated from DOM |
| Grid computation | Web Worker | Off-main-thread for drag performance |
| Deployment | GitHub Pages | Single URL, no build step |

### Data Models

**Charge (fixed):**
```javascript
{
  id: string,
  x_px: number,          // 0–1200
  y_px: number,          // 0–800
  magnitude_uc: number,  // always positive, 1–10
  sign: +1 | -1
}
// Derived: q_signed_C = magnitude_uc * sign * 1e-6
```

**TestParticle:**
```javascript
{
  id: string,
  x_px: number,
  y_px: number,
  vx_ms: number,           // m/s
  vy_ms: number,
  mass_kg: number,
  charge_C: number,         // signed
  magnitude_nc: number,     // always positive
  sign: +1 | -1,
  drop_x_px: number,        // for reset
  drop_y_px: number,
  trail: [{                  // circular buffer, max ~600 entries (10s)
    timestamp: number,       // seconds since release
    x_px: number,
    y_px: number,
    U: number,               // joules
    K: number,               // joules
    E_total: number          // joules
  }],
  state: 'held' | 'moving' | 'captured' | 'exited',
  color: string
}
```

### File Structure

```
e-field-sim/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js                      # Orchestrator
│   ├── config.js                    # Constants and defaults
│   │
│   ├── physics/                     # ── BACKEND ──
│   │   ├── vector.js                # Vector2D (immutable)
│   │   ├── engine.js                # computeFieldAt()
│   │   ├── constants.js             # k, r_min, conversions
│   │   ├── particle-physics.js      # Verlet stepper + anti-tunneling
│   │   ├── energy.js                # U, K, E computation
│   │   └── grid-worker.js           # Web Worker: computeGrid()
│   │
│   ├── renderer/                    # ── FRONTEND ──
│   │   ├── canvas-manager.js        # Canvas init, render orchestration
│   │   ├── arrow-renderer.js        # Field arrows (log scale)
│   │   ├── charge-renderer.js       # Charge circles + labels
│   │   ├── color-map.js             # Viridis LUT
│   │   ├── color-bar.js             # Legend bar
│   │   ├── particle-renderer.js     # Particle + trail + F⃗/v⃗ vectors
│   │   └── energy-panel.js          # uPlot graph + drawer + sync
│   │
│   └── interaction/                 # ── UI ──
│       ├── drag-manager.js          # Drag charges + particles
│       ├── probe.js                 # Field probe (mouse)
│       ├── particle-manager.js      # Particle lifecycle
│       ├── keyboard.js              # Shortcuts
│       ├── ui-controls.js           # Control panel
│       └── help-overlay.js          # "?" usage guide
│
├── lib/
│   └── uPlot.min.js                # uPlot library (vendored)
│   └── uPlot.min.css
│
├── .gitignore
└── README.md
```

### Module Contracts

```
┌─ ui-controls.js ──────────────────────────────────┐
│ Events OUT:                                        │
│   onChargeAdd({magnitude_uc, sign})                │
│   onChargeDelete(chargeId)                         │
│   onChargeUpdate(chargeId, {magnitude_uc?, sign?}) │
│   onPresetLoad(presetName)                         │
│   onGridSpacingChange(spacingPx)                   │
│   onClearAll()                                     │
│   onParticleAdd()                                  │
│   onParticleReset(particleId | 'all')              │
│   onParticleRemove(particleId)                     │
│   onParticleUpdate(id, {magnitude_nc?, sign?,      │
│                         mass_ug?})                 │
│   onTimeScaleChange(timeScale)                     │
│   onToggleVectors(show: boolean)                   │
│   onToggleEnergyPanel(show: boolean)               │
│   onTogglePause(paused: boolean)                   │
│                                                    │
│ Updates IN:                                        │
│   updateChargeCount(n, totalQ_uc)                  │
│   updateParticleCount(n)                           │
│   showChargeProperties(charge | null)              │
│   showParticleProperties(particle | null)          │
│   setPauseState(paused)                            │
└────────────────────────────────────────────────────┘
         │
         ▼
┌─ main.js (orchestrator) ──────────────────────────┐
│ State:                                             │
│   charges[], particles[] (max 3)                   │
│   selectedId, selectedType                         │
│   gridSpacingPx (default 25)                       │
│   needsGridRecompute (flag)                        │
│   gridResult (from Worker)                         │
│   timeScale (default 1e-4)                         │
│   showForceVectors, showEnergyPanel                │
│   paused (boolean)                                 │
│   mousePos, isDragging, isDraggingCharge           │
│                                                    │
│ Render loop (requestAnimationFrame):               │
│   if (needsGridRecompute)                          │
│     → post to gridWorker (full spacing)            │
│     OR if isDraggingCharge                         │
│     → post to gridWorker (spacing × 2 = subsample)│
│     → on Worker response: gridResult = msg.data    │
│                                                    │
│   if (!paused)                                     │
│     for each moving particle:                      │
│       particlePhysics.step(...)                     │
│                                                    │
│   probeResult (if mouse active, not dragging)      │
│                                                    │
│   canvasManager.render(all state)                  │
│   if (showEnergyPanel)                             │
│     energyPanel.update(particles)                  │
└────────────────────────────────────────────────────┘
     │              │                 │
     ▼              ▼                 ▼
┌─ engine.js ─┐ ┌─ grid-worker.js ─┐ ┌─ particle-physics.js ──┐
│ computeField│ │ onmessage:       │ │ step(particle, charges,│
│ At(x,y,     │ │  {charges, W, H, │ │   timeScale, subSteps) │
│  charges)   │ │   spacing}       │ │                        │
│ → {ex, ey,  │ │ → compute grid   │ │ For each sub-step:     │
│  magnitude, │ │ → postMessage    │ │  Verlet integration    │
│  angle_deg, │ │   ({grid, maxMag,│ │  Energy recording      │
│  pos_cm}    │ │     minMag})     │ │  Anti-tunneling check  │
│             │ │                  │ │  Capture / exit check  │
│ formatField │ │ Self-contained:  │ │                        │
│ (mag) → str │ │  includes Vector │ │ Returns updated state  │
│             │ │  + Coulomb math  │ │                        │
└─────────────┘ └──────────────────┘ └────────────────────────┘
                                              │
                                              ▼
                                     ┌─ energy.js ──────────┐
                                     │ computeU(particle,   │
                                     │   charges) → joules  │
                                     │ computeK(particle)   │
                                     │   → joules           │
                                     └──────────────────────┘

┌─ canvas-manager.js ──────────────────────────────┐
│ render(charges, gridResult, probeResult,          │
│        particles, selectedId, selectedType,       │
│        gridSpacing, showVectors, scrubTimestamp)   │
│                                                   │
│ Render order:                                     │
│  1. Clear + background grid                      │
│  2. Color bar (Viridis legend)                   │
│  3. Field arrows                                 │
│  4. Particle trails (time-synced fade)           │
│  5. Charges + labels                             │
│  6. Particles + F⃗/v⃗ vectors                     │
│  7. Scale bar                                    │
│  8. Probe overlay                                │
│  9. Scrub crosshair (if scrubbing)               │
│ 10. Fullscreen button                            │
│ 11. Help button "?"                              │
└───────────────────────────────────────────────────┘

┌─ energy-panel.js ────────────────────────────────┐
│ Bottom drawer (hidden by default)                 │
│                                                   │
│ init():                                           │
│   Create uPlot instance                           │
│   Series: U (potential), K (kinetic), E (total)   │
│   Interactive legend: click label to toggle series │
│                                                   │
│ update(particles):                                │
│   Feed latest trail data from active particle     │
│   Window: last 10 seconds                         │
│   If paused: freeze x-axis scroll                 │
│                                                   │
│ onScrub(timestamp):                               │
│   → emit scrubTimestamp to main.js                │
│   → canvas-manager draws crosshair at (x,y)      │
│   → uPlot draws vertical cursor + value readout   │
│                                                   │
│ Interaction:                                      │
│   Hover on graph x-axis → scrub mode              │
│   Click legend label → toggle series visibility   │
└───────────────────────────────────────────────────┘
```

---

## Features

### 1. Fixed Charges

- Buttons: "Positive Charge +" / "Negative Charge −"
- New charge appears at canvas center, scale-in animation
- Free drag; `Shift+drag` → axis-locked movement
- Up to 10 charges

### 2. Charge Properties

- Click charge → properties panel:
  - Magnitude slider: 1–10 μC (step 0.5) **with ± step buttons**
  - Sign toggle ±
  - Delete button
- Click empty canvas → deselect

### 3. Field Visualization

- Arrow grid, default spacing = 25 px (1,536 points), range 15–50 px
- **During drag:** grid computed at 2× spacing (sub-sampled) for smooth interaction; full resolution restored on drop
- Grid computed in **Web Worker** — main thread never blocked
- **Arrow size:** log scale, tied to grid spacing to prevent overlap:
  ```
  MAX_ARROW = gridSpacing × 0.7
  MIN_ARROW = gridSpacing × 0.2
  length = MIN + (MAX − MIN) × log₁₀(1 + |E|/maxMag × 99) / 2
  ```
- **Color:** Viridis perceptually uniform colormap (log-scaled):
  ```
  t = log₁₀(1 + |E|/maxMag × 999) / 3
  color = VIRIDIS_LUT[floor(t × 255)]
  alpha = 0.25 + t × 0.7
  ```
  Viridis transitions through dark purple → blue → teal → green → yellow.
  Perceptually linear in luminance — accessible to color-blind viewers and robust under aged projectors.
- **Skip zone:** arrows suppressed inside charge visual radius
- Direction = E⃗_total direction

### 4. Color Bar (Legend)

- Vertical bar, left side of canvas
- Maps Viridis gradient → |E| in V/m
- Dynamically scaled to current maxMagnitude
- Tick labels in scientific notation

### 5. Field Probe

Mouse movement over the canvas (when not dragging) displays:
- Large direction arrow at cursor position
- Tooltip (≥16 px monospace, dark background):
  ```
  (x, y) = (60.0, 40.0) cm
  |E| = 4.00 × 10⁶ V/m
  θ = 0.0°
  Eₓ = 4.00 × 10⁶, E_y = 0.00
  ```
- Tooltip flips at canvas edges
- All values in SI — analytically verifiable

### 6. Test Particle

**Concept:** A charged particle that responds to the electric field in real time, demonstrating F = qE → a = F/m → motion.

**Interaction:**
- Button: "Add Test Particle"
- Appears at canvas center (state: `held`)
- Drag to desired position → release → motion begins from rest (v₀ = 0)
- Re-grab a moving particle → freezes → release → resumes from rest
- Reset: returns to last drop position, v = 0
- Up to 3 simultaneous test particles

**Visualization:**

| Element | Description |
|---------|-------------|
| Body | Circle (r = 8 px), unique color per particle |
| Trail | Polyline, last 10 s of simulation time, alpha fades by age |
| F⃗ vector | Orange-red arrow from particle center (toggle) |
| v⃗ vector | Green arrow from particle center (toggle) |
| Capture | Trail ends smoothly inside the capturing charge — no effects |

Particle colors (distinct from charge and colormap colors):
```
Particle 1: #00ff88 (bright green)
Particle 2: #ff6fff (magenta)
Particle 3: #ffaa00 (amber)
```

**Controls (with ± step buttons on each slider):**

| Slider | Range | Default | Scale |
|--------|-------|---------|-------|
| Charge q | ±0.1–10 nC | 1 nC | Linear, step 0.1 |
| Mass m | 0.1–100 μg | 10 μg | **Logarithmic** |
| Simulation speed | 10⁻⁶–10⁻² | 10⁻⁴ | **Logarithmic** |

**Capture:**
- Trigger: line-segment-to-charge distance < R_CAPTURE = 3 cm (anti-tunneling)
- Visual: trail path simply terminates inside the charge circle
- Particle removed from simulation

**Exit:**
- If particle leaves canvas bounds → state: `exited`
- Trail fades over 2 s, particle removed

**Test-particle assumption:** particle does not alter the field.

### 7. Energy Analysis Panel (On-Demand)

**Purpose:** Demonstrate that the Coulomb field is conservative (E_total = const when only electrostatic forces act).

**Background recording (Ghost Tracking):**
- The trail buffer records `{ timestamp, x_px, y_px, U, K, E_total }` continuously
- Circular buffer retains the last 10 seconds of simulation time
- Recording occurs regardless of whether the panel is visible

**UI — Bottom Drawer:**
- Hidden by default
- Button: "📊 Energy Analysis" in control panel
- Opens a bottom drawer that compresses the canvas vertically (not overlapping)
- Since data is recorded in background, the graph populates immediately on open

**Graph (uPlot):**
- X-axis: time (seconds)
- Y-axis: energy (joules), scientific notation
- Three series:
  - **U(t)** — Potential energy (blue)
  - **K(t)** — Kinetic energy (orange)
  - **E(t)** — Total energy (green, should be ~constant = conservative field)
- Window: rolling 10-second view

**Interactive Legend:**
- Legend labels above the graph act as toggle buttons
- Click "Kinetic Energy (K)" → hides/shows the K series
- Enables the lecturer to isolate a single quantity or compare pairs

**Scrubbing & Canvas Synchronization:**
- `Spacebar` pauses the simulation → graph x-axis freezes
- While paused, hover over the graph x-axis → scrub mode:
  - uPlot draws a vertical cursor at the hovered timestamp
  - Value readout appears for all visible series
  - Canvas draws a **crosshair marker** at the exact (x, y) the particle occupied at that timestamp
  - Trail rendering synchronized: segments before the scrub timestamp are bright, after are dimmed
- Unpause → simulation resumes, graph scrolls again

**Rendering:** uPlot (vendored, ~35 KB) — canvas-based, handles 60 Hz array updates without jank.

### 8. Presets

| Preset | Configuration | Description |
|--------|---------------|-------------|
| Dipole | +5 μC at (45,40) cm, −5 μC at (75,40) cm | Two equal and opposite charges |
| Quadrupole | ±5 μC at (50±15, 40±15) cm, alternating | Four charges, alternating signs |
| Uniform line | 5× +3 μC from x=20 to x=100 cm | Equally spaced identical charges |

Presets clear all existing charges and particles.

### 9. Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Delete` / `Backspace` | Delete selected entity |
| `C` | Clear all |
| `1` / `2` / `3` | Load preset: dipole / quadrupole / line |
| `F` | Toggle fullscreen |
| `+` / `=` | Increase Q/q of selected entity (+0.5 μC or +0.1 nC) |
| `−` | Decrease Q/q of selected entity |
| `S` | Flip sign of selected entity |
| `R` | Reset test particle(s) to drop position |
| `V` | Toggle F⃗ / v⃗ vectors |
| `Space` | Pause / resume simulation |
| `?` | Toggle help overlay |

### 10. Cursor Feedback

| State | Cursor |
|-------|--------|
| Empty canvas | `crosshair` |
| Over fixed charge | `grab` |
| Over test particle | `grab` |
| Dragging entity | `grabbing` |

### 11. Help Overlay

- **"?" button** in the top-left corner of the canvas (always visible)
- Click or press `?` → semi-transparent overlay with usage guide:
  - How to add and configure charges
  - How to use the field probe
  - How to add and observe test particles
  - How to use the energy analysis panel
  - Keyboard shortcut reference
  - Scale and unit reference
- Click anywhere or press `?` / `Escape` to dismiss
- Content in concise academic English

### 12. UI General

- Dark background (#0d1117) — projector-optimized
- Control panel: right side, 280 px, #161b22, **LTR English**
- Accent color: #58a6ff
- Scale bar at canvas bottom-right: `|── 10 cm ──|`
- Status line: `Charges: X/10 | Particles: X/3 | ΣQ = X.X μC`
- Fullscreen button (top-right corner)
- Help button "?" (top-left corner)
- Charge labels: `Q = +5.0 μC` and `(45.0, 40.0) cm`
- **All sliders** have ± step buttons flanking them
- All text in academic English with proper physics notation

---

## Deployment

The project is hosted on **GitHub Pages**. ES6 modules serve correctly with proper MIME types (unlike local `file://` which blocks cross-origin module imports).

**Setup:**
```bash
git remote add origin https://github.com/<user>/e-field-sim.git
git push -u origin main
# Enable GitHub Pages: Settings → Pages → Source: main branch, / (root)
```

**Access:** A single URL. No installation, no build step, no dependencies to manage.

The README will include the live URL at the top for the teaching staff.

---

## Workspace Setup

### Requirements
- VSCode + Claude Code CLI
- Git
- Modern browser (Chrome / Edge / Firefox)

### MCP Servers

```jsonc
// .claude/settings.json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-filesystem", "./"]
    }
  }
}
```

### superclaude Flags

| Flag | When |
|------|------|
| `--ultrathink` | Phases 1, 4, 5 (physics, particles, energy) |
| `--execute` | Phases 0, 2, 3 |
| `--quality` | Phase 6 (polish) |

---

## Work Phases

### Phase 0 — Scaffold

**Prompt:**
```
sc --execute "Initialize e-field-sim project.
Create full directory structure per README architecture section.

index.html:
  - Canvas element id='field-canvas' width=1200 height=800
  - div id='control-panel' for side panel
  - div id='energy-drawer' for bottom drawer (hidden)
  - div id='help-overlay' (hidden)
  - Link css/style.css
  - Link lib/uPlot.min.css
  - Script lib/uPlot.min.js
  - Script js/main.js type=module

Download uPlot v1.6.30:
  curl -o lib/uPlot.min.js https://cdn.jsdelivr.net/npm/uplot@1.6.30/dist/uPlot.iife.min.js
  curl -o lib/uPlot.min.css https://cdn.jsdelivr.net/npm/uplot@1.6.30/dist/uPlot.min.css

config.js exports:
  // Scale
  PIXELS_PER_CM: 10, PX_TO_M: 1e-3,
  // Physics
  K_COULOMB: 8.99e9, R_MIN_M: 0.02, R_CAPTURE_M: 0.03,
  UC_TO_C: 1e-6, NC_TO_C: 1e-9, UG_TO_KG: 1e-9,
  // Charges
  MAX_CHARGES: 10, Q_MIN_UC: 1, Q_MAX_UC: 10, Q_STEP_UC: 0.5,
  // Particles
  MAX_PARTICLES: 3,
  Q_PARTICLE_MIN_NC: 0.1, Q_PARTICLE_MAX_NC: 10, Q_PARTICLE_DEFAULT_NC: 1,
  MASS_MIN_UG: 0.1, MASS_MAX_UG: 100, MASS_DEFAULT_UG: 10,
  TIME_SCALE_MIN: 1e-6, TIME_SCALE_MAX: 1e-2, TIME_SCALE_DEFAULT: 1e-4,
  SUB_STEPS: 50, MAX_TRAIL_SECONDS: 10,
  // Canvas
  CANVAS_W: 1200, CANVAS_H: 800,
  // Grid
  DEFAULT_GRID_SPACING: 25, GRID_SPACING_MIN: 15, GRID_SPACING_MAX: 50,
  // Particle colors
  PARTICLE_COLORS: ['#00ff88', '#ff6fff', '#ffaa00'],
  // Viridis LUT (256 entries)
  VIRIDIS: [...] // will be generated

Empty placeholder files (export {}).
.gitignore: node_modules, .DS_Store, *.log, .vscode/

git init && git add -A && git commit -m 'chore: project scaffold'"
```

---

### Phase 1 — Physics Engine

**Prompt:**
```
sc --ultrathink --execute "Build the physics engine with exact SI units.
All UI strings in English. All physics uses SI. No fudge constants.

=== js/physics/vector.js ===
Class Vector2D:
  constructor(x, y)
  add(v), sub(v), scale(s) → new Vector2D (immutable)
  magnitude(), normalize() (zero-safe), angle() → degrees
  distanceToSegment(segStart, segEnd) → number
    // Minimum distance from this point to line segment [A, B]
    // Used for anti-tunneling capture check
  static fromAngle(deg, mag) → Vector2D

=== js/physics/constants.js ===
Re-export physics constants from config.

=== js/physics/engine.js ===
Class FieldEngine:
  computeFieldAt(x_px, y_px, charges[]):
    Convert px → m. For each charge:
      Q_C = charge.magnitude_uc * charge.sign * UC_TO_C  ← SIGNED
      r_vec, r = max(r_vec.mag(), R_MIN_M)
      E_i = K_COULOMB * Q_C / (r*r)
      E_vec = r_hat.scale(E_i)
    Superpose. Return {ex, ey, magnitude, angle_deg, pos_cm}.

  formatField(magnitude):
    Scientific notation with Unicode superscripts.

=== js/physics/energy.js ===
  computePotentialEnergy(particle, charges):
    U = Σᵢ K_COULOMB * Qᵢ_C * q_C / rᵢ_m
    (rᵢ in meters, clamped to R_MIN_M)
    Returns joules.

  computeKineticEnergy(particle):
    K = 0.5 * m_kg * (vx² + vy²)
    Returns joules.

=== js/physics/grid-worker.js ===
Web Worker (self-contained — cannot import ES6 modules).
  Inline: Vector2D class, Coulomb math, Viridis LUT.
  onmessage({charges, canvasW, canvasH, spacingPx}):
    Generate grid, compute field at each point.
    Track maxMag, minMag.
    postMessage({grid, maxMag, minMag}).

Console validation:
  Q=1μC at (600,400)px, probe at (700,400)px.
  Expected: E = 8.99×10⁵ V/m. Assert < 0.01% error.

git commit -m 'feat: SI physics engine + grid worker + energy'"
```

---

### Phase 2 — Renderer

**Prompt:**
```
sc --execute "Build rendering layer. Dark theme, projector-optimized.
All labels and text in English with academic physics notation.

=== css/style.css ===
  body: bg #0d1117, margin 0, overflow hidden, font system-ui
  Canvas: centered, border 1px solid #30363d
  #control-panel: fixed right, 280px, #161b22, padding 16px, #e6edf3,
    direction LTR, overflow-y auto
  #energy-drawer: fixed bottom, height 0 (collapsed), transition height 0.3s,
    bg #161b22, border-top 1px #30363d
  #energy-drawer.open: height 220px
    → canvas gets: height calc(100vh - 220px) transition
  Buttons: bg transparent, border 1px #58a6ff, color #58a6ff,
    border-radius 6px, padding 8px 16px, hover bg #58a6ff22
  Sliders: accent-color #58a6ff, width calc(100% - 64px), inline
  .step-btn: 28×28px square buttons flanking slider, font 16px bold,
    same accent style. Display: flex row [−] [slider] [+]
  #help-overlay: fixed inset 0, bg #000000cc, z-index 100, hidden
    .help-content: max-width 600px, centered, bg #161b22, rounded 12px,
    padding 32px, color #e6edf3, max-height 80vh, overflow-y auto

=== js/renderer/color-map.js ===
  Viridis LUT: 256 RGBA entries.
  magnitudeToColor(magnitude, maxMag):
    t = log10(1 + magnitude/maxMag * 999) / 3
    idx = floor(clamp(t, 0, 1) * 255)
    {r, g, b} = VIRIDIS[idx]
    alpha = 0.25 + t * 0.7
    return {r, g, b, alpha}

  Generate VIRIDIS LUT from canonical values:
    https://github.com/BIDS/colormap/blob/master/colormaps.py
    Embed as const array of [r,g,b] (0–255).

=== js/renderer/arrow-renderer.js ===
  drawArrow(..., gridSpacing):
    MAX_ARROW = gridSpacing * 0.7, MIN_ARROW = gridSpacing * 0.2
    Log scale length, Viridis color.
  renderGrid(ctx, gridResult, charges, gridSpacing):
    Skip inside charge visual radius.

=== js/renderer/charge-renderer.js ===
  drawCharge: positive #ff6b6b / negative #4dabf7, glow, +/− symbol
  drawChargeLabel: 'Q = +5.0 μC' and '(45.0, 40.0) cm', 12px

=== js/renderer/color-bar.js ===
  Left side, Viridis gradient, tick labels '|E| (V/m)', scientific notation

=== js/renderer/canvas-manager.js ===
  Render order: clear → colorBar → arrows → trails → charges+labels →
    particles+vectors → scaleBar → probe → scrubCrosshair →
    fullscreenBtn → helpBtn
  drawScaleBar(): '|── 10 cm ──|'
  drawHelpButton(): '?' circle, top-left
  drawFullscreenButton(): expand icon, top-right
  drawScrubCrosshair(x_px, y_px): bright crosshair at synced position

git commit -m 'feat: Viridis renderer with Web Worker grid'"
```

---

### Phase 3 — Interaction (Charges + Probe + UI)

**Prompt:**
```
sc --execute "Build interaction layer. All UI text in English.

=== js/interaction/drag-manager.js ===
  Hit-test charges then particles. Shift → axis lock.
  Cursor: crosshair / grab / grabbing.
  On charge drag start: set isDraggingCharge → triggers sub-sampled grid.
  On charge drop: clear isDraggingCharge → triggers full-res grid.

=== js/interaction/probe.js ===
  Tooltip (16px monospace):
    '(x, y) = (XX.X, YY.Y) cm'
    '|E| = X.XX × 10ⁿ V/m'
    'θ = XXX.X°'
    'Eₓ = ..., E_y = ...'
  Flip at canvas edges.

=== js/interaction/keyboard.js ===
  Del → delete | C → clear | 1/2/3 → presets | F → fullscreen
  +/= and − → adjust Q/q | S → flip sign | R → reset particles
  V → toggle vectors | Space → pause/resume | ? → help overlay
  Ignore when input focused.

=== js/interaction/help-overlay.js ===
  Class HelpOverlay:
    buildContent(): structured HTML guide in English:
      Section: 'Getting Started' — add charge, drag, observe field
      Section: 'Field Probe' — hover to inspect values
      Section: 'Test Particles' — drag, release, observe F=qE
      Section: 'Energy Analysis' — open panel, scrub, verify conservation
      Section: 'Keyboard Shortcuts' — table of all shortcuts
      Section: 'Units & Scale' — SI reference
    toggle(): show/hide overlay
    Dismiss on: click outside, Escape, ? again

=== js/interaction/ui-controls.js ===
  All labels in English. Build panel:

  Section 'Add Charge':
    Button 'Positive Charge +' / 'Negative Charge −'

  Section 'Charge Properties' (when selected):
    [−] [slider 1–10 μC, step 0.5] [+]
    Button 'Flip Sign ±' | Button 'Delete'

  Section 'Test Particle':
    Button 'Add Test Particle' (disabled if 3 exist)
    [−] [Charge q: ±0.1–10 nC, step 0.1] [+]
    [−] [Mass m: 0.1–100 μg, LOG] [+]
    [−] [Sim. Speed: 10⁻⁶–10⁻², LOG] [+]
    Toggle: 'Show F⃗ / v⃗ vectors'
    Button: 'Reset Particles'

  Section 'Particle Properties' (when particle selected):
    Current q, m, |v| readout. Sign toggle, delete.

  Section 'Presets':
    Buttons: Dipole | Quadrupole | Uniform Line

  Section 'Display':
    [−] [Arrow Density slider 15–50, default 25] [+]

  Section 'Analysis':
    Button '📊 Energy Analysis'
    (toggles energy drawer)

  Section 'Shortcuts':
    Compact reference list

  Footer: 'Charges: X/10 | Particles: X/3 | ΣQ = X.X μC'
  Button: 'Clear All'

=== js/main.js ===
  State, init, event wiring, presets (English descriptions).
  Render loop with Worker message handler for grid.
  Pause state: stops particle stepping, keeps rendering.
  Grid Worker:
    On charge change → post to Worker with current spacing
    On isDraggingCharge → post with spacing × 2 (sub-sample)
    On Worker response → gridResult = event.data

git commit -m 'feat: interaction layer with English UI'"
```

---

### Phase 4 — Test Particle (Physics + Rendering)

**Prompt:**
```
sc --ultrathink --execute "Implement test particle with Verlet, anti-tunneling,
energy tracking, and rendering.

=== js/physics/particle-physics.js ===
Class ParticlePhysics:
  constructor(engine, energyModule)

  step(particle, charges, timeScale, subSteps=50):
    if state !== 'moving': return
    dt_frame = (1/60) * timeScale
    dt_sub = dt_frame / subSteps

    for (i = 0; i < subSteps; i++):
      prevX = particle.x_px, prevY = particle.y_px

      // Velocity Verlet — position
      E = engine.computeFieldAt(x_px, y_px, charges)
      q_C = particle.magnitude_nc * particle.sign * NC_TO_C
      m_kg = particle.mass_kg
      ax = q_C * E.ex / m_kg
      ay = q_C * E.ey / m_kg
      dx_px = (vx*dt + 0.5*ax*dt²) / PX_TO_M
      dy_px = (vy*dt + 0.5*ay*dt²) / PX_TO_M
      particle.x_px += dx_px
      particle.y_px += dy_px

      // Velocity Verlet — velocity
      E_new = engine.computeFieldAt(particle.x_px, particle.y_px, charges)
      ax_new = q_C * E_new.ex / m_kg
      ay_new = q_C * E_new.ey / m_kg
      particle.vx_ms += 0.5*(ax+ax_new)*dt_sub
      particle.vy_ms += 0.5*(ay+ay_new)*dt_sub

      // ---- ANTI-TUNNELING CAPTURE ----
      // Segment from (prevX, prevY) to (particle.x_px, particle.y_px)
      for (charge of charges):
        charge_pos = Vector2D(charge.x_px, charge.y_px)
        segDist_px = charge_pos.distanceToSegment(
          Vector2D(prevX, prevY),
          Vector2D(particle.x_px, particle.y_px)
        )
        segDist_m = segDist_px * PX_TO_M
        if (segDist_m < R_CAPTURE_M):
          // Interpolate capture point on segment
          // (closest point on segment to charge center)
          particle.x_px = closestPoint.x
          particle.y_px = closestPoint.y
          particle.state = 'captured'
          return

      // Energy recording (every 3 sub-steps)
      if (i % 3 === 0):
        U = energy.computeU(particle, charges)
        K = energy.computeK(particle)
        particle.trail.push({
          timestamp: particle.simTime,
          x_px, y_px, U, K, E_total: U + K
        })
        // Trim to MAX_TRAIL_SECONDS window
        while oldest entry > 10s behind: shift()

      particle.simTime += dt_sub

      // Exit check
      if out of canvas (with 50px margin): state = 'exited', return

=== js/renderer/particle-renderer.js ===
  drawTrail(ctx, particle, scrubTimestamp):
    Path through trail points.
    Alpha fade by age (newest=0.8, oldest=0.0).
    If scrubTimestamp set:
      points before scrub = full alpha
      points after scrub = dimmed (alpha × 0.2)
    Stroke color: particle.color, lineWidth 2px.

  drawParticle(ctx, particle, isSelected):
    Circle r=8px, fill particle.color, glow.
    Selected: white ring. Tiny +/− inside.

  drawForceVector(ctx, particle, charges, engine):
    Compute F at current position. Log-scaled arrow.
    Color: #ff8844. Label: 'F⃗'

  drawVelocityVector(ctx, particle):
    Log-scaled arrow from |v|.
    Color: #44ff88. Label: 'v⃗'

  // No capture animation — trail simply ends inside charge.
  // No exit animation beyond trail fade (2s global alpha).

=== Update drag-manager ===
  Particles: grab → state='held', v=0. Release → state='moving'.

git commit -m 'feat: test particle with Verlet + anti-tunneling'"
```

---

### Phase 5 — Energy Analysis Panel

**Prompt:**
```
sc --ultrathink --execute "Implement energy analysis panel with uPlot
and canvas synchronization.

=== js/renderer/energy-panel.js ===
Class EnergyPanel:
  constructor(drawerEl, onScrub):
    this.uplot = null
    this.visible = false
    this.scrubCallback = onScrub

  init():
    Create uPlot instance inside drawerEl.
    Options:
      width: drawerEl.clientWidth - 40
      height: 180
      scales: { x: { time: false }, y: {} }
      axes: [
        { label: 'Time (s)', font: '13px system-ui', stroke: '#8b949e' },
        { label: 'Energy (J)', font: '13px system-ui', stroke: '#8b949e',
          values: (u, vals) => vals.map(formatScientific) }
      ]
      series: [
        {},  // x-axis
        { label: 'U — Potential', stroke: '#6ea8fe', width: 2,
          show: true },
        { label: 'K — Kinetic', stroke: '#f0883e', width: 2,
          show: true },
        { label: 'E — Total', stroke: '#56d364', width: 2, dash: [6,3],
          show: true }
      ]
      cursor: {
        sync: { key: 'energy' },
        move: (u, mouseLeft, mouseTop) => {
          // Emit scrub timestamp
          const idx = u.posToIdx(mouseLeft)
          if (idx != null)
            this.scrubCallback(this.data[0][idx])
          return [mouseLeft, mouseTop]
        }
      }
      legend: {
        // Clicking label toggles series
        live: true
      }

  toggle():
    this.visible = !this.visible
    drawerEl.classList.toggle('open')
    if (this.visible && !this.uplot) this.init()
    // Canvas height adjusts via CSS transition

  update(particles):
    // Find first 'moving' particle (or most recently captured)
    const p = activeParticle(particles)
    if (!p || !p.trail.length) return

    // Build uPlot data arrays from trail buffer
    const timestamps = p.trail.map(t => t.timestamp)
    const U_vals = p.trail.map(t => t.U)
    const K_vals = p.trail.map(t => t.K)
    const E_vals = p.trail.map(t => t.E_total)

    this.data = [timestamps, U_vals, K_vals, E_vals]
    this.uplot.setData(this.data)

  getScrubPosition(timestamp, particles):
    // Find trail entry closest to timestamp
    // Return {x_px, y_px} for canvas crosshair
    const p = activeParticle(particles)
    if (!p) return null
    const entry = binarySearch(p.trail, timestamp)
    return { x_px: entry.x_px, y_px: entry.y_px }

  destroy():
    this.uplot?.destroy()

=== Update main.js ===
  State: showEnergyPanel, paused, scrubTimestamp

  energyPanel = new EnergyPanel(drawerEl, (timestamp) => {
    this.scrubTimestamp = timestamp
  })

  In render loop:
    if (showEnergyPanel)
      energyPanel.update(particles)

    if (scrubTimestamp != null)
      const pos = energyPanel.getScrubPosition(scrubTimestamp, particles)
      canvasManager.drawScrubCrosshair(pos.x_px, pos.y_px)

  Pause:
    Space → paused = !paused
    When paused: particles don't step, grid still renders, probe works
    When paused + energy panel open: scrubbing enabled

=== Update canvas-manager ===
  drawScrubCrosshair(x_px, y_px):
    Vertical + horizontal thin lines (#ffffff88)
    Small bright circle at intersection
    Coordinate label: '(XX.X, YY.Y) cm'

git commit -m 'feat: energy analysis panel with uPlot + scrub sync'"
```

---

### Phase 6 — Polish & Documentation

**Prompt:**
```
sc --quality --execute "Final polish pass — lecture-ready, academic quality.

Visual:
  - Charge scale-in animation (200ms ease-out)
  - Grid arrow crossfade on recompute (150ms)
  - Probe arrow smooth angle interpolation
  - Coordinate cross at canvas center (#ffffff10)
  - Preset description: English, centered top, fade 3s
  - Energy drawer: smooth open/close transition

Readability:
  - All probe text ≥16px monospace
  - Charge labels 13px bold
  - Color bar labels 13px
  - Scale bar white on semi-transparent bg
  - Energy graph: axes labels, legend clearly readable

Help overlay content (English, academic):
  'Getting Started':
    'Click "Positive Charge +" or "Negative Charge −" to place a charge.
     Drag to position. Use the properties panel to adjust magnitude (1–10 μC)
     or flip the sign. The field updates in real time.'
  'Field Probe':
    'Move your cursor over the canvas to inspect the electric field
     at any point. The readout shows |E|, direction, and components in SI.'
  'Test Particles':
    'Click "Add Test Particle" and drag it into the field.
     Release to observe its motion under F = qE.
     Toggle F⃗ and v⃗ vectors with the V key.'
  'Energy Analysis':
    'Open the energy panel (📊) to track U(t), K(t), and E(t).
     Press Space to pause, then scrub the timeline to inspect
     any moment. In a conservative field, E = U + K ≈ const.'
  'Shortcuts': [table of all keys]
  'Units': 'Charges in μC, distances in cm, field in V/m.
    Scale bar shows 10 cm. All values are exact SI.'

Code quality:
  - JSDoc on every export
  - Physics formulas in comments
  - Remove console.log (except validation)
  - Consistent naming: _px, _m, _ms, _uc, _nc, _C, _kg

Validation suite (console):
  1. Single Q=1μC → E at 10cm = 8.99×10⁵ V/m
  2. Dipole symmetry at midpoint
  3. formatField(899000) → '8.99 × 10⁵'
  4. Verlet energy conservation: Q=+5μC, q=+1nC, m=10μg
     at r=20cm. KE+PE at r=25cm → < 1% drift from initial PE.
  5. Anti-tunneling: high-speed particle aimed at charge → captured.

GitHub Pages:
  Verify live URL works. Update README top with final URL.

git add -A && git commit -m 'polish: lecture-ready, help overlay, validation'
git tag v1.0.0
git push origin main --tags"
```

---

## Commits

| # | Commit | Content |
|---|--------|---------|
| 1 | `chore: project scaffold` | Structure, config, HTML, uPlot vendor |
| 2 | `feat: SI physics engine + grid worker + energy` | vector, engine, energy, grid-worker |
| 3 | `feat: Viridis renderer with Web Worker grid` | Arrows, charges, colorbar, Viridis LUT |
| 4 | `feat: interaction layer with English UI` | Drag, probe, keyboard, help, UI, main, presets |
| 5 | `feat: test particle with Verlet + anti-tunneling` | Particle physics, trail, capture, vectors |
| 6 | `feat: energy analysis panel with uPlot + scrub sync` | Energy panel, drawer, scrubbing, canvas sync |
| 7 | `polish: lecture-ready, help overlay, validation` | Animations, help content, validation, GH Pages |

---

## Quick Start

1. Open the live URL in a browser
2. Click "Positive Charge +" to add a charge
3. Drag to position
4. Add more charges — the field updates automatically
5. Move your cursor to inspect field values in SI
6. Click "Add Test Particle" → drag → release → observe motion
7. Press `V` to display force and velocity vectors
8. Open "📊 Energy Analysis" to verify energy conservation
9. Press `Space` to pause, then scrub the energy timeline
10. Press `?` for the full usage guide

## Lecture Use

- **Dark theme** — projector-optimized, no distractions
- **Scale bar** — real-world reference in cm
- **Color bar** — Viridis legend with |E| in V/m (colorblind-safe)
- **Probe** — exact SI values, verifiable against board calculations
- **Test particle** — demonstrates F = qE → motion in real time
- **F⃗ / v⃗ vectors** — shows that force ≠ velocity direction
- **Energy panel** — conservative field → E_total ≈ const (live proof)
- **Scrubbing** — pause and inspect any moment in the trajectory
- **Presets** — instant switch between canonical configurations
- **Fullscreen** — press `F`
- **Step buttons** — precise slider control while standing at podium
- **Help overlay** — press `?` for on-screen reference

---

## Limitations

- 2D only
- Point charges only (no continuous distributions)
- Up to 10 charges, up to 3 test particles
- Test particle does not alter the field (standard approximation)
- Singularity clamp at r = 2 cm, capture at r = 3 cm
- Grid arrows only (no continuous field lines)
- Energy panel tracks one particle at a time

## Possible Extensions

- Field lines (streamlines)
- Equipotential contours
- Electric potential V(x,y) heatmap overlay
- Multi-particle energy comparison
- Export PNG / SVG of configuration

---

## License

Free for educational use.
