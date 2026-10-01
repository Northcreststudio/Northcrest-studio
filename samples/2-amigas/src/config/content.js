/**
 * ─────────────────────────────────────────────────────────────
 *  SITE COPY: edit the words on the page here.
 * ─────────────────────────────────────────────────────────────
 *  Every section reads its text from this file, so you rarely
 *  need to touch index.html. All of this is placeholder copy
 *  for the sales sample; swap in the real story, markets,
 *  emails and social links once the clients confirm them.
 */

export const brand = {
  name: '2 Amigas',
  tagline: 'Homemade salsa, made by two best friends.',
  city: 'Calgary, AB',
  email: 'hola@2amigas.ca',
  wholesaleEmail: 'wholesale@2amigas.ca',
  phone: '(403) 555-0142',
};

export const nav = [
  { label: 'Flavours', href: '#flavours' },
  { label: 'Our Story', href: '#story' },
  { label: 'Dip a Chip', href: '#dip' },
  { label: 'Recipes', href: '#recipes' },
  { label: 'Find Us', href: '#find-us' },
  { label: 'Contact', href: '#contact' },
];

export const hero = {
  eyebrow: 'Small batch · Hecho a mano · Calgary',
  // The headline is split so the middle word can be styled/animated.
  headlineTop: 'Salsa made',
  headlineAccent: 'con amor',
  headlineBottom: 'by two amigas.',
  body: 'Roasted, chopped, and jarred by hand in tiny batches. Pick a flavour, give the jar a spin, then scroll to see what goes inside.',
  dragHint: 'Drag the jar to spin it',
  scrollCue: 'Scroll to crack it open',
};

/** Captions that appear while the ingredients burst out of the jar on scroll. */
export const explode = {
  heading: 'What goes in the jar',
  captions: [
    { title: 'Pop the lid', text: 'Every batch starts the same way: a big pot, two friends, and the radio up loud.' },
    { title: 'Real ingredients', text: 'Fire-roasted, hand-chopped, and nothing you cannot pronounce.' },
    { title: 'Tiny batches', text: 'Small enough to taste every pot. Big enough to share with the neighbours.' },
    { title: 'Back in the jar', text: 'Sealed fresh and on the market table that same week.' },
  ],
};

export const marquee = ['Hecho a mano', 'Small batch', 'No preservatives', 'Made in Calgary', 'Best friends since grade 4', 'Fire-roasted'];

export const flavoursSection = {
  eyebrow: 'The line-up',
  heading: 'Three salsas. Three moods.',
  body: 'From gentle and smoky to sweet-then-scorching. Tap a jar to see what is inside and how much fuego it packs.',
  ingredientsLabel: 'What is inside',
  pairingLabel: 'Best with',
};

export const story = {
  eyebrow: 'Our story',
  heading: 'Two friends, one family recipe, and a lot of chips.',
  paragraphs: [
    'Maria and Sofia met in grade four, bonded over a shared lunchbox of tortilla chips, and never really stopped snacking together. Every summer, Maria\'s abuela taught them her roasted salsa: no measuring cups, just "until it tastes right."',
    'Years later, their salsa became the thing everyone asked them to bring. Potlucks, birthdays, Stampede parties. So in 2025 they rented a commercial kitchen on weekends, printed a label, and set up a folding table at the market.',
    'They still make every batch together, still taste every pot, and still argue (lovingly) about how much cilantro is too much. (There is no such thing.)',
  ],
  // Little illustrated milestones shown beside the story.
  milestones: [
    { year: 'Grade 4', text: 'Two kids, one bag of chips.' },
    { year: 'Summers', text: 'Abuela\'s kitchen lessons.' },
    { year: '2025', text: 'First folding table at the market.' },
    { year: 'Today', text: 'Three salsas and a lot of new amigos.' },
  ],
  signature: 'Maria & Sofia',
};

export const dip = {
  eyebrow: 'Interactive snack break',
  heading: 'Go on, dip a chip.',
  body: 'Drag the chip into the bowl. Switch flavours to change the salsa (and the reaction).',
  keyboardButton: 'Dip the chip',
  idleMessage: 'The bowl is waiting...',
  counterLabel: 'Chips dipped',
};

