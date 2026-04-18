// Viridis LUT — 256 [r,g,b] entries, generated from the canonical polynomial.
// Polynomial coefficients from: https://www.shadertoy.com/view/WlfXRN (Viridis fit)
function _buildViridis() {
  // Horner-form polynomial for each channel: v(t) = c0 + t*(c1 + t*(c2 + t*(c3 + t*(c4 + t*(c5 + t*c6)))))
  const cr = [0.2777273272234177,  0.1050930431085774, -0.3308618287255563, -4.634230498983486,   6.228269936347081,  4.776384997670288, -5.435455855934631];
  const cg = [0.005407344544966578, 1.404613529898575,  0.214847559468213,  -5.799100973351585,  14.17993336680509, -13.74514537774601,  4.645852612178535];
  const cb = [0.3340998053353061,   1.384590162594685,  0.09509516302823659,-19.33244095627987,   56.69055260068105, -65.35303263337234, 26.3124352495832 ];

  function horner(c, t) {
    return c[0] + t * (c[1] + t * (c[2] + t * (c[3] + t * (c[4] + t * (c[5] + t * c[6])))));
  }

  const lut = [];
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    lut.push([
      Math.round(Math.max(0, Math.min(1, horner(cr, t))) * 255),
      Math.round(Math.max(0, Math.min(1, horner(cg, t))) * 255),
      Math.round(Math.max(0, Math.min(1, horner(cb, t))) * 255),
    ]);
  }
  return lut;
}

export const VIRIDIS = _buildViridis();

export function magnitudeToColor(magnitude, maxMag) {
  if (maxMag === 0) return { r: 68, g: 1, b: 84, alpha: 0.25 };
  const t = Math.log10(1 + (magnitude / maxMag) * 999) / 3;
  const tc = Math.max(0, Math.min(1, t));
  const idx = Math.min(255, Math.floor(tc * 255));
  const [r, g, b] = VIRIDIS[idx];
  return { r, g, b, alpha: 0.25 + tc * 0.7 };
}
