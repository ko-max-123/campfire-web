import { CampfireScene } from "./campfire.js";
import { FireAudio } from "./audio.js";

const canvas = document.getElementById("campfire-canvas");
const ctx = canvas.getContext("2d");

const INITIAL_INTENSITY = 0.84;
const INITIAL_WIND = -0.22;
const INITIAL_SMOKE = 0.72;

const scene = new CampfireScene(canvas, ctx);
const audio = new FireAudio();

scene.setIntensity(INITIAL_INTENSITY);
scene.setWind(INITIAL_WIND);
scene.setSmoke(INITIAL_SMOKE);
audio.setIntensity(INITIAL_INTENSITY);

startAudio();
window.addEventListener("pointerdown", startAudio, { once: true });
window.addEventListener("keydown", startAudio, { once: true });
document.addEventListener("visibilitychange", () => {
  if (document.hidden) return;
  startAudio();
});

function resize() {
  scene.resize(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
}

window.addEventListener("resize", resize);
resize();

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

async function startAudio() {
  if (audio.isPlaying) return;

  try {
    await audio.start();
  } catch (error) {
    console.warn("Audio autoplay failed.", error);
  }
}
