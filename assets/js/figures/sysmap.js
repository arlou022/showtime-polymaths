/* Grid Ch3 fig: the whole system on one page. Power flows left to right, money flows back right to left, and who runs each part. */
FigKit.register('sysmap', fig => {
  const K = FigKit, C = K.C, { ctx } = fig;
  const Y = 128;
  const chain = [
    { x: 72,  name: 'Generators', who: 'Many companies: wind, gas, nuclear, solar', text: 'Power stations and wind farms make the electricity and sell it into the market.' },
    { x: 238, name: 'Transmission', who: 'National Grid, SP Energy Networks, SSEN Transmission', text: 'The 275 kV and 400 kV pylons. Three companies own them, one per region.' },
    { x: 404, name: 'Distribution', who: 'NGED, UK Power Networks and four others', text: 'The substations and street cables that step power down to 230 V. Six companies, 14 regions.' },
    { x: 570, name: 'Homes and firms', who: 'You', text: 'Where the electricity is used, and where the money starts.' }
  ];
  const above = { x: 321, y: 38, name: 'NESO control room', text: 'Keeps supply and demand balanced every second. Owns no wires.' };
  const below = [
    { x: 154, y: 222, name: 'Suppliers', text: 'Octopus, British Gas and others. They buy electricity and sell it to you.' },
    { x: 321, y: 222, name: 'Elexon', text: 'Checks every half hour who made and used what, and settles the difference.' },
    { x: 488, y: 222, name: 'Ofgem', text: 'The regulator. Sets how much the wire companies can spend and earn.' }
  ];
  const all = [...chain.map(c => ({ ...c, y: Y })), above, ...below];
  const mode = K.segmented(fig, { label: 'Show', value: 'power', options: [{ value: 'power', label: 'Power' }, { value: 'money', label: 'Money' }, { value: 'who', label: 'Who' }] });
  let active = -1, t0 = 0;

  const hit = (x, y) => all.findIndex(b => Math.abs(b.x - x) < 70 && Math.abs(b.y - y) < 22);
  fig.onMove = (x, y) => { const i = hit(x, y); if (i >= 0) active = i; };
  fig.onDown = (x, y) => { fig.onMove(x, y); return false; };
  fig.cursorAt = (x, y) => (hit(x, y) >= 0 ? 'pointer' : 'default');

  function box(b, i, w = 128) {
    const hot = i === active;
    ctx.save(); ctx.fillStyle = C.paper; ctx.strokeStyle = hot ? C.accent : C.faint; ctx.lineWidth = hot ? 2 : 1.2;
    K.roundRect(ctx, b.x - w / 2, b.y - 18, w, 36, 6); ctx.fill(); ctx.stroke(); ctx.restore();
    K.text(ctx, b.name, b.x, b.y, { mono: true, size: 10.5, weight: 500, align: 'center', color: hot ? C.accent : C.ink });
  }
  const coin = (x, y) => { ctx.save(); ctx.fillStyle = C.warm; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill(); ctx.restore(); K.text(ctx, '£', x, y + 0.5, { size: 9, weight: 700, color: '#fff', align: 'center' }); };
  // a dot moving from a to b, phase p (0..1)
  const along = (a, b, p) => [K.lerp(a[0], b[0], p), K.lerp(a[1], b[1], p)];

  fig.frame = dt => {
    t0 += dt;
    const m = mode.value;
    // wires between the chain
    ctx.save(); ctx.strokeStyle = C.muted; ctx.lineWidth = 2;
    for (let i = 0; i < chain.length - 1; i++) { ctx.beginPath(); ctx.moveTo(chain[i].x + 64, Y); ctx.lineTo(chain[i + 1].x - 64, Y); ctx.stroke(); }
    ctx.restore();
    // dashed control links
    K.dashedLine(ctx, above.x, above.y + 18, above.x, Y - 22, C.faint, [3, 4]);
    below.forEach(b => K.dashedLine(ctx, b.x, b.y - 18, b.x, Y + 40, C.faint, [3, 4]));

    if (m === 'power') {
      for (let i = 0; i < chain.length - 1; i++) {
        const a = [chain[i].x + 64, Y], b = [chain[i + 1].x - 64, Y];
        for (let k = 0; k < 3; k++) { const [x, y] = along(a, b, ((t0 * 0.6 + k / 3) % 1)); K.particle(ctx, x, y, 3.5, 'neg', 0.9); }
      }
    } else if (m === 'money') {
      const sup = below[0];
      const paths = [
        [[chain[3].x, Y + 18], [sup.x + 40, sup.y - 18]],                 // you -> supplier
        [[sup.x - 40, sup.y - 18], [chain[0].x, Y + 18]],                 // supplier -> generators (wholesale)
        [[sup.x, sup.y - 18], [chain[1].x, Y + 18]],                      // supplier -> transmission
        [[sup.x + 20, sup.y - 18], [chain[2].x, Y + 18]],                 // supplier -> distribution
        [[sup.x + 10, sup.y - 18], [above.x - 30, above.y + 18]]          // supplier -> NESO (balancing)
      ];
      paths.forEach(([a, b], i) => { const [x, y] = along(a, b, (t0 * 0.45 + i * 0.17) % 1); coin(x, y); });
      K.text(ctx, 'sets budgets →', below[2].x + 72, below[2].y, { mono: true, size: 9.5, color: C.muted });
    }

    chain.forEach((c, i) => box({ ...c, y: Y }, i));
    box(above, chain.length, 160);
    below.forEach((b, i) => box(b, chain.length + 1 + i, 110));
    if (m === 'who') {
      chain.forEach(c => {
        const words = c.who.split(', ');
        words.forEach((w, j) => K.text(ctx, w, c.x, Y + 30 + j * 12, { mono: true, size: 9, align: 'center', color: C.accent }));
      });
    }
    K.text(ctx, m === 'money' ? '← money flows back' : m === 'power' ? 'power flows →' : 'who runs each part', 620, 20, { mono: true, size: 10, align: 'right', color: C.muted });

    const b = all[active];
    fig.readout(b ? `<b>${b.name}:</b> ${b.text}` : 'hover or tap a block');
  };
});
