const Olympus = (() => {
  const COLS = 6, ROWS = 5, MIN = 8;
  const SYMS = {
    crown:  { e: '👑', pay: [10, 25, 50] },
    hour:   { e: '⏳', pay: [2.5, 10, 25] },
    ring:   { e: '💍', pay: [2, 5, 15] },
    cup:    { e: '🏆', pay: [1.5, 2, 12] },
    red:    { e: '❤️', pay: [1, 1.5, 10] },
    purple: { e: '💜', pay: [0.8, 1.2, 8] },
    yellow: { e: '💛', pay: [0.5, 1, 5] },
    green:  { e: '💚', pay: [0.4, 0.9, 4] },
    blue:   { e: '💙', pay: [0.25, 0.75, 2] },
    scatter:{ e: '⚡' },
    orb:    { e: '🔮' },
  };
  const W = { crown: 4, hour: 5, ring: 6, cup: 7, red: 9, purple: 10, yellow: 11, green: 12, blue: 13 };
  const SCATTER_W = 1.6, ORB_W = 0.85;
  const ORB_VALS = [[2,30],[3,20],[4,15],[5,10],[6,8],[8,5],[10,4],[12,3],[15,2],[20,1.5],[25,1],[50,.5],[100,.2],[250,.05],[500,.02]];
  const SCATTER_PAY = { 4: 3, 5: 5, 6: 100 };
  const START_FS = 15, RETRIGGER = 5, BUY_COST = 100, ANTE = 1.25;

  const wpick = arr => { let t = 0; for (const [, w] of arr) t += w; let r = Math.random() * t; for (const [v, w] of arr) if ((r -= w) < 0) return v; return arr[0][0]; };
  const symList = Object.entries(W);
  const orbVal = () => wpick(ORB_VALS);
  function randCell(opts) {
    const total = symList.reduce((a, [, w]) => a + w, 0);
    const sw = opts.scatter ? SCATTER_W * (opts.ante ? 1.2 : 1) : 0;
    let r = Math.random() * (total + sw + ORB_W);
    if (r < sw) return { s: 'scatter' };
    r -= sw; if (r < ORB_W) return { s: 'orb', v: orbVal() };
    r -= ORB_W; for (const [k, w] of symList) if ((r -= w) < 0) return { s: k };
    return { s: 'blue' };
  }
  const newGrid = opts => Array.from({ length: COLS }, () => Array.from({ length: ROWS }, () => randCell(opts)));

  function clusters(grid, bet) {
    const cnt = {}, cells = {};
    grid.forEach((col, c) => col.forEach((x, r) => { if (SYMS[x.s].pay) { cnt[x.s] = (cnt[x.s] || 0) + 1; (cells[x.s] = cells[x.s] || []).push([c, r]); } }));
    return Object.keys(cnt).filter(k => cnt[k] >= MIN).map(k => {
      const n = cnt[k], tier = n >= 12 ? 2 : n >= 10 ? 1 : 0;
      return { sym: k, count: n, cells: cells[k], win: SYMS[k].pay[tier] * bet };
    });
  }
  function tumble(grid, cl) {                       // убираем выигравшие символы и все шары, остальные падают вниз
    const dead = new Set(cl.flatMap(c => c.cells.map(([a, b]) => a + ',' + b)));
    return grid.map((col, c) => {
      const keep = col.filter((x, r) => !dead.has(c + ',' + r) && x.s !== 'orb');
      const fresh = Array.from({ length: ROWS - keep.length }, () => randCell({ scatter: false }));
      return fresh.concat(keep);
    });
  }
  const orbsIn = g => g.flat().filter(x => x.s === 'orb').reduce((a, x) => a + x.v, 0);
  const scatters = g => g.flat().filter(x => x.s === 'scatter').length;

  // Одно вращение: цепочка тумблов. carry — накопленный множитель фриспинов (или 0 в базовой игре)
  function spin(bet, { ante = false, free = false, carry = 0, forceScatters = 0 } = {}) {
    let grid = newGrid({ scatter: true, ante });
    if (forceScatters) {                          // покупка бонуса: гарантированно 4 скаттера
      const pos = []; while (pos.length < forceScatters) { const p = [Math.floor(Math.random() * COLS), Math.floor(Math.random() * ROWS)]; if (!pos.some(q => q[0] === p[0] && q[1] === p[1])) pos.push(p); }
      pos.forEach(([c, r]) => grid[c][r] = { s: 'scatter' });
    }
    const grids = [grid], steps = []; let base = 0, orbSum = orbsIn(grid);
    for (;;) {
      const cl = clusters(grid, bet);
      steps.push(cl);
      if (!cl.length) break;
      base += cl.reduce((a, c) => a + c.win, 0);
      grid = tumble(grid, cl); grids.push(grid); orbSum += orbsIn(grid);
    }
    const sc = scatters(grids[0]);
    const mult = free ? carry + orbSum : orbSum;
    const lineWin = base > 0 ? base * (mult > 0 ? mult : 1) : 0;
    const scWin = sc >= 4 ? SCATTER_PAY[Math.min(sc, 6)] * bet : 0;
    return { grids, steps, base, orbSum, mult, lineWin, scatters: sc, scWin, total: lineWin + scWin,
             fs: sc >= 4 ? (free ? RETRIGGER : START_FS) : (free && sc === 3 ? RETRIGGER : 0), newCarry: free ? carry + orbSum : 0 };
  }
  function simulate(n, { ante = false, buy = false } = {}) {
    let cost = 0, won = 0, fsTrig = 0, max = 0;
    for (let i = 0; i < n; i++) {
      const bet = 1; cost += buy ? BUY_COST * bet : bet * (ante ? ANTE : 1);
      let r = buy ? spin(bet, { ante: false, forceScatters: 4 }) : spin(bet, { ante });
      let tot = r.total, fs = r.fs, carry = 0; if (fs) fsTrig++;
      while (fs > 0) { fs--; r = spin(bet, { free: true, carry, ante: false }); carry = r.newCarry; tot += r.total; fs += r.fs; }
      won += tot; if (tot > max) max = tot;
    }
    return { rtp: +(won / cost).toFixed(4), fsRate: fsTrig / n, max };
  }
  return { COLS, ROWS, SYMS, START_FS, RETRIGGER, BUY_COST, ANTE, spin, simulate };
})();


