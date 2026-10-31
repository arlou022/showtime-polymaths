/* Shared bits for every page: light/dark toggle and print button. */
(function () {
  'use strict';
  const root = document.documentElement;
  const KEY = 'pj-theme';

  function current() {
    if (root.dataset.theme) return root.dataset.theme;
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function label() {
    document.querySelectorAll('[data-action="theme"]').forEach(b => {
      b.textContent = current() === 'dark' ? 'Light' : 'Dark';
      b.setAttribute('aria-label', current() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }
  function set(theme) {
    root.dataset.theme = theme;
    try { localStorage.setItem(KEY, theme); } catch (_) { /* storage may be blocked */ }
    document.dispatchEvent(new Event('themechange'));
    label();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-action="theme"]').forEach(b =>
      b.addEventListener('click', () => set(current() === 'dark' ? 'light' : 'dark')));
    document.querySelectorAll('[data-action="print"]').forEach(b =>
      b.addEventListener('click', () => window.print()));
    label();
  });
})();
