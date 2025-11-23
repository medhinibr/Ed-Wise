// Import the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// FIrebase Configuration
const firebaseConfig = {
    apiKey: "Your_API_key",
    authDomain: "Your_Domain",
    projectId: "Replace Your_project_ID",
    storageBucket: "Replace Your Storage Bucket",
    messagingSenderId: "Initialize Messaging ID",
    appId: "Replace App ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
