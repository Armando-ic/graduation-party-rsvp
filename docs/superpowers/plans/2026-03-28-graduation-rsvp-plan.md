# Graduation Party RSVP & Photo Sharing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a serverless graduation party RSVP and photo sharing app using vanilla JS + Firebase, deployed to Firebase Hosting with a public GitHub repo.

**Architecture:** Four static HTML pages (RSVP form, photo upload, photo gallery, admin dashboard) served from Firebase Hosting. Firestore stores RSVP responses and photo metadata. Cloud Storage holds uploaded photos. Firebase Auth protects the admin page. No build step, no framework.

**Tech Stack:** HTML/CSS/JS, Firebase (Firestore, Cloud Storage, Hosting, Auth), Firebase JS SDK v10+ (CDN), qrcode.js (CDN)

**Spec:** `docs/superpowers/specs/2026-03-28-graduation-rsvp-design.md`

---

## File Structure

```
public/
  index.html            # RSVP page — guest-facing form
  upload.html           # Photo upload page — QR code destination
  gallery.html          # Photo gallery — browsable grid of event photos
  admin.html            # Admin dashboard — stats, table, export, QR gen
  css/
    style.css           # Shared GMU-themed styles, responsive layout
  js/
    firebase-config.js  # Firebase app init + exported references (db, storage, auth)
    rsvp.js             # RSVP form: validation, stepper, submit to Firestore
    upload.js           # Photo upload: compression, Cloud Storage upload, metadata write
    gallery.js          # Gallery: load photos, filter by uploader, lightbox
    admin.js            # Dashboard: real-time stats, table, filters, CSV export, QR code
    auth.js             # Admin sign-in/sign-out, auth state listener, redirect
firebase.json           # Firebase Hosting config
firestore.rules         # Firestore security rules
storage.rules           # Cloud Storage security rules
.firebaserc             # Firebase project alias
.gitignore              # Ignore node_modules, .firebase, .env
```

---

## Task 1: Project Scaffolding & GitHub Repo

**Files:**
- Create: `.gitignore`
- Create: `firebase.json`
- Create: `.firebaserc`
- Create: `public/css/style.css` (empty placeholder)
- Create: `public/js/firebase-config.js` (empty placeholder)

- [ ] **Step 1: Create `.gitignore`**

```gitignore
node_modules/
.firebase/
.env
*.log
.superpowers/
```

- [ ] **Step 2: Create directory structure**

Run:
```bash
mkdir -p public/css public/js
```

- [ ] **Step 3: Create `firebase.json`**

```json
{
  "hosting": {
    "public": "public",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|webp)",
        "headers": [
          { "key": "Cache-Control", "value": "max-age=31536000" }
        ]
      }
    ]
  }
}
```

- [ ] **Step 4: Create `.firebaserc`**

The user will replace `YOUR_PROJECT_ID` with their actual Firebase project ID.

```json
{
  "projects": {
    "default": "YOUR_PROJECT_ID"
  }
}
```

- [ ] **Step 5: Create empty placeholder files**

Create `public/css/style.css` with a comment:
```css
/* GMU Graduation Party — Shared Styles */
```

Create `public/js/firebase-config.js` with a comment:
```js
// Firebase configuration — populated in Task 2
```

- [ ] **Step 6: Create public GitHub repo and push**

Run:
```bash
gh repo create graduation-party-rsvp --public --source=. --remote=origin --description "Graduation Party RSVP & Photo Sharing — George Mason University Class of 2026"
git add -A
git commit -m "chore: scaffold project structure and Firebase config"
git push -u origin master
```

Expected: Repo created at `https://github.com/<username>/graduation-party-rsvp`, initial commit pushed.

---

## Task 2: Firebase Config & Shared CSS Theme

**Files:**
- Create: `public/js/firebase-config.js`
- Create: `public/css/style.css`

- [ ] **Step 1: Write `public/js/firebase-config.js`**

This module initializes Firebase and exports references used by all pages. The user must paste their own Firebase config values (from the Firebase Console → Project Settings → Web App).

```js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "PASTE_YOUR_AUTH_DOMAIN",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_STORAGE_BUCKET",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
```

- [ ] **Step 2: Write `public/css/style.css`**

Complete shared stylesheet with GMU theme, responsive layout, and all component styles used across all 4 pages.

