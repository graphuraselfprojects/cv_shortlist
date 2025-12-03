class CustomFooter extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          background-color: #111827;
          color: #f3f4f6;
          padding: 3rem 1.5rem;
        }
        .footer-container {
          max-width: 1280px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
        }
        .footer-logo {
          display: flex;
          align-items: center;
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: white;
          text-decoration: none;
        }
        .footer-logo-icon {
          margin-right: 0.5rem;
          color: #3b82f6;
        }
        .footer-description {
          color: #9ca3af;
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }
        .footer-heading {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 1.25rem;
          color: white;
        }
        .footer-links {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .footer-link {
          color: #9ca3af;
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-link:hover {
          color: #3b82f6;
        }
        .social-links {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }
        .social-link {
          color: #9ca3af;
          transition: color 0.2s;
        }
        .social-link:hover {
          color: #3b82f6;
        }
        .copyright {
          max-width: 1280px;
          margin: 3rem auto 0;
          padding-top: 2rem;
          border-top: 1px solid #374151;
          color: #9ca3af;
          text-align: center;
        }
        @media (max-width: 768px) {
          .footer-container {
            grid-template-columns: 1fr;
          }
        }
      </style>
      <div class="footer-container">
        <div>
          <a href="index.html" class="footer-logo">
            <i data-feather="cpu" class="footer-logo-icon"></i>
            ResumeGenius AI
          </a>
          <p class="footer-description">
            AI-powered resume analysis platform that helps recruiters find the best candidates faster.
          </p>
          <div class="social-links">
            <a href="#" class="social-link">
              <i data-feather="twitter"></i>
            </a>
            <a href="#" class="social-link">
              <i data-feather="linkedin"></i>
            </a>
            <a href="#" class="social-link">
              <i data-feather="facebook"></i>
            </a>
            <a href="#" class="social-link">
              <i data-feather="github"></i>
            </a>
          </div>
        </div>
        
        <div>
          <h3 class="footer-heading">Product</h3>
          <div class="footer-links">
            <a href="#" class="footer-link">Features</a>
            <a href="#" class="footer-link">Pricing</a>
            <a href="#" class="footer-link">API</a>
            <a href="#" class="footer-link">Integrations</a>
          </div>
        </div>
        
        <div>
          <h3 class="footer-heading">Company</h3>
          <div class="footer-links">
            <a href="#" class="footer-link">About</a>
            <a href="#" class="footer-link">Careers</a>
            <a href="#" class="footer-link">Blog</a>
            <a href="#" class="footer-link">Contact</a>
          </div>
        </div>
        
        <div>
          <h3 class="footer-heading">Legal</h3>
          <div class="footer-links">
            <a href="#" class="footer-link">Privacy</a>
            <a href="#" class="footer-link">Terms</a>
            <a href="#" class="footer-link">Security</a>
            <a href="#" class="footer-link">GDPR</a>
          </div>
        </div>
      </div>
      
      <div class="copyright">
        &copy; ${new Date().getFullYear()} ResumeGenius AI. All rights reserved.
      </div>
    `;
  }
}
customElements.define('custom-footer', CustomFooter);