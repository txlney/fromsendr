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
    "maximize your ROI",
    "retain your customers",
    "increase your revenue",
    "grow your business",
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

if (typewriter) {
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

// Scroll-linked charts: each [data-scroll-chart] gets a --progress value (0 to 1)
// that runs from 0 when its top enters the bottom of the viewport to 1 when its
// centre reaches ~40% down the viewport. Charts use --progress in styles.css.
const scrollCharts = Array.from(document.querySelectorAll("[data-scroll-chart]"), (el) => ({ el, last: null }));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const updateScrollCharts = () => {
    const vh = window.innerHeight;
    // Read every rect before writing any styles, so the loop doesn't force a
    // layout per chart
    const progresses = scrollCharts.map(({ el }) => {
        const rect = el.getBoundingClientRect();
        const end = vh * 0.6 - rect.height / 2;
        return reduceMotion ? 1 : Math.min(1, Math.max(0, (vh - rect.top) / (vh - end)));
    });

    scrollCharts.forEach((chart, i) => {
        const progress = progresses[i].toFixed(4);
        // Charts sit at 0 or 1 most of the time: skip the style write then
        if (progress === chart.last) return;
        chart.last = progress;
        chart.el.style.setProperty("--progress", progress);
    });
};

if (scrollCharts.length) updateScrollCharts();

// Slide-up reveal: any [data-reveal] element slides up out of its own bottom edge,
// once, when its top reaches 75% down the viewport (styles.css has the visuals).
// Checked on scroll rather than with an IntersectionObserver because the hidden
// state is translated down by the element's own height, which would skew an
// observer's trigger point for tall elements like cards.
let pendingReveals = reduceMotion ? [] : Array.from(document.querySelectorAll("[data-reveal]"));

const updateReveals = () => {
    const vh = window.innerHeight;
    const atPageEnd = vh + window.scrollY >=document.documentElement.scrollHeight - 2;
    // Subtract the hidden-state offset to get where each element really sits.
    // All reads happen before any class changes, so there's no forced layout per element.
    const due = pendingReveals.map((el) => atPageEnd || el.getBoundingClientRect().top - el.offsetHeight < vh * 0.75);
    let batch = 0;

    // Elements revealed in the same frame (e.g. side-by-side cards) are staggered top-down
    pendingReveals = pendingReveals.filter((el, i) => {
        if (!due[i]) return true;
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

    // After a frame, so the hidden state has been painted and the transition runs
    requestAnimationFrame(updateReveals);
}

// One rAF-throttled scroll/resize handler drives both charts and reveals. It's
// only attached if the page has either, and detaches once there's nothing left
// to do (charts stay live; reveals run out once everything has been shown).
let scrollTicking = false;

const onScrollFrame = () => {
    scrollTicking = false;
    if (scrollCharts.length) updateScrollCharts();
    if (pendingReveals.length) updateReveals();
    if (!scrollCharts.length && !pendingReveals.length) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
    }
};

const onScroll = () => {
    if (!scrollTicking) {
        scrollTicking = true;
        requestAnimationFrame(onScrollFrame);
    }
};

if (scrollCharts.length || pendingReveals.length) {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
}

// Every page's hero: full screen at the top, shrinks (.hero-shrink in styles.css) as soon as
// the page scrolls at all, so the next section comes up quickly; grows back at the top.
// Off under reduced motion, where it just stays full height.
const heroShrink = document.querySelector(".hero-shrink");

if (heroShrink && !reduceMotion) {
    const updateHero = () => heroShrink.classList.toggle("is-collapsed", window.scrollY > 0);
    updateHero();
    window.addEventListener("scroll", updateHero, { passive: true });
    // The shrink moves the page without a scroll event, so re-check the reveals after it
    heroShrink.addEventListener("transitionend", (e) => {
        if (e.target === heroShrink) onScroll();
    });

    // In-page links inside the hero (the jump chips, contact's "Pick a time"): collapse the hero
    // instantly before scrolling, otherwise the target moves up by the shrink mid-scroll and lands
    // off screen. The target's position comes from offsetTop, which ignores transforms, because a
    // not-yet-revealed [data-reveal] target is still translated down by its own height.
    heroShrink.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener("click", (e) => {
            const target = document.querySelector(link.getAttribute("href"));
            if (!target) return;
            e.preventDefault();
            heroShrink.style.transition = "none";
            heroShrink.classList.add("is-collapsed");
            heroShrink.offsetHeight; // apply the collapsed height before the transition comes back
            heroShrink.style.transition = "";
            let top = 0;
            for (let el = target; el; el = el.offsetParent) top += el.offsetTop;
            top -= parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
            window.scrollTo({ top, behavior: "smooth" });
        });
    });
}

// Work page: continuously scrolling email marquee. Position is tracked in JS
// (rAF) rather than a CSS animation so pausing can never desync it or cause
// it to snap/restart - it's just a boolean that stops the offset advancing.
// Under reduced motion it never starts, so the strip is just a static row.
const marquee = document.querySelector(".marquee");

if (marquee && !reduceMotion) {
    const marqueeTrack = marquee.querySelector(".marquee-track");
    const speed = 40; // pixels per second
    // Only mouse-like pointers (canHover, above) pause the marquee on
    // contact. Touch has no real "hover," so pausing on touch just meant the
    // strip stopped every time someone tried to scroll a tall card - on
    // mobile it now keeps scrolling underneath instead, uninterrupted.
    let paused = false;
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
        marquee.addEventListener("pointerleave", () => { paused = false; });
    }

    let frame = null;

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

        frame = requestAnimationFrame(step);
    };

    measureLoopWidth();
    window.addEventListener("resize", measureLoopWidth);

    // Only run the loop while the strip is on screen. It picks up from the same
    // offset when it comes back (lastTime is reset so the gap isn't counted).
    new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && frame === null) {
            lastTime = null;
            frame = requestAnimationFrame(step);
        } else if (!entry.isIntersecting && frame !== null) {
            cancelAnimationFrame(frame);
            frame = null;
        }
    }).observe(marquee);
}