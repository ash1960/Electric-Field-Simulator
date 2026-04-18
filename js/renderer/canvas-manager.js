import { renderGrid } from './arrow-renderer.js';
import { drawCharge, drawChargeLabel } from './charge-renderer.js';
import { drawColorBar } from './color-bar.js';
import { FieldEngine } from '../physics/engine.js';

const _engine = new FieldEngine();

export class CanvasManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  render(charges, gridResult, probeResult, particles, selectedId, selectedType,
         gridSpacing, showVectors, scrubTimestamp) {
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

    // 4. Particle trails — Phase 4

    // 5. Charges + labels
    for (const c of charges) {
      drawCharge(ctx, c);
      drawChargeLabel(ctx, c);
    }

    // 6. Particles + F/v vectors — Phase 4

    // 7. Scale bar
    this._drawScaleBar();

    // 8. Probe overlay — Phase 3
    if (probeResult) {
      this._drawProbe(probeResult);
    }

    // 9. Scrub crosshair — Phase 5
    if (scrubTimestamp != null) {
      // Position lookup deferred to Phase 5
    }

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
    ctx.fillText('10 cm', x + barPx / 2, y);
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

  _drawProbe(probeResult) {
    // Phase 3 will implement the full tooltip.
    // Stub: no-op.
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
