import { CHARGE_RADIUS_PX } from '../config.js';

const HIT_CHARGE   = CHARGE_RADIUS_PX + 4;
const HIT_PARTICLE = 12;

export class DragManager {
  #canvas; #getCharges; #getParticles;
  #onDragStart; #onDragEnd; #onDragMove;
  #dragging = null;
  #isDraggingCharge = false;

  constructor(canvas, getCharges, getParticles, onDragStart, onDragEnd, onDragMove) {
    this.#canvas       = canvas;
    this.#getCharges   = getCharges;
    this.#getParticles = getParticles;
    this.#onDragStart  = onDragStart;
    this.#onDragEnd    = onDragEnd;
    this.#onDragMove   = onDragMove;
    this._onDown = this._onDown.bind(this);
    this._onMove = this._onMove.bind(this);
    this._onUp   = this._onUp.bind(this);
  }

  bind() {
    this.#canvas.addEventListener('pointerdown',   this._onDown);
    this.#canvas.addEventListener('pointermove',   this._onMove);
    this.#canvas.addEventListener('pointerup',     this._onUp);
    this.#canvas.addEventListener('pointercancel', this._onUp);
  }

  destroy() {
    this.#canvas.removeEventListener('pointerdown',   this._onDown);
    this.#canvas.removeEventListener('pointermove',   this._onMove);
    this.#canvas.removeEventListener('pointerup',     this._onUp);
    this.#canvas.removeEventListener('pointercancel', this._onUp);
  }

  get isDraggingCharge() { return this.#isDraggingCharge; }

  _pos(e) {
    const r = this.#canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (this.#canvas.width  / r.width),
      y: (e.clientY - r.top)  * (this.#canvas.height / r.height),
    };
  }

  _hit(x, y) {
    for (const c of this.#getCharges())
      if (Math.hypot(x - c.x_px, y - c.y_px) <= HIT_CHARGE)
        return { id: c.id, type: 'charge', entity: c };
    for (const p of this.#getParticles())
      if (Math.hypot(x - p.x_px, y - p.y_px) <= HIT_PARTICLE)
        return { id: p.id, type: 'particle', entity: p };
    return null;
  }

  _onDown(e) {
    const { x, y } = this._pos(e);
    const hit = this._hit(x, y);
    if (!hit) return;
    e.preventDefault();
    this.#canvas.setPointerCapture(e.pointerId);
    this.#dragging = { ...hit, mouseDownX: x, mouseDownY: y, dominantAxis: null, lockedCoord: null };
    if (hit.type === 'charge') this.#isDraggingCharge = true;
    this.#onDragStart(hit.id, hit.type);
    this.#canvas.style.cursor = 'grabbing';
  }

  _onMove(e) {
    const { x, y } = this._pos(e);
    const d = this.#dragging;
    if (!d) {
      this.#canvas.style.cursor = this._hit(x, y) ? 'grab' : 'crosshair';
      return;
    }
    let nx = x, ny = y;

    if (e.shiftKey) {
      if (!d.dominantAxis) {
        const dx = Math.abs(x - d.mouseDownX);
        const dy = Math.abs(y - d.mouseDownY);
        if (dx > 3 || dy > 3) {
          d.dominantAxis = dx >= dy ? 'x' : 'y';
          d.lockedCoord  = d.dominantAxis === 'x' ? d.entity.y_px : d.entity.x_px;
        }
      }
      if (d.dominantAxis === 'x') ny = d.lockedCoord;
      else if (d.dominantAxis === 'y') nx = d.lockedCoord;
    } else {
      d.dominantAxis = null;
    }

    d.entity.x_px = Math.max(0, Math.min(this.#canvas.width,  nx));
    d.entity.y_px = Math.max(0, Math.min(this.#canvas.height, ny));
    this.#onDragMove?.(d.id, d.type);
  }

  _onUp(e) {
    if (!this.#dragging) return;
    const { id, type } = this.#dragging;
    this.#dragging = null;
    if (type === 'charge') this.#isDraggingCharge = false;
    this.#onDragEnd(id, type);
    const { x, y } = this._pos(e);
    this.#canvas.style.cursor = this._hit(x, y) ? 'grab' : 'crosshair';
  }
}
