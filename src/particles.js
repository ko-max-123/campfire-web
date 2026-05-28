import { clamp01, randomRange, noise1, noise2 } from "./utils.js";

class BaseParticle {
  constructor(x, y) {
    this.x = x; this.y = y; this.vx = 0; this.vy = 0;
    this.life = 0; this.maxLife = 1; this.dead = false;
    this.seed = Math.random() * 1000; this.alpha = 1;
  }
  get t() { return clamp01(this.life / this.maxLife); }
  update(dt) {
    this.life += dt;
    if (this.life >= this.maxLife) { this.dead = true; return; }
    this.x += this.vx * dt; this.y += this.vy * dt;
  }
}

export class FlameRibbon extends BaseParticle {
  constructor(x, y, intensity, wind) {
    super(x, y);
    this.baseX = x + randomRange(-18, 10);
    this.baseY = y + randomRange(-8, 5);
    this.height = randomRange(90, 170) * (0.8 + intensity * 0.5);
    this.width = randomRange(22, 42) * (0.8 + intensity * 0.35);
    this.maxLife = randomRange(0.28, 0.72);
    this.drift = randomRange(-8, 18) + wind * randomRange(18, 58);
    this.curve = randomRange(10, 42) + wind * randomRange(25, 90);
    this.alpha = randomRange(0.75, 1);
  }
  update(dt, time, wind) {
    super.update(dt); if (this.dead) return;
    this.drift += wind * 12 * dt;
    this.alpha = (1 - this.t) * 0.95;
    this.baseX += wind * 24 * dt;
    this.baseX += noise1(this.seed + time * 3.4) * 7 * dt;
  }
  draw(ctx, time) {
    const t = this.t, lifeEase = 1 - t, h = this.height * lifeEase, w = this.width * (0.85 + lifeEase * 0.25);
    const leftCurl = noise2(this.seed, time * 2.6 + t * 8) * 18;
    const rightCurl = noise2(this.seed + 20, time * 2.2 + t * 8) * 14;
    const x0 = this.baseX, y0 = this.baseY;
    const x1 = x0 + this.curve * 0.24 + leftCurl, y1 = y0 - h * 0.28;
    const x2 = x0 + this.curve * 0.55 + rightCurl, y2 = y0 - h * 0.58;
    const x3 = x0 + this.curve + noise1(this.seed + time * 3.1) * 12, y3 = y0 - h;
    const widthBottom = w, widthMid = w * 0.48, widthTop = Math.max(2, w * 0.12);

    const grad = ctx.createLinearGradient(x0, y0, x3, y3);
    grad.addColorStop(0, `rgba(255,248,225,${this.alpha})`);
    grad.addColorStop(0.18, `rgba(255,220,120,${this.alpha})`);
    grad.addColorStop(0.5, `rgba(255,146,42,${this.alpha * 0.88})`);
    grad.addColorStop(0.85, `rgba(255,90,22,${this.alpha * 0.54})`);
    grad.addColorStop(1, `rgba(120,20,0,${this.alpha * 0.10})`);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x0 - widthBottom, y0 + 2);
    ctx.bezierCurveTo(x1 - widthMid, y1, x2 - widthTop, y2, x3, y3);
    ctx.bezierCurveTo(x2 + widthTop, y2 + 6, x1 + widthMid, y1 + 10, x0 + widthBottom, y0 + 2);
    ctx.closePath();
    ctx.fill();

    const core = ctx.createLinearGradient(x0, y0, x3, y3);
    core.addColorStop(0, `rgba(255,255,236,${this.alpha * 0.65})`);
    core.addColorStop(0.5, `rgba(255,230,120,${this.alpha * 0.42})`);
    core.addColorStop(1, `rgba(255,160,60,0)`);
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.moveTo(x0 - widthBottom * 0.22, y0);
    ctx.bezierCurveTo(x1 - widthMid * 0.16, y1, x2 - widthTop * 0.12, y2, x3, y3);
    ctx.bezierCurveTo(x2 + widthTop * 0.12, y2 + 4, x1 + widthMid * 0.16, y1 + 6, x0 + widthBottom * 0.22, y0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

export class EmberSpark extends BaseParticle {
  constructor(x, y, intensity, wind) {
    super(x, y);
    this.x += randomRange(-26, 18); this.y += randomRange(-6, 3);
    this.vx = randomRange(-25, 20) + wind * randomRange(26, 70);
    this.vy = randomRange(-200, -110) * (0.82 + intensity * 0.38);
    this.maxLife = randomRange(0.45, 1.45); this.size = randomRange(1.2, 3.4); this.glow = randomRange(3, 8);
  }
  update(dt, time, wind) {
    super.update(dt); if (this.dead) return;
    this.vx += wind * 16 * dt; this.x += noise1(this.seed + time * 8.4) * 6 * dt; this.alpha = 1 - this.t;
  }
  draw(ctx) {
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    ctx.shadowColor = `rgba(255, 150, 55, ${this.alpha})`; ctx.shadowBlur = this.glow;
    ctx.fillStyle = `rgba(255, 220, 140, ${this.alpha})`;
    ctx.beginPath(); ctx.arc(this.x, this.y, Math.max(0.6, this.size * (1 - this.t * 0.4)), 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

export class SmokePuff extends BaseParticle {
  constructor(x, y, smokeLevel, wind) {
    super(x, y);
    this.x += randomRange(-8, 8); this.y += randomRange(-8, 4);
    this.vx = randomRange(-8, 8) + wind * randomRange(18, 40);
    this.vy = randomRange(-44, -18); this.maxLife = randomRange(2.0, 4.3) * (0.85 + smokeLevel * 0.35);
    this.size = randomRange(14, 32); this.smokeLevel = smokeLevel;
  }
  update(dt, time, wind) {
    super.update(dt); if (this.dead) return;
    this.x += noise1(this.seed + time * 1.8) * 8 * dt + wind * 16 * dt;
    this.size *= 1 + 0.42 * dt; this.alpha = (1 - this.t) * (0.08 + this.smokeLevel * 0.16);
  }
  draw(ctx) {
    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
    g.addColorStop(0, `rgba(170,170,170,${this.alpha})`);
    g.addColorStop(0.45, `rgba(132,132,132,${this.alpha * 0.58})`);
    g.addColorStop(1, "rgba(85,85,85,0)");
    ctx.save(); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
}

export class CoalGlow {
  constructor(x, y, radius, hueOffset = 0) {
    this.x = x; this.y = y; this.radius = radius; this.hueOffset = hueOffset;
    this.seed = Math.random() * 1000; this.phase = Math.random() * 10;
  }
  draw(ctx, time, intensity) {
    const flicker = 0.65 + noise2(this.seed, time * 3.4 + this.phase) * 0.18 + Math.sin(time * 7 + this.phase) * 0.08;
    const alpha = (0.18 + intensity * 0.34) * flicker;
    const inner = `rgba(255, ${100 + this.hueOffset}, 24, ${alpha})`;
    const mid = `rgba(255, ${52 + this.hueOffset * 0.4}, 18, ${alpha * 0.7})`;
    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    g.addColorStop(0, inner); g.addColorStop(0.45, mid); g.addColorStop(1, `rgba(120,10,0,0)`);
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
}
