# Secret Code Memories Feature — Design Spec

**Date:** 2026-03-29

## Overview

A hidden "Memories" tab unlocked by entering a 4-letter secret code (GQPB) on the RSVP tab. When unlocked, confetti rains down in pastel colors, and a new Memories tab appears in the tab bar. The Memories tab has a Cotton Candy pastel theme with a photo/video grid of personal memories uploaded by the graduate via the admin dashboard.

## Secret Code Entry

- A subtle "🔒 Have a secret code?" button appears on the RSVP tab, below the RSVP form
- Clicking it opens a code entry UI with 4 individual character input boxes
- The correct code is **GQPB** (case-insensitive)
- Wrong code shows a brief shake animation and "Try again" message
- Correct code triggers the confetti animation and reveals the Memories tab
- The unlock state is stored in `localStorage` so friends don't have to re-enter the code on refresh

## Confetti Animation

- Full-screen confetti explosion triggered on successful code entry
- Confetti particles rain down from the top of the screen for ~5 seconds
- Particle colors (Cotton Candy palette):
  - `#FF9ECD` — pink
  - `#B5E8F7` — baby blue
  - `#B8F0D8` — mint
  - `#E8B4F8` — light purple
  - `#FDFD96` — soft yellow
- Particles are a mix of shapes: circles, squares, small rectangles
- CSS animation only — no external library needed
- Confetti replays each time the Memories tab is clicked (brief, lighter replay)

## Memories Tab

### Tab Bar
- After unlock, a 4th tab appears: **"Memories"** (with a ✨ emoji)
- The Memories tab uses pink (`#FF9ECD`) as its active color instead of the GMU gold used by other tabs
- Tab bar remains green — only the active indicator and text color change for this tab

### Hero Section
- Cotton Candy gradient background: `linear-gradient(135deg, #FF9ECD 0%, #E8B4F8 50%, #B5E8F7 100%)`
- Header text: **"Girl Queen Pussy Boss"** — white, bold, centered
- No subtitle or secondary text

### Photo/Video Grid
- Responsive grid layout (3 columns on desktop, 2 on mobile)
- Photos display as square thumbnails with rounded corners
- Videos show a play button overlay — tap to play inline (HTML5 `<video>` tag)
- Tap a photo to open it in the existing lightbox component (reuse from gallery)
- Media loads from Firebase Cloud Storage `memories/` path
- Firestore `memories` collection stores metadata (same pattern as `photos` collection)

### Footer
- Pastel pink footer: "Made with love"

## Data Model

### Firestore: `memories` collection

```
{
  storagePath: string,       // Cloud Storage path: "memories/{id}.{ext}"
  downloadURL: string,       // Public download URL
  type: string,              // "image" or "video"
  uploadedAt: Timestamp      // Server timestamp
}
```

### Cloud Storage

```
memories/
  {auto-id}.jpg              // Images
  {auto-id}.mp4              // Videos
```

## Security Rules

### Firestore — `memories` collection
```
match /memories/{memoryId} {
  allow create: if isAdmin();
  allow read: if true;
  allow delete: if isAdmin();
  allow update: if false;
}
```

Photos/videos in the memories collection are publicly readable (anyone with the unlocked tab can view them), but only the admin can upload or delete.

### Cloud Storage — `memories/` path
```
match /memories/{fileId} {
  allow read: if true;
  allow create: if request.auth != null
                && request.auth.uid == 'ZGc4z0ydjmccHf7mqiXYqmiqN522'
                && request.resource.size < 50 * 1024 * 1024
                && (request.resource.contentType.matches('image/.*')
                    || request.resource.contentType.matches('video/.*'));
  allow delete: if request.auth != null
                && request.auth.uid == 'ZGc4z0ydjmccHf7mqiXYqmiqN522';
  allow update: if false;
}
```

50MB limit per file to accommodate videos. Only admin can upload/delete.

## Admin Dashboard — Manage Memories

A new section on the admin dashboard (`admin.html`), below the existing RSVP table:

- **"Manage Memories"** heading
- **Upload button** — opens file picker for images and videos (multi-select)
- **Thumbnail grid** of all uploaded memories with delete buttons
- Uses the same upload-to-Cloud-Storage pattern as the photo upload page
- No image compression for memories (preserve original quality)
- Videos upload as-is (no transcoding)

## Files Changed

- **Modify:** `public/index.html` — add secret code button on RSVP tab, add Memories tab content section, add code entry modal
- **Modify:** `public/css/style.css` — add Cotton Candy theme styles, confetti animation, code entry styles, memories grid styles
- **Create:** `public/js/secrets.js` — code entry logic, confetti animation, localStorage persistence, memories tab reveal
- **Create:** `public/js/memories.js` — load memories from Firestore, render grid, video playback, lightbox integration
- **Modify:** `public/js/tabs.js` — support dynamic 4th tab appearing after unlock
- **Modify:** `public/admin.html` — add Manage Memories section
- **Modify:** `public/js/admin.js` — add memories upload/delete/display logic
- **Modify:** `firestore.rules` — add `memories` collection rules
- **Modify:** `storage.rules` — add `memories/` path rules

## Non-Goals

- No captions or descriptions on memories
- No reordering of memories (sorted by upload date)
- No video transcoding or compression
- No sharing of the memories tab link (code must be entered each session, unless cached in localStorage)
