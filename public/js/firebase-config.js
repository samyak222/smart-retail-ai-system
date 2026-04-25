import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD2k25UDWTw1h-CBkSiCB9qDkMJOaqw848",
  authDomain: "smart-retail-ai-system.firebaseapp.com",
  projectId: "smart-retail-ai-system",
  storageBucket: "smart-retail-ai-system.firebasestorage.app",
  messagingSenderId: "544901070152",
  appId: "1:544901070152:web:c40da4ca034764b5e0877d",
  measurementId: "G-5BTF68Y9J9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };