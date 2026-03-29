import { db } from "./firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// --- State ---
let selectedStatus = null;

// --- DOM refs ---
const form = document.getElementById("rsvp-form");
const successDiv = document.getElementById("rsvp-success");
const nameInput = document.getElementById("guest-name");
const messageInput = document.getElementById("guest-message");
const submitBtn = document.getElementById("submit-rsvp");
const responseButtons = document.querySelectorAll(".response-btn");
const plusOneCheck = document.getElementById("plus-one-check");
const plusOneNamesDiv = document.getElementById("plus-one-names");
const plusOneNameInput = document.getElementById("plus-one-name");

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

// --- Plus-One Checkbox ---
plusOneCheck.addEventListener("change", () => {
  plusOneNamesDiv.classList.toggle("hidden", !plusOneCheck.checked);
  if (!plusOneCheck.checked) {
    plusOneNameInput.value = "";
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

  // Collect plus-one name
  const plusOnes = [];
  if (plusOneCheck.checked) {
    const guestName = plusOneNameInput.value.trim();
    if (!guestName) {
      plusOneNameInput.focus();
      plusOneNameInput.style.borderColor = "var(--red)";
      return;
    }
    plusOnes.push(guestName);
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
    const name = nameInput.value.trim();

    if (selectedStatus === "coming") {
      successHeading.textContent = `Thank you, ${name}!`;
      successText.textContent = "We can't wait to see you there!";
    } else if (selectedStatus === "maybe") {
      successHeading.textContent = `Thanks, ${name}!`;
      successText.textContent = "We hope you can make it! We'll save a spot for you.";
    } else {
      successHeading.textContent = `We'll miss you, ${name}!`;
      successText.textContent = "Thanks for letting us know. We appreciate it!";
    }
  } catch (err) {
    console.error("RSVP submit error:", err);
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
    alert("Something went wrong. Please try again.");
  }
});
