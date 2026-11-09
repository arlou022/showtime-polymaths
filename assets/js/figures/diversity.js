/* Grid Ch2 fig: diversity. One home spikes to ~12 kW; averaged over many homes, the evening peak per house falls to ~1–2 kW. */
FigKit.register('diversity', fig => {
  const K = FigKit, C = K.C, { ctx } = fig;
  const MAX_HOMES = 200, MINS = 300;            // 17:00 to 22:00, one value per minute
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const gauss = (m, s) => m + s * Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());

  // Build each home's evening: base load, lights/TV, a cooked meal, two kettles, maybe a shower.
  const homes = [];
  for (let h = 0; h < MAX_HOMES; h++) {
    const d = new Float32Array(MINS).fill(0.25);
    const add = (start, len, kw) => { for (let m = Math.max(0, Math.round(start)); m < Math.min(MINS, Math.round(start + len)); m++) d[m] += kw; };
    add(gauss(60, 40), 200, 0.3);                       // lights + TV
    if (rnd() < 0.75) add(gauss(70, 30), 40, 2.5);      // oven / hob
    add(gauss(40, 45), 3, 3); add(gauss(160, 50), 3, 3); // two kettles
    if (rnd() < 0.3) add(gauss(150, 70), 9, 9);         // electric shower
    homes.push(d);
  }
  // make sure the example home has the classic clash: a shower and a kettle while the oven is on
  { const d = homes[0]; for (let m = 95; m < 104; m++) d[m] += 9; for (let m = 98; m < 101; m++) d[m] += 3; }
  const avg = n => { const a = new Float32Array(MINS); for (let i = 0; i < n; i++) for (let m = 0; m < MINS; m++) a[m] += homes[i][m] / n; return a; };

  const count = K.slider(fig, { label: 'Homes', min: 1, max: MAX_HOMES, step: 1, value: 1, format: v => `${v}` });
  K.button(fig, '1 home', () => count.set(1));
  K.button(fig, '100 homes', () => count.set(100));
  let cacheN = -1, cache = null, peak = 0;

  const X0 = 52, X1 = 610, Y0 = 20, Y1 = 214, KMAX = 18;
  const xOf = m => X0 + (m / MINS) * (X1 - X0), yOf = kw => Y1 - (kw / KMAX) * (Y1 - Y0);

  fig.frame = () => {
    const n = count.value;
    if (n !== cacheN) { cache = avg(n); cacheN = n; peak = Math.max(...cache); }

    ctx.save(); ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
    [2, 4, 6, 8, 10, 12, 14, 16].forEach(k => { ctx.beginPath(); ctx.moveTo(X0, yOf(k)); ctx.lineTo(X1, yOf(k)); ctx.stroke(); });
    ctx.strokeStyle = C.faint; ctx.beginPath(); ctx.moveTo(X0, Y0); ctx.lineTo(X0, Y1); ctx.lineTo(X1, Y1); ctx.stroke(); ctx.restore();
    [0, 4, 8, 12, 16].forEach(k => K.text(ctx, `${k}`, X0 - 8, yOf(k), { mono: true, size: 9.5, color: C.muted, align: 'right' }));
    K.text(ctx, 'kW per house', X0 + 6, Y0 - 8, { mono: true, size: 9.5, color: C.muted });
    ['17:00', '18:00', '19:00', '20:00', '21:00', '22:00'].forEach((t, i) => K.text(ctx, t, xOf(i * 60), Y1 + 12, { mono: true, size: 9.5, color: C.muted, align: 'center' }));

    // one home, faint, for comparison
    ctx.save(); ctx.strokeStyle = C.faint; ctx.lineWidth = 1; ctx.beginPath();
    homes[0].forEach((v, m) => (m ? ctx.lineTo(xOf(m), yOf(v)) : ctx.moveTo(xOf(m), yOf(v)))); ctx.stroke(); ctx.restore();
    // the average per house
    ctx.save(); ctx.strokeStyle = C.accent; ctx.lineWidth = 2.4; ctx.beginPath();
    cache.forEach((v, m) => (m ? ctx.lineTo(xOf(m), yOf(v)) : ctx.moveTo(xOf(m), yOf(v)))); ctx.stroke(); ctx.restore();
    K.dashedLine(ctx, X0, yOf(peak), X1, yOf(peak), C.pos, [5, 4], 1.4);
    K.text(ctx, `peak per house: ${peak.toFixed(1)} kW`, X1, yOf(peak) - 10, { mono: true, size: 11, weight: 500, color: C.pos, align: 'right' });

    fig.readout(n === 1
      ? 'one home on its own spikes to <b>' + peak.toFixed(1) + ' kW</b> when the shower, oven and kettle overlap (grey line)'
      : `averaged over <b>${n} homes</b>, the evening peak is <b>${peak.toFixed(1)} kW per house</b>: the spikes rarely line up`);
  };
});
