const STEP = 0.25;
const DEFAULT_RATE = 2;
const MIN_RATE = 0.25;
const MAX_RATE = 4;
const INDICATOR_ID = "youtube-arrow-speed-indicator";
const INDICATOR_HIDE_DELAY_MS = 900;

let indicatorHideTimeout;
let currentVideo;

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

  video.playbackRate = nextRate;
  showSpeedIndicator(nextRate);
}

function applyDefaultSpeed(video) {
  if (!video || video === currentVideo) return;

  currentVideo = video;
  video.playbackRate = DEFAULT_RATE;
}

function watchForVideos() {
  applyDefaultSpeed(getVideo());

  const observer = new MutationObserver(() => {
    applyDefaultSpeed(getVideo());
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

watchForVideos();

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
