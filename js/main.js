// Phase 2 — visual bootstrap. Phase 3 will replace with full orchestrator.

import { CanvasManager } from './renderer/canvas-manager.js';
import { CANVAS_W, CANVAS_H, DEFAULT_GRID_SPACING } from './config.js';

const canvas = document.getElementById('field-canvas');
const cm = new CanvasManager(canvas);

const charges = [{ x_px: 600, y_px: 400, magnitude_uc: 1, sign: +1 }];

// Initial render: charges + UI chrome, no field arrows yet
cm.render(charges, null, null, [], null, null, DEFAULT_GRID_SPACING, false, null);

// Kick off worker for field grid
const worker = new Worker('./js/physics/grid-worker.js');
worker.onmessage = ({ data }) => {
  cm.render(charges, data, null, [], null, null, DEFAULT_GRID_SPACING, false, null);
  console.log(`[Phase 2] ✅ rendered — grid.length=${data.grid.length}, maxMag=${data.maxMag.toExponential(3)}`);
};
worker.onerror = (e) => console.error('[Phase 2] worker error:', e.message);
worker.postMessage({ charges, canvasW: CANVAS_W, canvasH: CANVAS_H, spacingPx: DEFAULT_GRID_SPACING });
