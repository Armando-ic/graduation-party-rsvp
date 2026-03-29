import { db } from "./firebase-config.js";
import { collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

export function initMemories() {
  const grid = document.getElementById("memories-grid");
  const emptyState = document.getElementById("memories-empty");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxInfo = document.getElementById("lightbox-info");
  const lightboxClose = document.getElementById("lightbox-close");

  const memoriesQuery = query(collection(db, "memories"), orderBy("uploadedAt", "desc"));

  onSnapshot(memoriesQuery, (snapshot) => {
    const memories = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    renderMemories(memories);
  });

  function renderMemories(memories) {
    grid.textContent = "";
    emptyState.classList.toggle("hidden", memories.length > 0);
    grid.classList.toggle("hidden", memories.length === 0);

    memories.forEach((memory) => {
      const item = document.createElement("div");
      item.className = "memories-item";

      if (memory.type === "video") {
        const video = document.createElement("video");
        video.src = memory.downloadURL;
        video.preload = "metadata";
        video.playsInline = true;
        item.appendChild(video);

        const playBtn = document.createElement("div");
        playBtn.className = "video-play";
        playBtn.textContent = "\u25B6";
        item.appendChild(playBtn);

        item.addEventListener("click", () => {
          if (video.paused) {
            video.controls = true;
            video.play();
            playBtn.classList.add("hidden");
          }
        });

        video.addEventListener("pause", () => {
          video.controls = false;
          playBtn.classList.remove("hidden");
        });
      } else {
        const img = document.createElement("img");
        img.src = memory.downloadURL;
        img.alt = "Memory";
        img.loading = "lazy";
        item.appendChild(img);

        item.addEventListener("click", () => {
          lightboxImg.src = memory.downloadURL;
          lightboxInfo.textContent = "";
          lightbox.classList.remove("hidden");
        });
      }

      grid.appendChild(item);
    });
  }

}
