/**
 * Hand-built SVG illustrations, returned as strings.
 * No photos anywhere: every picture on the site is drawn here,
 * in the 3D scene, or in CSS.
 */

const C = {
  rosa: '#E5197A',
  marigold: '#FFB01F',
  noche: '#22103F',
  turquesa: '#00A5A0',
  crema: '#FFF3E0',
  cremaDeep: '#FBE3BF',
  chile: '#F2452C',
  nopal: '#2FA84F',
  morado: '#8B3FC6',
  chip: '#F2C35B',
  chipDark: '#D18F2E',
};

/* ───────────── Papel picado ───────────── */

const circle = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
const diamond = (cx, cy, w, h) => `M${cx} ${cy - h}L${cx + w} ${cy}L${cx} ${cy + h}L${cx - w} ${cy}Z`;
const heart = (cx, cy, s) =>
  `M${cx} ${cy + s}C${cx - s * 1.8} ${cy - s * 0.2} ${cx - s * 0.9} ${cy - s * 1.5} ${cx} ${cy - s * 0.5}C${cx + s * 0.9} ${cy - s * 1.5} ${cx + s * 1.8} ${cy - s * 0.2} ${cx} ${cy + s}Z`;

/** Cut-out patterns punched through each flag (fill-rule: evenodd). */
const cutouts = [
  // Flower
  () => {
    let d = circle(32, 32, 5.5);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      d += circle(+(32 + Math.cos(a) * 13).toFixed(1), +(32 + Math.sin(a) * 13).toFixed(1), 4.2);
    }
    for (let x = 10; x <= 54; x += 11) d += diamond(x, 56, 3.4, 4.2);
    return d;
  },
  // Heart
  () => {
    let d = heart(32, 31, 10);
    [[12, 12], [52, 12], [12, 50], [52, 50]].forEach(([x, y]) => (d += circle(x, y, 3.6)));
    for (let x = 14; x <= 50; x += 12) d += diamond(x, 60, 3, 3.6);
    return d;
  },
  // Diamond lattice
  () => {
    let d = '';
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) d += diamond(14 + col * 18, 14 + row * 18, 6, 7);
    }
    for (let x = 10; x <= 54; x += 11) d += circle(x, 64, 2.6);
    return d;
  },
];

const flagOutline = () => {
  let d = 'M0 0H64V68';
  for (let i = 15; i >= 0; i--) d += `L${i * 4} ${i % 2 ? 74 : 68}`;
  return d + 'Z';
};

let papelId = 0;
/**
 * A string of papel picado flags hanging on a slightly sagging line.
 * @param {number} count   number of flags
 * @param {string[]} colors flag colours, cycled
 */
export function papelPicado(count = 10, colors = [C.rosa, C.marigold, C.turquesa, C.chile, C.nopal, C.morado]) {
  const gap = 74;
  const width = count * gap + 10;
  const sag = 14;
  const outline = flagOutline();
  const id = `pp${papelId++}`;
  let flags = '';
  for (let i = 0; i < count; i++) {
    const x = 8 + i * gap;
    const t = (x + 32) / width;
    const y = 6 + Math.sin(t * Math.PI) * sag;
    const tilt = Math.cos(t * Math.PI) * -6; // follow the sag of the string
    const pattern = cutouts[i % cutouts.length]();
    // Outer <g> places the flag; the inner path sways via CSS (so the two transforms do not fight).
    flags += `<g transform="translate(${x} ${y.toFixed(1)}) rotate(${tilt.toFixed(1)} 32 0)">
      <path class="papel__flag" style="--i:${i}" fill="${colors[i % colors.length]}" fill-rule="evenodd" d="${outline}${pattern}"/>
    </g>`;
  }
  return `<svg class="papel__svg" viewBox="0 0 ${width} 96" preserveAspectRatio="xMidYMin meet" aria-hidden="true" focusable="false" id="${id}">
    <path class="papel__string" d="M0 6 Q${width / 2} ${6 + sag * 2} ${width} 6" fill="none" stroke="currentColor" stroke-width="2"/>
    ${flags}
  </svg>`;
}

