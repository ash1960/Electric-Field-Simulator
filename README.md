# Electric Field Simulator

An interactive tool for university-level electrostatics. Place point charges in a 2D canvas, visualize the resulting electric field in real SI units, and observe charged test-particle dynamics in real time.

**Made by A.D.SH**

**Deployment:** Single URL on GitHub Pages — no installation, no build step.  
**Live:** `https://ash1960.github.io/Electric-Field-Simulator/`

---

## Physical Model

### SI Units

All physics is computed in strict MKS / SI. UI-facing scales (μC, nC, μg, cm) are converted at the boundary.

| Quantity | UI unit | Range | Notes |
|----------|---------|-------|-------|
| Fixed charge Q | μC | ±1 to ±10 μC | Step 0.5 μC |
| Distance | cm | 0–120 × 0–80 cm | Canvas = 120 cm × 80 cm |
| Electric field E | N/C | Configuration-dependent | Exact SI in probe readout |
| Test-particle charge q | nC | ±0.1 to ±10 nC | Default 1 nC |
| Test-particle mass m | μg | 0.1 to 100 μg | Log slider, default 10 μg |
| Kinetic energy K | J | Computed | ½mv² |

### Scale

```
PIXELS_PER_CM = 10
→ Canvas 1200 × 800 px = 120 cm × 80 cm
→ 1 pixel = 1 mm = 10⁻³ m
```

### Constants

```
k  = 9 × 10⁹  N·m²/C²   (Coulomb's constant)
ε₀ = 8.85 × 10⁻¹²  F/m  (vacuum permittivity)
```

### Field Computation

```
E⃗(P) = Σᵢ k · Qᵢ / rᵢ² · r̂ᵢ
```

Q enters the formula **with its sign** — no manual flip on r̂. Singularity clamp: r_min = 2 cm.

### Test-Particle Dynamics

```
F⃗ = q · E⃗(x, y)     a⃗ = F⃗ / m
```

Integration: **Velocity Verlet**, 50 sub-steps per frame at 60 fps.

**Anti-tunneling:** Each sub-step checks the segment from the particle's previous to next position against every charge. If the minimum segment-to-charge distance < R_CAPTURE = 3 cm, the particle is captured at the interpolated point — no tunneling regardless of velocity.

**Time scaling:** Logarithmic slider, 10⁻⁶ to 10⁻² (default 10⁻⁴).

### Verification

```
Q₁ = +5 μC at (45, 40) cm,  Q₂ = −5 μC at (75, 40) cm
Probe: (60, 40) cm — dipole midpoint

r₁ = r₂ = 15 cm = 0.15 m
E = 2 × (9×10⁹)(5×10⁻⁶)/(0.15)² = 4.00 × 10⁶ N/C,  θ = 0.0°
```

---

## Architecture

### Stack

| Layer | Technology |
|-------|-----------|
| Simulation view | HTML5 Canvas (1200 × 800 px) |
| Energy graphs | uPlot (vendored, ~35 KB) |
| UI + physics | Vanilla ES6 modules |
| Grid computation | Web Worker (off main thread) |
| Deployment | GitHub Pages |

### File Structure

```
/
├── index.html
├── css/style.css
├── js/
│   ├── main.js                      ← orchestrator, state, render loop
│   ├── config.js                    ← all constants and defaults
│   ├── physics/
│   │   ├── engine.js                ← computeFieldAt(), formatField()
│   │   ├── vector.js                ← Vector2D (immutable)
│   │   ├── energy.js                ← computeKineticEnergy()
│   │   ├── particle-physics.js      ← Verlet stepper + anti-tunneling
│   │   ├── constants.js             ← re-exports physics constants
│   │   └── grid-worker.js           ← Web Worker: grid computation
│   ├── renderer/
│   │   ├── canvas-manager.js        ← render orchestration
│   │   ├── arrow-renderer.js        ← field arrows (log scale)
│   │   ├── charge-renderer.js       ← charge circles + labels
│   │   ├── color-map.js             ← Viridis LUT
│   │   ├── color-bar.js             ← Viridis legend bar
│   │   ├── particle-renderer.js     ← particle + trail + F⃗/v⃗
│   │   └── energy-panel.js          ← uPlot graphs + scrub sync
│   └── interaction/
│       ├── drag-manager.js          ← drag charges + particles
│       ├── probe.js                 ← field probe (mouse hover)
│       ├── particle-manager.js      ← particle lifecycle
│       ├── keyboard.js              ← keyboard shortcuts
│       ├── ui-controls.js           ← control panel
│       └── help-overlay.js          ← "?" usage guide
└── lib/
    ├── uPlot.min.js
    └── uPlot.min.css
```

### Data Flow

```
ui-controls.js → main.js (state + render loop)
                      │
            ┌─────────┼─────────┐
            ▼         ▼         ▼
       physics/   renderer/  interaction/
```

`main.js` owns all mutable state: `charges[]`, `particles[]` (max 3), `gridResult`, `paused`, `timeScale`, `selectedId/Type`, `scrubTimestamp`.

### Render Loop

Each `requestAnimationFrame`:
1. Step all `'moving'` particles (Verlet, if not paused)
2. Refresh probe at `mousePos`
3. Update energy panel (if open)
4. `canvasManager.render(all state)`

### Data Models

**Charge:**
```javascript
{ id, x_px, y_px, magnitude_uc, sign: +1 | -1 }
// Q_C = magnitude_uc * sign * 1e-6
```

