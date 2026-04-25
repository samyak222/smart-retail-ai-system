import { auth } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";

const logoutBtn = document.getElementById("logoutBtn");
const adminEmailText = document.getElementById("adminEmail");

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "../login.html";
    return;
  }

  if (adminEmailText) {
    adminEmailText.innerText = user.email;
  }
});

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.href = "../login.html";
    } catch (error) {
      console.error(error);
      alert("Logout failed");
    }
  });
}