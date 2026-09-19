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