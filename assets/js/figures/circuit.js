/* Fig 1.8: battery + resistor circuit with live I–V graph. I = V / R. */
FigKit.register('circuit', fig => {
  const K = FigKit, C = K.C, { ctx } = fig;
  const volts = K.slider(fig, { label: 'Voltage', min: 0, max: 12, step: 0.5, value: 9, format: v => `${v.toFixed(1)} V` });
  const ohms = K.slider(fig, { label: 'Resistance', min: 2, max: 20, step: 1, value: 10, format: v => `${v} Ω` });

  const L = 50, T = 50, Rx = 320, B = 270;
  const BAT1 = 140, BAT2 = 180;           // battery gap in left wire (+ on top)
  const RES1 = 115, RES2 = 205;           // resistor on right wire
  // electron path: out of − (bottom of battery) → down → right → up through resistor → left → into +
  const pts = [[L, BAT2], [L, B], [Rx, B], [Rx, T], [L, T], [L, BAT1]];
  const segs = []; let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
    const len = Math.hypot(x2 - x1, y2 - y1);
    segs.push({ x1, y1, x2, y2, s0: total, len }); total += len;
  }
  const at = s => {
    s = ((s % total) + total) % total;
    const g = segs.find(q => s >= q.s0 && s <= q.s0 + q.len) || segs[segs.length - 1];
    const f = (s - g.s0) / g.len;
    return [K.lerp(g.x1, g.x2, f), K.lerp(g.y1, g.y2, f)];
  };
  const N = 30;
  let offset = 0;

  fig.frame = (dt, t) => {
    const V = volts.value, R = ohms.value, I = V / R, P = V * I;
    offset += dt * I * 38;

    // wires (leave gaps for the resistor)
    ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(L, BAT2); ctx.lineTo(L, B); ctx.lineTo(Rx, B); ctx.lineTo(Rx, RES2);
    ctx.moveTo(Rx, RES1); ctx.lineTo(Rx, T); ctx.lineTo(L, T); ctx.lineTo(L, BAT1);
    ctx.stroke(); ctx.restore();

    // resistor zigzag, glowing with heat
    const heat = Math.min(1, P / 40);
    if (heat > 0.01) {
      const g = ctx.createRadialGradient(Rx, (RES1 + RES2) / 2, 4, Rx, (RES1 + RES2) / 2, 70);
      g.addColorStop(0, `rgba(240, 120, 40, ${0.5 * heat})`); g.addColorStop(1, 'rgba(240, 120, 40, 0)');
      ctx.save(); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(Rx, (RES1 + RES2) / 2, 70, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    ctx.save(); ctx.strokeStyle = heat > 0.3 ? C.warm : C.ink; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(Rx, RES2);
    const zig = 8, step = (RES2 - RES1) / zig;
    for (let i = 0; i < zig; i++) ctx.lineTo(Rx + (i % 2 ? -11 : 11), RES2 - step * (i + 0.5));
    ctx.lineTo(Rx, RES1); ctx.stroke(); ctx.restore();
    K.text(ctx, `R = ${R} Ω`, Rx + 20, (RES1 + RES2) / 2, { mono: true, size: 12, weight: 500 });

    // battery (+ long plate on top)
    ctx.save(); ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(L - 18, BAT1 + 10); ctx.lineTo(L + 18, BAT1 + 10);
    ctx.moveTo(L, BAT1); ctx.lineTo(L, BAT1 + 10); ctx.moveTo(L, BAT2 - 10); ctx.lineTo(L, BAT2); ctx.stroke();
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(L - 9, BAT2 - 10); ctx.lineTo(L + 9, BAT2 - 10); ctx.stroke();
    ctx.restore();
    K.text(ctx, '+', L - 26, BAT1 + 8, { size: 15, color: C.pos, align: 'center' });
    K.text(ctx, '−', L - 26, BAT2 - 8, { size: 15, color: C.neg, align: 'center' });
    K.text(ctx, `V = ${V.toFixed(1)} V`, L + 24, (BAT1 + BAT2) / 2, { mono: true, size: 12, weight: 500 });

    // electrons (skip the bit inside the battery)
    for (let i = 0; i < N; i++) {
      const s = (offset + (i * total) / N) % total;
      const [x, y] = at(s);
      K.particle(ctx, x, y, 4, 'neg');
    }
    K.text(ctx, `I = ${I.toFixed(2)} A`, (L + Rx) / 2, T - 18, { mono: true, size: 12, weight: 500, align: 'center' });
    if (I > 0) K.arrow(ctx, 140, B + 16, 230, B + 16, C.neg, 1.6, 7);
    K.text(ctx, 'electrons', 238, B + 16, { mono: true, size: 9.5, color: C.neg });

    // I–V graph
    const gx = 420, gy = 40, gw = 190, gh = 200, VMAX = 12, IMAX = 6;
    const X = v => gx + (v / VMAX) * gw, Y = i => gy + gh - (i / IMAX) * gh;
    ctx.save(); ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
    for (let v = 3; v <= 12; v += 3) { ctx.beginPath(); ctx.moveTo(X(v), gy); ctx.lineTo(X(v), gy + gh); ctx.stroke(); }
    for (let i = 2; i <= 6; i += 2) { ctx.beginPath(); ctx.moveTo(gx, Y(i)); ctx.lineTo(gx + gw, Y(i)); ctx.stroke(); }
    ctx.strokeStyle = C.muted; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.stroke();
    // line I = V/R
    const vEnd = Math.min(VMAX, IMAX * R);
    ctx.strokeStyle = C.accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(vEnd), Y(vEnd / R)); ctx.stroke();
    ctx.restore();
    [0, 3, 6, 9, 12].forEach(v => K.text(ctx, String(v), X(v), gy + gh + 12, { mono: true, size: 9.5, color: C.muted, align: 'center' }));
    [0, 2, 4, 6].forEach(i => K.text(ctx, String(i), gx - 8, Y(i), { mono: true, size: 9.5, color: C.muted, align: 'right' }));
    K.text(ctx, 'V (volts)', gx + gw, gy + gh + 28, { mono: true, size: 10, color: C.muted, align: 'right' });
    K.text(ctx, 'I (amps)', gx, gy - 14, { mono: true, size: 10, color: C.muted });
    K.text(ctx, `slope = 1/R = ${(1 / R).toFixed(3)}`, gx + gw, gy - 14, { mono: true, size: 10, color: C.accent, align: 'right' });
    // guide lines + point
    K.dashedLine(ctx, X(V), Y(I), X(V), gy + gh, C.faint, [2, 3]);
    K.dashedLine(ctx, gx, Y(I), X(V), Y(I), C.faint, [2, 3]);
    ctx.save(); ctx.fillStyle = C.pos; ctx.beginPath(); ctx.arc(X(V), Y(I), 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();

    fig.readout(`I = V / R = ${V.toFixed(1)} / ${R} = <b>${I.toFixed(2)} A</b> · heat in resistor: ${P.toFixed(1)} J/s`);
  };
});
