import { GRID_COUNT, SPECIAL_FOOD_COLORS } from './config.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gridUnit = 20;
    this.animTime = 0;
    this.flashOverlay = 0;
    this.flashColor = '#fff';
    this.screenShake = 0;
    this.pulseTime = 0;
  }

  resize() {
    const container = this.canvas.parentElement;
    const size = container.clientWidth;
    this.canvas.width = size;
    this.canvas.height = size;
    this.gridUnit = size / GRID_COUNT;
  }

  flash(color = '#fff', duration = 0.15) {
    this.flashOverlay = duration;
    this.flashColor = color;
  }

  shake(intensity = 4, duration = 0.2) {
    this.screenShake = duration;
    this.shakeIntensity = intensity;
  }

  render(snake, food, particles, obstacles, dt, interpolate) {
    this.animTime += dt;
    this.pulseTime += dt;
    const ctx = this.ctx;
    const unit = this.gridUnit;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();

    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.shakeIntensity * 2;
      const sy = (Math.random() - 0.5) * this.shakeIntensity * 2;
      ctx.translate(sx, sy);
      this.screenShake -= dt;
    }

    ctx.clearRect(0, 0, w, h);

    this._drawBackground(ctx, w, h, unit);

    this._drawGrid(ctx, unit);

    this._drawObstacles(ctx, obstacles, unit);

    this._drawFood(ctx, food, unit);

    this._drawSnake(ctx, snake, unit, interpolate);

    particles.render(ctx, unit);

    if (this.flashOverlay > 0) {
      ctx.fillStyle = this.flashColor;
      ctx.globalAlpha = this.flashOverlay * 3;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
      this.flashOverlay = Math.max(0, this.flashOverlay - dt);
    }

    ctx.restore();
  }

  _drawBackground(ctx, w, h, unit) {
    const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
    bg.addColorStop(0, '#0f1a2e');
    bg.addColorStop(1, '#070b14');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  }

  _drawGrid(ctx, unit) {
    ctx.strokeStyle = 'rgba(32, 39, 63, 0.5)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_COUNT; i++) {
      ctx.beginPath();
      ctx.moveTo(i * unit, 0);
      ctx.lineTo(i * unit, this.canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * unit);
      ctx.lineTo(this.canvas.width, i * unit);
      ctx.stroke();
    }
  }

  _drawObstacles(ctx, obstacles, unit) {
    for (const o of obstacles) {
      const grad = ctx.createLinearGradient(o.x * unit, o.y * unit, (o.x + 1) * unit, (o.y + 1) * unit);
      grad.addColorStop(0, '#5a4c3c');
      grad.addColorStop(1, '#3d3226');
      ctx.fillStyle = grad;
      ctx.fillRect(o.x * unit + 1, o.y * unit + 1, unit - 2, unit - 2);
    }
  }

  _drawFood(ctx, food, unit) {
    const { normal, specialActive, special, getSpecialFlash } = food;
    const pulse = Math.sin(this.pulseTime * 5) * 0.15 + 0.85;

    if (specialActive && special) {
      const flash = getSpecialFlash();
      const color = SPECIAL_FOOD_COLORS[special.type] || '#FFD700';
      const cx = special.x * unit + unit / 2;
      const cy = special.y * unit + unit / 2;
      const r = (unit / 2 - 2) * pulse;

      ctx.save();
      if (flash) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(cx - r * 0.25, cy - r * 0.25, r * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    {
      const cx = normal.x * unit + unit / 2;
      const cy = normal.y * unit + unit / 2;
      const r = (unit / 2 - 2) * pulse;

      const grad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, 0, cx, cy, r);
      grad.addColorStop(0, '#ff6b6b');
      grad.addColorStop(1, '#e03131');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(cx - r * 0.2, cy - r * 0.2, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawSnake(ctx, snake, unit, interpolate) {
    const segments = snake.segments;

    for (let i = segments.length - 1; i >= 0; i--) {
      const pos = snake.getInterpolated(i, interpolate);
      if (!pos) continue;

      const px = pos.x * unit;
      const py = pos.y * unit;
      const s = unit - 1;

      if (i === 0) {
        const grad = ctx.createLinearGradient(px, py, px + s, py + s);
        grad.addColorStop(0, '#71f59e');
        grad.addColorStop(1, '#28a745');
        ctx.fillStyle = grad;

        const r = 4;
        ctx.beginPath();
        ctx.moveTo(px + r, py);
        ctx.lineTo(px + s - r, py);
        ctx.quadraticCurveTo(px + s, py, px + s, py + r);
        ctx.lineTo(px + s, py + s - r);
        ctx.quadraticCurveTo(px + s, py + s, px + s - r, py + s);
        ctx.lineTo(px + r, py + s);
        ctx.quadraticCurveTo(px, py + s, px, py + s - r);
        ctx.lineTo(px, py + r);
        ctx.quadraticCurveTo(px, py, px + r, py);
        ctx.closePath();
        ctx.fill();

        this._drawEyes(ctx, pos, snake.direction, unit);
      } else {
        const t = i / segments.length;
        const g = ctx.createLinearGradient(px, py, px + s, py + s);
        g.addColorStop(0, `rgba(50, 168, 82, ${1 - t * 0.3})`);
        g.addColorStop(1, `rgba(36, 143, 63, ${1 - t * 0.3})`);
        ctx.fillStyle = g;

        const inset = i === segments.length - 1 ? 2 : 1;
        ctx.fillRect(px + inset, py + inset, s - inset * 2, s - inset * 2);
      }
    }
  }

  _drawEyes(ctx, pos, direction, unit) {
    const px = pos.x * unit;
    const py = pos.y * unit;
    const s = unit;

    ctx.fillStyle = '#fff';
    const eyeSize = unit / 5;
    const pupilSize = unit / 10;

    let e1x, e1y, e2x, e2y, pdx, pdy;

    switch (direction) {
      case 'right':
        e1x = px + s - eyeSize * 2.5; e1y = py + eyeSize * 0.8;
        e2x = px + s - eyeSize * 2.5; e2y = py + s - eyeSize * 2.2;
        pdx = 1; pdy = 0;
        break;
      case 'left':
        e1x = px + eyeSize * 1.5; e1y = py + eyeSize * 0.8;
        e2x = px + eyeSize * 1.5; e2y = py + s - eyeSize * 2.2;
        pdx = -1; pdy = 0;
        break;
      case 'up':
        e1x = px + eyeSize * 0.8; e1y = py + eyeSize * 1.5;
        e2x = px + s - eyeSize * 2.2; e2y = py + eyeSize * 1.5;
        pdx = 0; pdy = -1;
        break;
      case 'down':
        e1x = px + eyeSize * 0.8; e1y = py + s - eyeSize * 2.5;
        e2x = px + s - eyeSize * 2.2; e2y = py + s - eyeSize * 2.5;
        pdx = 0; pdy = 1;
        break;
    }

    ctx.beginPath();
    ctx.arc(e1x, e1y, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(e2x, e2y, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(e1x + pdx * pupilSize * 0.3, e1y + pdy * pupilSize * 0.3, pupilSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(e2x + pdx * pupilSize * 0.3, e2y + pdy * pupilSize * 0.3, pupilSize, 0, Math.PI * 2);
    ctx.fill();
  }
}
