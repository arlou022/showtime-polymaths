/* Renders the home page and subject pages from catalog.js */
(function () {
  'use strict';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pad = n => String(n).padStart(2, '0');

  function home(el, root) {
    const subjects = window.CATALOG.subjects;
    el.innerHTML = subjects.map((s, i) => {
      const chapters = s.topics.reduce((n, t) => n + t.chapters.filter(c => c.status === 'live').length, 0);
      const live = s.status === 'live';
      const topics = s.topics.filter(t => t.status === 'live').length;
      const meta = live ? `${topics} topic${topics === 1 ? '' : 's'} · ${chapters} chapter${chapters === 1 ? '' : 's'}` : 'coming soon';
      const inner = `
        <span class="card-num">${pad(i + 1)} · ${esc(s.title.toUpperCase())}</span>
        <span class="card-title">${esc(s.title)}</span>
        <span class="card-blurb">${esc(s.blurb)}</span>
        <span class="card-meta">${meta}${live ? ' <span class="go">Open →</span>' : ''}</span>`;
      return live
        ? `<a class="card" href="${root}${s.href}">${inner}</a>`
        : `<div class="card soon" aria-disabled="true">${inner}</div>`;
    }).join('');
  }

  function subject(el, root, id) {
    const s = window.CATALOG.subjects.find(x => x.id === id);
    if (!s) return;
    el.innerHTML = s.topics.map((t, i) => {
      const chapters = t.chapters.length
        ? `<ol class="chapters">${t.chapters.map(c => {
            const label = `<span class="cn">${c.num}</span><span class="ct">${esc(c.title)}</span>`;
            return c.status === 'live'
              ? `<li><a href="${root}${c.href}">${label}<span class="dots"></span><span class="cm">${c.minutes} min · ${c.figures} figures</span></a></li>`
              : `<li class="soon">${label}<span class="dots"></span><span class="cm">coming soon</span></li>`;
          }).join('')}</ol>`
        : '<p class="empty">Chapters coming soon.</p>';
      return `<section class="topic${t.status === 'live' ? '' : ' soon'}">
        <div class="topic-head"><span class="card-num">${pad(i + 1)} · ${esc(t.title.toUpperCase())}</span></div>
        <h2>${esc(t.title)}</h2>
        <p class="topic-blurb">${esc(t.blurb)}</p>
        ${chapters}
      </section>`;
    }).join('');
  }

  const fmtDate = iso => new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  function newsList(el, root) {
    const items = (window.CATALOG.news || []);
    el.innerHTML = items.length ? items.map(n => `
      <a class="news-item" href="${root}${n.href}">
        <span class="news-meta">${esc(fmtDate(n.date))} · ${esc(n.tag || 'News')} · ${n.minutes} min read</span>
        <span class="news-title">${esc(n.title)}</span>
        <span class="news-summary">${esc(n.summary)}</span>
        <span class="news-go">Read →</span>
      </a>`).join('') : '<p class="empty">No posts yet.</p>';
  }

  function latest(el, root) {
    const n = (window.CATALOG.news || [])[0];
    if (!n) { el.remove(); return; }
    el.innerHTML = `<span class="latest-label">Latest news</span>
      <a href="${root}${n.href}"><span class="latest-date">${esc(fmtDate(n.date))}</span><span class="latest-title">${esc(n.title)}</span><span class="latest-go">→</span></a>`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const root = document.body.dataset.root || '';
    const h = document.querySelector('[data-hub="home"]');
    if (h) home(h, root);
    const s = document.querySelector('[data-hub="subject"]');
    if (s) subject(s, root, s.dataset.subject);
    const nl = document.querySelector('[data-hub="news"]');
    if (nl) newsList(nl, root);
    const lt = document.querySelector('[data-hub="latest"]');
    if (lt) latest(lt, root);
  });
})();
