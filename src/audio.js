import { clamp01 } from "./utils.js";

const PLAYLIST = [
  "../audio/campfire_1.mp3",
  "../audio/campfire_2.mp3",
  "../audio/campfire_3.mp3",
];

const START_DELAY_SECONDS = 0.06;
const CROSSFADE_SECONDS = 0.7;
const SCHEDULE_AHEAD_SECONDS = 30;
const SCHEDULER_INTERVAL_MS = 250;
const RESUME_TIMEOUT_MS = 300;

export class FireAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.buffers = [];
    this.loadingPromise = null;
    this.startingPromise = null;
    this.activeSources = new Set();
    this.currentIndex = 0;
    this.nextIndex = 0;
    this.nextStartTime = 0;
    this.schedulerId = null;
    this.isPlaying = false;
    this.intensity = 0.84;
  }

  setIntensity(v) {
    this.intensity = clamp01(Number(v));
    this.applyVolume();
  }

  async toggle() {
    if (!this.isPlaying) {
      await this.start();
      return true;
    }

    this.stop();
    return false;
  }

  async start() {
    if (this.startingPromise) return this.startingPromise;

    this.startingPromise = this.startPlayback();

    try {
      return await this.startingPromise;
    } finally {
      this.startingPromise = null;
    }
  }

  async startPlayback() {
    this.setup();

    if (this.ctx.state === "suspended") {
      await Promise.race([
        this.ctx.resume(),
        new Promise((resolve) => {
          window.setTimeout(resolve, RESUME_TIMEOUT_MS);
        }),
      ]);
    }

    if (this.ctx.state !== "running") return false;

    await this.loadBuffers();

    if (this.buffers.length === 0) return false;

    this.stopSources();
    this.isPlaying = true;
    this.nextIndex = this.currentIndex;
    this.nextStartTime = this.ctx.currentTime + START_DELAY_SECONDS;
    this.applyVolume();
    this.scheduleUpcoming();
    this.startScheduler();
    return true;
  }

  stop() {
    this.isPlaying = false;
    this.stopScheduler();
    this.stopSources();
  }

  update() {
    this.scheduleUpcoming();
  }

  startScheduler() {
    if (this.schedulerId) return;

    this.schedulerId = window.setInterval(() => {
      this.scheduleUpcoming();
    }, SCHEDULER_INTERVAL_MS);
  }

  stopScheduler() {
    if (!this.schedulerId) return;

    window.clearInterval(this.schedulerId);
    this.schedulerId = null;
  }

  setup() {
    if (this.ctx) return;

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextCtor();
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    this.applyVolume();
  }

  async loadBuffers() {
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = Promise.all(
      PLAYLIST.map(async (path) => {
        const url = new URL(path, import.meta.url);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to load audio: ${url}`);
        }

        const data = await response.arrayBuffer();
        return this.ctx.decodeAudioData(data);
      }),
    ).then((buffers) => {
      this.buffers = buffers;
      return buffers;
    });

    return this.loadingPromise;
  }

  scheduleUpcoming() {
    if (!this.isPlaying || !this.ctx || this.buffers.length === 0) return;

    const scheduleUntil = this.ctx.currentTime + SCHEDULE_AHEAD_SECONDS;
    while (this.nextStartTime < scheduleUntil) {
      const buffer = this.buffers[this.nextIndex];
      const crossfade = Math.min(CROSSFADE_SECONDS, buffer.duration / 2);

      this.scheduleTrack(this.nextIndex, this.nextStartTime, crossfade);
      this.currentIndex = this.nextIndex;
      this.nextIndex = (this.nextIndex + 1) % this.buffers.length;
      this.nextStartTime += Math.max(0.05, buffer.duration - crossfade);
    }
  }

  scheduleTrack(index, startTime, crossfade) {
    const buffer = this.buffers[index];
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    const quiet = 0.0001;
    const endTime = startTime + buffer.duration;

    source.buffer = buffer;
    source.connect(gain);
    gain.connect(this.master);

    gain.gain.setValueAtTime(quiet, startTime);
    gain.gain.linearRampToValueAtTime(1, startTime + crossfade);
    gain.gain.setValueAtTime(1, Math.max(startTime + crossfade, endTime - crossfade));
    gain.gain.linearRampToValueAtTime(quiet, endTime);

    source.addEventListener("ended", () => {
      this.activeSources.delete(source);
      source.disconnect();
      gain.disconnect();
    });

    this.activeSources.add(source);
    source.start(startTime);
    source.stop(endTime);
  }

  stopSources() {
    this.activeSources.forEach((source) => {
      try {
        source.stop();
      } catch (error) {
        // A source may already have finished naturally.
      }
    });
    this.activeSources.clear();
  }

  applyVolume() {
    if (!this.master) return;

    const volume = 0.28 + this.intensity * 0.62;
    this.master.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.04);
  }
}
