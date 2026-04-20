import { renderGrid } from './arrow-renderer.js';
import { drawCharge, drawChargeLabel } from './charge-renderer.js';
import { drawColorBar } from './color-bar.js';
import {
  drawTrail, drawParticle, drawForceVector, drawVelocityVector,
} from './particle-renderer.js';
import { FieldEngine } from '../physics/engine.js';

const _engine = new FieldEngine();

export class CanvasManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  render(charges, gridResult, probeResult, particles, selectedId, selectedType,
         gridSpacing, showVectors, scrubTimestamp, maxSpeed = 1, scrubXY = null) {
    const { ctx, canvas } = this;

    // 1. Clear + background
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Color bar
    if (gridResult) {
      drawColorBar(ctx, gridResult.maxMag, (m) => _engine.formatField(m));
    }

    // 3. Field arrows
    if (gridResult) {
      renderGrid(ctx, gridResult, charges, gridSpacing);
    }

    // 4. Particle trails
    if (particles) {
      for (const p of particles) drawTrail(ctx, p, scrubTimestamp);
    }

    // 5. Charges + labels
    for (const c of charges) {
      drawCharge(ctx, c, c.id === selectedId);
      drawChargeLabel(ctx, c);
    }

    // 6. Particles + F/v vectors
    if (particles) {
      const maxMag = gridResult?.maxMag ?? 0;
      for (const p of particles) {
        drawParticle(ctx, p, p.id === selectedId);
        if (showVectors && maxMag > 0) {
          drawForceVector(ctx, p, charges, _engine, maxMag);
          drawVelocityVector(ctx, p, maxSpeed);
        }
      }
    }

    // 7. Scale bar
    this._drawScaleBar();

    // 8. Probe overlay — Phase 3
    if (probeResult) {
      this._drawProbe(probeResult, gridResult?.maxMag ?? 0);
    }

    // 9. Scrub crosshair — Phase 5
    if (scrubXY) this.drawScrubCrosshair(scrubXY.x_px, scrubXY.y_px);

    // 10. Fullscreen button
    this._drawFullscreenButton();

    // 11. Help button
    this._drawHelpButton();
  }

  _drawScaleBar() {
    const { ctx, canvas } = this;
    const barPx = 100; // 10 cm
    const x = canvas.width - 130;
    const y = canvas.height - 30;

    ctx.save();
    ctx.fillStyle = 'rgba(13,17,23,0.7)';
    ctx.fillRect(x - 8, y - 14, barPx + 16, 28);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // End caps
    ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 5);
    ctx.moveTo(x + barPx, y - 5); ctx.lineTo(x + barPx, y + 5);
    // Bar
    ctx.moveTo(x, y); ctx.lineTo(x + barPx, y);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('10 cm', x + barPx / 2, y + 10);
    ctx.restore();
  }

  _drawHelpButton() {
    const { ctx } = this;
    const x = 30, y = 30, r = 16;
    ctx.save();
    ctx.strokeStyle = '#58a6ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#58a6ff';
    ctx.font = 'bold 16px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', x, y);
    ctx.restore();
  }

  _drawFullscreenButton() {
    const { ctx, canvas } = this;
    const x = canvas.width - 30, y = 30, s = 10;
    ctx.save();
    ctx.strokeStyle = '#58a6ff';
    ctx.lineWidth = 1.5;
    // Four corner arrows (expand icon)
    const corners = [[-1,-1],[1,-1],[1,1],[-1,1]];
    for (const [dx, dy] of corners) {
      const cx = x + dx * s, cy = y + dy * s;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + dx * 5, cy);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy + dy * 5);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawProbe({ x_px, y_px, ex, ey, magnitude, angle_deg, pos_cm }, maxMag) {
    if (!magnitude) return;
    const { ctx, canvas } = this;
    const angle = Math.atan2(ey, ex);

    // Direction + magnitude arrow at cursor (log-scaled, wider range for clear visual feedback).
    const MIN_AL = 20, MAX_AL = 120;
    const t = maxMag > 0 ? Math.log10(1 + (magnitude / maxMag) * 999) / 3 : 0.5;
    const AL = MIN_AL + (MAX_AL - MIN_AL) * Math.max(0, Math.min(1, t));
    const HL = Math.max(7, AL * 0.28);
    const HA = 0.45;
    const tx = x_px + Math.cos(angle) * AL;
    const ty = y_px + Math.sin(angle) * AL;
    ctx.save();
    ctx.strokeStyle = '#58a6ff'; ctx.fillStyle = '#58a6ff';
    ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x_px, y_px); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx - HL * Math.cos(angle - HA), ty - HL * Math.sin(angle - HA));
    ctx.lineTo(tx - HL * Math.cos(angle + HA), ty - HL * Math.sin(angle + HA));
    ctx.closePath(); ctx.fill();
    ctx.restore();

    // Tooltip box
    const BW = 220, BH = 116, PAD = 11, LH = 19;
    let bx = x_px + 18, by = y_px + 10;
    if (bx + BW > canvas.width  - 4) bx = x_px - BW - 18;
    if (by + BH > canvas.height - 4) by = y_px - BH - 10;

    ctx.save();
    ctx.fillStyle = 'rgba(13,17,23,0.9)';
    ctx.strokeStyle = '#30363d'; ctx.lineWidth = 1;
    this._rrect(bx, by, BW, BH, 8);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#e6edf3';
    ctx.font = "13px 'Courier New', monospace";
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    const xCm = pos_cm.x.toFixed(1), yCm = pos_cm.y.toFixed(1);
    ctx.fillText(`(x,y) = (${xCm}, ${yCm}) cm`,    bx + PAD, by + PAD);
    ctx.fillText(`|E|  = ${this._sci(magnitude)} N/C`, bx + PAD, by + PAD + LH);
    ctx.fillText(`θ    = ${angle_deg.toFixed(1)}°`,    bx + PAD, by + PAD + LH * 2);
    ctx.fillText(`Eₓ   = ${this._sci(ex)} N/C`,        bx + PAD, by + PAD + LH * 3);
    ctx.fillText(`Eᵧ   = ${this._sci(ey)} N/C`,        bx + PAD, by + PAD + LH * 4);
    ctx.restore();
  }

  _rrect(x, y, w, h, r) {
    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y,     x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x,     y + h, r);
    ctx.arcTo(x,     y + h, x,     y,     r);
    ctx.arcTo(x,     y,     x + w, y,     r);
    ctx.closePath();
  }

  _sci(v) {
    const S = {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻'};
    if (!isFinite(v) || v === 0) return '0';
    const sign = v < 0 ? '−' : '';
    const abs  = Math.abs(v);
    const exp  = Math.floor(Math.log10(abs));
    const m    = (abs / Math.pow(10, exp)).toFixed(2);
    const eStr = String(exp).split('').map(c => S[c] ?? c).join('');
    return `${sign}${m}×10${eStr}`;
  }

  drawScrubCrosshair(x_px, y_px) {
    const { ctx, canvas } = this;
    ctx.save();
    ctx.strokeStyle = '#ffffff88';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, y_px); ctx.lineTo(canvas.width, y_px);
    ctx.moveTo(x_px, 0); ctx.lineTo(x_px, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffffffcc';
    ctx.beginPath();
    ctx.arc(x_px, y_px, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
