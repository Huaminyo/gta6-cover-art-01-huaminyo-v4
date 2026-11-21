// Golden Hour — Cover Studio: PNG export.
//
// Renders the cover to a real canvas at 2048x2048 (1:1), 2048x2560
// (4:5) or 2560x1440 (16:9) and downloads it. The panel rectangles
// are recomputed from the layout's grid areas (the same fr weights
// the CSS grid uses), photos are drawn with cover semantics plus the
// per-panel crop offset and zoom, the grade filter is applied through
// ctx.filter, and the title, tags, callouts, quote, seal, badge and
// billing block are drawn on top — so the PNG matches the screen.

import { layoutById } from './panels.js';
import { gradeById } from './grades.js';

export const EXPORT_SIZES = [
  { id: '1:1', label: 'Square 1:1', w: 2048, h: 2048 },
  { id: '4:5', label: 'Portrait 4:5', w: 2048, h: 2560 },
  { id: '16:9', label: 'Wide 16:9', w: 2560, h: 1440 },
];

// Tint pairs that approximate each grade's screen overlay, drawn as a
// linear gradient over the finished cover.
const GRADE_TINTS = {
  'vice-gold': ['rgba(255,176,66,0.20)', 'rgba(20,120,140,0.12)'],
  'palm-teal': ['rgba(0,190,180,0.16)', 'rgba(0,60,90,0.14)'],
  'sunset-heat': ['rgba(255,90,40,0.22)', 'rgba(160,20,60,0.16)'],
  'ocean-drive': ['rgba(80,180,255,0.14)', 'rgba(255,200,120,0.10)'],
  'desert-dust': ['rgba(230,190,120,0.20)', 'rgba(120,70,20,0.10)'],
  'blood-moon': ['rgba(200,20,40,0.20)', 'rgba(60,0,20,0.18)'],
  'mono-chrome': ['rgba(255,255,255,0.06)', 'rgba(0,0,0,0.10)'],
  'midnight-blue': ['rgba(20,40,120,0.22)', 'rgba(0,10,40,0.16)'],
  'neon-noir': ['rgba(255,0,160,0.14)', 'rgba(0,40,160,0.22)'],
};

const AREA_LETTERS = ['h', 'a', 'b', 'c', 'd', 'e', 'f'];

function parseFr(track) {
  return track
    .trim()
    .split(/\s+/)
    .map((part) => {
      const m = part.match(/^([\d.]+)fr$/);
      return m ? parseFloat(m[1]) : 1;
    });
}

// Turn a layout's grid areas into pixel rectangles inside (x, y, w, h).
function layoutRects(layout, x, y, w, h, gap) {
  const cols = parseFr(layout.cols);
  const rows = parseFr(layout.rows);
  const colTotal = cols.reduce((a, b) => a + b, 0);
  const rowTotal = rows.reduce((a, b) => a + b, 0);
  const colW = cols.map((f) => (f / colTotal) * (w - gap * (cols.length - 1)));
  const rowH = rows.map((f) => (f / rowTotal) * (h - gap * (rows.length - 1)));
  const colX = [x];
  const rowY = [y];
  for (let i = 1; i < cols.length; i++) colX.push(colX[i - 1] + colW[i - 1] + gap);
  for (let i = 1; i < rows.length; i++) rowY.push(rowY[i - 1] + rowH[i - 1] + gap);

  const cells = {};
  layout.areas.forEach((rowStr, r) => {
    rowStr.split(/\s+/).forEach((letter, c) => {
      cells[letter] = cells[letter] ?? { r0: r, r1: r, c0: c, c1: c };
      const cell = cells[letter];
      cell.r0 = Math.min(cell.r0, r);
      cell.r1 = Math.max(cell.r1, r);
      cell.c0 = Math.min(cell.c0, c);
      cell.c1 = Math.max(cell.c1, c);
    });
  });

  return AREA_LETTERS.map((letter) => {
    const cell = cells[letter];
    const rx = colX[cell.c0];
    const ry = rowY[cell.r0];
    const rw = colX[cell.c1] + colW[cell.c1] - rx;
    const rh = rowY[cell.r1] + rowH[cell.r1] - ry;
    return { x: rx, y: ry, w: rw, h: rh };
  });
}

function drawPhoto(ctx, img, rect, panel, grade) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (!iw || !ih) return;
  const scale = Math.max(rect.w / iw, rect.h / ih) * (panel.zoom / 100);
  const dw = iw * scale;
  const dh = ih * scale;
  // CSS object-position semantics: the p% point of the image lines up
  // with the p% point of the frame.
  const dx = rect.x + (rect.w - dw) * (panel.x / 100);
  const dy = rect.y + (rect.h - dh) * (panel.y / 100);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.filter = grade.canvasFilter;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function drawRoleTag(ctx, rect, text, scale) {
  if (!text) return;
  const padX = 14 * scale;
  const padY = 8 * scale;
  const fontSize = 30 * scale;
  ctx.save();
  ctx.font = `600 ${fontSize}px Oswald, sans-serif`;
  const tw = ctx.measureText(text).width;
  const bw = tw + padX * 2;
  const bh = fontSize + padY * 2;
  const bx = rect.x + 14 * scale;
  const by = rect.y + rect.h - bh - 14 * scale;
  ctx.fillStyle = 'rgba(10, 8, 4, 0.82)';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#ffe9a8';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + padX, by + bh / 2 + 1);
  ctx.restore();
}

