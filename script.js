// Site nav: on hover devices the panel is pure CSS (see .site-nav in styles.css).
// Touch has no hover, so the first tap on the logo opens the panel instead of
// navigating; a second tap follows the link, and tapping elsewhere closes it.
// While open the page can't scroll (set on <html>, so it can't clash with the
// work page modal's overflow-hidden lock on <body>).
const siteLogo = document.querySelector(".site-logo");
const siteNav = document.getElementById("site-nav");
const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

const setNavOpen = (open) => {
    siteNav.classList.toggle("is-open", open);
    document.documentElement.style.overflow = open ? "hidden" : "";
};

if (!canHover) {
    siteLogo.addEventListener("click", (event) => {
        if (!siteNav.classList.contains("is-open")) {
            event.preventDefault();
            setNavOpen(true);
        }
    });
    // Capture phase, so a tap on the dimmed page only closes the nav and
    // doesn't also follow whatever link or button sits underneath it
    document.addEventListener("click", (event) => {
        if (!siteNav.classList.contains("is-open")) return;
        if (siteLogo.contains(event.target) || siteNav.contains(event.target)) return;
        event.preventDefault();
        event.stopPropagation();
        setNavOpen(false);
    }, true);
}

document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    setNavOpen(false);
    if (siteNav.contains(document.activeElement)) document.activeElement.blur();
});

const typewriter = document.getElementById("typewriter");

// The phrases live in the page: data-phrases="one|two|three" on #typewriter
const phrases = typewriter && typewriter.dataset.phrases ? typewriter.dataset.phrases.split("|") : [];

const typingSpeed = 60; // milliseconds per character
const deletingSpeed = 30; // milliseconds per character
const pauseAfterTyped = 1400; // milliseconds to pause after typing a phrase
const pausedAfterDeleted = 300; // milliseconds to pause after deleting a phrase

let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;

function tick() {
    const currentPhrase = phrases[phraseIndex];

    charIndex += isDeleting ? -1 : 1;
    typewriter.textContent = currentPhrase.substring(0, charIndex);

    let delay = isDeleting ? deletingSpeed : typingSpeed;

    if (!isDeleting && charIndex === currentPhrase.length) {
        delay = pauseAfterTyped;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        delay = pausedAfterDeleted;
        // Alternate the typed line (and its cursor, bg-current) between the two accent colours
        typewriter.parentElement.classList.toggle("text-blue", phraseIndex % 2 === 0);
        typewriter.parentElement.classList.toggle("text-orange", phraseIndex % 2 === 1);
    }

    setTimeout(tick, delay);
}

if (phrases.length) {
    // Invisible copies of every phrase share the typed line's grid cell (see index.html),
    // so the heading is always as tall as the longest phrase at the current width and
    // doesn't grow and shrink as a phrase wraps onto a second line mid-typing.
    // The trailing no-break space leaves room for the cursor.
    const typedLine = typewriter.parentElement;
    phrases.forEach((phrase) => {
        const ghost = document.createElement("span");
        ghost.className = "invisible col-start-1 row-start-1";
        ghost.setAttribute("aria-hidden", "true");
        ghost.textContent = phrase + " ";
        typedLine.before(ghost);
    });
    tick();
}
