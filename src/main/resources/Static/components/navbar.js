class CustomNavbar extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          position: sticky;
          top: 0;
          z-index: 50;
          background-color: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .navbar-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 1rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo {
          display: flex;
          align-items: center;
          font-weight: 700;
          font-size: 1.25rem;
          color: #1e40af;
          text-decoration: none;
        }
        .logo-icon {
          margin-right: 0.5rem;
          color: #3b82f6;
        }
        .nav-links {
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }
        .nav-link {
          color: #4b5563;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.2s;
        }
        .nav-link:hover {
          color: #1e40af;
        }
        .nav-link.active {
          color: #1e40af;
          font-weight: 600;
        }
        .user-avatar {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 9999px;
          background-color: #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4b5563;
          cursor: pointer;
        }
        .mobile-menu-button {
          display: none;
          background: none;
          border: none;
          color: #4b5563;
          cursor: pointer;
        }
        @media (max-width: 768px) {
          .mobile-menu-button {
            display: block;
          }
          .nav-links {
            display: none;
          }
        }
      </style>
      <div class="navbar-container">
        <a href="index.html" class="logo">
          <i data-feather="cpu" class="logo-icon"></i>
          ResumeGenius AI
        </a>
        
        <button class="mobile-menu-button">
          <i data-feather="menu"></i>
        </button>
        
        <div class="nav-links">
          <a href="index.html" class="nav-link active">Home</a>
          <a href="upload.html" class="nav-link">Analyze</a>
          <a href="dashboard.html" class="nav-link">Dashboard</a>
          <a href="#" class="nav-link">Pricing</a>
          <a href="#" class="nav-link">Help</a>
          <div class="user-avatar">
            <i data-feather="user"></i>
          </div>
        </div>
      </div>
    `;
  }
}
customElements.define('custom-navbar', CustomNavbar);