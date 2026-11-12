import { PRELOAD_STILLS, PRELOAD_VIDEOS } from "./mood";

export function preloadMissionMedia() {
  if (typeof document === "undefined") return;
  for (const src of PRELOAD_STILLS) {
    const img = new Image();
    img.src = src;
  }
  for (const src of PRELOAD_VIDEOS) {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.src = src;
  }
}
