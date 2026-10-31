/* Mood board: an overlapping collage of polymaths filling the background either side of the sheet.
   To add someone: drop a ~500px-wide JPEG in assets/moodboard/, add it to LEFT or RIGHT, and add a CREDITS line.
   Only use images that are public domain / CC0, or credit them properly. */
(function () {
  'use strict';

  // Top to bottom on each side. The side nearest the page is listed first.
  const LEFT = [
    { img: 'tesla', name: 'Nikola Tesla', wiki: 'Nikola_Tesla' },
    { img: 'leibniz', name: 'Gottfried Leibniz', wiki: 'Gottfried_Wilhelm_Leibniz' },
    { img: 'newton', name: 'Isaac Newton', wiki: 'Isaac_Newton' },
    { img: 'principia', name: 'Newton’s Principia (1687)', wiki: 'Philosophi%C3%A6_Naturalis_Principia_Mathematica' }
  ];
  const RIGHT = [
    { img: 'einstein', name: 'Albert Einstein', wiki: 'Albert_Einstein' },
    { img: 'faraday', name: 'Michael Faraday', wiki: 'Michael_Faraday' },
    { img: 'davinci', name: 'Leonardo da Vinci', wiki: 'Leonardo_da_Vinci' },
    { img: 'shannon', name: 'Claude Shannon', wiki: 'Claude_Shannon' }
  ];

  const CREDITS = [
    ['Nikola Tesla', 'photo by Napoleon Sarony, c.1890', 'Public domain', 'Tesla_circa_1890.jpeg'],
    ['Gottfried Leibniz', 'engraving, Rijksmuseum', 'CC0', 'Portret_van_Gottfried_Wilhelm_Leibniz,_RP-P-1914-3355.jpg'],
    ['Isaac Newton', 'engraving, Rijksmuseum', 'CC0', 'Portret_van_Isaac_Newton,_RP-P-OB-32.808.jpg'],
    ['Newton’s Principia', 'title page, 1687', 'Public domain', 'Prinicipia-title.png'],
    ['Albert Einstein', 'photo by Ferdinand Schmutzer, 1921 (restoration by Adam Cuerden)', 'Public domain', 'Einstein_1921_by_F_Schmutzer_-_restoration.jpg'],
    ['Michael Faraday', 'after a photograph by Dixon & Son (Project Gutenberg)', 'Public domain', 'Michael_Faraday_-_Project_Gutenberg_eText_13103.jpg'],
    ['Leonardo da Vinci', 'engraving by Francesco Bartolozzi, Yale Center for British Art', 'CC0', 'Francesco_Bartolozzi_-_Portrait_in_profile_of_Leonardo_da_Vinci_-_B1977.14.19858_-_Yale_Center_for_British_Art.jpg'],
    ['Claude Shannon', 'photo by Konrad Jacobs, Oberwolfach Photo Collection; resized and toned', 'CC BY-SA 2.0 DE', 'ClaudeShannon_MFO3807.jpg', 'https://creativecommons.org/licenses/by-sa/2.0/de/deed.en']
  ];

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  document.addEventListener('DOMContentLoaded', () => {
    const hub = document.querySelector('.hub');
    const sheet = hub && hub.querySelector('.sheet');
    if (!sheet) return;
    const root = document.body.dataset.root || '';

    const tile = p =>
      `<a class="tile" href="https://en.wikipedia.org/wiki/${p.wiki}" target="_blank" rel="noopener" title="${esc(p.name)}">` +
      `<img src="${root}assets/moodboard/${p.img}.jpg?v=1" alt="${esc(p.name)}" loading="lazy" decoding="async"></a>`;

    const board = document.createElement('div');
    board.className = 'mood';
    board.innerHTML =
      '<div class="mood-label">The polymaths behind the name</div>' +
      `<div class="mood-side left">${LEFT.map(tile).join('')}</div>` +
      `<div class="mood-side right">${RIGHT.map(tile).join('')}</div>`;
    hub.insertBefore(board, sheet.nextSibling);

    // Fit each side's stack of images to the height of the sheet, so the collage
    // never makes the page longer. Short pages get smaller, more overlapped images;
    // long pages spread them out (up to a maximum size).
    const OVERLAP = 0.1;           // max share of an image covered by the one two places below it
    const MIN_W = 90;              // px: never smaller than this
    const WIDE = window.matchMedia('(min-width: 1360px)');
    const sides = [...board.querySelectorAll('.mood-side')];

    function layout() {
      sides.forEach(side => {
        const tiles = [...side.querySelectorAll('.tile')];
        if (!WIDE.matches) {
          side.style.height = '';
          side.style.top = '';
          tiles.forEach(t => { t.style.cssText = ''; });
          return;
        }
        const H = sheet.offsetHeight;
        const sideW = side.clientWidth;
        const maxW = sideW * 0.62;
        const ratios = tiles.map(t => {
          const img = t.querySelector('img');
          return img.naturalWidth ? img.naturalHeight / img.naturalWidth : 1.35;
        });
        // Two staggered columns. Images in the same column are two steps apart, so keep the
        // image height small enough that they overlap each other by at most OVERLAP.
        //   same-column spacing = 2 * (H - h) / (n - 1) >= (1 - OVERLAP) * h
        const n = tiles.length;
        const tallest = Math.max(...ratios);
        const hFit = (2 * H) / ((n - 1) * (1 - OVERLAP) + 2);
        const w = Math.max(MIN_W, Math.min(maxW, hFit / tallest));
        const lastH = ratios[n - 1] * w;
        const span = Math.max(0, H - lastH);
        // keep both columns close to the page so neighbours overlap a little
        const isLeft = side.classList.contains('left');
        const nearX = isLeft ? sideW - w : 0;
        const farX = isLeft ? Math.max(0, sideW - w - 0.8 * w) : Math.min(sideW - w, 0.8 * w);
        side.style.height = `${H}px`;
        side.style.top = `${sheet.offsetTop}px`;
        tiles.forEach((t, i) => {
          const top = n > 1 ? (span * i) / (n - 1) : 0;
          const left = i % 2 === 0 ? farX : nearX;
          t.style.cssText = `position:absolute; width:${w}px; top:${top}px; left:${left}px; margin:0`;
        });
      });
    }

    board.querySelectorAll('img').forEach(img => { if (!img.complete) img.addEventListener('load', layout); });
    window.addEventListener('resize', layout);
    if (WIDE.addEventListener) WIDE.addEventListener('change', layout);
    if ('ResizeObserver' in window) new ResizeObserver(layout).observe(sheet);
    layout();

    const credits = document.createElement('details');
    credits.className = 'credits';
    credits.innerHTML = '<summary>Image credits</summary><ul>' + CREDITS.map(([name, what, lic, file, licUrl]) =>
      `<li><a href="https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}" target="_blank" rel="noopener">${esc(name)}</a>: ${esc(what)} · ` +
      (licUrl ? `<a href="${licUrl}" target="_blank" rel="noopener">${esc(lic)}</a>` : esc(lic)) + '</li>').join('') +
      '</ul><p>All images via Wikimedia Commons.</p>';
    hub.appendChild(credits);
  });
})();
