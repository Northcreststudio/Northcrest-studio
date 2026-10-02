# 2 Amigas: interactive 3D salsa showcase

A single-page brand showcase for **2 Amigas**, a homemade salsa brand started by two best friends in Calgary. It's a sales-pitch sample built by Northcrest Studio, so it's a showcase, not a store: no cart, no checkout, and no photos. Everything on the page is either built in 3D in the browser, drawn as an SVG illustration, or done in CSS.

The look is product photography: a physically shaded glass jar on a stone counter under studio light, rendered live in the browser.

**Stack:** [Vite](https://vitejs.dev) + plain JavaScript, [Three.js](https://threejs.org) for the 3D, and [GSAP](https://gsap.com) + ScrollTrigger for the animation. It builds to a plain static folder (`dist/`) that runs on any host.

---

## Run it locally

You need Node 18 or newer.

```bash
cd samples/2-amigas
npm install
npm run dev        # http://localhost:5173 (live reload)
```

To test on your phone, run `npm run dev -- --host` and open the "Network" URL it prints on a phone that's on the same Wi-Fi.

To check the production build:

```bash
npm run build      # outputs to dist/
npm run preview    # serves dist/ at http://localhost:4173
```

### Build for a claude.ai Artifact

```bash
npm run build:artifact   # outputs artifact/ (Three.js + GSAP load from jsDelivr)
```

Publish `artifact/index.html` with the files in `artifact/assets/` and `artifact/favicon.svg` alongside it.

## Deploy

### Netlify (recommended for a shareable link)

**Option A: connect the Git repo.** In Netlify, go to *Add new site → Import an existing project* and pick this repo. Then set:

| Setting | Value |
| --- | --- |
| Base directory | `samples/2-amigas` |
| Build command | `npm run build` |
| Publish directory | `samples/2-amigas/dist` (or `dist` relative to the base) |

`netlify.toml` already contains these build settings, so normally you only need to set the **Base directory**.

**Option B: drag and drop.** Run `npm run build`, then drag the `dist/` folder onto [app.netlify.com/drop](https://app.netlify.com/drop).

### Vercel

Import the repo, set the **Root Directory** to `samples/2-amigas`, and Vercel picks up `vercel.json` (Vite framework, output `dist`).

The build uses relative paths (`base: './'` in `vite.config.js`), so `dist/` also works from a sub-folder, such as `northcreststudio.ca/samples/2-amigas/`.

---

## Where to change things

| I want to change… | Edit this file |
| --- | --- |
| **Flavours**: names, heat, copy, ingredients, pairing, colours, which 3D ingredients burst out, chip-dip messages | `src/config/flavours.js` |
| **All other text**: hero, story, recipes, markets/events, contact, footer, loading lines, nav | `src/config/content.js` |
| **Brand colours & fonts** | `src/styles/tokens.css` (CSS variables at the top) |
| **Logo** | `src/assets/logo.svg` (full lockup) and `src/assets/logo-mark.svg` (two chilies only) |
| Favicon | `public/favicon.svg` (a copy of the mark) |
| Page structure / section order | `index.html` |
| Layout & styling | `src/styles/main.css` (sections are labelled in page order) |

### Flavours

Each flavour in `src/config/flavours.js` has a short field guide at the top. A few useful fields:

- `heat` (1–5) drives the heat meter, the chili icons and the flames. At 5 the meter wobbles.
- `accent` / `accentDeep` re-tint the page when that flavour is selected.
- `salsa` / `salsaBits` set the colour of the salsa in the 3D jar, the bowl and the coated chip.
- `ingredients3D` picks which 3D ingredients fly out of the jar. Options are `tomato`, `tomatillo`, `chiliRed`, `chiliGreen`, `habanero`, `onion`, `cilantro`, `lime`, `mango` and `garlic`.

You can add a fourth flavour by adding another object to the list. The switchers, cards and jar labels all update automatically.

### Colours

The site is deliberately dark, like food shot on black. The palette is set in `tokens.css`:

| Token | Hex | Used for |
| --- | --- | --- |
| `--carbon` | `#100C0A` | Page background: charred, warm black |
| `--carbon-2` | `#17110E` | Raised sections |
| `--masa` | `#EFE5D6` | Main text: corn-masa cream |
| `--masa-dim` | `#B8AB9B` | Secondary text |
| `--brass` | `#C9A46A` | Hairlines and small highlights |
| `--chile` | `#D2442B` | Brand red (the logo's chile) |

Each flavour also brings its own accent colour (roasted tomato, tomatillo, habanero). It tints the headline, the backdrop light in the 3D scene and the heat dial.

### Fonts

The fonts are **Gloock** (display serif), **Hanken Grotesk** (body) and **Big Shoulders Text** (labels and figures), all from Google Fonts. To swap them, change the `<link>` in `index.html` and the `--font-*` tokens in `tokens.css`. The jar label is painted with the same fonts.

### Logo

The logo is a concept that Northcrest Studio designed for the pitch: a seal with two crossed chiles and "Hecho a mano · Calgary · Est. 2025" around the ring, plus a serif wordmark. All of its text is outlined (converted to paths).

To use the real logo, replace `src/assets/logo.svg` and `src/assets/logo-mark.svg` and keep the same file names. That one swap updates the nav, the footer, the loader, the **printed jar label** and the gold seal on the lid. For the cleanest result, give the new SVG explicit `width`/`height` attributes and outline its text.

Colours follow two CSS variables: ink shapes use `fill:var(--logo-ink,#1C1411)` and the red chile uses `var(--logo-accent,#B3311E)`. Keep those exact strings in a new logo if you want it to switch to cream on dark backgrounds and print in gold on the lid.

---

## What's on the page

1. **Loader**: the seal mark turns while the scene builds, with a real progress figure.
2. **Hero**: the jar on a honed basalt counter, under a studio softbox environment, a key spotlight with soft shadows and a coloured gel glow behind. The glass refracts (transmission, IOR 1.5). The salsa is wet and chunky. The paper label is printed from the logo with ingredients, a nutrition panel, a lot number and a barcode, and the lid is knurled steel with a gold seal. Drag to turn the jar. Changing flavour turns the jar until its unlabelled back faces you, swaps the salsa and label there, and brings it round.
3. **Ingredients on scroll**: the lid unscrews and lifts, then tomatoes (whole and halved), chiles, onion halves, cilantro, lime wheels, garlic, mango, tomatillos and tortilla chips rise out in slow motion. They hang in the air while the camera circles, then sink back in. Everything is built and textured in code.
4. **Flavours**: product shots of each jar (rendered by the 3D scene at load), a detail panel, and a heat dial with a brushed-steel bezel, a spring-damped needle, a Scoville readout and a real-time flame shader. At 5/5 the needle buzzes against the stop and the dial trembles.
5. **Our Story**: placeholder copy beside a rendered group shot of all three jars with produce, plus a timeline.
6. **Dip a chip**: a 3D stoneware bowl on a walnut board. Drag the tortilla chip in, and the salsa coat climbs as far as the chip goes under. Droplets fly and land on the board, ripples spread, and letting go eats the chip. A "Dip the chip" button does it for keyboard users.
7. **Recipes**: four idea cards, each linked to the salsa it pairs with.
8. **Where to buy**: placeholder Calgary markets and pop-ups linked to pins on a stylised map.
9. **Contact**: a front-end-only signup form with validation, plus wholesale details with copy buttons and social links.
10. **Footer**: logo, links, and "Website by Northcrest Studio".

## Performance, accessibility and motion

- **3D loads lazily.** Three.js loads after the page paints, and the chip-dip scene only builds when you scroll near it. Both scenes stop rendering when off screen, and the dip scene renders only while something is moving.
- **On phones**, the device pixel ratio is capped (1.5× on phones, 2× on desktop). Phones also get fewer ingredients (12 vs 22), smaller textures and shadow maps, lower-poly geometry and fewer droplets. Low-power devices use a fresnel glass shader instead of the extra refraction pass, and skip antialiasing.
- **Rendering pauses when off screen.** The WebGL loop, the flames and the splash only run while they're visible and the tab is open.
- **Touch works with scrolling.** Horizontal drags spin the jar and vertical swipes still scroll the page (`touch-action: pan-y`). The chip uses `touch-action: none` so it can be dragged freely.
- **`prefers-reduced-motion`** turns off the slow turn, the lid, the flight paths, the camera orbit, the needle overshoot and buzz, and the tremble. The ingredients simply appear around the jar instead, and transitions become instant.
- **No WebGL?** The page stays fully readable without the 3D scenes.
- **Keyboard and screen readers:**
  - The flavour switchers are ARIA radio groups (arrow keys, Home/End) and the cards are a tab list.
  - The heat gauge is a `role="meter"` with a value text.
  - There's a skip link, visible focus rings, and an Escape-to-close mobile menu.
  - Icon links have labels, and decorative art is `aria-hidden`.

## Project layout

```
samples/2-amigas/
├── index.html              page structure (text is filled from config)
├── netlify.toml, vercel.json
├── scripts/make-artifact.mjs
├── public/favicon.svg
└── src/
    ├── main.js             entry: renders sections, boots 3D, loader
    ├── config/
    │   ├── flavours.js     ← the salsas
    │   └── content.js      ← all other copy
    ├── assets/logo.svg, logo-mark.svg   ← the logo
    ├── styles/tokens.css   ← colours + fonts
    ├── styles/main.css
    └── js/
        ├── state.js        shared "current flavour" store
        ├── switcher.js, nav.js, sections.js, reveal.js, signup.js
        ├── flavoursSection.js   product cards + heat dial
        ├── flame.js             real-time flame shader (raw WebGL)
        ├── chipDip.js           dip section text, counter, button
        ├── illustrations.js     map + social icons
        └── three/
            ├── stage.js         studio set, scroll choreography, drag-to-turn, product shots
            ├── jar.js           jar geometry, printed label, lid
            ├── ingredients.js   procedural tomatoes, chiles, onion, lime…
            ├── chip.js          tortilla chip + salsa-coat shader
            ├── dip.js           bowl scene, droplets, ripples, crumbs
            └── textures.js      noise, stone, wood, salsa, studio lighting
```

## Placeholder content to confirm with the client

- Flavour names, descriptions and heat levels
- The founders' names and story (Maria & Sofia are placeholders)
- Market names, days and times (the map is stylised and not to scale)
- Emails, phone number and social links
- The logo (the current one is a concept)
- The signup form, which doesn't send anything yet. To collect emails, connect it to Netlify Forms, Mailchimp or similar (see `src/js/signup.js`).
