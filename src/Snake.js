export class Snake {
  constructor() {
    this.segments = [];
    this.prevSegments = [];
    this.direction = 'right';
    this.nextDirection = 'right';
    this.growing = 0;
    this.alive = true;
    this.reset();
  }

  reset() {
    this.segments = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    this.prevSegments = this.segments.map(s => ({ ...s }));
    this.direction = 'right';
    this.nextDirection = 'right';
    this.growing = 0;
    this.alive = true;
  }

  setDirection(dir) {
    const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
    if (dir !== opposites[this.direction]) {
      this.nextDirection = dir;
    }
  }

  move(gridCount) {
    this.prevSegments = this.segments.map(s => ({ ...s }));
    this.direction = this.nextDirection;

    const head = { ...this.segments[0] };
    switch (this.direction) {
      case 'up': head.y--; break;
      case 'down': head.y++; break;
      case 'left': head.x--; break;
      case 'right': head.x++; break;
    }

    const outOfBounds = head.x < 0 || head.y < 0 || head.x >= gridCount || head.y >= gridCount;
    if (outOfBounds) {
      this.alive = false;
      return head;
    }

    const selfCollision = this.segments.slice(1).some(s => s.x === head.x && s.y === head.y);
    if (selfCollision) {
      this.alive = false;
      return head;
    }

    this.segments.unshift(head);

    if (this.growing > 0) {
      this.growing--;
    } else {
      this.segments.pop();
    }

    return head;
  }

  grow(amount = 1) {
    this.growing += amount;
  }

  shrink(amount = 1) {
    for (let i = 0; i < amount && this.segments.length > 3; i++) {
      this.segments.pop();
    }
  }

  getInterpolated(index, t) {
    const cur = this.segments[index];
    const prev = this.prevSegments[index];
    if (!cur) return null;
    if (!prev) return { x: cur.x, y: cur.y };
    return {
      x: prev.x + (cur.x - prev.x) * t,
      y: prev.y + (cur.y - prev.y) * t,
    };
  }

  occupies(x, y) {
    return this.segments.some(s => s.x === x && s.y === y);
  }

  get head() {
    return this.segments[0];
  }

  get length() {
    return this.segments.length;
  }
}
