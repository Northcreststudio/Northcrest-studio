# 2 Amigas: interactive 3D salsa showcase

A single-page brand showcase for **2 Amigas**, a homemade salsa brand started by two best friends in Calgary. It's a sales-pitch sample built by Northcrest Studio, so it's a showcase, not a store: no cart, no checkout, and no photos. Everything on the page is either built in 3D in the browser, drawn as an SVG illustration, or done in CSS.

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

The palette ("Fiesta de Noche") is set in `tokens.css`:

| Token | Hex | Used for |
| --- | --- | --- |
| `--rosa` | `#E5197A` | Rosa Mexicano pink: primary pop colour |
| `--marigold` | `#FFB01F` | Cempasúchil marigold: highlights, lid, buttons |
| `--noche` | `#22103F` | Deep aubergine: text, outlines, dark sections |
| `--turquesa` | `#00A5A0` | Turquoise: cool counterpoint, rivers, Talavera bowl |
| `--crema` | `#FFF3E0` | Warm cream: page background |

Each flavour also brings its own accent colour: tomato red, tomatillo green and habanero orange.

### Fonts

The fonts are **Bagel Fat One** (display) and **DM Sans** (body), both from Google Fonts. To swap them, change the `<link>` in `index.html` and `--font-display` / `--font-body` in `tokens.css`.

### Logo

The logo is a placeholder that Northcrest Studio designed for the pitch. To use the real one, replace `src/assets/logo.svg` and `src/assets/logo-mark.svg` and keep the same file names. That one swap updates the nav, the footer, the loader, the story illustration, the **3D jar label** and the jar lid. For the cleanest result on the 3D label, give the new SVG explicit `width`/`height` attributes and outline any text (convert it to paths). The current wordmark is already outlined.

The wordmark switches to cream on dark backgrounds through the CSS variable `--logo-ink`. To keep that behaviour in a new logo, give its ink-coloured shapes `class="amg-ink"`.

---

## What's on the page

1. **Loader**: a little jar fills with salsa while the 3D warms up. It never shows for less than 0.9 s or more than 9 s.
2. **Hero**: a procedural Three.js jar (lathe-built glass with a fresnel edge, salsa, a canvas-painted label using the real logo, and a knurled lid). Drag it to spin it, with inertia. The flavour switcher spins the jar, swaps the label and salsa at the blur point, squashes the jar, fires a fountain of that flavour's ingredients, and re-tints the page.
3. **Exploding ingredients**: one sticky WebGL canvas spans the hero and a tall scroll section. As you scroll, the lid pops, ingredients burst out, orbit the jar, then dive back in and the lid closes. Captions tell the story along the way.
4. **Flavours**: three jar cards (an accessible tab list) and a detail panel with an SVG heat gauge. The needle springs into place, canvas flames scale with the heat, and at 5/5 the gauge wobbles.
5. **Our Story**: placeholder copy, an illustrated recipe card and molcajete, a spinning "Hecho en Calgary" stamp, and milestones.
6. **Chip-dip**: drag the tortilla chip into the Talavera bowl. The chip slides *between* the bowl's back and front layers, so it really looks dunked. You get a splash, a coated chip, a per-flavour message, CRUNCH!, and a fresh chip. A "Dip the chip" button does the same for keyboard users.
7. **Recipes**: four illustrated idea cards that tilt on hover. Each "Try it with…" button selects that flavour.
8. **Where to buy**: placeholder Calgary markets and pop-ups linked to pins on a stylised map.
9. **Contact**: a front-end-only signup form with validation, plus the wholesale/catering line and social icons.
10. **Footer**: logo, links, and "Website by Northcrest Studio".

## Performance, accessibility and motion

- **3D loads lazily.** Three.js is in its own chunk (~150 KB gzipped) and loads after the page paints. The whole site ships about 215 KB of gzipped JS.
- **On phones**, the device pixel ratio is capped (1.5× on phones, 2× on desktop), and phones get fewer ingredients (14 vs 26), smaller textures, lower-poly geometry, no antialiasing on low-power devices, and about 45% fewer particles.
- **Rendering pauses when off screen.** The WebGL loop, the flames and the splash only run while they're visible and the tab is open.
- **Touch works with scrolling.** Horizontal drags spin the jar and vertical swipes still scroll the page (`touch-action: pan-y`). The chip uses `touch-action: none` so it can be dragged freely.
- **`prefers-reduced-motion`** turns off auto-spin, the lid pop, flight paths, orbiting, wobble, the marquee, sways and parallax. The ingredients simply fade in around the jar instead, and transitions become instant.
- **No WebGL?** An illustrated SVG jar takes the 3D jar's place.
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
        ├── flavoursSection.js   cards + heat meter + flames
        ├── chipDip.js           drag, splash, crunch
        ├── illustrations.js     all SVG art (papel picado, bowl, icons, map…)
        └── three/
            ├── stage.js         renderer, scroll choreography, drag-to-spin
            ├── jar.js           jar geometry + painted label/lid textures
            └── ingredients.js   procedural tomatoes, chilies, limes…
```

## Placeholder content to confirm with the client

- Flavour names, descriptions and heat levels
- The founders' names and story (Maria & Sofia are placeholders)
- Market names, days and times (the map is stylised and not to scale)
- Emails, phone number and social links
- The logo (the current one is a concept)
- The signup form, which doesn't send anything yet. To collect emails, connect it to Netlify Forms, Mailchimp or similar (see `src/js/signup.js`).
