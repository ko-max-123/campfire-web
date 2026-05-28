import { topics as defaultTopics } from "./topics.js";

const video = document.getElementById("campfire-video");
const topicCard = document.getElementById("topic-card");
const topicTitle = document.getElementById("topic-title");
const topicBody = document.getElementById("topic-body");
const controlPanel = document.getElementById("control-panel");
const panelToggle = document.getElementById("panel-toggle");
const intervalSelect = document.getElementById("interval-select");
const nextTopicButton = document.getElementById("next-topic");
const topicForm = document.getElementById("topic-form");
const topicInput = document.getElementById("topic-input");

const topics = [...defaultTopics];
let currentIndex = -1;
let topicTimer = null;

startVideo();
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
  video.muted = true;
  const playPromise = video.play();
  if (playPromise) {
    playPromise.catch(() => {
      window.addEventListener("pointerdown", () => video.play(), { once: true });
      window.addEventListener("keydown", () => video.play(), { once: true });
    });
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