/* ───────────── Little jar (flavour cards, fallback) ───────────── */

export function miniJar(f, { withLabel = true } = {}) {
  const [b1, b2, b3] = f.salsaBits;
  return `<svg viewBox="0 0 120 150" aria-hidden="true" focusable="false" class="mini-jar">
    <ellipse cx="60" cy="145" rx="40" ry="4" fill="${C.noche}" opacity=".18"/>
    <path d="M22 48c0-7 5-12 12-14v-8h52v8c7 2 12 7 12 14v80c0 9-7 16-16 16H38c-9 0-16-7-16-16z" fill="#fff" opacity=".55"/>
    <path d="M26 62h68v66c0 7-6 12-12 12H38c-6 0-12-5-12-12z" fill="${f.salsa}"/>
    <circle cx="40" cy="128" r="4" fill="${b1}"/><circle cx="76" cy="122" r="3.5" fill="${b2}"/>
    <circle cx="58" cy="132" r="3" fill="${b3}"/><circle cx="84" cy="134" r="2.6" fill="${b2}"/>
    <path d="M26 62q17-5 34 0t34 0" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="3"/>
    ${
      withLabel
        ? `<rect x="22" y="76" width="76" height="40" rx="4" fill="${f.label.paper}"/>
    <path d="M22 80h76M22 112h76" stroke="${f.accent}" stroke-width="4" stroke-dasharray="4 3"/>
    <circle cx="60" cy="96" r="11" fill="${C.rosa}"/>
    <text x="60" y="101.5" text-anchor="middle" font-family="Bagel Fat One, sans-serif" font-size="15" fill="${C.crema}">2</text>`
        : ''
    }
    <path d="M30 40c4-4 8-4 8-4" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".8"/>
    <rect x="30" y="12" width="60" height="18" rx="5" fill="${C.marigold}" stroke="${C.noche}" stroke-width="3"/>
    <path d="M36 14v14M44 14v14M52 14v14M60 14v14M68 14v14M76 14v14M84 14v14" stroke="${C.noche}" stroke-opacity=".25" stroke-width="2"/>
    <path d="M22 48c0-7 5-12 12-14v-8h52v8c7 2 12 7 12 14v80c0 9-7 16-16 16H38c-9 0-16-7-16-16z" fill="none" stroke="${C.noche}" stroke-width="3.5"/>
  </svg>`;
}

/* ───────────── Icons ───────────── */

export const chiliIcon = (filled = true) => `<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" class="chili-icon${filled ? ' is-on' : ''}">
  <path d="M21 9c3 5 1 12-4 16-4 3-9 4-13 3 4-2 7-6 8-11 1-4 3-8 6-9 1 0 2 0 3 1z" class="chili-icon__body"/>
  <path d="M17 9c1-3 4-4 6-3-1 1-1 2-2 3" fill="none" stroke="#2FA84F" stroke-width="2.4" stroke-linecap="round"/>
</svg>`;

