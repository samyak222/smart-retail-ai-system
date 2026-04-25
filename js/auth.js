import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";

const loginBtn = document.getElementById("loginBtn");

if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const msg = document.getElementById("msg");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      msg.innerText = "Login successful";
      window.location.href = "admin/dashboard.html";
    } catch (error) {
      msg.innerText = error.message;
    }
  });
}