```css
/* === Reset & Base === */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #333;
  background: #f5f5f5;
  min-height: 100vh;
}
a { color: #006633; text-decoration: none; }

/* === GMU Colors === */
:root {
  --gmu-green: #006633;
  --gmu-green-dark: #004d26;
  --gmu-gold: #FFCC33;
  --gmu-gold-dark: #f0b800;
  --white: #ffffff;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --red: #e74c3c;
}

/* === Hero Banner === */
.hero {
  background: linear-gradient(135deg, var(--gmu-green) 0%, var(--gmu-green-dark) 100%);
  padding: 48px 24px;
  text-align: center;
  color: var(--white);
  position: relative;
  overflow: hidden;
}
.hero::before, .hero::after {
  content: '';
  position: absolute;
  background: var(--gmu-gold);
  border-radius: 50%;
  opacity: 0.12;
}
.hero::before { width: 120px; height: 120px; top: -20px; right: -20px; }
.hero::after { width: 160px; height: 160px; bottom: -30px; left: -30px; }
.hero .tag {
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: var(--gmu-gold);
  margin-bottom: 8px;
}
.hero h1 { font-size: 32px; font-weight: 700; }
.hero .divider {
  width: 60px; height: 3px;
  background: var(--gmu-gold);
  margin: 16px auto;
}
.hero .subtitle {
  font-size: 16px;
  opacity: 0.9;
}

/* === Event Details Bar === */
.event-details {
  padding: 24px;
  text-align: center;
  border-bottom: 1px solid var(--gray-200);
  background: var(--white);
  display: flex;
  justify-content: center;
  gap: 40px;
  flex-wrap: wrap;
}
.event-details .detail-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--gmu-green);
  margin-bottom: 4px;
}
.event-details .detail-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--gray-800);
}

/* === Form Elements === */
.form-container {
  max-width: 480px;
  margin: 0 auto;
  padding: 32px 24px;
}
.form-group { margin-bottom: 20px; }
.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--gray-600);
  margin-bottom: 6px;
}
.form-input {
  width: 100%;
  border: 2px solid var(--gray-200);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 16px;
  color: var(--gray-800);
  transition: border-color 0.2s;
  font-family: inherit;
}
.form-input:focus {
  outline: none;
  border-color: var(--gmu-green);
}
textarea.form-input { resize: vertical; min-height: 60px; }

/* === Response Buttons === */
.response-buttons { display: flex; gap: 10px; }
.response-btn {
  flex: 1;
  padding: 14px;
  border-radius: 8px;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  border: 2px solid var(--gray-200);
  background: var(--gray-50);
  color: var(--gray-500);
  transition: all 0.2s;
}
.response-btn:hover { border-color: var(--gmu-green); }
.response-btn.active-coming { background: var(--gmu-green); color: var(--white); border-color: var(--gmu-green); }
.response-btn.active-maybe { background: var(--gmu-gold); color: var(--gray-800); border-color: var(--gmu-gold); }
.response-btn.active-not-coming { background: var(--red); color: var(--white); border-color: var(--red); }

/* === Plus-One Stepper === */
.stepper { display: flex; align-items: center; gap: 16px; margin-bottom: 12px; }
.stepper-btn {
  width: 36px; height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s;
}
.stepper-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.stepper-btn.minus { background: var(--gray-100); color: var(--gray-600); }
.stepper-btn.plus { background: var(--gmu-green); color: var(--white); }
.stepper-count { font-size: 20px; font-weight: 600; min-width: 24px; text-align: center; }

.plus-one-names {
  background: var(--gray-50);
  border-radius: 8px;
  padding: 14px;
  border: 1px solid var(--gray-200);
}
.plus-one-names .section-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--gmu-green);
  font-weight: 600;
  margin-bottom: 10px;
}
.plus-one-names .form-input { margin-bottom: 8px; }
.plus-one-names .form-input:last-child { margin-bottom: 0; }

/* === Submit Button === */
.btn-submit {
  width: 100%;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  font-weight: 700;
  font-size: 16px;
  color: var(--gray-800);
  background: linear-gradient(135deg, var(--gmu-gold), var(--gmu-gold-dark));
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
  font-family: inherit;
}
.btn-submit:hover { opacity: 0.9; }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

/* === Spinner === */
.spinner {
  display: inline-block;
  width: 18px; height: 18px;
  border: 3px solid var(--gray-400);
  border-top-color: var(--gmu-green);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  vertical-align: middle;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* === Success Message === */
.success-message {
  text-align: center;
  padding: 48px 24px;
}
.success-message h2 { color: var(--gmu-green); margin-bottom: 8px; }
.success-message p { color: var(--gray-500); }

/* === Upload Area === */
.upload-area {
  border: 3px dashed var(--gmu-green);
  border-radius: 12px;
  padding: 32px 20px;
  text-align: center;
  background: #f0faf4;
  cursor: pointer;
  transition: background 0.2s;
}
.upload-area:hover { background: #e0f5ea; }
.upload-area .icon { font-size: 36px; margin-bottom: 8px; }
.upload-area .label { font-size: 15px; font-weight: 600; color: var(--gmu-green); }
.upload-area .hint { font-size: 12px; color: var(--gray-400); margin-top: 4px; }

/* === Thumbnail Previews === */
.thumbnails { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.thumbnail {
  width: 72px; height: 72px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  background: var(--gray-100);
}
.thumbnail img { width: 100%; height: 100%; object-fit: cover; }
.thumbnail .remove {
  position: absolute; top: -4px; right: -4px;
  width: 20px; height: 20px;
  background: var(--red); border-radius: 50%;
  color: var(--white); font-size: 12px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; border: 2px solid var(--white);
}

/* === Upload Progress === */
.upload-progress {
  background: #f0faf4;
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--gmu-green);
  font-weight: 500;
}

/* === Photo Gallery Grid === */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
  padding: 16px;
}
.gallery-item {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
}
.gallery-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.2s; }
.gallery-item:hover img { transform: scale(1.05); }
.gallery-item .photo-info {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  padding: 8px;
  color: var(--white);
  font-size: 11px;
  opacity: 0;
  transition: opacity 0.2s;
}
.gallery-item:hover .photo-info { opacity: 1; }

/* === Filter Chips === */
.filter-chips { display: flex; gap: 8px; padding: 16px; flex-wrap: wrap; }
.chip {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  background: var(--gray-100);
  color: var(--gray-500);
  transition: all 0.2s;
  font-family: inherit;
}
.chip.active { background: var(--gmu-green); color: var(--white); font-weight: 600; }

/* === Lightbox === */
.lightbox {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.9);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
  cursor: pointer;
}
.lightbox img { max-width: 90%; max-height: 90%; object-fit: contain; border-radius: 4px; }
.lightbox .info {
  position: absolute; bottom: 24px;
  color: var(--white);
  text-align: center;
  font-size: 14px;
}
.lightbox .close {
  position: absolute; top: 16px; right: 16px;
  color: var(--white); font-size: 32px;
  cursor: pointer;
}
.lightbox.hidden { display: none; }

/* === Admin Nav === */
.admin-nav {
  background: var(--gmu-green);
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.admin-nav .brand { color: var(--gmu-gold); font-weight: 700; font-size: 16px; }
.admin-nav .user-info { display: flex; align-items: center; gap: 12px; }
.admin-nav .email { color: var(--white); font-size: 13px; opacity: 0.8; }
.btn-signout {
  padding: 6px 14px;
  background: rgba(255,255,255,0.15);
  border-radius: 6px;
  color: var(--white);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-family: inherit;
}

/* === Stat Cards === */
.stat-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
.stat-card {
  background: var(--white);
  border-radius: 10px;
  padding: 18px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.stat-card .stat-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--gray-400);
  margin-bottom: 6px;
}
.stat-card .stat-value { font-size: 32px; font-weight: 700; }
.stat-card .stat-sub { font-size: 11px; color: var(--gray-400); margin-top: 4px; }
.stat-value.green { color: var(--gmu-green); }
.stat-value.gold { color: var(--gmu-gold-dark); }
.stat-value.red { color: var(--red); }

/* === Headcount Banner === */
.headcount-banner {
  background: var(--gmu-green);
  border-radius: 10px;
  padding: 16px 20px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.headcount-banner .label { color: var(--gmu-gold); font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
.headcount-banner .sublabel { color: rgba(255,255,255,0.7); font-size: 13px; margin-top: 4px; }
.headcount-banner .count { font-size: 40px; font-weight: 700; color: var(--white); }

/* === Action Buttons === */
.action-buttons { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
.btn-action {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-family: inherit;
  transition: opacity 0.2s;
}
.btn-action:hover { opacity: 0.85; }
.btn-action.primary { background: var(--gmu-gold); color: var(--gray-800); }
.btn-action.secondary { background: var(--white); color: var(--gmu-green); border: 2px solid var(--gmu-green); }
.btn-action.ghost { background: var(--white); color: var(--gray-500); border: 2px solid var(--gray-200); }

/* === RSVP Table === */
.rsvp-table-container {
  background: var(--white);
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  overflow: hidden;
}
.table-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.table-header h3 { font-size: 15px; }
.rsvp-table { width: 100%; border-collapse: collapse; }
.rsvp-table thead th {
  padding: 10px 20px;
  background: var(--gray-50);
  border-bottom: 1px solid var(--gray-200);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--gray-400);
  font-weight: 600;
  text-align: left;
}
.rsvp-table tbody td {
  padding: 14px 20px;
  border-bottom: 1px solid var(--gray-100);
  font-size: 13px;
}
.rsvp-table tbody tr:last-child td { border-bottom: none; }

/* === Status Badges === */
.badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  display: inline-block;
}
.badge.coming { background: #e8f5e9; color: var(--gmu-green); }
.badge.maybe { background: #fff8e1; color: #f0a500; }
.badge.not-coming { background: #fce4ec; color: var(--red); }

/* === Delete Button === */
.btn-delete {
  color: var(--red);
  cursor: pointer;
  font-size: 12px;
  background: none;
  border: none;
  font-weight: 500;
  font-family: inherit;
}
.btn-delete:hover { text-decoration: underline; }

/* === Auth Form === */
.auth-container {
  max-width: 400px;
  margin: 80px auto;
  padding: 32px;
  background: var(--white);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
}
.auth-container h2 { color: var(--gmu-green); margin-bottom: 24px; }
.auth-error {
  background: #fce4ec;
  color: var(--red);
  padding: 10px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 16px;
  display: none;
}

/* === Footer === */
.footer {
  background: var(--gray-50);
  padding: 16px;
  text-align: center;
  font-size: 13px;
  color: var(--gray-400);
  border-top: 1px solid var(--gray-200);
}

/* === Live Indicator === */
.live-indicator {
  text-align: center;
  margin-top: 16px;
  font-size: 12px;
  color: var(--gray-400);
}
.live-dot {
  display: inline-block;
  width: 8px; height: 8px;
  background: var(--gmu-green);
  border-radius: 50%;
  margin-right: 6px;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* === QR Modal === */
.qr-modal {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.qr-modal.hidden { display: none; }
.qr-modal .qr-content {
  background: var(--white);
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  max-width: 360px;
}
.qr-modal .qr-content h3 { margin-bottom: 16px; color: var(--gmu-green); }
.qr-modal .qr-content canvas { margin: 16px auto; }
.qr-modal .qr-content p { font-size: 13px; color: var(--gray-500); margin-top: 12px; }

/* === Responsive === */
@media (max-width: 768px) {
  .hero { padding: 36px 20px; }
  .hero h1 { font-size: 24px; }
  .event-details { gap: 20px; }
  .stat-cards { grid-template-columns: repeat(2, 1fr); }
  .gallery-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
  .rsvp-table { font-size: 12px; }
  .rsvp-table thead th, .rsvp-table tbody td { padding: 10px 12px; }
  .headcount-banner { flex-direction: column; text-align: center; gap: 8px; }
  .headcount-banner .count { font-size: 32px; }
}
@media (max-width: 480px) {
  .response-buttons { flex-direction: column; }
  .stat-cards { grid-template-columns: 1fr 1fr; }
  .action-buttons { flex-direction: column; }
}

/* === Hidden utility === */
.hidden { display: none !important; }
```

