import { NC_TO_C } from '../physics/constants.js';

const PARTICLE_R = 8;
const F_COLOR = '#ff8844';
const V_COLOR = '#44ff88';

export function drawTrail(ctx, particle, scrubTimestamp) {
  const trail = particle.trail;
  if (!trail || trail.length < 2) return;

  ctx.save();
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  const n = trail.length;

  for (let i = 1; i < n; i++) {
    const a = trail[i - 1];
    const b = trail[i];
    let alpha = 0.1 + 0.7 * (i / n);
    if (scrubTimestamp != null && b.realT > scrubTimestamp) alpha *= 0.2;
    ctx.strokeStyle = _withAlpha(particle.color, alpha);
    ctx.beginPath();
    ctx.moveTo(a.x_px, a.y_px);
    ctx.lineTo(b.x_px, b.y_px);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawParticle(ctx, particle, isSelected) {
  ctx.save();
  ctx.shadowColor = particle.color;
  ctx.shadowBlur = 14;
  ctx.fillStyle = particle.color;
  ctx.beginPath();
  ctx.arc(particle.x_px, particle.y_px, PARTICLE_R, 0, Math.PI * 2);
  ctx.fill();

  if (isSelected) {
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(particle.x_px, particle.y_px, PARTICLE_R + 3, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#0d1117';
  ctx.font = 'bold 11px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(particle.sign > 0 ? '+' : '−', particle.x_px, particle.y_px + 1);
  ctx.restore();
}

function _drawScaledArrow(ctx, x, y, vx, vy, mag, refMag, color, label) {
  if (!mag || !refMag) return;
  const MIN_L = 18, MAX_L = 60;
  const t = Math.max(0, Math.min(1, Math.log10(1 + (mag / refMag) * 99) / 2));
  const length = MIN_L + (MAX_L - MIN_L) * t;
  const angle = Math.atan2(vy, vx);
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const headLen = Math.max(6, length * 0.3);
  const hw = headLen * 0.4;
  const shaftLen = length - headLen;
  const tx = x + cos * shaftLen;
  const ty = y + sin * shaftLen;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(tx, ty);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + cos * length, y + sin * length);
  ctx.lineTo(tx - sin * hw, ty + cos * hw);
  ctx.lineTo(tx + sin * hw, ty - cos * hw);
  ctx.closePath();
  ctx.fill();

  if (label) {
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + cos * length + 7, y + sin * length);
  }
  ctx.restore();
}

export function drawForceVector(ctx, particle, charges, engine, maxMag) {
  const E = engine.computeFieldAt(particle.x_px, particle.y_px, charges);
  const q_C = particle.magnitude_nc * particle.sign * NC_TO_C;
  const fx = q_C * E.ex;
  const fy = q_C * E.ey;
  const fMag = Math.hypot(fx, fy);
  const fRef = Math.abs(q_C) * maxMag;  // reference: |q| · maxField
  _drawScaledArrow(ctx, particle.x_px, particle.y_px, fx, fy, fMag, fRef, F_COLOR, 'Force');
}

export function drawVelocityVector(ctx, particle, maxSpeed) {
  const vMag = Math.hypot(particle.vx_ms, particle.vy_ms);
  _drawScaledArrow(
    ctx, particle.x_px, particle.y_px,
    particle.vx_ms, particle.vy_ms, vMag, maxSpeed || vMag || 1,
    V_COLOR, 'Velocity',
  );
}

function _withAlpha(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
