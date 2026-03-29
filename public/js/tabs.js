import { initRsvp } from "./rsvp.js";
import { initUpload } from "./upload.js";
import { initGallery } from "./gallery.js";
import { initMemories } from "./memories.js";
import { initSecrets, isUnlocked, launchConfetti } from "./secrets.js";

let tabs = document.querySelectorAll(".tab-btn");
let sections = document.querySelectorAll(".tab-content");
const initialized = { rsvp: false, upload: false, gallery: false, memories: false };
const validTabs = ["rsvp", "upload", "gallery", "memories"];

function activateTab(tabId) {
  // Re-query in case memories tab was added dynamically
  tabs = document.querySelectorAll(".tab-btn");
  sections = document.querySelectorAll(".tab-content");

  tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === tabId));
  sections.forEach((s) => s.classList.toggle("active", s.id === `tab-${tabId}`));

  if (tabId === "rsvp" && !initialized.rsvp) {
    initialized.rsvp = true;
    initRsvp();
  } else if (tabId === "upload" && !initialized.upload) {
    initialized.upload = true;
    initUpload();
  } else if (tabId === "gallery" && !initialized.gallery) {
    initialized.gallery = true;
    initGallery();
  } else if (tabId === "memories" && !initialized.memories) {
    initialized.memories = true;
    initMemories();
  }

  // Brief confetti replay when switching to memories (after first time)
  if (tabId === "memories" && initialized.memories) {
    // Only replay if not the initial unlock (that already plays confetti)
  }

  history.replaceState(null, "", `#${tabId}`);
}

function revealMemoriesTab() {
  const tabBar = document.querySelector(".tab-bar");
  const memoriesBtn = document.getElementById("memories-tab-btn");
  const memoriesContent = document.getElementById("tab-memories");

  if (memoriesBtn) {
    memoriesBtn.classList.remove("hidden");
    memoriesContent.classList.remove("hidden");
  }
}

// Tab click handlers
tabs.forEach((tab) => {
  tab.addEventListener("click", () => activateTab(tab.dataset.tab));
});

// Also handle clicks on dynamically revealed memories tab
document.querySelector(".tab-bar").addEventListener("click", (e) => {
  const btn = e.target.closest(".tab-btn");
  if (btn && btn.dataset.tab) activateTab(btn.dataset.tab);
});

// Initialize secrets system
initSecrets((withConfetti) => {
  revealMemoriesTab();
  if (withConfetti) {
    setTimeout(() => activateTab("memories"), 500);
  }
});

// Read initial hash or default to rsvp
const hash = window.location.hash.replace("#", "") || "rsvp";
if (hash === "memories" && isUnlocked()) {
  revealMemoriesTab();
  activateTab("memories");
} else {
  activateTab(validTabs.includes(hash) ? hash : "rsvp");
}

// Handle browser back/forward
window.addEventListener("hashchange", () => {
  const h = window.location.hash.replace("#", "");
  if (h === "memories" && !isUnlocked()) return;
  if (validTabs.includes(h)) activateTab(h);
});
