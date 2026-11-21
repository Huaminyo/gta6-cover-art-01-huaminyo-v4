// Golden Hour — Cover Studio: app bootstrap and wiring.
//
// Builds the panels, callouts, layout/grade pickers and photo strip,
// loads the sample photos (face-aware crop on load), and wires every
// control: panel drag-to-crop, zoom slider, photo picker, uploads,
// auto-fill, reset, title/quote/tag editing, toggles and PNG export.
// The ?shot= query parameter puts the page into one of the four
// screenshot states (cover / editor / portrait / square).

import { SAMPLE_PHOTOS, MAX_PHOTOS, defaultState, shuffled } from './state.js';
import { GRADES, gradeById } from './grades.js';
import { applyFaceCrop } from './facecrop.js';
import { LAYOUTS, layoutById, applyLayout, buildPanels, renderPanels, dragToOffset } from './panels.js';
import { makeEditable, buildCallouts, renderCallouts } from './captions.js';
import { EXPORT_SIZES, renderCover, downloadCanvas } from './export.js';

const $ = (id) => document.getElementById(id);

let state = defaultState();
// photos: { file, role, label, url } — samples first, then uploads.
const photos = SAMPLE_PHOTOS.map((p) => ({ ...p, url: p.file }));
const images = new Map(); // photo index -> loaded HTMLImageElement
let uploads = 0;

const grid = $('cover-grid');
const cover = $('cover');
const coverFrame = $('cover-frame');
const coverTitle = $('cover-title');
const tint = $('cover-tint');
const wantedBadge = $('wanted-badge');
const quoteText = $('quote-text');
const quoteBy = $('quote-by');

// ---- panels ---------------------------------------------------------

const panels = buildPanels(grid, onPanelPointerDown);

function onPanelPointerDown(index, event) {
  // Clicking the role tag edits the tag, it does not drag the photo.
  if (event.target.classList.contains('role-tag')) return;
  selectPanel(index);
  const panel = state.panels[index];
  const el = panels[index].el;
  const rect = el.getBoundingClientRect();
  const startX = event.clientX;
  const startY = event.clientY;
  const baseX = panel.x;
  const baseY = panel.y;
  let moved = false;
  el.setPointerCapture(event.pointerId);
  const onMove = (moveEvent) => {
    const dx = moveEvent.clientX - startX;
    const dy = moveEvent.clientY - startY;
    if (!moved && Math.hypot(dx, dy) < 3) return;
    moved = true;
    const next = dragToOffset({ x: baseX, y: baseY }, rect, dx, dy);
    panel.x = next.x;
    panel.y = next.y;
    renderPanels(panels, state, photos);
  };
  const onUp = () => {
    el.removeEventListener('pointermove', onMove);
    el.removeEventListener('pointerup', onUp);
  };
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('dblclick', () => recenterOnFace(index), { once: false });
}

function selectPanel(index) {
  state.selected = index;
  renderPanels(panels, state, photos);
  syncEditor();
}

async function recenterOnFace(index) {
  const panel = state.panels[index];
  const img = images.get(panel.photo);
  if (!img) return;
  await applyFaceCrop(img, photos[panel.photo].url, panel, index === 0);
  renderPanels(panels, state, photos);
  syncEditor();
}

// Role tags: save on blur / Enter, and keep panel drags from starting
// when the tag itself is clicked.
panels.forEach(({ tag }, i) => {
  tag.addEventListener('pointerdown', (event) => event.stopPropagation());
  tag.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      tag.blur();
    }
  });
  tag.addEventListener('blur', () => {
    const text = tag.textContent.trim().toUpperCase();
    if (text) state.panels[i].role = text;
    renderPanels(panels, state, photos);
  });
});

// ---- callouts, title, quote ----------------------------------------

const calloutEls = buildCallouts($('callout-layer'), state, () => {});

makeEditable(coverTitle, (text) => {
  state.title = text.toUpperCase();
  coverTitle.textContent = state.title;
});
makeEditable(quoteText, (text) => {
  state.quote = text.replace(/[“”"]/g, '').toUpperCase();
  quoteText.textContent = `“${state.quote}”`;
});
makeEditable(quoteBy, (text) => {
  state.quoteBy = text.replace(/^—\s*/, '').toUpperCase();
  quoteBy.textContent = `— ${state.quoteBy}`;
});

// ---- layout + grade pickers ----------------------------------------

const layoutGrid = $('layout-grid');
for (const layout of LAYOUTS) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'layout-btn';
  btn.textContent = layout.name;
  btn.dataset.layout = layout.id;
  btn.addEventListener('click', () => {
    state.layout = layout.id;
    applyLayout(grid, layout);
    syncPickers();
  });
  layoutGrid.appendChild(btn);
}

const gradeGrid = $('grade-grid');
for (const grade of GRADES) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'grade-btn';
  btn.textContent = grade.name;
  btn.dataset.grade = grade.id;
  btn.addEventListener('click', () => {
    state.grade = grade.id;
    applyGrade();
    syncPickers();
  });
  gradeGrid.appendChild(btn);
}

