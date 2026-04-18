// Immutable 2D vector. All ops return a new instance.

export class Vector2D {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(v) {
    return new Vector2D(this.x + v.x, this.y + v.y);
  }

  sub(v) {
    return new Vector2D(this.x - v.x, this.y - v.y);
  }

  scale(s) {
    return new Vector2D(this.x * s, this.y * s);
  }

  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  magnitude() {
    return Math.hypot(this.x, this.y);
  }

  normalize() {
    const m = this.magnitude();
    if (m === 0) return new Vector2D(0, 0);
    return new Vector2D(this.x / m, this.y / m);
  }

  // Degrees in (−180, 180] via atan2.
  angle() {
    return Math.atan2(this.y, this.x) * 180 / Math.PI;
  }

  closestPointOnSegment(A, B) {
    const AB = B.sub(A);
    const lenSq = AB.dot(AB);
    if (lenSq === 0) return A;
    const t = Math.max(0, Math.min(1, this.sub(A).dot(AB) / lenSq));
    return A.add(AB.scale(t));
  }

  distanceToSegment(A, B) {
    return this.sub(this.closestPointOnSegment(A, B)).magnitude();
  }

  static fromAngle(deg, mag) {
    const r = deg * Math.PI / 180;
    return new Vector2D(Math.cos(r) * mag, Math.sin(r) * mag);
  }
}
