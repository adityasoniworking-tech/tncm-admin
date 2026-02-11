// --- AUTHENTICATION & LOGIN ---
const SESSION_KEY = "isAdminLoggedIn";

// Handle initial UI state based on login status
window.onload = function () {
    const isLoggedIn = localStorage.getItem(SESSION_KEY) === "true";
    const overlay = document.getElementById("adminLoginOverlay");
    const appContainer = document.querySelector(".app-container");
    const bottomNav = document.querySelector(".bottom-nav-mobile");

    if (isLoggedIn) {
        if (overlay) overlay.style.display = "none";
        if (appContainer) appContainer.style.display = "flex";
        if (bottomNav) bottomNav.style.display = "";
        startOrderListener();
    } else {
        // Not logged in: show only login overlay, hide the dashboard + nav (desktop & mobile)
        if (overlay) overlay.style.display = "flex";
        if (appContainer) appContainer.style.display = "none";
        if (bottomNav) bottomNav.style.display = "none";
    }
};

async function checkAdminLogin() {
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;
    const errorMsg = document.getElementById('loginError');

    errorMsg.innerText = "";

    try {
        const doc = await db.collection("config").doc("admin_credentials").get();

        if (doc.exists) {
            const credentials = doc.data();
            
            if (user === credentials.username && pass === credentials.password) {
                const overlay = document.getElementById('adminLoginOverlay');
                const appContainer = document.querySelector('.app-container');
                const bottomNav = document.querySelector('.bottom-nav-mobile');

                if (overlay) overlay.style.display = 'none';
                if (appContainer) appContainer.style.display = 'flex';
                if (bottomNav) bottomNav.style.display = '';

                localStorage.setItem(SESSION_KEY, "true");
                startOrderListener();
            } else {
                errorMsg.innerText = "Invalid Username or Password!";
                document.getElementById('adminPass').value = "";
            }
        } else {
            errorMsg.innerText = "Admin configuration not found in Firestore!";
        }
    } catch (error) {
        errorMsg.innerText = "Login error: Check console/network.";
        console.error("Login Error:", error);
    }
}

function logoutAdmin() {
    localStorage.removeItem(SESSION_KEY);
    window.location.reload();
}

function togglePasswordWithCheckbox() {
    const passwordInput = document.getElementById('adminPass');
    const checkbox = document.getElementById('showPassCheck');
    passwordInput.type = checkbox.checked ? 'text' : 'password';
}

console.log('Auth Module Loaded');
