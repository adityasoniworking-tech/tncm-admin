// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyC6Cr8OI7pjTt3t70hrjiSW7kWeZj4jHWc",
    authDomain: "bakeryapp-c4812.firebaseapp.com",
    projectId: "bakeryapp-c4812",
    storageBucket: "bakeryapp-c4812.firebasestorage.app",
    messagingSenderId: "547764804378",
    appId: "1:547764804378:web:e4a425b9e13c826afaaaa3"
};

// Initialize Firebase Safely
if (typeof firebase === 'undefined') {
    console.error('CRITICAL: Firebase SDK not loaded. Check script imports inside head tag.');
    alert('Firebase SDK failed to load. Please check your internet connection.');
} else {
    try {
        let app;
        // Check if Firebase is already initialized
        if (!firebase.apps.length) {
            app = firebase.initializeApp(firebaseConfig);
            console.log('Firebase App Initialized');
        } else {
            app = firebase.app(); // Use existing app
            console.log('Review: Using existing Firebase App instance');
        }

        // Initialize Services & Make Globally Available
        window.db = firebase.firestore();
        window.messaging = firebase.messaging();
        window.auth = firebase.auth();
        window.storage = firebase.storage();
        
        window.firebaseApp = app;

        console.log('Firebase Services Ready & Globalized');

    } catch (error) {
        console.error('Firebase Initialization Error:', error);
        alert('Firebase Config Error: ' + error.message);
    }
}
