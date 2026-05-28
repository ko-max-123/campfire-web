export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
export function clamp01(value) {
  return clamp(value, 0, 1);
}
export function lerp(a, b, t) {
  return a + (b - a) * t;
}
export function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}
export function noise1(x) {
  return Math.sin(x * 1.13) * 0.5 + Math.sin(x * 2.31 + 1.7) * 0.28 + Math.sin(x * 4.71 + 0.3) * 0.22;
}
export function noise2(x, y) {
  return Math.sin(x * 1.37 + y * 0.73) * 0.45
    + Math.sin(x * 2.89 + y * 1.91 + 1.2) * 0.32
    + Math.sin(x * 4.53 + y * 2.77 + 2.1) * 0.23;
}
