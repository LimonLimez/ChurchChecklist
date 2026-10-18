// Media Team Wiki - front end.
// Pages live in docs/*.md. Special wiki syntax (works in any page):
//   [[ProPresenter]]              link to the page "propresenter"
//   [[stream-keys|Stream keys]]   link with custom text
//   [[open:propresenter]]         button that opens ProPresenter on the MacBook
//   [[checklist:sunday]]          button that opens a checklist

const state = { pages: [], apps: {}, checklists: [] };
const $ = (sel) => document.querySelector(sel);

const slugify = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function api(path, options) {
  const res = await fetch(path, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

function toast(message, isError = false) {
  const el = $('#toast');
  el.textContent = message;
  el.className = isError ? 'toast error' : 'toast';
  el.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (el.hidden = true), 4000);
}

// ---------- Wiki markup ----------

// Leave code blocks and `inline code` alone so pages can show the syntax itself.
function wikify(markdown) {
  return markdown
    .split(/(```[\s\S]*?```|`[^`\n]*`)/)
    .map((part, i) => (i % 2 ? part : wikifyText(part)))
    .join('');
}

function wikifyText(markdown) {
  return markdown.replace(/\[\[([^\]]+)\]\]/g, (_, inner) => {
    const [target, text] = inner.split('|').map((s) => s.trim());

    if (target.startsWith('open:')) {
      const id = target.slice(5);
      const label = text || `Open ${state.apps[id] || id}`;
      return `<button class="btn" data-open="${escapeHtml(id)}">${escapeHtml(label)}</button>`;
    }
    if (target.startsWith('checklist:')) {
      const id = target.slice(10);
      const list = state.checklists.find((c) => c.id === id);
      return `<a href="#/checklist/${escapeHtml(id)}">${escapeHtml(text || (list ? list.title : id))} checklist</a>`;
    }

    const slug = slugify(target);
    const exists = state.pages.some((p) => p.slug === slug);
    const cls = exists ? 'wikilink' : 'wikilink missing';
    const title = exists ? '' : ' title="This page has not been written yet"';
    return `<a class="${cls}" href="#/${slug}"${title}>${escapeHtml(text || target)}</a>`;
  });
}

const render = (markdown) => marked.parse(wikify(markdown));

// ---------- Pages ----------

async function showPage(slug) {
  const page = state.pages.find((p) => p.slug === slug);
  if (!page) {
    $('#content').innerHTML = `
      <h1>${escapeHtml(slug)}</h1>
      <blockquote><p><strong>This page hasn't been written yet.</strong></p>
      <p>To create it, add a file called <code>docs/${escapeHtml(slug)}.md</code>. See ${wikify('[[how-to-edit|How to edit this wiki]]')}.</p></blockquote>`;
    return;
  }
  $('#content').innerHTML = render(page.text) +
    `<p class="page-source">To change this page, edit <code>docs/${escapeHtml(page.slug)}.md</code>. See ${wikify('[[how-to-edit|How to edit this wiki]]')}.</p>`;
  document.title = `${page.title} - Glad Tidings Media Team`;
}

// ---------- Checklists ----------

function localDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Today if it's the right day, otherwise the next Thursday/Sunday.
function defaultDate(checklistId) {
  const weekday = { sunday: 0, thursday: 4 }[checklistId];
  const d = new Date();
  if (weekday !== undefined) d.setDate(d.getDate() + ((weekday - d.getDay() + 7) % 7));
  return localDate(d);
}

function getName() {
  try { return localStorage.getItem('media-wiki-name') || ''; } catch { return ''; }
}
function setName(name) {
  try { localStorage.setItem('media-wiki-name', name); } catch { /* private window */ }
}

async function showChecklist(id, date) {
  const list = state.checklists.find((c) => c.id === id);
  if (!list) return showPage(`checklist-${id}`);
  date = date || defaultDate(id);
  document.title = `${list.title} - Glad Tidings Media Team`;

  let run;
  try {
    run = await api(`/api/run?date=${date}&checklist=${id}`);
  } catch (err) {
    toast(`Couldn't load saved progress: ${err.message}`, true);
    run = { items: {} };
  }

  const allItems = list.phases.flatMap((p) => p.items);
  const itemHtml = (item) => {
    const saved = run.items[item.id] || {};
    const meta = saved.done && saved.by ? `Done by ${escapeHtml(saved.by)} at ${new Date(saved.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : '';
    return `
      <li class="item ${saved.done ? 'done' : ''}" data-item="${item.id}">
        <input type="checkbox" ${saved.done ? 'checked' : ''} aria-label="${escapeHtml(item.title)}">
        <div>
          <div class="item-title">${escapeHtml(item.title)}</div>
          <div class="item-details">${escapeHtml(item.details || '')}</div>
          <div class="item-actions">
            ${item.app ? `<button class="btn small" data-open="${item.app}">Open ${escapeHtml(state.apps[item.app] || item.app)}</button>` : ''}
            ${item.wiki ? wikify(`[[${item.wiki}|How do I do this?]]`) : ''}
            ${{ assist: '<span class="automation">AI could help</span>', auto: '<span class="automation">Could be automated</span>' }[item.automation] || ''}
            <input class="note" placeholder="Notes / problems…" value="${escapeHtml(saved.note || '')}">
          </div>
          <div class="item-meta">${meta}</div>
        </div>
      </li>`;
  };

  $('#content').innerHTML = `
    <h1>${escapeHtml(list.title)} checklist</h1>
    <p>${escapeHtml(list.summary)}</p>
    <div class="checklist-bar">
      <label>Date<input type="date" id="run-date" value="${date}"></label>
      <label>Your name<input id="run-name" value="${escapeHtml(getName())}" placeholder="Who's doing this?"></label>
      <div class="checklist-progress">
        <div id="progress-text"></div>
        <div class="progress"><div id="progress-fill"></div></div>
      </div>
      <button class="btn secondary small" onclick="window.print()">Print</button>
    </div>
    ${list.phases.map((phase) => `
      <section class="phase">
        <h2>${escapeHtml(phase.title)}</h2>
        <ul class="items">${phase.items.map(itemHtml).join('')}</ul>
      </section>`).join('')}
    <div id="missed"></div>`;

  const updateProgress = () => {
    const done = allItems.filter((i) => run.items[i.id]?.done).length;
    $('#progress-text').textContent = `${done} of ${allItems.length} done`;
    $('#progress-fill').style.width = `${(done / allItems.length) * 100}%`;
    const left = allItems.filter((i) => !run.items[i.id]?.done);
    $('#missed').innerHTML = left.length === 0
      ? `<p class="all-done">All ${allItems.length} items done.</p>`
      : '';
  };
  updateProgress();

  $('#run-date').onchange = (e) => (location.hash = `#/checklist/${id}/${e.target.value}`);
  $('#run-name').onchange = (e) => setName(e.target.value.trim());

  const save = async (el) => {
    const itemId = el.dataset.item;
    const done = el.querySelector('input[type=checkbox]').checked;
    const note = el.querySelector('.note').value;
    const by = $('#run-name').value.trim();
    if (done && !by) toast('Tip: put your name at the top so we know who did it.');
    try {
      run = await api('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, checklist: id, item: itemId, done, note, by }),
      });
      el.classList.toggle('done', done);
      const saved = run.items[itemId];
      el.querySelector('.item-meta').textContent = done && saved.by
        ? `Done by ${saved.by} at ${new Date(saved.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
        : '';
      updateProgress();
    } catch (err) {
      toast(`Not saved: ${err.message}`, true);
    }
  };

  document.querySelectorAll('.item').forEach((el) => {
    const box = el.querySelector('input[type=checkbox]');
    box.onchange = () => save(el);
    el.querySelector('.item-title').onclick = () => { box.checked = !box.checked; save(el); };
    el.querySelector('.note').onchange = () => save(el);
  });
}

// ---------- Open apps ----------

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-open]');
  if (!btn) return;
  e.preventDefault();
  try {
    const res = await api('/api/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app: btn.dataset.open }),
    });
    toast(res.message);
  } catch (err) {
    toast(err.message, true);
  }
});

// ---------- Search ----------

function setupSearch() {
  const input = $('#search');
  const results = $('#search-results');
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) return (results.hidden = true);
    const matches = state.pages
      .map((p) => {
        const i = p.text.toLowerCase().indexOf(q);
        const score = p.title.toLowerCase().includes(q) ? 2 : i >= 0 ? 1 : 0;
        const snippet = i >= 0 ? p.text.slice(Math.max(0, i - 30), i + 60).replace(/[#*\[\]|>]/g, '') : '';
        return { p, score, snippet };
      })
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
    results.innerHTML = matches.length
      ? matches.map((m) => `<li><a href="#/${m.p.slug}">${escapeHtml(m.p.title)}<small>…${escapeHtml(m.snippet)}…</small></a></li>`).join('')
      : '<li><a>No results</a></li>';
    results.hidden = false;
  });
  results.addEventListener('click', () => { results.hidden = true; input.value = ''; });
  document.addEventListener('click', (e) => { if (!e.target.closest('.search')) results.hidden = true; });
}

// ---------- Routing ----------

async function route() {
  const parts = (location.hash.replace(/^#\/?/, '') || 'home').split('/');
  if (parts[0] === 'checklist') await showChecklist(parts[1], parts[2]);
  else await showPage(parts[0]);

  document.querySelectorAll('#sidebar a').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === location.hash));
  $('#sidebar').classList.remove('open');
  $('#menu-toggle').setAttribute('aria-expanded', 'false');
  window.scrollTo(0, 0);
}

async function init() {
  try {
    const [pages, apps, checklists, sidebar] = await Promise.all([
      api('/api/pages'),
      api('/api/apps'),
      api('/api/checklists'),
      fetch('/docs/_sidebar.md').then((r) => r.text()),
    ]);
    state.pages = pages;
    state.apps = Object.fromEntries(apps.apps.map((a) => [a.id, a.label]));
    state.checklists = checklists.checklists;
    $('#sidebar').innerHTML = render(sidebar);
  } catch (err) {
    $('#content').innerHTML = `<h1>Can't reach the wiki server</h1><p>Make sure the server window is open (double-click <code>Start Wiki.command</code>). Error: ${escapeHtml(err.message)}</p>`;
    return;
  }
  setupSearch();
  $('#menu-toggle').onclick = () => {
    const open = $('#sidebar').classList.toggle('open');
    $('#menu-toggle').setAttribute('aria-expanded', String(open));
  };
  window.addEventListener('hashchange', route);
  route();
}

init();
