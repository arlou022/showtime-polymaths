/* Grid Ch3 fig: the market treats Britain as one copper plate; the wires don't. Sell more than the line can carry and NESO pays twice. */
FigKit.register('copperplate', fig => {
  const K = FigKit, C = K.C, { ctx } = fig;
  const LIMIT = 6000, PRICE = 190;                   // MW the Scotland–England link can carry; £/MWh to turn wind down + gas up (illustrative)
  const sold = K.slider(fig, { label: 'Wind sold south', min: 0, max: 10000, step: 250, value: 4000, format: v => `${v.toLocaleString('en-GB')} MW` });
  let offset = 0;

  fig.frame = dt => {
    const S = sold.value, excess = Math.max(0, S - LIMIT), flows = Math.min(S, LIMIT);
    offset += dt * 40;

    // panel titles + divider
    K.text(ctx, 'THE MARKET', 160, 18, { mono: true, size: 10.5, weight: 500, color: C.muted, align: 'center' });
    K.text(ctx, 'THE WIRES', 480, 18, { mono: true, size: 10.5, weight: 500, color: C.muted, align: 'center' });
    K.dashedLine(ctx, 320, 10, 320, 240, C.faint, [3, 4]);

    // left: a trade with no wires in it
    ctx.save(); ctx.fillStyle = C.accent; ctx.globalAlpha = 0.1; K.roundRect(ctx, 30, 40, 260, 160, 10); ctx.fill(); ctx.restore();
    K.text(ctx, 'one big copper plate', 160, 190, { italic: true, size: 12.5, color: C.muted, align: 'center' });
    K.text(ctx, 'Scottish wind', 80, 70, { mono: true, size: 10, align: 'center' });
    K.text(ctx, 'English homes', 240, 150, { mono: true, size: 10, align: 'center' });
    K.arrow(ctx, 95, 85, 225, 135, C.accent, 2.4, 10);
    K.text(ctx, `sold: ${S.toLocaleString('en-GB')} MW`, 135, 132, { mono: true, size: 11, weight: 500, align: 'center', color: C.accent });

    // right: Scotland above a boundary line, England below
    const LX = 480;
    ctx.save(); ctx.fillStyle = C.neutral; ctx.globalAlpha = 0.12; ctx.fillRect(340, 34, 280, 76); ctx.fillRect(340, 136, 280, 100); ctx.restore();
    K.text(ctx, 'Scotland', 352, 46, { mono: true, size: 10, color: C.muted });
    K.text(ctx, 'England', 352, 228, { mono: true, size: 10, color: C.muted });
    K.dashedLine(ctx, 340, 123, 620, 123, C.ink, [6, 4], 1.4);
    K.text(ctx, 'boundary limit:', 350, 134, { mono: true, size: 9.5, color: C.muted });
    K.text(ctx, `about ${LIMIT.toLocaleString('en-GB')} MW`, 350, 147, { mono: true, size: 9.5, color: C.muted });
    // the line
    ctx.save(); ctx.strokeStyle = excess > 0 ? C.pos : C.ink; ctx.lineWidth = 2 + 5 * Math.min(1, flows / LIMIT); ctx.beginPath(); ctx.moveTo(LX, 60); ctx.lineTo(LX, 200); ctx.stroke(); ctx.restore();
    const gap = K.clamp(4000 / Math.max(flows, 1), 10, 80);
    if (flows > 0) for (let y = 60 + (offset % gap); y < 200; y += gap) K.particle(ctx, LX, y, 3, 'neg', 0.9);
    K.text(ctx, `flowing: ${flows.toLocaleString('en-GB')} MW`, LX + 12, 165, { mono: true, size: 10, weight: 500 });
    if (excess > 0) {
      K.text(ctx, `wind turned DOWN −${excess.toLocaleString('en-GB')} MW`, LX, 80, { mono: true, size: 10.5, weight: 500, color: C.pos, align: 'center' });
      K.text(ctx, `gas turned UP +${excess.toLocaleString('en-GB')} MW`, LX, 200, { mono: true, size: 10.5, weight: 500, color: C.pos, align: 'center' });
    }

    const cost = excess * PRICE;
    fig.readout(excess > 0
      ? `${excess.toLocaleString('en-GB')} MW more than the wires can carry → NESO pays twice: <b>£${cost.toLocaleString('en-GB')} an hour</b> (illustrative prices, £70 + £120 per MWh)`
      : 'everything sold fits on the wires: no extra cost');
  };
});
