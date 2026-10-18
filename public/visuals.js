// Visual pieces used inside wiki pages:
//   [[map:propresenter]]   screenshot with numbered, clickable parts (see SCREEN_MAPS)
//   [[timeline:sunday]]    when we go live on a Sunday

const LOGOS = {
  propresenter: '/images/logos/propresenter.svg',
  streamlabs: '/images/logos/streamlabs.svg',
  youtube: '/images/logos/youtube.svg',
  facebook: '/images/logos/facebook.svg',
  chrome: '/images/logos/chrome.svg',
};

// Hosted as plain files (GitHub Pages) the site lives under a folder like /ChurchChecklist/,
// so a leading slash would point at the wrong place. Drop it there.
const assetUrl = (url) => (window.STATIC_SITE ? url.replace(/^\//, '') : url);

const logoImg = (id, size = 16) => (LOGOS[id]
  ? `<img class="logo" src="${assetUrl(LOGOS[id])}" width="${size}" height="${size}" alt="">`
  : '');

// Each map is a real screenshot with numbered boxes on top. Boxes are measured in pixels of the
// screenshot as [x, y, width, height]; the page scales them. Screenshots live in docs/images/.
const SCREEN_MAPS = {
  streamlabs: {
    image: '/docs/images/streamlabs-main-output.webp',
    size: [2000, 1177],
    alt: 'The Streamlabs Desktop editor showing the Main OUTPUT scene',
    caption: 'Streamlabs Desktop on the media MacBook, showing the Main OUTPUT scene. Click a number to learn what that part does.',
    regions: [
      { label: 'Side menu', box: [10, 35, 245, 1085], text: 'Stay on Editor. Settings is at the bottom of this menu.' },
      { label: 'Logged In', box: [10, 1122, 245, 48], text: 'The YouTube and Facebook icons here mean both accounts are connected. See [[connected-accounts|Connected accounts]].' },
      { label: 'Preview', box: [290, 55, 1665, 670], text: 'What viewers see once we are live. Here it shows the sanctuary camera.' },
      { label: 'Mini Feed', box: [285, 740, 1675, 175], text: 'New likes and comments from our YouTube and Facebook. You do not need it to run the stream.' },
      { label: 'Scenes', box: [297, 930, 538, 175], text: 'Our scenes are Main OUTPUT (the one we are live on), Audience View, and Camera SETUP. Click one to switch to it. A scene called test sits below them. Ignore it.' },
      { label: 'Sources', box: [855, 930, 538, 175], text: 'What is inside the selected scene. Main OUTPUT has the camera (Video Capture Device) and the ProPresenter lower third, which shows lyrics. Do not change these on a Sunday.' },
      { label: 'Mixer', box: [1410, 930, 540, 175], text: 'The sound level of our audio interface (Scarlett 8i6 USB). The bar should move with the sound and stay out of the red.' },
      { label: 'Status bar', box: [290, 1132, 520, 46], text: 'CPU use, frames per second, dropped frames, and upload speed. Upload reads 0 kb/s until we are live. Dropped frames that keep rising mean the internet is struggling.' },
      { label: 'Go Live', box: [1785, 1135, 165, 42], text: 'Opens the Go Live window. Only click it after worship ends.' },
    ],
  },
  'streamlabs-golive': {
    image: '/docs/images/streamlabs-go-live.webp',
    size: [1080, 985],
    alt: 'The Streamlabs Go Live window with YouTube and Facebook switched on',
    caption: 'The Go Live window in Streamlabs. Click a number to learn what each part is for.',
    regions: [
      { label: 'Destinations', box: [44, 108, 342, 158], text: 'Turn on both YouTube (GT Church) and Facebook. The name under each is the account that is connected.' },
      { label: 'Title', box: [410, 104, 611, 101], text: 'We type the title on Sunday: the date, then a dash, then GT CHURCH. For example: October 18, 2026 - GT CHURCH.' },
      { label: 'Description', box: [410, 252, 611, 110], text: 'The CCLI Streaming Plus License line, the same on every stream.' },
      { label: 'Facebook page', box: [410, 362, 611, 220], text: 'Facebook Destination is "Share to a Page You Manage" and Facebook Page is "GT Church | Church".' },
      { label: 'Chat and output', box: [44, 745, 342, 125], text: 'In our screenshot Primary Chat is Facebook, and Dual Output and Stream Shift are unchecked. Leave them as they are.' },
      { label: 'Record Stream', box: [44, 905, 250, 48], text: 'Keep this switched on. It records a copy of every service on the MacBook.' },
      { label: 'Confirm & Go Live', box: [840, 906, 180, 46], text: 'Starts the stream on YouTube and Facebook at the same time. Only after worship ends.' },
    ],
  },
  propresenter: {
    image: '/docs/images/propresenter-main.webp',
    size: [2000, 988],
    alt: 'The ProPresenter window showing the Oct 18 playlist and the Announcements slides',
    caption: 'ProPresenter on the media MacBook, in Show mode with the Oct 18 playlist open. Click a number to learn what that part does.',
    regions: [
      { label: 'Toolbar', box: [0, 0, 2000, 62], text: 'Show is for running a service. Edit, Reflow, and Bible are for changing things. Stay in Show on Sunday.' },
      { label: 'Audience and Stage', box: [1700, 0, 140, 62], text: 'Green dots mean the audience screen and the stage screen are turned on.' },
      { label: 'Playlists', box: [0, 64, 256, 704], text: 'One playlist per Sunday, named by date (like Oct 18). Inside it are our sections: PreService, Welcome, Worship, and MESSAGE.' },
      { label: 'Slide view', box: [262, 64, 1425, 676], text: 'The slides of the selected item. Click a slide to put it on the screens. Here it shows the Announcements slides.' },
      { label: 'Preview', box: [1700, 95, 225, 175], text: 'Shows what is live. Under it, Stage Screen 1 shows the clock and the countdown.' },
      { label: 'Clear buttons', box: [1925, 64, 75, 215], text: 'The circled X clears everything. The icons down the edge clear one layer at a time, such as audio, messages, props, slides, and media.' },
      { label: 'Show controls', box: [1700, 450, 295, 175], text: 'Tabs for audio, timers, messages, props, and macros. The selected tab here lists macros, like Default Setup and Lower Third + Video Input 1.' },
      { label: 'Media bin', box: [185, 770, 1505, 215], text: 'Backgrounds and videos. ProContent and our media playlists are on the left, and the selected playlist is on the right.' },
    ],
  },
};

function screenMap(id) {
  const map = SCREEN_MAPS[id];
  if (!map) return `<p><em>No screen map called "${id}".</em></p>`;
  const [W, H] = map.size;
  const pct = (n, whole) => +((n / whole) * 100).toFixed(2);
  const regions = map.regions.map((r, i) => {
    const [x, y, w, h] = r.box;
    return `<button class="map-region" title="${r.label}" style="left:${pct(x, W)}%;top:${pct(y, H)}%;width:${pct(w, W)}%;height:${pct(h, H)}%" data-step="${i}" aria-label="${i + 1}. ${r.label}"><span class="map-num">${i + 1}</span></button>`;
  }).join('');
  const legend = map.regions.map((r, i) => `
    <li data-step="${i}"><strong>${r.label}.</strong> ${r.text}</li>`).join('');
  return `
<figure class="screen-map" data-map="${id}">
  <div class="map-body" style="aspect-ratio:${W} / ${H}">
    <img class="map-shot" src="${map.image}" alt="${map.alt}">
    ${regions}
  </div>
  <figcaption>${map.caption} <a href="${map.image}" target="_blank" rel="noopener">Open the screenshot full size</a>.</figcaption>
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
    { name: 'Before service', what: 'Set up, check screens, sound, and camera', live: false },
    { name: 'Worship', what: 'Run lyrics in ProPresenter', live: false },
    { name: 'Sermon', what: 'Run slides and scripture', live: true },
    { name: 'Closing', what: 'Click End Stream', live: true },
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

window.Visuals = { LOGOS, assetUrl, logoImg, screenMap, timeline };
