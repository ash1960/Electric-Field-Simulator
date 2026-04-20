// Scale
export const PIXELS_PER_CM = 10;
export const PX_TO_M = 1e-3;

// Physics — MKS / SI
export const K_COULOMB = 9e9;           // Coulomb's constant [N·m²/C²]
export const EPSILON_0 = 8.85e-12;      // Vacuum permittivity [F/m]
export const E_CHARGE  = 1.602e-19;     // Elementary charge [C]
export const M_PROTON  = 1.67e-27;      // Proton mass [kg]
export const M_ELECTRON = 9.11e-31;     // Electron mass [kg]

export const R_MIN_M = 0.02;
export const R_CAPTURE_M = 0.03;
export const UC_TO_C = 1e-6;
export const NC_TO_C = 1e-9;
export const UG_TO_KG = 1e-9;

// Unit labels — authoritative SI unit names for documentation / UI.
export const UNITS = {
  force:          'Newton (N)',
  electric_field: 'N/C',
  charge:         'Coulomb (C)',
  mass:           'kg',
  energy:         'Joule (J)',
};

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
export const Q_PARTICLE_DEFAULT_NC = 5;
export const MASS_MIN_UG = 0.1;
export const MASS_MAX_UG = 100;
export const MASS_DEFAULT_UG = 1;
export const TIME_SCALE_MIN = 1e-6;
export const TIME_SCALE_MAX = 1e-2;
export const TIME_SCALE_DEFAULT = 1e-4;
export const SUB_STEPS = 50;
export const MAX_TRAIL_SECONDS = 10;           // kept for backwards-compat (unused by trimmer)
export const MAX_TRAIL_SECONDS_REAL = 10;      // trail retention in WALL-CLOCK seconds

// Grid
export const DEFAULT_GRID_SPACING = 25;
export const GRID_SPACING_MIN = 15;
export const GRID_SPACING_MAX = 50;

// Particle colors (distinct from charge and colormap colors)
export const PARTICLE_COLORS = ['#00ff88', '#ff6fff', '#ffaa00'];

// Charge visual radius (px) — used by charge-renderer and arrow skip zone.
export const CHARGE_RADIUS_PX = 20;

export const VIRIDIS = [];
