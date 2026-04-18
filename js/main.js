// Phase 1 — temporary validation bootstrap. Phase 3 will replace with full orchestrator.

import { FieldEngine } from './physics/engine.js';
import { computePotentialEnergy, computeKineticEnergy } from './physics/energy.js';
import { CANVAS_W, CANVAS_H, DEFAULT_GRID_SPACING, NC_TO_C, UG_TO_KG } from './config.js';

const engine = new FieldEngine();
const failures = [];

function approx(actual, expected, tolPct, label) {
  const err = Math.abs(actual - expected) / Math.abs(expected);
  if (err > tolPct) {
    failures.push(`${label}: expected ${expected}, got ${actual} (err ${(err * 100).toFixed(4)}%)`);
    return false;
  }
  return true;
}

// 1. Single charge: Q = +1 μC at (600,400)px, probe (700,400)px → r = 10 cm = 0.1 m
//    E = k·Q/r² = 8.99e9 · 1e-6 / 0.01 = 8.99e5 V/m, direction +x.
{
  const charges = [{ x_px: 600, y_px: 400, magnitude_uc: 1, sign: +1 }];
  const r = engine.computeFieldAt(700, 400, charges);
  approx(r.magnitude, 8.99e5, 1e-4, 'single-charge |E|');
  approx(r.ex, 8.99e5, 1e-4, 'single-charge Eₓ');
  if (Math.abs(r.ey) > 1e-6) failures.push(`single-charge E_y not zero: ${r.ey}`);
  if (Math.abs(r.angle_deg) > 1e-6) failures.push(`single-charge angle not 0°: ${r.angle_deg}`);
}

// 2. Dipole symmetry: +5 μC at (450,400), −5 μC at (750,400), probe midpoint (600,400)
//    r = 15 cm = 0.15 m each. Each E_i = 8.99e9·5e-6/0.0225 = 1.9978e6.
//    +Q field points away (+x at midpoint). −Q field points toward −Q (also +x).
//    Total = 3.9956e6 V/m in +x. Spec says 4.00e6, θ = 0°.
{
  const charges = [
    { x_px: 450, y_px: 400, magnitude_uc: 5, sign: +1 },
    { x_px: 750, y_px: 400, magnitude_uc: 5, sign: -1 },
  ];
  const r = engine.computeFieldAt(600, 400, charges);
  approx(r.magnitude, 4.00e6, 2e-3, 'dipole |E|');
  if (r.ex < 0) failures.push(`dipole Eₓ wrong sign — sign-flip bug suspected: ${r.ex}`);
  if (Math.abs(r.ey) > 1e-3) failures.push(`dipole E_y not zero: ${r.ey}`);
  if (Math.abs(r.angle_deg) > 1e-3) failures.push(`dipole angle not 0°: ${r.angle_deg}`);
}

// 3. formatField — positive and negative exponents.
{
  const a = engine.formatField(899000);
  if (a !== '8.99 × 10⁵') failures.push(`formatField(899000) → "${a}", expected "8.99 × 10⁵"`);
  const b = engine.formatField(0.00899);
  if (b !== '8.99 × 10⁻³') failures.push(`formatField(0.00899) → "${b}", expected "8.99 × 10⁻³"`);
}

// 4. Energy sanity: q = +1 nC at 10 cm from a +1 μC charge → U = k·Q·q/r = 8.99e-5 J, K = 0.
{
  const particle = {
    x_px: 700, y_px: 400,
    vx_ms: 0, vy_ms: 0,
    mass_kg: 10 * UG_TO_KG,
    charge_C: 1 * NC_TO_C,
  };
  const charges = [{ x_px: 600, y_px: 400, magnitude_uc: 1, sign: +1 }];
  const U = computePotentialEnergy(particle, charges);
  const K = computeKineticEnergy(particle);
  approx(U, 8.99e-5, 1e-4, 'energy U');
  if (K !== 0) failures.push(`kinetic energy at rest should be 0, got ${K}`);
}

// 5. Worker round-trip.
const worker = new Worker('./js/physics/grid-worker.js');
worker.onmessage = (event) => {
  const { grid, maxMag, minMag } = event.data;
  const expectedCols = Math.floor(CANVAS_W / DEFAULT_GRID_SPACING);
  const expectedRows = Math.floor(CANVAS_H / DEFAULT_GRID_SPACING);
  const expected = expectedCols * expectedRows;
  if (grid.length !== expected) {
    failures.push(`worker grid.length = ${grid.length}, expected ${expected}`);
  }
  if (!(maxMag > 0 && minMag >= 0 && minMag <= maxMag)) {
    failures.push(`worker maxMag/minMag invalid: max=${maxMag}, min=${minMag}`);
  }
  console.log(`[Phase 1] worker: grid.length=${grid.length}, maxMag=${maxMag.toExponential(3)}, minMag=${minMag.toExponential(3)}`);

  if (failures.length === 0) {
    console.log('[Phase 1] ✅ validations passed');
  } else {
    console.error('[Phase 1] ❌ validations failed:');
    for (const f of failures) console.error('  •', f);
  }
};
worker.onerror = (e) => {
  console.error('[Phase 1] worker error:', e.message, e);
};
worker.postMessage({
  charges: [{ x_px: 600, y_px: 400, magnitude_uc: 1, sign: +1 }],
  canvasW: CANVAS_W,
  canvasH: CANVAS_H,
  spacingPx: DEFAULT_GRID_SPACING,
});
