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
