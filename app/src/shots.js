// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos loaded;
// ?shot=cover shows the cover alone at the size the query names. window.__shotReady is set once
// the fonts are in and the scene has painted twice.
export async function runShot(shot, query, hooks) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  hooks.setSize(query.get('size') ?? '1080x1080');
  hooks.setCaption(query.get('caption') ?? 'Sunset Heist');
  hooks.setTagline(query.get('tagline') ?? 'Vice Nights');
  hooks.setGrade(query.get('grade') ?? 'sunset');
  await hooks.loadSample(`samples/${query.get('photo') ?? 'boulevard'}.jpg`, 0);
  await hooks.loadSample(`samples/${query.get('photo2') ?? 'pier'}.jpg`, 1);
  await hooks.loadSample(`samples/${query.get('photo') ?? 'boulevard'}.jpg`, 2);
  for (let slot = 0; slot < 3; slot++) {
    hooks.setSlot(slot, {
      zoom: Number(query.get(`zoom${slot}`) ?? 1),
      ox: Number(query.get(`ox${slot}`) ?? 0),
      oy: Number(query.get(`oy${slot}`) ?? 0),
    });
  }
  hooks.render();
  await document.fonts.ready;
  hooks.render();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
