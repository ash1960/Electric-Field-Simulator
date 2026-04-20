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
    const t = e.target;
    if (t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') return;
    if (t.tagName === 'INPUT' && t.type !== 'range') return;

    // e.code = physical key position, layout-independent (works with Hebrew keyboard)
    switch (e.code) {
      case 'Delete':
      case 'Backspace':   e.preventDefault(); this.#cb.onDelete?.();          return;
      case 'KeyC':                            this.#cb.onClear?.();           return;
      case 'Digit1':                          this.#cb.onPreset?.('dipole');  return;
      case 'Digit2':                          this.#cb.onPreset?.('quadrupole'); return;
      case 'Digit3':                          this.#cb.onPreset?.('line');    return;
      case 'KeyF':                            this.#cb.onFullscreen?.();      return;
      case 'Equal':
      case 'NumpadAdd':                       this.#cb.onAdjustQ?.(+1);      return;
      case 'Minus':
      case 'NumpadSubtract':                  this.#cb.onAdjustQ?.(-1);      return;
      case 'KeyS':                            this.#cb.onFlipSign?.();        return;
      case 'KeyR':                            this.#cb.onResetParticles?.();  return;
      case 'KeyV':                            this.#cb.onToggleVectors?.();   return;
      case 'Space':       e.preventDefault(); this.#cb.onTogglePause?.();     return;
      case 'Slash':       if (e.shiftKey) this.#cb.onToggleHelp?.();          return;
    }
  }
}
