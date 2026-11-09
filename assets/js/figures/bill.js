/* Grid Ch3 fig: where a typical bill goes, and the growing bill for working around full wires. */
FigKit.register('bill', fig => {
  const K = FigKit, C = K.C, { ctx } = fig;
  const TOTAL = 1723;
  const parts = [
    { name: 'The energy itself (wholesale)', share: 0.48, col: 'accent', text: 'Buying the electricity and gas from generators and producers.' },
    { name: 'The wires and balancing (networks)', share: 0.25, col: 'neg', text: 'Pylons, cables, substations, and NESO keeping it balanced. Includes turning wind down and gas up when the wires are full.' },
    { name: 'Everything else', share: 0.27, col: 'neutral', text: 'Running the supplier, government schemes, VAT and profit margin.' }
  ];
  const view = K.segmented(fig, { label: 'Show', value: 'bill', options: [{ value: 'bill', label: 'Your bill' }, { value: 'balancing', label: 'The balancing bill' }] });
  let active = 1;
  const X0 = 40, X1 = 600, BY = 70, BH = 46;

  const segAt = x => { let acc = X0; for (let i = 0; i < parts.length; i++) { const w = parts[i].share * (X1 - X0); if (x >= acc && x < acc + w) return i; acc += w; } return -1; };
  fig.onMove = (x, y) => { if (view.value === 'bill' && y > BY - 10 && y < BY + BH + 10) { const i = segAt(x); if (i >= 0) active = i; } };
  fig.onDown = (x, y) => { fig.onMove(x, y); return false; };
  fig.cursorAt = (x, y) => (view.value === 'bill' && y > BY && y < BY + BH ? 'pointer' : 'default');

  fig.frame = () => {
    if (view.value === 'bill') {
      K.text(ctx, `A TYPICAL GAS + ELECTRICITY BILL: £${TOTAL.toLocaleString('en-GB')} A YEAR (OCT–DEC 2026 PRICE CAP)`, X0, 34, { mono: true, size: 10, color: C.muted });
      let x = X0;
      parts.forEach((p, i) => {
        const w = p.share * (X1 - X0), hot = i === active;
        ctx.save(); ctx.fillStyle = C[p.col]; ctx.globalAlpha = hot ? 0.95 : 0.55; ctx.fillRect(x, BY, w - 2, BH); ctx.restore();
        K.text(ctx, `${Math.round(p.share * 100)}%`, x + w / 2, BY + BH / 2, { mono: true, size: 13, weight: 500, align: 'center', color: '#fff' });
        K.text(ctx, `£${Math.round(p.share * TOTAL).toLocaleString('en-GB')}`, x + w / 2, BY + BH + 16, { mono: true, size: 10.5, align: 'center', color: hot ? C.ink : C.muted });
        x += w;
      });
      const p = parts[active];
      K.text(ctx, p.name, X0, 170, { size: 16, weight: 600 });
      // wrap the description to the figure width
      ctx.save(); ctx.font = `400 13.5px ${K.SERIF}`;
      const words = p.text.split(' '); let line = '', ly = 196;
      words.forEach(w => { const test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > X1 - X0 && line) { K.text(ctx, line, X0, ly, { size: 13.5, color: C.muted }); line = w; ly += 19; } else line = test; });
      ctx.restore(); K.text(ctx, line, X0, ly, { size: 13.5, color: C.muted });
      fig.readout(`hover a segment · <b>${p.name}</b>: about £${Math.round(p.share * TOTAL).toLocaleString('en-GB')} a year`);
    } else {
      K.text(ctx, 'COST OF BALANCING THE SYSTEM, £ BILLION A YEAR', X0, 34, { mono: true, size: 10, color: C.muted });
      const scale = 60;                          // px per £bn
      const rows = [
        { label: '2025/26: all balancing costs (actual)', lo: 3.1, hi: 3.1 },
        { label: '2030: full-wire (constraint) costs alone, forecasts', lo: 4, hi: 7.4 }
      ];
      rows.forEach((r, i) => {
        const y = 66 + i * 70;
        K.text(ctx, r.label, X0, y - 10, { mono: true, size: 10.5 });
        ctx.save(); ctx.fillStyle = C.pos; ctx.globalAlpha = 0.85; ctx.fillRect(X0, y, r.lo * scale, 30);
        if (r.hi > r.lo) { ctx.globalAlpha = 0.3; ctx.fillRect(X0 + r.lo * scale, y, (r.hi - r.lo) * scale, 30); }
        ctx.restore();
        K.text(ctx, r.hi > r.lo ? `£${r.lo}–${r.hi}bn+` : `£${r.lo}bn`, X0 + r.hi * scale + 10, y + 15, { mono: true, size: 12, weight: 500 });
      });
      K.text(ctx, 'faded part: the range between central and worst-case forecasts', X0, 214, { mono: true, size: 9.5, color: C.muted });
      fig.readout('balancing cost <b>£3.1bn</b> in 2025/26; forecasts for the cost of full wires alone in 2030 run from about <b>£4bn to over £7bn</b> a year, depending on how fast new lines are built');
    }
  };
});
