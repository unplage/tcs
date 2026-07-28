export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.pool = [];
  }

  _alloc() {
    if (this.pool.length > 0) return this.pool.pop();
    return {
      x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 0,
      size: 0, startSize: 0,
      color: '#fff',
      alpha: 1,
      type: 'circle',
      gravity: 0,
      friction: 1,
    };
  }

  _free(p) {
    if (this.pool.length < 200) this.pool.push(p);
  }

  emit(x, y, count, opts = {}) {
    for (let i = 0; i < count; i++) {
      const p = this._alloc();
      const angle = opts.angle !== undefined
        ? opts.angle + (Math.random() - 0.5) * (opts.spread || Math.PI * 0.5)
        : Math.random() * Math.PI * 2;
      const speed = opts.speed !== undefined
        ? opts.speed * (0.5 + Math.random() * 0.5)
        : 30 + Math.random() * 60;

      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.life = opts.life !== undefined ? opts.life : (0.4 + Math.random() * 0.4);
      p.maxLife = p.life;
      p.startSize = opts.size !== undefined ? opts.size : (2 + Math.random() * 3);
      p.size = p.startSize;
      p.color = opts.color || '#fff';
      p.alpha = 1;
      p.type = opts.type || 'circle';
      p.gravity = opts.gravity || 0;
      p.friction = opts.friction || 0.97;

      this.particles.push(p);
    }
  }

  emitBurst(x, y, opts = {}) {
    const count = opts.count || 15;
    const spread = opts.spread || Math.PI * 2;
    for (let i = 0; i < count; i++) {
      const p = this._alloc();
      const angle = Math.random() * spread;
      const speed = (opts.speed || (50 + Math.random() * 100));

      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.life = opts.life || (0.3 + Math.random() * 0.5);
      p.maxLife = p.life;
      p.startSize = opts.size || (1 + Math.random() * 3);
      p.size = p.startSize;
      p.color = opts.color || '#fff';
      p.alpha = 1;
      p.type = opts.type || 'circle';
      p.gravity = opts.gravity || 0;
      p.friction = opts.friction || 0.96;

      this.particles.push(p);
    }
  }

  emitTrail(x, y, color, count = 2) {
    this.emit(x, y, count, {
      color,
      size: 2,
      speed: 10 + Math.random() * 20,
      life: 0.2 + Math.random() * 0.15,
      gravity: -20,
      friction: 0.95,
    });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this._free(p);
        this.particles.splice(i, 1);
        continue;
      }

      const t = 1 - p.life / p.maxLife;
      p.alpha = 1 - t;
      p.size = p.startSize * (1 - t * 0.5);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.vx *= p.friction;
      p.vy *= p.friction;
    }
  }

  render(ctx, unit) {
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      const px = p.x * unit;
      const py = p.y * unit;
      const s = p.size * (unit / 20);

      if (p.type === 'circle') {
        ctx.beginPath();
        ctx.arc(px, py, s, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(px - s / 2, py - s / 2, s, s);
      }
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    while (this.particles.length > 0) {
      this._free(this.particles.pop());
    }
  }
}
