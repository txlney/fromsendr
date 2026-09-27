# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Marketing site for "FromSendr" (email-marketing agency, UK; copy is aimed at US brands, so US spelling and no mention of the UK). Plain static site with five pages: `index.html` (landing), `services.html`, `work.html` (portfolio), `about.html`, `contact.html` (Calendly booking). Also `styles.css`, `script.js` (every page), `work.js` (work page only), the Tailwind build files (`tailwind.config.js`, `tailwind.input.css`, generated `tailwind.css`) and `images/`. There is no package.json, linter or test suite; the only build step is Tailwind (below).

## Running

Open `index.html` in a browser, or serve the folder statically (e.g. `python -m http.server`).

Fonts (Poppins for body/UI, Fraunces for `font-display`) come from one Google Fonts request per page, so they need an internet connection. It only asks for the weights in use (Poppins 400/600/700 + 700 italic, Fraunces 400/600). If you add a new weight class (e.g. `font-medium`) or italic, add it to that URL on every page.

## Tailwind build (run after changing classes)

Tailwind is compiled ahead of time into `tailwind.css` (committed, and linked last in every page's `<head>`) by the standalone Tailwind CLI v3.4.17, a single exe, no Node needed. It lives in `.tools/tailwindcss.exe` (git-ignored; re-download from https://github.com/tailwindlabs/tailwindcss/releases/download/v3.4.17/tailwindcss-windows-x64.exe if missing).

- Build once: `.tools/tailwindcss.exe -i tailwind.input.css -o tailwind.css`
- While editing: add `--watch` to rebuild on every save.

Only classes that appear in the files listed in `tailwind.config.js`'s `content` (the pages, `script.js`, `work.js`) end up in `tailwind.css`, so **a class used for the first time does nothing until the build is re-run** (and removed classes linger until it is). Class names must appear as complete strings (don't build them by concatenation in JS). Don't pass `--minify`: its minifier rewrites translucent colours like `text-stone/30` into rounded `hsla()` values, shifting them by 1/255; the unminified file is only ~2 KB larger gzipped.

## Assets (keep them small)