**TestParticle:**
```javascript
{
  id, x_px, y_px, vx_ms, vy_ms, mass_kg,
  magnitude_nc, sign: +1 | -1,
  drop_x_px, drop_y_px,
  trail: [{ realT, x_px, y_px, K, E_field }],
  state: 'held' | 'moving' | 'captured' | 'exited',
  color
}
```

---

## Features

### Fixed Charges

- Buttons: **+ Positive** / **− Negative** — new charge appears near canvas center
- Free drag; `Shift+drag` → axis-locked movement
- Click to select → properties panel:
  - Magnitude slider 1–10 μC with ± step buttons
  - Sign toggle, delete
- Up to 10 charges

### Field Visualization

- Arrow grid, default spacing 25 px (1,536 points at default), range 15–50 px
- During drag: grid computed at 2× spacing for smooth interaction, restored on drop
- Grid computed in Web Worker — main thread never blocked
- Arrow length: logarithmic scale tied to grid spacing
- Color: **Viridis** perceptually-uniform colormap (log-scaled, colorblind-safe)
- Arrows suppressed inside charge visual radius

### Color Bar

Vertical Viridis legend on the left edge of the canvas, dynamically scaled to current max |E|.

### Field Probe

Hover over the canvas to see:
```
(x,y) = (60.0, 40.0) cm
|E|   = 4.00×10⁶ N/C
θ     = 0.0°
Eₓ    = 4.00×10⁶ N/C
Eᵧ    = 0.00 N/C
```
Tooltip flips at canvas edges. Blue direction arrow scales with field strength.

### Test Particles

- Up to 3 simultaneous particles (colors: green, magenta, amber)
- Drag to position, release → accelerates from rest under F = qE
- Re-grab a moving particle → freezes; release → resumes from rest
- Controls: q (nC), m (μg, log slider), simulation speed (log slider)
- **V** key → toggle Force (orange) and Velocity (green) vectors
- Capture: particle absorbed when segment-to-charge distance < 3 cm; trail ends inside the charge
- Exit: particle leaves canvas bounds → removed after trail fades

### Energy Analysis Panel

Click **📊 Energy Analysis** to open a bottom drawer with two live charts:
- **Kinetic Energy K(t)** — ½mv² in joules
- **Field Magnitude |E|(t)** — field strength at the particle's position in N/C

Data is recorded continuously in the background (circular buffer, last 10 s of real time), so the graph populates immediately when opened.

**Scrubbing:** Press `Space` to pause, then hover over either chart. A crosshair appears on the canvas at the exact position the particle occupied at that moment in time.

### Presets

| Preset | Configuration |
|--------|---------------|
| Dipole | +5 μC at (45,40) cm, −5 μC at (75,40) cm |
| Quadrupole | ±3 μC at four corners, alternating signs |
| Line | 10× +2 μC equally spaced across canvas |

Presets replace all existing charges and particles.

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Delete` / `Backspace` | Delete selected charge or particle |
| `C` | Clear all |
| `1` / `2` / `3` | Load Dipole / Quadrupole / Line preset |
| `Space` | Pause / resume |
| `+` / `−` | Adjust selected charge ±0.5 μC |
| `S` | Flip sign |
| `R` | Reset all particles to drop position |
| `V` | Toggle F⃗ / v⃗ vectors |
| `F` | Toggle fullscreen |
| `?` | Toggle help overlay |

### Fullscreen

Press `F` or click the expand icon (top-right corner of canvas). The canvas scales to fill the screen while maintaining its 3:2 aspect ratio. The control panel is hidden in fullscreen; all keyboard shortcuts remain active.

### Help Overlay

Press `?` or click the **?** button (top-left corner of canvas) for an in-canvas usage guide covering all features and shortcuts.

---

## Quick Start

1. Open the live URL in a browser
2. Click **+ Positive** to add a charge — field appears immediately
3. Drag the charge to explore the field pattern
4. Hover the canvas to read exact SI values at any point
5. Click **Add Test Particle**, drag it into the field, release
6. Press **V** to show force and velocity vectors
7. Open **📊 Energy Analysis**, then press **Space** to pause and scrub
8. Press **?** for the full usage guide

---

## Lecture Use

- **Dark theme** — projector-optimized
- **Exact SI values** — probe readout verifiable against board calculations
- **F⃗ / v⃗ vectors** — demonstrates that force ≠ velocity direction
- **Energy panel** — live K(t) and |E|(t) charts
- **Scrubbing** — pause and inspect any moment in the trajectory
- **Presets** — instant switch between canonical configurations
- **Fullscreen** — press `F`
- **Step buttons** — precise slider control from the podium
- **Help overlay** — press `?` for on-screen reference

---

## Limitations

- 2D only; point charges only
- Up to 10 fixed charges, up to 3 test particles
- Test particle does not alter the field (standard test-charge approximation)
- Singularity clamp at r = 2 cm, capture radius at r = 3 cm
- Energy panel tracks one particle at a time (the first moving particle)

## Possible Extensions

- Field lines (streamlines)
- Equipotential contours
- Electric potential V(x, y) heatmap overlay
- Multi-particle energy comparison
- Export PNG / SVG of configuration

---

## Running Locally

ES6 modules require HTTP (not `file://`):

```bash
python -m http.server 8080
# open http://localhost:8080
```

## Deployment

```bash
git remote add origin https://github.com/ash1960/Electric-Field-Simulator.git
git push -u origin main
# GitHub Settings → Pages → Source: main branch, / (root)
```

---

## License

Free for educational use.
