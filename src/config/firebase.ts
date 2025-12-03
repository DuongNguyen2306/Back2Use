import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDummyKey", // Sẽ được thay thế bằng API key thực từ Firebase Console
  authDomain: "back2use.firebaseapp.com", // Sẽ được cập nhật
  projectId: "back2use", // Sẽ được cập nhật
  storageBucket: "back2use.appspot.com", // Sẽ được cập nhật
  messagingSenderId: "315932864975",
  appId: "1:315932864975:web:your-app-id", // Sẽ được cập nhật
};

// Google OAuth Client ID
export const GOOGLE_CLIENT_ID = "315932864975-im13bn584s55frdq3gp86ocqup2uqbdd.apps.googleusercontent.com";

// Initialize Firebase
let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  // Initialize Auth - Firebase v12+ handles persistence automatically for React Native
  auth = initializeAuth(app);
} else {
  app = getApps()[0];
  auth = getAuth(app);
}

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

export { app, auth };
export default { app, auth, googleProvider };