export const recipeIcons = {
  taco: `<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
    <path d="M14 82c0-30 20-50 46-50s46 20 46 50z" fill="${C.chip}" stroke="${C.noche}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M22 76c4-8 8-4 12-10s8 2 12-6 8 0 12-6 8 4 12-2 8 4 12 0 8 6 12 2 4 8 4 8" fill="none" stroke="${C.nopal}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="40" cy="62" r="5" fill="${C.chile}"/><circle cx="62" cy="54" r="5" fill="${C.chile}"/><circle cx="82" cy="62" r="5" fill="${C.chile}"/>
    <circle cx="52" cy="66" r="3" fill="${C.crema}"/><circle cx="72" cy="66" r="3" fill="${C.crema}"/>
    <path d="M14 82h92" stroke="${C.noche}" stroke-width="4" stroke-linecap="round"/>
  </svg>`,
  nachos: `<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
    <ellipse cx="60" cy="88" rx="48" ry="14" fill="${C.turquesa}" stroke="${C.noche}" stroke-width="4"/>
    <path d="M26 82 40 40 58 80z" fill="${C.chip}" stroke="${C.noche}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M50 82 70 34 86 82z" fill="${C.chip}" stroke="${C.noche}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M74 84 92 50 100 84z" fill="${C.chip}" stroke="${C.noche}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M36 54c6 4 12-2 18 2s10 4 16-2 12 2 18-2v8c-4 4-6 0-8 6-2-6-6-2-8-4-2 6-6 6-8 0-4 4-8 2-10-2-4 4-6 2-8-2z" fill="${C.marigold}"/>
    <circle cx="48" cy="70" r="6" fill="none" stroke="${C.nopal}" stroke-width="3.5"/><circle cx="76" cy="66" r="5" fill="none" stroke="${C.nopal}" stroke-width="3.5"/>
    <circle cx="62" cy="76" r="4" fill="${C.chile}"/>
  </svg>`,
  eggs: `<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
    <circle cx="60" cy="64" r="44" fill="${C.chip}" stroke="${C.noche}" stroke-width="4"/>
    <path d="M30 60c-4-14 10-24 22-18 10-6 26 0 24 14 8 8 2 22-10 22-6 8-22 8-26-2-12 0-16-8-10-16z" fill="#fff" stroke="${C.noche}" stroke-width="3.5"/>
    <circle cx="48" cy="60" r="9" fill="${C.marigold}" stroke="${C.noche}" stroke-width="3"/>
    <circle cx="70" cy="66" r="9" fill="${C.marigold}" stroke="${C.noche}" stroke-width="3"/>
    <path d="M24 86c8-4 14 2 22-2s12 6 20 2 12 4 22 0" fill="none" stroke="${C.chile}" stroke-width="7" stroke-linecap="round"/>
    <circle cx="86" cy="44" r="3" fill="${C.nopal}"/><circle cx="38" cy="40" r="2.5" fill="${C.nopal}"/>
  </svg>`,
  chicken: `<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
    <path d="M76 80 96 100" stroke="${C.noche}" stroke-width="16" stroke-linecap="round"/>
    <path d="M76 80 96 100" stroke="#fff" stroke-width="9" stroke-linecap="round"/>
    <circle cx="98" cy="96" r="7" fill="#fff" stroke="${C.noche}" stroke-width="4"/><circle cx="92" cy="104" r="7" fill="#fff" stroke="${C.noche}" stroke-width="4"/>
    <path d="M24 56c0-22 18-36 36-34 20 2 32 20 28 40-2 10-8 16-14 20-14 8-34 6-44-4-4-6-6-14-6-22z" fill="#C8642A" stroke="${C.noche}" stroke-width="4"/>
    <path d="M36 44l22 22M48 36l22 22M34 60l16 16" stroke="${C.noche}" stroke-opacity=".55" stroke-width="5" stroke-linecap="round"/>
    <path d="M40 30c6-4 14-4 18-2" stroke="#fff" stroke-opacity=".5" stroke-width="5" stroke-linecap="round" fill="none"/>
  </svg>`,
};

export const socialIcons = {
  instagram: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="5.5" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="17.4" cy="6.6" r="1.4" fill="currentColor"/></svg>`,
  tiktok: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14.5 3c.4 2.6 2 4.3 4.8 4.6v3.1c-1.8 0-3.4-.6-4.7-1.5v6.2a5.6 5.6 0 1 1-5.6-5.6c.3 0 .7 0 1 .1v3.2a2.5 2.5 0 1 0 1.6 2.3V3z" fill="currentColor"/></svg>`,
  facebook: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M13.6 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.3a21 21 0 0 0-2.4-.1c-2.4 0-4 1.4-4 4.1v2.1H7.7v3h2.6V21z" fill="currentColor"/></svg>`,
};

/* ───────────── Chip-dip bowl + chip ───────────── */

/**
 * Talavera-style painted bowl, split into two layers so the chip can
 * slide *between* them: the back (rim + salsa) sits behind the chip and
 * the front (bowl body) sits in front, so a dipped chip looks submerged.
 * Salsa colours come from CSS vars set by JS (--salsa, --bit1..3).
 */
