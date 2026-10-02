/**
 * ─────────────────────────────────────────────────────────────
 *  FLAVOURS: edit this file to change the salsas.
 * ─────────────────────────────────────────────────────────────
 *  Everything about each salsa lives here: name, copy, heat,
 *  colours and the 3D look. The hero jar, the flavour cards,
 *  the heat meter, the chip-dip bowl and the jar labels all
 *  read from this list, so a change here shows up everywhere.
 *
 *  Field guide
 *  - id           Short unique slug (used in URLs/aria; no spaces).
 *  - name         Display name.
 *  - kind         One-line description printed on the jar label.
 *  - heat         1 to 5. Drives the heat meter, the chili icons
 *                 and how wild the flames get (5 = wobble!).
 *  - heatLabel    Word shown next to the heat number.
 *  - scoville     Approximate heat range in Scoville Heat Units (SHU),
 *                 shown on the heat dial. Placeholder estimates.
 *  - accent       Main flavour colour (buttons, highlights, bg glow).
 *  - accentDeep   Darker partner of the accent (gradients, text on light).
 *  - salsa        Colour of the salsa itself in the 3D jar and bowl.
 *  - salsaBits    Colours of the chunky bits: [main chunk, onion/pale bit, herb].
 *  - label        Jar-label paper colour + ink colour.
 *  - ingredients3D  Which 3D ingredients burst out of the jar on scroll.
 *                 Options: tomato, tomatoHalf, tomatillo, chiliRed,
 *                 chiliGreen, habanero, onionHalf, cilantro, lime,
 *                 mango, garlic, chip.
 *  - dipMessages  Random messages after a chip is dunked in this salsa.
 *
 *  NOTE: these are placeholder flavours. Swap in the real ones.
 */
export const flavours = [
  {
    id: 'suave-roja',
    name: 'Suave Roja',
    kind: 'Roasted tomato salsa',
    heat: 1,
    heatLabel: 'Mild',
    scoville: [500, 1000],
    tagline: 'Roasted, mellow, and made for everybody.',
    description:
      'Our everyday red: vine tomatoes blistered over open flame, a little sweet onion and a squeeze of lime. ' +
      'Smoky, bright and gentle enough for the whole table, abuela included.',
    ingredients: ['Fire-roasted tomatoes', 'White onion', 'Garlic', 'Cilantro', 'Lime juice', 'Sea salt'],
    pairing: 'Warm tortilla chips and a cold horchata.',
    accent: '#D2442B',
    accentDeep: '#8E2416',
    salsa: '#9E2416',
    salsaBits: ['#C9442A', '#E8DCC4', '#3F6B2A'],
    label: { paper: '#EEE4D2', ink: '#1C1411' },
    ingredients3D: ['tomato', 'tomatoHalf', 'onionHalf', 'cilantro', 'lime', 'garlic', 'chiliRed', 'chip'],
    dipMessages: [
      'Smoky roasted tomato, a little sweet onion, a squeeze of lime. Gentle enough for everyone.',
      'That char on the tomatoes is the whole point. Mild heat, big flavour.',
      'The one people finish first at the market table.',
    ],
  },
  {
    id: 'verde-viva',
    name: 'Verde Viva',
    kind: 'Tomatillo & jalapeño salsa',
    heat: 3,
    heatLabel: 'Medium',
    scoville: [2500, 8000],
    tagline: 'Tangy, zippy, and very much alive.',
    description:
      'Tart tomatillos and fresh jalapeños, charred and blended with heaps of cilantro. ' +
      'A bright green kick that wakes up tacos, eggs, and anything off the grill.',
    ingredients: ['Tomatillos', 'Jalapeños', 'Cilantro', 'White onion', 'Garlic', 'Lime juice', 'Sea salt'],
    pairing: 'Carne asada tacos or a big plate of chilaquiles.',
    accent: '#8DAA3E',
    accentDeep: '#4A6420',
    salsa: '#5F7A22',
    salsaBits: ['#93A845', '#ECE4CC', '#2C4F1C'],
    label: { paper: '#EEE4D2', ink: '#1C1411' },
    ingredients3D: ['tomatillo', 'tomatillo', 'chiliGreen', 'chiliGreen', 'cilantro', 'onionHalf', 'lime', 'chip'],
    dipMessages: [
      'Bright tomatillo tang first, then the jalapeño shows up.',
      'Fresh, sharp, and green. Built for tacos al carbón.',
      'Medium heat that builds slowly. You will want another chip.',
    ],
  },
  {
    id: 'fuego-amiga',
    name: 'Fuego Amiga',
    kind: 'Habanero & mango salsa',
    heat: 5,
    heatLabel: 'Hot',
    scoville: [100000, 350000],
    tagline: 'Sweet mango up front, habanero fire behind.',
    description:
      'Ripe mango and orange habaneros, roasted until jammy and blended with lime and a pinch of salt. ' +
      'Fruity for a second, then it lights you up. Handle with love (and maybe milk).',
    ingredients: ['Habanero peppers', 'Ripe mango', 'Roasted red pepper', 'Garlic', 'Lime juice', 'Cane sugar', 'Sea salt'],
    pairing: 'Grilled shrimp, fish tacos, or a brave bag of chips.',
    accent: '#E2701F',
    accentDeep: '#9A3D0E',
    salsa: '#C9521A',
    salsaBits: ['#EE8A2E', '#F4B649', '#7E2610'],
    label: { paper: '#EEE4D2', ink: '#1C1411' },
    ingredients3D: ['habanero', 'habanero', 'mango', 'mango', 'garlic', 'lime', 'cilantro', 'chip'],
    dipMessages: [
      'Ripe mango for about two seconds. Then the habanero arrives.',
      'Fruity, then fierce. Keep a glass of milk nearby.',
      'Habanero heat that lingers. Respect.',
    ],
  },
];

/** The flavour shown when the page first loads (index into the list above). */
export const defaultFlavourIndex = 0;
