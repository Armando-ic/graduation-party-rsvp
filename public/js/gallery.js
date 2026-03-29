import { db } from "./firebase-config.js";
import { collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

export function initGallery() {
  const galleryGrid = document.getElementById("gallery-grid");
  const filterChips = document.getElementById("filter-chips");
  const photoTotal = document.getElementById("photo-total");
  const emptyState = document.getElementById("empty-state");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxInfo = document.getElementById("lightbox-info");
  const lightboxClose = document.getElementById("lightbox-close");
  const downloadAllBtn = document.getElementById("download-all-btn");

  let allPhotos = [];
  let activeFilter = "all";

  const photosQuery = query(collection(db, "photos"), orderBy("uploadedAt", "desc"));

  onSnapshot(photosQuery, (snapshot) => {
    allPhotos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    renderFilters();
    renderGallery();
  });

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

  downloadAllBtn.addEventListener("click", async () => {
    downloadAllBtn.disabled = true;
    downloadAllBtn.textContent = "Downloading...";
    for (const photo of allPhotos) {
      try {
        const response = await fetch(photo.downloadURL);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = photo.storagePath.split("/").pop();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Download failed for", photo.storagePath, err);
      }
    }
    downloadAllBtn.disabled = false;
    downloadAllBtn.textContent = "Download All Photos";
  });
}
