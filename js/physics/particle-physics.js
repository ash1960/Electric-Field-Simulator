import {
  NC_TO_C, PX_TO_M, R_CAPTURE_M,
} from './constants.js';
import {
  SUB_STEPS, MAX_TRAIL_SECONDS, CANVAS_W, CANVAS_H,
} from '../config.js';
import { Vector2D } from './vector.js';
import {
  computePotentialEnergy, computeKineticEnergy,
} from './energy.js';

const EXIT_MARGIN_PX = 50;
const FRAME_DT_S = 1 / 60;

export class ParticlePhysics {
  constructor(engine) {
    this.engine = engine;
  }

  step(particle, charges, timeScale, subSteps = SUB_STEPS) {
    if (particle.state !== 'moving') return;

    const dt_frame = FRAME_DT_S * timeScale;
    const dt_sub = dt_frame / subSteps;
    const q_C = particle.magnitude_nc * particle.sign * NC_TO_C;
    const m_kg = particle.mass_kg;

    for (let i = 0; i < subSteps; i++) {
      const prevX_px = particle.x_px;
      const prevY_px = particle.y_px;

      // Velocity Verlet — position update
      const E0 = this.engine.computeFieldAt(prevX_px, prevY_px, charges);
      const ax = q_C * E0.ex / m_kg;
      const ay = q_C * E0.ey / m_kg;

      const dx_m = particle.vx_ms * dt_sub + 0.5 * ax * dt_sub * dt_sub;
      const dy_m = particle.vy_ms * dt_sub + 0.5 * ay * dt_sub * dt_sub;
      particle.x_px = prevX_px + dx_m / PX_TO_M;
      particle.y_px = prevY_px + dy_m / PX_TO_M;

      // Velocity Verlet — velocity update (avg of old & new accel)
      const E1 = this.engine.computeFieldAt(particle.x_px, particle.y_px, charges);
      const ax_new = q_C * E1.ex / m_kg;
      const ay_new = q_C * E1.ey / m_kg;
      particle.vx_ms += 0.5 * (ax + ax_new) * dt_sub;
      particle.vy_ms += 0.5 * (ay + ay_new) * dt_sub;

      // ── Anti-tunneling: segment test against every charge ──
      const A = new Vector2D(prevX_px, prevY_px);
      const B = new Vector2D(particle.x_px, particle.y_px);
      let captured = false;
      for (const c of charges) {
        const C = new Vector2D(c.x_px, c.y_px);
        const segDist_m = C.distanceToSegment(A, B) * PX_TO_M;
        if (segDist_m < R_CAPTURE_M) {
          const cp = C.closestPointOnSegment(A, B);
          particle.x_px = cp.x;
          particle.y_px = cp.y;
          particle.vx_ms = 0;
          particle.vy_ms = 0;
          particle.state = 'captured';
          captured = true;
          this._recordTrail(particle, charges);
          break;
        }
      }
      if (captured) return;

      particle.simTime += dt_sub;

      // Energy sample every 3rd sub-step
      if (i % 3 === 0) this._recordTrail(particle, charges);

      // Exit check
      if (
        particle.x_px < -EXIT_MARGIN_PX || particle.x_px > CANVAS_W + EXIT_MARGIN_PX ||
        particle.y_px < -EXIT_MARGIN_PX || particle.y_px > CANVAS_H + EXIT_MARGIN_PX
      ) {
        particle.state = 'exited';
        return;
      }
    }
  }

  _recordTrail(particle, charges) {
    const U = computePotentialEnergy(particle, charges);
    const K = computeKineticEnergy(particle);
    particle.trail.push({
      t: particle.simTime,
      x_px: particle.x_px,
      y_px: particle.y_px,
      U, K, E_total: U + K,
    });
    // Trim entries older than MAX_TRAIL_SECONDS (in sim-time)
    const cutoff = particle.simTime - MAX_TRAIL_SECONDS;
    while (particle.trail.length && particle.trail[0].t < cutoff) {
      particle.trail.shift();
    }
  }
}
