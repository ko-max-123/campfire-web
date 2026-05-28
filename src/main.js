import { CampfireScene } from "./campfire.js";
import { FireAudio } from "./audio.js";

const canvas = document.getElementById("campfire-canvas");
const ctx = canvas.getContext("2d");

const audioButton = document.getElementById("audio-toggle");
const intensitySlider = document.getElementById("intensity-slider");
const windSlider = document.getElementById("wind-slider");
const smokeSlider = document.getElementById("smoke-slider");

const scene = new CampfireScene(canvas, ctx);
const audio = new FireAudio();

scene.setIntensity(intensitySlider.value);
scene.setWind(windSlider.value);
scene.setSmoke(smokeSlider.value);
audio.setIntensity(intensitySlider.value);

function updateButton() {
  audioButton.textContent = audio.isPlaying ? "音を停止" : "音を再生";
}

audioButton.addEventListener("click", async () => {
  await audio.toggle();
  updateButton();
});

intensitySlider.addEventListener("input", (e) => {
  scene.setIntensity(e.target.value);
  audio.setIntensity(e.target.value);
});

windSlider.addEventListener("input", (e) => {
  scene.setWind(e.target.value);
});

smokeSlider.addEventListener("input", (e) => {
  scene.setSmoke(e.target.value);
});

function resize() {
  scene.resize(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
}

window.addEventListener("resize", resize);
resize();
updateButton();

let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.033);
  last = now;
  scene.update(dt);
  scene.draw();
  audio.update(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