// Striped chrome-gold title: a gradient with hard alternating bands
// (the stripes), a dark outline and a warm glow underneath.
function drawTitle(ctx, text, cx, cy, maxWidth, scale) {
  ctx.save();
  let fontSize = 190 * scale;
  ctx.font = `${fontSize}px Anton, sans-serif`;
  while (ctx.measureText(text).width > maxWidth && fontSize > 40) {
    fontSize -= 6;
    ctx.font = `${fontSize}px Anton, sans-serif`;
  }
  const grad = ctx.createLinearGradient(0, cy - fontSize * 0.55, 0, cy + fontSize * 0.45);
  const bands = ['#fffbe0', '#ffd76a', '#c98f1b', '#ffe9a8', '#a86e0a', '#ffd76a', '#fff3c4'];
  bands.forEach((color, i) => grad.addColorStop(i / (bands.length - 1), color));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(255,140,40,0.55)';
  ctx.shadowBlur = 34 * scale;
  ctx.lineWidth = Math.max(2, 10 * scale);
  ctx.strokeStyle = '#2a1500';
  ctx.strokeText(text, cx, cy);
  ctx.shadowBlur = 0;
  ctx.fillStyle = grad;
  ctx.fillText(text, cx, cy);
  // Thin bright top edge for the chrome lip.
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = `${fontSize}px Anton, sans-serif`;
  ctx.fillText(text, cx, cy - fontSize * 0.02);
  ctx.restore();
  return fontSize;
}

function drawCallout(ctx, text, x, y, scale) {
  ctx.save();
  const fontSize = 44 * scale;
  ctx.font = `700 ${fontSize}px Oswald, sans-serif`;
  ctx.textBaseline = 'top';
  ctx.lineWidth = Math.max(2, 7 * scale);
  ctx.strokeStyle = 'rgba(10,8,4,0.9)';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = '#fff3d0';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawWanted(ctx, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.14);
  const w = 250 * scale;
  const h = 120 * scale;
  ctx.fillStyle = 'rgba(245, 230, 190, 0.94)';
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.lineWidth = 5 * scale;
  ctx.strokeStyle = '#3a2410';
  ctx.strokeRect(-w / 2 + 6 * scale, -h / 2 + 6 * scale, w - 12 * scale, h - 12 * scale);
  ctx.fillStyle = '#3a2410';
  ctx.font = `${64 * scale}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('WANTED', 0, -8 * scale);
  ctx.font = `600 ${24 * scale}px Oswald, sans-serif`;
  ctx.fillText('DEAD OR ALIVE', 0, 34 * scale);
  ctx.restore();
}

function drawSeal(ctx, cx, cy, radius, scale) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = 'rgba(255,233,168,0.95)';
  ctx.lineWidth = 3 * scale;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  const text = 'LEONIDA • EST. 2026 • GOLDEN HOUR • ';
  ctx.fillStyle = 'rgba(255,233,168,0.95)';
  ctx.font = `600 ${radius * 0.24}px Oswald, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const step = (Math.PI * 2) / text.length;
  for (let i = 0; i < text.length; i++) {
    ctx.save();
    ctx.rotate(i * step - Math.PI / 2);
    ctx.translate(0, -radius * 0.86);
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
  }
  ctx.font = `${radius * 0.7}px Anton, sans-serif`;
  ctx.fillText('★', 0, radius * 0.04);
  ctx.restore();
}

