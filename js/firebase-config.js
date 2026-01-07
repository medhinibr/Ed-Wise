// Import the functions you need from the SDKs you need
// Using CDN imports for browser compatibility without a bundler
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import CONFIG from './config.js';

// Your web app's Firebase configuration
const firebaseConfig = CONFIG.FIREBASE;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { db, app, analytics };