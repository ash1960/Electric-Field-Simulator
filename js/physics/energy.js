import { K_COULOMB, R_MIN_M, UC_TO_C, PX_TO_M } from './constants.js';

// U = Σᵢ k · Qᵢ · q / rᵢ  (joules). rᵢ clamped to R_MIN_M.
export function computePotentialEnergy(particle, charges) {
  const q_C = particle.charge_C;
  const px_m = particle.x_px * PX_TO_M;
  const py_m = particle.y_px * PX_TO_M;
  let U = 0;
  for (const c of charges) {
    const Q_C = c.magnitude_uc * c.sign * UC_TO_C;
    const rx = px_m - c.x_px * PX_TO_M;
    const ry = py_m - c.y_px * PX_TO_M;
    const r = Math.max(Math.hypot(rx, ry), R_MIN_M);
    U += K_COULOMB * Q_C * q_C / r;
  }
  return U;
}

// K = ½mv²  (joules).
export function computeKineticEnergy(particle) {
  const v2 = particle.vx_ms * particle.vx_ms + particle.vy_ms * particle.vy_ms;
  return 0.5 * particle.mass_kg * v2;
}
