/* Fig 1.6: copper (free electron sea) vs plastic (bound electrons). */
FigKit.register('materials', fig => {
  const K = FigKit, C = K.C, { ctx } = fig;
  const COLS = 11, ROWS = 5, SP = 48, OX = 80, OY = 66;
  const LEFT = 52, RIGHT = 588, TOP = 40, BOT = 262;
  const atoms = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    atoms.push({ x: OX + c * SP, y: OY + r * SP, ph: Math.random() * 6.28 });
  }
  const electrons = atoms.map(a => ({
    x: K.rand(LEFT, RIGHT), y: K.rand(TOP, BOT), vx: 0, vy: 0, ph: Math.random() * 6.28, home: a
  }));
  electrons.forEach(e => { const ang = Math.random() * 6.28; e.vx = Math.cos(ang) * 90; e.vy = Math.sin(ang) * 90; });

  const material = K.segmented(fig, {
    label: 'Material', value: 'copper',
    options: [{ value: 'copper', label: 'Copper' }, { value: 'plastic', label: 'Plastic' }],
    onChange: v => {
      if (v === 'copper') electrons.forEach(e => { const a = Math.random() * 6.28; e.vx = Math.cos(a) * 90; e.vy = Math.sin(a) * 90; });
      crossings.length = 0;
    }
  });
  const power = K.segmented(fig, {
    label: 'Battery', value: 'off',
    options: [{ value: 'off', label: 'Off' }, { value: 'on', label: 'Connected' }],
    onChange: () => { crossings.length = 0; }
  });
  const crossings = [];

  fig.frame = (dt, t) => {
    const copper = material.value === 'copper';
    const on = power.value === 'on';

    // battery plates
    const plate = (x, sign, col) => {
      ctx.save(); ctx.fillStyle = on ? col : C.faint; ctx.globalAlpha = on ? 0.85 : 0.5;
      ctx.fillRect(x - 3, TOP - 6, 6, BOT - TOP + 12); ctx.restore();
      K.text(ctx, sign, x, TOP - 18, { size: 16, color: on ? col : C.faint, align: 'center' });
    };
    plate(LEFT - 16, '+', C.pos);
    plate(RIGHT + 16, '−', C.neg);
    K.text(ctx, on ? 'battery connected' : 'battery off', 320, 286, { mono: true, size: 10, color: on ? C.ink : C.muted, align: 'center' });

    // ions
    atoms.forEach(a => {
      const jx = Math.sin(t * 9 + a.ph) * 1.2, jy = Math.cos(t * 8 + a.ph * 1.3) * 1.2;
      K.particle(ctx, a.x + jx, a.y + jy, copper ? 10 : 8, copper ? 'pos' : 'neutral', copper ? 0.55 : 0.7);
    });

    // electrons
    const k = K.ease(dt, 4);
    electrons.forEach(e => {
      if (copper) {
        if (Math.random() < dt * 3) { const a = Math.random() * 6.28; e.vx = Math.cos(a) * 90; e.vy = Math.sin(a) * 90; }
        const drift = on ? -55 : 0;           // electrons drift toward + (left)
        e.x += (e.vx + drift) * dt; e.y += e.vy * dt;
        if (e.y < TOP) { e.y = TOP; e.vy = Math.abs(e.vy); }
        if (e.y > BOT) { e.y = BOT; e.vy = -Math.abs(e.vy); }
        if (e.x < LEFT) { e.x += RIGHT - LEFT; if (on) crossings.push({ t, s: 1 }); }
        if (e.x > RIGHT) { e.x -= RIGHT - LEFT; if (on) crossings.push({ t, s: -1 }); }
      } else {
        // bound: circle its own atom, leaning toward + when the battery is on
        const lean = on ? -5 : 0;
        const tx = e.home.x + lean + Math.cos(t * 5 + e.ph) * 13;
        const ty = e.home.y + Math.sin(t * 5 + e.ph) * 13;
        e.x = K.lerp(e.x, tx, k); e.y = K.lerp(e.y, ty, k);
      }
      K.particle(ctx, e.x, e.y, 4.5, 'neg');
    });
    if (!copper) atoms.forEach(a => {
      ctx.save(); ctx.strokeStyle = C.faint; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.arc(a.x + (on ? -5 : 0), a.y, 13, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    });

    // drift arrow
    if (on && copper) {
      K.arrow(ctx, 380, 22, 260, 22, C.neg, 2, 8);
      K.text(ctx, 'electron drift', 390, 22, { mono: true, size: 10, color: C.neg });
    }

    while (crossings.length && t - crossings[0].t > 2) crossings.shift();
    const rate = Math.max(0, crossings.reduce((n, c) => n + c.s, 0) / 2);
    let msg;
    if (copper) msg = on ? `<b class="ok">current flowing</b> · ${rate.toFixed(1)} electrons/s net flow to the + side` : 'free electrons wander at random · <b>no net flow</b>';
    else msg = on ? 'electrons lean but stay bound · <b>no current</b>' : 'every electron bound to its atom';
    fig.readout(`${copper ? 'Copper: conductor' : 'Plastic: insulator'} · ${msg}`);
  };
});
