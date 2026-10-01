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
 *  - heat         1 to 5. Drives the heat meter, the chili icons
 *                 and how wild the flames get (5 = wobble!).
 *  - heatLabel    Word shown next to the heat number.
 *  - accent       Main flavour colour (buttons, highlights, bg glow).
 *  - accentDeep   Darker partner of the accent (gradients, text on light).
 *  - salsa        Colour of the salsa itself in the 3D jar and bowl.
 *  - salsaBits    Colours of the chunky bits floating in the salsa.
 *  - label        Jar-label paper colour + ink colour.
 *  - ingredients3D  Which 3D ingredients burst out of the jar on scroll.
 *                 Options: tomato, tomatillo, chiliRed, chiliGreen,
 *                 habanero, onion, cilantro, lime, mango, garlic.
 *  - dipMessages  Random messages after a chip is dunked in this salsa.
 *
 *  NOTE: these are placeholder flavours. Swap in the real ones.
 */
export const flavours = [
  {
    id: 'suave-roja',
    name: 'Suave Roja',
    heat: 1,
    heatLabel: 'Mild',
    tagline: 'Roasted, mellow, and made for everybody.',
    description:
      'Our everyday red: vine tomatoes blistered over open flame, a little sweet onion and a squeeze of lime. ' +
      'Smoky, bright and gentle enough for the whole table, abuela included.',
    ingredients: ['Fire-roasted tomatoes', 'White onion', 'Garlic', 'Cilantro', 'Lime juice', 'Sea salt'],
    pairing: 'Warm tortilla chips and a cold horchata.',
    accent: '#F2452C',
    accentDeep: '#B3261A',
    salsa: '#D8341F',
    salsaBits: ['#F26B4E', '#FFF1D6', '#3E9D3A'],
    label: { paper: '#FFF3E0', ink: '#22103F' },
    ingredients3D: ['tomato', 'tomato', 'onion', 'cilantro', 'lime', 'garlic', 'chiliRed'],
    dipMessages: [
      '¡Qué rico! Smooth, smoky, and totally safe for beginners.',
      'That is a gentle hug of roasted tomato.',
      'Mild? Yes. Boring? Never.',
    ],
  },
  {
    id: 'verde-viva',
    name: 'Verde Viva',
    heat: 3,
    heatLabel: 'Medium',
    tagline: 'Tangy, zippy, and very much alive.',
    description:
      'Tart tomatillos and fresh jalapeños, charred and blended with heaps of cilantro. ' +
      'A bright green kick that wakes up tacos, eggs, and anything off the grill.',
    ingredients: ['Tomatillos', 'Jalapeños', 'Cilantro', 'White onion', 'Garlic', 'Lime juice', 'Sea salt'],
    pairing: 'Carne asada tacos or a big plate of chilaquiles.',
    accent: '#6CC24A',
    accentDeep: '#2E7D32',
    salsa: '#7DB63A',
    salsaBits: ['#B9DB6A', '#FFF8E1', '#2F7A2A'],
    label: { paper: '#FFF3E0', ink: '#22103F' },
    ingredients3D: ['tomatillo', 'tomatillo', 'chiliGreen', 'chiliGreen', 'cilantro', 'onion', 'lime'],
    dipMessages: [
      '¡Ándale! That tang just slapped (lovingly).',
      'Green means go. And you went for it.',
      'Zesty, zippy, and a little bit spicy. Like a good friend.',
    ],
  },
  {
    id: 'fuego-amiga',
    name: 'Fuego Amiga',
    heat: 5,
    heatLabel: 'Fuego',
    tagline: 'Sweet mango up front, habanero fire behind.',
    description:
      'Ripe mango and orange habaneros, roasted until jammy and blended with lime and a pinch of salt. ' +
      'Fruity for a second, then it lights you up. Handle with love (and maybe milk).',
    ingredients: ['Habanero peppers', 'Ripe mango', 'Roasted red pepper', 'Garlic', 'Lime juice', 'Cane sugar', 'Sea salt'],
    pairing: 'Grilled shrimp, fish tacos, or a brave bag of chips.',
    accent: '#FF7A00',
    accentDeep: '#C2410C',
    salsa: '#F06A0F',
    salsaBits: ['#FFB547', '#FFD86B', '#C2410C'],
    label: { paper: '#FFF3E0', ink: '#22103F' },
    ingredients3D: ['habanero', 'habanero', 'mango', 'mango', 'garlic', 'lime', 'chiliRed'],
    dipMessages: [
      '¡FUEGO! Your chip has entered another dimension.',
      'Sweet... sweet... ¡AY AY AY!',
      'Respect. Most chips do not survive that.',
    ],
  },
];

/** The flavour shown when the page first loads (index into the list above). */
export const defaultFlavourIndex = 0;
