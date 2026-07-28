export class InputManager {
  constructor(game) {
    this.game = game;
    this.joystickActive = false;
    this.joystickCenter = { x: 0, y: 0 };
    this.joystickRadius = 20;
    this.touchStart = { x: 0, y: 0 };
    this.swipeThreshold = 0;
    this.callbacks = {
      up: null, down: null, left: null, right: null,
      start: null, pause: null, restart: null,
    };

    this._bound = {
      onKeyDown: this._onKeyDown.bind(this),
      onTouchStart: this._onTouchStart.bind(this),
      onTouchEnd: this._onTouchEnd.bind(this),
      onJoystickStart: this._onJoystickStart.bind(this),
      onJoystickMove: this._onJoystickMove.bind(this),
      onJoystickEnd: this._onJoystickEnd.bind(this),
    };
  }

  on(dir, cb) {
    if (this.callbacks[dir] !== undefined) this.callbacks[dir] = cb;
  }

  vibrate(pattern) {
    if (navigator.vibrate && this._settings?.vibrate !== false) {
      try { navigator.vibrate(pattern); } catch (e) {}
    }
  }

  setSettings(settings) {
    this._settings = settings;
  }

  attach(joystickEl, canvasEl) {
    joystickEl.addEventListener('touchstart', this._bound.onJoystickStart, { passive: false });
    joystickEl.addEventListener('mousedown', this._bound.onJoystickStart);
    window.addEventListener('touchmove', this._bound.onJoystickMove, { passive: false });
    window.addEventListener('touchend', this._bound.onJoystickEnd);
    window.addEventListener('touchcancel', this._bound.onJoystickEnd);
    window.addEventListener('mousemove', (e) => { if (this.joystickActive) this._bound.onJoystickMove(e); });
    window.addEventListener('mouseup', this._bound.onJoystickEnd);

    canvasEl.addEventListener('touchstart', this._bound.onTouchStart, { passive: false });
    canvasEl.addEventListener('touchend', this._bound.onTouchEnd, { passive: false });

    window.addEventListener('keydown', this._bound.onKeyDown);
  }

  detach(joystickEl, canvasEl) {
    joystickEl.removeEventListener('touchstart', this._bound.onJoystickStart);
    joystickEl.removeEventListener('mousedown', this._bound.onJoystickStart);
    window.removeEventListener('touchmove', this._bound.onJoystickMove);
    window.removeEventListener('touchend', this._bound.onJoystickEnd);
    window.removeEventListener('touchcancel', this._bound.onJoystickEnd);
    window.removeEventListener('mousemove', this._bound.onJoystickMove);
    window.removeEventListener('mouseup', this._bound.onJoystickEnd);
    canvasEl.removeEventListener('touchstart', this._bound.onTouchStart);
    canvasEl.removeEventListener('touchend', this._bound.onTouchEnd);
    window.removeEventListener('keydown', this._bound.onKeyDown);
  }

  _getDirFromVector(dx, dy) {
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (absX < 8 && absY < 8) return null;
    if (absX > absY) {
      return dx > 0 ? 'right' : 'left';
    }
    return dy > 0 ? 'down' : 'up';
  }

  _updateJoystickCenter(el) {
    const rect = el.getBoundingClientRect();
    this.joystickCenter.x = rect.left + rect.width / 2;
    this.joystickCenter.y = rect.top + rect.height / 2;
    const outerR = rect.width / 2;
    const thumbR = 30;
    this.joystickRadius = Math.max(5, outerR - thumbR);
    this.swipeThreshold = rect.width * 0.08;
  }

  _onJoystickStart(e) {
    e.preventDefault();
    e.stopPropagation();
    this.joystickActive = true;
    const el = e.currentTarget;
    this._updateJoystickCenter(el);
    const point = e.touches ? e.touches[0] : e;
    this._processJoystickMove(point.clientX, point.clientY);
  }

  _processJoystickMove(clientX, clientY) {
    let dx = clientX - this.joystickCenter.x;
    let dy = clientY - this.joystickCenter.y;
    const dist = Math.hypot(dx, dy);
    if (dist > this.joystickRadius) {
      dx = (dx / dist) * this.joystickRadius;
      dy = (dy / dist) * this.joystickRadius;
    }

    const thumb = document.getElementById('joystickThumb');
    if (thumb) {
      thumb.style.transform = `translate(${dx}px, ${dy}px)`;
    }

    const dir = this._getDirFromVector(dx, dy);
    if (dir && this.callbacks[dir]) {
      this.callbacks[dir]();
    }
  }

  _onJoystickMove(e) {
    if (!this.joystickActive) return;
    e.preventDefault();
    e.stopPropagation();
    const point = e.touches ? e.touches[0] : e;
    this._processJoystickMove(point.clientX, point.clientY);
  }

  _onJoystickEnd(e) {
    if (!this.joystickActive) return;
    e.preventDefault();
    e.stopPropagation();
    this.joystickActive = false;
    const thumb = document.getElementById('joystickThumb');
    if (thumb) {
      thumb.style.transform = 'translate(0px, 0px)';
    }
  }

  _onTouchStart(e) {
    e.preventDefault();
    this.touchStart.x = e.touches[0].clientX;
    this.touchStart.y = e.touches[0].clientY;
  }

  _onTouchEnd(e) {
    e.preventDefault();
    const dx = e.changedTouches[0].clientX - this.touchStart.x;
    const dy = e.changedTouches[0].clientY - this.touchStart.y;
    if (Math.abs(dx) < this.swipeThreshold && Math.abs(dy) < this.swipeThreshold) return;

    let dir;
    if (Math.abs(dx) > Math.abs(dy)) {
      dir = dx > 0 ? 'right' : 'left';
    } else {
      dir = dy > 0 ? 'down' : 'up';
    }
    if (dir && this.callbacks[dir]) {
      this.callbacks[dir]();
      this.vibrate(15);
    }
  }

  _onKeyDown(e) {
    const key = e.key;

    if (key === 'ArrowUp' && this.callbacks.up) { e.preventDefault(); this.callbacks.up(); }
    else if (key === 'ArrowDown' && this.callbacks.down) { e.preventDefault(); this.callbacks.down(); }
    else if (key === 'ArrowLeft' && this.callbacks.left) { e.preventDefault(); this.callbacks.left(); }
    else if (key === 'ArrowRight' && this.callbacks.right) { e.preventDefault(); this.callbacks.right(); }
    else if (key === ' ' || key === 'Space') {
      e.preventDefault();
      if (this.callbacks.start) this.callbacks.start();
    } else if (key === 'p' || key === 'P') {
      if (this.callbacks.pause) this.callbacks.pause();
    }
  }
}
