import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app-check.js";

const firebaseConfig = {
  apiKey: "AIzaSyC1ap8aCgx76_x_qeyxaki2uv7gboZPKPk",
  authDomain: "gmu-graduation-party-rsvp.firebaseapp.com",
  projectId: "gmu-graduation-party-rsvp",
  storageBucket: "gmu-graduation-party-rsvp.firebasestorage.app",
  messagingSenderId: "963499010315",
  appId: "1:963499010315:web:53b96097c2d6b279cdda0e"
};

const app = initializeApp(firebaseConfig);

// App Check — verifies requests come from the legitimate app
initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider("6LeoA50sAAAAAI41H5abMfD9SrxuQctDeebnIVri"),
  isTokenAutoRefreshEnabled: true
});

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
