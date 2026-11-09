/* Grid Ch3 fig: frequency as a live gauge of the balance between generation and demand. */
FigKit.register('balance', fig => {
  const K = FigKit, C = K.C, { ctx } = fig;
  const demand = K.slider(fig, { label: 'Demand', min: 30, max: 40, step: 0.5, value: 35, format: v => `${v.toFixed(1)} GW` });
  const neso = K.segmented(fig, { label: 'NESO balancing', value: 'off', options: [{ value: 'off', label: 'Off' }, { value: 'on', label: 'On' }] });
  let gen = 35, freq = 50;

  const CX = 200, CY = 160, R = 110;
  const angOf = f => Math.PI + ((K.clamp(f, 49, 51) - 49) / 2) * Math.PI;   // 49 Hz left, 51 Hz right

  function arcBand(f1, f2, col, alpha) {
    ctx.save(); ctx.strokeStyle = col; ctx.globalAlpha = alpha; ctx.lineWidth = 14;
    ctx.beginPath(); ctx.arc(CX, CY, R, angOf(f1), angOf(f2)); ctx.stroke(); ctx.restore();
  }

  fig.frame = dt => {
    const D = demand.value;
    if (neso.value === 'on') gen = K.lerp(gen, D, K.ease(dt, 1.2));     // generation follows demand after a short delay
    const target = 50 + (gen - D) * 0.25;                                   // more used than made -> frequency falls
    freq = K.lerp(freq, target, K.ease(dt, 3));

    // dial
    arcBand(49, 51, C.grid, 1);
    arcBand(49.5, 50.5, C.warm, 0.35);
    arcBand(49.8, 50.2, C.good, 0.55);
    [49, 49.5, 50, 50.5, 51].forEach(f => {
      const a = angOf(f);
      K.text(ctx, f.toFixed(1), CX + Math.cos(a) * (R + 26), CY + Math.sin(a) * (R + 26), { mono: true, size: 10, color: f === 50 ? C.ink : C.muted, align: 'center' });
    });
    const a = angOf(freq), bad = freq < 49.8 || freq > 50.2;
    ctx.save(); ctx.strokeStyle = bad ? C.pos : C.ink; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(CX, CY); ctx.lineTo(CX + Math.cos(a) * (R - 12), CY + Math.sin(a) * (R - 12)); ctx.stroke();
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(CX, CY, 6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    K.text(ctx, `${freq.toFixed(2)} Hz`, CX, CY + 30, { mono: true, size: 18, weight: 500, align: 'center', color: bad ? C.pos : C.ink });
    K.text(ctx, 'green: normal running · amber: legal limits', CX, CY + 54, { mono: true, size: 9.5, align: 'center', color: C.muted });

    // generation vs demand bars
    const bx = 430, by = 200, bh = 150, scale = bh / 40;
    [[gen, 'generation', C.good], [D, 'demand', C.accent]].forEach(([v, label, col], i) => {
      const x = bx + i * 80;
      ctx.save(); ctx.fillStyle = C.grid; ctx.fillRect(x, by - bh, 44, bh); ctx.fillStyle = col; ctx.globalAlpha = 0.85; ctx.fillRect(x, by - v * scale, 44, v * scale); ctx.restore();
      K.text(ctx, `${v.toFixed(1)} GW`, x + 22, by - v * scale - 10, { mono: true, size: 10.5, weight: 500, align: 'center' });
      K.text(ctx, label, x + 22, by + 14, { mono: true, size: 10, align: 'center', color: C.muted });
    });

    const gap = gen - D;
    fig.readout(Math.abs(gap) < 0.05
      ? 'generation matches demand → frequency holds at <b>50 Hz</b>'
      : gap < 0
        ? `using ${(-gap).toFixed(1)} GW more than is generated → generators slow down → frequency <b>falls</b>${neso.value === 'off' ? ' (switch NESO on)' : ''}`
        : `generating ${gap.toFixed(1)} GW more than is used → generators speed up → frequency <b>rises</b>${neso.value === 'off' ? ' (switch NESO on)' : ''}`);
  };
});
