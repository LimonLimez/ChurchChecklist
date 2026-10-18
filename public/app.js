// Media Team Wiki - front end.
// Pages live in docs/*.md. Special wiki syntax (works in any page):
//   [[ProPresenter]]              link to the page "propresenter"
//   [[stream-keys|Stream keys]]   link with custom text
//   [[open:propresenter]]         button that opens ProPresenter on the MacBook
//   [[checklist:sunday]]          link to a checklist
//   [[map:propresenter]]          clickable map of an app window (public/visuals.js)
//   [[timeline:sunday]]           picture of when we go live

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
      return openButton(id, text);
    }
    if (target.startsWith('map:')) return Visuals.screenMap(target.slice(4));
    if (target.startsWith('timeline:')) return Visuals.timeline(target.slice(9));
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

function openButton(id, text, small = false) {
  const label = text || `Open ${state.apps[id] || id}`;
  return `<button class="btn${small ? ' small' : ''}" data-open="${escapeHtml(id)}">${Visuals.logoImg(id)}${escapeHtml(label)}</button>`;
}

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
            ${item.app ? openButton(item.app, '', true) : ''}
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
      <button class="btn primary" id="guide-start">Guide me</button>
      <button class="btn small" id="print" onclick="window.print()">Print</button>
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

  $('#guide-start').onclick = () => startGuide(list, allItems, () => run, save);
}

// ---------- Guide me: one checklist item at a time ----------

function startGuide(list, allItems, getRun, save) {
  const phaseOf = (item) => list.phases.find((p) => p.items.includes(item));
  const skipped = new Set();
  let index = Math.max(0, allItems.findIndex((i) => !getRun().items[i.id]?.done));
  if (allItems.every((i) => getRun().items[i.id]?.done)) index = allItems.length;

  const overlay = document.createElement('div');
  overlay.className = 'guide';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', `${list.title} guide`);
  document.body.append(overlay);
  document.body.classList.add('guide-open');

  const close = () => {
    overlay.remove();
    document.body.classList.remove('guide-open');
    document.removeEventListener('keydown', onKey);
  };
  const el = (item) => document.querySelector(`.item[data-item="${item.id}"]`);

  const finish = () => {
    const missed = allItems.filter((i) => !getRun().items[i.id]?.done);
    overlay.innerHTML = `
      <div class="guide-panel">
        <div class="guide-top"><span>${escapeHtml(list.title)}</span><button class="btn small" data-guide="close">Close</button></div>
        <h2 class="guide-title">${missed.length ? `${missed.length} item${missed.length === 1 ? '' : 's'} still open` : 'Everything is done'}</h2>
        ${missed.length
          ? `<p>These were skipped or not finished yet:</p><ul>${missed.map((i) => `<li>${escapeHtml(i.title)}</li>`).join('')}</ul>`
          : `<p>All ${allItems.length} items are checked off. Thank you for serving.</p>`}
        <div class="guide-nav">
          ${missed.length ? '<button class="btn" data-guide="restart">Go through open items</button>' : ''}
          <button class="btn primary" data-guide="close">Back to checklist</button>
        </div>
      </div>`;
  };

  const show = () => {
    if (index >= allItems.length) return finish();
    const item = allItems[index];
    const saved = getRun().items[item.id] || {};
    const done = allItems.filter((i) => getRun().items[i.id]?.done).length;
    overlay.innerHTML = `
      <div class="guide-panel">
        <div class="guide-top">
          <span>${escapeHtml(list.title)}: step ${index + 1} of ${allItems.length}</span>
          <button class="btn small" data-guide="close">Close</button>
        </div>
        <div class="progress"><div style="width:${(done / allItems.length) * 100}%"></div></div>
        <p class="guide-phase">${escapeHtml(phaseOf(item).title)}</p>
        <h2 class="guide-title">${escapeHtml(item.title)}</h2>
        <p class="guide-details">${escapeHtml(item.details || '')}</p>
        <div class="guide-actions">
          ${item.app ? openButton(item.app) : ''}
          ${item.wiki ? wikify(`[[${item.wiki}|Read how to do this]]`) : ''}
        </div>
        <label class="guide-note">Notes or problems (optional)
          <input id="guide-note" value="${escapeHtml(saved.note || '')}">
        </label>
        ${saved.done ? '<p class="item-meta">Already checked off.</p>' : ''}
        <div class="guide-nav">
          <button class="btn" data-guide="back" ${index === 0 ? 'disabled' : ''}>Back</button>
          <button class="btn" data-guide="skip">Skip for now</button>
          <button class="btn primary" data-guide="done">Done, next step</button>
        </div>
      </div>`;
    overlay.querySelector('[data-guide="done"]').focus();
  };

  const record = async (done) => {
    const item = allItems[index];
    const row = el(item);
    row.querySelector('.note').value = $('#guide-note').value;
    row.querySelector('input[type=checkbox]').checked = done;
    await save(row);
  };

  overlay.addEventListener('click', async (e) => {
    if (e.target.closest('a.wikilink')) return close();
    const action = e.target.closest('[data-guide]')?.dataset.guide;
    if (!action) return;
    if (action === 'close') return close();
    if (action === 'back') index = Math.max(0, index - 1);
    if (action === 'skip') { skipped.add(allItems[index].id); index += 1; }
    if (action === 'done') { await record(true); index += 1; }
    if (action === 'restart') index = allItems.findIndex((i) => !getRun().items[i.id]?.done);
    show();
  });

  function onKey(e) {
    if (e.key === 'Escape') close();
  }
  document.addEventListener('keydown', onKey);
  show();
}

