/* Grid Ch2 fig: last-in, first-out curtailment. Three wind farms share a cable; when it's full, the newest is turned down first. */
FigKit.register('lifo', fig => {
  const K = FigKit, C = K.C, { ctx } = fig;
  const LIMIT = 30;                                   // MW the cable can carry
  const GENS = [
    { name: 'A · connected 2012', cap: 15 },
    { name: 'B · connected 2018', cap: 15 },
    { name: 'C · connected 2025', cap: 15 }
  ];
  const wind = K.slider(fig, { label: 'Wind', min: 0, max: 100, step: 5, value: 60, format: v => `${v}%` });
  const shown = GENS.map(() => ({ run: 0, cut: 0 }));

  const X0 = 190, BW = 360, Y0 = 34, ROW = 54, MW = BW / 45;

  fig.frame = dt => {
    // what each could make, then cut back newest-first until the total fits under the limit
    const want = GENS.map(g => g.cap * wind.value / 100);
    let excess = Math.max(0, want.reduce((a, b) => a + b, 0) - LIMIT);
    const cut = [0, 0, 0];
    for (let i = GENS.length - 1; i >= 0 && excess > 0; i--) { cut[i] = Math.min(want[i], excess); excess -= cut[i]; }
    const k = K.ease(dt, 8);

    let used = 0;
    GENS.forEach((g, i) => {
      shown[i].run = K.lerp(shown[i].run, want[i] - cut[i], k);
      shown[i].cut = K.lerp(shown[i].cut, cut[i], k);
      const y = Y0 + i * ROW;
      K.text(ctx, g.name, X0 - 12, y + 14, { mono: true, size: 10.5, align: 'right', color: cut[i] > 0.01 ? C.pos : C.ink });
      ctx.save(); ctx.fillStyle = C.grid; K.roundRect(ctx, X0, y, BW, 28, 3); ctx.fill();
      ctx.fillStyle = C.good; ctx.globalAlpha = 0.8; K.roundRect(ctx, X0, y, shown[i].run * MW, 28, 3); ctx.fill();
      ctx.globalAlpha = 0.5; ctx.fillStyle = C.pos;
      ctx.fillRect(X0 + shown[i].run * MW, y, shown[i].cut * MW, 28);
      ctx.restore();
      K.text(ctx, cut[i] > 0.01 ? `${(want[i] - cut[i]).toFixed(1)} MW (${Math.round(cut[i] / want[i] * 100)}% cut)` : `${want[i].toFixed(1)} MW`, X0 + BW + 8, y + 14, { mono: true, size: 10, color: C.muted });
      used += want[i] - cut[i];
    });

    // the cable: total vs limit
    const yT = Y0 + 3 * ROW + 10;
    K.text(ctx, 'shared cable', X0 - 12, yT + 14, { mono: true, size: 10.5, weight: 500, align: 'right' });
    ctx.save(); ctx.fillStyle = C.grid; K.roundRect(ctx, X0, yT, BW, 28, 3); ctx.fill();
    ctx.fillStyle = C.accent; ctx.globalAlpha = 0.85; K.roundRect(ctx, X0, yT, Math.min(used, 45) * MW, 28, 3); ctx.fill(); ctx.restore();
    K.dashedLine(ctx, X0 + LIMIT * MW, Y0 - 12, X0 + LIMIT * MW, yT + 40, C.pos, [5, 4], 1.6);
    K.text(ctx, `limit ${LIMIT} MW`, X0 + LIMIT * MW, Y0 - 20, { mono: true, size: 10, color: C.pos, align: 'center' });
    K.text(ctx, `${used.toFixed(1)} MW`, X0 + BW + 8, yT + 14, { mono: true, size: 10, weight: 500 });

    const lost = cut.reduce((a, b) => a + b, 0);
    fig.readout(lost > 0.01
      ? `cable full: <b>${lost.toFixed(1)} MW turned down</b>, newest first (C${cut[1] > 0.01 ? ', then B' : ''})`
      : 'cable has room: everyone runs at full output');
  };
});
