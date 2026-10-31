/* Notes pages: auto-number sections, figures and equations, render maths,
   fill cross-references and build the contents lists. */
(function () {
  'use strict';

  function renderTex(target, tex) {
    if (window.katex) {
      try { window.katex.render(tex, target, { displayMode: true, throwOnError: false }); return; }
      catch (_) { /* fall through to plain text */ }
    }
    target.textContent = tex;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const ch = document.body.dataset.chapter || '1';
    const page = document.querySelector('.page');
    if (!page) return;

    // Sections: 1.1, 1.2, ...
    const sections = [...page.querySelectorAll('section.sec')];
    sections.forEach((s, i) => {
      const num = `${ch}.${i + 1}`;
      s.dataset.num = num;
      const h = s.querySelector('h2');
      if (h) h.insertAdjacentHTML('afterbegin', `<span class="sec-num">${num}</span>`);
    });

    // Figures: Fig. 1.1, ...
    page.querySelectorAll('figure.fig').forEach((f, i) => {
      const num = `${ch}.${i + 1}`;
      f.dataset.num = num;
      const tag = f.querySelector('.fig-num');
      if (tag) tag.textContent = `Fig. ${num}`;
      const cap = f.querySelector('figcaption');
      if (cap) cap.insertAdjacentHTML('afterbegin', `<span class="fig-label">Figure ${num}.</span>`);
    });

    // Display equations: (1.1), ...
    page.querySelectorAll('.eq').forEach((e, i) => {
      const num = `(${ch}.${i + 1})`;
      e.dataset.num = num;
      const words = e.dataset.words;
      const tex = e.textContent.trim();
      e.textContent = '';
      const body = document.createElement('span');
      body.className = 'eq-body';
      renderTex(body, tex);
      e.appendChild(body);
      if (words) {
        const w = document.createElement('span');
        w.className = 'eq-words';
        w.textContent = words;
        e.appendChild(w);
      }
      const n = document.createElement('span');
      n.className = 'eq-num';
      n.textContent = num;
      e.appendChild(n);
    });

    // Inline maths: \( ... \)
    if (window.renderMathInElement) {
      window.renderMathInElement(page, {
        delimiters: [{ left: '\\(', right: '\\)', display: false }],
        throwOnError: false,
        ignoredClasses: ['eq']
      });
    }

    // Cross references: <a class="ref" href="#id"></a>
    page.querySelectorAll('a.ref').forEach(a => {
      const t = document.querySelector(a.getAttribute('href'));
      if (!t || !t.dataset.num) return;
      if (a.textContent.trim()) return;
      if (t.matches('figure')) a.textContent = `Fig. ${t.dataset.num}`;
      else if (t.matches('.eq')) a.textContent = `Eq. ${t.dataset.num}`;
      else a.textContent = `§${t.dataset.num}`;
    });

    // Contents lists (in-page + sidebar)
    const entries = sections.map(s => ({
      id: s.id, num: s.dataset.num,
      title: (s.querySelector('h2')?.textContent || '').replace(s.dataset.num, '').trim()
    }));
    page.querySelectorAll('.end-matter[id]').forEach(e => entries.push({
      id: e.id, num: '', title: e.querySelector('h2')?.textContent.trim() || ''
    }));
    const li = e => `<li><a href="#${e.id}"><span class="n">${e.num}</span><span>${e.title}</span></a></li>`;
    const inPage = document.querySelector('.contents ol');
    if (inPage) inPage.innerHTML = entries.map(e =>
      `<li><span class="n">${e.num}</span><a href="#${e.id}">${e.title}</a></li>`).join('');
    const side = document.querySelector('.toc ol');
    if (side) {
      side.innerHTML = entries.map(li).join('');
      const links = [...side.querySelectorAll('a')];
      const targets = entries.map(e => document.getElementById(e.id));
      const onScroll = () => {
        let active = 0;
        targets.forEach((t, i) => { if (t && t.getBoundingClientRect().top < window.innerHeight * 0.3) active = i; });
        links.forEach((l, i) => l.classList.toggle('active', i === active));
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  });
})();