export const bowlBack = () => `<svg viewBox="0 0 400 250" focusable="false" aria-hidden="true">
  <ellipse cx="200" cy="238" rx="120" ry="10" fill="${C.noche}" opacity=".18"/>
  <ellipse cx="200" cy="66" rx="186" ry="40" fill="${C.cremaDeep}" stroke="${C.noche}" stroke-width="6"/>
  <ellipse class="bowl__salsa" cx="200" cy="76" rx="164" ry="28" fill="var(--salsa)"/>
  <g class="bowl__bits">
    <circle cx="120" cy="74" r="7" fill="var(--bit1)"/><circle cx="168" cy="88" r="5" fill="var(--bit2)"/>
    <circle cx="230" cy="68" r="6" fill="var(--bit3)"/><circle cx="272" cy="84" r="7" fill="var(--bit1)"/>
    <circle cx="310" cy="72" r="4" fill="var(--bit2)"/><circle cx="90" cy="82" r="4" fill="var(--bit3)"/>
    <circle cx="200" cy="80" r="4" fill="var(--bit2)"/><circle cx="150" cy="64" r="3" fill="var(--bit3)"/>
  </g>
  <path d="M110 62c30-8 70-10 100-8" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="5" stroke-linecap="round"/>
  <ellipse class="bowl__ripple" cx="200" cy="78" rx="20" ry="4" fill="none" stroke="#fff" stroke-width="3" opacity="0"/>
  <ellipse class="bowl__ripple" cx="200" cy="78" rx="20" ry="4" fill="none" stroke="#fff" stroke-width="2" opacity="0"/>
</svg>`;

export const bowlFront = () => `<svg viewBox="0 0 400 250" focusable="false" aria-hidden="true">
  <defs><clipPath id="bowl-body"><path d="M14 66A186 40 0 0 0 386 66C380 156 312 226 200 226S20 156 14 66Z"/></clipPath></defs>
  <path d="M14 66A186 40 0 0 0 386 66C380 156 312 226 200 226S20 156 14 66Z" fill="${C.crema}"/>
  <g clip-path="url(#bowl-body)">
    <path d="M0 122c60 20 120 26 200 26s140-6 200-26" fill="none" stroke="${C.turquesa}" stroke-width="12"/>
    <path d="M30 136c10 10 20 10 30 0s20-10 30 0 20 10 30 0 20-10 30 0 20 10 30 0 20-10 30 0 20 10 30 0 20-10 30 0 20 10 30 0 20-10 30 0 20 10 30 0" fill="none" stroke="${C.noche}" stroke-width="4"/>
    ${[100, 155, 200, 245, 300]
      .map(
        (x, i) => `<g transform="translate(${x} ${i % 2 ? 182 : 176}) scale(.8)">
        <circle r="13" fill="${i % 2 ? C.rosa : C.turquesa}"/>
        ${[0, 1, 2, 3, 4, 5].map((k) => `<circle cx="${(Math.cos(k * 1.047) * 19).toFixed(1)}" cy="${(Math.sin(k * 1.047) * 19).toFixed(1)}" r="5" fill="${C.marigold}"/>`).join('')}
        <circle r="5" fill="${C.crema}"/></g>`
      )
      .join('')}
    <path d="M110 212c28 10 60 14 90 14s62-4 90-14" fill="none" stroke="${C.turquesa}" stroke-width="10" stroke-linecap="round"/>
    <path d="M40 120c6 30 20 58 44 80" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="8" stroke-linecap="round"/>
  </g>
  <path d="M14 66A186 40 0 0 0 386 66C380 156 312 226 200 226S20 156 14 66Z" fill="none" stroke="${C.noche}" stroke-width="6" stroke-linejoin="round"/>
</svg>`;

