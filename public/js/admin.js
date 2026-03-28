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
