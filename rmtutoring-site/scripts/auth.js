import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  deleteUser,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { fetchFirebaseConfig } from "./firebase-config.js";

// A humble Firebase wrapper
class AuthHandler {                           
  constructor(firebaseConfig) {
    this.firebaseApp = initializeApp(firebaseConfig);
    this.auth = getAuth(this.firebaseApp);
  }

  importToLocal(user) {
    localStorage.setItem("email", user.email);
    if (!user.displayName) {
      localStorage.setItem("username", user.email.split('@')[0])
    } else {
      localStorage.setItem("username", user.displayName)
    }
    localStorage.setItem("verified", user.emailVerified) //convert string to boolean
  }

  async register(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      await sendEmailVerification(userCredential.user);
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

  async storeUsername(username) {
    updateProfile(this.auth.currentUser, {
      displayName: username
    }).then(() => {
      console.log("Username captured!")
    }).catch((error) => {
      console.log(error)
      return;
    });
  }

  async logout() {
    try {
      await signOut(this.auth);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async deleteAccount(user) {
    try {
      await deleteUser(user);
      console.log("User account deleted successfully.");
      localStorage.removeItem("email"); // Clear email from localStorage
      window.location.href = "/"; // Redirect to home page
    } catch (error) {
      console.error("Error deleting user account:", error.message);
    }
  }

  async pollVerification(user) {
    const pollInterval = setInterval(() => {
      user.reload().then(() => {
        if (user.emailVerified) {
          clearInterval(pollInterval); // Stop polling
          console.log("Email verified!");

          localStorage.setItem("verified", true)
        }
      });
    }, 3000); // poll every 3 seconds
  }

  async authStateChangedCallback(user) {
    if (user) {
      console.log('User is signed in:', user);
      await user.reload()
      if (!user.emailVerified) {
        await this.pollVerification(user)
      }
      this.importToLocal(user)
    } else {
      console.log('No user is signed in.');
      localStorage.removeItem('email');
      localStorage.removeItem('username'); // Clear email from localStorage
    }
  }
}

// Export a promise that resolves to your AuthHandler instance after config is loaded
export const authHandlerPromise = fetchFirebaseConfig().then(firebaseConfig => {
  const handler = new AuthHandler(firebaseConfig);
  onAuthStateChanged(handler.auth, (user) => {
    handler.authStateChangedCallback(user);
  });
  return handler;
});