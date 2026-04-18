import { magnitudeToColor } from './color-map.js';
import { CHARGE_RADIUS_PX } from '../config.js';

const SKIP_MARGIN = 4; // extra px beyond charge radius where arrows are suppressed

export function drawArrow(ctx, x_px, y_px, ex, ey, magnitude, maxMag, gridSpacing) {
  const MAX_ARROW = gridSpacing * 0.7;
  const MIN_ARROW = gridSpacing * 0.2;
  const t = Math.log10(1 + (magnitude / maxMag) * 99) / 2;
  const length = MIN_ARROW + (MAX_ARROW - MIN_ARROW) * t;

  const angle = Math.atan2(ey, ex);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const { r, g, b, alpha } = magnitudeToColor(magnitude, maxMag);
  ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
  ctx.fillStyle   = `rgba(${r},${g},${b},${alpha})`;
  ctx.lineWidth = 1.2;

  // Shaft: from tail to just before arrowhead
  const headLen = Math.max(3, length * 0.3);
  const shaftLen = length - headLen;
  const tx = x_px + cos * shaftLen;
  const ty = y_px + sin * shaftLen;

  ctx.beginPath();
  ctx.moveTo(x_px, y_px);
  ctx.lineTo(tx, ty);
  ctx.stroke();

  // Arrowhead (filled triangle)
  const hw = headLen * 0.35;
  ctx.beginPath();
  ctx.moveTo(x_px + cos * length, y_px + sin * length);
  ctx.lineTo(tx - sin * hw, ty + cos * hw);
  ctx.lineTo(tx + sin * hw, ty - cos * hw);
  ctx.closePath();
  ctx.fill();
}

export function renderGrid(ctx, gridResult, charges, gridSpacing) {
  const { grid, maxMag } = gridResult;
  if (maxMag === 0) return;

  for (const pt of grid) {
    // Skip arrows inside any charge's visual radius
    let skip = false;
    for (const c of charges) {
      const dx = pt.x_px - c.x_px;
      const dy = pt.y_px - c.y_px;
      if (Math.hypot(dx, dy) < CHARGE_RADIUS_PX + SKIP_MARGIN) { skip = true; break; }
    }
    if (skip) continue;
    drawArrow(ctx, pt.x_px, pt.y_px, pt.ex, pt.ey, pt.magnitude, maxMag, gridSpacing);
  }
}
