import { VIRIDIS } from './color-map.js';

const BAR_X = 10;
const BAR_Y = 200;
const BAR_W = 20;
const BAR_H = 400;

export function drawColorBar(ctx, maxMag, formatField) {
  if (!maxMag) return;

  // Gradient top→bottom: max magnitude (index 255) at top, min (index 0) at bottom
  const grad = ctx.createLinearGradient(BAR_X, BAR_Y, BAR_X, BAR_Y + BAR_H);
  for (let i = 0; i <= 255; i++) {
    const [r, g, b] = VIRIDIS[255 - i];
    grad.addColorStop(i / 255, `rgb(${r},${g},${b})`);
  }

  ctx.fillStyle = grad;
  ctx.fillRect(BAR_X, BAR_Y, BAR_W, BAR_H);

  // Border
  ctx.strokeStyle = '#30363d';
  ctx.lineWidth = 1;
  ctx.strokeRect(BAR_X, BAR_Y, BAR_W, BAR_H);

  // Ticks at 0%, 25%, 50%, 75%, 100%
  ctx.font = '11px system-ui';
  ctx.fillStyle = '#e6edf3';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  for (let pct = 0; pct <= 1; pct += 0.25) {
    const tickY = BAR_Y + BAR_H * (1 - pct);
    // magnitude that maps to this pct in log scale:  pct = log10(1 + mag/maxMag*999)/3
    // → mag = maxMag * (10^(pct*3) - 1) / 999
    const mag = maxMag * (Math.pow(10, pct * 3) - 1) / 999;
    ctx.beginPath();
    ctx.moveTo(BAR_X + BAR_W, tickY);
    ctx.lineTo(BAR_X + BAR_W + 4, tickY);
    ctx.strokeStyle = '#e6edf3';
    ctx.stroke();
    ctx.fillText(formatField(mag), BAR_X + BAR_W + 7, tickY);
  }

  // Title '|E| (V/m)' rotated 90°
  ctx.save();
  ctx.translate(BAR_X - 2, BAR_Y + BAR_H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.font = '13px system-ui';
  ctx.fillStyle = '#e6edf3';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('|E| (V/m)', 0, 0);
  ctx.restore();
}
