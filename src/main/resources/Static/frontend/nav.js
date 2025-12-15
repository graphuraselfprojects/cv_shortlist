document.addEventListener('DOMContentLoaded', () => {
            // Function to load external HTML for dynamic components (Navbar)
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
                    
                } catch (error) {
                    console.error(`Could not load component from ${url}. If you are opening index.html directly (file://), this is expected. You must use a local server.`, error);
                }
            }

            // Load the NAV BAR component (Footer is now inlined)
            includeHTML('nav-bar.html', 'nav-placeholder');
            
            // Set the current year for the inlined footer
            const yearElement = document.getElementById('year');
            if (yearElement) {
                yearElement.textContent = new Date().getFullYear();
            }

            // Initialize AOS
            AOS.init();
        });