// Renders the Vice Nights cover: three photo panels under a sunset grade, palm silhouettes and a
// retro sun on the hero panel, then a bold caption band. Everything is drawn from the state passed
// in, so the same function paints the live preview and every exported PNG at any size.
//
// A photo slot is { img, zoom, ox, oy }: img is an HTMLImageElement or null, zoom scales the
// cover-fit photo, ox/oy shift it sideways and up or down as fractions of the panel.

const INK = '#14061f';

function panelPolygons(w, h, g) {
  const heroBottomL = h * 0.47;
  const heroBottomR = h * 0.52;
  const rowBottom = h * 0.78;
  const splitX = w * 0.56;
  const midTop = heroBottomL + ((heroBottomR - heroBottomL) * splitX) / w;
  return [
    // Hero panel, full width, its foot edge slanting down to the right.
    [
      [0, 0],
      [w, 0],
      [w, heroBottomR],
      [0, heroBottomL],
    ],
    // Lower-left panel, its top edge following the hero's slant.
    [
      [0, heroBottomL + g],
      [splitX - g / 2, midTop + g],
      [splitX - g / 2, rowBottom],
      [0, rowBottom],
    ],
    // Lower-right panel.
    [
      [splitX + g / 2, midTop + g],
      [w, heroBottomR + g],
      [w, rowBottom],
      [splitX + g / 2, rowBottom],
    ],
  ];
}

function tracePolygon(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
}

function panelBox(points) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

/** Fills a panel with its photo, cover-fit with the slot's zoom and offsets, or a sunset wash. */
function drawPanel(ctx, points, slot, h) {
  const box = panelBox(points);
  ctx.save();
  tracePolygon(ctx, points);
  ctx.clip();
  if (slot && slot.img) {
    const img = slot.img;
    const zoom = slot.zoom || 1;
    const scale = Math.max(box.w / img.naturalWidth, box.h / img.naturalHeight) * zoom;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = box.x + (box.w - dw) / 2 + (slot.ox || 0) * box.w * 0.35;
    const dy = box.y + (box.h - dh) / 2 + (slot.oy || 0) * box.h * 0.35;
    ctx.drawImage(img, dx, dy, dw, dh);
  } else {
    const wash = ctx.createLinearGradient(0, box.y, 0, box.y + box.h);
    wash.addColorStop(0, '#ff9a3d');
    wash.addColorStop(0.55, '#c22769');
    wash.addColorStop(1, '#5b1a86');
    ctx.fillStyle = wash;
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.fillStyle = 'rgba(255, 211, 25, 0.85)';
    ctx.beginPath();
    ctx.arc(box.x + box.w * 0.5, box.y + box.h * 0.45, h * 0.09, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** A palm silhouette: a leaning trunk and five fronds that arch up out of the crown, then droop. */
function drawPalm(ctx, x, y, s, lean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(lean, 1);
  ctx.strokeStyle = 'rgba(20, 6, 31, 0.9)';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(3, s * 0.09);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(s * 0.1, -s * 0.45, s * 0.26, -s * 0.88);
  ctx.stroke();
  const crownX = s * 0.26;
  const crownY = -s * 0.88;
  ctx.lineWidth = Math.max(2, s * 0.045);
  // Each frond: reach sideways, arch height above the crown, tip drop below it, length.
  const fronds = [
    [-1.0, 0.28, 0.3, 0.85],
    [-0.62, 0.38, 0.08, 0.92],
    [-0.15, 0.42, -0.06, 0.88],
    [0.35, 0.38, 0.02, 0.92],
    [0.85, 0.28, 0.24, 0.82],
  ];
  for (const [fx, arch, drop, len] of fronds) {
    const ex = crownX + fx * len * s;
    const ey = crownY + drop * s;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(crownX + fx * len * s * 0.5, crownY - arch * s, ex, ey);
    ctx.stroke();
  }
  ctx.restore();
}

/** The retro sun and the palms, clipped to the hero panel so they never spill into a gutter. */
function drawSunAndPalms(ctx, heroPoints, w, h) {
  ctx.save();
  tracePolygon(ctx, heroPoints);
  ctx.clip();
  const sunX = w * 0.78;
  const sunY = h * 0.14;
  const sunR = h * 0.085;
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.2);
  glow.addColorStop(0, 'rgba(255, 211, 25, 0.55)');
  glow.addColorStop(0.45, 'rgba(255, 90, 120, 0.22)');
  glow.addColorStop(1, 'rgba(255, 90, 120, 0)');
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - sunR * 2.2, sunY - sunR * 2.2, sunR * 4.4, sunR * 4.4);
  const disc = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
  disc.addColorStop(0, '#ffd319');
  disc.addColorStop(1, '#ff2975');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 120, 80, 0.3)';
  for (let i = 0; i < 3; i++) {
    const barY = sunY + sunR * (0.15 + i * 0.28);
    ctx.fillRect(sunX - sunR, barY, sunR * 2, sunR * 0.07);
  }
  ctx.globalCompositeOperation = 'source-over';
  drawPalm(ctx, w * 0.05, h * 0.46, h * 0.13, 1);
  drawPalm(ctx, w * 0.93, h * 0.495, h * 0.09, -1);
  ctx.restore();
}

