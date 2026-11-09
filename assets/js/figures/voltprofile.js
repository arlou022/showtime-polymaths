/* Grid Ch2 fig: voltage along a street cable. Demand pulls it down; exported solar pushes it up past the legal limit. */
FigKit.register('voltprofile', fig => {
  const K = FigKit, C = K.C, { ctx } = fig;
  const R = 0.1, VSET = 245;
  const demand = K.slider(fig, { label: 'Demand', min: 0, max: 200, step: 10, value: 150, format: v => `${v} A` });
  const solar = K.slider(fig, { label: 'Solar export', min: 0, max: 250, step: 10, value: 0, format: v => `${v} A` });
  K.button(fig, 'Winter evening', () => { demand.set(150); solar.set(0); });
  K.button(fig, 'Sunny afternoon', () => { demand.set(0); solar.set(150); });

  const X0 = 70, X1 = 600, VMIN = 200, VMAX = 272, Y0 = 26, Y1 = 214;
  const yOf = v => Y1 - ((v - VMIN) / (VMAX - VMIN)) * (Y1 - Y0);
  let shown = VSET;

  fig.frame = dt => {
    const I = demand.value - solar.value;          // + = flowing out to homes, − = flowing back
    const vEnd = VSET - I * R;
    shown = K.lerp(shown, vEnd, K.ease(dt, 8));

    // legal band and inverter trip line
    ctx.save(); ctx.fillStyle = C.good; ctx.globalAlpha = 0.1; ctx.fillRect(X0, yOf(253), X1 - X0, yOf(216) - yOf(253)); ctx.restore();
    K.dashedLine(ctx, X0, yOf(253), X1, yOf(253), C.good, [4, 3], 1.2);
    K.dashedLine(ctx, X0, yOf(216), X1, yOf(216), C.good, [4, 3], 1.2);
    K.dashedLine(ctx, X0, yOf(262), X1, yOf(262), C.pos, [6, 3], 1.4);
    K.text(ctx, '253 V legal max', X1, yOf(253) + 10, { mono: true, size: 9.5, color: C.good, align: 'right' });
    K.text(ctx, '216 V legal min', X1, yOf(216) - 10, { mono: true, size: 9.5, color: C.good, align: 'right' });
    K.text(ctx, '≈262 V: solar inverters switch off', X1, yOf(262) - 9, { mono: true, size: 9.5, color: C.pos, align: 'right' });
    K.text(ctx, '230', X0 - 8, yOf(230), { mono: true, size: 9.5, color: C.muted, align: 'right' });
    K.dashedLine(ctx, X0, yOf(230), X0 + 8, yOf(230), C.muted, [], 1);

    // axis
    ctx.save(); ctx.strokeStyle = C.faint; ctx.beginPath(); ctx.moveTo(X0, Y0); ctx.lineTo(X0, Y1); ctx.lineTo(X1, Y1); ctx.stroke(); ctx.restore();
    K.text(ctx, 'substation', X0, Y1 + 14, { mono: true, size: 9.5, color: C.muted });
    K.text(ctx, 'last house', X1, Y1 + 14, { mono: true, size: 9.5, color: C.muted, align: 'right' });
    K.text(ctx, 'volts', X0 - 8, Y0 - 8, { mono: true, size: 9.5, color: C.muted, align: 'right' });

    // voltage line
    const bad = shown > 253 || shown < 216;
    ctx.save(); ctx.strokeStyle = bad ? C.pos : C.accent; ctx.lineWidth = 3; ctx.beginPath();
    ctx.moveTo(X0, yOf(VSET)); ctx.lineTo(X1, yOf(K.clamp(shown, VMIN, VMAX))); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.fillStyle = bad ? C.pos : C.accent; ctx.beginPath(); ctx.arc(X1, yOf(K.clamp(shown, VMIN, VMAX)), 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    K.text(ctx, `${VSET} V`, X0 + 6, yOf(VSET) - 10, { mono: true, size: 10.5, weight: 500 });
    K.text(ctx, `${Math.round(shown)} V`, X1 - 10, yOf(K.clamp(shown, VMIN, VMAX)) + (I >= 0 ? 14 : -14), { mono: true, size: 11, weight: 500, align: 'right', color: bad ? C.pos : C.ink });

    let status;
    if (vEnd > 262) status = '<span class="hot">above ≈262 V: inverters at the end of the street switch off</span>';
    else if (vEnd > 253) status = '<span class="hot">above the 253 V legal limit</span>';
    else if (vEnd < 216) status = '<span class="hot">below the 216 V legal limit</span>';
    else status = '<span class="ok">within the legal range</span>';
    const dirTxt = I > 0 ? `drop = ${I} A × 0.1 Ω = ${(I * R).toFixed(0)} V` : I < 0 ? `rise = ${-I} A × 0.1 Ω = ${(-I * R).toFixed(0)} V` : 'no current, no drop';
    fig.readout(`${dirTxt} · last house: <b>${vEnd.toFixed(0)} V</b> · ${status}`);
  };
});