- [ ] **Step 3: Verify files render**

Run:
```bash
cd public && python -m http.server 8000
```

Open `http://localhost:8000` in a browser. You should see an empty page (no HTML yet) with no console errors. Stop the server with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add public/css/style.css public/js/firebase-config.js
git commit -m "feat: add shared GMU theme CSS and Firebase config module"
```

---

## Task 3: RSVP Page — HTML Structure

**Files:**
- Create: `public/index.html`

- [ ] **Step 1: Write `public/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Graduation Celebration — RSVP</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>

  <!-- Hero -->
  <div class="hero">
    <p class="tag">You're Invited</p>
    <h1>Graduation Celebration!</h1>
    <div class="divider"></div>
    <p class="subtitle">George Mason University — Class of 2026</p>
  </div>

  <!-- Event Details -->
  <div class="event-details">
    <div>
      <p class="detail-label">Date</p>
      <p class="detail-value">May 14, 2026</p>
    </div>
    <div>
      <p class="detail-label">Time</p>
      <p class="detail-value">5:00 PM</p>
    </div>
    <div>
      <p class="detail-label">Location</p>
      <p class="detail-value">TBD</p>
    </div>
  </div>

  <!-- RSVP Form -->
  <div id="rsvp-form" class="form-container">
    <h2 style="text-align:center;margin-bottom:24px;">Will you be joining us?</h2>

    <div class="form-group">
      <label for="guest-name">Your Name *</label>
      <input type="text" id="guest-name" class="form-input" placeholder="Enter your full name" required>
    </div>

    <div class="form-group">
      <label>Your Response *</label>
      <div class="response-buttons">
        <button type="button" class="response-btn" data-status="coming">Coming!</button>
        <button type="button" class="response-btn" data-status="maybe">Maybe</button>
        <button type="button" class="response-btn" data-status="not_coming">Can't Make It</button>
      </div>
    </div>

    <div class="form-group">
      <label>Bringing anyone?</label>
      <div class="stepper">
        <button type="button" class="stepper-btn minus" id="stepper-minus" disabled>−</button>
        <span class="stepper-count" id="stepper-count">0</span>
        <button type="button" class="stepper-btn plus" id="stepper-plus">+</button>
      </div>
      <div id="plus-one-names" class="plus-one-names hidden">
        <p class="section-label">Guest Names</p>
        <div id="plus-one-fields"></div>
      </div>
    </div>

    <div class="form-group">
      <label for="guest-message">Leave a message (optional)</label>
      <textarea id="guest-message" class="form-input" placeholder="Congrats, well wishes, etc."></textarea>
    </div>

    <button type="button" id="submit-rsvp" class="btn-submit" disabled>Submit RSVP</button>
  </div>

  <!-- Success Message -->
  <div id="rsvp-success" class="success-message hidden">
    <h2 id="success-heading">Thank you!</h2>
    <p id="success-text"></p>
  </div>

  <!-- Footer -->
  <div class="footer">George Mason University — Class of 2026</div>

  <script type="module" src="js/rsvp.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verify in browser**

Run:
```bash
cd public && python -m http.server 8000
```

Open `http://localhost:8000`. You should see:
- Green hero banner with gold accents
- Event details row
- RSVP form with name input, three response buttons, plus-one stepper, message textarea, and a disabled Submit button
- Footer

Stop the server.

- [ ] **Step 3: Commit**

```bash
git add public/index.html
git commit -m "feat: add RSVP page HTML structure"
```

---

## Task 4: RSVP Page — JavaScript Logic

**Files:**
- Create: `public/js/rsvp.js`

- [ ] **Step 1: Write `public/js/rsvp.js`**

