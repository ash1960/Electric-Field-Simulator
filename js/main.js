import { CanvasManager }    from './renderer/canvas-manager.js';
import { DragManager }      from './interaction/drag-manager.js';
import { Probe }            from './interaction/probe.js';
import { KeyboardManager }  from './interaction/keyboard.js';
import { HelpOverlay }      from './interaction/help-overlay.js';
import { UIControls }       from './interaction/ui-controls.js';
import { ParticleManager }  from './interaction/particle-manager.js';
import {
  CANVAS_W, CANVAS_H, DEFAULT_GRID_SPACING, TIME_SCALE_DEFAULT,
  Q_MIN_UC, Q_MAX_UC, Q_STEP_UC, MAX_CHARGES,
} from './config.js';

// ── State ─────────────────────────────────────────────────────
const canvas = document.getElementById('field-canvas');

const state = {
  charges: [],
  gridResult: null,
  gridSpacing: DEFAULT_GRID_SPACING,
  selectedId: null,
  selectedType: null,
  showVectors: false,
  paused: false,
  timeScale: TIME_SCALE_DEFAULT,
  scrubTimestamp: null,
};

let chargeSeq = 0;
const uid = () => `c${++chargeSeq}`;

// ── Presets ───────────────────────────────────────────────────
const PRESETS = {
  dipole: [
    { magnitude_uc: 5, sign: +1, x_px: 400, y_px: 400 },
    { magnitude_uc: 5, sign: -1, x_px: 800, y_px: 400 },
  ],
  quadrupole: [
    { magnitude_uc: 3, sign: +1, x_px: 350, y_px: 267 },
    { magnitude_uc: 3, sign: -1, x_px: 850, y_px: 267 },
    { magnitude_uc: 3, sign: -1, x_px: 350, y_px: 533 },
    { magnitude_uc: 3, sign: +1, x_px: 850, y_px: 533 },
  ],
  line: [200, 400, 600, 800, 1000].map(x => ({ magnitude_uc: 2, sign: +1, x_px: x, y_px: 400 })),
};

// ── Worker ────────────────────────────────────────────────────
const worker = new Worker('./js/physics/grid-worker.js');
worker.onmessage = ({ data }) => { state.gridResult = data; };
worker.onerror   = (e) => console.error('[worker]', e.message);

function recomputeGrid() {
  if (!state.charges.length) { state.gridResult = null; return; }
  worker.postMessage({
    charges: state.charges, canvasW: CANVAS_W, canvasH: CANVAS_H,
    spacingPx: drag.isDraggingCharge ? state.gridSpacing * 2 : state.gridSpacing,
  });
}

// ── Selection helpers ─────────────────────────────────────────
function selectCharge(id) {
  state.selectedId   = id;
  state.selectedType = 'charge';
  ui.showChargeProperties(state.charges.find(c => c.id === id) ?? null);
  ui.showParticleProperties(null);
}
function selectParticle(id) {
  state.selectedId   = id;
  state.selectedType = 'particle';
  ui.showParticleProperties(pm.particles.find(p => p.id === id) ?? null);
  ui.showChargeProperties(null);
}
function deselect() {
  state.selectedId = null; state.selectedType = null;
  ui.showChargeProperties(null);
  ui.showParticleProperties(null);
}

// ── UI callbacks ──────────────────────────────────────────────
const uiCb = {
  onChargeAdd({ magnitude_uc, sign }) {
    if (state.charges.length >= MAX_CHARGES) return;
    const c = {
      id: uid(),
      x_px: CANVAS_W / 2 + (Math.random() - 0.5) * 80,
      y_px: CANVAS_H / 2 + (Math.random() - 0.5) * 80,
      magnitude_uc, sign,
    };
    state.charges.push(c);
    selectCharge(c.id);
    ui.updateStatus(state.charges, pm.particles);
    recomputeGrid();
  },
  onChargeDelete(id) {
    state.charges = state.charges.filter(c => c.id !== id);
    if (state.selectedId === id) deselect();
    ui.updateStatus(state.charges, pm.particles);
    recomputeGrid();
  },
  onChargeUpdate(id, { magnitude_uc, sign, flipSign }) {
    const c = state.charges.find(c => c.id === id);
    if (!c) return;
    if (magnitude_uc != null) c.magnitude_uc = magnitude_uc;
    if (sign != null)         c.sign = sign;
    if (flipSign)             c.sign = -c.sign;
    ui.showChargeProperties(c);
    ui.updateStatus(state.charges, pm.particles);
    recomputeGrid();
  },
  onParticleAdd() {
    if (pm.particles.length >= 3) return;
    pm.add(CANVAS_W / 2, CANVAS_H / 2 - 120, 1, +1, 10);
    ui.updateStatus(state.charges, pm.particles);
  },
  onParticleUpdate(id, changes) {
    const p = id ? pm.particles.find(p => p.id === id)
                 : (state.selectedType === 'particle'
                    ? pm.particles.find(p => p.id === state.selectedId)
                    : pm.particles[0]);
    if (!p) return;
    if (changes.magnitude_nc != null) p.magnitude_nc = changes.magnitude_nc;
    if (changes.mass_ug      != null) p.mass_kg = changes.mass_ug * 1e-9;
    if (changes.flipSign)             p.sign = -p.sign;
    ui.showParticleProperties(p);
  },
  onParticleRemove(id) {
    const target = id ?? (state.selectedType === 'particle' ? state.selectedId : null);
    if (!target) return;
    pm.remove(target);
    if (state.selectedId === target) deselect();
    ui.updateStatus(state.charges, pm.particles);
  },
  onParticleReset(id) { pm.reset(id); },
  onPresetLoad(name) {
    state.charges = PRESETS[name].map(c => ({ id: uid(), ...c }));
    pm.clear();
    deselect();
    ui.updateStatus(state.charges, pm.particles);
    recomputeGrid();
  },
  onGridSpacingChange(px) { state.gridSpacing = px; recomputeGrid(); },
  onClearAll() {
    state.charges = []; pm.clear(); deselect();
    state.gridResult = null;
    ui.updateStatus(state.charges, pm.particles);
  },
  onToggleVectors(show) { state.showVectors = show; },
  onToggleEnergyPanel(show) {
    document.getElementById('energy-drawer').classList.toggle('open', show);
  },
  onTogglePause() { state.paused = !state.paused; ui.setPauseState(state.paused); },
  onTimeScaleChange(v) { state.timeScale = v; },
};

