# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Marketing site for "FromSendr" (email-marketing agency, UK): `index.html` landing page, `work.html` portfolio, and `contact.html` (Calendly booking embed). Plain static site: those three pages, `styles.css`, `script.js`, `work.js`, `tailwind-config.js`, and `images/`. There is no package.json, build step, linter, or test suite.

## Running

Open `index.html` in a browser, or serve the folder statically (e.g. `python -m http.server`). Serving from the root is preferable: the hero background is referenced as `/images/hero-bg.png` (absolute path), which breaks when opened via `file://`.

Tailwind is loaded at runtime from the CDN (`cdn.tailwindcss.com`), so an internet connection is needed for styling and fonts (Fraunces + Inter from Google Fonts).

## Architecture

- **Tailwind config lives in `tailwind-config.js`**, shared by all three pages and loaded right after the CDN script: custom colours (`paper`, `paperdark`, `ink`, `stone`, `deepgreen`, `accent`, `mint`, `gold`) and fonts (`font-display` = Fraunces, `font-sans` = Inter). Use these tokens in class names rather than raw hex.
- **`styles.css` only holds what Tailwind utilities can't express**: the site nav mechanics (`.site-logo`/`.site-nav`, see below), nav-link hover underlines (`.nav-link`, `.nav-link-selected`) plus a mobile media query that disables them, the shared button component (below), the scroll-driven chart styles, and the work-page-only `.email-skeleton`/`.marquee*` rules (see below). Its `:root` CSS variables are a separate palette from the Tailwind one and have slightly different values (e.g. `--color-ink`, `--color-stone`), so the two are not in sync. The donut gradient hardcodes hex values too.
- **Buttons: every CTA is `<a class="btn ...">` with a trailing `<svg class="btn-arrow">`.** `.btn` (in `styles.css`) sets the look: outline style, Fraunces, padding/size, shadow, and a hover fill that slides in. Colours come from `--btn-color`/`--btn-bg`/`--btn-border`/`--btn-fill`/`--btn-hover-color`. A variant only overrides those variables (`.btn-hero` is the translucent-dark one on the hero). The base rules use `html body :where(.btn)` (specificity 0,0,2): high enough to beat Tailwind's preflight reset (`* { border-width: 0 }`, `a { color: inherit }`) regardless of stylesheet order, low enough that Tailwind classes on the element always win. Keep per-button classes to layout (width, margins, `hidden md:flex`) and put anything visual in `styles.css`.
- **`script.js`** (vanilla JS, no modules; loaded by all three pages) does four things:
  1. Site nav on touch devices: the first tap on `.site-logo` adds `.is-open` to `#site-nav` instead of navigating (a second tap follows the link); tapping elsewhere or Escape closes it. On hover devices the nav is pure CSS.
  2. Hero typewriter: cycles through the `phrases` array into `#typewriter` (no-ops when `#typewriter` isn't present, i.e. on `work.html`/`contact.html`).
  3. Scroll-linked charts (see below).
  4. Work-page marquee: rAF-driven auto-scroll of `.marquee-track` (not a CSS animation, so pausing can't desync it); no-ops when `.marquee` isn't present. Pauses on hover for mouse-like pointers only (`hover: hover` + `pointer: fine`), so touch scrolling isn't interrupted.

### Site nav (all four pages)

No `<header>`: each page has a fixed, top-centre `<a class="site-logo">` (white logo PNG) followed by a sibling `<nav id="site-nav" class="site-nav">`. The logo uses `mix-blend-mode: difference`, so it renders as the inverse of whatever is behind it. That breaks if any ancestor creates a stacking context (transform, filter, opacity, isolation, z-index), which is also why the panel is a sibling rather than a wrapper. The panel is hidden above the viewport and slides down on `.site-logo:hover ~ .site-nav`, `.site-nav:hover`, focus, or `.is-open`. Hover rules are gated to `@media (hover: hover)`, and closing has a short delay so moving the pointer from the logo onto the panel doesn't drop it. The current page's link uses `.nav-link-selected`. Below `md` (a `max-width: 767px` query in `styles.css` plus `md:` classes on the nav), the logo sits top-right and the panel becomes a full-height drawer (`min(75vw, 18rem)`, full width only on tiny screens) that slides in from the right with the links stacked vertically. While it's open on touch, `script.js` locks page scroll (`overflow` on `<html>`), a huge `box-shadow` spread dims the page, and a capture-phase click listener makes a tap on the dimmed area only close the drawer.

### Scroll-chart coupling (spans all three files)

Any element with `data-scroll-chart` gets a CSS custom property `--progress` (0 to 1) set by `script.js` on scroll and resize (rAF-throttled; forced to 1 under `prefers-reduced-motion`). The visuals are driven from CSS or markup:
- `.return-donut` in `styles.css` uses `--progress` in a `conic-gradient` (350.27deg = 36/37 of a full circle).
- `.share-bar-fill` width is `--progress * --target`, where `--target` is an inline style on the element in `index.html` (`4%` and `74%`, i.e. 2% and 37% scaled by 2x for visual effect).
- `data-count-to="2.87"` makes the JS write a `$`-prefixed eased count-up into the element's `textContent`.

To add a new scroll-animated element: add `data-scroll-chart`, then consume `var(--progress)` in CSS (or add a `data-count-to`).

## Work page (`work.html`)

Copies the header/footer from `index.html` (duplicated across all three pages, keep in sync); the Tailwind config is shared. It loads `script.js` (its typewriter is guarded so it no-ops here) plus `work.js`. Each `<article data-work-item>` shows a cropped, fading email preview (`.email-preview` in `styles.css`) so long emails stay card-sized; clicking opens a `<dialog id="email-modal">` with the full email (`work.js`). `data-full` on the article is an image or an `.html` file (iframe); empty shows a placeholder skeleton. Two real case studies (CS Theory, FromSendr) are filled in; metrics in their `<dl>` are still placeholder (`00%`, `$0.00`). Below that, a continuously auto-scrolling `.marquee` strip (driven by `script.js`, see above) shows more past designs, some as real screenshots and some as flat placeholder-colour cards.

## Contact page (`contact.html`)

Also copies the header/footer. Intro text plus a Calendly inline widget (`data-url="https://calendly.com/fromsendr/30min?..."`, loaded via `assets.calendly.com/assets/external/widget.js`) and a `mailto:jake@fromsendr.com` fallback. All CTA buttons/links across the site (`index.html`, `work.html`) point here.

## Index page sections (in order)

Nav, hero (with typewriter and a "Book a call" CTA link to `contact.html`), three statistics sections (ROI, share of sales, flow revenue), a summary/CTA section (links to `contact.html`), and footer. Statistics are cited with small source links (Omnisend, SaasGoodies). There is no in-page contact section anymore — that content moved to `contact.html`.

## Gotchas

- The nav's "Services" link points to `#` on `index.html` and to `index.html` elsewhere (no services section exists yet).
- Desktop and mobile variants of the summary CTA are separate links toggled with `hidden md:flex` / `md:hidden`, with different copy.
