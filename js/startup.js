// A plain landing URL always starts at the hero. Explicit section links still work.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

function resetLandingStart() {
  if (!location.hash || location.hash === "#top") {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }
}

document.addEventListener("DOMContentLoaded", resetLandingStart, { once: true });
window.addEventListener("pageshow", resetLandingStart);
