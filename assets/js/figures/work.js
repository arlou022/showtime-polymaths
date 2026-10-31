/* Fig 1.3: push a block. Work done = force × distance; friction turns it into heat. */
FigKit.register('work', fig => {
  const K = FigKit, C = K.C, { ctx, H } = fig;
  fig.draggable();
  const SCALE = 100;            // px per metre
  const X0 = 110;               // block's left edge at d = 0
  const FLOOR = 178;
  const BW = 64, BH = 52;
  const DMAX = 4.5;
  let d = 0, auto = false, drag = null, moving = 0;
  const heat = [];              // little rising heat wisps

  const force = K.slider(fig, { label: 'Force', min: 0, max: 20, step: 1, value: 10, format: v => `${v} N` });
  K.button(fig, 'Push', () => { if (d >= DMAX - 0.01) d = 0; auto = true; });
  K.button(fig, 'Reset', () => { d = 0; auto = false; });

  const bx = () => X0 + d * SCALE;
  const onBlock = (x, y) => x > bx() - 10 && x < bx() + BW + 10 && y > FLOOR - BH - 10 && y < FLOOR + 6;
  fig.onDown = (x, y) => {
    if (!onBlock(x, y)) return false;
    auto = false;
    drag = { off: x - bx() };
  };
  fig.onMove = x => {
    if (!drag || !fig.pointer.down) return;
    if (force.value === 0) return;    // no push, no motion
    const nd = K.clamp((x - drag.off - X0) / SCALE, 0, DMAX);
    moving = Math.abs(nd - d) > 0.0005 ? 0.3 : moving;
    d = nd;
  };
  fig.onUp = () => { drag = null; };
  fig.cursorAt = (x, y) => (drag ? 'grabbing' : onBlock(x, y) ? 'grab' : 'default');

  fig.frame = (dt, t) => {
    const F = force.value;
    if (auto) {
      if (F === 0) auto = false;
      else { d = Math.min(DMAX, d + dt * 1.2); moving = 0.3; if (d >= DMAX) auto = false; }
    }
    moving = Math.max(0, moving - dt);
    const W = F * d;

    // energy meter (top)
    const maxW = 20 * DMAX;
    K.text(ctx, 'ENERGY TRANSFERRED', 70, 26, { mono: true, size: 10, color: C.muted });
    K.meter(ctx, 70, 38, 440, 12, W / maxW, C.accent, null, `${W.toFixed(1)} J`);

    // ruler
    ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(30, FLOOR); ctx.lineTo(620, FLOOR); ctx.stroke();
    ctx.strokeStyle = C.faint; ctx.lineWidth = 1;
    for (let x = 34; x < 620; x += 10) { ctx.beginPath(); ctx.moveTo(x, FLOOR + 1); ctx.lineTo(x - 6, FLOOR + 8); ctx.stroke(); }
    ctx.restore();
    for (let m = 0; m <= 4; m++) {
      const x = X0 + m * SCALE;
      ctx.save(); ctx.strokeStyle = C.muted; ctx.beginPath(); ctx.moveTo(x, FLOOR + 12); ctx.lineTo(x, FLOOR + 20); ctx.stroke(); ctx.restore();
      K.text(ctx, `${m} m`, x, FLOOR + 32, { mono: true, size: 10, color: C.muted, align: 'center' });
    }
    // distance bracket
    if (d > 0.02) {
      const y = FLOOR + 48;
      K.arrow(ctx, X0, y, X0 + d * SCALE, y, C.accent, 1.5, 7);
      K.text(ctx, `d = ${d.toFixed(2)} m`, X0 + (d * SCALE) / 2, y + 13, { mono: true, size: 10.5, color: C.accent, align: 'center' });
    }

    // heat wisps from friction
    if (moving > 0 && F > 0 && Math.random() < 0.5) heat.push({ x: bx() + K.rand(4, BW - 4), y: FLOOR - 2, life: 1 });
    for (let i = heat.length - 1; i >= 0; i--) {
      const h = heat[i];
      h.life -= dt * 1.1; h.y -= dt * 22;
      if (h.life <= 0) { heat.splice(i, 1); continue; }
      ctx.save(); ctx.strokeStyle = C.warm; ctx.globalAlpha = h.life * 0.7; ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let k = 0; k <= 8; k++) { const yy = h.y - k * 2.2; const xx = h.x + Math.sin(k * 0.9 + t * 6) * 2.5; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
      ctx.stroke(); ctx.restore();
    }

    // block
    const x = bx();
    ctx.save(); ctx.fillStyle = C.paper; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.4;
    ctx.fillRect(x, FLOOR - BH, BW, BH); ctx.strokeRect(x, FLOOR - BH, BW, BH);
    ctx.strokeStyle = C.grid; ctx.beginPath(); ctx.moveTo(x + 6, FLOOR - BH + 6); ctx.lineTo(x + BW - 6, FLOOR - 6); ctx.stroke(); ctx.restore();
    K.text(ctx, 'box', x + BW / 2, FLOOR - BH / 2, { italic: true, size: 13, color: C.muted, align: 'center' });

    // force arrow
    if (F > 0) {
      const len = 16 + F * 3.2;
      K.arrow(ctx, x - 6 - len, FLOOR - BH / 2, x - 4, FLOOR - BH / 2, C.pos, 2.6, 10);
      K.text(ctx, `F = ${F} N`, x - 6 - len / 2, FLOOR - BH / 2 - 16, { mono: true, size: 10.5, color: C.pos, align: 'center' });
    } else {
      K.text(ctx, 'no force, no motion', x + BW + 14, FLOOR - BH / 2, { italic: true, size: 13, color: C.muted });
    }

    fig.readout(`W = F × d = ${F} N × ${d.toFixed(2)} m = <b>${W.toFixed(1)} J</b>`);
  };
});