/** The colour grade: a sunset, neon or dusk wash laid over the photo area only. */
function applyGrade(ctx, grade, w, h) {
  const photoBottom = h * 0.785;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, photoBottom);
  ctx.clip();
  let wash;
  if (grade === 'neon') {
    wash = ctx.createLinearGradient(0, 0, w, photoBottom);
    wash.addColorStop(0, 'rgba(255, 41, 117, 0.5)');
    wash.addColorStop(0.5, 'rgba(120, 60, 255, 0.25)');
    wash.addColorStop(1, 'rgba(34, 211, 238, 0.45)');
  } else if (grade === 'dusk') {
    wash = ctx.createLinearGradient(0, 0, 0, photoBottom);
    wash.addColorStop(0, 'rgba(40, 60, 180, 0.35)');
    wash.addColorStop(1, 'rgba(90, 26, 134, 0.5)');
  } else {
    wash = ctx.createLinearGradient(0, 0, 0, photoBottom);
    wash.addColorStop(0, 'rgba(255, 154, 61, 0.35)');
    wash.addColorStop(0.6, 'rgba(255, 90, 120, 0.3)');
    wash.addColorStop(1, 'rgba(91, 26, 134, 0.45)');
  }
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, photoBottom);
  ctx.globalCompositeOperation = 'source-over';
  const vignette = ctx.createRadialGradient(w / 2, photoBottom / 2, Math.min(w, photoBottom) * 0.35, w / 2, photoBottom / 2, Math.max(w, photoBottom) * 0.75);
  vignette.addColorStop(0, 'rgba(10, 4, 20, 0)');
  vignette.addColorStop(1, 'rgba(10, 4, 20, 0.4)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, photoBottom);
  ctx.restore();
}

/** The caption band: a dark strip with the big title, a neon rule and the tagline. */
function drawCaptionBand(ctx, state, w, h, g) {
  const top = h * 0.78 + g;
  ctx.fillStyle = '#12081f';
  ctx.fillRect(0, top, w, h - top);
  ctx.fillStyle = '#ff2975';
  ctx.fillRect(0, top, w, Math.max(3, h * 0.004));
  const title = (state.caption || '').trim().toUpperCase();
  const tagline = (state.tagline || '').trim().toUpperCase();
  const bandH = h - top;
  if (title) {
    let size = bandH * 0.52;
    ctx.font = `${size}px Anton, sans-serif`;
    while (ctx.measureText(title).width > w * 0.92 && size > 10) {
      size -= 2;
      ctx.font = `${size}px Anton, sans-serif`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(2, size * 0.09);
    ctx.fillStyle = state.titleColor || '#ffffff';
    const titleY = top + bandH * 0.42;
    ctx.strokeText(title, w / 2, titleY);
    ctx.fillText(title, w / 2, titleY);
  }
  if (tagline) {
    const tagSize = Math.max(10, bandH * 0.16);
    ctx.font = `${tagSize}px Anton, sans-serif`;
    try {
      ctx.letterSpacing = `${Math.max(2, tagSize * 0.25)}px`;
    } catch {
      // Older canvas builds ignore letterSpacing; the tagline still draws.
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff9ecf';
    ctx.fillText(tagline, w / 2, top + bandH * 0.83);
    try {
      ctx.letterSpacing = '0px';
    } catch {
      // Nothing to reset on builds without the property.
    }
  }
}

/**
 * Draws the whole cover onto `canvas` at its own pixel size.
 * `state` carries photos (three slots), caption, tagline, grade and titleColor.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const g = Math.max(6, Math.round(w * 0.008));
  ctx.fillStyle = '#0d0616';
  ctx.fillRect(0, 0, w, h);
  const polys = panelPolygons(w, h, g);
  polys.forEach((points, i) => drawPanel(ctx, points, state.photos[i], h));
  drawSunAndPalms(ctx, polys[0], w, h);
  applyGrade(ctx, state.grade, w, h);
  drawCaptionBand(ctx, state, w, h, g);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = g;
  ctx.strokeRect(g / 2, g / 2, w - g, h - g);
}
