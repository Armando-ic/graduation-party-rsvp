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
  thumbnailsDiv.querySelectorAll("img").forEach((img) => URL.revokeObjectURL(img.src));
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
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
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
        (blob) => blob ? resolve(blob) : reject(new Error("Compression failed")),
        "image/jpeg",
        0.8
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };
    img.src = objectUrl;
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
