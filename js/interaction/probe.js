import { FieldEngine } from '../physics/engine.js';

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
    this.#result = { ...field, x_px: this.#lastX, y_px: this.#lastY };
  }
}
