import {
  Q_MIN_UC, Q_MAX_UC, Q_STEP_UC,
  Q_PARTICLE_MIN_NC, Q_PARTICLE_MAX_NC,
  MASS_MIN_UG, MASS_MAX_UG,
  TIME_SCALE_MIN, TIME_SCALE_MAX, TIME_SCALE_DEFAULT,
  GRID_SPACING_MIN, GRID_SPACING_MAX, DEFAULT_GRID_SPACING,
  MAX_CHARGES, MAX_PARTICLES,
} from '../config.js';

const SUPER = {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻'};
function fmtLog(v) {
  const exp = Math.floor(Math.log10(Math.abs(v)));
  const m = v / Math.pow(10, exp);
  const expS = String(exp).split('').map(c => SUPER[c] ?? c).join('');
  return Math.abs(m - 1) < 0.05 ? `10${expS}` : `${m.toFixed(1)}×10${expS}`;
}

export class UIControls {
  #panel; #cb;
  #chargePropsSec; #particlePropsSec; #footerStatus;
  #chargeMagSlider; #chargeMagLabel;
  #selectedChargeId = null;

  constructor(callbacks) {
    this.#panel = document.getElementById('control-panel');
    this.#cb    = callbacks;
  }

  init() {
    this.#panel.innerHTML = '';
    this._buildAddCharge();
    this._buildChargeProps();
    this._buildParticle();
    this._buildParticleProps();
    this._buildPresets();
    this._buildDisplay();
    this._buildAnalysis();
    this._buildShortcuts();
    this._buildFooter();
  }

  // ── Update methods ───────────────────────────────────────────

  updateStatus(charges, particles) {
    if (!this.#footerStatus) return;
    const totalQ = charges.reduce((s, c) => s + c.sign * c.magnitude_uc, 0);
    const sign = totalQ >= 0 ? '+' : '−';
    this.#footerStatus.textContent =
      `Charges: ${charges.length}/${MAX_CHARGES} | Particles: ${particles.length}/${MAX_PARTICLES} | ΣQ = ${sign}${Math.abs(totalQ).toFixed(1)} μC`;
    const btn = document.getElementById('add-particle-btn');
    if (btn) btn.disabled = particles.length >= MAX_PARTICLES;
  }

  showChargeProperties(charge) {
    if (!charge) {
      this.#chargePropsSec.style.display = 'none';
      this.#selectedChargeId = null;
      return;
    }
    this.#chargePropsSec.style.display = '';
    this.#selectedChargeId = charge.id;
    if (this.#chargeMagSlider) {
      this.#chargeMagSlider.value = charge.magnitude_uc;
      if (this.#chargeMagLabel) this.#chargeMagLabel.textContent = `${charge.magnitude_uc.toFixed(1)} μC`;
    }
  }

  showParticleProperties(particle) {
    if (!particle) { this.#particlePropsSec.style.display = 'none'; return; }
    this.#particlePropsSec.style.display = '';
    const el = document.getElementById('particle-readout');
    if (el) {
      const spd = Math.hypot(particle.vx_ms ?? 0, particle.vy_ms ?? 0);
      const mug = ((particle.mass_kg ?? 0) / 1e-9).toFixed(1);
      el.innerHTML = `q = ${particle.sign > 0 ? '+' : '−'}${(particle.magnitude_nc ?? 0).toFixed(1)} nC<br>` +
                     `m = ${mug} μg<br>` +
                     `|v| = ${spd.toFixed(2)} m/s`;
    }
  }

  setPauseState(_paused) { /* future: update pause button label */ }

  // ── Sections ─────────────────────────────────────────────────

  _buildAddCharge() {
    const sec = this._sec('ADD CHARGE');
    const row = el('div', 'display:flex;gap:8px;');
    const pos = btn('+ Positive', () => this.#cb.onChargeAdd?.({ magnitude_uc: 5, sign: +1 }));
    const neg = btn('− Negative', () => this.#cb.onChargeAdd?.({ magnitude_uc: 5, sign: -1 }));
    pos.style.flex = neg.style.flex = '1';
    row.append(pos, neg);
    sec.append(row);
    this.#panel.append(sec);
  }

  _buildChargeProps() {
    const sec = this._sec('CHARGE PROPERTIES');
    sec.style.display = 'none';
    this.#chargePropsSec = sec;

    const { row, slider, label } = this._slider(
      'Q', Q_MIN_UC, Q_MAX_UC, Q_STEP_UC, 5, 'μC',
      (v) => { if (this.#selectedChargeId) this.#cb.onChargeUpdate?.(this.#selectedChargeId, { magnitude_uc: v }); }
    );
    this.#chargeMagSlider = slider;
    this.#chargeMagLabel  = label;
    sec.append(row);

    const bRow = el('div', 'display:flex;gap:8px;margin-top:6px;');
    const flipB = btn('Flip Sign ±', () => { if (this.#selectedChargeId) this.#cb.onChargeUpdate?.(this.#selectedChargeId, { flipSign: true }); });
    const delB  = btn('Delete',      () => { if (this.#selectedChargeId) this.#cb.onChargeDelete?.(this.#selectedChargeId); });
    delB.style.cssText += ';border-color:#ff6b6b;color:#ff6b6b;';
    flipB.style.flex = delB.style.flex = '1';
    bRow.append(flipB, delB);
    sec.append(bRow);
    this.#panel.append(sec);
  }

  _buildParticle() {
    const sec = this._sec('TEST PARTICLE');

    const addB = btn('Add Test Particle', () => this.#cb.onParticleAdd?.());
    addB.id = 'add-particle-btn';
    addB.style.width = '100%';
    sec.append(addB);

    sec.append(this._slider('q', Q_PARTICLE_MIN_NC, Q_PARTICLE_MAX_NC, 0.1, 1, 'nC',
      (v) => this.#cb.onParticleUpdate?.(null, { magnitude_nc: v })).row);
    sec.append(this._logSlider('m', MASS_MIN_UG, MASS_MAX_UG, 10, 'μg',
      (v) => this.#cb.onParticleUpdate?.(null, { mass_ug: v })).row);
    sec.append(this._logSlider('⏩', TIME_SCALE_MIN, TIME_SCALE_MAX, TIME_SCALE_DEFAULT, 's/f',
      (v) => this.#cb.onTimeScaleChange?.(v)).row);

    const vecRow = el('div', 'display:flex;align-items:center;gap:8px;margin:8px 0;');
    const chk = document.createElement('input');
    chk.type = 'checkbox'; chk.id = 'vec-toggle'; chk.style.accentColor = '#58a6ff';
    chk.addEventListener('change', () => this.#cb.onToggleVectors?.(chk.checked));
    const lbl = document.createElement('label');
    lbl.htmlFor = 'vec-toggle'; lbl.textContent = 'Show F⃗ / v⃗ vectors'; lbl.style.fontSize = '13px';
    vecRow.append(chk, lbl);
    sec.append(vecRow);

    const rstB = btn('Reset Particles', () => this.#cb.onParticleReset?.('all'));
    rstB.style.width = '100%';
    sec.append(rstB);
    this.#panel.append(sec);
  }

  _buildParticleProps() {
    const sec = this._sec('PARTICLE PROPERTIES');
    sec.style.display = 'none';
    this.#particlePropsSec = sec;

    const readout = el('div');
    readout.id = 'particle-readout';
    readout.style.cssText = 'font-size:12px;font-family:monospace;color:#8b949e;margin-bottom:8px;line-height:1.8;';
    sec.append(readout);

    const bRow = el('div', 'display:flex;gap:8px;');
    const flipB = btn('Flip Sign ±', () => this.#cb.onParticleUpdate?.(null, { flipSign: true }));
    const delB  = btn('Delete',      () => this.#cb.onParticleRemove?.(null));
    delB.style.cssText += ';border-color:#ff6b6b;color:#ff6b6b;';
    flipB.style.flex = delB.style.flex = '1';
    bRow.append(flipB, delB);
    sec.append(bRow);
    this.#panel.append(sec);
  }

  _buildPresets() {
    const sec = this._sec('PRESETS');
    const row = el('div', 'display:flex;gap:6px;');
    for (const [label, key] of [['Dipole','dipole'],['Quadrupole','quadrupole'],['Line','line']]) {
      const b = btn(label, () => this.#cb.onPresetLoad?.(key));
      b.style.flex = '1';
      row.append(b);
    }
    sec.append(row);
    this.#panel.append(sec);
  }

  _buildDisplay() {
    const sec = this._sec('DISPLAY');
    sec.append(this._slider(
      'Density', GRID_SPACING_MIN, GRID_SPACING_MAX, 1, DEFAULT_GRID_SPACING, 'px',
      (v) => this.#cb.onGridSpacingChange?.(v)
    ).row);
    this.#panel.append(sec);
  }

  _buildAnalysis() {
    const sec = this._sec('ANALYSIS');
    let open = false;
    const b = btn('📊 Energy Analysis', () => { open = !open; this.#cb.onToggleEnergyPanel?.(open); });
    b.style.width = '100%';
    sec.append(b);
    this.#panel.append(sec);
  }

  _buildShortcuts() {
    const sec = this._sec('SHORTCUTS');
    const dl = document.createElement('dl');
    dl.className = 'shortcut-table';
    for (const [k, d] of [
      ['Del','delete'],['C','clear all'],['1/2/3','presets'],
      ['Space','pause'],['+ / −','adjust Q'],['S','flip sign'],
      ['R','reset ptcl'],['V','vectors'],['F','fullscreen'],['?','help'],
    ]) {
      const dt = document.createElement('dt'); dt.textContent = k;
      const dd = document.createElement('dd'); dd.textContent = d;
      dl.append(dt, dd);
    }
    sec.append(dl);
    this.#panel.append(sec);
  }

  _buildFooter() {
    const footer = el('div', 'margin-top:16px;padding-top:12px;border-top:1px solid #30363d;');
    const status = el('div');
    status.style.cssText = 'font-size:11px;font-family:monospace;color:#8b949e;margin-bottom:8px;text-align:center;';
    status.textContent = `Charges: 0/${MAX_CHARGES} | Particles: 0/${MAX_PARTICLES} | ΣQ = +0.0 μC`;
    this.#footerStatus = status;

    const clearB = btn('Clear All', () => this.#cb.onClearAll?.());
    clearB.style.cssText = 'width:100%;border-color:#ff6b6b;color:#ff6b6b;';
    footer.append(status, clearB);
    this.#panel.append(footer);
  }

  // ── Slider helpers ───────────────────────────────────────────

  _slider(labelText, min, max, step, value, unit, onChange) {
    const row = el('div', 'display:flex;align-items:center;gap:4px;margin:6px 0;');
    const lbl = el('span'); lbl.textContent = labelText + ':';
    lbl.style.cssText = 'font-size:12px;color:#8b949e;flex-shrink:0;min-width:56px;';

    const minus = stepBtn('−');
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.setAttribute('min', String(min));
    slider.setAttribute('max', String(max));
    slider.setAttribute('step', String(step));
    slider.setAttribute('value', String(value)); // sets default AND current
    slider.value = String(value);                // belt-and-suspenders for browser quirks
    slider.style.flex = '1'; slider.style.minWidth = '0';
    const plus  = stepBtn('+');
    const valLbl = el('span'); valLbl.className = 'slider-value';
    const decimals = step < 1 ? 1 : 0;
    valLbl.textContent = `${Number(value).toFixed(decimals)} ${unit}`;

    const update = (v) => {
      const c = Math.max(min, Math.min(max, v));
      slider.value = c;
      valLbl.textContent = `${Number(c).toFixed(decimals)} ${unit}`;
      onChange?.(c);
    };
    slider.addEventListener('input', () => update(parseFloat(slider.value)));
    minus.addEventListener('click', () => update(parseFloat(slider.value) - step));
    plus.addEventListener('click',  () => update(parseFloat(slider.value) + step));

    row.append(lbl, minus, slider, plus, valLbl);
    return { row, slider, label: valLbl };
  }

  _logSlider(labelText, min, max, defaultVal, unit, onChange) {
    const row = el('div', 'display:flex;align-items:center;gap:4px;margin:6px 0;');
    const lbl = el('span'); lbl.textContent = labelText + ':';
    lbl.style.cssText = 'font-size:12px;color:#8b949e;flex-shrink:0;min-width:56px;';

    const minus = stepBtn('−');
    const slider = document.createElement('input');
    slider.type = 'range'; slider.min = 0; slider.max = 1000; slider.step = 1;
    slider.style.flex = '1'; slider.style.minWidth = '0';
    const plus   = stepBtn('+');
    const valLbl = el('span'); valLbl.className = 'slider-value';

    const logMin = Math.log10(min), logMax = Math.log10(max);
    const toPos = (v) => Math.round(((Math.log10(v) - logMin) / (logMax - logMin)) * 1000);
    const toVal = (pos) => Math.pow(10, logMin + (pos / 1000) * (logMax - logMin));

    const update = (v) => {
      const c = Math.max(min, Math.min(max, v));
      slider.value = toPos(c);
      valLbl.textContent = fmtLog(c);
      onChange?.(c);
    };
    slider.value = toPos(defaultVal);
    valLbl.textContent = fmtLog(defaultVal);

    slider.addEventListener('input', () => update(toVal(parseInt(slider.value))));
    minus.addEventListener('click', () => update(toVal(parseInt(slider.value)) / Math.pow(10, 0.1)));
    plus.addEventListener('click',  () => update(toVal(parseInt(slider.value)) * Math.pow(10, 0.1)));

    row.append(lbl, minus, slider, plus, valLbl);
    return { row, slider, label: valLbl };
  }

  _sec(title) {
    const sec = el('div', 'margin-bottom:16px;');
    const h = el('div'); h.className = 'section-header'; h.textContent = title;
    sec.append(h);
    return sec;
  }
}

function el(tag, css) {
  const e = document.createElement(tag);
  if (css) e.style.cssText = css;
  return e;
}
function btn(text, onClick) {
  const b = document.createElement('button');
  b.textContent = text;
  b.addEventListener('click', onClick);
  return b;
}
function stepBtn(sym) {
  const b = document.createElement('button');
  b.className = 'step-btn'; b.textContent = sym;
  return b;
}
