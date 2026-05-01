const STEP = 0.25;
const DEFAULT_RATE = 2;
const MIN_RATE = 0.25;
const MAX_RATE = 4;
const INDICATOR_ID = "youtube-arrow-speed-indicator";
const INDICATOR_HIDE_DELAY_MS = 900;

let indicatorHideTimeout;
let currentVideo;
let currentVideoContext;
let desiredRate = DEFAULT_RATE;
let isAdShowing = false;
let retryTimeouts = [];

function isTypingTarget(target) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target?.isContentEditable
  );
}

function getVideo() {
  return document.querySelector("video");
}

function getVideoContext() {
  const url = new URL(window.location.href);

  if (url.pathname.startsWith("/shorts/")) {
    const shortsId = url.pathname.split("/")[2];
    return shortsId ? `shorts:${shortsId}` : null;
  }

  const videoId = url.searchParams.get("v");
  return videoId ? `watch:${videoId}` : null;
}

function getIsAdShowing() {
  return document.getElementById("movie_player")?.classList.contains("ad-showing") ?? false;
}

function getIndicator() {
  const existingIndicator = document.getElementById(INDICATOR_ID);

  if (existingIndicator) return existingIndicator;

  const indicator = document.createElement("div");
  indicator.id = INDICATOR_ID;
  indicator.setAttribute("aria-live", "polite");
  Object.assign(indicator.style, {
    position: "fixed",
    top: "72px",
    right: "24px",
    zIndex: "2147483647",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "rgba(0, 0, 0, 0.72)",
    color: "#fff",
    font: "600 13px/1.2 system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    letterSpacing: "0.01em",
    opacity: "0",
    pointerEvents: "none",
    transform: "translateY(-4px)",
    transition: "opacity 120ms ease, transform 120ms ease",
  });

  document.documentElement.append(indicator);

  return indicator;
}

function showSpeedIndicator(speed) {
  const indicator = getIndicator();

  indicator.textContent = `${speed.toFixed(2).replace(/\.00$/, "").replace(/0$/, "")}x`;
  indicator.style.opacity = "1";
  indicator.style.transform = "translateY(0)";

  clearTimeout(indicatorHideTimeout);
  indicatorHideTimeout = setTimeout(() => {
    indicator.style.opacity = "0";
    indicator.style.transform = "translateY(-4px)";
  }, INDICATOR_HIDE_DELAY_MS);
}

function setSpeed(delta) {
  const video = getVideo();

  if (!video) return;

  const nextRate = Math.min(
    MAX_RATE,
    Math.max(MIN_RATE, Math.round((video.playbackRate + delta) * 100) / 100),
  );

  desiredRate = nextRate;
  video.playbackRate = nextRate;
  showSpeedIndicator(nextRate);
}

function clearRetryTimeouts() {
  retryTimeouts.forEach((timeout) => clearTimeout(timeout));
  retryTimeouts = [];
}

function enforceSpeed() {
  const video = getVideo();

  if (!video || getIsAdShowing()) return;

  if (video.playbackRate !== desiredRate) {
    video.playbackRate = desiredRate;
  }
}

function scheduleSpeedEnforcement() {
  clearRetryTimeouts();
  [0, 100, 250, 500, 1000, 1500].forEach((delay) => {
    retryTimeouts.push(setTimeout(enforceSpeed, delay));
  });
}

function handleVideoContextChange() {
  const nextVideoContext = getVideoContext();

  if (!nextVideoContext || nextVideoContext === currentVideoContext) return;

  currentVideoContext = nextVideoContext;
  desiredRate = DEFAULT_RATE;
  scheduleSpeedEnforcement();
}

function handleRateChange(event) {
  if (getIsAdShowing()) return;

  if (event.currentTarget.playbackRate !== desiredRate) {
    scheduleSpeedEnforcement();
  }
}

function bindVideo(video) {
  if (!video || video === currentVideo) return;

  if (currentVideo) {
    currentVideo.removeEventListener("loadedmetadata", scheduleSpeedEnforcement);
    currentVideo.removeEventListener("canplay", scheduleSpeedEnforcement);
    currentVideo.removeEventListener("play", scheduleSpeedEnforcement);
    currentVideo.removeEventListener("playing", scheduleSpeedEnforcement);
    currentVideo.removeEventListener("ratechange", handleRateChange);
  }

  currentVideo = video;
  currentVideo.addEventListener("loadedmetadata", scheduleSpeedEnforcement);
  currentVideo.addEventListener("canplay", scheduleSpeedEnforcement);
  currentVideo.addEventListener("play", scheduleSpeedEnforcement);
  currentVideo.addEventListener("playing", scheduleSpeedEnforcement);
  currentVideo.addEventListener("ratechange", handleRateChange);

  scheduleSpeedEnforcement();
}

function handleAdStateChange() {
  const nextIsAdShowing = getIsAdShowing();

  if (nextIsAdShowing === isAdShowing) return;

  isAdShowing = nextIsAdShowing;

  if (!isAdShowing) {
    scheduleSpeedEnforcement();
  }
}

function watchForVideos() {
  handleVideoContextChange();
  bindVideo(getVideo());
  handleAdStateChange();

  const observer = new MutationObserver(() => {
    bindVideo(getVideo());
    handleVideoContextChange();
    handleAdStateChange();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

watchForVideos();

window.addEventListener("yt-navigate-finish", handleVideoContextChange);
window.addEventListener("yt-page-data-updated", handleVideoContextChange);
window.addEventListener("popstate", handleVideoContextChange);

window.addEventListener(
  "keydown",
  (event) => {
    if (event.defaultPrevented) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (isTypingTarget(event.target)) return;

    if (event.key === "ArrowUp") {
      event.preventDefault();
      event.stopImmediatePropagation();
      setSpeed(STEP);
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      event.stopImmediatePropagation();
      setSpeed(-STEP);
    }
  },
  { capture: true },
);
