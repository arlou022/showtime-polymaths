/* Fig 1.2: two draggable charges, inverse-square force arrows, 1/r² inset graph. */
FigKit.register('charges', fig => {
  const K = FigKit, C = K.C, { ctx, H } = fig;
  fig.draggable();
  const UNIT = 100;                 // 100 px = 1 distance unit
  const R = 17;
  const AREA = { x0: 30, x1: 430, y0: 34, y1: H - 30 };
  const midY = H / 2 + 4;
  const qs = [{ x: 185, y: midY, q: +1, name: 'A' }, { x: 285, y: midY, q: -1, name: 'B' }];
  let drag = null;

  const place = r => {
    const c = 230;
    qs[0].x = c - (r * UNIT) / 2; qs[1].x = c + (r * UNIT) / 2;
    qs[0].y = qs[1].y = midY;
  };
  K.button(fig, 'r = 1', () => place(1));
  K.button(fig, 'r = 2', () => place(2));
  K.button(fig, 'r = 3', () => place(3));
  K.button(fig, 'Flip A', () => { qs[0].q *= -1; });
  K.button(fig, 'Flip B', () => { qs[1].q *= -1; });

  const hit = (x, y) => qs.find(p => Math.hypot(p.x - x, p.y - y) < R + 8);
  fig.onDown = (x, y) => {
    const p = hit(x, y);
    if (!p) return false;
    drag = { p, sx: x, sy: y, ox: p.x - x, oy: p.y - y, moved: false };
  };
  fig.onMove = (x, y) => {
    if (!drag || !fig.pointer.down) return;
    if (Math.hypot(x - drag.sx, y - drag.sy) > 4) drag.moved = true;
    const p = drag.p, other = qs[0] === p ? qs[1] : qs[0];
    p.x = K.clamp(x + drag.ox, AREA.x0, AREA.x1);
    p.y = K.clamp(y + drag.oy, AREA.y0, AREA.y1);
    const dx = p.x - other.x, dy = p.y - other.y, d = Math.hypot(dx, dy);
    const MIN = 0.4 * UNIT;
    if (d < MIN) {
      const ux = d ? dx / d : 1, uy = d ? dy / d : 0;
      p.x = other.x + ux * MIN; p.y = other.y + uy * MIN;
    }
  };
  fig.onUp = () => {
    if (drag && !drag.moved) drag.p.q *= -1;
    drag = null;
  };
  fig.cursorAt = (x, y) => (drag ? 'grabbing' : hit(x, y) ? 'grab' : 'default');

  fig.frame = () => {
    const [a, b] = qs;
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
    const r = d / UNIT, ux = dx / d, uy = dy / d;
    const rel = 1 / (r * r);
    const repel = a.q * b.q > 0;

    // separation line + label
    K.dashedLine(ctx, a.x, a.y, b.x, b.y, C.faint, [3, 4]);
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    K.text(ctx, `r = ${r.toFixed(2)}`, mx + uy * 16, my - ux * 16 - 2, { mono: true, size: 11, color: C.muted, align: 'center' });

    // force arrows (equal and opposite)
    const len = K.clamp(55 * rel, 5, 140);
    const dir = repel ? -1 : 1; // on A: toward B if attract
    const col = C.ink;
    // arrow on A
    const aSx = a.x + ux * dir * (R + 3), aSy = a.y + uy * dir * (R + 3);
    K.arrow(ctx, aSx, aSy, aSx + ux * dir * len, aSy + uy * dir * len, col, 2.2);
    // arrow on B (opposite)
    const bSx = b.x - ux * dir * (R + 3), bSy = b.y - uy * dir * (R + 3);
    K.arrow(ctx, bSx, bSy, bSx - ux * dir * len, bSy - uy * dir * len, col, 2.2);

    qs.forEach(p => {
      K.particle(ctx, p.x, p.y, R, p.q > 0 ? 'pos' : 'neg');
      K.text(ctx, p.name, p.x, p.y - R - 12, { mono: true, size: 11, color: C.muted, align: 'center' });
    });
    K.text(ctx, repel ? 'like charges → repel' : 'opposite charges → attract', 30, 22, { italic: true, size: 14, color: C.muted });

    // inset 1/r² graph
    const gx = 470, gy = 46, gw = 140, gh = 170;
    const rMax = 4, fMax = 4;
    const X = rr => gx + (rr / rMax) * gw;
    const Y = f => gy + gh - (Math.min(f, fMax) / fMax) * gh;
    ctx.save(); ctx.strokeStyle = C.muted; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.stroke();
    ctx.strokeStyle = C.grid;
    [1, 2, 3].forEach(i => { ctx.beginPath(); ctx.moveTo(X(i), gy); ctx.lineTo(X(i), gy + gh); ctx.stroke(); });
    ctx.strokeStyle = C.accent; ctx.lineWidth = 1.6; ctx.beginPath();
    for (let rr = 0.5; rr <= rMax; rr += 0.02) { const f = 1 / (rr * rr); rr === 0.5 ? ctx.moveTo(X(rr), Y(f)) : ctx.lineTo(X(rr), Y(f)); }
    ctx.stroke(); ctx.restore();
    [1, 2, 3, 4].forEach(i => K.text(ctx, String(i), X(i), gy + gh + 11, { mono: true, size: 9.5, color: C.muted, align: 'center' }));
    K.text(ctx, 'r', gx + gw + 8, gy + gh, { italic: true, size: 13, color: C.muted });
    K.text(ctx, 'F', gx - 10, gy + 4, { italic: true, size: 13, color: C.muted, align: 'center' });
    K.text(ctx, '1', gx - 8, Y(1), { mono: true, size: 9.5, color: C.muted, align: 'right' });
    K.dashedLine(ctx, gx, Y(1), gx + gw, Y(1), C.faint, [2, 3]);
    const pr = Math.min(r, rMax);
    ctx.save(); ctx.fillStyle = C.pos; ctx.beginPath(); ctx.arc(X(pr), Y(1 / (pr * pr)), 4.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    K.text(ctx, 'force vs distance', gx, gy - 14, { mono: true, size: 10, color: C.muted });

    const relStr = rel >= 10 ? rel.toFixed(0) : rel >= 1 ? rel.toFixed(2) : rel.toFixed(3);
    fig.readout(`r = <b>${r.toFixed(2)}</b> units · F = 1/r² = <b>${relStr}×</b> the force at r = 1`);
  };
});
