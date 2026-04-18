import { CHARGE_RADIUS_PX, PIXELS_PER_CM } from '../config.js';

const COLOR_POS = '#ff6b6b';
const COLOR_NEG = '#4dabf7';

export function drawCharge(ctx, charge) {
  const color = charge.sign > 0 ? COLOR_POS : COLOR_NEG;
  const { x_px, y_px } = charge;

  ctx.save();
  ctx.shadowBlur = 20;
  ctx.shadowColor = color;

  ctx.beginPath();
  ctx.arc(x_px, y_px, CHARGE_RADIUS_PX, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.shadowBlur = 0;

  // +/− symbol
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(charge.sign > 0 ? '+' : '−', x_px, y_px);

  ctx.restore();
}

export function drawChargeLabel(ctx, charge) {
  const { x_px, y_px, magnitude_uc, sign } = charge;
  const signStr = sign > 0 ? '+' : '−';
  const qLabel = `Q = ${signStr}${magnitude_uc.toFixed(1)} μC`;
  const xCm = (x_px / PIXELS_PER_CM).toFixed(1);
  const yCm = (y_px / PIXELS_PER_CM).toFixed(1);
  const posLabel = `(${xCm}, ${yCm}) cm`;

  ctx.save();
  ctx.font = '12px system-ui';
  ctx.fillStyle = '#e6edf3';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // Flip above if near the bottom edge
  const lineH = 15;
  const offsetY = y_px + CHARGE_RADIUS_PX + 4;
  const yPos = offsetY + lineH * 2 > ctx.canvas.height - 10
    ? y_px - CHARGE_RADIUS_PX - 4 - lineH * 2
    : offsetY;

  ctx.fillText(qLabel, x_px, yPos);
  ctx.fillText(posLabel, x_px, yPos + lineH);
  ctx.restore();
}
