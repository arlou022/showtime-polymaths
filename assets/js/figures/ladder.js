/* Grid Ch2 fig: the voltage ladder, from the grid supply point down to a house. */
FigKit.register('ladder', fig => {
  const K = FigKit, C = K.C, { ctx } = fig;
  const steps = [
    { v: 400000, label: '400 / 275 kV', name: 'Pylons', feeds: 'The transmission network: long-distance pylons across the country.', count: 'one national network' },
    { v: 132000, label: '132 kV', name: 'Grid supply point', feeds: 'Hands power over from the transmission company to your local DNO.', count: 'a few hundred in Britain' },
    { v: 33000, label: '33 kV', name: 'Bulk supply point', feeds: 'Feeds a city or a large rural area. Big solar farms can connect here.', count: '' },
    { v: 11000, label: '11 kV', name: 'Primary substation', feeds: 'Feeds a town or a few neighbourhoods. Factories and smaller solar farms connect here.', count: 'several thousand' },
    { v: 400, label: '400 V', name: 'Secondary substation', feeds: 'The green box or pole drum feeding your street, about a hundred homes.', count: 'hundreds of thousands' },
    { v: 230, label: '230 V', name: 'Your home', feeds: 'One phase of the 400 V street supply.', count: 'around 30 million homes' }
  ];
  const X0 = 40, STEP_W = 96, TOP = 46, BOT = 214;
  const yOf = v => TOP + (1 - (Math.log10(v) - 2.2) / (5.7 - 2.2)) * (BOT - TOP);
  let active = 1, offset = 0;

  const stepAt = x => K.clamp(Math.floor((x - X0) / STEP_W), 0, steps.length - 1);
  fig.onMove = (x, y) => { if (x > X0 && x < X0 + STEP_W * steps.length && y > 20 && y < 250) active = stepAt(x); };
  fig.onDown = (x, y) => { fig.onMove(x, y); return false; };
  fig.cursorAt = () => 'pointer';

  fig.frame = dt => {
    offset += dt * 30;
    // staircase
    ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.beginPath();
    steps.forEach((s, i) => {
      const x1 = X0 + i * STEP_W, x2 = x1 + STEP_W, y = yOf(s.v);
      i ? ctx.lineTo(x1, y) : ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
    });
    ctx.stroke(); ctx.restore();
    // highlight + labels
    steps.forEach((s, i) => {
      const x1 = X0 + i * STEP_W, y = yOf(s.v), hot = i === active;
      ctx.save(); ctx.fillStyle = C.accent; ctx.globalAlpha = hot ? 0.18 : 0.06;
      ctx.fillRect(x1 + 2, y, STEP_W - 4, BOT + 10 - y); ctx.restore();
      K.text(ctx, s.label, x1 + STEP_W / 2, y - 12, { mono: true, size: 11, weight: 500, align: 'center', color: hot ? C.accent : C.ink });
      const words = s.name.split(' '), half = Math.ceil(words.length / 2);
      const lines = words.length > 1 ? [words.slice(0, half).join(' '), words.slice(half).join(' ')] : [s.name];
      lines.forEach((ln, j) => K.text(ctx, ln, x1 + STEP_W / 2, BOT + 22 + j * 13, { mono: true, size: 9.5, align: 'center', color: hot ? C.accent : C.muted }));
      // transformer symbol at each drop
      if (i > 0) {
        const xs = x1, ym = (yOf(steps[i - 1].v) + y) / 2;
        ctx.save(); ctx.strokeStyle = C.muted; ctx.fillStyle = C.bg; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(xs, ym - 6, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(xs, ym + 6, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
      }
      // charge rolling down the steps
      const span = STEP_W - 20;
      const px = x1 + 10 + ((offset + i * 17) % span);
      K.particle(ctx, px, y - 5, 3, 'neg', 0.8);
    });

    const s = steps[active];
    fig.readout(`<b>${s.name} · ${s.label}</b> · ${s.feeds}${s.count ? ` <span class="ok">(${s.count})</span>` : ''}`);
  };
});
