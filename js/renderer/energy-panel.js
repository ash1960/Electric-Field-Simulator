// Energy analysis panel — two uPlot charts: Kinetic Energy and Field Magnitude.
// Consumes particle.trail entries `{ realT, x_px, y_px, K, E_field }`.

const COLOR_K    = '#f0883e';
const COLOR_EF   = '#6ea8fe';
const AXIS       = '#8b949e';
const GRID       = 'rgba(139,148,158,0.15)';

const SUPER = {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻'};
function fmtSci(v) {
  if (v == null || !isFinite(v)) return '—';
  if (v === 0) return '0';
  const sign = v < 0 ? '−' : '';
  const abs  = Math.abs(v);
  const exp  = Math.floor(Math.log10(abs));
  const m    = (abs / Math.pow(10, exp)).toFixed(2);
  const eStr = String(exp).split('').map(c => SUPER[c] ?? c).join('');
  return `${sign}${m}×10${eStr}`;
}

function makeOpts(width, yLabel, color, seriesLabel, onMove) {
  return {
    width, height: 180,
    scales: { x: { time: false }, y: {} },
    axes: [
      {
        stroke: AXIS, grid: { stroke: GRID }, ticks: { stroke: AXIS },
        font: '12px system-ui', labelFont: '12px system-ui',
        label: 'Real time (s)', labelSize: 24,
      },
      {
        scale: 'y', stroke: AXIS, grid: { stroke: GRID }, ticks: { stroke: AXIS },
        font: '11px system-ui', labelFont: 'bold 13px system-ui',
        label: yLabel, labelSize: 24, size: 120,
        values: (_, vals) => vals.map(fmtSci),
      },
    ],
    series: [
      {},
      { label: seriesLabel, stroke: color, width: 2, value: (_, v) => fmtSci(v) },
    ],
    legend: { live: true },
    cursor: { move: onMove },
  };
}

export class EnergyPanel {
  constructor(drawerEl, onScrub) {
    this.drawerEl  = drawerEl;
    this.onScrub   = onScrub;
    this._uK       = null;
    this._uEF      = null;
    this._data     = [[], []];
    this._paused   = false;
    this._ready    = false;
    this._visible  = false;
  }

  setVisible(visible) {
    this._visible = visible;
    this.drawerEl.classList.toggle('open', visible);
    if (visible && !this._ready) this._init();
  }

  setPaused(paused) {
    this._paused = paused;
    if (!paused) this.onScrub(null);
  }

  _init() {
    if (this._ready) return;
    if (typeof uPlot === 'undefined') {
      console.error('[energy-panel] uPlot global missing — check lib/uPlot.min.js');
      return;
    }

    this.drawerEl.innerHTML = '';

    const totalW = Math.max(400, this.drawerEl.clientWidth - 56); // 56 = 2×padding + gap
    const width  = Math.floor(totalW / 2);

    const onMove = (u, left, top) => {
      if (this._data[0].length) {
        const idx = u.posToIdx(left);
        const ts  = this._data[0][idx];
        this.onScrub(ts != null ? ts : null);
      }
      return [left, top];
    };

    const wrapK  = document.createElement('div');
    const wrapEF = document.createElement('div');
    this.drawerEl.appendChild(wrapK);
    this.drawerEl.appendChild(wrapEF);

    this._uK  = new uPlot(makeOpts(width, 'Kinetic Energy (J)', COLOR_K,  'K — Kinetic',  onMove), [[], []], wrapK);
    this._uEF = new uPlot(makeOpts(width, 'Field Magnitude (N/C)', COLOR_EF, '|E| — Field', onMove), [[], []], wrapEF);

    this.drawerEl.addEventListener('mouseleave', () => {
      this.onScrub(null);
    });
    this._ready = true;
  }

  update(particles) {
    if (!this._visible || !this._ready) return;
    const p = this._activeParticle(particles);
    if (!p || !p.trail.length) {
      this._data = [[], []];
      this._uK.setData([[], []]);
      this._uEF.setData([[], []]);
      return;
    }
    const n  = p.trail.length;
    const ts = new Array(n);
    const K  = new Array(n);
    const EF = new Array(n);
    for (let i = 0; i < n; i++) {
      const e = p.trail[i];
      ts[i] = e.realT; K[i] = e.K; EF[i] = e.E_field;
    }
    this._data = [ts, K];
    this._uK.setData([ts, K]);
    this._uEF.setData([ts, EF]);
  }

  getScrubPosition(realTimestamp, particles) {
    const p = this._activeParticle(particles);
    if (!p || !p.trail.length) return null;
    const t = p.trail;
    let lo = 0, hi = t.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (t[mid].realT < realTimestamp) lo = mid + 1; else hi = mid;
    }
    const e = t[lo];
    return e ? { x_px: e.x_px, y_px: e.y_px } : null;
  }

  _activeParticle(particles) {
    if (!particles || !particles.length) return null;
    return particles.find(p => p.state === 'moving')
        || particles.find(p => p.trail && p.trail.length)
        || particles[0];
  }

  destroy() {
    this._uK?.destroy();
    this._uEF?.destroy();
    this._uK = null;
    this._uEF = null;
    this._ready = false;
  }
}
