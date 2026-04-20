import { UG_TO_KG, PARTICLE_COLORS } from '../config.js';

export class ParticleManager {
  #particles = [];
  #colorIdx = 0;

  add(x_px, y_px, magnitude_nc, sign, mass_ug) {
    const p = {
      id: crypto.randomUUID(),
      x_px, y_px,
      drop_x_px: x_px, drop_y_px: y_px,
      vx_ms: 0, vy_ms: 0,
      magnitude_nc, sign,
      mass_kg: mass_ug * UG_TO_KG,
      state: 'held',
      color: PARTICLE_COLORS[this.#colorIdx++ % PARTICLE_COLORS.length],
      trail: [],
      simTime: 0,
      realTime: 0,
    };
    this.#particles.push(p);
    return p;
  }

  remove(id) {
    this.#particles = this.#particles.filter(p => p.id !== id);
  }

  reset(id) {
    const targets = id === 'all' ? this.#particles : this.#particles.filter(p => p.id === id);
    for (const p of targets) {
      p.x_px = p.drop_x_px;
      p.y_px = p.drop_y_px;
      p.vx_ms = 0; p.vy_ms = 0;
      p.state = 'held';
      p.trail = [];
      p.simTime = 0;
      p.realTime = 0;
    }
  }

  clear() {
    this.#particles = [];
    this.#colorIdx = 0;
  }

  get particles() { return this.#particles; }
}