```js
import { db } from "./firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// --- State ---
let selectedStatus = null;
let plusOneCount = 0;
const MAX_PLUS_ONES = 10;

// --- DOM refs ---
const form = document.getElementById("rsvp-form");
const successDiv = document.getElementById("rsvp-success");
const nameInput = document.getElementById("guest-name");
const messageInput = document.getElementById("guest-message");
const submitBtn = document.getElementById("submit-rsvp");
const responseButtons = document.querySelectorAll(".response-btn");
const stepperMinus = document.getElementById("stepper-minus");
const stepperPlus = document.getElementById("stepper-plus");
const stepperCount = document.getElementById("stepper-count");
const plusOneNamesDiv = document.getElementById("plus-one-names");
const plusOneFields = document.getElementById("plus-one-fields");

// --- Response Button Selection ---
responseButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    responseButtons.forEach((b) => {
      b.classList.remove("active-coming", "active-maybe", "active-not-coming");
    });
    selectedStatus = btn.dataset.status;
    const classMap = { coming: "active-coming", maybe: "active-maybe", not_coming: "active-not-coming" };
    btn.classList.add(classMap[selectedStatus]);
    updateSubmitState();
  });
});

// --- Plus-One Stepper ---
function renderPlusOneFields() {
  plusOneFields.textContent = "";
  for (let i = 0; i < plusOneCount; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.className = "form-input";
    input.placeholder = `Guest ${i + 1} name`;
    input.required = true;
    input.dataset.index = i;
    plusOneFields.appendChild(input);
  }
  plusOneNamesDiv.classList.toggle("hidden", plusOneCount === 0);
  stepperMinus.disabled = plusOneCount === 0;
  stepperPlus.disabled = plusOneCount >= MAX_PLUS_ONES;
  stepperCount.textContent = plusOneCount;
}

stepperPlus.addEventListener("click", () => {
  if (plusOneCount < MAX_PLUS_ONES) {
    plusOneCount++;
    renderPlusOneFields();
  }
});

stepperMinus.addEventListener("click", () => {
  if (plusOneCount > 0) {
    plusOneCount--;
    renderPlusOneFields();
  }
});

// --- Form Validation ---
function updateSubmitState() {
  const nameValid = nameInput.value.trim().length > 0;
  const statusValid = selectedStatus !== null;
  submitBtn.disabled = !(nameValid && statusValid);
}

nameInput.addEventListener("input", updateSubmitState);

// --- Submit ---
submitBtn.addEventListener("click", async () => {
  if (submitBtn.disabled) return;

  // Collect plus-one names
  const plusOneInputs = plusOneFields.querySelectorAll("input");
  const plusOnes = [];
  for (const input of plusOneInputs) {
    const name = input.value.trim();
    if (!name) {
      input.focus();
      input.style.borderColor = "var(--red)";
      return; // Block submit if a plus-one name is empty
    }
    plusOnes.push(name);
  }

  // Disable button, show spinner
  submitBtn.disabled = true;
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "";
  const spinner = document.createElement("span");
  spinner.className = "spinner";
  submitBtn.appendChild(spinner);
  submitBtn.appendChild(document.createTextNode(" Submitting..."));

  try {
    await addDoc(collection(db, "rsvps"), {
      name: nameInput.value.trim(),
      status: selectedStatus,
      plusOnes: plusOnes,
      message: messageInput.value.trim(),
      createdAt: serverTimestamp(),
    });

    // Show success
    form.classList.add("hidden");
    successDiv.classList.remove("hidden");

    const successHeading = document.getElementById("success-heading");
    const successText = document.getElementById("success-text");
    const guestName = nameInput.value.trim();

    if (selectedStatus === "coming") {
      successHeading.textContent = `Thank you, ${guestName}!`;
      successText.textContent = "We can't wait to see you there!";
    } else if (selectedStatus === "maybe") {
      successHeading.textContent = `Thanks, ${guestName}!`;
      successText.textContent = "We hope you can make it! We'll save a spot for you.";
    } else {
      successHeading.textContent = `We'll miss you, ${guestName}!`;
      successText.textContent = "Thanks for letting us know. We appreciate it!";
    }
  } catch (err) {
    console.error("RSVP submit error:", err);
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
    alert("Something went wrong. Please try again.");
  }
});
```

- [ ] **Step 2: Verify in browser with Firebase emulator or live project**

Open `http://localhost:8000`. Test the following:
1. Submit button is disabled initially
2. Type a name → still disabled (no response selected)
3. Click "Coming!" → button turns green, Submit enables
4. Click + twice → two name fields appear
5. Leave a plus-one field empty and click Submit → field highlights red, submit blocked
6. Fill in all fields and click Submit → spinner shows, data writes to Firestore, success message appears

Expected Firestore document:
```json
{
  "name": "Test User",
  "status": "coming",
  "plusOnes": ["Guest One", "Guest Two"],
  "message": "Congrats!",
  "createdAt": "<server timestamp>"
}
```

- [ ] **Step 3: Commit**

```bash
git add public/js/rsvp.js
git commit -m "feat: add RSVP form logic with validation and Firestore submit"
```

---

## Task 5: Firestore & Storage Security Rules

**Files:**
- Create: `firestore.rules`
- Create: `storage.rules`

- [ ] **Step 1: Write `firestore.rules`**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /rsvps/{rsvpId} {
      allow create: if true;
      allow read, delete: if request.auth != null;
      allow update: if false;
    }

    match /photos/{photoId} {
      allow create: if true;
      allow read: if true;
      allow delete: if request.auth != null;
      allow update: if false;
    }
  }
}
```

- [ ] **Step 2: Write `storage.rules`**

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{photoId} {
      allow write: if request.resource.size < 10 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
      allow read: if true;
      allow delete: if request.auth != null;
    }
  }
}
```

- [ ] **Step 3: Update `firebase.json` to include rules**

Edit `firebase.json` to add the Firestore and Storage rule references:

