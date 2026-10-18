// Builds the wiki as plain files in site/ so it can be hosted on GitHub Pages:
//   node scripts/build-static.js
// No installs needed. The page, styles, scripts, and wiki text go into one index.html;
// logos, screenshots, and videos are copied next to it.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'site');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
// Code goes inside <script> tags, so a literal "</script" would end the tag early.
const asScript = (code) => code.replace(/<\/script/gi, '<\\/script');

const pages = fs.readdirSync(path.join(ROOT, 'docs'))
  .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
  .map((f) => {
    const text = read(`docs/${f}`);
    const title = (text.match(/^#\s+(.+)$/m) || [null, f.replace(/\.md$/, '')])[1];
    return { slug: f.replace(/\.md$/, ''), title, text };
  });

const apps = Object.entries(JSON.parse(read('config/apps.json')))
  .filter(([id]) => !id.startsWith('_'))
  .map(([id, app]) => ({ id, label: app.label }));

const site = {
  pages,
  sidebar: read('docs/_sidebar.md'),
  checklists: JSON.parse(read('data/checklists.json')),
  apps: { platform: 'static', apps },
};

const banner = `
<div class="static-banner">Online copy for training. Checkmarks are saved in this browser only. The Open buttons work on the church MacBook.</div>`;

const bannerCss = `
.static-banner { padding: 6px 24px; background: var(--bg-subtle); border-bottom: 1px solid var(--border-light); color: var(--muted); font-size: 13px; }
@media (max-width: 760px) { .static-banner { padding: 6px 16px; } }
@media print { .static-banner { display: none; } }`;

// Each swap must find its target, so a change to public/index.html can't silently break the build.
function swap(html, target, replacement) {
  if (!html.includes(target)) throw new Error(`public/index.html no longer contains: ${target}`);
  return html.replace(target, () => replacement);
}

let html = read('public/index.html');
html = swap(html, '<link rel="stylesheet" href="/style.css">', `<style>${read('public/style.css')}${bannerCss}</style>`);
html = swap(html, '<body>', `<body>${banner}`);
html = swap(html, '<script src="/vendor/marked.umd.js"></script>', `<script>${asScript(read('public/vendor/marked.umd.js'))}</script>`);
html = swap(html, '<script src="/visuals.js"></script>',
  `<script>window.STATIC_SITE = true;\nwindow.__SITE__ = ${asScript(JSON.stringify(site))};\n${asScript(read('scripts/static-shim.js'))}</script>\n<script>${asScript(read('public/visuals.js'))}</script>`);
html = swap(html, '<script src="/app.js"></script>', `<script>${asScript(read('public/app.js'))}</script>`);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), html);
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
fs.cpSync(path.join(ROOT, 'public', 'images'), path.join(OUT, 'images'), { recursive: true });
fs.cpSync(path.join(ROOT, 'docs', 'images'), path.join(OUT, 'docs', 'images'), { recursive: true });
fs.cpSync(path.join(ROOT, 'docs', 'videos'), path.join(OUT, 'docs', 'videos'), { recursive: true });

console.log(`Built ${path.relative(ROOT, OUT)}/ (${pages.length} pages, ${(html.length / 1024).toFixed(0)} KB)`);
