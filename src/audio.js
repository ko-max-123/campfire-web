import { clamp01 } from "./utils.js";

const PLAYLIST = [
  "../audio/campfire_1.mp3",
  "../audio/campfire_2.mp3",
  "../audio/campfire_3.mp3",
];

export class FireAudio {
  constructor() {
    this.tracks = PLAYLIST.map((path) => {
      const audio = new Audio(new URL(path, import.meta.url));
      audio.preload = "auto";
      audio.addEventListener("ended", () => this.playNext());
      return audio;
    });

    this.currentIndex = 0;
    this.isPlaying = false;
    this.intensity = 0.84;
    this.applyVolume();
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
    if (this.tracks.length === 0) return;

    this.isPlaying = true;
    this.applyVolume();

    try {
      await this.currentTrack.play();
    } catch (error) {
      this.isPlaying = false;
      console.warn("Audio playback failed.", error);
    }
  }

  stop() {
    this.isPlaying = false;
    this.currentTrack.pause();
  }

  update() {}

  get currentTrack() {
    return this.tracks[this.currentIndex];
  }

  applyVolume() {
    const volume = 0.28 + this.intensity * 0.62;
    this.tracks.forEach((track) => {
      track.volume = volume;
    });
  }

  async playNext() {
    if (!this.isPlaying || this.tracks.length === 0) return;

    this.currentTrack.pause();
    this.currentTrack.currentTime = 0;
    this.currentIndex = (this.currentIndex + 1) % this.tracks.length;

    try {
      await this.currentTrack.play();
    } catch (error) {
      this.isPlaying = false;
      console.warn("Audio playback failed.", error);
    }
  }
}
