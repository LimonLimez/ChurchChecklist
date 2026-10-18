// Visual pieces used inside wiki pages:
//   [[map:propresenter]]   clickable map of an app window (see SCREEN_MAPS)
//   [[timeline:sunday]]    when we go live on a Sunday
// Maps are simplified layouts, not screenshots. Positions are percentages of the window.

const LOGOS = {
  propresenter: '/images/logos/propresenter.svg',
  streamlabs: '/images/logos/streamlabs.svg',
  youtube: '/images/logos/youtube.svg',
  facebook: '/images/logos/facebook.svg',
  chrome: '/images/logos/chrome.svg',
};

const logoImg = (id, size = 16) => (LOGOS[id]
  ? `<img class="logo" src="${LOGOS[id]}" width="${size}" height="${size}" alt="">`
  : '');

const SCREEN_MAPS = {
  propresenter: {
    title: 'ProPresenter',
    caption: 'Simplified map of the ProPresenter 7 window in Show mode. Click a number to learn what that part does.',
    regions: [
      { label: 'Toolbar', box: [0, 0, 100, 9], text: 'Switch between Show (running a service), Edit, Reflow, and Bible. Stay in Show mode on Sunday.' },
      { label: 'Library & playlists', box: [0, 9, 20, 91], text: "Libraries hold every song and presentation. Playlists hold one service's items in order. Click this Sunday's dated playlist." },
      { label: 'Slide view', box: [20, 9, 52, 63], text: 'The slides of the selected item. Click a slide to put it on the screens. The live slide gets an outline.' },
      { label: 'Media bin', box: [20, 72, 52, 28], text: 'Backgrounds, videos, and camera inputs. It can be toggled open and closed from the toolbar.' },
      { label: 'Preview', box: [72, 9, 28, 30], text: "Shows what is live right now. If it's here, it's on the screens." },
      { label: 'Clear buttons', box: [72, 39, 28, 16], text: 'Take things off the screen, one layer at a time (slide, media, props, messages, audio) or everything at once with Clear All.' },
      { label: 'Show controls', box: [72, 55, 28, 45], text: 'Audio bin, stage screen, timers (the countdown), messages, props, and macros.' },
    ],
  },
  streamlabs: {
    title: 'Streamlabs Desktop',
    caption: 'Simplified map of the Streamlabs Desktop Editor. Click a number to learn what that part does.',
    regions: [
      { label: 'Side menu', box: [0, 0, 6, 100], text: 'Stay on the Editor. Settings (the gear) is at the bottom of this menu.' },
      { label: 'Preview', box: [6, 0, 94, 58], text: 'Exactly what viewers on YouTube and Facebook see once you are live.' },
      { label: 'Scenes', box: [6, 58, 23, 34], text: 'Each scene is one look: before stream, camera, slides, end. Click one to switch to it.' },
      { label: 'Sources', box: [29, 58, 23, 34], text: "The pieces inside the selected scene, like the camera and ProPresenter's output. Don't change these on a Sunday." },
      { label: 'Audio mixer', box: [52, 58, 48, 34], text: 'Live sound levels. The bars should move with the sound and stay out of the red. A muted source shows a crossed-out speaker.' },
      { label: 'Status bar', box: [6, 92, 64, 8], text: 'CPU use, dropped frames, and upload speed. Rising dropped frames means the internet is struggling.' },
      { label: 'Go Live', box: [70, 92, 30, 8], text: 'Opens the Go Live window: check titles, make sure YouTube and Facebook are both on, then confirm. Only after worship ends.' },
    ],
  },
};

function screenMap(id) {
  const map = SCREEN_MAPS[id];
  if (!map) return `<p><em>No screen map called "${id}".</em></p>`;
  const regions = map.regions.map((r, i) => {
    const [x, y, w, h] = r.box;
    return `<button class="map-region" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%" data-step="${i}" aria-label="${i + 1}. ${r.label}">
      <span class="map-num">${i + 1}</span><span class="map-label">${r.label}</span></button>`;
  }).join('');
  const legend = map.regions.map((r, i) => `
    <li data-step="${i}"><strong>${r.label}.</strong> ${r.text}</li>`).join('');
  return `
<figure class="screen-map" data-map="${id}">
  <div class="map-window">
    <div class="map-titlebar"><span></span><span></span><span></span>${logoImg(id, 14)}<b>${map.title}</b></div>
    <div class="map-body">${regions}</div>
  </div>
  <figcaption>${map.caption}</figcaption>
  <ol class="map-legend">${legend}</ol>
</figure>`;
}

// One shared highlight between a map's regions and its numbered list.
document.addEventListener('click', (e) => {
  const hit = e.target.closest('.screen-map [data-step]');
  if (!hit) return;
  const fig = hit.closest('.screen-map');
  const step = hit.dataset.step;
  fig.querySelectorAll('[data-step]').forEach((el) => el.classList.toggle('selected', el.dataset.step === step));
});

function timeline(id) {
  if (id !== 'sunday') return `<p><em>No timeline called "${id}".</em></p>`;
  const stages = [
    { name: 'Before service', what: 'Set up, check screens, sound, and stream info', live: false },
    { name: 'Worship', what: 'Run lyrics in ProPresenter', live: false },
    { name: 'Sermon', what: 'Run slides and scripture', live: true },
    { name: 'Closing', what: 'End slide, then End Stream', live: true },
  ];
  return `
<figure class="timeline">
  <ol class="timeline-stages">
    ${stages.map((s) => `<li class="${s.live ? 'is-live' : ''}"><strong>${s.name}${s.live ? '<span class="live-tag">Live</span>' : ''}</strong><span>${s.what}</span></li>`).join('')}
  </ol>
  <div class="timeline-bar" aria-hidden="true">
    <div class="off">Not live</div>
    <div class="on">Live on YouTube and Facebook</div>
  </div>
  <figcaption>We click <strong>Go Live</strong> in Streamlabs when worship ends, not when service starts.</figcaption>
</figure>`;
}

window.Visuals = { LOGOS, logoImg, screenMap, timeline };
