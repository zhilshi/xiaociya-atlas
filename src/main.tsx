import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { unlockCues } from "./lib/sound";
import { unlockAudio } from "./lib/speak";
import "./styles/app.css";

// Phones only allow audio after a user gesture: unlock on the very first touch.
const unlock = () => {
  unlockAudio();
  unlockCues();
  window.removeEventListener("pointerdown", unlock, true);
};
window.addEventListener("pointerdown", unlock, true);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => null);
  });
}