```json
{
  "hosting": {
    "public": "public",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|webp)",
        "headers": [
          { "key": "Cache-Control", "value": "max-age=31536000" }
        ]
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules"
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

- [ ] **Step 4: Deploy rules**

Run:
```bash
firebase deploy --only firestore:rules,storage
```

Expected: "Deploy complete!" with rules deployed to the Firebase project.

- [ ] **Step 5: Commit**

```bash
git add firestore.rules storage.rules firebase.json
git commit -m "feat: add Firestore and Cloud Storage security rules"
```

---

## Task 6: Photo Upload Page — HTML Structure

**Files:**
- Create: `public/upload.html`

- [ ] **Step 1: Write `public/upload.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Share Your Photos — Graduation Celebration</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>

  <!-- Hero -->
  <div class="hero">
    <p class="tag">Graduation Party 2026</p>
    <h1>Share Your Photos!</h1>
    <div class="divider"></div>
    <p class="subtitle">Upload pics from the celebration</p>
  </div>

  <!-- Upload Form -->
  <div id="upload-form" class="form-container">

    <div class="form-group">
      <label for="uploader-name">Your Name (optional)</label>
      <input type="text" id="uploader-name" class="form-input" placeholder="So we know who took these!">
    </div>

    <div class="form-group">
      <div class="upload-area" id="upload-area">
        <div class="icon">📸</div>
        <p class="label">Tap to choose photos</p>
        <p class="hint">or take a new one with your camera</p>
      </div>
      <input type="file" id="file-input" accept="image/*" capture="environment" multiple hidden>
    </div>

    <div id="thumbnails-container" class="form-group hidden">
      <label id="photo-count-label">Selected (0 photos)</label>
      <div id="thumbnails" class="thumbnails"></div>
    </div>

    <button type="button" id="upload-btn" class="btn-submit" disabled>Select photos to upload</button>

    <div id="upload-progress" class="upload-progress hidden">
      <span class="spinner"></span>
      <span id="progress-text">Uploading...</span>
    </div>
  </div>

  <!-- Success -->
  <div id="upload-success" class="success-message hidden">
    <h2>Uploaded!</h2>
    <p>Your photos have been added to the gallery.</p>
    <button type="button" id="upload-more-btn" class="btn-submit" style="max-width:300px;margin:24px auto 0;">Add More Photos</button>
  </div>

  <!-- Footer -->
  <div class="footer">George Mason University — Class of 2026</div>

  <script type="module" src="js/upload.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verify in browser**

Open `http://localhost:8000/upload.html`. You should see:
- Green hero with "Share Your Photos!"
- Name input field
- Large dashed upload tap target
- Disabled upload button
- Footer

- [ ] **Step 3: Commit**

```bash
git add public/upload.html
git commit -m "feat: add photo upload page HTML structure"
```

---

## Task 7: Photo Upload Page — JavaScript Logic

**Files:**
- Create: `public/js/upload.js`

- [ ] **Step 1: Write `public/js/upload.js`**

```js
import { db, storage } from "./firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js";

// --- State ---
let selectedFiles = [];

// --- DOM refs ---
const uploadArea = document.getElementById("upload-area");
const fileInput = document.getElementById("file-input");
const thumbnailsContainer = document.getElementById("thumbnails-container");
const thumbnailsDiv = document.getElementById("thumbnails");
const photoCountLabel = document.getElementById("photo-count-label");
const uploadBtn = document.getElementById("upload-btn");
const uploadProgress = document.getElementById("upload-progress");
const progressText = document.getElementById("progress-text");
const uploadForm = document.getElementById("upload-form");
const uploadSuccess = document.getElementById("upload-success");
const uploadMoreBtn = document.getElementById("upload-more-btn");
const uploaderNameInput = document.getElementById("uploader-name");

// --- File Selection ---
uploadArea.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (e) => {
  const newFiles = Array.from(e.target.files);
  selectedFiles = selectedFiles.concat(newFiles);
  renderThumbnails();
  fileInput.value = ""; // Reset so same file can be re-selected
});

function renderThumbnails() {
  thumbnailsDiv.textContent = "";

  selectedFiles.forEach((file, index) => {
    const thumb = document.createElement("div");
    thumb.className = "thumbnail";

    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.alt = file.name;
    thumb.appendChild(img);

    const removeBtn = document.createElement("div");
    removeBtn.className = "remove";
    removeBtn.textContent = "\u00d7";
    removeBtn.addEventListener("click", () => {
      selectedFiles.splice(index, 1);
      renderThumbnails();
    });
    thumb.appendChild(removeBtn);

    thumbnailsDiv.appendChild(thumb);
  });

  const count = selectedFiles.length;
  thumbnailsContainer.classList.toggle("hidden", count === 0);
  photoCountLabel.textContent = `Selected (${count} photo${count !== 1 ? "s" : ""})`;
  uploadBtn.disabled = count === 0;
  uploadBtn.textContent = count > 0 ? `Upload ${count} Photo${count !== 1 ? "s" : ""}` : "Select photos to upload";
}

// --- Image Compression ---
function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX_WIDTH = 1600;
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => resolve(blob),
        "image/jpeg",
        0.8
      );
    };
    img.src = URL.createObjectURL(file);
  });
}

// --- Upload ---
uploadBtn.addEventListener("click", async () => {
  if (selectedFiles.length === 0) return;

  uploadBtn.disabled = true;
  uploadBtn.classList.add("hidden");
  uploadProgress.classList.remove("hidden");

  const uploaderName = uploaderNameInput.value.trim() || "Anonymous";
  const total = selectedFiles.length;

  try {
    for (let i = 0; i < total; i++) {
      progressText.textContent = `Uploading... ${i + 1} of ${total}`;

      const compressed = await compressImage(selectedFiles[i]);
      const fileId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const storagePath = `photos/${fileId}.jpg`;
      const storageRef = ref(storage, storagePath);

      const snapshot = await uploadBytes(storageRef, compressed, {
        contentType: "image/jpeg",
      });
      const downloadURL = await getDownloadURL(snapshot.ref);

      await addDoc(collection(db, "photos"), {
        uploaderName: uploaderName,
        storagePath: storagePath,
        downloadURL: downloadURL,
        uploadedAt: serverTimestamp(),
      });
    }

    // Show success
    uploadForm.classList.add("hidden");
    uploadSuccess.classList.remove("hidden");
  } catch (err) {
    console.error("Upload error:", err);
    uploadProgress.classList.add("hidden");
    uploadBtn.classList.remove("hidden");
    uploadBtn.disabled = false;
    alert("Upload failed. Please try again.");
  }
});

// --- Upload More ---
uploadMoreBtn.addEventListener("click", () => {
  selectedFiles = [];
  renderThumbnails();
  uploadProgress.classList.add("hidden");
  uploadBtn.classList.remove("hidden");
  uploadForm.classList.remove("hidden");
  uploadSuccess.classList.add("hidden");
});
```

- [ ] **Step 2: Verify in browser**

Open `http://localhost:8000/upload.html`. Test:
1. Tap the upload area → file picker or camera opens
2. Select 1-3 images → thumbnails appear with × buttons
3. Click × on a thumbnail → it's removed
4. Click "Upload N Photos" → progress shows "Uploading... 1 of N"
5. On completion → success message with "Add More Photos" button
6. Check Cloud Storage → images appear in `photos/` folder
7. Check Firestore → documents appear in `photos` collection with correct metadata

- [ ] **Step 3: Commit**

```bash
git add public/js/upload.js
git commit -m "feat: add photo upload logic with compression and Cloud Storage"
```

