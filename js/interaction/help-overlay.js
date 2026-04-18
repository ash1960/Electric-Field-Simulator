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
<p>Click <strong>+ Positive</strong> or <strong>− Negative</strong> in the control panel to add a charge. Drag any charge to reposition it — the field arrows update in real time. Use the magnitude slider to adjust charge strength (1–10 μC).</p>

<h3 class="help-section">Field Probe</h3>
<p>Hover anywhere over the canvas to inspect the electric field. The tooltip shows exact position (cm), field magnitude |E| (V/m), direction angle θ (°), and Cartesian components E<sub>x</sub>, E<sub>y</sub>. A blue arrow at the cursor indicates field direction.</p>

<h3 class="help-section">Test Particles</h3>
<p>Add a test particle via the panel (up to 3). Drag it onto the canvas and release — the particle accelerates under <em>F = qE</em>. Use <strong>Reset Particles</strong> to return all particles to their last release positions with zero velocity.</p>

<h3 class="help-section">Energy Analysis</h3>
<p>Click <strong>📊 Energy Analysis</strong> to open the energy panel. It shows a live chart of kinetic energy K, potential energy U, and total energy E = K + U as a function of simulation time. Drag the scrub handle to replay any point of the trajectory.</p>

<h3 class="help-section">Keyboard Shortcuts</h3>
<dl class="shortcut-table">
  <dt>Del / Backspace</dt><dd>Delete selected charge or particle</dd>
  <dt>C</dt><dd>Clear all charges and particles</dd>
  <dt>1 / 2 / 3</dt><dd>Load preset: Dipole / Quadrupole / Uniform Line</dd>
  <dt>F</dt><dd>Toggle fullscreen</dd>
  <dt>+ / −</dt><dd>Adjust selected charge ±0.5 μC or particle ±0.1 nC</dd>
  <dt>S</dt><dd>Flip sign of selected charge or particle</dd>
  <dt>R</dt><dd>Reset all particles to last release position</dd>
  <dt>V</dt><dd>Toggle F⃗ / v⃗ force and velocity vectors</dd>
  <dt>Space</dt><dd>Pause / resume simulation</dd>
  <dt>?</dt><dd>Toggle this help overlay</dd>
  <dt>Escape</dt><dd>Close this overlay</dd>
</dl>

<h3 class="help-section">Units &amp; Scale</h3>
<p>Canvas: 120 × 80 cm (1 px = 1 mm = 10<sup>−3</sup> m). Charges in μC. Field in V/m. Force in N. Particle mass in μg (10<sup>−9</sup> kg). Simulation speed is adjustable: 10<sup>−6</sup> to 10<sup>−2</sup> simulated seconds per frame.</p>

<button id="help-close-btn" style="margin-top:20px;width:100%">Close</button>`;
    this.#el.appendChild(content);
    content.querySelector('#help-close-btn').addEventListener('click', () => this.toggle());
  }
}
