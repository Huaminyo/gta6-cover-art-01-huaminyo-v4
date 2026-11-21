// Golden Hour — Cover Studio: the 10 panel layouts and panel rendering.
//
// The cover is a CSS grid of 7 panels (index 0 is the hero). Every
// layout is a set of grid areas on straight edges — no slanted panels.
// The hero pops out: it scales slightly past its cell and casts a
// shadow over its neighbours. Each panel's photo is an <img> with
// object-fit: cover; the crop offset (x/y) and zoom come from state.

export const LAYOUTS = [
  {
    id: 'hero-left',
    name: 'Hero Left',
    cols: '1.2fr 1.2fr 1fr 1fr',
    rows: '1fr 1fr 1fr',
    areas: ['h h a b', 'h h c d', 'h h e f'],
  },
  {
    id: 'hero-right',
    name: 'Hero Right',
    cols: '1fr 1fr 1.2fr 1.2fr',
    rows: '1fr 1fr 1fr',
    areas: ['a b h h', 'c d h h', 'e f h h'],
  },
  {
    id: 'hero-top',
    name: 'Hero Top',
    cols: '1fr 1fr 1fr',
    rows: '1.4fr 1.4fr 1fr 1fr',
    areas: ['h h h', 'h h h', 'a b c', 'd e f'],
  },
  {
    id: 'hero-bottom',
    name: 'Hero Bottom',
    cols: '1fr 1fr 1fr',
    rows: '1fr 1fr 1.4fr 1.4fr',
    areas: ['a b c', 'd e f', 'h h h', 'h h h'],
  },
  {
    id: 'hero-center',
    name: 'Hero Center',
    cols: '1fr 1.2fr 1.2fr 1fr',
    rows: '1fr 1fr 1fr',
    areas: ['a h h b', 'c h h d', 'e h h f'],
  },
  {
    id: 'mosaic-wide',
    name: 'Mosaic Wide',
    cols: '1fr 1fr 1fr 1fr',
    rows: '1fr 1fr 1fr',
    areas: ['h h a b', 'h h c d', 'e e f f'],
  },
  {
    id: 'columns',
    name: 'Columns',
    cols: '1fr 1.3fr 1fr',
    rows: '1fr 1fr 1fr',
    areas: ['a h b', 'c h d', 'e h f'],
  },
  {
    id: 'strip-top',
    name: 'Strip Top',
    cols: '1fr 1fr 1fr',
    rows: '1.6fr 1fr 1fr',
    areas: ['h h h', 'a b c', 'd e f'],
  },
  {
    id: 'mosaic-top',
    name: 'Mosaic Top',
    cols: '1fr 1fr 1fr 1fr',
    rows: '1fr 1fr 1fr',
    areas: ['a h h b', 'c h h d', 'e e f f'],
  },
  {
    id: 'band',
    name: 'Band',
    cols: '1fr 1fr 1fr',
    rows: '1fr 1.3fr 1.3fr 1fr',
    areas: ['a b c', 'h h h', 'h h h', 'd e f'],
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

// Grid-area letters: panel 0 is the hero ('h'), panels 1-6 are a..f.
const AREA_LETTERS = ['h', 'a', 'b', 'c', 'd', 'e', 'f'];

// Apply a layout to the grid element.
export function applyLayout(grid, layout) {
  grid.style.gridTemplateColumns = layout.cols;
  grid.style.gridTemplateRows = layout.rows;
  grid.style.gridTemplateAreas = layout.areas.map((row) => `"${row}"`).join(' ');
  grid.dataset.layout = layout.id;
}

// Build the 7 panel elements once; render() updates their contents.
export function buildPanels(grid, onSelect) {
  const panels = [];
  for (let i = 0; i < 7; i++) {
    const el = document.createElement('div');
    el.className = 'panel' + (i === 0 ? ' hero' : '');
    el.style.gridArea = AREA_LETTERS[i];
    el.dataset.index = String(i);
    const img = document.createElement('img');
    img.alt = '';
    img.draggable = false;
    const tag = document.createElement('span');
    tag.className = 'role-tag';
    tag.contentEditable = 'true';
    tag.spellcheck = false;
    const frame = document.createElement('span');
    frame.className = 'panel-frame';
    el.append(img, tag, frame);
    el.addEventListener('pointerdown', (event) => onSelect(i, event));
    grid.appendChild(el);
    panels.push({ el, img, tag });
  }
  return panels;
}

// Sync the DOM panels with state + the loaded photo list.
export function renderPanels(panels, state, photos) {
  panels.forEach(({ el, img, tag }, i) => {
    const panel = state.panels[i];
    const photo = photos[panel.photo];
    if (photo && img.src !== photo.url) {
      img.src = photo.url;
      img.alt = photo.label;
    }
    img.style.objectPosition = `${panel.x}% ${panel.y}%`;
    img.style.transform = `scale(${panel.zoom / 100})`;
    tag.textContent = panel.role;
    tag.style.display = panel.showTag ? '' : 'none';
    el.classList.toggle('selected', state.selected === i);
  });
}

// Convert a drag (pixels moved inside the panel) into a crop-offset
// change: dragging the photo left shows more of its right side, so the
// offset moves the other way. The range clamps to 0..100.
export function dragToOffset(panel, rect, dx, dy) {
  const spanX = Math.max(1, rect.width);
  const spanY = Math.max(1, rect.height);
  const nx = panel.x - (dx / spanX) * 100;
  const ny = panel.y - (dy / spanY) * 100;
  return {
    x: Math.max(0, Math.min(100, Math.round(nx * 10) / 10)),
    y: Math.max(0, Math.min(100, Math.round(ny * 10) / 10)),
  };
}