---

## Task 8: Photo Gallery Page

**Files:**
- Create: `public/gallery.html`
- Create: `public/js/gallery.js`

- [ ] **Step 1: Write `public/gallery.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Photo Gallery — Graduation Celebration</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>

  <!-- Hero -->
  <div class="hero">
    <p class="tag">Graduation Party 2026</p>
    <h1>Photo Gallery</h1>
    <div class="divider"></div>
    <p class="subtitle" id="photo-total">Loading photos...</p>
  </div>

  <!-- Filters -->
  <div id="filter-chips" class="filter-chips"></div>

  <!-- Gallery Grid -->
  <div id="gallery-grid" class="gallery-grid"></div>

  <!-- Empty state -->
  <div id="empty-state" class="success-message hidden">
    <h2>No photos yet</h2>
    <p>Photos uploaded at the event will appear here!</p>
  </div>

  <!-- Lightbox -->
  <div id="lightbox" class="lightbox hidden">
    <span class="close" id="lightbox-close">&times;</span>
    <img id="lightbox-img" src="" alt="Full size photo">
    <div class="info" id="lightbox-info"></div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <button type="button" id="download-all-btn" class="btn-action primary" style="margin-bottom:12px;">Download All Photos</button>
    <p>George Mason University — Class of 2026</p>
  </div>

  <script type="module" src="js/gallery.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write `public/js/gallery.js`**

```js
import { db } from "./firebase-config.js";
import { collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// --- DOM refs ---
const galleryGrid = document.getElementById("gallery-grid");
const filterChips = document.getElementById("filter-chips");
const photoTotal = document.getElementById("photo-total");
const emptyState = document.getElementById("empty-state");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxInfo = document.getElementById("lightbox-info");
const lightboxClose = document.getElementById("lightbox-close");
const downloadAllBtn = document.getElementById("download-all-btn");

// --- State ---
let allPhotos = [];
let activeFilter = "all";

// --- Real-time listener ---
const photosQuery = query(collection(db, "photos"), orderBy("uploadedAt", "desc"));

onSnapshot(photosQuery, (snapshot) => {
  allPhotos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  renderFilters();
  renderGallery();
});

// --- Filters ---
function renderFilters() {
  const uploaders = {};
  allPhotos.forEach((p) => {
    const name = p.uploaderName || "Anonymous";
    uploaders[name] = (uploaders[name] || 0) + 1;
  });

  filterChips.textContent = "";

  const allChip = createChip(`All (${allPhotos.length})`, "all");
  filterChips.appendChild(allChip);

  Object.entries(uploaders)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => {
      filterChips.appendChild(createChip(`${name} (${count})`, name));
    });
}

function createChip(label, filterValue) {
  const chip = document.createElement("button");
  chip.className = `chip${activeFilter === filterValue ? " active" : ""}`;
  chip.textContent = label;
  chip.addEventListener("click", () => {
    activeFilter = filterValue;
    renderFilters();
    renderGallery();
  });
  return chip;
}

// --- Gallery ---
function renderGallery() {
  const filtered = activeFilter === "all"
    ? allPhotos
    : allPhotos.filter((p) => (p.uploaderName || "Anonymous") === activeFilter);

  photoTotal.textContent = `${filtered.length} photo${filtered.length !== 1 ? "s" : ""} from the celebration`;
  emptyState.classList.toggle("hidden", filtered.length > 0);
  galleryGrid.classList.toggle("hidden", filtered.length === 0);

  galleryGrid.textContent = "";
  filtered.forEach((photo) => {
    const item = document.createElement("div");
    item.className = "gallery-item";

    const img = document.createElement("img");
    img.src = photo.downloadURL;
    img.alt = `Photo by ${photo.uploaderName || "Anonymous"}`;
    img.loading = "lazy";
    item.appendChild(img);

    const info = document.createElement("div");
    info.className = "photo-info";
    const date = photo.uploadedAt ? photo.uploadedAt.toDate().toLocaleDateString() : "";
    info.textContent = `${photo.uploaderName || "Anonymous"} \u00b7 ${date}`;
    item.appendChild(info);

    item.addEventListener("click", () => openLightbox(photo));
    galleryGrid.appendChild(item);
  });
}

// --- Lightbox ---
function openLightbox(photo) {
  lightboxImg.src = photo.downloadURL;
  const date = photo.uploadedAt ? photo.uploadedAt.toDate().toLocaleString() : "";
  lightboxInfo.textContent = `Uploaded by ${photo.uploaderName || "Anonymous"} \u00b7 ${date}`;
  lightbox.classList.remove("hidden");
}

lightboxClose.addEventListener("click", () => lightbox.classList.add("hidden"));
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) lightbox.classList.add("hidden");
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") lightbox.classList.add("hidden");
});

// --- Download All ---
downloadAllBtn.addEventListener("click", () => {
  allPhotos.forEach((photo) => {
    const a = document.createElement("a");
    a.href = photo.downloadURL;
    a.download = photo.storagePath.split("/").pop();
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });
});
```

- [ ] **Step 3: Verify in browser**

Open `http://localhost:8000/gallery.html`. If photos have been uploaded:
- Photo count shows in hero subtitle
- Filter chips appear (All + per-uploader)
- Grid of photos renders with hover effect showing uploader name
- Click a photo → lightbox opens full size
- Press Escape or click outside → lightbox closes
- "Download All Photos" triggers downloads

If no photos uploaded yet, empty state message shows.

- [ ] **Step 4: Commit**

```bash
git add public/gallery.html public/js/gallery.js
git commit -m "feat: add photo gallery page with filters, lightbox, and download"
```

---

## Task 9: Admin Page — Authentication

**Files:**
- Create: `public/admin.html`
- Create: `public/js/auth.js`

- [ ] **Step 1: Write `public/js/auth.js`**

```js
import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// --- DOM refs ---
const authContainer = document.getElementById("auth-container");
const dashboardContainer = document.getElementById("dashboard-container");
const authError = document.getElementById("auth-error");
const emailInput = document.getElementById("auth-email");
const passwordInput = document.getElementById("auth-password");
const signInBtn = document.getElementById("sign-in-btn");
const signOutBtn = document.getElementById("sign-out-btn");
const adminEmail = document.getElementById("admin-email");

// --- Auth State ---
export function onReady(callback) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      authContainer.classList.add("hidden");
      dashboardContainer.classList.remove("hidden");
      adminEmail.textContent = user.email;
      callback(user);
    } else {
      authContainer.classList.remove("hidden");
      dashboardContainer.classList.add("hidden");
    }
  });
}

// --- Sign In ---
signInBtn.addEventListener("click", async () => {
  authError.style.display = "none";
  signInBtn.disabled = true;
  signInBtn.textContent = "";
  const spinner = document.createElement("span");
  spinner.className = "spinner";
  signInBtn.appendChild(spinner);

  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
  } catch (err) {
    authError.textContent = "Invalid email or password.";
    authError.style.display = "block";
    signInBtn.disabled = false;
    signInBtn.textContent = "Sign In";
  }
});

// --- Sign Out ---
signOutBtn.addEventListener("click", () => signOut(auth));

// --- Enter key submits ---
passwordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") signInBtn.click();
});
```

