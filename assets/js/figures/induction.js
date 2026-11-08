/* Grid fig: Faraday's 1831 experiment. Move a magnet in and out of a coil; only a CHANGING field makes a current. */
FigKit.register('induction', fig => {
  const K = FigKit, C = K.C, { ctx } = fig;
  fig.draggable();
  const CY = 150, COIL_X = 400, COIL_W = 130, COIL_R = 40;
  const MAG_W = 120, MAG_H = 30;
  let mx = 150;               // magnet centre x
  let drag = null, auto = false, autoT = 0;
  let flux = 0, emf = 0, needle = 0;

  const fluxAt = x => {       // flux through the coil from the magnet's north pole
    const pole = x + MAG_W / 2;
    const d = (pole - COIL_X) / 70;
    return 1 / (1 + d * d);
  };
  flux = fluxAt(mx);

  const onMagnet = (x, y) => Math.abs(x - mx) < MAG_W / 2 + 6 && Math.abs(y - CY) < MAG_H / 2 + 8;
  fig.onDown = (x, y) => { if (!onMagnet(x, y)) return false; auto = false; drag = x - mx; };
  fig.onMove = x => { if (drag === null || !fig.pointer.down) return; mx = K.clamp(x - drag, 70, COIL_X + 40); };
  fig.onUp = () => { drag = null; };
  fig.cursorAt = (x, y) => (drag !== null ? 'grabbing' : onMagnet(x, y) ? 'grab' : 'default');

  K.button(fig, 'Push in and out', () => { auto = true; autoT = 0; });
  K.button(fig, 'Stop (hold still)', () => { auto = false; });

  fig.frame = (dt, t) => {
    if (auto) { autoT += dt; mx = 230 + Math.sin(autoT * 3) * 130; }
    const f = fluxAt(mx);
    const raw = dt > 0 ? -(f - flux) / dt : 0;      // induced voltage = minus the rate of change of flux
    flux = f;
    emf = K.lerp(emf, K.clamp(raw / 4, -1, 1), K.ease(dt, 18));
    needle = K.lerp(needle, emf, K.ease(dt, 10));

    // coil: back halves, magnet, front halves
    const turns = 9, x0 = COIL_X - COIL_W / 2, step = COIL_W / (turns - 1);
    ctx.save(); ctx.strokeStyle = C.warm; ctx.lineWidth = 2.2; ctx.globalAlpha = 0.45;
    for (let i = 0; i < turns; i++) { ctx.beginPath(); ctx.ellipse(x0 + i * step, CY, 10, COIL_R, 0, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke(); }
    ctx.restore();

    // magnet
    const left = mx - MAG_W / 2;
    ctx.save();
    ctx.fillStyle = C.neg; K.roundRect(ctx, left, CY - MAG_H / 2, MAG_W / 2, MAG_H, 3); ctx.fill();
    ctx.fillStyle = C.pos; K.roundRect(ctx, mx, CY - MAG_H / 2, MAG_W / 2, MAG_H, 3); ctx.fill();
    ctx.restore();
    K.text(ctx, 'S', left + 14, CY, { size: 15, weight: 700, color: '#fff', align: 'center' });
    K.text(ctx, 'N', mx + MAG_W / 2 - 14, CY, { size: 15, weight: 700, color: '#fff', align: 'center' });

    ctx.save(); ctx.strokeStyle = C.warm; ctx.lineWidth = 2.2;
    for (let i = 0; i < turns; i++) { ctx.beginPath(); ctx.ellipse(x0 + i * step, CY, 10, COIL_R, 0, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke(); }
    ctx.restore();
    K.text(ctx, 'coil of wire', COIL_X, CY + COIL_R + 18, { mono: true, size: 10, color: C.muted, align: 'center' });

    // wires to the meter
    const GX = 560, GY = 70;
    ctx.save(); ctx.strokeStyle = C.muted; ctx.lineWidth = 1.4; ctx.beginPath();
    ctx.moveTo(x0, CY - COIL_R); ctx.lineTo(x0, 22); ctx.lineTo(GX - 30, 22); ctx.lineTo(GX - 30, GY);
    ctx.moveTo(x0 + COIL_W, CY - COIL_R); ctx.lineTo(x0 + COIL_W, 40); ctx.lineTo(GX + 30, 40); ctx.lineTo(GX + 30, GY);
    ctx.stroke(); ctx.restore();

    // meter (galvanometer)
    ctx.save(); ctx.fillStyle = C.paper; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(GX, GY + 30, 48, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    for (let k = -4; k <= 4; k++) { const a = -Math.PI / 2 + k * 0.28; ctx.beginPath(); ctx.moveTo(GX + Math.cos(a) * 40, GY + 30 + Math.sin(a) * 40); ctx.lineTo(GX + Math.cos(a) * 46, GY + 30 + Math.sin(a) * 46); ctx.stroke(); }
    const a = -Math.PI / 2 + needle * 1.1;
    ctx.strokeStyle = Math.abs(needle) > 0.05 ? C.accent : C.ink; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(GX, GY + 30); ctx.lineTo(GX + Math.cos(a) * 42, GY + 30 + Math.sin(a) * 42); ctx.stroke();
    ctx.restore();
    K.text(ctx, 'current meter', GX, GY + 44, { mono: true, size: 9.5, color: C.muted, align: 'center' });
    K.text(ctx, '0', GX, GY - 26, { mono: true, size: 9.5, color: C.muted, align: 'center' });

    if (drag === null && !auto && Math.abs(needle) < 0.02) {
      K.text(ctx, '← drag the magnet into the coil', 30, 250, { italic: true, size: 13, color: C.muted });
    }
    const moving = Math.abs(raw) > 0.02;
    fig.readout(moving
      ? `field through the coil is <b>changing</b> → current flows (${emf > 0 ? 'one way' : 'the other way'})`
      : 'field steady → <b>no current</b>, even with the magnet inside the coil');
  };
});
