// Golden Hour — Cover Studio: face-aware crop.
//
// Where the browser offers FaceDetector (Chrome), each photo's first
// face is found once and the panel's crop offset is set so the face
// lands in the middle of the frame — the hero gets a tighter crop
// (people-first). Where FaceDetector is missing, the offset stays at
// the center (50/50) and nothing breaks.

const cache = new Map(); // photo key -> {x, y} focal point in percent

function detectorAvailable() {
  return typeof window !== 'undefined' && 'FaceDetector' in window;
}

// Find the focal point of an image element: the centre of the largest
// detected face, as percentages of the image. Falls back to 50/50.
export async function focalPoint(img, key) {
  if (cache.has(key)) return cache.get(key);
  const center = { x: 50, y: 50 };
  if (!detectorAvailable()) {
    cache.set(key, center);
    return center;
  }
  try {
    const detector = new window.FaceDetector({ fastMode: true });
    const faces = await detector.detect(img);
    if (!faces || faces.length === 0) {
      cache.set(key, center);
      return center;
    }
    let best = faces[0];
    for (const face of faces) {
      const box = face.boundingBox;
      const area = box.width * box.height;
      const bestBox = best.boundingBox;
      if (area > bestBox.width * bestBox.height) best = face;
    }
    const box = best.boundingBox;
    const point = {
      x: Math.round(((box.x + box.width / 2) / img.naturalWidth) * 100),
      y: Math.round(((box.y + box.height / 2) / img.naturalHeight) * 100),
    };
    point.x = Math.max(0, Math.min(100, point.x));
    point.y = Math.max(0, Math.min(100, point.y));
    cache.set(key, point);
    return point;
  } catch {
    cache.set(key, center);
    return center;
  }
}

// Apply the focal point to a panel: the crop offset becomes the face
// position, so the photo is framed on the face. The hero also gets a
// closer zoom (people-first close-up).
export async function applyFaceCrop(img, key, panel, isHero) {
  const point = await focalPoint(img, key);
  panel.x = point.x;
  panel.y = point.y;
  if (isHero && panel.zoom < 130) panel.zoom = 130;
  return point;
}

export function clearFocalCache() {
  cache.clear();
}
