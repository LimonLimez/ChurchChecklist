// Stands in for server.js when the wiki is hosted as plain files (GitHub Pages).
// Pages, checklists, and apps come from window.__SITE__, embedded by build-static.js.
// Checklist progress is saved in this browser only. Open buttons explain they only work on the MacBook.
(() => {
  const SITE = window.__SITE__;
  const realFetch = window.fetch.bind(window);
  const memory = {};

  const load = (key) => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch { /* storage blocked */ }
    return memory[key] || null;
  };
  const save = (key, value) => {
    memory[key] = value;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked */ }
  };
  const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  window.fetch = async (url, options = {}) => {
    const u = new URL(url, location.href);
    const route = u.pathname.replace(/^.*?(\/api\/|\/docs\/_sidebar\.md)/, '$1');
    const post = (options.method || 'GET').toUpperCase() === 'POST';

    if (route === '/api/pages') return json(SITE.pages);
    if (route === '/api/apps') return json(SITE.apps);
    if (route === '/api/checklists') return json(SITE.checklists);
    if (route === '/docs/_sidebar.md') return new Response(SITE.sidebar);
    if (route === '/api/open') return json({ error: 'The Open buttons only work on the church MacBook.' }, 400);

    if (route === '/api/run') {
      if (!post) {
        const key = `run:${u.searchParams.get('date')}:${u.searchParams.get('checklist')}`;
        return json(load(key) || { items: {} });
      }
      const body = JSON.parse(options.body);
      const key = `run:${body.date}:${body.checklist}`;
      const run = load(key) || { date: body.date, checklist: body.checklist, items: {} };
      run.items[body.item] = { done: !!body.done, by: body.by || '', at: new Date().toISOString(), note: body.note || '' };
      save(key, run);
      return json(run);
    }
    return realFetch(url, options);
  };
})();
