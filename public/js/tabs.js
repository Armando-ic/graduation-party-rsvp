import { initRsvp } from "./rsvp.js";
import { initUpload } from "./upload.js";
import { initGallery } from "./gallery.js";
import { initMemories } from "./memories.js";
import { initSecrets, isUnlocked } from "./secrets.js";

let sections = document.querySelectorAll(".tab-content");
const initialized = { rsvp: false, upload: false, gallery: false, memories: false };
const validTabs = ["rsvp", "upload", "gallery", "memories"];

function activateTab(tabId) {
  const tabs = document.querySelectorAll(".tab-btn");
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

  history.replaceState(null, "", `#${tabId}`);
}

function revealMemoriesTab() {
  const memoriesBtn = document.getElementById("memories-tab-btn");
  const memoriesContent = document.getElementById("tab-memories");

  if (memoriesBtn) {
    memoriesBtn.classList.remove("hidden");
    memoriesContent.classList.remove("hidden");
  }
}

// Shared lightbox close handlers (used by gallery and memories)
const lightbox = document.getElementById("lightbox");
const lightboxClose = document.getElementById("lightbox-close");
if (lightbox && lightboxClose) {
  lightboxClose.addEventListener("click", () => lightbox.classList.add("hidden"));
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) lightbox.classList.add("hidden");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") lightbox.classList.add("hidden");
  });
}

// Single delegated click handler for all tab buttons (including dynamically revealed ones)
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