function applyGrade() {
  const grade = gradeById(state.grade);
  tint.style.background = grade.overlay;
  document.querySelectorAll('.panel img').forEach((img) => {
    img.style.filter = grade.filter;
  });
}

function syncPickers() {
  layoutGrid.querySelectorAll('.layout-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.layout === state.layout);
  });
  gradeGrid.querySelectorAll('.grade-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.grade === state.grade);
  });
}

// ---- panel editor ----------------------------------------------------

const zoomSlider = $('zoom-slider');
const zoomValue = $('zoom-value');
const editorWhich = $('editor-which');

function syncEditor() {
  const panel = state.panels[state.selected];
  zoomSlider.value = String(panel.zoom);
  zoomValue.textContent = `${panel.zoom}%`;
  editorWhich.textContent = state.selected === 0 ? 'Hero' : `Panel ${state.selected + 1}`;
  $('btn-tag-toggle').textContent = panel.showTag ? 'Hide tag' : 'Show tag';
}

zoomSlider.addEventListener('input', () => {
  const panel = state.panels[state.selected];
  panel.zoom = Number(zoomSlider.value);
  zoomValue.textContent = `${panel.zoom}%`;
  renderPanels(panels, state, photos);
});

$('btn-crop-reset').addEventListener('click', () => {
  const panel = state.panels[state.selected];
  panel.x = 50;
  panel.y = 50;
  panel.zoom = 100;
  renderPanels(panels, state, photos);
  syncEditor();
});

$('btn-tag-toggle').addEventListener('click', () => {
  const panel = state.panels[state.selected];
  panel.showTag = !panel.showTag;
  renderPanels(panels, state, photos);
  syncEditor();
});

// ---- toggles ---------------------------------------------------------

function renderTitlePosition() {
  if (state.titleOver) {
    coverTitle.classList.remove('below');
    if (coverTitle.parentElement !== cover) cover.appendChild(coverTitle);
  } else {
    coverTitle.classList.add('below');
    if (coverTitle.parentElement !== coverFrame) {
      coverFrame.insertBefore(coverTitle, coverFrame.querySelector('.billing'));
    }
  }
}

$('toggle-title-over').addEventListener('change', (event) => {
  state.titleOver = event.target.checked;
  renderTitlePosition();
});

$('toggle-fullbleed').addEventListener('change', (event) => {
  state.fullBleed = event.target.checked;
  coverFrame.classList.toggle('full-bleed', state.fullBleed);
});

$('toggle-wanted').addEventListener('change', (event) => {
  state.wanted = event.target.checked;
  wantedBadge.style.display = state.wanted ? '' : 'none';
});

// ---- photo strip + uploads ------------------------------------------

const strip = $('photo-strip');
const uploadTile = $('upload-tile');
const fileInput = $('file-input');

function buildStrip() {
  strip.querySelectorAll('.photo-thumb').forEach((el) => el.remove());
  photos.forEach((photo, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'photo-thumb';
    btn.title = photo.label;
    const img = document.createElement('img');
    img.src = photo.url;
    img.alt = photo.label;
    const label = document.createElement('span');
    label.textContent = photo.label;
    btn.append(img, label);
    btn.addEventListener('click', () => assignPhoto(i));
    strip.appendChild(btn);
  });
  markInUse();
}

function markInUse() {
  const used = new Set(state.panels.map((p) => p.photo));
  strip.querySelectorAll('.photo-thumb').forEach((btn, i) => {
    btn.classList.toggle('in-use', used.has(i));
  });
}

async function assignPhoto(photoIndex) {
  const panel = state.panels[state.selected];
  panel.photo = photoIndex;
  panel.role = photos[photoIndex].role;
  panel.x = 50;
  panel.y = 50;
  panel.zoom = state.selected === 0 ? 130 : 100;
  renderPanels(panels, state, photos);
  markInUse();
  syncEditor();
  const img = images.get(photoIndex);
  if (img) {
    await applyFaceCrop(img, photos[photoIndex].url, panel, state.selected === 0);
    renderPanels(panels, state, photos);
    syncEditor();
  }
}

