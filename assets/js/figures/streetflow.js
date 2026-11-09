/* Grid Ch2 fig: power flow along a street through the day. At sunny midday rooftop solar pushes power back UP to the substation. */
FigKit.register('streetflow', fig => {
  const K = FigKit, C = K.C, { ctx } = fig;
  const hour = K.slider(fig, { label: 'Time of day', min: 0, max: 23.5, step: 0.5, value: 13, format: h => `${String(Math.floor(h)).padStart(2, '0')}:${h % 1 ? '30' : '00'}` });
  const sunny = K.segmented(fig, { label: 'Weather', value: 'sun', options: [{ value: 'sun', label: 'Sunny' }, { value: 'cloud', label: 'Cloudy' }] });
  const HOUSES = [150, 230, 310, 390, 470, 550];
  const SOLAR = [true, false, true, true, false, true];
  const Y = 176;
  let offset = 0;

  // street demand (kW, whole street): low overnight, morning bump, big evening peak
  const demandAt = h => 40 + 50 * Math.exp(-((h - 7.5) ** 2) / 2) + 110 * Math.exp(-((h - 18.5) ** 2) / 3);
  const solarAt = (h, sun) => Math.max(0, Math.sin(((h - 6) / 14) * Math.PI)) * (sun ? 230 : 60) * (h > 6 && h < 20 ? 1 : 0);

  fig.frame = dt => {
    const h = hour.value, sun = sunny.value === 'sun';
    const D = demandAt(h), S = solarAt(h, sun), net = D - S;   // + = flows down to homes, − = flows back up
    offset += dt * K.clamp(Math.abs(net), 10, 220) * 0.4;

    // sky
    const day = Math.max(0, Math.sin(((h - 6) / 14) * Math.PI));
    ctx.save(); ctx.fillStyle = C.accent; ctx.globalAlpha = 0.06 + 0.1 * day; ctx.fillRect(0, 0, fig.W, 120); ctx.restore();
    if (day > 0.02) {
      const sx = 60 + ((h - 6) / 14) * 520, sy = 100 - day * 70;
      ctx.save(); ctx.fillStyle = sun ? C.warm : C.faint; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(sx, sy, 13, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    } else {
      K.text(ctx, 'night', 590, 30, { italic: true, size: 13, color: C.muted, align: 'right' });
    }

    // substation
    ctx.save(); ctx.fillStyle = C.good; ctx.globalAlpha = 0.85; ctx.fillRect(30, Y - 40, 56, 40); ctx.restore();
    K.text(ctx, 'street', 58, Y - 26, { mono: true, size: 9, color: '#fff', align: 'center' });
    K.text(ctx, 'substation', 58, Y - 14, { mono: true, size: 9, color: '#fff', align: 'center' });
    // cable
    ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(86, Y - 6); ctx.lineTo(600, Y - 6); ctx.stroke(); ctx.restore();
    // houses
    HOUSES.forEach((x, i) => {
      ctx.save(); ctx.fillStyle = C.paper; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(x - 22, Y - 6); ctx.lineTo(x - 22, Y - 40); ctx.lineTo(x, Y - 60); ctx.lineTo(x + 22, Y - 40); ctx.lineTo(x + 22, Y - 6); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (SOLAR[i]) { ctx.fillStyle = C.neg; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.moveTo(x + 2, Y - 57); ctx.lineTo(x + 20, Y - 43); ctx.lineTo(x + 16, Y - 39); ctx.lineTo(x - 2, Y - 53); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    });
    // flow dots + arrow
    const dir = net >= 0 ? 1 : -1;
    for (let x = 90 + ((offset * dir) % 34 + 34) % 34; x < 598; x += 34) K.particle(ctx, x, Y - 6, 3.2, 'neg', 0.9);
    const ax1 = dir > 0 ? 250 : 430, ax2 = dir > 0 ? 430 : 250;
    K.arrow(ctx, ax1, Y + 26, ax2, Y + 26, dir > 0 ? C.accent : C.pos, 2.6, 10);
    K.text(ctx, dir > 0 ? 'power flows DOWN to homes' : 'REVERSE power flow: back UP to the substation', 340, Y + 48, { mono: true, size: 11, weight: 500, align: 'center', color: dir > 0 ? C.accent : C.pos });

    fig.readout(`street demand <b>${Math.round(D)} kW</b> · rooftop solar <b>${Math.round(S)} kW</b> · net ${net >= 0 ? 'flowing down' : 'flowing back up'}: <b>${Math.round(Math.abs(net))} kW</b>`);
  };
});