Pages only reference optimised assets. The large originals are source files and must not be linked directly: `images/work/<name>-full.png` (7-29 MB email screenshots), `images/hero-bg.png` (4 MB), `images/wordmark-platinum.png` (3689px wide).
- Email screenshots: `images/work/<name>-full-thumb.webp` (800px wide; work-page previews, hero collage and marquee) and `images/work/<name>-full.webp` (1200px; the modal's `data-full`).
- Index hero: `images/hero-bg.webp` (2560px, q80). It's referenced from `styles.css` (`.hero-bg`), so `index.html` preloads it; otherwise the browser would only find it after that stylesheet loads.
- Footer wordmark: `images/wordmark-platinum-footer.webp` (400px). The nav uses `images/wordmark-platinum-nav.png` (614x128, see Site nav).
- To make a new optimised copy, Pillow works (`python -m pip install pillow`, then save as WEBP with `method=6`).
- `images/people/` holds unused founder photos; the about page currently shows `images/pfp.png` for both founders.
- Other heroes use the CSS aurora (below), which costs no downloads.
- Below-the-fold `<img>`s (footer logos, founder photos, stickers, grid/marquee thumbs) use `loading="lazy" decoding="async"`.

## Architecture

- **Tailwind config lives in `tailwind.config.js`**: colours `paper`, `paperdark`, `ink`, `stone`, `blue`, `platinum`, `silver`, `navy`, `orange`, and fonts `font-sans` (Poppins, the body default) and `font-display` (Fraunces, used for small accents like number chips, "Aa" and calendar labels). Use these tokens in class names rather than raw hex.
- **`styles.css` only holds what Tailwind utilities can't express**: site nav mechanics, nav/footer link hovers, the `.btn` component, hero shrink, `.hero-bg` and `.aurora` backgrounds, scroll charts, `[data-reveal]` slide-ups, `.sticker`, and the work page's `.email-preview`/`.email-skeleton`/`.marquee*` rules. Its `:root` CSS variables are a separate palette from the Tailwind one; most values match, but `--color-paper` is `#FDFDFD` vs Tailwind `paper` `#FAFAF8`. Some rules (donut gradient, aurora, skeleton tints) hardcode hex/rgba too.
- **Buttons: every main CTA is `<a class="btn ...">` with a trailing `<svg class="btn-arrow">`.** `.btn` sets the look: solid blue with platinum Poppins text, rounded, shadow, and a platinum fill that slides in on hover/focus (text turns navy). Colours come from `--btn-color`/`--btn-bg`/`--btn-border`/`--btn-fill`/`--btn-hover-color`, so a variant only overrides those. The base rules use `html body :where(.btn)` (specificity 0,0,2): high enough to beat Tailwind's preflight reset (`* { border-width: 0 }`, `a { color: inherit }`) regardless of stylesheet order, low enough that Tailwind classes on the element always win. Keep per-button classes to layout (width, margins, gap) and put anything visual in `styles.css`. Secondary links ("See our work", "Ask us directly") are plain text links with an orange `&rarr;` that nudges right on hover.
- **Header, footer and the navy CTA card are duplicated in every page**: keep them in sync. The CTA card (text + `.btn` beside a decorative "30 min strategy call" card) is shared by work/about/services with different copy.
- **`script.js`** (vanilla JS, no modules) does five things, each a no-op on pages without the relevant markup:
  1. Site nav on touch devices (see below).
  2. Hero typewriter on `index.html` (`#typewriter`).
  3. Scroll-linked charts and `[data-reveal]` slide-ups. One rAF-throttled scroll/resize listener drives both, attached only when the page has either.
  4. Work-page marquee: rAF-driven auto-scroll of `.marquee-track` (not a CSS animation, so pausing can't desync it). Runs only while on screen (IntersectionObserver), pauses on hover for mouse-like pointers only (`hover: hover` + `pointer: fine`) so touch scrolling isn't interrupted, and never starts under `prefers-reduced-motion`.
  5. Hero shrink (`.hero-shrink`) and its in-hero `#` jump links (see Heroes).

### Site nav (all pages)

No `<header>`: each page has a fixed, top-centre `<a class="site-logo">` followed by a sibling `<nav id="site-nav" class="site-nav">`. The logo is the whole white wordmark clipped to just the icon (`.site-logo-mark`, ratios from the 614x128 image with a 137px icon); opening the nav widens the clip to reveal the name. It uses `mix-blend-mode: difference`, so it renders as the inverse of whatever is behind it. That breaks if any ancestor creates a stacking context (transform, filter, opacity, isolation, z-index), which is also why the panel is a sibling rather than a wrapper, and why hero backgrounds have no z-index. The navy panel is hidden above the viewport and slides down on `.site-logo:hover ~ .site-nav`, `.site-nav:hover`, focus, or `.is-open`. Hover rules are gated to `@media (hover: hover)`, and closing has a short delay so moving the pointer from the logo onto the panel doesn't drop it. The current page's link uses `.nav-link-selected`. Nav/footer link hover fades and the nav's sliding underline are desktop-only (`min-width: 768px`).

Below `md` (a `max-width: 767px` query plus `md:` classes on the nav), the logo sits top-right and the panel becomes a full-height drawer (`min(75vw, 18rem)`, full width only on tiny screens) that slides in from the right. On touch, the first tap on the logo opens it instead of navigating (a second tap follows the link); tapping elsewhere or Escape closes it. While open, `script.js` locks page scroll (`overflow` on `<html>`, so it can't clash with the work modal's lock on `<body>`), a huge `box-shadow` spread dims the page, and a capture-phase click listener makes a tap on the dimmed area only close the drawer.

### Heroes

Every page's first screen is wrapped in `.hero-shrink`: full screen height, shrinking to 80svh as soon as the page scrolls at all (`.is-collapsed`, added by `script.js`; off under reduced motion). `html:has(.hero-shrink)` disables scroll anchoring, which would otherwise undo the shrink. Each hero has a `.hero-cue` ("See the numbers", "What we do"...) with a bouncing arrow at the bottom that fades out on collapse.

- **Index**: a paper card (`bg-paper/85`, `backdrop-blur-md`, `rounded-[2rem]`) over `.hero-bg`, a faded, brand-tinted collage of real emails (`hero-bg.webp` under blue/orange radial glows and a platinum wash). The card holds an eyebrow pill, the headline with the typewriter line, one supporting line, the "Book a free call" `.btn` and a "See our work" text link. The typewriter cycles `phrases` in `script.js` and alternates the typed line between `text-blue` and `text-orange` (the cursor is `bg-current`, so it follows). Invisible copies of every phrase share the line's grid cell so the heading never changes height while typing.
- **Services, work, about, contact (split heroes)**: `<div class="aurora" aria-hidden="true">` with four `<span class="aurora-blob aurora-blob-N">`, a pure-CSS background of drifting blue/orange/navy glows on platinum. Each blob is a soft `radial-gradient` whose colour, start position, drift target (`--blob-to`), scale, duration and negative delay are per-blob variables in `styles.css`; only `transform` animates (no `filter: blur`, for performance), a static SVG-noise `::after` adds grain, and reduced motion stops it. Over it, a two-column grid (stacked below `lg`): an eyebrow pill, a headline with one word in `text-blue font-bold italic`, a line of copy and jump-link chips (`<a href="#id">` to `scroll-mt-8` sections further down), next to a static, `aria-hidden` collage of the div-built illustrations and stickers used lower on the page. The collage is a square box with pieces absolutely positioned in `%`, so it scales. `script.js` intercepts `#` links inside the hero: it collapses the hero instantly, then scrolls to the target's `offsetTop` position (not `scrollIntoView`, because a not-yet-revealed `[data-reveal]` target is still translated down).
- **Contact differs**: `.hero-short` (75svh, 60svh collapsed), a "Pick a time" `.btn` to `#booking` instead of chips, no scroll cue, and the collage is `hidden lg:block` so the Calendly widget stays near the top on phones.

### Scroll-linked charts (index and services)

Any element with `data-scroll-chart` gets a CSS custom property `--progress` (0 to 1) from `script.js`: 0 when its top enters the viewport, 1 when its centre is ~40% down (forced to 1 under reduced motion). The visuals are pure CSS:
- `.return-donut` uses it in a `conic-gradient` (350.27deg = 36/37 of a full circle).
- `.share-bar-fill` width is `--progress * --target`, with `--target` an inline style: index's $0.18 vs $2.87 bars are `6%`/`100%`, its 2% vs 37% bars `6%`/`74%` (scaled for visual effect); services' A/B bars are `52%`/`88%`.

To add one: put `data-scroll-chart` on the element and consume `var(--progress)` in CSS.

### Slide-up reveals and stickers

`[data-reveal]` elements slide up out of their own bottom edge once, when their top reaches 75% down the viewport (or at the page end); several revealed in one frame are staggered. `script.js` adds `.reveal-ready` (hidden state, `translate` + `clip-path`), then `.is-revealed`, and removes both after the transition so the element gets its own styles back. Without JS or under reduced motion, everything just shows. A `.sticker` (image or SVG) inside a revealed card hangs off its top-right corner and slaps on with a bounce after the reveal (about page).

## Page contents

- **Index**: hero; "Email isn't just an inbox / It's a revenue stream"; three stat cards ($36 per $1 donut, $2.87 automated vs $0.18 scheduled bars, 2% of sends vs 37% of sales bars) with small source links (Omnisend, SaasGoodies); a paper summary section ("More emails ≠ More results", three "mistakes we see most" cards with div illustrations) ending in a "How we do it" `.btn` to `services.html`. `#statistics` is linked from the footer.
- **Services**: approach blurb; five numbered service cards (`#copy-design`, `#flows`, `#campaigns`, `#deliverability`, `#ab-testing`), each a coloured illustration panel beside copy and tag pills, alternating sides on `md+`, panel colours cycling blue/navy/orange; `#process` (4 steps); `#faq` (native `<details>` accordion); CTA card. No packages or prices.
- **Work**: a "Selected work" grid (1/2/3 columns at base/`sm`/`lg`): a full-width featured project (`#featured`, CS Theory abandoned cart, dark panel with facts rather than metrics), then six cards (three real emails, two `.email-skeleton` placeholders, and a closing "Your brand could be next" link to `contact.html`). Keep the card count a multiple of 6 so both layouts end on a full row. Each `<article data-work-item>` has a `<button data-open-email>` showing a cropped, fading preview (`.email-preview`); clicking opens `<dialog id="email-modal">` with the full email (`work.js`). `data-full` on the article is an image or an `.html` file (iframe); empty shows a tall skeleton. Placeholders use `.email-skeleton` (tints `-orange`/`-stone`/`-dark`). Below, `#archive` is a dark band with the auto-scrolling `.marquee` (edges faded with `mask-image`); its card list is duplicated (Set B, `aria-hidden`) for the seamless loop, so edit both sets together. Then the CTA card. The footer has an extra "*" disclaimer about portfolio pieces.
- **About**: `#story`; two cards `#what-we-do` and `#different` (with stickers); founders (Jake, Tom); CTA card.
- **Contact**: a Calendly inline widget in `#booking` (`data-url="https://calendly.com/fromsendr/30min?..."`, loaded via `assets.calendly.com/assets/external/widget.js`, with preconnects in `<head>`) and a `mailto:jake@fromsendr.com` fallback. Every "book a call" CTA across the site points here.

## Gotchas

- `tailwind.css` must stay after `styles.css` in `<head>`: some rules rely on Tailwind winning ties.
- The index hero background URL lives in two places: `styles.css` (`.hero-bg`) and the preload in `index.html`. Change both together.
