// Golden Hour — Cover Studio: shared state, defaults, seeded random.
//
// The cover is 7 panels: index 0 is the hero (a close-up, people-first),
// indices 1-6 are the supporting panels. Each panel holds a photo, a
// crop offset (percent of the photo's spare room), a zoom (100-200%),
// a role tag and whether the tag shows. Everything else — title,
// grade, layout, toggles, quote, callouts — lives on the same object
// so export and the UI always agree.

export const SAMPLE_PHOTOS = [
  { file: 'samples/01-driver.jpg', role: 'THE DRIVER', label: 'Driver' },
  { file: 'samples/02-fixer.jpg', role: 'THE FIXER', label: 'Fixer' },
  { file: 'samples/03-queen.jpg', role: 'THE QUEEN', label: 'Queen' },
  { file: 'samples/04-rider.jpg', role: 'THE RIDER', label: 'Rider' },
  { file: 'samples/05-lookout.jpg', role: 'THE LOOKOUT', label: 'Lookout' },
  { file: 'samples/06-wheelman.jpg', role: 'THE WHEELMAN', label: 'Wheelman' },
  { file: 'samples/07-palms.jpg', role: 'PALM ROW', label: 'Palms' },
  { file: 'samples/08-boardwalk.jpg', role: 'BOARDWALK', label: 'Boardwalk' },
  { file: 'samples/09-highway.jpg', role: 'THE HIGHWAY', label: 'Highway' },
  { file: 'samples/10-marina.jpg', role: 'THE MARINA', label: 'Marina' },
];

export const MAX_PHOTOS = 10;

export function defaultPanel(photoIndex, role) {
  return {
    photo: photoIndex,
    // Crop offset in percent: 50/50 centers the photo. The drag editor
    // moves it 0..100 in each axis.
    x: 50,
    y: 50,
    zoom: 100,
    role,
    showTag: true,
  };
}

export function defaultState() {
  return {
    title: 'GOLDEN HOUR',
    titleOver: true, // title over the art (true) or below the grid
    grade: 'vice-gold',
    layout: 'hero-left',
    fullBleed: false,
    wanted: true,
    quote: 'EVERY CITY HAS A PRICE.',
    quoteBy: 'LEONIDA TIMES',
    callouts: [
      { text: '6 BLOCKS. NO MERCY.', x: 52, y: 55 },
      { text: 'SUNSET HEIST', x: 8, y: 74 },
      { text: 'EST. 2026', x: 40, y: 88 },
    ],
    panels: [
      defaultPanel(0, 'THE DRIVER'),
      defaultPanel(2, 'THE QUEEN'),
      defaultPanel(1, 'THE FIXER'),
      defaultPanel(3, 'THE RIDER'),
      defaultPanel(6, 'PALM ROW'),
      defaultPanel(8, 'THE HIGHWAY'),
      defaultPanel(9, 'THE MARINA'),
    ],
    seed: 20261121,
    selected: 0, // panel currently in edit mode
  };
}

// Mulberry32 — small deterministic PRNG, so auto-fill with the same
// seed always deals the same photos.
export function rngFromSeed(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Deterministic shuffle (Fisher-Yates on a seeded RNG).
export function shuffled(indices, seed) {
  const rand = rngFromSeed(seed);
  const arr = indices.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
