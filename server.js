// Glad Tidings Media Team Wiki - local server.
// No dependencies: run with `node server.js`, then open http://localhost:4321
//
// What it does:
//   - Serves the wiki website (public/) and the wiki pages (docs/)
//   - Serves the checklists (data/checklists.json)
//   - Saves checklist progress to data/runs/ so nothing gets lost
//   - Opens allowed apps (config/apps.json) when someone clicks an "Open" button

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const PORT = Number(process.env.PORT) || 4321;
const HOST = '127.0.0.1'; // only this computer can reach the server
const ROOT = __dirname;
const RUNS_DIR = path.join(ROOT, 'data', 'runs');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

// Serve a file from inside `baseDir`, refusing anything that escapes it.
function serveFile(res, baseDir, relPath) {
  const full = path.normalize(path.join(baseDir, relPath));
  if (!full.startsWith(baseDir + path.sep) && full !== baseDir) return send(res, 403, { error: 'Forbidden' });
  fs.stat(full, (err, stat) => {
    if (err || !stat.isFile()) return send(res, 404, { error: 'Not found' });
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(full).toLowerCase()] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': 'no-store',
    });
    fs.createReadStream(full).pipe(res);
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) reject(new Error('Body too large'));
    });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); }
    });
  });
}

// List wiki pages with their titles (first "# " heading) for search and the page index.
function listPages() {
  const docsDir = path.join(ROOT, 'docs');
  return fs.readdirSync(docsDir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .map((f) => {
      const text = fs.readFileSync(path.join(docsDir, f), 'utf8');
      const title = (text.match(/^#\s+(.+)$/m) || [null, f.replace(/\.md$/, '')])[1];
      return { slug: f.replace(/\.md$/, ''), title, text };
    });
}

function openApp(id) {
  const apps = readJson(path.join(ROOT, 'config', 'apps.json'));
  const app = apps[id];
  if (!app || id.startsWith('_')) return Promise.reject(new Error(`"${id}" is not in config/apps.json`));

  return new Promise((resolve, reject) => {
    const done = (err) => (err ? reject(new Error(`Could not open ${app.label}: ${err.message}`)) : resolve(app.label));
    if (process.platform === 'darwin') {
      execFile('open', ['-a', app.mac], done);
    } else if (process.platform === 'win32' && app.windows) {
      execFile('cmd', ['/c', 'start', '', app.windows], done);
    } else {
      reject(new Error(`Opening ${app.label} only works on the church MacBook.`));
    }
  });
}

// A "run" is one Thursday or Sunday checklist for one date, e.g. data/runs/2026-10-18-sunday.json
function runFile(date, checklist) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^[a-z0-9-]+$/.test(checklist)) throw new Error('Bad date or checklist');
  return path.join(RUNS_DIR, `${date}-${checklist}.json`);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = decodeURIComponent(url.pathname);

  try {
    // Only accept changes from the wiki page itself, not from other websites open in the browser.
    const origin = req.headers.origin;
    if (req.method === 'POST' && origin && origin !== `http://localhost:${PORT}` && origin !== `http://${HOST}:${PORT}`) {
      return send(res, 403, { error: 'Forbidden' });
    }

    if (p === '/api/pages' && req.method === 'GET') {
      return send(res, 200, listPages());
    }

    if (p === '/api/apps' && req.method === 'GET') {
      const apps = readJson(path.join(ROOT, 'config', 'apps.json'));
      const list = Object.entries(apps).filter(([k]) => !k.startsWith('_')).map(([id, a]) => ({ id, label: a.label }));
      return send(res, 200, { platform: process.platform, apps: list });
    }

    if (p === '/api/open' && req.method === 'POST') {
      const { app } = await readBody(req);
      const label = await openApp(String(app || ''));
      return send(res, 200, { ok: true, message: `Opening ${label}…` });
    }

    if (p === '/api/checklists' && req.method === 'GET') {
      return send(res, 200, readJson(path.join(ROOT, 'data', 'checklists.json')));
    }

    if (p === '/api/run' && req.method === 'GET') {
      const file = runFile(url.searchParams.get('date'), url.searchParams.get('checklist'));
      return send(res, 200, fs.existsSync(file) ? readJson(file) : { items: {} });
    }

    if (p === '/api/run' && req.method === 'POST') {
      const body = await readBody(req);
      const file = runFile(body.date, body.checklist);
      fs.mkdirSync(RUNS_DIR, { recursive: true });
      const run = fs.existsSync(file) ? readJson(file) : { date: body.date, checklist: body.checklist, items: {} };
      run.items[body.item] = {
        done: Boolean(body.done),
        by: String(body.by || '').slice(0, 60),
        at: new Date().toISOString(),
        note: String(body.note || '').slice(0, 500),
      };
      fs.writeFileSync(file, JSON.stringify(run, null, 2));
      return send(res, 200, run);
    }

    if (p.startsWith('/api/')) return send(res, 404, { error: 'Unknown API route' });
    if (p.startsWith('/docs/')) return serveFile(res, path.join(ROOT, 'docs'), p.slice('/docs/'.length));
    return serveFile(res, path.join(ROOT, 'public'), p === '/' ? 'index.html' : p.slice(1));
  } catch (err) {
    return send(res, 400, { error: err.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Media Team Wiki running at http://localhost:${PORT}`);
  console.log('Leave this window open while using the wiki. Press Ctrl+C to stop.');
});
