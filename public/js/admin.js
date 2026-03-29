import { db, storage } from "./firebase-config.js";
import { onReady } from "./auth.js";
import {
  collection, query, orderBy, onSnapshot, doc, deleteDoc, addDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js";

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
let listenerRegistered = false;
onReady(() => {
  if (listenerRegistered) return;
  listenerRegistered = true;
  const rsvpQuery = query(collection(db, "rsvps"), orderBy("createdAt", "desc"));

  onSnapshot(rsvpQuery, (snapshot) => {
    allRsvps = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderStats();
    renderTableFilters();
    renderTable();
  });

  // Memories listener (inside auth guard)
  const memoriesQuery = query(collection(db, "memories"), orderBy("uploadedAt", "desc"));
  onSnapshot(memoriesQuery, (snapshot) => {
    const memories = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderMemoriesAdmin(memories);
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
        try {
          await deleteDoc(doc(db, "rsvps", rsvp.id));
        } catch (err) {
          console.error("Delete failed:", err);
          alert("Failed to delete. Please try again.");
        }
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

// --- Manage Memories ---
const uploadMemoriesBtn = document.getElementById("upload-memories-btn");
const memoriesFileInput = document.getElementById("memories-file-input");
const memoriesUploadProgress = document.getElementById("memories-upload-progress");
const memoriesProgressText = document.getElementById("memories-progress-text");
const memoriesAdminGrid = document.getElementById("memories-admin-grid");
const memoriesAdminEmpty = document.getElementById("memories-admin-empty");

function renderMemoriesAdmin(memories) {
  memoriesAdminGrid.textContent = "";
  memoriesAdminEmpty.classList.toggle("hidden", memories.length > 0);

  memories.forEach((memory) => {
    const item = document.createElement("div");
    item.className = "memories-admin-item";

    if (memory.type === "video") {
      const video = document.createElement("video");
      video.src = memory.downloadURL;
      video.preload = "metadata";
      item.appendChild(video);
    } else {
      const img = document.createElement("img");
      img.src = memory.downloadURL;
      img.alt = "Memory";
      item.appendChild(img);
    }

    const deleteBtn = document.createElement("div");
    deleteBtn.className = "delete-overlay";
    deleteBtn.textContent = "\u00d7";
    deleteBtn.addEventListener("click", async () => {
      if (confirm("Delete this memory?")) {
        try {
          await deleteObject(ref(storage, memory.storagePath));
          await deleteDoc(doc(db, "memories", memory.id));
        } catch (err) {
          console.error("Delete memory failed:", err);
          alert("Failed to delete. Please try again.");
        }
      }
    });
    item.appendChild(deleteBtn);

    memoriesAdminGrid.appendChild(item);
  });
}

// Upload memories
uploadMemoriesBtn.addEventListener("click", () => memoriesFileInput.click());

memoriesFileInput.addEventListener("change", async (e) => {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;

  memoriesFileInput.value = "";
  uploadMemoriesBtn.classList.add("hidden");
  memoriesUploadProgress.classList.remove("hidden");

  try {
    for (let i = 0; i < files.length; i++) {
      memoriesProgressText.textContent = `Uploading... ${i + 1} of ${files.length}`;
      const file = files[i];
      const isVideo = file.type.startsWith("video/");
      const ext = isVideo ? "mp4" : "jpg";
      const fileId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const storagePath = `memories/${fileId}.${ext}`;
      const storageRef = ref(storage, storagePath);

      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
      });
      const downloadURL = await getDownloadURL(snapshot.ref);

      await addDoc(collection(db, "memories"), {
        storagePath: storagePath,
        downloadURL: downloadURL,
        type: isVideo ? "video" : "image",
        uploadedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.error("Memory upload error:", err);
    alert("Upload failed. Please try again.");
  }

  memoriesUploadProgress.classList.add("hidden");
  uploadMemoriesBtn.classList.remove("hidden");
});
