

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
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
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      sendEmailVerification(userCredential.user);
      return userCredential.user;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async logout() {
    try {
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





