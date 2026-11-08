/* Grid fig: mains AC. The voltage swings ±325 V; "230 V" is the RMS value, the DC voltage that gives the same power. */
FigKit.register('rms', fig => {
  const K = FigKit, C = K.C, { ctx } = fig;
  const PEAK = 325, RMS = 230;
  const X0 = 62, X1 = 610, CY = 112, AMP = 82;
  const view = K.segmented(fig, {
    label: 'Show', value: 'v',
    options: [{ value: 'v', label: 'Voltage' }, { value: 'p', label: 'Power' }]
  });
  let ph = 0;

  fig.frame = dt => {
    ph += dt * 0.5;                                    // slowed from 50 cycles a second
    const cycles = 2;
    const xAt = s => X0 + s * (X1 - X0);
    const power = view.value === 'p';

    // axes
    ctx.save(); ctx.strokeStyle = C.faint; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(X0, CY); ctx.lineTo(X1, CY); ctx.moveTo(X0, CY - AMP - 8); ctx.lineTo(X0, CY + AMP + 8); ctx.stroke(); ctx.restore();
    K.text(ctx, '0', X0 - 8, CY, { mono: true, size: 9.5, color: C.muted, align: 'right' });
    K.text(ctx, `${cycles} cycles = 1/25 of a second`, X1, CY + AMP + 20, { mono: true, size: 9.5, color: C.muted, align: 'right' });

    if (!power) {
      K.dashedLine(ctx, X0, CY - AMP, X1, CY - AMP, C.muted, [3, 4]);
      K.dashedLine(ctx, X0, CY + AMP, X1, CY + AMP, C.muted, [3, 4]);
      K.text(ctx, '+325', X0 - 8, CY - AMP, { mono: true, size: 9.5, color: C.muted, align: 'right' });
      K.text(ctx, '−325', X0 - 8, CY + AMP, { mono: true, size: 9.5, color: C.muted, align: 'right' });
      const yR = CY - AMP * RMS / PEAK;
      K.dashedLine(ctx, X0, yR, X1, yR, C.accent, [6, 4], 1.6);
      K.text(ctx, '230 V (RMS)', X1, yR - 10, { mono: true, size: 10.5, weight: 500, color: C.accent, align: 'right' });
      ctx.save(); ctx.strokeStyle = C.neg; ctx.lineWidth = 2.2; ctx.beginPath();
      for (let k = 0; k <= 200; k++) { const s = k / 200; const y = CY - AMP * Math.sin(s * cycles * Math.PI * 2); k ? ctx.lineTo(xAt(s), y) : ctx.moveTo(xAt(s), y); }
      ctx.stroke(); ctx.restore();
    } else {
      // power ∝ V²: always positive, averages to half the peak power
      const top = CY - AMP;
      ctx.save(); ctx.fillStyle = C.warm; ctx.globalAlpha = 0.22; ctx.beginPath(); ctx.moveTo(X0, CY);
      for (let k = 0; k <= 200; k++) { const s = k / 200; const v = Math.sin(s * cycles * Math.PI * 2); ctx.lineTo(xAt(s), CY - AMP * v * v); }
      ctx.lineTo(X1, CY); ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.save(); ctx.strokeStyle = C.warm; ctx.lineWidth = 2.2; ctx.beginPath();
      for (let k = 0; k <= 200; k++) { const s = k / 200; const v = Math.sin(s * cycles * Math.PI * 2); const y = CY - AMP * v * v; k ? ctx.lineTo(xAt(s), y) : ctx.moveTo(xAt(s), y); }
      ctx.stroke(); ctx.restore();
      K.dashedLine(ctx, X0, CY - AMP / 2, X1, CY - AMP / 2, C.accent, [6, 4], 1.6);
      K.text(ctx, 'average power = what 230 V DC would give', X1, CY - AMP / 2 - 10, { mono: true, size: 10.5, weight: 500, color: C.accent, align: 'right' });
      K.text(ctx, 'peak', X0 - 8, top, { mono: true, size: 9.5, color: C.muted, align: 'right' });
    }

    // moving cursor
    const s = (ph % 1);
    const v = Math.sin(s * cycles * Math.PI * 2);
    const cy = power ? CY - AMP * v * v : CY - AMP * v;
    ctx.save(); ctx.fillStyle = C.pos; ctx.beginPath(); ctx.arc(xAt(s), cy, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();

    fig.readout(power
      ? `power goes as voltage squared, so it’s always positive · its average is exactly <b>half</b> the peak`
      : `right now: <b>${Math.round(PEAK * v)} V</b> · peak 325 V · RMS 230 V = 325 ÷ √2`);
  };
});
