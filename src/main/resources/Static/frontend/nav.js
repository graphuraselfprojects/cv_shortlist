// Shared navbar, login & signup behaviour across all pages
document.addEventListener("DOMContentLoaded", () => {
  // Dynamically inject navbar into pages that define `nav-placeholder`
  async function includeHTML(url, elementId) {
    const placeholder = document.getElementById(elementId);
    if (!placeholder) return;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} (${url})`);
      }
      const html = await response.text();
      placeholder.innerHTML = html;

      initNavbarInteractions();
    } catch (error) {
      console.error(
        `Could not load component from ${url}. If you are opening index.html directly (file://), this is expected. You must use a local server.`,
        error
      );
    }
  }

  includeHTML("nav-bar.html", "nav-placeholder");

  const yearElement = document.getElementById("year");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  if (window.AOS) {
    AOS.init();
  }

  // If a page already has the navbar markup inlined (rare), still wire events
  if (document.getElementById("navbar")) {
    initNavbarInteractions();
  }
});

function initNavbarInteractions() {
  const overlay = document.getElementById("overlay");
  const loginPopup = document.getElementById("loginPopup");
  const signupPopup = document.getElementById("signupPopup");
  const mobileMenu = document.getElementById("mobile-menu");
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");

  // Guard – some pages may not have auth modals
  function toggleModal(modalId, show) {
    const modal = document.getElementById(modalId);
    if (!modal || !overlay) return;

    if (show) {
      overlay.classList.remove("hidden");
      setTimeout(() => overlay.classList.add("opacity-100"), 10);

      modal.classList.remove("hidden");
      setTimeout(() => {
        modal.classList.remove("scale-90", "opacity-0");
        modal.classList.add("scale-100", "opacity-100");
      }, 10);
    } else {
      overlay.classList.remove("opacity-100");
      modal.classList.remove("scale-100", "opacity-100");
      modal.classList.add("scale-90", "opacity-0");

      setTimeout(() => {
        overlay.classList.add("hidden");
        modal.classList.add("hidden");
      }, 300);
    }
  }

  window.closePopup = function () {
    toggleModal("loginPopup", false);
    toggleModal("signupPopup", false);
  };

  window.openLogin = function (isSwitch = false) {
    if (isSwitch) {
      toggleModal("signupPopup", false);
      setTimeout(() => toggleModal("loginPopup", true), 100);
    } else {
      toggleModal("loginPopup", true);
    }
  };

  window.openSignup = function (isSwitch = false) {
    if (isSwitch) {
      toggleModal("loginPopup", false);
      setTimeout(() => toggleModal("signupPopup", true), 100);
    } else {
      toggleModal("signupPopup", true);
    }
  };

  // Mobile menu toggle
  if (mobileMenu && mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
    });
  }

  // Nav button behaviour with login gating + redirect
  const navButtons = document.querySelectorAll('[data-nav-target]');
  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-nav-target");
      const token = localStorage.getItem("jwtToken");

      // If not logged in, open login popup and remember desired page
      if (!token && (target === "Recruiter.html" || target === "dashboard.html")) {
        localStorage.setItem("redirectAfterLogin", target);
        if (mobileMenu) mobileMenu.classList.add("hidden");
        window.openLogin(false);
      } else {
        if (mobileMenu) mobileMenu.classList.add("hidden");
        window.location.href = target;
      }
    });
  });

  // Login / Signup buttons on navbar
  document.querySelectorAll("[data-open-login]").forEach((el) => {
    el.addEventListener("click", () => {
      window.openLogin(false);
      if (mobileMenu) mobileMenu.classList.add("hidden");
    });
  });

  document.querySelectorAll("[data-open-signup]").forEach((el) => {
    el.addEventListener("click", () => {
      window.openSignup(false);
      if (mobileMenu) mobileMenu.classList.add("hidden");
    });
  });

  // Active link styling based on current page
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  navButtons.forEach((btn) => {
    const target = btn.getAttribute("data-nav-target");
    if (target === currentPage) {
      btn.classList.add("text-brand-primary");
    }
  });

  // Wire modal submit buttons if they exist
  if (loginPopup) {
    const loginBtn = loginPopup.querySelector("button[onclick], button[data-login-submit]");
    if (loginBtn) {
      loginBtn.onclick = handleLogin;
    }
  }
  if (signupPopup) {
    const signupBtn = signupPopup.querySelector("button[onclick], button[data-signup-submit]");
    if (signupBtn) {
      signupBtn.onclick = handleSignup;
    }
  }
}

// Shared login / signup handlers used across pages
const AUTH_BASE_URL = CONFIG && CONFIG.API_BASE_URL ? CONFIG.API_BASE_URL : "/api/auth";

async function handleLogin() {
  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");

  if (!emailInput || !passwordInput) return;

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("Please enter both email and password.");
    return;
  }

  const requestBody = { email, password };

  try {
    const response = await fetch(`${AUTH_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      const data = await response.json();

      if (data && data.token) {
        localStorage.setItem("jwtToken", data.token);
        // Store user data from login form
        const userData = {
          email: email,
          name: email.split("@")[0], // Fallback name from email if not available
        };
        localStorage.setItem("userData", JSON.stringify(userData));
      }

      const desired = localStorage.getItem("redirectAfterLogin");
      localStorage.removeItem("redirectAfterLogin");

      // Close popup then redirect
      if (typeof window.closePopup === "function") {
        window.closePopup();
      }

      // Always redirect to profile page after successful login
      window.location.href = "profile.html";
    } else {
      const errorMessage = await response.text();
      alert("Login Failed: " + (errorMessage || "Invalid credentials"));
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Something went wrong while logging in. Please try again.");
  }
}

async function handleSignup() {
  const nameInput = document.getElementById("signup-name");
  const emailInput = document.getElementById("signup-email");
  const passwordInput = document.getElementById("signup-password");

  if (!nameInput || !emailInput || !passwordInput) return;

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!name || !email || !password) {
    alert("Please fill all signup fields.");
    return;
  }

  const requestBody = { name, email, password };

  try {
    const response = await fetch(`${AUTH_BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      const data = await response.json().catch(() => null);
      
      // Store user data from signup form
      if (data && data.token) {
        localStorage.setItem("jwtToken", data.token);
      }
      const userData = {
        name: name,
        email: email,
      };
      localStorage.setItem("userData", JSON.stringify(userData));
      
      alert("Registration successful! Redirecting to profile...");

      if (typeof window.closePopup === "function") {
        window.closePopup();
      }
      
      // Redirect to profile page after signup
      window.location.href = "profile.html";
    } else {
      const error = await response.text();
      console.error("Registration Failed:", error);
      alert("Registration Failed: " + (error || "Unable to register"));
    }
  } catch (error) {
    console.error("Network Error:", error);
    alert("An unexpected network error occurred. Please try again.");
  }
}

// Logout function - clears localStorage and redirects to login
window.handleLogout = function() {
  localStorage.removeItem("jwtToken");
  localStorage.removeItem("userData");
  localStorage.removeItem("jobId");
  localStorage.removeItem("redirectAfterLogin");
  
  // Redirect to home page (which will show login)
  window.location.href = "index.html";
};

// Route protection utility - check if user is logged in
window.requireAuth = function() {
  const token = localStorage.getItem("jwtToken");
  if (!token) {
    // Store current page to redirect after login
    const currentPage = window.location.pathname.split("/").pop();
    if (currentPage !== "index.html" && currentPage !== "profile.html") {
      localStorage.setItem("redirectAfterLogin", currentPage);
    }
    // Redirect to home page to show login
    window.location.href = "index.html";
    return false;
  }
  return true;
};