// ---------- Link previews (like Wikipedia's page previews) ----------

function pageSummary(page) {
  const para = page.text.split(/\n\s*\n/).map((b) => b.trim())
    .find((b) => b && !/^(#|<|>|\||\[\[|-|\d+\.|```)/.test(b));
  return (para || '')
    .replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, (_, a, b) => b || a)
    .replace(/[*_`]/g, '');
}

function setupPreviews() {
  const card = document.createElement('div');
  card.className = 'link-preview';
  card.hidden = true;
  document.body.append(card);
  let timer;

  document.addEventListener('mouseover', (e) => {
    const link = e.target.closest('.content a.wikilink:not(.missing)');
    if (!link || link.contains(e.relatedTarget)) return;
    const page = state.pages.find((p) => `#/${p.slug}` === link.getAttribute('href'));
    if (!page || `#/${page.slug}` === location.hash) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      card.innerHTML = `
        <div class="link-preview-head">${Visuals.logoImg(page.slug, 40)}<strong>${escapeHtml(page.title)}</strong></div>
        <p>${escapeHtml(pageSummary(page))}</p>`;
      card.hidden = false;
      const r = link.getBoundingClientRect();
      const left = Math.min(r.left, window.innerWidth - card.offsetWidth - 16);
      const below = r.bottom + 8 + card.offsetHeight < window.innerHeight;
      card.style.left = `${Math.max(16, left)}px`;
      card.style.top = `${below ? r.bottom + 8 : r.top - card.offsetHeight - 8}px`;
    }, 350);
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('.content a.wikilink') && !e.target.closest('a').contains(e.relatedTarget)) {
      clearTimeout(timer);
      card.hidden = true;
    }
  });
  window.addEventListener('hashchange', () => { clearTimeout(timer); card.hidden = true; });
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
    $('#sidebar').querySelectorAll('a').forEach((a) => {
      const slug = a.getAttribute('href').replace('#/', '');
      if (Visuals.LOGOS[slug]) a.insertAdjacentHTML('afterbegin', Visuals.logoImg(slug));
    });
  } catch (err) {
    $('#content').innerHTML = `<h1>Can't reach the wiki server</h1><p>Make sure the server window is open (double-click <code>Start Wiki.command</code>). Error: ${escapeHtml(err.message)}</p>`;
    return;
  }
  setupSearch();
  setupPreviews();
  $('#menu-toggle').onclick = () => {
    const open = $('#sidebar').classList.toggle('open');
    $('#menu-toggle').setAttribute('aria-expanded', String(open));
  };
  window.addEventListener('hashchange', route);
  route();
}

init();
