// Wires the Vice Nights editor: photo slots with crop controls, caption and tagline, colour grade,
// preview size, and PNG export in the three post sizes. A `?shot=` query sets up a fixed scene for
// a screenshot instead (see ./shots.js).
import { drawCover } from './cover.js';
import { runShot } from './shots.js';

const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};
const SAMPLES = ['samples/boulevard.jpg', 'samples/pier.jpg', 'samples/city.jpg'];

const canvas = document.getElementById('preview');
const captionInput = document.getElementById('caption');
const taglineInput = document.getElementById('tagline');
const gradeSelect = document.getElementById('grade');
const sizeSelect = document.getElementById('size');
const statusLine = document.getElementById('status');

const state = {
  photos: [null, null, null],
  caption: captionInput.value,
  tagline: taglineInput.value,
  grade: gradeSelect.value,
  titleColor: '#ffffff',
  size: sizeSelect.value,
};

function render() {
  drawCover(canvas, state);
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Puts an image into a panel slot, keeping whatever crop the slot already had. */
async function setSlotPhoto(slot, img) {
  const old = state.photos[slot];
  state.photos[slot] = {
    img,
    zoom: old ? old.zoom : 1,
    ox: old ? old.ox : 0,
    oy: old ? old.oy : 0,
  };
  render();
}

async function loadSampleInto(slot, url) {
  try {
    await setSlotPhoto(slot, await loadImage(url));
  } catch {
    statusLine.textContent = `Could not load ${url}`;
  }
}

function loadDisplayFont() {
  if (!('FontFace' in window)) return Promise.resolve();
  const face = new FontFace('Anton', 'url(./fonts/Anton-Regular.ttf)');
  return face
    .load()
    .then((loaded) => {
      document.fonts.add(loaded);
      render();
    })
    .catch(() => {
      statusLine.textContent = 'Display font did not load; using a fallback face.';
    });
}

document.querySelectorAll('input[data-photo]').forEach((input) => {
  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file) return;
    const slot = Number(input.dataset.photo);
    try {
      await setSlotPhoto(slot, await loadImage(URL.createObjectURL(file)));
      statusLine.textContent = `Photo loaded into panel ${slot + 1}.`;
    } catch {
      statusLine.textContent = 'That file could not be read as an image.';
    }
  });
});

document.querySelectorAll('button[data-sample]').forEach((button) => {
  button.addEventListener('click', async () => {
    const slot = Number(button.dataset.sample);
    const next = SAMPLES[(SAMPLES.indexOf(button.dataset.current ?? '') + 1) % SAMPLES.length];
    button.dataset.current = next;
    await loadSampleInto(slot, next);
  });
});

document.querySelectorAll('input[data-zoom]').forEach((input) => {
  input.addEventListener('input', () => {
    const slot = Number(input.dataset.zoom);
    if (state.photos[slot]) state.photos[slot].zoom = Number(input.value);
    render();
  });
});
document.querySelectorAll('input[data-ox]').forEach((input) => {
  input.addEventListener('input', () => {
    const slot = Number(input.dataset.ox);
    if (state.photos[slot]) state.photos[slot].ox = Number(input.value);
    render();
  });
});
document.querySelectorAll('input[data-oy]').forEach((input) => {
  input.addEventListener('input', () => {
    const slot = Number(input.dataset.oy);
    if (state.photos[slot]) state.photos[slot].oy = Number(input.value);
    render();
  });
});

document.getElementById('fill-all').addEventListener('click', () => {
  const first = state.photos[0];
  if (!first) {
    statusLine.textContent = 'Load a photo into the hero panel first.';
    return;
  }
  state.photos[1] = { img: first.img, zoom: 1, ox: 0, oy: 0 };
  state.photos[2] = { img: first.img, zoom: 1, ox: 0, oy: 0 };
  render();
  statusLine.textContent = 'One photo fills all three panels.';
});

captionInput.addEventListener('input', () => {
  state.caption = captionInput.value;
  render();
});
taglineInput.addEventListener('input', () => {
  state.tagline = taglineInput.value;
  render();
});
gradeSelect.addEventListener('change', () => {
  state.grade = gradeSelect.value;
  render();
});
sizeSelect.addEventListener('change', () => {
  state.size = sizeSelect.value;
  const [w, h] = SIZES[state.size];
  canvas.width = w;
  canvas.height = h;
  render();
});
document.querySelectorAll('button[data-color]').forEach((button) => {
  button.addEventListener('click', () => {
    state.titleColor = button.dataset.color;
    document.querySelectorAll('button[data-color]').forEach((b) => b.classList.toggle('picked', b === button));
    render();
  });
});

/** Draws the cover at `w` x `h` on a fresh canvas and resolves to its PNG blob. */
export function exportPNG(w, h) {
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, state);
  return new Promise((resolve) => off.toBlob(resolve, 'image/png'));
}

function wireExport(buttonId, w, h) {
  document.getElementById(buttonId).addEventListener('click', async () => {
    const blob = await exportPNG(w, h);
    if (!blob) {
      statusLine.textContent = 'Export failed.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-nights-${w}x${h}.png`;
    a.click();
    statusLine.textContent = `Saved vice-nights-${w}x${h}.png`;
  });
}
wireExport('export-square', 1080, 1080);
wireExport('export-portrait', 1080, 1350);
wireExport('export-wide', 1920, 1080);

// Test hook used by the maker's own checks: returns the exported PNG as a data URL.
window.__exportCover = async (w, h) => {
  const blob = await exportPNG(w, h);
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};

// Hooks the fixed screenshot scenes use.
const hooks = {
  setSize(size) {
    if (!SIZES[size]) return;
    state.size = size;
    sizeSelect.value = size;
    const [w, h] = SIZES[size];
    canvas.width = w;
    canvas.height = h;
  },
  setCaption(text) {
    state.caption = text;
    captionInput.value = text;
  },
  setTagline(text) {
    state.tagline = text;
    taglineInput.value = text;
  },
  setGrade(grade) {
    state.grade = grade;
    gradeSelect.value = grade;
  },
  async loadSample(url, slot) {
    await loadSampleInto(slot, url);
  },
  setSlot(slot, crop) {
    const current = state.photos[slot];
    if (!current) return;
    state.photos[slot] = { ...current, ...crop };
  },
  render,
};

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
await loadDisplayFont();
if (shot) {
  await runShot(shot, params, hooks);
} else {
  render();
}
