// Scroll to Top Logic
    const scrollTopBtn = document.getElementById('scrollTopBtn');

    window.addEventListener('scroll', () => {
        // Show button when page is scrolled down 300px
        if (window.scrollY > 300) {
            scrollTopBtn.classList.remove('translate-y-24', 'opacity-0');
        } else {
            scrollTopBtn.classList.add('translate-y-24', 'opacity-0');
        }
    });

    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

        // Toggle Mobile Menu
        const btn = document.getElementById('mobile-menu-btn');
        const menu = document.getElementById('mobile-menu');

        btn.addEventListener('click', () => {
            menu.classList.toggle('hidden');
        });

        // Simple file upload interaction demo
        const fileInput = document.getElementById('fileInput');
        const fileList = document.getElementById('fileList');
        
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            fileList.innerHTML = '';
            files.forEach(file => {
                const div = document.createElement('div');
                div.className = 'flex justify-between items-center bg-brand-dark p-2 rounded border border-gray-700';
                div.innerHTML = `<span>${file.name}</span> <i class="fas fa-check text-green-400"></i>`;
                fileList.appendChild(div);
            });
        });