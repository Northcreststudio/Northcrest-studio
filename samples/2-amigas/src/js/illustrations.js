/**
 * Small SVG pieces: the stylised Calgary map and social icons.
 * (All product imagery is rendered by the 3D scenes.)
 */

export const socialIcons = {
  instagram: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"/></svg>`,
  tiktok: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14.5 3c.4 2.6 2 4.3 4.8 4.6v3.1c-1.8 0-3.4-.6-4.7-1.5v6.2a5.6 5.6 0 1 1-5.6-5.6c.3 0 .7 0 1 .1v3.2a2.5 2.5 0 1 0 1.6 2.3V3z" fill="currentColor"/></svg>`,
  facebook: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M13.6 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.3a21 21 0 0 0-2.4-.1c-2.4 0-4 1.4-4 4.1v2.1H7.7v3h2.6V21z" fill="currentColor"/></svg>`,
};

/** A quiet, print-style map: street grid, the Bow and Elbow rivers, ring road. Colours come from CSS. */
export const cityMap = () => `<svg class="map__svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
  <rect width="100" height="100" class="map__land"/>
  <g class="map__parks">
    <path d="M8 18c6-4 14-2 16 4s-4 10-10 10-10-8-6-14z"/><path d="M70 12c6-2 12 2 12 8s-8 8-12 6-6-12 0-14z"/>
    <path d="M28 70c6-4 14 0 14 6s-8 10-14 8-6-10 0-14z"/><path d="M78 74c4-2 10 0 10 6s-6 8-10 6-4-10 0-12z"/>
  </g>
  <g class="map__streets">
    ${Array.from({ length: 21 }, (_, i) => `<path d="M${i * 5} 0V100"/><path d="M0 ${i * 5}H100"/>`).join('')}
  </g>
  <g class="map__roads">
    <path d="M0 52H100"/><path d="M48 0V100"/><path d="M60 30 72 100"/><path d="M20 0 36 100"/>
  </g>
  <ellipse cx="50" cy="52" rx="46" ry="44" class="map__ring"/>
  <path class="map__river" d="M-2 28C14 30 24 34 34 39s16 4 22 6 6 6 7 12 1 16 3 26 4 14 6 20"/>
  <path class="map__river map__river--thin" d="M28 102c2-10 6-18 12-24s10-12 12-18 2-10 6-14"/>
  <g class="map__dt"><rect x="43" y="40" width="3" height="6"/><rect x="47" y="38" width="3" height="8"/><rect x="51" y="41" width="2.6" height="5"/><rect x="45" y="47" width="6" height="2.5"/></g>
  <g class="map__labels">
    <text x="40" y="54.5">DOWNTOWN</text>
    <text x="5" y="26.5" transform="rotate(8 5 26.5)" class="map__water">BOW RIVER</text>
    <text x="26.5" y="93" transform="rotate(-55 26.5 93)" class="map__water">ELBOW RIVER</text>
  </g>
  <g transform="translate(91 9)" class="map__compass">
    <circle r="4.6"/><path d="M0 -3.6 1.4 0H-1.4z"/><text y="-5.6" text-anchor="middle">N</text>
  </g>
</svg>`;
