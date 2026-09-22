# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Marketing site (`index.html` landing page plus `work.html` portfolio) for "FromSendr" (email-marketing agency, UK). Plain static site: `index.html`, `work.html`, `styles.css`, `script.js`, `work.js`, and `images/`. There is no package.json, build step, linter, or test suite.

## Running

Open `index.html` in a browser, or serve the folder statically (e.g. `python -m http.server`). Serving from the root is preferable: the hero background is referenced as `/images/hero-bg.png` (absolute path), which breaks when opened via `file://`.

Tailwind is loaded at runtime from the CDN (`cdn.tailwindcss.com`), so an internet connection is needed for styling and fonts (Fraunces + Inter from Google Fonts).

## Architecture

- **Tailwind config lives in `tailwind-config.js`**, shared by both pages and loaded right after the CDN script: custom colours (`paper`, `paperdark`, `ink`, `stone`, `deepgreen`, `accent`, `mint`, `gold`) and fonts (`font-display` = Fraunces, `font-sans` = Inter). Use these tokens in class names rather than raw hex.
- **`styles.css` only holds what Tailwind utilities can't express**: hover-underline effects (`.nav-link`, `.button-underline`, `.button-underline-dark`), a mobile media query that disables those hover effects, and the scroll-driven chart styles. Its `:root` CSS variables are a separate palette from the Tailwind one and have slightly different values (e.g. `--color-ink`, `--color-stone`), so the two are not in sync. The donut gradient hardcodes hex values too.
- **`script.js`** (vanilla JS, no modules) does three things:
  1. Mobile menu: a `<details id="mobile-menu">` element; JS closes it on backdrop click, link click, or Escape, and toggles `overflow-hidden` on `<body>`.
  2. Hero typewriter: cycles through the `phrases` array into `#typewriter`.
  3. Scroll-linked charts (see below).

### Scroll-chart coupling (spans all three files)

Any element with `data-scroll-chart` gets a CSS custom property `--progress` (0 to 1) set by `script.js` on scroll and resize (rAF-throttled; forced to 1 under `prefers-reduced-motion`). The visuals are driven from CSS or markup:
- `.return-donut` in `styles.css` uses `--progress` in a `conic-gradient` (350.27deg = 36/37 of a full circle).
- `.share-bar-fill` width is `--progress * --target`, where `--target` is an inline style on the element in `index.html` (`4%` and `74%`, i.e. 2% and 37% scaled by 2x for visual effect).
- `data-count-to="2.87"` makes the JS write a `$`-prefixed eased count-up into the element's `textContent`.

To add a new scroll-animated element: add `data-scroll-chart`, then consume `var(--progress)` in CSS (or add a `data-count-to`).

## Work page (`work.html`)

Copies the header/footer from `index.html` (duplicated, keep in sync); the Tailwind config is shared. It loads `script.js` (its typewriter is guarded so it no-ops here) plus `work.js`. Each `<article data-work-item>` shows a cropped, fading email preview (`.email-preview` in `styles.css`) so long emails stay card-sized; clicking opens a `<dialog id="email-modal">` with the full email. `data-full` on the article is an image or an `.html` file (iframe); empty shows a placeholder skeleton. Content is currently placeholder ("Client Name", zero metrics).

## Index page sections (in order)

Nav, hero (with typewriter and CTA), three statistics sections (ROI, share of sales, flow revenue), a summary/CTA section, contact (currently `hidden`, and still contains placeholder `you@example.com` copy), and footer. Statistics are cited with small source links (Omnisend, SaasGoodies).

## Gotchas

- Two sections share `id="statistics"` (duplicate ID).
- CTA buttons are `<button>` elements with no handlers or links yet.
- The header has "Services" linking to `#` (no such section); "Work" links to `work.html`; "About" links to `#about`, which doesn't exist yet.
- Desktop and mobile variants of the summary CTA are separate buttons toggled with `hidden md:flex` / `md:hidden`, with different copy.
