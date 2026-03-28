# Graduation Party RSVP & Photo Sharing — Design Spec

**Date:** 2026-03-28
**Event:** George Mason University Graduation Celebration — May 14, 2026
**Colors:** GMU Green (#006633), GMU Gold (#FFCC33)

## Overview

A serverless web application for managing graduation party RSVPs and event photo sharing. Guests receive a shareable link, RSVP with their response and plus-one names, and at the event scan a QR code to upload photos to a shared gallery. The graduate has a private admin dashboard with real-time stats, response management, and CSV export.

## Stack

- **Frontend:** Vanilla HTML/CSS/JS (no framework, no build step)
- **Backend:** Firebase (Firestore, Cloud Storage, Hosting, Auth)
- **Deployment:** `firebase deploy` to Firebase Hosting

## Pages

### 1. RSVP Page (`index.html`) — Public

The shareable link guests open to respond. Mobile-first, GMU-branded.

**Layout (top to bottom):**
- Green hero banner with gold accents: "You're Invited — Graduation Celebration! — George Mason University, Class of 2026"
- Event details bar: Date (May 14, 2026), Time (configurable), Location (configurable)
- RSVP form:
  - **Your Name** — required text input
  - **Your Response** — three toggle buttons: Coming / Maybe / Can't Make It
  - **Plus-ones** — +/− stepper (0–10). When count > 0, a name input field appears for each plus-one. All plus-one name fields are required if added.
  - **Message** — optional textarea for well wishes
  - **Submit RSVP** — gold button, disabled until name + response are filled
- Success confirmation: replaces form with "Thank you, [Name]! See you there!" (or appropriate variant for Maybe/Can't Make It)
- Footer: "George Mason University — Class of 2026"

**Behavior:**
- On submit, writes a document to Firestore `rsvps` collection
- Submit button shows spinner during write, disables to prevent double-submit
- No login required for guests

### 2. Photo Upload Page (`upload.html`) — Public

Accessed by scanning a QR code at the event. Guests upload photos from their phone.

**Layout:**
- Green hero: "Share Your Photos! — Upload pics from the celebration"
- **Your Name** — optional text input ("So we know who took these!")
- **Upload area** — large dashed-border tap target. Uses `<input type="file" accept="image/*" capture="environment" multiple>` to open camera or gallery. Multi-select supported.
- **Thumbnail previews** — selected photos shown as a row of thumbnails with × to remove
- **Upload button** — "Upload N Photos" in gold. Shows per-photo progress.
- **Success state** — "Uploaded! Add more?" with option to select more photos

**Behavior:**
- Client-side image compression before upload (resize to max 1600px wide, JPEG quality 0.8) to ensure fast uploads on mobile
- Each photo uploaded to Cloud Storage at `photos/{auto-id}.jpg`
- Firestore document created in `photos` collection with metadata
- Works on all modern mobile browsers (Safari iOS, Chrome Android, Samsung Internet)

### 3. Photo Gallery Page (`gallery.html`) — Public

A browsable grid of all uploaded photos. Shareable link for after the event.

**Layout:**
- Green hero: "Photo Gallery — N photos from the celebration"
- **Filter chips** — "All (N)", then one chip per uploader name + "Anonymous (N)"
- **Photo grid** — responsive masonry-style grid, tap to view full size
- **Photo detail** — shows uploader name and timestamp
- **Download All** button in footer

**Behavior:**
- Reads from Firestore `photos` collection, ordered by `uploadedAt` descending
- Photos loaded via Cloud Storage download URLs
- Real-time updates via `onSnapshot` (live photo wall at the party)

### 4. Admin Dashboard (`admin.html`) — Protected

Private page for the graduate to manage RSVPs and monitor the event.

**Auth:** Firebase Auth email/password. Only one account (the graduate). Redirects to sign-in if not authenticated.

**Layout:**
- Green nav bar: "Grad Party Admin" + email + Sign Out
- **Stat cards (4-column grid):**
  - Total Responses (count of all RSVPs)
  - Coming (count + total plus-ones)
  - Maybe (count + total plus-ones)
  - Can't Make It (count)
- **Headcount banner** — green bar showing total expected attendees (coming respondents + their plus-ones)
- **Action buttons:**
  - Export CSV — downloads all RSVP data as a CSV file
  - Generate QR Code — generates a QR code for the photo upload page URL (using client-side QR library)
  - View Photo Gallery — link to gallery.html
- **Response table:**
  - Columns: Name, Status (color-coded badge), Plus-Ones (comma-separated names), Message, Delete
  - Filter tabs: All / Coming / Maybe / Declined
  - Delete button per row to remove spam or duplicates
- **Real-time** — Firestore `onSnapshot` listeners on both `rsvps` and `photos` collections
- Footer: "Live — updates automatically when new RSVPs come in"

## Data Model

### Firestore: `rsvps` collection

```
{
  name: string,              // Guest's full name (required)
  status: string,            // "coming" | "not_coming" | "maybe"
  plusOnes: string[],         // Array of plus-one names (empty array if none)
  message: string,           // Optional message (empty string if none)
  createdAt: Timestamp       // Server timestamp
}
```

### Firestore: `photos` collection

```
{
  uploaderName: string,      // Uploader's name ("Anonymous" if not provided)
  storagePath: string,       // Cloud Storage path: "photos/{id}.jpg"
  downloadURL: string,       // Public download URL
  uploadedAt: Timestamp      // Server timestamp
}
```

### Cloud Storage

```
photos/
  {auto-id}.jpg              // Compressed image files
```

## Security Rules

### Firestore Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /rsvps/{rsvpId} {
      allow create: if true;              // Anyone can submit an RSVP
      allow read, delete: if request.auth != null;  // Only admin can read/delete
      allow update: if false;             // No edits — submit a new one
    }

    match /photos/{photoId} {
      allow create: if true;              // Anyone can add photo metadata
      allow read: if true;                // Gallery is public
      allow delete: if request.auth != null;  // Only admin can delete
      allow update: if false;
    }
  }
}
```

### Cloud Storage Rules

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{photoId} {
      allow write: if request.resource.size < 10 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
      allow read: if true;                // Gallery is public
      allow delete: if request.auth != null;
    }
  }
}
```

