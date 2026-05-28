import { clamp01, randomRange, lerp } from "./utils.js";

export class FireAudio {
  constructor() {
    this.ctx = null; this.master = null; this.noise = null; this.noiseGain = null;
    this.lowBand = null; this.midBand = null; this.rumbleOsc = null; this.rumbleGain = null; this.crackleBus = null;
    this.isPlaying = false; this.intensity = 0.84; this.elapsed = 0; this.nextCrackle = 0.2;
  }
  setIntensity(v) { this.intensity = clamp01(Number(v)); }
  async toggle() { if (!this.isPlaying) { await this.start(); return true; } this.stop(); return false; }
  async start() { if (!this.ctx) this.setup(); if (this.ctx.state === "suspended") await this.ctx.resume(); this.isPlaying = true; }
  stop() { this.isPlaying = false; if (this.master && this.ctx) this.master.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.08); }

  setup() {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextCtor();
    this.master = this.ctx.createGain(); this.master.gain.value = 0.0001; this.master.connect(this.ctx.destination);

    const buffer = this.makeNoiseBuffer(3.0);
    this.noise = this.ctx.createBufferSource(); this.noise.buffer = buffer; this.noise.loop = true;

    this.lowBand = this.ctx.createBiquadFilter(); this.lowBand.type = "lowpass"; this.lowBand.frequency.value = 180;
    this.midBand = this.ctx.createBiquadFilter(); this.midBand.type = "bandpass"; this.midBand.frequency.value = 650; this.midBand.Q.value = 0.7;

    const lowGain = this.ctx.createGain(); lowGain.gain.value = 0.12;
    this.noiseGain = this.ctx.createGain(); this.noiseGain.gain.value = 0.14;

    this.noise.connect(this.lowBand); this.lowBand.connect(lowGain); lowGain.connect(this.master);
    this.noise.connect(this.midBand); this.midBand.connect(this.noiseGain); this.noiseGain.connect(this.master);

    this.rumbleOsc = this.ctx.createOscillator(); this.rumbleOsc.type = "triangle"; this.rumbleOsc.frequency.value = 46;
    this.rumbleGain = this.ctx.createGain(); this.rumbleGain.gain.value = 0.018; this.rumbleOsc.connect(this.rumbleGain); this.rumbleGain.connect(this.master);

    this.crackleBus = this.ctx.createGain(); this.crackleBus.gain.value = 1; this.crackleBus.connect(this.master);

    this.noise.start(); this.rumbleOsc.start();
  }

  makeNoiseBuffer(seconds) {
    const rate = this.ctx.sampleRate, len = Math.floor(rate * seconds);
    const buffer = this.ctx.createBuffer(1, len, rate), data = buffer.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < len; i += 1) {
      const white = Math.random() * 2 - 1; brown = brown * 0.985 + white * 0.15; data[i] = brown;
    }
    return buffer;
  }

  fireCrackle(type = "small") {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const dur = type === "big" ? randomRange(0.03, 0.07) : randomRange(0.012, 0.035);
    const peak = type === "big" ? randomRange(0.16, 0.3) * (0.5 + this.intensity * 0.9) : randomRange(0.05, 0.14) * (0.5 + this.intensity * 0.8);

    const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      const env = 1 - i / data.length; data[i] = (Math.random() * 2 - 1) * env * env;
    }

    const src = this.ctx.createBufferSource(); src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter(); filter.type = "bandpass";
    filter.frequency.value = type === "big" ? randomRange(1200, 2600) : randomRange(2200, 4800);
    filter.Q.value = type === "big" ? 1.4 : 2.2;
    const gain = this.ctx.createGain(); gain.gain.value = 0.0001;

    src.connect(filter); filter.connect(gain); gain.connect(this.crackleBus);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    src.start(now); src.stop(now + dur + 0.02);
  }

  update(dt) {
    if (!this.ctx || !this.master) return;
    this.elapsed += dt;
    const now = this.ctx.currentTime;
    const masterTarget = this.isPlaying ? 0.26 + this.intensity * 0.56 : 0.0001;
    this.master.gain.setTargetAtTime(masterTarget, now, 0.08);

    const noiseTarget = 0.08 + this.intensity * 0.16 + Math.sin(this.elapsed * 1.8) * 0.01;
    const lowTarget = 130 + this.intensity * 90 + Math.sin(this.elapsed * 1.1) * 8;
    const midTarget = 480 + this.intensity * 520 + Math.sin(this.elapsed * 2.2) * 28;
    const rumbleTarget = 43 + this.intensity * 9 + Math.sin(this.elapsed * 1.5) * 1.4;

    this.noiseGain.gain.setTargetAtTime(noiseTarget, now, 0.15);
    this.lowBand.frequency.setTargetAtTime(lowTarget, now, 0.16);
    this.midBand.frequency.setTargetAtTime(midTarget, now, 0.12);
    this.rumbleOsc.frequency.setTargetAtTime(rumbleTarget, now, 0.25);

    if (!this.isPlaying) return;
    this.nextCrackle -= dt;
    if (this.nextCrackle <= 0) {
      if (Math.random() < 0.78) this.fireCrackle("small");
      if (Math.random() < 0.22 + this.intensity * 0.3) this.fireCrackle("big");
      if (Math.random() < 0.18) this.fireCrackle("small");
      this.nextCrackle = randomRange(lerp(0.42, 0.11, this.intensity), lerp(0.9, 0.28, this.intensity));
    }
  }
}