- [ ] **Step 2: Write `public/admin.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard — Graduation Party</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>

  <!-- Auth Screen -->
  <div id="auth-container">
    <div class="auth-container">
      <h2>Admin Sign In</h2>
      <div id="auth-error" class="auth-error"></div>
      <div class="form-group">
        <label for="auth-email">Email</label>
        <input type="email" id="auth-email" class="form-input" placeholder="admin@example.com">
      </div>
      <div class="form-group">
        <label for="auth-password">Password</label>
        <input type="password" id="auth-password" class="form-input" placeholder="Password">
      </div>
      <button type="button" id="sign-in-btn" class="btn-submit">Sign In</button>
    </div>
  </div>

  <!-- Dashboard (hidden until authenticated) -->
  <div id="dashboard-container" class="hidden">

    <!-- Admin Nav -->
    <div class="admin-nav">
      <span class="brand">Grad Party Admin</span>
      <div class="user-info">
        <span class="email" id="admin-email"></span>
        <button type="button" class="btn-signout" id="sign-out-btn">Sign Out</button>
      </div>
    </div>

    <div style="padding: 24px;">

      <!-- Stat Cards -->
      <div class="stat-cards">
        <div class="stat-card">
          <p class="stat-label">Total Responses</p>
          <p class="stat-value" id="stat-total">0</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Coming</p>
          <p class="stat-value green" id="stat-coming">0</p>
          <p class="stat-sub" id="stat-coming-guests"></p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Maybe</p>
          <p class="stat-value gold" id="stat-maybe">0</p>
          <p class="stat-sub" id="stat-maybe-guests"></p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Can't Make It</p>
          <p class="stat-value red" id="stat-declined">0</p>
        </div>
      </div>

      <!-- Headcount Banner -->
      <div class="headcount-banner">
        <div>
          <p class="label">Estimated Total Headcount</p>
          <p class="sublabel">Coming + their plus-ones</p>
        </div>
        <p class="count" id="headcount">0</p>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button type="button" class="btn-action primary" id="export-csv-btn">Export CSV</button>
        <button type="button" class="btn-action secondary" id="generate-qr-btn">Generate QR Code</button>
        <a href="gallery.html" class="btn-action ghost" target="_blank">View Photo Gallery</a>
      </div>

      <!-- QR Modal -->
      <div id="qr-modal" class="qr-modal hidden">
        <div class="qr-content">
          <h3>Photo Upload QR Code</h3>
          <div id="qr-code"></div>
          <p>Print this or display it at the party. Guests scan to upload photos.</p>
          <button type="button" class="btn-submit" style="margin-top:16px;" id="qr-close-btn">Close</button>
        </div>
      </div>

      <!-- Response Table -->
      <div class="rsvp-table-container">
        <div class="table-header">
          <h3>All Responses</h3>
          <div id="table-filters" class="filter-chips" style="padding:0;"></div>
        </div>
        <table class="rsvp-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Plus-Ones</th>
              <th>Message</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="rsvp-table-body"></tbody>
        </table>
      </div>

      <!-- Live indicator -->
      <div class="live-indicator">
        <span class="live-dot"></span>
        Live — updates automatically when new RSVPs come in
      </div>

    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js"></script>
  <script type="module" src="js/auth.js"></script>
  <script type="module" src="js/admin.js"></script>
</body>
</html>
```

- [ ] **Step 3: Verify auth flow**

Open `http://localhost:8000/admin.html`. You should see:
1. Sign-in form centered on page
2. Enter wrong credentials → error message appears
3. Enter correct credentials (create a test user in Firebase Console → Authentication → Add User first) → dashboard appears with nav bar showing email
4. Click Sign Out → back to sign-in form

- [ ] **Step 4: Commit**

```bash
git add public/admin.html public/js/auth.js
git commit -m "feat: add admin page with Firebase Auth sign-in/sign-out"
```

---

## Task 10: Admin Dashboard — Stats, Table & Filters

**Files:**
- Create: `public/js/admin.js`

- [ ] **Step 1: Write `public/js/admin.js`**

This file uses safe DOM methods (createElement, textContent) instead of innerHTML to prevent XSS when rendering user-supplied data (guest names, messages).

