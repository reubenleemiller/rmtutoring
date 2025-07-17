

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyDxxwLrsPE7DFGVSXXkKcj69uV3I4KMRjo",
  authDomain: "rmtutoring-689f0.firebaseapp.com",
  projectId: "rmtutoring-689f0",
  storageBucket: "rmtutoring-689f0.firebasestorage.app",
  messagingSenderId: "554743121533",
  appId: "1:554743121533:web:7f58ba800723a471be5314",
  measurementId: "G-QDBJQG1PNT"
};


// A humble Firebase wrapper
class AuthHandler {                           
  constructor(firebaseConfig) {
    this.firebaseApp = initializeApp(firebaseConfig);
    this.auth = getAuth(this.firebaseApp);
  }

  async register(email, password) {
    try {
      localStorage.setItem('email', email); // Store email in localStorage
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async login(email, password) {
    try {
      localStorage.setItem('email', email); // Store email in localStorage
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async logout() {
    try {
      localStorage.removeItem('email'); // Clear email from localStorage
      await signOut(this.auth);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  authStateChangedCallback(user) {
    if (user) {
      console.log('User is signed in:', user);
      localStorage.setItem('email', user.email); // Store email in localStorage
    } else {
      console.log('No user is signed in.');
      localStorage.removeItem('email'); // Clear email from localStorage
    }
  }
}


export const authHandler = new AuthHandler(firebaseConfig);
onAuthStateChanged(authHandler.auth, (user) => {
  authHandler.authStateChangedCallback(user);
});


const loginForm = document.getElementById('login-form');
const registrationForm = document.getElementById('registration-form');

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      await authHandler.login(email, password);
      window.location.href = 'dashboard.html'; // Redirect to dashboard on successful login
    } catch (error) {
      document.getElementById('error-message').textContent = error.message;
    }
  });
}


if (registrationForm) {
  registrationForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        await authHandler.register(email, password);
        window.location.href = 'login.html'; // Redirect to login on successful registration
      } catch (error) {
        document.getElementById('error-message').textContent = error.message;
    }
  });
}


