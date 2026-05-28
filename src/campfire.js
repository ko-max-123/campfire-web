import { FlameRibbon, EmberSpark, SmokePuff, CoalGlow } from "./particles.js";
import { clamp01, randomRange, noise1, noise2 } from "./utils.js";

export class CampfireScene {
  constructor(canvas, ctx) {
    this.canvas = canvas; this.ctx = ctx;
    this.width = 0; this.height = 0; this.dpr = 1;
    this.intensity = 0.84; this.wind = -0.22; this.smokeLevel = 0.72; this.time = 0;
    this.flames = []; this.embers = []; this.smokes = []; this.coals = []; this.groundStones = [];
    this.grassStems = []; this.ashFlecks = []; this.ringStones = []; this.logGrain = []; this.distantTrees = [];
    this.staticCanvas = null; this.staticCtx = null;
    this.flameAcc = 0; this.emberAcc = 0; this.smokeAcc = 0;
    this.maxFlames = 120; this.maxEmbers = 70; this.maxSmokes = 28;
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
    this.buildStaticLayer();
  }

  buildStaticElements() {
    this.coals = [];
    const coalCount = Math.max(24, Math.floor(this.width / 42));
    for (let i = 0; i < coalCount; i += 1) {
      this.coals.push(new CoalGlow(this.fireX + randomRange(-140, 120), this.fireY + randomRange(-12, 34), randomRange(8, 22), randomRange(-6, 18)));
    }
    this.groundStones = [];
    const count = Math.max(24, Math.floor(this.width / 44));
    for (let i = 0; i < count; i += 1) {
      this.groundStones.push({ x: Math.random() * this.width, y: this.height * (0.56 + Math.random() * 0.4), r: Math.random() * 3.6 + 0.6, a: Math.random() * 0.25 + 0.08 });
    }
    this.grassStems = [];
    const grassCount = Math.max(45, Math.floor(this.width / 18));
    for (let i = 0; i < grassCount; i += 1) {
      const yBand = Math.random() < 0.5 ? randomRange(0.08, 0.56) : randomRange(0.66, 0.98);
      this.grassStems.push({
        x: Math.random() * this.width,
        y: this.height * yBand,
        h: randomRange(6, 22),
        lean: randomRange(-5, 5),
        a: randomRange(0.08, 0.26),
      });
    }
    this.ashFlecks = [];
    for (let i = 0; i < 42; i += 1) {
      this.ashFlecks.push({
        x: this.fireX + randomRange(-210, 210),
        y: this.fireY + randomRange(-4, 84),
        rx: randomRange(1.2, 5.2),
        ry: randomRange(0.5, 2.0),
        rot: randomRange(-0.6, 0.6),
        a: randomRange(0.08, 0.22),
      });
    }
    this.ringStones = [];
    const ringCount = 14;
    for (let i = 0; i < ringCount; i += 1) {
      const angle = (i / ringCount) * Math.PI * 2 + randomRange(-0.08, 0.08);
      this.ringStones.push({
        x: this.fireX + Math.cos(angle) * randomRange(150, 194),
        y: this.fireY + 26 + Math.sin(angle) * randomRange(46, 72),
        r: randomRange(12, 27),
        squish: randomRange(0.52, 0.82),
        rot: angle + randomRange(-0.4, 0.4),
        shade: randomRange(90, 135),
      });
    }
    this.logGrain = [];
    for (let i = 0; i < 26; i += 1) {
      this.logGrain.push({
        offset: randomRange(-0.4, 0.4),
        length: randomRange(0.18, 0.92),
        width: randomRange(0.08, 0.46),
        a: randomRange(0.18, 0.46),
      });
    }
    this.distantTrees = [];
    for (let i = 0; i < 18; i += 1) {
      this.distantTrees.push({
        x: (i / 17) * this.width + noise1(i * 2.2) * 24,
        h: this.height * randomRange(0.16, 0.33),
        w: randomRange(22, 38),
      });
    }
  }

