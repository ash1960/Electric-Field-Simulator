import { FieldEngine } from '../physics/engine.js';
import { K_COULOMB, R_MIN_M, UC_TO_C, PX_TO_M } from '../physics/constants.js';

// UX-only snap: when |E_net| is small relative to Σ|Eᵢ|, the probe sits in a
// cancellation zone the user is trying to find. Snap the *displayed* readout
// to zero so they can rest there without sub-pixel mouse precision. Engine
// output is unaffected — particles and grid still see the true field.
// 2% gives ~3px snap radius near the midpoint of two equal charges at typical
// (~30cm) separation; tighter near closely-spaced charges, wider when far apart.
const CANCELLATION_RATIO = 0.02;

function sumIndividualMagnitudes(x_px, y_px, charges) {
  const px_m = x_px * PX_TO_M;
  const py_m = y_px * PX_TO_M;
  let sum = 0;
  for (const c of charges) {
    const Q_C = c.magnitude_uc * c.sign * UC_TO_C;
    const rx = px_m - c.x_px * PX_TO_M;
    const ry = py_m - c.y_px * PX_TO_M;
    const r = Math.max(Math.hypot(rx, ry), R_MIN_M);
    sum += Math.abs(K_COULOMB * Q_C / (r * r));
  }
  return sum;
}

export class Probe {
  #canvas;
  #engine;
  #result = null;
  #lastX = -1;
  #lastY = -1;

  constructor(canvas) {
    this.#canvas = canvas;
    this.#engine = new FieldEngine();
  }

  onMouseMove(e, charges, isDragging) {
    if (isDragging) { this.#result = null; this.#lastX = -1; return; }
    const r = this.#canvas.getBoundingClientRect();
    this.#lastX = (e.clientX - r.left) * (this.#canvas.width  / r.width);
    this.#lastY = (e.clientY - r.top)  * (this.#canvas.height / r.height);
    this._recompute(charges);
  }

  refresh(charges, isDragging) {
    if (isDragging || this.#lastX < 0) { this.#result = null; return; }
    this._recompute(charges);
  }

  clear() { this.#result = null; this.#lastX = -1; }

  get result() { return this.#result; }

  _recompute(charges) {
    if (!charges.length) { this.#result = null; return; }
    const field = this.#engine.computeFieldAt(this.#lastX, this.#lastY, charges);
    const sumIndiv = sumIndividualMagnitudes(this.#lastX, this.#lastY, charges);
    const inCancellationZone = sumIndiv > 0 && field.magnitude / sumIndiv < CANCELLATION_RATIO;
    this.#result = inCancellationZone
      ? { ex: 0, ey: 0, magnitude: 0, angle_deg: 0, pos_cm: field.pos_cm, x_px: this.#lastX, y_px: this.#lastY }
      : { ...field, x_px: this.#lastX, y_px: this.#lastY };
  }
}
