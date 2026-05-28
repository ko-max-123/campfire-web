import { FlameRibbon, EmberSpark, SmokePuff, CoalGlow } from "./particles.js";
import { clamp01, randomRange, noise1, noise2 } from "./utils.js";

export class CampfireScene {
  constructor(canvas, ctx) {
    this.canvas = canvas; this.ctx = ctx;
    this.width = 0; this.height = 0; this.dpr = 1;
    this.intensity = 0.84; this.wind = -0.22; this.smokeLevel = 0.72; this.time = 0;
    this.flames = []; this.embers = []; this.smokes = []; this.coals = []; this.groundStones = [];
    this.flameAcc = 0; this.emberAcc = 0; this.smokeAcc = 0;
    this.maxFlames = 160; this.maxEmbers = 90; this.maxSmokes = 42;
    this.resize(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
  }
  setIntensity(v) { this.intensity = clamp01(Number(v)); }
  setWind(v) { this.wind = Math.max(-1, Math.min(1, Number(v))); }
  setSmoke(v) { this.smokeLevel = clamp01(Number(v)); }
  get fireX() { return this.width * 0.52; }
  get fireY() { return this.height * 0.69; }

  resize(width, height, dpr = 1) {
    this.width = width; this.height = height; this.dpr = Math.min(dpr, 2);
    this.canvas.width = Math.floor(width * this.dpr); this.canvas.height = Math.floor(height * this.dpr);
    this.canvas.style.width = `${width}px`; this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.buildStaticElements();
  }

  buildStaticElements() {
    this.coals = [];
    const coalCount = Math.max(28, Math.floor(this.width / 32));
    for (let i = 0; i < coalCount; i += 1) {
      this.coals.push(new CoalGlow(this.fireX + randomRange(-140, 120), this.fireY + randomRange(-12, 34), randomRange(8, 22), randomRange(-6, 18)));
    }
    this.groundStones = [];
    const count = Math.max(18, Math.floor(this.width / 48));
    for (let i = 0; i < count; i += 1) {
      this.groundStones.push({ x: Math.random() * this.width, y: this.height * (0.56 + Math.random() * 0.4), r: Math.random() * 3.6 + 0.6, a: Math.random() * 0.25 + 0.08 });
    }
  }

  update(dt) {
    this.time += dt;
    const flameRate = 96 * (0.35 + this.intensity * 0.9);
    const emberRate = 9 * (0.25 + this.intensity * 1.2);
    const smokeRate = 7 * (0.2 + this.smokeLevel * 1.15);
    this.flameAcc += flameRate * dt; this.emberAcc += emberRate * dt; this.smokeAcc += smokeRate * dt;

    while (this.flameAcc >= 1) {
      this.flameAcc -= 1;
      if (this.flames.length < this.maxFlames) this.flames.push(new FlameRibbon(this.fireX, this.fireY, this.intensity, this.wind));
    }
    while (this.emberAcc >= 1) {
      this.emberAcc -= 1;
      if (this.embers.length < this.maxEmbers) this.embers.push(new EmberSpark(this.fireX, this.fireY - 4, this.intensity, this.wind));
    }
    while (this.smokeAcc >= 1) {
      this.smokeAcc -= 1;
      if (this.smokes.length < this.maxSmokes) this.smokes.push(new SmokePuff(this.fireX + 16, this.fireY - 42, this.smokeLevel, this.wind));
    }

    this.updateArray(this.flames, dt); this.updateArray(this.embers, dt); this.updateArray(this.smokes, dt);
  }

  updateArray(array, dt) {
    for (let i = array.length - 1; i >= 0; i -= 1) {
      const p = array[i];
      p.update(dt, this.time, this.wind);
      if (p.dead || p.x < -240 || p.x > this.width + 240 || p.y < -240) array.splice(i, 1);
    }
  }

  draw() {
    this.drawBackground(); this.drawDirt(); this.drawAshBed(); this.drawGroundGlow();
    this.drawLogs(); this.drawCoalBed(); this.drawCoreGlow(); this.drawHeatHaze();
    for (const smoke of this.smokes) smoke.draw(this.ctx);
    for (const flame of this.flames) flame.draw(this.ctx, this.time);
    for (const ember of this.embers) ember.draw(this.ctx);
  }

  drawBackground() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    const sky = ctx.createLinearGradient(0, 0, 0, this.height);
    sky.addColorStop(0, "#576456"); sky.addColorStop(0.22, "#495548"); sky.addColorStop(0.45, "#4b4a45");
    sky.addColorStop(0.7, "#302d2b"); sky.addColorStop(1, "#171717");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, this.width, this.height);

