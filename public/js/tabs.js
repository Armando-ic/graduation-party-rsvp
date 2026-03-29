import { initRsvp } from "./rsvp.js";
import { initUpload } from "./upload.js";
import { initGallery } from "./gallery.js";

const tabs = document.querySelectorAll(".tab-btn");
const sections = document.querySelectorAll(".tab-content");
const initialized = { rsvp: false, upload: false, gallery: false };

function activateTab(tabId) {
  // Update tab buttons
  tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === tabId));

  // Update tab content sections
  sections.forEach((s) => s.classList.toggle("active", s.id === `tab-${tabId}`));

  // Lazy-init JS modules on first activation
  if (tabId === "rsvp" && !initialized.rsvp) {
    initialized.rsvp = true;
    initRsvp();
  } else if (tabId === "upload" && !initialized.upload) {
    initialized.upload = true;
    initUpload();
  } else if (tabId === "gallery" && !initialized.gallery) {
    initialized.gallery = true;
    initGallery();
  }

  // Update URL hash without scrolling
  history.replaceState(null, "", `#${tabId}`);
}

// Tab click handlers
tabs.forEach((tab) => {
  tab.addEventListener("click", () => activateTab(tab.dataset.tab));
});

// Read initial hash or default to rsvp
const hash = window.location.hash.replace("#", "") || "rsvp";
const validTabs = ["rsvp", "upload", "gallery"];
activateTab(validTabs.includes(hash) ? hash : "rsvp");

// Handle browser back/forward
window.addEventListener("hashchange", () => {
  const h = window.location.hash.replace("#", "");
  if (validTabs.includes(h)) activateTab(h);
});
