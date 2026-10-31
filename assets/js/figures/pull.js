/* Fig 1.4: pull an electron away from a proton (store energy), release it (motion → light). */
FigKit.register('pull', fig => {
  const K = FigKit, C = K.C, { ctx } = fig;
  fig.draggable();
  const PX = 92, Y = 92;           // proton position
  const R0 = 34;                   // "contact" distance
  const RMAX = 520;                // furthest pull
  const KQ = 3.2e7;                // strength of attraction (arbitrary units)
  const U = r => KQ * (1 / R0 - 1 / r);   // stored energy relative to contact
  const UMAX = U(RMAX);

  let r = R0, v = 0;               // electron distance and velocity (toward + = away)
  let mode = 'rest';               // rest | held | falling
  let released = 0;                // energy given out as light/heat
  let total = 0;                   // energy you put in
  let grabOff = 0;
  const flashes = [];

  const ex = () => PX + r;
  const onElectron = (x, y) => Math.hypot(x - ex(), y - Y) < 22;
  fig.onDown = (x, y) => {
    if (!onElectron(x, y)) return false;
    mode = 'held'; v = 0; released = 0; grabOff = ex() - x;
  };
  fig.onMove = x => {
    if (mode !== 'held') return;
    r = K.clamp(x + grabOff - PX, R0, RMAX);
    total = U(r);
  };
  fig.onUp = () => {
    if (mode !== 'held') return;
    if (r <= R0 + 1) { mode = 'rest'; r = R0; total = 0; return; }
    mode = 'falling'; v = 0;
  };
  fig.cursorAt = (x, y) => (mode === 'held' ? 'grabbing' : onElectron(x, y) ? 'grab' : 'default');

  K.button(fig, 'Pull out & release', () => {
    released = 0; r = 420; total = U(r); v = 0; mode = 'falling';
  });

  fig.frame = (dt, t) => {
    if (mode === 'falling') {
      const steps = 20, h = dt / steps;
      for (let i = 0; i < steps; i++) {
        v -= (KQ / (r * r)) * h;
        r += v * h;
        if (r <= R0) {
          released += 0.5 * v * v;  // kinetic energy → light & heat
          released = Math.min(released, total);
          r = R0; v = 0; mode = 'rest';
          flashes.push({ life: 1 });
          break;
        }
      }
    }
    const stored = U(r);
    const kinetic = mode === 'falling' ? Math.max(0, total - stored) : 0;
    if (mode === 'rest') released = total;   // all of it has been given out

    // axis / track
    K.dashedLine(ctx, PX, Y, PX + RMAX + 10, Y, C.grid, [2, 6]);

    // light flash rings when recaptured
    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i]; f.life -= dt * 0.7;
      if (f.life <= 0) { flashes.splice(i, 1); continue; }
      for (let k = 0; k < 3; k++) {
        const rad = (1 - f.life) * 160 + k * 18;
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, fig.W, 158); ctx.clip();
        ctx.strokeStyle = C.good; ctx.globalAlpha = f.life * 0.6; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(PX + R0 / 2, Y, rad, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      K.text(ctx, 'energy given out as light', PX + 70, Y - 54, { italic: true, size: 13, color: C.good, alpha: Math.min(1, f.life * 1.5) });
    }

    K.particle(ctx, PX, Y, 18, 'pos');
    K.text(ctx, 'proton', PX, Y + 32, { mono: true, size: 10, color: C.muted, align: 'center' });

    const x = ex();
    // force arrows
    const attract = K.clamp(KQ / (r * r) / 900, 6, 90);
    if (r > R0 + 4) K.arrow(ctx, x - 12, Y, x - 12 - attract, Y, C.pos, 2, 8);
    if (mode === 'held' && r > R0 + 4) {
      K.arrow(ctx, x + 12, Y, x + 12 + attract, Y, C.ink, 2, 8);
      K.text(ctx, 'your pull', x + 14 + attract / 2, Y - 14, { mono: true, size: 10, color: C.muted, align: 'center' });
    }
    if (mode === 'falling') {
      for (let k = 1; k <= 4; k++) K.dashedLine(ctx, x + 10 + k * 7, Y - 6 + k * 3, x + 18 + k * 10, Y - 6 + k * 3, C.faint, [], 1);
    }
    // hint ring at rest
    if (mode === 'rest' && !flashes.length) {
      ctx.save(); ctx.strokeStyle = C.neg; ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t * 4);
      ctx.beginPath(); ctx.arc(x, Y, 16 + 3 * Math.sin(t * 4), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      K.text(ctx, 'drag me →', x + 24, Y - 20, { italic: true, size: 13, color: C.muted });
    }
    K.particle(ctx, x, Y, 11, 'neg');

    // energy bars
    const bx = 230, bw = 330, bh = 13;
    const rows = [
      ['stored (separation)', stored, C.neg],
      ['motion (kinetic)', kinetic, C.warm],
      ['given out (light, heat)', mode === 'falling' ? 0 : released, C.good]
    ];
    K.text(ctx, 'ENERGY', bx - 160, 170, { mono: true, size: 10, color: C.muted });
    rows.forEach(([label, val, col], i) => {
      const y = 186 + i * 26;
      K.meter(ctx, bx, y, bw, bh, val / UMAX, col, label, `${Math.round((val / UMAX) * 100)}`);
    });
    // total marker
    if (total > 0) {
      const tx = bx + (total / UMAX) * bw;
      K.dashedLine(ctx, tx, 178, tx, 186 + 2 * 26 + bh + 8, C.ink, [3, 3]);
      K.text(ctx, 'total', tx, 270, { mono: true, size: 10, color: C.ink, align: 'center' });
    }

    const state = mode === 'held' ? 'holding: energy stored' : mode === 'falling' ? 'released: stored → motion' : (total > 0 ? 'recaptured: given out as light' : 'at rest, touching');
    fig.readout(`distance = <b>${(r / R0).toFixed(1)}×</b> contact · ${state}`);
  };
});