// ── Drag callbacks ────────────────────────────────────────────
function onDragStart(id, type) {
  if (type === 'charge') selectCharge(id);
  else                   selectParticle(id);
}
function onDragEnd(id, type) {
  if (type === 'charge') recomputeGrid();
  // Phase 4: if type==='particle' → set state.moving
}
function onDragMove(_id, type) {
  if (type === 'charge') recomputeGrid();
}

// ── Keyboard callbacks ────────────────────────────────────────
const kbCb = {
  onDelete() {
    if (!state.selectedId) return;
    if (state.selectedType === 'charge')   uiCb.onChargeDelete(state.selectedId);
    else                                    uiCb.onParticleRemove(state.selectedId);
  },
  onClear() { uiCb.onClearAll(); },
  onPreset(name) { uiCb.onPresetLoad(name); },
  onFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  },
  onAdjustQ(dir) {
    if (!state.selectedId || state.selectedType !== 'charge') return;
    const c = state.charges.find(c => c.id === state.selectedId);
    if (c) uiCb.onChargeUpdate(c.id, { magnitude_uc: Math.max(Q_MIN_UC, Math.min(Q_MAX_UC, c.magnitude_uc + dir * Q_STEP_UC)) });
  },
  onFlipSign() {
    if (!state.selectedId) return;
    if (state.selectedType === 'charge')   uiCb.onChargeUpdate(state.selectedId, { flipSign: true });
    else                                    uiCb.onParticleUpdate(state.selectedId, { flipSign: true });
  },
  onResetParticles() { pm.reset('all'); },
  onToggleVectors()  { state.showVectors = !state.showVectors; },
  onTogglePause()    { uiCb.onTogglePause(); },
  onToggleHelp()     { help.toggle(); },
};

// ── Canvas click (? btn, fullscreen btn, deselect) ────────────
canvas.addEventListener('click', (e) => {
  if (e.defaultPrevented) return; // was a drag
  const r = canvas.getBoundingClientRect();
  const x = (e.clientX - r.left) * (CANVAS_W / r.width);
  const y = (e.clientY - r.top)  * (CANVAS_H / r.height);

  if (Math.hypot(x - 30, y - 30) <= 16)                    { help.toggle(); return; }
  if (Math.hypot(x - (CANVAS_W - 30), y - 30) <= 20)       { kbCb.onFullscreen(); return; }

  const hitCharge   = state.charges.some(c => Math.hypot(x - c.x_px, y - c.y_px) <= 24);
  const hitParticle = pm.particles.some(p => Math.hypot(x - p.x_px, y - p.y_px) <= 12);
  if (!hitCharge && !hitParticle) deselect();
});

// ── Probe ─────────────────────────────────────────────────────
const probe = new Probe(canvas);
canvas.addEventListener('mousemove',  (e) => probe.onMouseMove(e, state.charges, drag.isDraggingCharge));
canvas.addEventListener('mouseleave', ()  => probe.clear());

// ── Instantiate ───────────────────────────────────────────────
const cm   = new CanvasManager(canvas);
const pm   = new ParticleManager();
const help = new HelpOverlay();
const ui   = new UIControls(uiCb);
const drag = new DragManager(canvas, () => state.charges, () => pm.particles, onDragStart, onDragEnd, onDragMove);
const kb   = new KeyboardManager(kbCb);

drag.bind();
kb.bind();
ui.init();
// Force density slider to correct default — browser range inputs sometimes settle at midpoint of [0,100] before min/max are applied
uiCb.onGridSpacingChange(DEFAULT_GRID_SPACING);
canvas.style.cursor = 'crosshair';

// Default: one +1 μC charge at canvas centre
state.charges.push({ id: uid(), x_px: 600, y_px: 400, magnitude_uc: 1, sign: +1 });
ui.updateStatus(state.charges, pm.particles);
recomputeGrid();

// ── Render loop ───────────────────────────────────────────────
function loop() {
  // Phase 4: particle stepping will go here (guarded by !state.paused)
  probe.refresh(state.charges, drag.isDraggingCharge);
  cm.render(
    state.charges, state.gridResult,
    drag.isDraggingCharge ? null : probe.result,
    pm.particles,
    state.selectedId, state.selectedType,
    state.gridSpacing, state.showVectors, state.scrubTimestamp,
  );
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

console.log('[Phase 3] ✅ interaction ready');
