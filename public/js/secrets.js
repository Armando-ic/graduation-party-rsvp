const SECRET_CODE = "gqpb";
const CONFETTI_COLORS = ["#FF9ECD", "#B5E8F7", "#B8F0D8", "#E8B4F8", "#FDFD96"];
const CONFETTI_COUNT = 120;
const CONFETTI_DURATION = 5000;

export function isUnlocked() {
  return localStorage.getItem("memories_unlocked") === "true";
}

export function initSecrets(onUnlock) {
  const codeBtn = document.getElementById("secret-code-btn");
  const codeModal = document.getElementById("code-modal");
  const codeInputs = document.querySelectorAll(".code-input");
  const codeError = document.getElementById("code-error");
  const codeUnlockBtn = document.getElementById("code-unlock-btn");
  const codeCloseBtn = document.getElementById("code-close-btn");
  const codeInputsContainer = document.getElementById("code-inputs");

  if (!codeBtn) return;

  // If already unlocked, trigger immediately
  if (isUnlocked()) {
    onUnlock(false);
    return;
  }

  codeBtn.addEventListener("click", () => {
    codeModal.classList.remove("hidden");
    codeInputs[0].focus();
  });

  // Auto-advance to next input
  codeInputs.forEach((input, i) => {
    input.addEventListener("input", () => {
      input.value = input.value.slice(-1);
      if (input.value && i < codeInputs.length - 1) {
        codeInputs[i + 1].focus();
      }
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && i > 0) {
        codeInputs[i - 1].focus();
      }
      if (e.key === "Enter") {
        codeUnlockBtn.click();
      }
    });
  });

  codeUnlockBtn.addEventListener("click", () => {
    const entered = Array.from(codeInputs).map((i) => i.value).join("").toLowerCase();
    if (entered === SECRET_CODE) {
      localStorage.setItem("memories_unlocked", "true");
      codeModal.classList.add("hidden");
      launchConfetti();
      onUnlock(true);
    } else {
      codeError.textContent = "Try again!";
      codeInputsContainer.classList.add("shake");
      setTimeout(() => {
        codeInputsContainer.classList.remove("shake");
        codeError.textContent = "";
      }, 600);
      codeInputs.forEach((i) => { i.value = ""; });
      codeInputs[0].focus();
    }
  });

  codeCloseBtn.addEventListener("click", () => codeModal.classList.add("hidden"));
  codeModal.addEventListener("click", (e) => {
    if (e.target === codeModal) codeModal.classList.add("hidden");
  });
}

export function launchConfetti() {
  const container = document.createElement("div");
  container.className = "confetti-container";
  document.body.appendChild(container);

  const shapes = ["circle", "square", "rect"];

  for (let i = 0; i < CONFETTI_COUNT; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const size = 6 + Math.random() * 8;
    const left = Math.random() * 100;
    const delay = Math.random() * 2;
    const duration = 2 + Math.random() * 3;

    piece.style.left = `${left}%`;
    piece.style.backgroundColor = color;
    piece.style.animationDuration = `${duration}s`;
    piece.style.animationDelay = `${delay}s`;
    piece.style.width = shape === "rect" ? `${size * 0.4}px` : `${size}px`;
    piece.style.height = `${size}px`;
    piece.style.borderRadius = shape === "circle" ? "50%" : "2px";

    container.appendChild(piece);
  }

  setTimeout(() => container.remove(), CONFETTI_DURATION + 2000);
}
