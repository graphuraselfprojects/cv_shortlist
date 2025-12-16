// Home page specific behaviour (AOS + scroll-to-top). Shared login/signup is handled in nav.js.
if (window.AOS) {
  AOS.init({
    duration: 800,
    easing: "ease-in-out",
    once: true,
    offset: 100,
    mirror: false,
  });
}

const scrollTopBtn = document.getElementById("scrollTopBtn");
if (scrollTopBtn) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      scrollTopBtn.classList.remove("translate-y-24", "opacity-0");
    } else {
      scrollTopBtn.classList.add("translate-y-24", "opacity-0");
    }
  });
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}
