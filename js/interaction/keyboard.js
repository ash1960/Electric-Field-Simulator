export class KeyboardManager {
  #cb;
  #handler;

  constructor(callbacks) {
    this.#cb = callbacks;
    this.#handler = this._handle.bind(this);
  }

  bind()    { window.addEventListener('keydown', this.#handler); }
  destroy() { window.removeEventListener('keydown', this.#handler); }

  _handle(e) {
    if (e.target.matches('input, select, textarea')) return;

    switch (e.key) {
      case 'Delete':
      case 'Backspace': e.preventDefault(); this.#cb.onDelete?.(); break;
      case 'c': case 'C': this.#cb.onClear?.(); break;
      case '1': this.#cb.onPreset?.('dipole'); break;
      case '2': this.#cb.onPreset?.('quadrupole'); break;
      case '3': this.#cb.onPreset?.('line'); break;
      case 'f': case 'F': this.#cb.onFullscreen?.(); break;
      case '+': case '=': this.#cb.onAdjustQ?.(+1); break;
      case '-': this.#cb.onAdjustQ?.(-1); break;
      case 's': case 'S': this.#cb.onFlipSign?.(); break;
      case 'r': case 'R': this.#cb.onResetParticles?.(); break;
      case 'v': case 'V': this.#cb.onToggleVectors?.(); break;
      case ' ': e.preventDefault(); this.#cb.onTogglePause?.(); break;
      case '?': this.#cb.onToggleHelp?.(); break;
    }
  }
}
