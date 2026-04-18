// Self-contained: no ES6 imports (Workers cannot use module imports without type:module).
// Inlined Coulomb constants and math.

const K_COULOMB = 8.99e9;
const R_MIN_M = 0.02;
const UC_TO_C = 1e-6;
const PX_TO_M = 1e-3;

function fieldAt(x_px, y_px, charges) {
  const px_m = x_px * PX_TO_M;
  const py_m = y_px * PX_TO_M;
  let ex = 0, ey = 0;
  for (let i = 0; i < charges.length; i++) {
    const c = charges[i];
    const Q_C = c.magnitude_uc * c.sign * UC_TO_C;
    const rx = px_m - c.x_px * PX_TO_M;
    const ry = py_m - c.y_px * PX_TO_M;
    const r_raw = Math.hypot(rx, ry);
    if (r_raw === 0) continue;
    const r = r_raw < R_MIN_M ? R_MIN_M : r_raw;
    const E_scalar = K_COULOMB * Q_C / (r * r);
    const inv = 1 / r_raw;
    ex += rx * inv * E_scalar;
    ey += ry * inv * E_scalar;
  }
  return { ex, ey, magnitude: Math.hypot(ex, ey) };
}

self.onmessage = (event) => {
  const { charges, canvasW, canvasH, spacingPx } = event.data;
  const cols = Math.floor(canvasW / spacingPx);
  const rows = Math.floor(canvasH / spacingPx);
  const grid = new Array(cols * rows);
  let maxMag = 0;
  let minMag = Infinity;
  let k = 0;
  for (let j = 0; j < rows; j++) {
    const y_px = spacingPx / 2 + j * spacingPx;
    for (let i = 0; i < cols; i++) {
      const x_px = spacingPx / 2 + i * spacingPx;
      const { ex, ey, magnitude } = fieldAt(x_px, y_px, charges);
      grid[k++] = { x_px, y_px, ex, ey, magnitude };
      if (magnitude > maxMag) maxMag = magnitude;
      if (magnitude < minMag) minMag = magnitude;
    }
  }
  if (!isFinite(minMag)) minMag = 0;
  self.postMessage({ grid, maxMag, minMag });
};