/** Tortilla chip, tip pointing down. `.chip__coat` shows after a dip. */
export const chip = () => `<svg viewBox="0 0 140 150" focusable="false" aria-hidden="true">
  <defs>
    <clipPath id="chip-shape"><path d="M10 14c40-10 80-10 120 0 4 1 5 5 3 8L76 140c-3 5-9 5-12 0L7 22c-2-3-1-7 3-8z"/></clipPath>
  </defs>
  <path d="M10 14c40-10 80-10 120 0 4 1 5 5 3 8L76 140c-3 5-9 5-12 0L7 22c-2-3-1-7 3-8z" fill="${C.chip}"/>
  <g clip-path="url(#chip-shape)">
    <path d="M0 0h140v26C100 18 40 18 0 26z" fill="#F8D57E"/>
    <g fill="${C.chipDark}" opacity=".7">
      <circle cx="40" cy="40" r="3"/><circle cx="92" cy="34" r="2.4"/><circle cx="70" cy="62" r="2.8"/>
      <circle cx="56" cy="86" r="2"/><circle cx="84" cy="80" r="2.4"/><circle cx="104" cy="50" r="2"/><circle cx="68" cy="110" r="2"/>
    </g>
    <g class="chip__coat">
      <path d="M0 84c14 6 22-2 34 4s18 12 30 4 18-6 30 0 22-2 46-8v80H0z" fill="var(--salsa)"/>
      <circle cx="52" cy="104" r="4" fill="var(--bit1)"/><circle cx="80" cy="98" r="3.5" fill="var(--bit2)"/><circle cx="68" cy="122" r="3" fill="var(--bit3)"/>
      <path d="M40 92c6-2 12 0 16 4" stroke="#fff" stroke-opacity=".4" stroke-width="3" fill="none" stroke-linecap="round"/>
    </g>
  </g>
  <path d="M10 14c40-10 80-10 120 0 4 1 5 5 3 8L76 140c-3 5-9 5-12 0L7 22c-2-3-1-7 3-8z" fill="none" stroke="${C.noche}" stroke-width="5" stroke-linejoin="round"/>
</svg>`;

/* ───────────── Story illustration ───────────── */

export const storyArt = (markSvg) => `<div class="story-art">
  <svg class="story-art__bg" viewBox="0 0 400 440" aria-hidden="true" focusable="false">
    <path d="M200 20c90 0 180 50 180 170 0 130-90 230-200 230S10 330 20 210C30 90 110 20 200 20z" fill="${C.rosa}"/>
    <circle cx="300" cy="96" r="54" fill="${C.marigold}"/>
    <g fill="${C.crema}" opacity=".9">
      <path d="M60 80l6 14 14 6-14 6-6 14-6-14-14-6 14-6z"/><path d="M350 300l4 9 9 4-9 4-4 9-4-9-9-4 9-4z"/><path d="M90 380l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/>
    </g>
    <!-- recipe card -->
    <g transform="rotate(-7 150 250)">
      <rect x="40" y="160" width="220" height="150" rx="10" fill="${C.crema}" stroke="${C.noche}" stroke-width="5"/>
      <path d="M40 196h220" stroke="${C.chile}" stroke-width="3"/>
      <text x="58" y="186" font-family="Bagel Fat One, sans-serif" font-size="20" fill="${C.noche}">Receta de Abuela</text>
      <g stroke="${C.noche}" stroke-opacity=".35" stroke-width="3" stroke-linecap="round">
        <path d="M58 222h150M58 244h120M58 266h160M58 288h90"/>
      </g>
      <path d="M200 280c10-14 30-14 40 0" stroke="${C.rosa}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <text x="196" y="300" font-family="DM Sans, sans-serif" font-style="italic" font-size="13" fill="${C.rosa}">¡al gusto!</text>
    </g>
    <!-- molcajete -->
    <g transform="translate(212 300)">
      <path d="M10 24h150c0 50-30 76-75 76S10 74 10 24z" fill="#4A3B5C" stroke="${C.noche}" stroke-width="5"/>
      <path d="M40 98l-8 20M85 102v20M130 98l8 20" stroke="${C.noche}" stroke-width="12" stroke-linecap="round"/>
      <ellipse cx="85" cy="24" rx="75" ry="16" fill="#5C4C70" stroke="${C.noche}" stroke-width="5"/>
      <ellipse cx="85" cy="26" rx="62" ry="10" fill="${C.chile}"/>
      <circle cx="60" cy="20" r="12" fill="${C.chile}" stroke="${C.noche}" stroke-width="3"/>
      <circle cx="98" cy="16" r="13" fill="#E8341C" stroke="${C.noche}" stroke-width="3"/>
      <path d="M95 4l4 6 6-3" stroke="${C.nopal}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M120 -6l30 -40" stroke="#6A5A80" stroke-width="16" stroke-linecap="round"/>
      <path d="M120 -6l30 -40" stroke="${C.noche}" stroke-width="3" stroke-linecap="round" opacity=".3"/>
      <g fill="#4A3B5C" opacity=".6"><circle cx="40" cy="50" r="3"/><circle cx="120" cy="60" r="3"/><circle cx="80" cy="74" r="2.5"/></g>
    </g>
  </svg>
  <div class="story-art__mark">${markSvg}</div>
  <div class="story-art__stamp"><span>Hecho<br/>en<br/>Calgary</span></div>
</div>`;

