/* Fig 1.5: battery + bulb. Voltage = energy per coulomb; total energy = V × Q. */
FigKit.register('battery', fig => {
  const K = FigKit, C = K.C, { ctx } = fig;
  const E = 1.602e-19;
  const AMOUNTS = [
    { q: E, label: '1 electron' },
    { q: 1000 * E, label: '1,000 electrons' },
    { q: 1e9 * E, label: '1 billion electrons' },
    { q: 1, label: '1 coulomb' },
    { q: 2, label: '2 coulombs' },
    { q: 5, label: '5 coulombs' },
    { q: 10, label: '10 coulombs' }
  ];

  const volts = K.segmented(fig, {
    label: 'Battery', value: 9,
    options: [{ value: 1.5, label: '1.5 V' }, { value: 9, label: '9 V' }, { value: 12, label: '12 V' }]
  });
  const amount = K.slider(fig, { label: 'Charge', min: 0, max: AMOUNTS.length - 1, step: 1, value: 3, format: i => AMOUNTS[i].label });

  // loop path (electron direction: out of − terminal, through bulb, back into +)
  const L = 60, T = 46, Rr = 360, B = 246;
  const BAT_Y1 = 128, BAT_Y2 = 164;            // battery sits in the left wire
  const pts = [[L, BAT_Y2], [L, B], [Rr, B], [Rr, T], [L, T], [L, BAT_Y1]];
  const segs = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
    const len = Math.hypot(x2 - x1, y2 - y1);
    segs.push({ x1, y1, x2, y2, s0: total, len }); total += len;
  }
  const BULB_Y = (T + B) / 2;
  // path position where the bulb is (on the right side, going up)
  const bulbS = segs[1].s0 + segs[1].len + (B - BULB_Y);
  const at = s => {
    s = ((s % total) + total) % total;
    const g = segs.find(q => s >= q.s0 && s <= q.s0 + q.len) || segs[segs.length - 1];
    const f = (s - g.s0) / g.len;
    return [K.lerp(g.x1, g.x2, f), K.lerp(g.y1, g.y2, f)];
  };
  let offset = 0;

  fig.frame = (dt, t) => {
    const V = volts.value, idx = amount.value, Q = AMOUNTS[idx].q;
    const n = 4 + idx * 4;
    offset += dt * 55;

    // wires
    ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    ctx.restore();

    // battery (vertical, + on top)
    ctx.save(); ctx.fillStyle = C.bg; ctx.fillRect(L - 20, BAT_Y1, 40, BAT_Y2 - BAT_Y1); ctx.restore();
    ctx.save(); ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(L - 18, BAT_Y1 + 10); ctx.lineTo(L + 18, BAT_Y1 + 10); ctx.stroke();
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(L - 9, BAT_Y2 - 10); ctx.lineTo(L + 9, BAT_Y2 - 10); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(L, BAT_Y1); ctx.lineTo(L, BAT_Y1 + 10); ctx.moveTo(L, BAT_Y2 - 10); ctx.lineTo(L, BAT_Y2); ctx.stroke();
    ctx.restore();
    K.text(ctx, '+', L - 26, BAT_Y1 + 8, { size: 15, color: C.pos, align: 'center' });
    K.text(ctx, '−', L - 26, BAT_Y2 - 8, { size: 15, color: C.neg, align: 'center' });
    K.text(ctx, `${V} V`, L + 26, (BAT_Y1 + BAT_Y2) / 2, { mono: true, size: 12, weight: 500 });

    // bulb glow (brightness ∝ energy per charge)
    const glow = V / 12;
    const g = ctx.createRadialGradient(Rr, BULB_Y, 4, Rr, BULB_Y, 30 + glow * 40);
    g.addColorStop(0, `rgba(255, 196, 70, ${0.25 + glow * 0.6})`); g.addColorStop(1, 'rgba(255, 196, 70, 0)');
    ctx.save(); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(Rr, BULB_Y, 30 + glow * 40, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.paper; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(Rr, BULB_Y, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(Rr - 11, BULB_Y - 11); ctx.lineTo(Rr + 11, BULB_Y + 11); ctx.moveTo(Rr + 11, BULB_Y - 11); ctx.lineTo(Rr - 11, BULB_Y + 11); ctx.stroke();
    ctx.restore();
    K.text(ctx, 'bulb', Rr + 24, BULB_Y, { mono: true, size: 10, color: C.muted });

    // charges: energised (halo) from battery until they pass the bulb
    for (let i = 0; i < n; i++) {
      const s = (offset + (i * total) / n) % total;
      const [x, y] = at(s);
      const energised = s < bulbS;
      K.particle(ctx, x, y, 4.5, 'neg', 1, energised ? 0.4 + glow : 0);
    }
    K.text(ctx, 'dots are illustrative: more dots = more charge', L, 272, { mono: true, size: 9.5, color: C.faint });

    // energy-per-coulomb ladder (right)
    const lx = 470, ly0 = 236, ly1 = 52, lh = ly0 - ly1;
    K.text(ctx, 'ENERGY PER COULOMB', 430, 30, { mono: true, size: 10, color: C.muted });
    ctx.save(); ctx.strokeStyle = C.muted; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(lx, ly1); ctx.lineTo(lx, ly0); ctx.stroke(); ctx.restore();
    [0, 3, 6, 9, 12].forEach(j => {
      const y = ly0 - (j / 12) * lh;
      K.dashedLine(ctx, lx, y, lx + 120, y, C.grid, [2, 4]);
      K.text(ctx, `${j} J`, lx - 8, y, { mono: true, size: 9.5, color: C.muted, align: 'right' });
    });
    const hy = ly0 - (V / 12) * lh;
    ctx.save(); ctx.fillStyle = C.accent; ctx.globalAlpha = 0.18; ctx.fillRect(lx + 14, hy, 64, ly0 - hy); ctx.restore();
    ctx.save(); ctx.strokeStyle = C.accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx + 14, hy); ctx.lineTo(lx + 78, hy); ctx.stroke(); ctx.restore();
    K.text(ctx, `${V} J/C`, lx + 84, hy, { mono: true, size: 11, color: C.accent, weight: 500 });
    K.text(ctx, 'same for every', lx + 46, ly0 + 14, { italic: true, size: 12, color: C.muted, align: 'center' });
    K.text(ctx, 'coulomb', lx + 46, ly0 + 28, { italic: true, size: 12, color: C.muted, align: 'center' });

    const perE = V * E;
    const Wt = V * Q;
    fig.readout(
      `<div class="ro-grid">` +
      `<span>charge Q</span><span>${AMOUNTS[idx].label}${idx >= 3 ? ` (${K.sci(Q / E)} e⁻)` : ` (${K.sci(Q)} C)`}</span>` +
      `<span>per coulomb</span><span><b>${V} J</b>, the voltage</span>` +
      `<span>per electron</span><span>${K.sci(perE)} J</span>` +
      `<span>total W = VQ</span><span><b>${K.sci(Wt)} J</b></span>` +
      `</div>`
    );
  };
});
