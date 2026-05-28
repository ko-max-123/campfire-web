import { topics as defaultTopics } from "./topics.js";

const video = document.getElementById("campfire-video");
const topicCard = document.getElementById("topic-card");
const topicTitle = document.getElementById("topic-title");
const topicBody = document.getElementById("topic-body");
const controlPanel = document.getElementById("control-panel");
const panelToggle = document.getElementById("panel-toggle");
const intervalSelect = document.getElementById("interval-select");
const nextTopicButton = document.getElementById("next-topic");
const soundToggle = document.getElementById("sound-toggle");
const soundStatus = document.getElementById("sound-status");
const topicForm = document.getElementById("topic-form");
const topicInput = document.getElementById("topic-input");

const topics = [...defaultTopics];
const LOOP_START_SECONDS = 1;
const LOOP_END_BUFFER_SECONDS = 0.18;

let currentIndex = -1;
let topicTimer = null;
let soundEnabled = true;
let loopMonitorStarted = false;

startVideo();
startLoopMonitor();
showNextTopic();
scheduleNextTopic();

panelToggle.addEventListener("click", () => {
  controlPanel.classList.toggle("is-open");
  if (controlPanel.classList.contains("is-open")) {
    topicInput.focus();
  }
});

nextTopicButton.addEventListener("click", () => {
  showNextTopic();
  scheduleNextTopic();
});

soundToggle.addEventListener("click", toggleSound);

intervalSelect.addEventListener("change", scheduleNextTopic);

topicForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const body = topicInput.value.trim();
  if (!body) return;

  const topic = {
    title: "追加した話題",
    body,
  };

  topics.splice(currentIndex + 1, 0, topic);
  currentIndex += 1;
  showTopic(topic);
  topicInput.value = "";
  scheduleNextTopic();
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    startVideo();
  }
});

function startVideo() {
  video.volume = 1;
  video.muted = !soundEnabled;
  const playPromise = video.play();
  if (playPromise) {
    playPromise.catch(() => {
      video.muted = true;
      video.play().catch(() => {});
      updateSoundState("音声付きの自動再生がブロックされました。");
    });
  }

  updateSoundState();
}

function startLoopMonitor() {
  if (loopMonitorStarted) return;

  loopMonitorStarted = true;
  video.addEventListener("loadedmetadata", seekToLoopStart);
  video.addEventListener("ended", seekToLoopStart);
  monitorLoopPoint();
}

function monitorLoopPoint() {
  if (Number.isFinite(video.duration) && video.duration > LOOP_START_SECONDS + 1) {
    const loopPoint = video.duration - LOOP_END_BUFFER_SECONDS;
    if (video.currentTime >= loopPoint) {
      seekToLoopStart();
    }
  }

  window.requestAnimationFrame(monitorLoopPoint);
}

function seekToLoopStart() {
  if (!Number.isFinite(video.duration) || video.duration <= LOOP_START_SECONDS) return;

  video.currentTime = LOOP_START_SECONDS;
  if (video.paused) {
    video.play().catch(() => {});
  }
}

function toggleSound() {
  if (video.muted || video.volume === 0) {
    enableSound();
    return;
  }

  soundEnabled = false;
  video.muted = true;
  updateSoundState();
}

async function enableSound() {
  soundEnabled = true;
  video.volume = 1;
  video.muted = false;

  try {
    await video.play();
    updateSoundState();
  } catch (error) {
    updateSoundState("音を有効にできませんでした。もう一度押してください。");
  }
}

function updateSoundState(message = "") {
  const isMuted = video.muted || video.volume === 0;
  soundToggle.textContent = isMuted ? "音を有効にする" : "音をミュートする";
  soundStatus.textContent = message || (isMuted ? "動画は再生中です。音はミュートされています。" : "動画の音を再生中です。");
}

function showNextTopic() {
  if (topics.length === 0) return;

  currentIndex = (currentIndex + 1) % topics.length;
  showTopic(topics[currentIndex]);
}

function showTopic(topic) {
  topicCard.classList.remove("is-visible");

  window.setTimeout(() => {
    topicTitle.textContent = topic.title;
    topicBody.textContent = topic.body;
    topicCard.classList.add("is-visible");
  }, 140);
}

function scheduleNextTopic() {
  if (topicTimer) {
    window.clearInterval(topicTimer);
  }

  topicTimer = window.setInterval(() => {
    showNextTopic();
  }, Number(intervalSelect.value));
}
