import {
  K_COULOMB,
  R_MIN_M,
  UC_TO_C,
  PX_TO_M,
  PIXELS_PER_CM,
} from './constants.js';

const SUPER = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻' };

function toSuperscript(intStr) {
  let out = '';
  for (const ch of intStr) out += SUPER[ch] ?? ch;
  return out;
}

export class FieldEngine {
  computeFieldAt(x_px, y_px, charges) {
    const px_m = x_px * PX_TO_M;
    const py_m = y_px * PX_TO_M;
    let ex = 0, ey = 0;

    for (const c of charges) {
      // Q enters signed; sign of Q determines field direction. NO flip on r̂.
      const Q_C = c.magnitude_uc * c.sign * UC_TO_C;
      const cx_m = c.x_px * PX_TO_M;
      const cy_m = c.y_px * PX_TO_M;
      const rx = px_m - cx_m;
      const ry = py_m - cy_m;
      const r_raw = Math.hypot(rx, ry);
      const r = Math.max(r_raw, R_MIN_M);
      const E_scalar = K_COULOMB * Q_C / (r * r);
      // r_hat = r_vec / r_raw (use raw to keep direction correct even when clamped).
      // When r_raw is 0 the field is undefined; skip contribution.
      if (r_raw === 0) continue;
      const inv = 1 / r_raw;
      ex += rx * inv * E_scalar;
      ey += ry * inv * E_scalar;
    }

    const magnitude = Math.hypot(ex, ey);
    const angle_deg = Math.atan2(ey, ex) * 180 / Math.PI;

    return {
      ex,
      ey,
      magnitude,
      angle_deg,
      pos_cm: { x: x_px / PIXELS_PER_CM, y: y_px / PIXELS_PER_CM },
    };
  }

  // Scientific notation with Unicode superscripts: 900000 → "9.00 × 10⁵"
  formatField(magnitude) {
    if (!isFinite(magnitude) || magnitude === 0) return '0';
    const sign = magnitude < 0 ? '-' : '';
    const abs = Math.abs(magnitude);
    const exp = Math.floor(Math.log10(abs));
    const mantissa = abs / Math.pow(10, exp);
    const m_str = mantissa.toFixed(2);
    return `${sign}${m_str} × 10${toSuperscript(String(exp))}`;
  }
}
