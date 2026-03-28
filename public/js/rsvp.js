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
