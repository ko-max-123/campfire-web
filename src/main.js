import { FireAudio } from "./audio.js";
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

const ambientAudio = new FireAudio();
const topics = [...defaultTopics];
const LOOP_START_SECONDS = 3;
const LOOP_END_BUFFER_SECONDS = 0.18;

let currentIndex = -1;
let topicTimer = null;
let soundEnabled = true;
let loopMonitorStarted = false;

ambientAudio.setIntensity(0.55);
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
      ambientAudio.stop();
      video.play().catch(() => {});
      updateSoundState("音声付きの自動再生がブロックされました。");
    });
  }

  startAmbientAudio().catch(() => {
    updateSoundState("audio の音声を開始できませんでした。");
  });
  updateSoundState();
}

async function startAmbientAudio() {
  if (!soundEnabled || ambientAudio.isPlaying) return;

  const didStart = await ambientAudio.start();
  if (!didStart) {
    updateSoundState("audio の音声は操作後に再生できます。");
  }
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
  ambientAudio.stop();
  updateSoundState();
}

async function enableSound() {
  soundEnabled = true;
  video.volume = 1;
  video.muted = false;

  try {
    await video.play();
    const didStartAudio = await ambientAudio.start();
    updateSoundState(didStartAudio ? "" : "動画音声を再生中です。audio の音声は開始できませんでした。");
  } catch (error) {
    updateSoundState("音を有効にできませんでした。もう一度押してください。");
  }
}

function updateSoundState(message = "") {
  const hasVideoSound = !video.muted && video.volume > 0;
  const hasAmbientSound = ambientAudio.isPlaying;
  const hasAnySound = hasVideoSound || hasAmbientSound;

  soundToggle.textContent = hasAnySound ? "音をミュートする" : "音を有効にする";
  if (message) {
    soundStatus.textContent = message;
  } else if (hasVideoSound && hasAmbientSound) {
    soundStatus.textContent = "動画と audio の音を再生中です。";
  } else if (hasVideoSound) {
    soundStatus.textContent = "動画音声を再生中です。";
  } else if (hasAmbientSound) {
    soundStatus.textContent = "audio の音を再生中です。";
  } else {
    soundStatus.textContent = "動画は再生中です。音はミュートされています。";
  }
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