    const field = ctx.createLinearGradient(0, this.height * 0.42, 0, this.height);
    field.addColorStop(0, "rgba(82, 104, 76, 0.28)"); field.addColorStop(1, "rgba(38, 40, 39, 0)");
    ctx.fillStyle = field; ctx.fillRect(0, this.height * 0.1, this.width, this.height);
  }

  drawDirt() {
    const ctx = this.ctx;
    for (const s of this.groundStones) {
      ctx.fillStyle = `rgba(165,160,150,${s.a})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.save(); ctx.strokeStyle = "rgba(70,80,65,0.28)"; ctx.lineWidth = 1.4;
    for (let i = 0; i < 70; i += 1) {
      const x = (i / 70) * this.width + noise1(i + this.time * 0.1) * 8;
      const y = this.height * (0.06 + Math.random() * 0.7);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + randomRange(-4, 4), y + randomRange(6, 18)); ctx.stroke();
    }
    ctx.restore();
  }

  drawAshBed() {
    const ctx = this.ctx;
    const ash = ctx.createRadialGradient(this.fireX, this.fireY + 28, 0, this.fireX, this.fireY + 28, 220);
    ash.addColorStop(0, "rgba(145,135,128,0.22)"); ash.addColorStop(0.45, "rgba(128,120,114,0.12)"); ash.addColorStop(1, "rgba(90,86,82,0)");
    ctx.fillStyle = ash; ctx.beginPath(); ctx.ellipse(this.fireX, this.fireY + 28, 210, 88, 0, 0, Math.PI * 2); ctx.fill();
  }

  drawGroundGlow() {
    const ctx = this.ctx;
    const pulse = 1 + Math.sin(this.time * 4.8) * 0.03;
    const width = (180 + this.intensity * 150) * pulse, height = 52 + this.intensity * 26;
    const g = ctx.createRadialGradient(this.fireX, this.fireY + 26, 0, this.fireX, this.fireY + 26, width);
    g.addColorStop(0, `rgba(255,110,30,${0.18 + this.intensity * 0.12})`);
    g.addColorStop(0.55, `rgba(255,72,20,${0.08 + this.intensity * 0.08})`);
    g.addColorStop(1, "rgba(255,72,20,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(this.fireX, this.fireY + 30, width, height, 0, 0, Math.PI * 2); ctx.fill();
  }

  drawLogs() {
    const ctx = this.ctx, x = this.fireX, y = this.fireY + 6;
    const drawLog = (x1, y1, x2, y2, width, baseColor) => {
      ctx.save(); ctx.lineCap = "round";
      ctx.strokeStyle = baseColor; ctx.lineWidth = width;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.strokeStyle = "rgba(15,15,15,0.8)"; ctx.lineWidth = width * 0.45;
      ctx.beginPath(); ctx.moveTo(x1 + 2, y1 - 2); ctx.lineTo(x2 - 2, y2 + 2); ctx.stroke();
      for (let i = 0; i < 5; i += 1) {
        const t = i / 4, cx = x1 + (x2 - x1) * t, cy = y1 + (y2 - y1) * t;
        const gg = ctx.createRadialGradient(cx, cy, 0, cx, cy, width * 1.1);
        const glowAlpha = (0.05 + this.intensity * 0.08) * (0.8 + noise2(i, this.time * 6 + i) * 0.25);
        gg.addColorStop(0, `rgba(255,100,24,${glowAlpha})`); gg.addColorStop(1, "rgba(255,80,20,0)");
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(cx, cy, width * 0.9, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    };
    drawLog(x - 170, y + 56, x - 6, y - 12, 20, "#6e5644");
    drawLog(x - 28, y + 98, x + 92, y - 42, 22, "#5e4a3c");
    drawLog(x + 18, y + 82, x + 188, y - 36, 18, "#655243");
    drawLog(x - 12, y + 20, x + 56, y - 124, 13, "#53433a");
    drawLog(x + 6, y + 8, x + 120, y - 82, 15, "#453732");
  }

  drawCoalBed() {
    for (const coal of this.coals) coal.draw(this.ctx, this.time, this.intensity);
    const ctx = this.ctx;
    for (let i = 0; i < 26; i += 1) {
      const x = this.fireX + randomRange(-120, 110), y = this.fireY + randomRange(2, 46), alpha = 0.04 + this.intensity * 0.08;
      ctx.fillStyle = `rgba(220, 50, 14, ${alpha})`;
      ctx.beginPath(); ctx.arc(x, y, randomRange(1.2, 3.6), 0, Math.PI * 2); ctx.fill();
    }
  }

  drawCoreGlow() {
    const ctx = this.ctx, leanX = this.fireX + this.wind * 28, leanY = this.fireY - 44;
    const g1 = ctx.createRadialGradient(leanX, leanY, 0, leanX, leanY, 130 + this.intensity * 60);
    g1.addColorStop(0, `rgba(255,220,132,${0.22 + this.intensity * 0.12})`);
    g1.addColorStop(0.45, `rgba(255,132,28,${0.1 + this.intensity * 0.1})`);
    g1.addColorStop(1, "rgba(255,90,20,0)");

    const g2 = ctx.createRadialGradient(leanX - 32, leanY - 18, 0, leanX - 32, leanY - 18, 190 + this.intensity * 90);
    g2.addColorStop(0, `rgba(255,140,36,${0.08 + this.intensity * 0.08})`);
    g2.addColorStop(1, "rgba(255,100,22,0)");

    ctx.save(); ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(leanX - 24, leanY - 6, 180 + this.intensity * 70, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = g1; ctx.beginPath(); ctx.arc(leanX, leanY, 122 + this.intensity * 54, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  drawHeatHaze() {
    const ctx = this.ctx; ctx.save(); ctx.globalAlpha = 0.05; ctx.strokeStyle = "rgba(255,210,168,0.28)"; ctx.lineWidth = 2;
    const baseX = this.fireX + this.wind * 32, baseY = this.fireY - 170;
    for (let i = 0; i < 9; i += 1) {
      const oy = i * 18, ox = noise2(i, this.time * 2.6) * 16 + this.wind * 40;
      ctx.beginPath(); ctx.ellipse(baseX + ox, baseY + oy, 68 - i * 3, 28 - i * 1.4, 0.12 + this.wind * 0.08, 0.2, Math.PI - 0.2); ctx.stroke();
    }
    ctx.restore();
  }
}