```js
import { db } from "./firebase-config.js";
import { onReady } from "./auth.js";
import {
  collection, query, orderBy, onSnapshot, doc, deleteDoc,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// --- DOM refs ---
const statTotal = document.getElementById("stat-total");
const statComing = document.getElementById("stat-coming");
const statComingGuests = document.getElementById("stat-coming-guests");
const statMaybe = document.getElementById("stat-maybe");
const statMaybeGuests = document.getElementById("stat-maybe-guests");
const statDeclined = document.getElementById("stat-declined");
const headcount = document.getElementById("headcount");
const tableBody = document.getElementById("rsvp-table-body");
const tableFilters = document.getElementById("table-filters");
const exportCsvBtn = document.getElementById("export-csv-btn");
const generateQrBtn = document.getElementById("generate-qr-btn");
const qrModal = document.getElementById("qr-modal");
const qrCode = document.getElementById("qr-code");
const qrCloseBtn = document.getElementById("qr-close-btn");

// --- State ---
let allRsvps = [];
let tableFilter = "all";

// --- Wait for auth, then start listeners ---
onReady(() => {
  const rsvpQuery = query(collection(db, "rsvps"), orderBy("createdAt", "desc"));

  onSnapshot(rsvpQuery, (snapshot) => {
    allRsvps = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderStats();
    renderTableFilters();
    renderTable();
  });
});

// --- Stats ---
function renderStats() {
  const coming = allRsvps.filter((r) => r.status === "coming");
  const maybe = allRsvps.filter((r) => r.status === "maybe");
  const declined = allRsvps.filter((r) => r.status === "not_coming");

  const comingPlusOnes = coming.reduce((sum, r) => sum + (r.plusOnes ? r.plusOnes.length : 0), 0);
  const maybePlusOnes = maybe.reduce((sum, r) => sum + (r.plusOnes ? r.plusOnes.length : 0), 0);

  statTotal.textContent = allRsvps.length;
  statComing.textContent = coming.length;
  statComingGuests.textContent = comingPlusOnes > 0 ? `+${comingPlusOnes} guest${comingPlusOnes !== 1 ? "s" : ""}` : "";
  statMaybe.textContent = maybe.length;
  statMaybeGuests.textContent = maybePlusOnes > 0 ? `+${maybePlusOnes} guest${maybePlusOnes !== 1 ? "s" : ""}` : "";
  statDeclined.textContent = declined.length;
  headcount.textContent = coming.length + comingPlusOnes;
}

// --- Table Filters ---
function renderTableFilters() {
  tableFilters.textContent = "";
  const counts = { all: allRsvps.length };
  allRsvps.forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1; });

  const labels = { all: "All", coming: "Coming", maybe: "Maybe", not_coming: "Declined" };
  Object.entries(labels).forEach(([key, label]) => {
    const chip = document.createElement("button");
    chip.className = `chip${tableFilter === key ? " active" : ""}`;
    chip.textContent = `${label}${counts[key] ? ` (${counts[key]})` : ""}`;
    chip.addEventListener("click", () => { tableFilter = key; renderTableFilters(); renderTable(); });
    tableFilters.appendChild(chip);
  });
}

// --- Table ---
const STATUS_LABELS = { coming: "Coming", maybe: "Maybe", not_coming: "Can't Make It" };
const STATUS_CLASSES = { coming: "coming", maybe: "maybe", not_coming: "not-coming" };

function createTableCell(text, styles) {
  const td = document.createElement("td");
  td.textContent = text;
  if (styles) Object.assign(td.style, styles);
  return td;
}

function renderTable() {
  const filtered = tableFilter === "all"
    ? allRsvps
    : allRsvps.filter((r) => r.status === tableFilter);

  tableBody.textContent = "";
  filtered.forEach((rsvp) => {
    const tr = document.createElement("tr");

    // Name cell
    tr.appendChild(createTableCell(rsvp.name, { fontWeight: "600" }));

    // Status badge cell
    const statusTd = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = `badge ${STATUS_CLASSES[rsvp.status]}`;
    badge.textContent = STATUS_LABELS[rsvp.status];
    statusTd.appendChild(badge);
    tr.appendChild(statusTd);

    // Plus-ones cell
    const plusOnesText = rsvp.plusOnes && rsvp.plusOnes.length > 0
      ? rsvp.plusOnes.join(", ")
      : "\u2014";
    tr.appendChild(createTableCell(plusOnesText));

    // Message cell
    tr.appendChild(createTableCell(rsvp.message || "", { color: "var(--gray-400)", fontSize: "12px" }));

    // Delete button cell
    const deleteTd = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-delete";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", async () => {
      if (confirm("Delete this RSVP?")) {
        await deleteDoc(doc(db, "rsvps", rsvp.id));
      }
    });
    deleteTd.appendChild(deleteBtn);
    tr.appendChild(deleteTd);

    tableBody.appendChild(tr);
  });
}

// --- CSV Export ---
exportCsvBtn.addEventListener("click", () => {
  const headers = ["Name", "Status", "Plus-Ones", "Message", "Date"];
  const rows = allRsvps.map((r) => [
    r.name,
    r.status,
    r.plusOnes ? r.plusOnes.join("; ") : "",
    r.message || "",
    r.createdAt ? r.createdAt.toDate().toLocaleString() : "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "graduation-rsvps.csv";
  a.click();
  URL.revokeObjectURL(url);
});

// --- QR Code Generation ---
generateQrBtn.addEventListener("click", () => {
  qrCode.textContent = "";
  const uploadUrl = `${window.location.origin}/upload.html`;
  QRCode.toCanvas(uploadUrl, { width: 256, margin: 2 }, (err, canvas) => {
    if (err) { console.error(err); return; }
    qrCode.appendChild(canvas);
  });
  qrModal.classList.remove("hidden");
});

qrCloseBtn.addEventListener("click", () => qrModal.classList.add("hidden"));
qrModal.addEventListener("click", (e) => {
  if (e.target === qrModal) qrModal.classList.add("hidden");
});
```

- [ ] **Step 2: Verify dashboard functionality**

Open `http://localhost:8000/admin.html`, sign in, then test:
1. **Stat cards** — show correct counts matching Firestore data
2. **Headcount** — shows coming + their plus-ones
3. **Filter tabs** — click Coming/Maybe/Declined, table filters correctly
4. **Table rows** — show name, colored status badge, plus-one names, message, delete button
5. **Delete** — click Delete on a row → confirm dialog → row removed, stats update in real-time
6. **Export CSV** — click → CSV file downloads with all RSVP data
7. **Generate QR Code** — click → modal shows QR code pointing to upload.html URL
8. **Real-time** — open the RSVP page in another tab, submit an RSVP → dashboard updates without refresh

- [ ] **Step 3: Commit**

```bash
git add public/js/admin.js
git commit -m "feat: add admin dashboard with real-time stats, table, CSV export, and QR code"
```

---

## Task 11: Final Integration & Deploy

**Files:**
- Modify: `.firebaserc` (set real project ID)

- [ ] **Step 1: Create Firebase Auth admin user**

In the Firebase Console:
1. Go to Authentication → Sign-in method → Enable Email/Password
2. Go to Authentication → Users → Add User
3. Enter your email and a secure password

This is the only account that can access the admin dashboard.

- [ ] **Step 2: Update Firebase config**

Edit `public/js/firebase-config.js` and replace all `PASTE_YOUR_*` values with your actual Firebase project config from Firebase Console → Project Settings → Web App → Config.

- [ ] **Step 3: Update `.firebaserc`**

Replace `YOUR_PROJECT_ID` with your actual Firebase project ID.

- [ ] **Step 4: Test locally with Firebase emulator (optional)**

Run:
```bash
firebase emulators:start
```

Open `http://localhost:5000` and test all 4 pages end-to-end.

- [ ] **Step 5: Deploy to Firebase Hosting**

Run:
```bash
firebase deploy
```

Expected output includes:
```
+  Deploy complete!

Hosting URL: https://YOUR_PROJECT_ID.web.app
```

- [ ] **Step 6: Verify live deployment**

Open the Hosting URL and test:
1. RSVP page loads, form submits successfully
2. Photo upload page loads, photos upload to Cloud Storage
3. Gallery page shows uploaded photos
4. Admin page requires sign-in, dashboard shows real-time data
5. CSV export works
6. QR code generates and points to correct upload URL

- [ ] **Step 7: Push final code to GitHub**

```bash
git add -A
git commit -m "feat: configure Firebase project and prepare for deployment"
git push origin master
```

- [ ] **Step 8: Add `.superpowers/` to `.gitignore`**

Ensure the brainstorming mockup files don't get pushed:

```bash
echo ".superpowers/" >> .gitignore
git add .gitignore
git commit -m "chore: add .superpowers to gitignore"
git push origin master
```
