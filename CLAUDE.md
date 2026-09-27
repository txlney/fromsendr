# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Marketing site for "FromSendr" (email-marketing agency, UK): `index.html` landing page, `work.html` portfolio, `about.html`, `services.html` (numbered service list + process steps, no packages), and `contact.html` (Calendly booking embed). Plain static site: those five pages, `styles.css`, `script.js`, `work.js`, the Tailwind build files (`tailwind.config.js`, `tailwind.input.css`, generated `tailwind.css`), and `images/` (`videos/` only holds unused source/old videos; no page references it). There is no package.json, linter, or test suite; the only build step is Tailwind (below).

## Running

Open `index.html` in a browser, or serve the folder statically (e.g. `python -m http.server`).

Fonts (Fraunces + Inter) come from Google Fonts, so they need an internet connection.

## Tailwind build (run after changing classes)

Tailwind is compiled ahead of time into `tailwind.css` (committed, and linked last in every page's `<head>`) by the standalone Tailwind CLI v3.4.17, a single exe, no Node needed. It lives in `.tools/tailwindcss.exe` (git-ignored; re-download from https://github.com/tailwindlabs/tailwindcss/releases/download/v3.4.17/tailwindcss-windows-x64.exe if missing).

- Build once: `.tools/tailwindcss.exe -i tailwind.input.css -o tailwind.css`
- While editing: add `--watch` to rebuild on every save.

Only classes that appear in the files listed in `tailwind.config.js`'s `content` (the pages, `script.js`, `work.js`) end up in `tailwind.css`, so **a class used for the first time does nothing until the build is re-run**. Class names must appear as complete strings (don't build them by concatenation in JS). Don't pass `--minify`: its minifier rewrites translucent colours like `text-stone/30` into rounded `hsla()` values, shifting them by 1/255; the unminified file is only ~2 KB larger gzipped.

## Assets (keep them small)