  update(dt) {
    this.time += dt;
    const flameRate = 76 * (0.35 + this.intensity * 0.9);
    const emberRate = 8 * (0.25 + this.intensity * 1.2);
    const smokeRate = 4.6 * (0.2 + this.smokeLevel * 1.15);
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

  buildStaticLayer() {
    this.staticCanvas = document.createElement("canvas");
    this.staticCanvas.width = Math.floor(this.width * this.dpr);
    this.staticCanvas.height = Math.floor(this.height * this.dpr);
    this.staticCtx = this.staticCanvas.getContext("2d");
    this.staticCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const liveCtx = this.ctx;
    this.ctx = this.staticCtx;
    this.drawBackground();
    this.drawDirt(false);
    this.drawAshBed();
    this.drawStoneRing();
    this.drawLogs();
    this.ctx = liveCtx;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.drawImage(this.staticCanvas, 0, 0, this.width, this.height);
    this.drawGroundGlow(); this.drawCoalBed(); this.drawCoreGlow(); this.drawHeatHaze();
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

    ctx.save();
    ctx.fillStyle = "rgba(22, 28, 24, 0.28)";
    const treeBase = this.height * 0.54;
    for (const tree of this.distantTrees) {
      ctx.beginPath();
      ctx.moveTo(tree.x - tree.w, treeBase);
      ctx.lineTo(tree.x, treeBase - tree.h);
      ctx.lineTo(tree.x + tree.w, treeBase);
      ctx.closePath();
      ctx.fill();
    }
    const vignette = ctx.createRadialGradient(this.width * 0.5, this.height * 0.62, this.height * 0.18, this.width * 0.5, this.height * 0.62, this.height * 0.85);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.38)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
  }

