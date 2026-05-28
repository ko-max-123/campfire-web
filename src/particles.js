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
    this.baseX = x + randomRange(-26, 18);
    this.baseY = y + randomRange(-10, 7);
    this.height = randomRange(78, 190) * (0.82 + intensity * 0.52);
    this.width = randomRange(16, 46) * (0.78 + intensity * 0.38);
    this.maxLife = randomRange(0.24, 0.66);
    this.drift = randomRange(-8, 18) + wind * randomRange(18, 58);
    this.curve = randomRange(10, 42) + wind * randomRange(25, 90);
    this.alpha = randomRange(0.75, 1);
    this.hue = randomRange(-8, 12);
    this.layer = Math.random();
  }
  update(dt, time, wind) {
    super.update(dt); if (this.dead) return;
    this.drift += wind * 12 * dt;
    this.alpha = Math.sin((1 - this.t) * Math.PI) * 0.95;
    this.baseX += wind * 24 * dt;
    this.baseX += noise1(this.seed + time * 4.2) * 12 * dt;
  }
  draw(ctx, time) {
    const t = this.t, riseEase = 1 - t * 0.35, taper = Math.pow(1 - t, 0.72);
    const h = this.height * riseEase, w = this.width * (0.42 + taper * 0.75);
    const leftCurl = noise2(this.seed, time * 3.4 + t * 8) * 22;
    const rightCurl = noise2(this.seed + 20, time * 2.8 + t * 8) * 18;
    const x0 = this.baseX, y0 = this.baseY;
    const x1 = x0 + this.curve * 0.24 + leftCurl, y1 = y0 - h * 0.28;
    const x2 = x0 + this.curve * 0.55 + rightCurl, y2 = y0 - h * 0.58;
    const x3 = x0 + this.curve + noise1(this.seed + time * 3.1) * 12, y3 = y0 - h;
    const widthBottom = w, widthMid = w * 0.48, widthTop = Math.max(2, w * 0.12);

    const grad = ctx.createLinearGradient(x0, y0, x3, y3);
    grad.addColorStop(0, `rgba(255,250,228,${this.alpha})`);
    grad.addColorStop(0.14, `rgba(255,226,126,${this.alpha})`);
    grad.addColorStop(0.46, `rgba(255,${142 + this.hue},38,${this.alpha * 0.88})`);
    grad.addColorStop(0.82, `rgba(250,${76 + this.hue},18,${this.alpha * 0.52})`);
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
    core.addColorStop(0, `rgba(255,255,238,${this.alpha * 0.72})`);
    core.addColorStop(0.4, `rgba(255,232,118,${this.alpha * 0.45})`);
    core.addColorStop(0.88, `rgba(255,150,54,${this.alpha * 0.04})`);
    core.addColorStop(1, "rgba(255,160,60,0)");
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
    this.x += randomRange(-12, 12); this.y += randomRange(-10, 4);
    this.vx = randomRange(-8, 8) + wind * randomRange(20, 48);
    this.vy = randomRange(-50, -20); this.maxLife = randomRange(2.2, 5.0) * (0.85 + smokeLevel * 0.35);
    this.size = randomRange(16, 36); this.smokeLevel = smokeLevel;
    this.rotation = randomRange(0, Math.PI);
    this.spin = randomRange(-0.28, 0.28);
  }
  update(dt, time, wind) {
    super.update(dt); if (this.dead) return;
    this.x += noise1(this.seed + time * 1.8) * 10 * dt + wind * 18 * dt;
    this.rotation += this.spin * dt;
    this.size *= 1 + 0.36 * dt; this.alpha = Math.sin((1 - this.t) * Math.PI) * (0.08 + this.smokeLevel * 0.15);
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = `rgba(126,122,116,${this.alpha * 0.55})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.size * 1.25, this.size * 0.76, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
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