Pages only reference optimised assets; the large originals (2000px email PNGs, 5760px "`.jpg`" posters that are really PNGs, 1080p stock videos) are source files and must not be linked directly (they were 8-77 MB per page).
- Email screenshots: `images/work/<name>-full-thumb.webp` (800px wide, used by the work-page previews and the marquee) and `images/work/<name>-full.webp` (1200px, the modal's `data-full`).
- Hero image: `images/index-hero-bg.webp` (2560px, preloaded in `index.html`'s `<head>` because it's referenced from `styles.css` (`.hero-bg-image`), so the browser would otherwise only discover it after that stylesheet loads).
- No background videos: the work/about/contact heroes use the CSS aurora (below) instead, which costs no downloads.
- Below-the-fold `<img>`s use `loading="lazy" decoding="async"`.

## Architecture

- **Tailwind config lives in `tailwind.config.js`** (build-time, see above): custom colours (`paper`, `paperdark`, `ink`, `stone`, `deepgreen`, `accent`, `mint`, `gold`) and fonts (`font-display` = Fraunces, `font-sans` = Inter). Use these tokens in class names rather than raw hex.
- **`styles.css` only holds what Tailwind utilities can't express**: the site nav mechanics (`.site-logo`/`.site-nav`, see below), nav-link hover underlines (`.nav-link`, `.nav-link-selected`) plus a mobile media query that disables them, the shared button component (below), the scroll-driven chart styles, the `.hero-bg` index hero and `.aurora` hero backgrounds, and the work-page-only `.email-skeleton`/`.marquee*` rules (see below). Its `:root` CSS variables are a separate palette from the Tailwind one and have slightly different values (e.g. `--color-ink`, `--color-stone`), so the two are not in sync. The donut gradient hardcodes hex values too.
- **Buttons: every CTA is `<a class="btn ...">` with a trailing `<svg class="btn-arrow">`.** `.btn` (in `styles.css`) sets the look: outline style, Fraunces, padding/size, shadow, and a hover fill that slides in. Colours come from `--btn-color`/`--btn-bg`/`--btn-border`/`--btn-fill`/`--btn-hover-color`. A variant only overrides those variables (`.btn-hero` is the translucent-dark one on the hero). The base rules use `html body :where(.btn)` (specificity 0,0,2): high enough to beat Tailwind's preflight reset (`* { border-width: 0 }`, `a { color: inherit }`) regardless of stylesheet order, low enough that Tailwind classes on the element always win. Keep per-button classes to layout (width, margins, `hidden md:flex`) and put anything visual in `styles.css`.
- **`script.js`** (vanilla JS, no modules; loaded by every page) does five things:
  1. Site nav on touch devices: the first tap on `.site-logo` adds `.is-open` to `#site-nav` instead of navigating (a second tap follows the link); tapping elsewhere or Escape closes it. On hover devices the nav is pure CSS.
  2. Hero typewriter: cycles through the `phrases` array into `#typewriter` (no-ops when `#typewriter` isn't present, i.e. on `work.html`/`contact.html`).
  3. Scroll-linked charts and `[data-reveal]` slide-ups (see below). One rAF-throttled scroll/resize listener drives both, only attached when the page has either.
  4. Work-page marquee: rAF-driven auto-scroll of `.marquee-track` (not a CSS animation, so pausing can't desync it); no-ops when `.marquee` isn't present. The loop only runs while the strip is on screen (IntersectionObserver). Pauses on hover for mouse-like pointers only (`hover: hover` + `pointer: fine`), so touch scrolling isn't interrupted.
  5. Hero shrink (`.hero-shrink`) and its in-hero `#` jump links (see Split heroes).

### Site nav (all pages)

No `<header>`: each page has a fixed, top-centre `<a class="site-logo">` (white logo PNG) followed by a sibling `<nav id="site-nav" class="site-nav">`. The logo uses `mix-blend-mode: difference`, so it renders as the inverse of whatever is behind it. That breaks if any ancestor creates a stacking context (transform, filter, opacity, isolation, z-index), which is also why the panel is a sibling rather than a wrapper. The panel is hidden above the viewport and slides down on `.site-logo:hover ~ .site-nav`, `.site-nav:hover`, focus, or `.is-open`. Hover rules are gated to `@media (hover: hover)`, and closing has a short delay so moving the pointer from the logo onto the panel doesn't drop it. The current page's link uses `.nav-link-selected`. Below `md` (a `max-width: 767px` query in `styles.css` plus `md:` classes on the nav), the logo sits top-right and the panel becomes a full-height drawer (`min(75vw, 18rem)`, full width only on tiny screens) that slides in from the right with the links stacked vertically. While it's open on touch, `script.js` locks page scroll (`overflow` on `<html>`), a huge `box-shadow` spread dims the page, and a capture-phase click listener makes a tap on the dimmed area only close the drawer.

### Scroll-chart coupling (spans `index.html`, `styles.css`, `script.js`)

Any element with `data-scroll-chart` gets a CSS custom property `--progress` (0 to 1) set by `script.js` on scroll and resize (rAF-throttled; forced to 1 under `prefers-reduced-motion`). The visuals are driven from CSS or markup:
- `.return-donut` in `styles.css` uses `--progress` in a `conic-gradient` (350.27deg = 36/37 of a full circle).
- `.share-bar-fill` width is `--progress * --target`, where `--target` is an inline style on the element in `index.html` (`4%` and `74%`, i.e. 2% and 37% scaled by 2x for visual effect).
- `data-count-to="2.87"` makes the JS write a `$`-prefixed eased count-up into the element's `textContent`.

To add a new scroll-animated element: add `data-scroll-chart`, then consume `var(--progress)` in CSS (or add a `data-count-to`).

### Index hero (`index.html`)

A paper card (`bg-paper/85`, `backdrop-blur-md`, `rounded-[2rem]`) over `.hero-bg`, a faded, brand-tinted collage of real emails (`images/hero-bg.png` under blue/orange radial glows and a platinum wash, all in `styles.css`). The card holds an eyebrow pill, the headline with the typewriter line, one supporting line, the "Book a free call" `.btn` and a quieter "See our work" link. The typewriter alternates the typed line between `text-blue` and `text-orange` per phrase (the cursor is `bg-current`, so it follows). No pointer effects. Copy is aimed at US brands: US spelling, no mention of the UK.

### Aurora hero background (work, about, contact)

Pure-CSS replacement for the old background videos. The first-screen wrapper (`relative min-h-svh`) starts with `<div class="aurora" aria-hidden="true">` containing four `<span class="aurora-blob aurora-blob-N">`; `aurora-light` is the pale variant (dark text on top) and `aurora-light aurora-brand` recolours its glows to the site palette (blue/orange/navy on platinum); all four split heroes use the latter. Each blob is a soft `radial-gradient` whose colour, start position, drift target (`--blob-to`), scale, duration and negative delay are per-blob variables in `styles.css`; only `transform` animates (no `filter: blur`, for performance), a static SVG-noise `::after` adds grain, and `prefers-reduced-motion` stops it. Like the videos before it, it has no z-index so it doesn't create a stacking context around the logo.

### Split heroes (services, work, about, contact)

Inside `.hero-shrink`, each page's intro is a two-column grid (stacked below `lg`): an eyebrow pill, a headline with one word in `text-blue`, a line of copy, and jump-link chips (`<a href="#id">` to `scroll-mt-8` sections further down), next to a static, `aria-hidden` collage of the same div-built illustrations and stickers used lower on the page. The collage is a square box with its pieces absolutely positioned in `%`, so it scales. It has no motion by design (only the aurora drifts). `script.js` intercepts `#` links inside the hero: it collapses the hero instantly, then scrolls to the target's `offsetTop` position (not `scrollIntoView`, because a not-yet-revealed `[data-reveal]` target is still translated down). Contact differs: `.hero-short` (75svh, 60svh collapsed), a "Pick a time" `.btn` to `#booking` instead of chips, no scroll cue, and the collage is `hidden lg:block` so the Calendly widget stays near the top on phones.

## Work page (`work.html`)

Copies the header/footer from `index.html` (duplicated across every page, keep in sync); the Tailwind build is shared. It loads `script.js` (its typewriter is guarded so it no-ops here) plus `work.js`. The portfolio is a "Selected work" grid (1/2/3 columns at base/`sm`/`lg`): a full-width featured project (CS Theory abandoned cart, dark panel, with facts rather than metrics), then six cards: three real emails (FromSendr, Buccaneers, CS Theory "Clay vs Powder"), two placeholders, and a closing "Your brand could be next" link to `contact.html`. Keep the card count a multiple of 6 so both layouts end on a full row. Each `<article data-work-item>` has a `<button data-open-email>` showing a cropped, fading email preview (`.email-preview` in `styles.css`) so long emails stay card-sized; clicking opens a `<dialog id="email-modal">` with the full email (`work.js`). `data-full` on the article is an image or an `.html` file (iframe); empty shows a placeholder skeleton. Placeholders use `.email-skeleton` (tint modifiers `-orange`/`-stone`/`-dark`). Below the grid, a dark "From the archive" band holds the continuously auto-scrolling `.marquee` (driven by `script.js`, see above; edges faded with `mask-image`), alternating real screenshots with tinted skeleton cards. Its card list is duplicated (Set B) for the seamless loop, so edit both sets together.

## Contact page (`contact.html`)

Also copies the header/footer. Intro text plus a Calendly inline widget (`data-url="https://calendly.com/fromsendr/30min?..."`, loaded via `assets.calendly.com/assets/external/widget.js`) and a `mailto:jake@fromsendr.com` fallback. All CTA buttons/links across the site (`index.html`, `work.html`) point here.

## Index page sections (in order)

Nav, hero (with typewriter and a "Book a call" CTA link to `contact.html`), three statistics sections (ROI, share of sales, flow revenue), a summary/CTA section (links to `contact.html`), and footer. Statistics are cited with small source links (Omnisend, SaasGoodies). There is no in-page contact section anymore — that content moved to `contact.html`.

## Gotchas

- `tailwind.css` must stay after `styles.css` in `<head>`: that's the order the old CDN setup produced (it injected its `<style>` last), and some rules rely on Tailwind winning ties.
- Desktop and mobile variants of the summary CTA are separate links toggled with `hidden md:flex` / `md:hidden`, with different copy.
