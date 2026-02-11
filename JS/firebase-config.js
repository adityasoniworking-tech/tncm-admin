// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyC6Cr8OI7pjTt3t70hrjiSW7kWeZj4jHWc",
    authDomain: "bakeryapp-c4812.firebaseapp.com",
    projectId: "bakeryapp-c4812",
    storageBucket: "bakeryapp-c4812.firebasestorage.app",
    messagingSenderId: "547764804378",
    appId: "1:547764804378:web:e4a425b9e13c826afaaaa3"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

console.log('Firebase Initialized Successfully');
