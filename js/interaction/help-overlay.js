export class HelpOverlay {
  #el;

  constructor() {
    this.#el = document.getElementById('help-overlay');
    this._build();
    this.#el.addEventListener('pointerdown', (e) => {
      if (e.target === this.#el) this.toggle();
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) this.toggle();
    });
  }

  toggle() { this.#el.classList.toggle('visible'); }
  get isVisible() { return this.#el.classList.contains('visible'); }

  _build() {
    const content = document.createElement('div');
    content.className = 'help-content';
    content.innerHTML = `
<h2 style="margin:0 0 16px;color:#58a6ff;font-size:18px">Electric Field Simulator</h2>

<h3 class="help-section">Getting Started</h3>
<p>Click <strong>+ Positive</strong> or <strong>− Negative</strong> in the control panel to place a charge. Drag any charge to reposition it — the field arrows update in real time. Click a charge to open its properties panel, where you can adjust magnitude (1–10 μC) or flip its sign.</p>

<h3 class="help-section">Field Probe</h3>
<p>Move the cursor over the canvas to inspect the electric field at any point. The tooltip shows position (cm), field magnitude |E| (N/C), direction angle θ (°), and components E<sub>x</sub>, E<sub>y</sub>. A blue arrow at the cursor scales with field strength.</p>

<h3 class="help-section">Test Particles</h3>
<p>Click <strong>Add Test Particle</strong> (up to 3). Drag the particle to any position and release — it accelerates from rest under <em>F = qE</em>. Adjust charge q (nC) and mass m (μg) in the panel. Press <strong>V</strong> to show Force and Velocity vectors. Press <strong>R</strong> to reset all particles to their last release positions.</p>

<h3 class="help-section">Energy Analysis</h3>
<p>Click <strong>📊 Energy Analysis</strong> to open the energy panel. Two live charts are shown: <strong>Kinetic Energy K(t)</strong> and <strong>Field Magnitude |E|(t)</strong> along the particle's path. Press <strong>Space</strong> to pause, then hover over either chart to scrub the timeline — a crosshair appears on the canvas at the particle's exact position at that moment.</p>

<h3 class="help-section">Presets</h3>
<p><strong>Dipole</strong> — equal and opposite charges. <strong>Quadrupole</strong> — four alternating charges. <strong>Line</strong> — ten equally spaced positive charges across the canvas. Presets replace all existing charges and particles.</p>

<h3 class="help-section">Keyboard Shortcuts</h3>
<dl class="shortcut-table">
  <dt>Del / Backspace</dt><dd>Delete selected charge or particle</dd>
  <dt>C</dt><dd>Clear all charges and particles</dd>
  <dt>1 / 2 / 3</dt><dd>Load preset: Dipole / Quadrupole / Line</dd>
  <dt>Space</dt><dd>Pause / resume simulation</dd>
  <dt>+ / −</dt><dd>Adjust selected charge ±0.5 μC</dd>
  <dt>S</dt><dd>Flip sign of selected charge or particle</dd>
  <dt>R</dt><dd>Reset all particles to last release position</dd>
  <dt>V</dt><dd>Toggle F⃗ / v⃗ vectors</dd>
  <dt>F</dt><dd>Toggle fullscreen</dd>
  <dt>?</dt><dd>Toggle this help overlay</dd>
  <dt>Escape</dt><dd>Close this overlay</dd>
</dl>

<h3 class="help-section">Units &amp; Scale</h3>
<p>Canvas: 120 × 80 cm (1 px = 1 mm = 10<sup>−3</sup> m). All physics in strict SI: field in N/C, force in N, charge in C, mass in kg, energy in J. UI convenience scales: fixed charges in μC, particle charge in nC, mass in μg. Constants: k = 9×10<sup>9</sup> N·m²/C², ε<sub>0</sub> = 8.85×10<sup>−12</sup> F/m.</p>

<p style="margin-top:24px;font-size:11px;color:#484f58;text-align:center;">Made by A.D.SH</p>
<button id="help-close-btn" style="margin-top:12px;width:100%">Close</button>`;
    this.#el.appendChild(content);
    content.querySelector('#help-close-btn').addEventListener('click', () => this.toggle());
  }
}
