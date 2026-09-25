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

if (typewriter) tick();

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

// Slide-up reveal: any [data-reveal] element slides up out of its own bottom edge,
// once, when its top reaches 75% down the viewport (styles.css has the visuals).
// Checked on scroll rather than with an IntersectionObserver because the hidden
// state is translated down by the element's own height, which would skew an
// observer's trigger point for tall elements like cards.
let pendingReveals = reduceMotion ? [] : Array.from(document.querySelectorAll("[data-reveal]"));

const updateReveals = () => {
    const vh = window.innerHeight;
    const atPageEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    let batch = 0;

    // Elements revealed in the same frame (e.g. side-by-side cards) are staggered top-down
    pendingReveals = pendingReveals.filter((el) => {
        // Subtract the hidden-state offset to get where the element really sits
        const top = el.getBoundingClientRect().top - el.offsetHeight;
        if (top >= vh * 0.75 && !atPageEnd) return true;
        el.style.setProperty("--reveal-delay", batch++ * 0.12 + "s");
        el.classList.add("is-revealed");
        return false;
    });
};

if (pendingReveals.length) {
    pendingReveals.forEach((el) => {
        el.classList.add("reveal-ready");
        // Once it's in place, drop the reveal classes so the element is back to its
        // normal styles (restores its own transitions, unclips its shadow, etc).
        el.addEventListener("transitionend", function done(e) {
            if (e.target !== el || e.propertyName !== "translate" || !el.classList.contains("is-revealed")) return;
            el.classList.remove("reveal-ready", "is-revealed");
            el.style.removeProperty("--reveal-delay");
            el.removeEventListener("transitionend", done);
        });
    });

    let revealTicking = false;
    const onRevealScroll = () => {
        if (!revealTicking) {
            revealTicking = true;
            requestAnimationFrame(() => {
                revealTicking = false;
                updateReveals();
            });
        }
    };
    window.addEventListener("scroll", onRevealScroll, { passive: true });
    window.addEventListener("resize", onRevealScroll);
    // After a frame, so the hidden state has been painted and the transition runs
    requestAnimationFrame(updateReveals);
}

// Work page: continuously scrolling email marquee. Position is tracked in JS
// (rAF) rather than a CSS animation so pausing can never desync it or cause
// it to snap/restart - it's just a boolean that stops the offset advancing.
const marquee = document.querySelector(".marquee");
const marqueeTrack = marquee ? marquee.querySelector(".marquee-track") : null;

if (marqueeTrack) {
    const speed = 40; // pixels per second
    // Only mouse-like pointers (canHover, above) pause the marquee on
    // contact. Touch has no real "hover," so pausing on touch just meant the
    // strip stopped every time someone tried to scroll a tall card - on
    // mobile it now keeps scrolling underneath instead, uninterrupted.
    let paused = reduceMotion;
    let offset = 0;
    let lastTime = null;
    let loopWidth = 0;

    const measureLoopWidth = () => {
        const cards = marqueeTrack.querySelectorAll(".marquee-card");
        const half = cards.length / 2;
        // Set A and Set B are identical, so the distance from the first card
        // to the first card of the second set is exactly one seamless loop.
        loopWidth = cards[half].getBoundingClientRect().left - cards[0].getBoundingClientRect().left;
    };

    if (canHover) {
        marquee.addEventListener("pointerenter", () => { paused = true; });
        marquee.addEventListener("pointerleave", () => { paused = reduceMotion; });
        marquee.addEventListener("pointercancel", () => { paused = reduceMotion; });
    }

    const step = (time) => {
        if (lastTime === null) lastTime = time;
        // Cap the per-frame delta: mobile browsers can suspend rAF mid-gesture
        // (e.g. iOS Safari during a native touch-scroll) and fire the next
        // frame long after, which would otherwise jump the offset forward all
        // at once - this is almost certainly the "snapping" on mobile.
        const delta = Math.min(time - lastTime, 100);
        lastTime = time;

        if (!paused && loopWidth > 0) {
            offset = (offset + (speed * delta) / 1000) % loopWidth;
            marqueeTrack.style.transform = `translateX(${-offset}px)`;
        }

        requestAnimationFrame(step);
    };

    measureLoopWidth();
    window.addEventListener("resize", measureLoopWidth);
    if (!reduceMotion) requestAnimationFrame(step);
}

const aboutVideo = document.getElementById("about-video");
aboutVideo.playbackRate = 0.8;