export const recipes = {
  eyebrow: 'Recipes & pairings',
  heading: 'Ways to eat it (besides straight from the jar).',
  items: [
    {
      icon: 'taco',
      title: 'Taco night tacos',
      text: 'Warm corn tortillas, grilled steak, diced onion, cilantro, and a generous spoon of Verde Viva.',
      flavourId: 'verde-viva',
      time: '20 min',
    },
    {
      icon: 'nachos',
      title: 'Sheet-pan nachos',
      text: 'Chips, black beans, and a blanket of cheese. Bake, then drizzle with Fuego Amiga if you dare.',
      flavourId: 'fuego-amiga',
      time: '15 min',
    },
    {
      icon: 'eggs',
      title: 'Huevos rancheros',
      text: 'Fried eggs on crispy tortillas, smothered in warm Suave Roja with crumbled cotija.',
      flavourId: 'suave-roja',
      time: '15 min',
    },
    {
      icon: 'chicken',
      title: 'Salsa-grilled chicken',
      text: 'Marinate thighs in Verde Viva and lime for an hour, then grill hot and fast. Serve with rice.',
      flavourId: 'verde-viva',
      time: '1 hr 20 min',
    },
  ],
};

/**
 * Where to buy. `map` is the pin position on the stylised map,
 * as a percentage (x from the left, y from the top).
 * PLACEHOLDER schedule: confirm real markets and dates before launch.
 */
export const findUs = {
  eyebrow: 'Where to buy',
  heading: 'Come say hola.',
  body: 'Find us at farmers markets and pop-ups around Calgary. Sample schedule shown; follow us for this week\'s spots.',
  locations: [
    { name: 'Hillhurst Sunnyside Market', type: 'Farmers market', when: 'Wednesdays · 3–7 pm', area: 'Kensington, NW', map: { x: 37, y: 33 } },
    { name: 'Crossroads Market', type: 'Farmers market', when: 'Fri–Sun · 9 am–5 pm', area: 'Southeast', map: { x: 69, y: 60 } },
    { name: 'Calgary Farmers\' Market South', type: 'Farmers market', when: 'Thu–Sun · 9 am–5 pm', area: 'Blackfoot Trail SE', map: { x: 62, y: 80 } },
    { name: 'Inglewood Night Pop-up', type: 'Pop-up', when: 'First Friday · 6–10 pm', area: 'Inglewood, SE', map: { x: 61, y: 46 } },
    { name: 'Bridgeland Block Party', type: 'Event', when: 'Summer Saturdays', area: 'Bridgeland, NE', map: { x: 55, y: 34 } },
  ],
};

export const contact = {
  eyebrow: 'Stay in the loop',
  heading: 'Get first dibs on new batches.',
  body: 'One friendly email a month: new flavours, market dates, and the occasional recipe. No spam, prometido.',
  placeholder: 'you@example.com',
  button: 'Count me in',
  success: '¡Gracias, amigo! You are on the list.',
  wholesaleHeading: 'Wholesale & catering',
  wholesaleBody: 'Stocking a shop, planning an event, or feeding a crowd? We would love to hear from you.',
  socials: [
    { network: 'instagram', label: 'Instagram', href: 'https://instagram.com/' },
    { network: 'tiktok', label: 'TikTok', href: 'https://tiktok.com/' },
    { network: 'facebook', label: 'Facebook', href: 'https://facebook.com/' },
  ],
};

export const footer = {
  links: [
    { label: 'Flavours', href: '#flavours' },
    { label: 'Our Story', href: '#story' },
    { label: 'Find Us', href: '#find-us' },
    { label: 'Contact', href: '#contact' },
  ],
  credit: { label: 'Website by Northcrest Studio', href: 'https://northcreststudio.ca/' },
};

/** Fun lines cycled on the loading screen while the 3D warms up. */
export const loadingLines = ['Roasting tomatoes…', 'Chopping cilantro…', 'Squeezing limes…', 'Arguing about heat levels…', 'Sealing the jars…'];
