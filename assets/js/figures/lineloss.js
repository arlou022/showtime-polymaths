/* Grid fig: send 100 MW down a 5 Ω line. Raise the voltage and watch the heat loss collapse (loss = I²R). */
FigKit.register('lineloss', fig => {
  const K = FigKit, C = K.C, { ctx } = fig;
  const P = 100e6, R = 5;
  const LEVELS = [11000, 20000, 33000, 66000, 132000, 275000, 400000, 765000, 1000000];
  const fmtV = v => (v >= 1e6 ? '1,000 kV' : `${Math.round(v / 1000)} kV`);
  const volt = K.slider(fig, { label: 'Line voltage', min: 0, max: LEVELS.length - 1, step: 1, value: 1, format: i => fmtV(LEVELS[i]) });
  K.button(fig, '20 kV', () => volt.set(1));
  K.button(fig, '400 kV', () => volt.set(6));
  let offset = 0;

  const fmtW = w => (w >= 1e6 ? `${(w / 1e6).toFixed(w >= 1e7 ? 0 : 1)} MW` : `${Math.round(w / 1000).toLocaleString('en-GB')} kW`);

  fig.frame = (dt, t) => {
    const V = LEVELS[volt.value], I = P / V, loss = I * I * R, frac = loss / P;
    const impossible = frac >= 1;
    offset += dt * 60;

    const Y = 92, X1 = 96, X2 = 548;
    // power station + town
    ctx.save(); ctx.fillStyle = C.paper; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.4;
    ctx.fillRect(30, Y - 30, 60, 54); ctx.strokeRect(30, Y - 30, 60, 54);
    ctx.fillRect(44, Y - 52, 10, 22); ctx.strokeRect(44, Y - 52, 10, 22);
    ctx.restore();
    K.text(ctx, 'power station', 60, Y + 40, { mono: true, size: 9.5, color: C.muted, align: 'center' });
    for (let k = 0; k < 3; k++) {
      const hx = 566 + k * 24, hy = Y + 8;
      ctx.save(); ctx.fillStyle = C.paper; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(hx - 9, hy + 12); ctx.lineTo(hx - 9, hy - 2); ctx.lineTo(hx, hy - 12); ctx.lineTo(hx + 9, hy - 2); ctx.lineTo(hx + 9, hy + 12); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    K.text(ctx, 'town', 590, Y + 40, { mono: true, size: 9.5, color: C.muted, align: 'center' });

    // the line, glowing with heat
    const heat = K.clamp(frac * 2.2, 0, 1);
    const flicker = impossible ? 0.75 + 0.25 * Math.sin(t * 30) : 1;
    if (heat > 0.01) {
      ctx.save(); ctx.strokeStyle = C.warm; ctx.globalAlpha = 0.55 * heat * flicker; ctx.lineWidth = 6 + 26 * heat;
      ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(X1, Y); ctx.lineTo(X2, Y); ctx.stroke(); ctx.restore();
    }
    ctx.save(); ctx.strokeStyle = heat > 0.15 ? C.pos : C.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X1, Y); ctx.lineTo(X2, Y); ctx.stroke(); ctx.restore();
    // electrons: more current, more charge flowing past
    const gap = K.clamp(4200 / I, 6, 90);
    for (let x = X1 + (offset % gap); x < X2; x += gap) K.particle(ctx, x, Y, 3.2, 'neg', 0.9);
    K.text(ctx, `${fmtV(V)} · ${Math.round(I).toLocaleString('en-GB')} A`, (X1 + X2) / 2, Y - 24, { mono: true, size: 12, weight: 500, align: 'center' });
    K.text(ctx, 'line resistance 5 Ω', (X1 + X2) / 2, Y + 24, { mono: true, size: 9.5, color: C.muted, align: 'center' });

    // bars
    const bx = 200, bw = 330, bh = 13;
    K.meter(ctx, bx, 168, bw, bh, 1, C.accent, 'power sent', '100 MW');
    K.meter(ctx, bx, 194, bw, bh, Math.min(frac, 1), C.pos, 'lost as heat', impossible ? `${fmtW(loss)}!` : `${fmtW(loss)} (${(frac * 100).toFixed(frac < 0.01 ? 2 : 1)}%)`);
    K.meter(ctx, bx, 220, bw, bh, Math.max(0, 1 - frac), C.good, 'arrives', impossible ? 'nothing' : fmtW(P - loss));
    if (impossible) K.text(ctx, 'More heat than power sent: impossible. The wire would melt first.', 320, 252, { italic: true, size: 13, color: C.pos, align: 'center' });

    fig.readout(`I = 100 MW ÷ ${fmtV(V)} = <b>${Math.round(I).toLocaleString('en-GB')} A</b> · loss = I² × R = ${Math.round(I).toLocaleString('en-GB')}² × 5 = <b>${fmtW(loss)}</b>`);
  };
});
