/* Fig 1.7: current = charge per second crossing a line. Electron flow vs conventional current. */
FigKit.register('current', fig => {
  const K = FigKit, C = K.C, { ctx } = fig;
  const X0 = 40, X1 = 600, Y0 = 92, Y1 = 150, LINE = 320;
  const PER_DOT = 0.16;                           // coulombs per dot (10¹⁸ electrons)
  const N = 56;
  const dots = Array.from({ length: N }, (_, i) => ({
    x: X0 + ((i + Math.random() * 0.8) / N) * (X1 - X0), y: K.rand(Y0 + 8, Y1 - 8), ph: Math.random() * 6.28
  }));
  const crosses = [];
  const flashes = [];

  const push = K.slider(fig, { label: 'Push', min: 0, max: 10, step: 1, value: 5, format: v => (v === 0 ? 'none' : `${v} / 10`) });
  const view = K.segmented(fig, {
    value: 'electron',
    options: [{ value: 'electron', label: 'Electron flow' }, { value: 'conventional', label: 'Conventional' }, { value: 'both', label: 'Both' }]
  });

  fig.frame = (dt, t) => {
    const speed = push.value * 14;              // px/s
    // wire
    ctx.save(); ctx.fillStyle = 'rgba(205, 127, 50, 0.16)'; ctx.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
    ctx.strokeStyle = C.muted; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(X0, Y0); ctx.lineTo(X1, Y0); ctx.moveTo(X0, Y1); ctx.lineTo(X1, Y1); ctx.stroke(); ctx.restore();
    K.text(ctx, 'from − terminal', X0, Y1 + 18, { mono: true, size: 10, color: C.neg });
    K.text(ctx, 'to + terminal', X1, Y1 + 18, { mono: true, size: 10, color: C.pos, align: 'right' });
    K.text(ctx, 'copper wire', X0, Y0 - 12, { mono: true, size: 10, color: C.muted });

    // counting line
    K.dashedLine(ctx, LINE, Y0 - 22, LINE, Y1 + 8, C.ink, [4, 3], 1.2);
    K.text(ctx, 'counting line', LINE, Y0 - 30, { mono: true, size: 10, color: C.ink, align: 'center' });

    // move dots (electrons drift − → +, i.e. left to right)
    dots.forEach(d => {
      const old = d.x;
      d.x += speed * dt + Math.sin(t * 7 + d.ph) * 0.25;
      d.y += Math.cos(t * 5 + d.ph) * 0.3;
      d.y = K.clamp(d.y, Y0 + 6, Y1 - 6);
      if (old < LINE && d.x >= LINE) { crosses.push(t); flashes.push({ y: d.y, life: 1 }); }
      if (d.x > X1) d.x -= X1 - X0;
      K.particle(ctx, d.x, d.y, 5, 'neg');
    });
    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i]; f.life -= dt * 2.5;
      if (f.life <= 0) { flashes.splice(i, 1); continue; }
      ctx.save(); ctx.strokeStyle = C.accent; ctx.globalAlpha = f.life; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(LINE, f.y, 9 + (1 - f.life) * 8, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }

    // direction arrows
    const v = view.value;
    if ((v === 'electron' || v === 'both') && speed > 0) {
      K.arrow(ctx, 120, 44, 250, 44, C.neg, 2.2, 9);
      K.text(ctx, 'electron flow (− → +)', 260, 44, { mono: true, size: 10.5, color: C.neg });
    }
    if ((v === 'conventional' || v === 'both') && speed > 0) {
      const y = v === 'both' ? 196 : 44;
      K.arrow(ctx, 520, y, 390, y, C.pos, 2.2, 9);
      K.text(ctx, 'conventional current (+ → −)', 380, y, { mono: true, size: 10.5, color: C.pos, align: 'right' });
    }

    // counter panel
    while (crosses.length && t - crosses[0] > 2) crosses.shift();
    const perSec = crosses.length / 2;
    const I = perSec * PER_DOT;
    K.text(ctx, `${perSec.toFixed(1)} dots/s × 0.16 C = ${I.toFixed(2)} A`, 320, 226, { size: 15, align: 'center', color: C.ink });

    // real-world drift speed for this current in a 1 mm² copper wire: v = I / (n A e)
    const drift = I / (8.5e28 * 1e-6 * 1.602e-19) * 1000;   // mm/s
    fig.readout(speed === 0
      ? 'no push → <b>no current</b> (electrons still jiggle, but go nowhere)'
      : `I = Q/t ≈ <b>${I.toFixed(2)} A</b> · real drift speed in 1 mm² copper ≈ ${drift.toFixed(3)} mm/s`);
  };
});
