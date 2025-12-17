/* nav.js */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Load the Navbar
    includeHTML('nav-bar.html', 'nav-placeholder').then(() => {
        // 2. Once Navbar is loaded, update UI based on login state
        updateNavbarUI();
    });

    // Initialize AOS
    if (typeof AOS !== 'undefined') {
        AOS.init();
    }
});

// Function to load external HTML
async function includeHTML(url, elementId) {
    const placeholder = document.getElementById(elementId);
    if (!placeholder) return;
    try {
        const response = await fetch(url);
        if (response.ok) {
            placeholder.innerHTML = await response.text();
        }
    } catch (error) {
        console.error(`Error loading ${url}:`, error);
    }
}

// --- CORE UI UPDATE LOGIC ---
function updateNavbarUI() {
    const token = localStorage.getItem('jwtToken');
    
    // Desktop Elements
    const authButtons = document.getElementById('nav-auth-buttons');
    const userProfile = document.getElementById('nav-user-profile');
    
    // Mobile Elements
    const mobileAuth = document.getElementById('mobile-auth-buttons');
    const mobileProfile = document.getElementById('mobile-user-profile');

    if (token) {
        // LOGGED IN: Hide Login/Signup, Show My Account
        if (authButtons) authButtons.classList.add('hidden');
        if (userProfile) userProfile.classList.remove('hidden');
        
        if (mobileAuth) mobileAuth.classList.add('hidden');
        if (mobileProfile) mobileProfile.classList.remove('hidden');
    } else {
        // LOGGED OUT: Show Login/Signup, Hide My Account
        if (authButtons) authButtons.classList.remove('hidden');
        if (userProfile) userProfile.classList.add('hidden');
        
        if (mobileAuth) mobileAuth.classList.remove('hidden');
        if (mobileProfile) mobileProfile.classList.add('hidden');
    }
}

// --- Navigation Guard ---
function handleRecruiterClick() {
    const token = localStorage.getItem('jwtToken');
    if (token) {
        window.location.href = "Recruiter.html";
    } else {
        alert("Please login first to access the Recruiter Dashboard.");
        openLogin();
    }
}

// --- LOGIN LOGIC (Updates Name) ---
async function handleLogin() {
    
    const loginUrl = `${CONFIG.API_BASE_URL}/login`;
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const requestBody = { email: email, password: password };

    

    try {
        const response = await fetch(loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            const data = await response.json();
            
            // 1. Save Token
            localStorage.setItem('jwtToken', data.token);

            // NEW: Save the real ID and Name from backend
            localStorage.setItem('userId', data.userId); 
            localStorage.setItem('userName', data.name);

            // 2. NAME HACK: Since backend doesn't return name, extract from email
            // Example: ayush@gmail.com -> Ayush
            const derivedName = email.split('@')[0];
            // Capitalize first letter
            const formattedName = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);
            localStorage.setItem('userName', formattedName);

            // 3. Update UI and Redirect
            updateNavbarUI();
            alert("Login successful!");
            window.location.href = "profile.html";
            
        } else {
            const errorMessage = await response.text();
            alert("Login Failed: " + errorMessage);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Something went wrong.");
    }
}

// --- SIGNUP LOGIC (Saves Real Name) ---
async function handleSignup() {
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    const requestBody = { name: name, email: email, password: password };
    const apiUrl = `${CONFIG.API_BASE_URL}/register`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            const data = await response.json();
            
            // On signup, we KNOW the real name, so save it!
            if(data.token) {
                localStorage.setItem('jwtToken', data.token);
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('userName', data.name);
            }
            
            alert('Registration successful! Please login.');
            closePopup();
            openLogin();
        } else {
            const error = await response.text();
            alert('Registration Failed: ' + error);
        }
    } catch (error) {
        console.error('Network Error:', error);
        alert('An unexpected network error occurred.');
    }
}

// --- MODAL & LOGOUT UTILS ---
function toggleModal(modalId, show) {
    const overlay = document.getElementById('overlay');
    const modal = document.getElementById(modalId);
    if (!modal || !overlay) return;

    if (show) {
        overlay.classList.remove('hidden');
        modal.classList.remove('hidden');
        setTimeout(() => {
            overlay.classList.remove('opacity-0');
            modal.classList.remove('scale-90', 'opacity-0');
            modal.classList.add('scale-100', 'opacity-100');
        }, 10);
    } else {
        overlay.classList.add('opacity-0');
        modal.classList.remove('scale-100', 'opacity-100');
        modal.classList.add('scale-90', 'opacity-0');
        setTimeout(() => {
            overlay.classList.add('hidden');
            modal.classList.add('hidden');
        }, 300);
    }
}

function closePopup() {
    toggleModal('loginPopup', false);
    toggleModal('signupPopup', false);
}
function openLogin(isSwitch) {
    if(isSwitch) toggleModal('signupPopup', false);
    toggleModal('loginPopup', true);
}
function openSignup(isSwitch) {
    if(isSwitch) toggleModal('loginPopup', false);
    toggleModal('signupPopup', true);
}
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if(menu) menu.classList.toggle('hidden');
}

// Expose functions globally
window.handleRecruiterClick = handleRecruiterClick;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.openLogin = openLogin;
window.openSignup = openSignup;
window.closePopup = closePopup;
window.toggleMobileMenu = toggleMobileMenu;
window.updateNavbarUI = updateNavbarUI;