function drawBilling(ctx, cx, y, maxWidth, scale) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,243,208,0.85)';
  ctx.font = `${20 * scale}px Oswald, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(
    'A LEONIDA PICTURES PRODUCTION  •  STARRING THE DRIVER  •  THE FIXER  •  THE QUEEN  •  THE RIDER',
    cx,
    y,
    maxWidth,
  );
  ctx.fillText('DIRECTED BY GOLDEN HOUR STUDIO  •  MUSIC BY VICE FM  •  © 2026 LEONIDA PICTURES', cx, y + 26 * scale, maxWidth);
  ctx.restore();
}

// Render the whole cover to a canvas. `images` maps photo index to a
// loaded HTMLImageElement (or null while loading).
export async function renderCover(state, photos, images, size) {
  await document.fonts.ready;
  const { w, h } = size;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const scale = w / 2048;
  const grade = gradeById(state.grade);
  const layout = layoutById(state.layout);

  // Background: warm dark frame.
  ctx.fillStyle = '#171009';
  ctx.fillRect(0, 0, w, h);

  const margin = state.fullBleed ? 0 : Math.round(28 * scale);
  const titleBand = state.titleOver ? 0 : Math.round(h * 0.13);
  // The quote bar sits BELOW the grid (never over the bottom-row
  // panels, whose role tags it used to cover), so the grid gives up
  // its height.
  const quoteH = Math.round(64 * scale);
  const coverX = margin;
  const coverY = margin;
  const coverW = w - margin * 2;
  const coverH = h - margin * 2 - titleBand - quoteH;
  const gap = Math.round(10 * scale);

  const rects = layoutRects(layout, coverX, coverY, coverW, coverH, gap);

  // Supporting panels first, hero last so its pop-out overlaps them.
  // The pop-out is clamped to the cover bounds: it may overlap
  // neighbours, never bleed off the canvas edge (which used to clip
  // the hero's own role tag). Tags are drawn in a second pass so the
  // hero never covers a neighbour's tag.
  const order = [1, 2, 3, 4, 5, 6, 0];
  const drawnRects = [];
  for (const i of order) {
    const panel = state.panels[i];
    // images is a Map (photo index -> HTMLImageElement), not an array.
    const img = images.get(panel.photo);
    if (!img) continue;
    const rect = rects[i];
    if (i === 0) {
      // Pop-out hero: drawn 4% larger, centred, with a drop shadow.
      const grow = 0.04;
      const heroRect = {
        x: Math.max(coverX, rect.x - rect.w * grow),
        y: Math.max(coverY, rect.y - rect.h * grow),
        w: rect.w * (1 + grow * 2),
        h: rect.h * (1 + grow * 2),
      };
      heroRect.w = Math.min(heroRect.w, coverX + coverW - heroRect.x);
      heroRect.h = Math.min(heroRect.h, coverY + coverH - heroRect.y);
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = 40 * scale;
      ctx.shadowOffsetY = 14 * scale;
      ctx.fillStyle = '#000';
      ctx.fillRect(heroRect.x, heroRect.y, heroRect.w, heroRect.h);
      ctx.restore();
      drawPhoto(ctx, img, heroRect, panel, grade);
      drawnRects[i] = heroRect;
    } else {
      drawPhoto(ctx, img, rect, panel, grade);
      drawnRects[i] = rect;
    }
  }
  for (let i = 0; i < 7; i++) {
    const panel = state.panels[i];
    if (panel.showTag && drawnRects[i]) drawRoleTag(ctx, drawnRects[i], panel.role, scale);
  }

  // Grade tint over the whole cover.
  const tint = GRADE_TINTS[state.grade] ?? GRADE_TINTS['vice-gold'];
  const tintGrad = ctx.createLinearGradient(coverX, coverY, coverX + coverW * 0.4, coverY + coverH);
  tintGrad.addColorStop(0, tint[0]);
  tintGrad.addColorStop(1, tint[1]);
  ctx.fillStyle = tintGrad;
  ctx.fillRect(coverX, coverY, coverW, coverH);

  // Title: over the art (top centre of the cover) or in the band below.
  if (state.titleOver) {
    drawTitle(ctx, state.title, coverX + coverW / 2, coverY + 120 * scale, coverW * 0.92, scale);
  } else {
    drawTitle(ctx, state.title, w / 2, h - margin - titleBand / 2, w * 0.9, scale);
  }

  // Callouts at their percentage positions on the cover.
  for (const callout of state.callouts) {
    drawCallout(
      ctx,
      callout.text,
      coverX + (callout.x / 100) * coverW,
      coverY + (callout.y / 100) * coverH,
      scale,
    );
  }

  // Quote bar below the grid.
  const quoteY = coverY + coverH;
  ctx.fillStyle = 'rgba(10, 8, 4, 0.78)';
  ctx.fillRect(coverX, quoteY, coverW, quoteH);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = `italic 600 ${30 * scale}px Oswald, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`"${state.quote}"`, coverX + 24 * scale, quoteY + quoteH / 2, coverW * 0.62);
  ctx.textAlign = 'right';
  ctx.font = `600 ${24 * scale}px Oswald, sans-serif`;
  ctx.fillStyle = 'rgba(255,233,168,0.75)';
  ctx.fillText(`— ${state.quoteBy}`, coverX + coverW - 24 * scale, quoteY + quoteH / 2);

  // WANTED badge (top-right of the cover) and the seal (bottom-right
  // of the grid, above the quote bar).
  if (state.wanted) drawWanted(ctx, coverX + coverW - 150 * scale, coverY + 130 * scale, scale);
  drawSeal(ctx, coverX + coverW - 110 * scale, coverY + coverH - 110 * scale, 74 * scale, scale);

  // Billing block under the cover (or in the margin when full-bleed).
  if (!state.fullBleed) {
    drawBilling(ctx, w / 2, h - margin + 2 * scale, w * 0.9, scale);
  }

  return canvas;
}

export function downloadCanvas(canvas, filename) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      resolve(blob);
    }, 'image/png');
  });
}