/* ───────────── Stylised Calgary map ───────────── */

export const cityMap = () => `<svg class="map__svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
  <rect width="100" height="100" fill="${C.cremaDeep}"/>
  <!-- street grid -->
  <g stroke="#fff" stroke-width=".9" opacity=".9">
    ${Array.from({ length: 11 }, (_, i) => `<path d="M${i * 10} 0V100"/><path d="M0 ${i * 10}H100"/>`).join('')}
  </g>
  <g stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none">
    <path d="M0 52H100"/><path d="M48 0V100"/><path d="M60 30 72 100"/><path d="M20 0 36 100"/>
  </g>
  <!-- ring road -->
  <ellipse cx="50" cy="52" rx="46" ry="44" fill="none" stroke="${C.marigold}" stroke-width="1.6" stroke-dasharray="3 2"/>
  <!-- parks -->
  <g fill="${C.nopal}" opacity=".35">
    <path d="M10 20c6-4 14-2 16 4s-4 10-10 10-10-8-6-14z"/><path d="M70 14c6-2 12 2 12 8s-8 8-12 6-6-12 0-14z"/>
    <path d="M30 72c6-4 14 0 14 6s-8 10-14 8-6-10 0-14z"/><path d="M78 76c4-2 10 0 10 6s-6 8-10 6-4-10 0-12z"/>
  </g>
  <!-- rivers -->
  <path d="M-2 28C14 30 24 34 34 39s16 4 22 6 6 6 7 12 1 16 3 26 4 14 6 20" fill="none" stroke="${C.turquesa}" stroke-width="3.6" stroke-linecap="round"/>
  <path d="M28 102c2-10 6-18 12-24s10-12 12-18 2-10 6-14" fill="none" stroke="${C.turquesa}" stroke-width="2.4" stroke-linecap="round"/>
  <!-- downtown -->
  <g fill="${C.noche}" opacity=".8">
    <rect x="43" y="40" width="3" height="6" rx=".5"/><rect x="47" y="38" width="3" height="8" rx=".5"/><rect x="51" y="41" width="2.6" height="5" rx=".5"/><rect x="45" y="47" width="6" height="2.5" rx=".5"/>
  </g>
  <g font-family="DM Sans, sans-serif" font-weight="700" fill="${C.noche}">
    <text x="40" y="54" font-size="2.6" opacity=".8">DOWNTOWN</text>
    <text x="6" y="27" font-size="2.4" fill="${C.turquesa}" transform="rotate(8 6 27)">BOW RIVER</text>
    <text x="27" y="93" font-size="2.2" fill="${C.turquesa}" transform="rotate(-55 27 93)">ELBOW RIVER</text>
  </g>
  <!-- compass -->
  <g transform="translate(90 10)">
    <circle r="6" fill="${C.crema}" stroke="${C.noche}" stroke-width=".8"/>
    <path d="M0 -4.6 2 0H-2z" fill="${C.rosa}"/><path d="M0 4.6 2 0H-2z" fill="${C.noche}"/>
    <text y="-6.8" text-anchor="middle" font-size="2.6" font-family="DM Sans, sans-serif" font-weight="800" fill="${C.noche}">N</text>
  </g>
</svg>`;
