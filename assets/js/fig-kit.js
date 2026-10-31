/* FigKit: small shared toolkit for the interactive canvas figures.
   Each figure file calls FigKit.register('name', fig => { ... fig.frame = (dt, t) => draw ... }).
   Figures draw in a fixed 640-wide coordinate space; FigKit scales it to fit the page. */
(function () {
  'use strict';

  const W = 640;
  const registry = {};
  const figs = [];
  const C = {};
  const SERIF = '"KaTeX_Main", "Latin Modern Roman", Georgia, serif';
  const MONO = '"IBM Plex Mono", ui-monospace, Consolas, monospace';

  function refreshColors() {
    const cs = getComputedStyle(document.documentElement);
    ['bg', 'paper', 'ink', 'muted', 'faint', 'grid', 'pos', 'neg', 'neutral', 'accent', 'warm', 'good'].forEach(k => {
      C[k] = cs.getPropertyValue('--fig-' + k).trim() || '#888';
    });
  }

  const register = (name, init) => { registry[name] = init; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  /* frame-rate independent smoothing factor */
  const ease = (dt, speed) => 1 - Math.exp(-dt * speed);

  const SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  /* Human-friendly number: 1,000 / 0.25 / 1.44 × 10⁻¹⁸ */
  function sci(n, digits = 2) {
    if (n === 0) return '0';
    const exp = Math.floor(Math.log10(Math.abs(n)));
    if (exp >= -3 && exp <= 5) {
      return Number(n.toPrecision(digits + 1)).toLocaleString('en-GB', { maximumFractionDigits: 6 });
    }
    let mant = Number((n / Math.pow(10, exp)).toFixed(digits));
    let e = exp;
    if (Math.abs(mant) >= 10) { mant /= 10; e += 1; }
    return `${mant} × 10${String(e).split('').map(ch => SUP[ch]).join('')}`;
  }

  /* ---------- drawing helpers ---------- */
  function arrow(ctx, x1, y1, x2, y2, color, width = 2, head = 9) {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
    if (len < 1) return;
    const ux = dx / len, uy = dy / len;
    const h = Math.min(head, len * 0.7);
    ctx.save();
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * h * 0.7, y2 - uy * h * 0.7); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - ux * h - uy * h * 0.45, y2 - uy * h + ux * h * 0.45);
    ctx.lineTo(x2 - ux * h + uy * h * 0.45, y2 - uy * h - ux * h * 0.45);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  /* A charged particle: kind = 'pos' | 'neg' | 'neutral' */
  function particle(ctx, x, y, r, kind, alpha = 1, glow = 0) {
    const col = C[kind] || C.neutral;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (glow > 0) {
      const g = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * (2 + glow * 2));
      g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = alpha * 0.35 * Math.min(1, glow);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * (2 + glow * 2), 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = alpha;
    }
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
    ctx.beginPath(); ctx.arc(x - r * 0.32, y - r * 0.36, r * 0.38, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fill();
    if (kind !== 'neutral' && r >= 5.5) {
      const s = r * 0.48;
      ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = Math.max(1.3, r * 0.16); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x + s, y);
      if (kind === 'pos') { ctx.moveTo(x, y - s); ctx.lineTo(x, y + s); }
      ctx.stroke();
    }
    ctx.restore();
  }

  function text(ctx, str, x, y, o = {}) {
    ctx.save();
    ctx.font = `${o.italic ? 'italic ' : ''}${o.weight || 400} ${o.size || 13}px ${o.mono ? MONO : SERIF}`;
    ctx.fillStyle = o.color || C.ink;
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.baseline || 'middle';
    if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
    ctx.fillText(str, x, y);
    ctx.restore();
  }

  function dashedLine(ctx, x1, y1, x2, y2, color, dash = [4, 4], width = 1) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  /* Horizontal bar meter: label, value 0..1 */
  function meter(ctx, x, y, w, h, frac, color, label, valueText) {
    ctx.save();
    ctx.fillStyle = C.grid; roundRect(ctx, x, y, w, h, 2); ctx.fill();
    ctx.fillStyle = color; roundRect(ctx, x, y, Math.max(0, Math.min(1, frac)) * w, h, 2); ctx.fill();
    ctx.restore();
    if (label) text(ctx, label, x - 10, y + h / 2, { mono: true, size: 10.5, color: C.muted, align: 'right' });
    if (valueText) text(ctx, valueText, x + w + 8, y + h / 2, { mono: true, size: 10.5, color: C.muted });
  }

  /* ---------- controls ---------- */
  function slider(fig, o) {
    const wrap = document.createElement('label');
    wrap.className = 'ctl ctl-slider';
    const lab = document.createElement('span'); lab.className = 'ctl-label'; lab.textContent = o.label;
    const input = document.createElement('input'); input.type = 'range';
    input.min = o.min; input.max = o.max; input.step = o.step ?? 1; input.value = o.value;
    const out = document.createElement('output'); out.className = 'ctl-val';
    const fmt = o.format || (v => String(v));
    const show = () => { out.textContent = fmt(+input.value); };
    input.addEventListener('input', () => { show(); if (o.onInput) o.onInput(+input.value); });
    wrap.append(lab, input, out);
    fig.controls.appendChild(wrap);
    show();
    return {
      get value() { return +input.value; },
      set(v) { input.value = v; show(); },
      input
    };
  }

  function segmented(fig, o) {
    const wrap = document.createElement('div');
    wrap.className = 'ctl ctl-seg';
    wrap.setAttribute('role', 'group');
    if (o.label) {
      const lab = document.createElement('span'); lab.className = 'ctl-label'; lab.textContent = o.label;
      wrap.appendChild(lab);
    }
    let value = o.value;
    const btns = [];
    const api = {
      get value() { return value; },
      set(v) { value = v; btns.forEach(([val, b]) => b.setAttribute('aria-pressed', String(val === v))); }
    };
    o.options.forEach(opt => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'seg-btn'; b.textContent = opt.label;
      b.addEventListener('click', () => { api.set(opt.value); if (o.onChange) o.onChange(opt.value); });
      wrap.appendChild(b); btns.push([opt.value, b]);
    });
    api.set(value);
    fig.controls.appendChild(wrap);
    return api;
  }

  function button(fig, label, onClick) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn'; b.textContent = label;
    b.addEventListener('click', onClick);
    fig.controls.appendChild(b);
    return b;
  }

  /* ---------- figure setup + animation loop ---------- */
  function setup(el) {
    const init = registry[el.dataset.figure];
    const stage = el.querySelector('.fig-stage');
    if (!init || !stage) return;
    const H = +el.dataset.height || 300;
    const canvas = document.createElement('canvas');
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', el.dataset.label || 'Interactive figure');
    stage.appendChild(canvas);

    const readEl = el.querySelector('.fig-readout');
    let lastRead = null;
    const fig = {
      el, canvas, ctx: canvas.getContext('2d'), W, H,
      scale: 1, dpr: 1, t: 0, visible: true,
      controls: el.querySelector('.fig-controls') || document.createElement('div'),
      pointer: { x: -999, y: -999, inside: false, down: false },
      frame: null, onDown: null, onMove: null, onUp: null, cursorAt: null,
      readout(html) { if (readEl && html !== lastRead) { readEl.innerHTML = html; lastRead = html; } },
      draggable() { canvas.style.touchAction = 'none'; }
    };

    let lastW = -1;
    function resize() {
      const cssW = stage.clientWidth || W;
      if (Math.abs(cssW - lastW) < 0.5) return;
      lastW = cssW;
      const s = cssW / W;
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      canvas.style.height = (H * s) + 'px';
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(H * s * dpr);
      fig.scale = s; fig.dpr = dpr;
    }
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
    else window.addEventListener('resize', resize);
    resize();

    const pt = e => {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) / fig.scale, y: (e.clientY - r.top) / fig.scale };
    };
    canvas.addEventListener('pointerdown', e => {
      const p = pt(e);
      Object.assign(fig.pointer, p, { down: true, inside: true });
      if (fig.onDown && fig.onDown(p.x, p.y, e) !== false) {
        try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', e => {
      const p = pt(e);
      Object.assign(fig.pointer, p, { inside: true });
      if (fig.onMove) fig.onMove(p.x, p.y, e);
      if (fig.cursorAt) canvas.style.cursor = fig.cursorAt(p.x, p.y) || 'default';
    });
    const up = e => {
      const p = pt(e);
      fig.pointer.down = false;
      if (fig.onUp) fig.onUp(p.x, p.y, e);
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', () => { if (!fig.pointer.down) fig.pointer.inside = false; });

    try { init(fig); } catch (err) { console.error('Figure failed to start:', el.dataset.figure, err); return; }
    figs.push(fig);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => entries.forEach(en => { fig.visible = en.isIntersecting; }),
        { rootMargin: '120px' }).observe(el);
    }
  }

  function drawFig(f, dt) {
    if (!f.frame) return;
    const ctx = f.ctx;
    ctx.setTransform(f.dpr * f.scale, 0, 0, f.dpr * f.scale, 0, 0);
    ctx.clearRect(0, 0, f.W, f.H);
    try { f.frame(dt, f.t); } catch (err) { console.error(err); f.frame = null; }
  }

  let last = 0;
  function tick(now) {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    for (const f of figs) {
      if (!f.visible) continue;
      f.t += dt;
      drawFig(f, dt);
    }
    requestAnimationFrame(tick);
  }

  /* Print in light colours, whatever the screen theme */
  let themeBeforePrint = null;
  window.addEventListener('beforeprint', () => {
    themeBeforePrint = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', 'light');
    refreshColors();
    figs.forEach(f => drawFig(f, 0));
  });
  window.addEventListener('afterprint', () => {
    if (themeBeforePrint === null) document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', themeBeforePrint);
    refreshColors();
  });

  function boot() {
    refreshColors();
    document.querySelectorAll('[data-figure]').forEach(setup);
    requestAnimationFrame(tick);
  }
  document.addEventListener('themechange', refreshColors);
  if (window.matchMedia) {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', refreshColors);
  }
  // Deferred scripts run while readyState is 'interactive', before the figure files register,
  // so wait for DOMContentLoaded unless the page has fully loaded already.
  if (document.readyState === 'complete') setTimeout(boot, 0);
  else document.addEventListener('DOMContentLoaded', boot);

  window.FigKit = {
    register, C, W, SERIF, MONO,
    clamp, lerp, rand, ease, sci,
    arrow, particle, text, dashedLine, roundRect, meter,
    slider, segmented, button
  };
})();
