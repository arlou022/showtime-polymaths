/* Fig 1.1: lithium atom. Add/remove electrons to see neutral atom vs ion. */
FigKit.register('atom', fig => {
  const K = FigKit, C = K.C, { ctx, H } = fig;
  const cx = 210, cy = H / 2 + 6;
  const PROTONS = 3;
  const SHELLS = [{ r: 58, w: 1.5, cap: 2 }, { r: 112, w: -0.85, cap: 99 }];
  const nucleus = [
    { dx: 2, dy: -15, k: 'neutral' }, { dx: -9, dy: -6, k: 'pos' }, { dx: 10, dy: -5, k: 'neutral' },
    { dx: 1, dy: 4, k: 'pos' }, { dx: -11, dy: 9, k: 'neutral' }, { dx: 12, dy: 10, k: 'pos' }, { dx: 0, dy: 16, k: 'neutral' }
  ];
  const NR = 9, ER = 6.5;

  let electrons = [];      // {x, y}
  let flyers = [];         // electrons leaving: {x, y, vx, vy, life}
  const addElectron = (fromEdge) => {
    if (electrons.length >= 6) return;
    electrons.push(fromEdge ? { x: 660, y: cy - 60 } : { x: cx, y: cy });
  };
  const removeElectron = () => {
    const e = electrons.pop();
    if (!e) return;
    const dx = e.x - cx, dy = e.y - cy, d = Math.hypot(dx, dy) || 1;
    flyers.push({ x: e.x, y: e.y, vx: dx / d * 260, vy: dy / d * 260, life: 1 });
  };
  for (let i = 0; i < 3; i++) addElectron(false);

  K.button(fig, '− Remove electron', removeElectron);
  K.button(fig, '+ Add electron', () => addElectron(true));
  K.button(fig, 'Reset', () => { electrons = []; flyers = []; for (let i = 0; i < 3; i++) addElectron(false); });

  // slot targets for each electron
  function targets(t) {
    const n = electrons.length;
    const inner = Math.min(n, SHELLS[0].cap), outer = n - inner;
    const out = [];
    for (let i = 0; i < n; i++) {
      const s = i < inner ? 0 : 1;
      const idx = s === 0 ? i : i - inner;
      const count = s === 0 ? inner : outer;
      const a = t * SHELLS[s].w + (Math.PI * 2 * idx) / count + (s ? 0.4 : 0);
      out.push({ x: cx + Math.cos(a) * SHELLS[s].r, y: cy + Math.sin(a) * SHELLS[s].r, s });
    }
    return out;
  }

  let hover = null;
  fig.onMove = (x, y) => {
    hover = null;
    electrons.forEach(e => { if (Math.hypot(e.x - x, e.y - y) < 14) hover = { kind: 'e', x: e.x, y: e.y }; });
    if (!hover) nucleus.forEach(p => {
      if (Math.hypot(cx + p.dx - x, cy + p.dy - y) < NR + 2) hover = { kind: p.k, x: cx + p.dx, y: cy + p.dy };
    });
  };
  fig.cursorAt = () => (hover ? 'help' : 'default');

  const INFO = {
    e: ['Electron', 'charge −1 · very light', 'orbits the nucleus'],
    pos: ['Proton', 'charge +1', 'locked in the nucleus'],
    neutral: ['Neutron', 'charge 0', 'locked in the nucleus']
  };

  fig.frame = (dt, t) => {
    if (!fig.pointer.inside) hover = null;
    // orbits
    SHELLS.forEach(s => {
      ctx.save(); ctx.strokeStyle = C.faint; ctx.setLineDash([3, 5]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, s.r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    });
    // nucleus glow + particles
    nucleus.forEach(p => K.particle(ctx, cx + p.dx, cy + p.dy, NR, p.k));
    K.text(ctx, 'nucleus', cx, cy + 36, { mono: true, size: 10, color: C.muted, align: 'center' });

    // electrons ease to their slots
    const tg = targets(t);
    const k = K.ease(dt, 5);
    electrons.forEach((e, i) => {
      e.x = K.lerp(e.x, tg[i].x, k); e.y = K.lerp(e.y, tg[i].y, k);
      K.particle(ctx, e.x, e.y, ER, 'neg');
    });
    flyers = flyers.filter(f => f.life > 0);
    flyers.forEach(f => {
      f.x += f.vx * dt; f.y += f.vy * dt; f.life -= dt * 0.9;
      K.particle(ctx, f.x, f.y, ER, 'neg', Math.max(0, f.life));
    });

    // tally panel
    const n = electrons.length, net = PROTONS - n;
    const px = 400;
    K.text(ctx, 'LITHIUM ATOM', px, 46, { mono: true, size: 10.5, color: C.muted });
    K.text(ctx, 'protons', px, 80, { size: 15 });
    K.text(ctx, '+' + PROTONS, 610, 80, { size: 15, align: 'right', color: C.pos });
    for (let i = 0; i < PROTONS; i++) K.particle(ctx, px + 80 + i * 18, 80, 6, 'pos');
    K.text(ctx, 'electrons', px, 112, { size: 15 });
    K.text(ctx, (n ? '−' : '') + n, 610, 112, { size: 15, align: 'right', color: C.neg });
    for (let i = 0; i < n; i++) K.particle(ctx, px + 80 + i * 18, 112, 6, 'neg');
    K.text(ctx, 'neutrons', px, 144, { size: 15, color: C.muted });
    K.text(ctx, '0', 610, 144, { size: 15, align: 'right', color: C.muted });
    ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(px, 166); ctx.lineTo(615, 166); ctx.stroke(); ctx.restore();
    K.text(ctx, 'net charge', px, 190, { size: 15, weight: 700 });
    const netStr = net === 0 ? '0' : (net > 0 ? '+' : '−') + Math.abs(net);
    K.text(ctx, netStr, 610, 190, { size: 17, weight: 700, align: 'right', color: net === 0 ? C.good : (net > 0 ? C.pos : C.neg) });
    let status, sub;
    if (net === 0) { status = 'Neutral atom'; sub = 'the charges cancel exactly'; }
    else if (net > 0) { status = 'Positive ion'; sub = `lost ${net} electron${net > 1 ? 's' : ''}`; }
    else { status = 'Negative ion'; sub = `gained ${-net} electron${net < -1 ? 's' : ''}`; }
    K.text(ctx, status, px, 226, { size: 17, italic: true, color: net === 0 ? C.good : C.ink });
    K.text(ctx, sub, px, 250, { mono: true, size: 10.5, color: C.muted });

    // hover tooltip
    if (hover) {
      const [a, b, c] = INFO[hover.kind];
      const bx = Math.min(hover.x + 14, 560 - 150), by = Math.max(10, hover.y - 64);
      ctx.save(); ctx.fillStyle = C.paper; ctx.strokeStyle = C.faint; ctx.lineWidth = 1;
      K.roundRect(ctx, bx, by, 150, 52, 4); ctx.fill(); ctx.stroke(); ctx.restore();
      K.text(ctx, a, bx + 10, by + 15, { size: 14, weight: 700 });
      K.text(ctx, b, bx + 10, by + 31, { mono: true, size: 10, color: C.muted });
      K.text(ctx, c, bx + 10, by + 43, { mono: true, size: 10, color: C.muted });
    }

    const coul = net === 0 ? '0 C' : `${net > 0 ? '+' : '−'}${K.sci(Math.abs(net) * 1.602e-19)} C`;
    fig.readout(`net charge = <b>${netStr === '0' ? '0' : netStr + 'e'}</b> = ${coul}`);
  };
});
