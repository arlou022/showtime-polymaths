/* Grid fig: the journey from power station to plug, with the voltage at each stage. */
FigKit.register('journey', fig => {
  const K = FigKit, C = K.C, { ctx } = fig;
  const Y = 104;
  const nodes = [
    { x: 46,  kind: 'gen',  name: 'Power station', text: 'The generator makes electricity at about 20,000 V. Higher and its tightly packed coils would fail; lower and the current would be enormous.' },
    { x: 150, kind: 'tx',   name: 'Step-up transformer', text: 'Right next to the generator, a transformer steps 20,000 V up to 400,000 V for the long journey.' },
    { x: 382, kind: 'tx',   name: 'Substation', text: 'Near towns, substations step 400,000 V back down to 132,000, 33,000 and then 11,000 V for local networks.' },
    { x: 508, kind: 'tx',   name: 'Local transformer', text: 'The green box at the end of your street (or a pole-top transformer) brings 11,000 V down to 230 V.' },
    { x: 598, kind: 'home', name: 'Your home', text: '230 V at the socket: low enough to be safe(ish) to have in every room.' }
  ];
  const segs = [
    { a: 0, b: 1, v: 20000, label: '20 kV' },
    { a: 1, b: 2, v: 400000, label: '400 kV' },
    { a: 2, b: 3, v: 11000, label: '132 → 11 kV' },
    { a: 3, b: 4, v: 230, label: '230 V' }
  ];
  let active = -1, offset = 0;

  const nodeAt = (x, y) => nodes.findIndex(n => Math.abs(n.x - x) < 30 && Math.abs(Y - y) < 38);
  fig.onMove = (x, y) => { const i = nodeAt(x, y); if (i >= 0) active = i; };
  fig.onDown = (x, y) => { const i = nodeAt(x, y); if (i >= 0) active = i; return false; };
  fig.cursorAt = (x, y) => (nodeAt(x, y) >= 0 ? 'pointer' : 'default');

  function icon(n, hot) {
    const col = hot ? C.accent : C.ink;
    ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = C.paper; ctx.lineWidth = hot ? 2.2 : 1.6;
    if (n.kind === 'gen') {
      ctx.beginPath(); ctx.arc(n.x, Y, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      for (let k = 0; k <= 20; k++) { const xx = n.x - 10 + k; const yy = Y - Math.sin(k / 20 * Math.PI * 2) * 6; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
      ctx.stroke();
    } else if (n.kind === 'tx') {
      ctx.beginPath(); ctx.arc(n.x - 7, Y, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(n.x + 7, Y, 13, 0, Math.PI * 2); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(n.x - 17, Y + 16); ctx.lineTo(n.x - 17, Y - 4); ctx.lineTo(n.x, Y - 20); ctx.lineTo(n.x + 17, Y - 4); ctx.lineTo(n.x + 17, Y + 16); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeRect(n.x - 5, Y + 4, 10, 12);
    }
    ctx.restore();
  }

  fig.frame = dt => {
    offset += dt * 40;
    // wires
    segs.forEach(s => {
      const x1 = nodes[s.a].x + 22, x2 = nodes[s.b].x - 22;
      const thick = 1 + Math.log10(s.v) * 0.7;
      ctx.save(); ctx.strokeStyle = C.muted; ctx.lineWidth = thick; ctx.beginPath(); ctx.moveTo(x1, Y); ctx.lineTo(x2, Y); ctx.stroke(); ctx.restore();
      for (let x = x1 + ((offset % 26) + 26) % 26; x < x2; x += 26) K.particle(ctx, x, Y, 3, 'neg', 0.85);
      K.text(ctx, s.label, (x1 + x2) / 2, Y - 30, { mono: true, size: 11, weight: 500, align: 'center', color: s.v >= 400000 ? C.accent : C.ink });
    });
    // pylons along the 400 kV line
    for (let px = 238; px <= 300; px += 62) {
      ctx.save(); ctx.strokeStyle = C.faint; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(px - 7, Y + 24); ctx.lineTo(px, Y - 12); ctx.lineTo(px + 7, Y + 24); ctx.moveTo(px - 10, Y - 3); ctx.lineTo(px + 10, Y - 3); ctx.stroke(); ctx.restore();
    }
    nodes.forEach((n, i) => {
      icon(n, i === active);
      K.text(ctx, n.name, n.x, Y + 34, { mono: true, size: 9.5, color: i === active ? C.accent : C.muted, align: 'center' });
    });

    // voltage bars (log scale)
    const bx = 60, by = 236, bh = 60;
    K.text(ctx, 'VOLTAGE (log scale)', 30, by - bh - 12, { mono: true, size: 9.5, color: C.muted });
    segs.forEach(s => {
      const x1 = nodes[s.a].x + 22, x2 = nodes[s.b].x - 22, mid = (x1 + x2) / 2;
      const h = ((Math.log10(s.v) - 2) / (5.7 - 2)) * bh;
      ctx.save(); ctx.fillStyle = C.accent; ctx.globalAlpha = 0.25; ctx.fillRect(mid - 18, by - h, 36, h); ctx.restore();
      ctx.save(); ctx.strokeStyle = C.accent; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(mid - 18, by - h); ctx.lineTo(mid + 18, by - h); ctx.stroke(); ctx.restore();
    });
    ctx.save(); ctx.strokeStyle = C.faint; ctx.beginPath(); ctx.moveTo(bx - 30, by); ctx.lineTo(620, by); ctx.stroke(); ctx.restore();

    fig.readout(active >= 0 ? `<b>${nodes[active].name}:</b> ${nodes[active].text}` : 'hover or tap a stage to see what happens there');
  };
});
