// Scale
export const PIXELS_PER_CM = 10;
export const PX_TO_M = 1e-3;

// Physics
export const K_COULOMB = 8.99e9;
export const R_MIN_M = 0.02;
export const R_CAPTURE_M = 0.03;
export const UC_TO_C = 1e-6;
export const NC_TO_C = 1e-9;
export const UG_TO_KG = 1e-9;

// Canvas
export const CANVAS_W = 1200;
export const CANVAS_H = 800;

// Charges
export const MAX_CHARGES = 10;
export const Q_MIN_UC = 1;
export const Q_MAX_UC = 10;
export const Q_STEP_UC = 0.5;

// Particles
export const MAX_PARTICLES = 3;
export const Q_PARTICLE_MIN_NC = 0.1;
export const Q_PARTICLE_MAX_NC = 10;
export const Q_PARTICLE_DEFAULT_NC = 1;
export const MASS_MIN_UG = 0.1;
export const MASS_MAX_UG = 100;
export const MASS_DEFAULT_UG = 10;
export const TIME_SCALE_MIN = 1e-6;
export const TIME_SCALE_MAX = 1e-2;
export const TIME_SCALE_DEFAULT = 1e-4;
export const SUB_STEPS = 50;
export const MAX_TRAIL_SECONDS = 10;

// Grid
export const DEFAULT_GRID_SPACING = 25;
export const GRID_SPACING_MIN = 15;
export const GRID_SPACING_MAX = 50;

// Particle colors (distinct from charge and colormap colors)
export const PARTICLE_COLORS = ['#00ff88', '#ff6fff', '#ffaa00'];

// Viridis LUT — 256 entries [r, g, b] (0–255).
// Populated in Phase 2 (js/renderer/color-map.js).
// Canonical source: https://github.com/BIDS/colormap/blob/master/colormaps.py
export const VIRIDIS = [];
