<div align="center">

# ⚡ Electric Field Simulator
<img width="1919" height="926" alt="image" src="https://github.com/user-attachments/assets/0197b14f-4f7a-460b-9dc7-e0e2a4ab6cce" />

**Interactive electrostatics tool for university-level Physics II**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue?style=for-the-badge&logo=github)](https://ash1960.github.io/Electric-Field-Simulator/)
[![License](https://img.shields.io/badge/License-Educational%20Use-green?style=for-the-badge)](#license)

*Place point charges, visualize the electric field in real SI units, and observe test-particle dynamics in real time.*

**Made by A.D.SH**

</div>

---

## 🚀 Live

**[https://ash1960.github.io/Electric-Field-Simulator/](https://ash1960.github.io/Electric-Field-Simulator/)**

No installation. No build step. Open and use.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| ⚡ **Electric Field** | Real-time Coulomb superposition on a 48×32 arrow grid |
| 🎨 **Viridis Colormap** | Perceptually uniform, colorblind-safe field magnitude coloring |
| 🔬 **Field Probe** | Hover anywhere for exact |E|, θ, Eₓ, Eᵧ in SI units |
| 🔴 **Test Particles** | Up to 3 particles — Velocity Verlet integration, anti-tunneling |
| 📊 **Energy Panel** | Live K(t) and |E|(t) charts with timeline scrubbing |
| 🎯 **Presets** | Dipole, Quadrupole, Uniform Line — one click |
| ⌨️ **Keyboard Shortcuts** | Full keyboard control — works with any keyboard layout |
| 🖥️ **Fullscreen** | Scales to any screen, aspect-ratio preserved |

---

## 🎮 Quick Start

1. **[Open the simulator](https://ash1960.github.io/Electric-Field-Simulator/)**
2. Click **+ Positive** to place a charge — field arrows appear instantly
3. Drag the charge to explore the pattern
4. Hover over the canvas to read exact SI values
5. Click **Add Test Particle** → drag → release → watch it accelerate under *F = qE*
6. Press **V** to show Force and Velocity vectors on the particle
7. Open **📊 Energy Analysis** → press **Space** to pause → hover the chart to scrub
8. Press **?** for the full usage guide

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Del` / `Backspace` | Delete selected charge or particle |
| `C` | Clear all |
| `1` / `2` / `3` | Load Dipole / Quadrupole / Line preset |
| `Space` | Pause / resume simulation |
| `+` / `−` | Adjust selected charge magnitude ±0.5 μC |
| `S` | Flip sign of selected entity |
| `R` | Reset all particles to last release position |
| `V` | Toggle Force / Velocity vectors |
| `F` | Toggle fullscreen |
| `?` | Toggle help overlay |

> All shortcuts work regardless of keyboard language (Hebrew, English, etc.)

---

## 🧪 Physics

### Model

All computation in strict **MKS / SI**. UI convenience scales (μC, nC, μg, cm) are converted at the boundary.

**Field computation — Coulomb superposition:**
$$\vec{E}(P) = \sum_i \frac{k \cdot Q_i}{r_i^2} \hat{r}_i$$

*Q enters with its sign — no manual flip on r̂. Singularity clamp: r_min = 2 cm.*

**Test-particle dynamics — Newton's second law:**
$$\vec{F} = q \cdot \vec{E}(x, y) \qquad \vec{a} = \vec{F} / m$$

**Integration: Velocity Verlet**, 50 sub-steps per frame at 60 fps.

**Anti-tunneling:** each sub-step checks the line segment traveled against every charge. If the segment-to-charge distance < R_capture = 3 cm, the particle is captured at the interpolated point — no tunneling at any speed.

### Constants

```
k  = 9 × 10⁹  N·m²/C²     Coulomb's constant
ε₀ = 8.85 × 10⁻¹²  F/m    Vacuum permittivity
```

### Scale

```
1 pixel = 1 mm = 10⁻³ m
Canvas: 1200 × 800 px  =  120 × 80 cm
```

### Verification

```
Q₁ = +5 μC at (45, 40) cm
Q₂ = −5 μC at (75, 40) cm
Probe at dipole midpoint (60, 40) cm

r₁ = r₂ = 0.15 m
E = 2 × (9×10⁹)(5×10⁻⁶) / (0.15)²  =  4.00 × 10⁶ N/C,  θ = 0.0°
```

---

## 🏗️ Architecture

### Stack

| Layer | Technology |
|-------|-----------|
| Simulation canvas | HTML5 Canvas — 1200 × 800 px |
| Energy graphs | [uPlot](https://github.com/leeoniya/uPlot) v1.6.30 (vendored, ~35 KB) |
| UI + physics | Vanilla ES6 modules — zero dependencies |
| Grid computation | Web Worker — off main thread, no jank during drag |
| Deployment | GitHub Pages — static, single URL |

### Module Structure

```
js/
├── main.js                   ← orchestrator: state, render loop, event wiring
├── config.js                 ← single source of truth for all constants
│
├── physics/
│   ├── engine.js             ← computeFieldAt() — Coulomb superposition
│   ├── particle-physics.js   ← Velocity Verlet + anti-tunneling
│   ├── energy.js             ← kinetic energy computation
│   ├── grid-worker.js        ← Web Worker: grid field computation
│   ├── vector.js             ← immutable Vector2D
│   └── constants.js          ← re-exports physics constants
│
├── renderer/
│   ├── canvas-manager.js     ← render orchestration (11-step pipeline)
│   ├── arrow-renderer.js     ← log-scaled field arrows
│   ├── charge-renderer.js    ← charge circles + labels
│   ├── color-map.js          ← Viridis LUT (256 entries)
│   ├── color-bar.js          ← dynamic |E| legend
│   ├── particle-renderer.js  ← trail + vectors + glow
│   └── energy-panel.js       ← uPlot charts + scrub sync
│
└── interaction/
    ├── drag-manager.js       ← pointer drag with Shift-axis-lock
    ├── probe.js              ← live field readout on hover
    ├── particle-manager.js   ← particle lifecycle
    ├── keyboard.js           ← layout-independent shortcuts (e.code)
    ├── ui-controls.js        ← control panel DOM
    └── help-overlay.js       ← "?" guide
```

### Design Principles

- **Physics layer** never touches the DOM — returns pure data
- **Renderer layer** never computes physics — reads state, draws pixels
- **`config.js`** is the single source of truth — no magic numbers elsewhere
- **Web Worker** handles the 1,536-point grid so the main thread stays at 60 fps

---

## 📐 Presets

| Preset | Charges | Demonstrates |
|--------|---------|--------------|
| **Dipole** | +5 μC at (45,40) cm, −5 μC at (75,40) cm | Equal and opposite — classic dipole field |
| **Quadrupole** | ±3 μC at four corners, alternating | Four-pole field pattern |
| **Line** | 10× +2 μC equally spaced | Uniform line charge approximation |

---

## 🎓 Lecture Use

Designed for projector display and live classroom demonstration:

- **Dark theme** — high contrast on any projector
- **Exact SI values** — probe readout verifiable against board calculations in real time
- **Presets** — instant switch between canonical configurations
- **Force / Velocity vectors** — shows that force ≠ velocity direction (press `V`)
- **Energy panel** — live K(t) and |E|(t) with scrubbing
- **Step buttons** on all sliders — precise control from the podium
- **Fullscreen** — press `F` for distraction-free display
- **Help overlay** — press `?` for on-screen reference

---

## 🛠️ Running Locally

ES6 modules require HTTP — cannot be opened as a local `file://`:

```bash
git clone https://github.com/ash1960/Electric-Field-Simulator.git
cd Electric-Field-Simulator
python -m http.server 8080
# open http://localhost:8080
```

---

## ⚠️ Limitations

- 2D simulation only; point charges only
- Up to 10 fixed charges and 3 simultaneous test particles
- Test particle does not alter the background field (standard test-charge approximation)
- Energy panel tracks one particle at a time

---

## 💡 Possible Extensions

- Field lines (streamlines)
- Equipotential contour overlay
- Electric potential V(x, y) heatmap
- Multi-particle energy comparison panel
- Export configuration as PNG / SVG

---

## 📄 License

Free for educational use.
