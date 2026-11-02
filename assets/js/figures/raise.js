/* News fig: how the share price sets how many new shares a company must sell to raise £100m. */
FigKit.register('raise', fig => {
  const K = FigKit, C = K.C, { ctx } = fig;
  const TARGET = 100e6;          // £100m to raise
  const PER_BLOCK = 50000;       // each block = 50,000 shares
  const COLS = 20, ROWS = 2, MAXB = COLS * ROWS;   // 40 blocks = 2 million shares
  const BW = 24, BH = 34, GAP = 5, X0 = 34, Y0 = 92;

  const price = K.slider(fig, { label: 'Share price', min: 50, max: 300, step: 10, value: 250, format: v => `£${v}` });
  K.button(fig, 'Peak (£250)', () => price.set(250));
  K.button(fig, 'After crash (£100)', () => price.set(100));

  let shown = TARGET / 250 / PER_BLOCK;     // animated number of blocks

  fig.frame = dt => {
    const p = price.value;
    const shares = TARGET / p;
    const blocks = shares / PER_BLOCK;
    shown = K.lerp(shown, blocks, K.ease(dt, 8));

    K.text(ctx, 'NEW SHARES THE COMPANY MUST SELL TO RAISE £100m', X0, 30, { mono: true, size: 10.5, color: C.muted });
    K.text(ctx, `${Math.round(shares).toLocaleString('en-GB')} shares`, X0, 60, { size: 26, weight: 600 });
    K.text(ctx, `at £${p} each`, X0 + 250, 62, { italic: true, size: 15, color: C.muted });

    for (let i = 0; i < MAXB; i++) {
      const col = i % COLS, row = Math.floor(i / COLS);
      const x = X0 + col * (BW + GAP), y = Y0 + row * (BH + GAP);
      const fill = K.clamp(shown - i, 0, 1);
      ctx.save();
      ctx.strokeStyle = C.faint; ctx.lineWidth = 1;
      K.roundRect(ctx, x, y, BW, BH, 3); ctx.stroke();
      if (fill > 0) {
        ctx.fillStyle = C.accent; ctx.globalAlpha = 0.85;
        K.roundRect(ctx, x, y, BW * fill, BH, 3); ctx.fill();
      }
      ctx.restore();
    }
    K.text(ctx, 'each block = 50,000 shares', X0, Y0 + 2 * (BH + GAP) + 12, { mono: true, size: 10, color: C.muted });

    // reference markers for the two prices in the article
    const marker = (n, label, y, align = 'center') => {
      const idx = n / PER_BLOCK;
      const col = (idx - 1) % COLS, row = Math.floor((idx - 1) / COLS);
      const x = X0 + col * (BW + GAP) + BW, yy = Y0 + row * (BH + GAP);
      K.dashedLine(ctx, x + 2, yy - 6, x + 2, yy + BH + 6, C.ink, [3, 3], 1.2);
      K.text(ctx, label, x + 2, y, { mono: true, size: 10, color: C.ink, align });
    };
    marker(400000, 'peak: 400,000', Y0 - 10);
    marker(1000000, 'after crash: 1,000,000', Y0 - 10, 'right');

    const vsPeak = shares / 400000;
    fig.readout(`£100m ÷ £${p} = <b>${Math.round(shares).toLocaleString('en-GB')} new shares</b> · ${vsPeak.toFixed(1)}× as many as at the peak`);
  };
});
