const mobileMenu = document.getElementById("mobile-menu");
const menuLinks = mobileMenu.querySelectorAll("nav a");
const menuBackdrop = mobileMenu.querySelector('[data-menu-backdrop]');

const closeMobileMenu = () => {
    mobileMenu.removeAttribute("open");
    document.body.classList.remove("overflow-hidden");
};

mobileMenu.addEventListener("toggle", () => {
    document.body.classList.toggle("overflow-hidden", mobileMenu.open);
});

menuBackdrop.addEventListener("click", closeMobileMenu);
menuLinks.forEach(link => link.addEventListener("click", closeMobileMenu));
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mobileMenu.open) closeMobileMenu();
});

const phrases = [
    "browsers into buyers.",
    "leads into customers.",
    "buyers into loyalists.",
    "clicks into conversions.",
    "inboxes into income.",
];

const typewriter = document.getElementById("typewriter");

const typingSpeed = 60; // milliseconds per character
const deletingSpeed = 30; // milliseconds per character
const pauseAfterTyped = 1400; // milliseconds to pause after typing a phrase
const pausedAfterDeleted = 300; // milliseconds to pause after deleting a phrase

let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;

function tick() {
    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
        charIndex--;
        typewriter.textContent = currentPhrase.substring(0, charIndex);
    } else {
        charIndex++;
        typewriter.textContent = currentPhrase.substring(0, charIndex);
    }

    let delay = isDeleting ? deletingSpeed : typingSpeed;

    if (!isDeleting && charIndex === currentPhrase.length) {
        delay = pauseAfterTyped;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        delay = pausedAfterDeleted;
    }

    setTimeout(tick, delay);
}

tick();

// Scroll-linked charts: each [data-scroll-chart] gets a --progress value (0 to 1)
// that runs from 0 when its top enters the bottom of the viewport to 1 when its
// centre reaches ~40% down the viewport. Charts use --progress in styles.css.
const scrollCharts = document.querySelectorAll("[data-scroll-chart]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let scrollTicking = false;

const updateScrollCharts = () => {
    scrollTicking = false;
    const vh = window.innerHeight;

    scrollCharts.forEach((chart) => {
        const rect = chart.getBoundingClientRect();
        const start = vh;
        const end = vh * 0.4 - rect.height / 2;
        const progress = reduceMotion ? 1 : Math.min(1, Math.max(0, (start - rect.top) / (start - end)));
        chart.style.setProperty("--progress", progress.toFixed(4));

        // Counters (data-count-to="2.87") finish at half the scroll range, easing out
        // so the value races up early and settles on the final figure.
        if (chart.dataset.countTo) {
            const eased = 1 - Math.pow(1 - Math.min(1, progress * 1.5), 3);
            chart.textContent = "$" + (eased * parseFloat(chart.dataset.countTo)).toFixed(2);
        }
    });
};

const onScroll = () => {
    if (!scrollTicking) {
        scrollTicking = true;
        requestAnimationFrame(updateScrollCharts);
    }
};

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);
updateScrollCharts();
