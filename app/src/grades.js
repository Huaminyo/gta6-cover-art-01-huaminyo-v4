// Golden Hour — Cover Studio: the 9 colour grades.
//
// Each grade is a CSS filter for the photos plus a tint overlay (a
// gradient painted over the whole cover with a blend mode) and the
// matching canvas filter string used by the PNG export, so what you
// see on screen is what the export draws. Vice Gold is the default:
// warm sunset gold, bright and readable.

export const GRADES = [
  {
    id: 'vice-gold',
    name: 'Vice Gold',
    filter: 'saturate(1.25) contrast(1.06) brightness(1.05) sepia(0.18)',
    overlay: 'linear-gradient(160deg, rgba(255,176,66,0.20), rgba(255,110,60,0.10) 55%, rgba(20,120,140,0.12))',
    canvasFilter: 'saturate(1.25) contrast(1.06) brightness(1.05) sepia(0.18)',
  },
  {
    id: 'palm-teal',
    name: 'Palm Teal',
    filter: 'saturate(1.2) contrast(1.05) hue-rotate(-12deg)',
    overlay: 'linear-gradient(160deg, rgba(0,190,180,0.16), rgba(0,60,90,0.14))',
    canvasFilter: 'saturate(1.2) contrast(1.05) hue-rotate(-12deg)',
  },
  {
    id: 'sunset-heat',
    name: 'Sunset Heat',
    filter: 'saturate(1.45) contrast(1.08) brightness(1.02) sepia(0.28)',
    overlay: 'linear-gradient(160deg, rgba(255,90,40,0.22), rgba(160,20,60,0.16))',
    canvasFilter: 'saturate(1.45) contrast(1.08) brightness(1.02) sepia(0.28)',
  },
  {
    id: 'ocean-drive',
    name: 'Ocean Drive',
    filter: 'saturate(1.15) contrast(1.04) brightness(1.06) hue-rotate(8deg)',
    overlay: 'linear-gradient(160deg, rgba(80,180,255,0.14), rgba(255,200,120,0.10))',
    canvasFilter: 'saturate(1.15) contrast(1.04) brightness(1.06) hue-rotate(8deg)',
  },
  {
    id: 'desert-dust',
    name: 'Desert Dust',
    filter: 'saturate(0.9) contrast(1.03) brightness(1.07) sepia(0.35)',
    overlay: 'linear-gradient(160deg, rgba(230,190,120,0.20), rgba(120,70,20,0.10))',
    canvasFilter: 'saturate(0.9) contrast(1.03) brightness(1.07) sepia(0.35)',
  },
  {
    id: 'blood-moon',
    name: 'Blood Moon',
    filter: 'saturate(1.3) contrast(1.1) brightness(0.96) hue-rotate(-28deg)',
    overlay: 'linear-gradient(160deg, rgba(200,20,40,0.20), rgba(60,0,20,0.18))',
    canvasFilter: 'saturate(1.3) contrast(1.1) brightness(0.96) hue-rotate(-28deg)',
  },
  {
    id: 'mono-chrome',
    name: 'Mono Chrome',
    filter: 'grayscale(1) contrast(1.12) brightness(1.03)',
    overlay: 'linear-gradient(160deg, rgba(255,255,255,0.06), rgba(0,0,0,0.10))',
    canvasFilter: 'grayscale(1) contrast(1.12) brightness(1.03)',
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    filter: 'saturate(1.1) contrast(1.06) brightness(0.94) hue-rotate(18deg)',
    overlay: 'linear-gradient(160deg, rgba(20,40,120,0.22), rgba(0,10,40,0.16))',
    canvasFilter: 'saturate(1.1) contrast(1.06) brightness(0.94) hue-rotate(18deg)',
  },
  {
    id: 'neon-noir',
    name: 'Neon Noir',
    filter: 'saturate(1.5) contrast(1.12) brightness(0.92) hue-rotate(-8deg)',
    overlay: 'linear-gradient(160deg, rgba(255,0,160,0.14), rgba(0,40,160,0.22))',
    canvasFilter: 'saturate(1.5) contrast(1.12) brightness(0.92) hue-rotate(-8deg)',
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}