  drawDirt(animated = true) {
    const ctx = this.ctx;
    for (const s of this.groundStones) {
      ctx.fillStyle = `rgba(165,160,150,${s.a})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.save(); ctx.lineWidth = 1.2;
    for (const stem of this.grassStems) {
      const sway = animated ? noise2(stem.x * 0.02, this.time * 0.5) * 1.8 : 0;
      ctx.strokeStyle = `rgba(86,103,76,${stem.a})`;
      ctx.beginPath();
      ctx.moveTo(stem.x, stem.y);
      ctx.lineTo(stem.x + stem.lean + sway, stem.y - stem.h);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawAshBed() {
    const ctx = this.ctx;
    const ash = ctx.createRadialGradient(this.fireX, this.fireY + 28, 0, this.fireX, this.fireY + 28, 220);
    ash.addColorStop(0, "rgba(145,135,128,0.22)"); ash.addColorStop(0.45, "rgba(128,120,114,0.12)"); ash.addColorStop(1, "rgba(90,86,82,0)");
    ctx.fillStyle = ash; ctx.beginPath(); ctx.ellipse(this.fireX, this.fireY + 28, 210, 88, 0, 0, Math.PI * 2); ctx.fill();
    for (const fleck of this.ashFlecks) {
      ctx.save();
      ctx.translate(fleck.x, fleck.y);
      ctx.rotate(fleck.rot);
      ctx.fillStyle = `rgba(190,184,176,${fleck.a})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, fleck.rx, fleck.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawStoneRing() {
    const ctx = this.ctx;
    ctx.save();
    for (const stone of this.ringStones) {
      const g = ctx.createRadialGradient(stone.x - stone.r * 0.3, stone.y - stone.r * 0.3, 0, stone.x, stone.y, stone.r * 1.3);
      g.addColorStop(0, `rgba(${stone.shade + 36},${stone.shade + 32},${stone.shade + 26},0.92)`);
      g.addColorStop(0.58, `rgba(${stone.shade},${stone.shade - 4},${stone.shade - 10},0.88)`);
      g.addColorStop(1, "rgba(45,43,42,0.92)");
      ctx.translate(stone.x, stone.y);
      ctx.rotate(stone.rot);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, stone.r, stone.r * stone.squish, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(20,18,17,0.28)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }
    ctx.restore();
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
    const drawLog = (x1, y1, x2, y2, width, baseColor, grainOffset = 0) => {
      const dx = x2 - x1, dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      const nx = -dy / len, ny = dx / len;
      ctx.save(); ctx.lineCap = "round";
      ctx.strokeStyle = baseColor; ctx.lineWidth = width;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

      const bark = ctx.createLinearGradient(x1, y1, x2, y2);
      bark.addColorStop(0, "rgba(36,25,19,0.52)");
      bark.addColorStop(0.38, "rgba(120,82,50,0.18)");
      bark.addColorStop(1, "rgba(20,16,14,0.62)");
      ctx.strokeStyle = bark; ctx.lineWidth = width * 0.74;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

      ctx.strokeStyle = "rgba(15,15,15,0.8)"; ctx.lineWidth = width * 0.45;
      ctx.beginPath(); ctx.moveTo(x1 + 2, y1 - 2); ctx.lineTo(x2 - 2, y2 + 2); ctx.stroke();
      ctx.strokeStyle = "rgba(218,150,84,0.16)";
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 4; i += 1) {
        const grain = this.logGrain[(i + grainOffset) % this.logGrain.length];
        const side = grain.offset * width;
        const t1 = grain.length * 0.72;
        const t0 = Math.max(0.02, t1 - grain.width);
        ctx.beginPath();
        ctx.moveTo(x1 + dx * t0 + nx * side, y1 + dy * t0 + ny * side);
        ctx.lineTo(x1 + dx * t1 + nx * (side + noise1(i + this.time) * 1.4), y1 + dy * t1 + ny * (side + noise1(i + 2) * 1.4));
        ctx.strokeStyle = `rgba(230,170,100,${grain.a * 0.42})`;
        ctx.stroke();
      }
      for (const end of [[x1, y1], [x2, y2]]) {
        ctx.save();
        ctx.translate(end[0], end[1]);
        ctx.rotate(Math.atan2(dy, dx));
        ctx.fillStyle = "rgba(86,58,38,0.9)";
        ctx.beginPath();
        ctx.ellipse(0, 0, width * 0.48, width * 0.34, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(26,18,14,0.72)";
        ctx.lineWidth = 1.3;
        ctx.stroke();
        ctx.strokeStyle = "rgba(180,122,70,0.28)";
        for (let r = 0.22; r < 0.48; r += 0.2) {
          ctx.beginPath();
          ctx.ellipse(0, 0, width * r, width * r * 0.7, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
      for (let i = 0; i < 3; i += 1) {
        const t = i / 4, cx = x1 + (x2 - x1) * t, cy = y1 + (y2 - y1) * t;
        const gg = ctx.createRadialGradient(cx, cy, 0, cx, cy, width * 1.1);
        const glowAlpha = (0.05 + this.intensity * 0.08) * (0.8 + noise2(i, this.time * 6 + i) * 0.25);
        gg.addColorStop(0, `rgba(255,100,24,${glowAlpha})`); gg.addColorStop(1, "rgba(255,80,20,0)");
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(cx, cy, width * 0.9, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    };
    drawLog(x - 170, y + 56, x - 6, y - 12, 22, "#735841", 0);
    drawLog(x - 28, y + 98, x + 92, y - 42, 25, "#614736", 8);
    drawLog(x + 18, y + 82, x + 188, y - 36, 20, "#705540", 16);
    drawLog(x - 12, y + 20, x + 56, y - 124, 15, "#503a31", 24);
    drawLog(x + 6, y + 8, x + 120, y - 82, 17, "#47322c", 31);
  }

  drawCoalBed() {
    for (const coal of this.coals) coal.draw(this.ctx, this.time, this.intensity);
    const ctx = this.ctx;
    for (let i = 0; i < 10; i += 1) {
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
    for (let i = 0; i < 5; i += 1) {
      const oy = i * 18, ox = noise2(i, this.time * 2.6) * 16 + this.wind * 40;
      ctx.beginPath(); ctx.ellipse(baseX + ox, baseY + oy, 68 - i * 3, 28 - i * 1.4, 0.12 + this.wind * 0.08, 0.2, Math.PI - 0.2); ctx.stroke();
    }
    ctx.restore();
  }
}
