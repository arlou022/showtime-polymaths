/* Grid Ch3 fig: a year in the life of a substation. Every hour of the year, coloured by how full it is. Add a data centre, firm or flexible. */
FigKit.register('yearstrip', fig => {
  const K = FigKit, C = K.C, { ctx } = fig;
  const LIMIT = 55;                                  // MW the substation can carry
  // synthetic but realistic hourly load (MW): busiest on winter evenings, quietest on summer nights
  let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const load = [];
  for (let d = 0; d < 365; d++) {
    const winter = Math.cos((2 * Math.PI * (d - 15)) / 365);          // +1 mid-January, −1 mid-July
    const weekday = (d % 7) < 5 ? 1 : 0.92;
    const col = [];
    for (let h = 0; h < 24; h++) {
      const evening = Math.exp(-((h - 18) ** 2) / 4.5), morning = Math.exp(-((h - 8) ** 2) / 3), night = Math.exp(-((h - 3) ** 2) / 8);
      const v = (18 + 7 * winter + 18 * evening * (0.75 + 0.35 * winter) + 5 * morning - 7 * night) * weekday + (rnd() - 0.5) * 3;
      col.push(v);
    }
    load.push(col);
  }
  const peak = Math.max(...load.flat());

  const size = K.slider(fig, { label: 'New data centre', min: 0, max: 40, step: 1, value: 20, format: v => `${v} MW` });
  const mode = K.segmented(fig, { label: 'Connection', value: 'flex', options: [{ value: 'firm', label: 'Firm' }, { value: 'flex', label: 'Flexible' }] });

  const X0 = 40, Y0 = 34, CW = 560 / 365, CH = 7;
  let cache = { key: '' };

  fig.frame = () => {
    const S = size.value, flex = mode.value === 'flex';
    const firmOK = peak + S <= LIMIT;
    const showNew = S > 0 && (flex || firmOK);
    const key = `${S}|${flex}`;
    if (cache.key !== key) {
      let hoursOver = 0, lost = 0;
      if (showNew) for (const col of load) for (const v of col) { const over = v + S - LIMIT; if (over > 0) { hoursOver++; lost += Math.min(over, S); } }
      cache = { key, hoursOver, lost };
    }

    for (let d = 0; d < 365; d++) for (let h = 0; h < 24; h++) {
      const v = load[d][h] + (showNew ? S : 0), frac = v / LIMIT;
      ctx.fillStyle = frac > 1 ? C.pos : C.accent;
      ctx.globalAlpha = frac > 1 ? 0.95 : K.clamp((frac - 0.25) * 1.1, 0.05, 0.85);
      ctx.fillRect(X0 + d * CW, Y0 + h * CH, CW + 0.4, CH - 0.6);
    }
    ctx.globalAlpha = 1;
    ['Jan', 'Apr', 'Jul', 'Oct'].forEach((m, i) => K.text(ctx, m, X0 + [0, 90, 181, 273][i] * CW, Y0 + 24 * CH + 12, { mono: true, size: 9.5, color: C.muted }));
    [0, 6, 12, 18].forEach(h => K.text(ctx, `${String(h).padStart(2, '0')}:00`, X0 - 6, Y0 + h * CH + CH / 2, { mono: true, size: 8.5, color: C.muted, align: 'right' }));
    K.text(ctx, 'each column is a day · each row an hour · darker = fuller · red = over the limit', X0, 18, { mono: true, size: 9.5, color: C.muted });

    let msg;
    if (S === 0) msg = 'no new connection: the wires are only near their limit on winter evenings';
    else if (!flex) msg = firmOK
      ? `firm connection: fits even at the busiest hour → <b>connect now</b>`
      : `firm connection: busiest hour would be ${Math.round(peak + S)} MW against a ${LIMIT} MW limit → <b>wait for an upgrade (years)</b>`;
    else {
      const shareH = (cache.hoursOver / 8760) * 100, shareE = (cache.lost / (S * 8760)) * 100;
      msg = cache.hoursOver === 0
        ? 'flexible connection: never turned down → <b>connect now</b>'
        : `flexible connection: <b>connect now</b>, turned down in ${shareH.toFixed(1)}% of hours (losing ${shareE.toFixed(1)}% of its energy), mostly winter evenings`;
    }
    fig.readout(msg);
  };
});
