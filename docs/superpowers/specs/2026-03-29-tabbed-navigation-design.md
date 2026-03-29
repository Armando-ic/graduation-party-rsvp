# Tabbed Navigation — Design Spec

**Date:** 2026-03-29

## Overview

Merge the three public guest-facing pages (RSVP, Photo Upload, Photo Gallery) into a single `index.html` with a tab navigation bar. Each tab shows the full page content for that section. The admin dashboard remains a separate page.

## Tab Bar

- Sticky at the top of the page (always visible on scroll)
- GMU green (#006633) background
- Three tabs: **RSVP** | **Upload Photos** | **Gallery**
- Active tab has a gold (#FFCC33) underline/indicator
- Inactive tabs are white text, active tab is gold text
- Mobile-friendly — tabs should fit on small screens (short labels, equal width)

## Tab Content

Each tab contains the **complete page content** from its current standalone page — hero banner, main content, and footer. Clicking a tab swaps the entire visible content below the tab bar.

### RSVP Tab (default)
- Full current `index.html` content: hero ("You're Invited"), event details bar, RSVP form, success message, footer
- Default active tab when page loads (unless URL hash says otherwise)

### Upload Photos Tab
- Full current `upload.html` content: hero ("Share Your Photos!"), upload form with name field, file picker, thumbnails, progress, success state, footer

### Gallery Tab
- Full current `gallery.html` content: hero ("Photo Gallery"), filter chips, photo grid, lightbox, download button, footer

## URL Hash Navigation

- `index.html` or `index.html#rsvp` → RSVP tab
- `index.html#upload` → Upload Photos tab
- `index.html#gallery` → Gallery tab
- Hash changes update the active tab without page reload
- Browser back/forward buttons work with tab changes

## Redirects for Old URLs

The old standalone pages become simple redirects so existing links and the QR code keep working:

- `upload.html` → redirects to `index.html#upload`
- `gallery.html` → redirects to `index.html#gallery`

These are simple HTML files with a `<meta http-equiv="refresh">` and a JS `window.location.replace` fallback.

## JavaScript

- Tab switching logic lives in a new `public/js/tabs.js` module
- `tabs.js` handles: tab click events, hash changes, showing/hiding tab content sections, initializing JS modules for each tab on first activation (lazy init)
- `rsvp.js`, `upload.js`, and `gallery.js` remain as separate modules but are imported and initialized by `tabs.js` when their tab becomes active for the first time
- This prevents upload.js and gallery.js from running Firestore listeners until the user actually visits those tabs

## CSS

- New tab bar styles added to `style.css`
- Tab content sections use `.tab-content` class, hidden by default, `.tab-content.active` is visible
- Tab bar is `position: sticky; top: 0; z-index: 100` so it stays visible on scroll

## Files Changed

- **Modify:** `public/index.html` — merge all three pages into tabbed layout
- **Modify:** `public/css/style.css` — add tab bar styles
- **Create:** `public/js/tabs.js` — tab switching + hash navigation + lazy module init
- **Modify:** `public/js/rsvp.js` — export an init function instead of running on load
- **Modify:** `public/js/upload.js` — export an init function instead of running on load
- **Modify:** `public/js/gallery.js` — export an init function instead of running on load
- **Replace:** `public/upload.html` — simple redirect to `index.html#upload`
- **Replace:** `public/gallery.html` — simple redirect to `index.html#gallery`

## Admin Page

`admin.html` is unchanged — it remains a separate standalone page.

## Non-Goals

- No animation/transition between tabs (simple show/hide)
- No preloading of inactive tab content (lazy init only)
- No changes to Firestore, Storage, or security rules