(() => {
  const { $, rnd, sleep, msg, fmt, setBalance, readBet } = Casino;
  /* ================= ОЛИМП (6×5, платит везде, тумбл, множители, фриспины) ================= */
  const OL = Olympus, oCells = [];
  const oGrid = $('olyGrid');
  for (let c = 0; c < OL.COLS; c++) {
    const col = document.createElement('div'); col.className = 'olycol'; oCells[c] = [];
    for (let r = 0; r < OL.ROWS; r++) { const d = document.createElement('div'); d.className = 'oc'; col.appendChild(d); oCells[c][r] = d; }
    oGrid.appendChild(col);
  }
  // drop: false — просто показать; true — анимация падения. prev — предыдущее поле: тогда падают только сдвинувшиеся и новые клетки
  function oRender(g, drop, prev) {
    const dy = drop ? (prev ? Anim.dropDiff(prev, g) : g.map(col => col.map(() => OL.ROWS + 1))) : null;
    g.forEach((col, c) => col.forEach((x, r) => {
      const el = oCells[c][r], d = dy ? dy[c][r] : 0;
      el.className = 'oc' + (x.s === 'orb' ? ' orb' : x.s === 'scatter' ? ' scatter' : '') + (d ? ' drop' : '');
      if (d) { el.style.setProperty('--dy', d); el.style.setProperty('--d', (prev ? c * 0.012 : c * 0.05 + (OL.ROWS - r) * 0.025) + 's'); }
      if (x.s === 'orb') el.textContent = '×' + x.v; else el.innerHTML = Art.html('olympus', x.s) || OL.SYMS[x.s].e;
    }));
  }
  async function exitGrid() {                        // старые символы уходят вниз перед новым спином
    if (Anim.reduce()) return;
    oCells.forEach((col, c) => col.forEach((el, r) => { el.style.setProperty('--d', (c * 0.03 + (OL.ROWS - r) * 0.015) + 's'); el.classList.add('exit'); }));
    await od(420);
  }
  oRender(OL.spin(1).grids[0], false);
  [10, 20, 50, 100, 200, 500, 1000, 2500].forEach(v => $('olyBet').add(new Option(v, v)));
  $('olyPay').innerHTML = '<table><tr><th></th><th>8–9</th><th>10–11</th><th>12+</th></tr>' +
    Object.entries(OL.SYMS).filter(([, s]) => s.pay).map(([k, s]) => `<tr><td>${Art.html('olympus', k)}</td>${s.pay.map(p => `<td>×${p}</td>`).join('')}</tr>`).join('') +
    '</table><small>множители от ставки</small>';
  const oCost = () => +$('olyBet').value * ($('olyAnte').checked ? OL.ANTE : 1);
  const updOCost = () => { $('olyCost').textContent = oCost(); $('olyBuy').textContent = `Купить бонус (${OL.BUY_COST * $('olyBet').value} ₽)`; };
  $('olyBet').onchange = $('olyAnte').onchange = updOCost; updOCost();

  let oBusy = false, oAuto = false, oTurbo = false;
  const od = ms => sleep(oTurbo ? ms / 3 : ms);
  const orbSumOf = g => g.flat().filter(x => x.s === 'orb').reduce((a, x) => a + x.v, 0);
  const setOControls = off => { $('olySpin').disabled = $('olyBuy').disabled = $('olyBet').disabled = $('olyAnte').disabled = off; };

  async function playSpin(r, bet, carry) {         // проигрывает анимацию одного спина, возвращает ничего
    let acc = 0, shown = carry + orbSumOf(r.grids[0]);
    Anim.countTo($('olyWin'), 0, 200); $('olyMult').textContent = '×' + shown;
    await exitGrid(); oRender(r.grids[0], true); await od(700);
    for (let i = 0; i < r.steps.length; i++) {
      const cl = r.steps[i]; if (!cl.length) break;
      cl.forEach(c => c.cells.forEach(([a, b]) => oCells[a][b].classList.add('hit')));
      r.grids[i].forEach((col, a) => col.forEach((x, b) => { if (x.s === 'orb') oCells[a][b].classList.add('hit'); }));
      acc += cl.reduce((s, c) => s + c.win, 0); Anim.countTo($('olyWin'), fmt(acc), 500);
      await od(900);
      cl.forEach(c => c.cells.forEach(([a, b]) => oCells[a][b].classList.add('pop')));
      r.grids[i].forEach((col, a) => col.forEach((x, b) => { if (x.s === 'orb') oCells[a][b].classList.add('pop'); }));
      await od(400);
      oRender(r.grids[i + 1], true, r.grids[i]);
      shown += orbSumOf(r.grids[i + 1]); $('olyMult').textContent = '×' + shown;
      await od(700);
    }
    if (r.base > 0 && r.mult > 0) {
      Anim.countTo($('olyWin'), fmt(r.lineWin), 700);
      msg($('olyMsg'), `${fmt(r.base)} ₽ × ${r.mult} = ${fmt(r.lineWin)} ₽`, 'win'); await od(900);
    }
  }

  async function oSpinOnce(bet, opts) {              // одно вращение + начисление
    const r = OL.spin(bet, opts);
    await playSpin(r, bet, opts.carry || 0);
    if (r.total > 0) setBalance(Casino.balance + r.total);
    if (r.scWin) msg($('olyMsg'), `⚡ ×${r.scatters}: +${fmt(r.scWin)} ₽`, 'win');
    else if (!r.total) msg($('olyMsg'), 'Без выигрыша', 'lose');
    else msg($('olyMsg'), `Выигрыш: ${fmt(r.total)} ₽`, 'win');
    return r;
  }
  async function oRound(buy) {
    if (oBusy) return; const bet = +$('olyBet').value, ante = $('olyAnte').checked;
    const cost = buy ? OL.BUY_COST * bet : oCost();
    if (cost > Casino.balance) { oAuto = false; $('olyAuto').textContent = 'Авто: выкл'; setOControls(false); return msg($('olyMsg'), 'Недостаточно средств', 'lose'); }
    oBusy = true; setOControls(true); setBalance(Casino.balance - cost);
    $('olyFs').style.display = 'none';
    let r = await oSpinOnce(bet, buy ? { forceScatters: 4 } : { ante });
    let total = r.total;
    if (r.fs) {
      let left = r.fs, carry = 0, n = 0; msg($('olyMsg'), `⚡ ${left} бесплатных вращений!`, 'win'); await od(1600);
      $('olyFs').style.display = 'block';
      while (left > 0) {
        left--; n++; $('olyFs').textContent = `⚡ Фриспины: осталось ${left} · выиграно ${fmt(total)} ₽`;
        r = await oSpinOnce(bet, { free: true, carry }); carry = r.newCarry; total += r.total;
        if (r.fs) { left += r.fs; msg($('olyMsg'), `+${r.fs} фриспинов!`, 'win'); await od(1200); }
        $('olyFs').textContent = `⚡ Фриспины: осталось ${left} · выиграно ${fmt(total)} ₽`; await od(600);
      }
      msg($('olyMsg'), `Бонус окончен: ${n} вращений, итого ${fmt(total)} ₽ (×${fmt(total / bet)})`, total ? 'win' : 'lose');
    }
    oBusy = false; if (!oAuto) setOControls(false);
    if (oAuto) { await sleep(total > 0 ? 900 : 300); if (oAuto) oRound(false); }
  }
  $('olySpin').onclick = () => { oAuto = false; $('olyAuto').textContent = 'Авто: выкл'; oRound(false); };
  $('olyBuy').onclick = () => { if (!oBusy && confirm(`Купить бонус за ${OL.BUY_COST * $('olyBet').value} ₽?`)) oRound(true); };
  $('olyAuto').onclick = () => { oAuto = !oAuto; $('olyAuto').textContent = 'Авто: ' + (oAuto ? 'вкл' : 'выкл'); if (oAuto && !oBusy) oRound(false); else if (!oAuto && !oBusy) setOControls(false); };
  $('olyTurbo').onclick = () => { oTurbo = !oTurbo; $('olyTurbo').textContent = 'Турбо: ' + (oTurbo ? 'вкл' : 'выкл'); };


})();
