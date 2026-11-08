/* Grid fig: a transformer. Two coils on one iron core; the turns ratio sets the voltage, and only AC works. */
FigKit.register('transformer', fig => {
  const K = FigKit, C = K.C, { ctx } = fig;
  const N1 = 100, V1 = 20000;
  const CORE = { x: 190, y: 40, w: 260, h: 200, t: 34 };
  let t0 = 0, dcSince = 0;

  const turns = K.slider(fig, { label: 'Secondary turns', min: 10, max: 2000, step: 10, value: 2000, format: v => v.toLocaleString('en-GB') });
  const mode = K.segmented(fig, {
    label: 'Supply', value: 'ac',
    options: [{ value: 'ac', label: 'AC' }, { value: 'dc', label: 'DC' }],
    onChange: v => { if (v === 'dc') dcSince = 0; }
  });

  function coil(xL, xR, yTop, yBot, n, col) {
    const step = (yBot - yTop) / n;
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = n > 24 ? 1.6 : 2.2;
    for (let i = 0; i < n; i++) {
      const y = yTop + step * (i + 0.5);
      ctx.beginPath(); ctx.moveTo(xL - 6, y + step * 0.35); ctx.lineTo(xR + 6, y - step * 0.35); ctx.stroke();
    }
    ctx.restore();
  }

  fig.frame = dt => {
    t0 += dt;
    const ac = mode.value === 'ac';
    if (!ac) dcSince += dt;
    const N2 = turns.value, V2 = V1 * N2 / N1;
    const w = Math.PI * 2 * 0.6;                      // slowed right down from 50 Hz so you can see it
    const phase = Math.sin(t0 * w);
    const change = ac ? Math.cos(t0 * w) : Math.exp(-dcSince * 8);   // DC: only a blip at switch-on

    // iron core
    const { x, y, w: cw, h, t } = CORE;
    ctx.save(); ctx.fillStyle = C.neutral; ctx.globalAlpha = 0.55;
    ctx.fillRect(x, y, cw, t); ctx.fillRect(x, y + h - t, cw, t); ctx.fillRect(x, y, t, h); ctx.fillRect(x + cw - t, y, t, h);
    ctx.restore();
    K.text(ctx, 'iron core', x + cw / 2, y - 12, { mono: true, size: 10, color: C.muted, align: 'center' });

    // magnetic field circulating in the core (arrows), strength follows the current
    const strength = ac ? phase : 1;
    const per = 2 * (cw + h - 2 * t);
    const nArrows = 10;
    for (let i = 0; i < nArrows; i++) {
      let s = ((i / nArrows) * per + (ac ? 0 : 0)) % per;
      const inset = t / 2;
      const ax = x + inset, ay = y + inset, aw = cw - t, ah = h - t;
      let px, py, dx = 0, dy = 0;
      if (s < aw) { px = ax + s; py = ay; dx = 1; }
      else if ((s -= aw) < ah) { px = ax + aw; py = ay + s; dy = 1; }
      else if ((s -= ah) < aw) { px = ax + aw - s; py = ay + ah; dx = -1; }
      else { s -= aw; px = ax; py = ay + ah - s; dy = -1; }
      const dir = strength >= 0 ? 1 : -1, len = 9 * Math.abs(strength) + 2;
      ctx.save(); ctx.globalAlpha = 0.3 + 0.7 * Math.abs(strength);
      K.arrow(ctx, px - dx * len * dir, py - dy * len * dir, px + dx * len * dir, py + dy * len * dir, C.accent, 2, 6);
      ctx.restore();
    }

    // coils
    coil(x, x + t, y + t + 8, y + h - t - 8, Math.round(N1 / 10), C.warm);
    coil(x + cw - t, x + cw, y + t + 8, y + h - t - 8, K.clamp(Math.round(N2 / 50), 1, 40), C.warm);
    K.text(ctx, `${N1} turns`, x - 12, y + h + 16, { mono: true, size: 10.5, color: C.muted });
    K.text(ctx, `${N2.toLocaleString('en-GB')} turns`, x + cw + 12, y + h + 16, { mono: true, size: 10.5, color: C.muted, align: 'right' });

    // input source and output meter
    K.text(ctx, 'IN', 70, 92, { mono: true, size: 10, color: C.muted, align: 'center' });
    K.text(ctx, '20,000 V', 70, 112, { mono: true, size: 12, weight: 500, align: 'center' });
    K.text(ctx, ac ? 'AC' : 'DC', 70, 130, { mono: true, size: 10.5, color: C.accent, align: 'center' });
    const outV = ac ? V2 : V2 * change;
    K.text(ctx, 'OUT', 570, 92, { mono: true, size: 10, color: C.muted, align: 'center' });
    K.text(ctx, `${Math.round(Math.abs(outV)).toLocaleString('en-GB')} V`, 570, 112, { mono: true, size: 12, weight: 500, align: 'center', color: ac || Math.abs(outV) > 1 ? C.ink : C.pos });
    K.text(ctx, ac ? (N2 > N1 ? 'stepped up' : N2 < N1 ? 'stepped down' : 'same') : 'nothing', 570, 130, { mono: true, size: 10.5, color: C.accent, align: 'center' });

    // little traces inside the core window: input (top) and output (bottom)
    const ix = x + t + 14, iw = cw - 2 * t - 28;
    const trace = (cy, amp, fn, col, label) => {
      ctx.save(); ctx.strokeStyle = C.grid; ctx.beginPath(); ctx.moveTo(ix, cy); ctx.lineTo(ix + iw, cy); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.beginPath();
      for (let k = 0; k <= 60; k++) { const xx = ix + (k / 60) * iw; const yy = cy - fn(k / 60) * amp; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
      ctx.stroke(); ctx.restore();
      K.text(ctx, label, ix, cy - 26, { mono: true, size: 9.5, color: C.muted });
    };
    const scaleOut = K.clamp(Math.log10(Math.max(V2, 1)) / Math.log10(400000), 0.05, 1);
    trace(y + t + 42, 14, s => (ac ? Math.sin(t0 * w - s * 6) : 1), C.accent, 'input');
    trace(y + h - t - 30, 14 * scaleOut, s => (ac ? Math.sin(t0 * w - s * 6) : 0), C.neg, 'output');

    fig.readout(ac
      ? `V out = 20,000 V × ${N2.toLocaleString('en-GB')} ÷ ${N1} = <b>${Math.round(V2).toLocaleString('en-GB')} V</b> · current changes by the opposite factor, so the power stays the same`
      : 'DC: a steady current makes a steady field. No change in the field means <b>no voltage out</b> (just a blip when you switch on)');
  };
});