## File Structure

```
public/
  index.html          # RSVP page
  upload.html          # Photo upload page
  gallery.html         # Photo gallery page
  admin.html           # Admin dashboard
  css/
    style.css          # Shared styles (GMU theme, responsive layout)
  js/
    firebase-config.js # Firebase initialization (shared)
    rsvp.js            # RSVP form logic
    upload.js          # Photo upload + compression logic
    gallery.js         # Gallery rendering + filtering
    admin.js           # Dashboard stats, table, CSV export, QR generation
    auth.js            # Admin authentication
firebase.json          # Hosting configuration
firestore.rules        # Firestore security rules
storage.rules          # Cloud Storage security rules
.firebaserc            # Firebase project alias
```

## Key Technical Decisions

1. **No framework** — Vanilla JS keeps bundle size zero and eliminates build tooling. The scope (4 pages, 2 Firestore collections) doesn't warrant React/Vue.
2. **Client-side image compression** — Resize images before upload using canvas API (max 1600px, JPEG 0.8 quality). Keeps uploads fast on mobile without a Cloud Function.
3. **Client-side QR generation** — Use a lightweight JS QR library (e.g., qrcode.js) on the admin page. No server-side generation needed.
4. **No Cloud Functions** — Everything runs client-side. Firestore security rules handle access control. Keeps the project simple and within Firebase free tier.
5. **Firebase Auth for admin only** — Single email/password account. Guests never log in.
6. **Immutable RSVPs** — Guests can't edit, only create new entries. Admin can delete duplicates. This prevents tampering and simplifies rules.
7. **Plus-ones as name array** — `plusOnes: ["John Smith", "Maria Garcia"]` instead of a count. Array length gives the count; names give the detail.

## Non-Goals

- Email/SMS invitations (link is distributed manually)
- Guest accounts or login
- RSVP editing by guests
- Photo editing or filters
- Native mobile app
- Multiple admin accounts