function addUpload(file) {
  if (uploads >= MAX_PHOTOS) return false;
  if (!file.type.startsWith('image/')) return false;
  const url = URL.createObjectURL(file);
  const label = file.name.replace(/\.[^.]+$/, '').slice(0, 18) || 'Upload';
  const index = photos.length;
  photos.push({ file: file.name, role: 'UPLOAD', label, url });
  uploads += 1;
  const img = new Image();
  img.onload = () => images.set(index, img);
  img.src = url;
  buildStrip();
  return true;
}

fileInput.addEventListener('change', () => {
  for (const file of fileInput.files) addUpload(file);
  fileInput.value = '';
});

for (const eventName of ['dragenter', 'dragover']) {
  uploadTile.addEventListener(eventName, (event) => {
    event.preventDefault();
    uploadTile.classList.add('drag-over');
  });
}
for (const eventName of ['dragleave', 'drop']) {
  uploadTile.addEventListener(eventName, (event) => {
    event.preventDefault();
    uploadTile.classList.remove('drag-over');
  });
}
uploadTile.addEventListener('drop', (event) => {
  for (const file of event.dataTransfer.files) addUpload(file);
});

// ---- auto-fill + reset -----------------------------------------------

$('btn-autofill').addEventListener('click', async () => {
  state.seed += 1;
  const order = shuffled(photos.map((_, i) => i), state.seed);
  state.panels.forEach((panel, i) => {
    panel.photo = order[i % order.length];
    panel.role = photos[panel.photo].role;
    panel.x = 50;
    panel.y = 50;
    panel.zoom = i === 0 ? 130 : 100;
  });
  renderPanels(panels, state, photos);
  markInUse();
  syncEditor();
  await Promise.all(
    state.panels.map((panel, i) => {
      const img = images.get(panel.photo);
      return img ? applyFaceCrop(img, photos[panel.photo].url, panel, i === 0) : Promise.resolve();
    }),
  );
  renderPanels(panels, state, photos);
  syncEditor();
});

$('btn-reset').addEventListener('click', () => {
  const seed = state.seed;
  state = defaultState();
  state.seed = seed;
  applyLayout(grid, layoutById(state.layout));
  applyGrade();
  syncPickers();
  renderPanels(panels, state, photos);
  renderCallouts(calloutEls, state);
  coverTitle.textContent = state.title;
  quoteText.textContent = `“${state.quote}”`;
  quoteBy.textContent = `— ${state.quoteBy}`;
  wantedBadge.style.display = '';
  coverFrame.classList.remove('full-bleed');
  $('toggle-title-over').checked = true;
  $('toggle-fullbleed').checked = false;
  $('toggle-wanted').checked = true;
  renderTitlePosition();
  markInUse();
  syncEditor();
});

// ---- export ----------------------------------------------------------

const exportList = $('export-list');
$('btn-export').addEventListener('click', (event) => {
  event.stopPropagation();
  exportList.hidden = !exportList.hidden;
});
document.addEventListener('click', (event) => {
  if (!exportList.hidden && !exportList.contains(event.target)) exportList.hidden = true;
});
exportList.querySelectorAll('button').forEach((btn) => {
  btn.addEventListener('click', async () => {
    exportList.hidden = true;
    const size = EXPORT_SIZES.find((s) => s.id === btn.dataset.size) ?? EXPORT_SIZES[0];
    const canvas = await renderCover(state, photos, images, size);
    await downloadCanvas(canvas, `golden-hour-cover-${size.id.replace(':', 'x')}.png`);
  });
});

// ---- boot ------------------------------------------------------------

function applyShotParam() {
  const shot = new URLSearchParams(window.location.search).get('shot');
  if (shot === 'editor') {
    selectPanel(0);
    state.panels[0].zoom = 150;
    renderPanels(panels, state, photos);
    syncEditor();
  } else if (shot === 'portrait') {
    state.layout = 'hero-top';
    state.grade = 'sunset-heat';
  } else if (shot === 'square') {
    state.layout = 'hero-center';
    state.grade = 'palm-teal';
  }
}

async function boot() {
  applyShotParam();
  applyLayout(grid, layoutById(state.layout));
  applyGrade();
  syncPickers();
  renderPanels(panels, state, photos);
  renderCallouts(calloutEls, state);
  renderTitlePosition();
  buildStrip();
  syncEditor();

  // Load every sample photo, then frame each panel on its face.
  const loads = photos.map(
    (photo, i) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          images.set(i, img);
          resolve(img);
        };
        img.onerror = () => resolve(null);
        img.src = photo.url;
      }),
  );
  await Promise.all(loads);
  await Promise.all(
    state.panels.map((panel, i) => {
      const img = images.get(panel.photo);
      return img ? applyFaceCrop(img, photos[panel.photo].url, panel, i === 0) : Promise.resolve();
    }),
  );
  renderPanels(panels, state, photos);
  syncEditor();
  window.__goldenHourReady = true;
}

boot();
