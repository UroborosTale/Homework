// Dog House Megaways-style: 6 барабанов 2–7 символов, до 117 649 способов, тумбл, дикие с множителем во фриспинах
const DogEngine = (() => {
  const REELS = 6, MINH = 2, MAXH = 7;
  const SYMS = {
    D: { e: '🐕', pay: [0.5, 1.5, 4, 12] }, P: { e: '🐩', pay: [0.4, 1.2, 3, 9] },
    H: { e: '🐶', pay: [0.3, 0.9, 2, 6] },  B: { e: '🦴', pay: [0.25, 0.7, 1.5, 4] },
    A: { e: 'A', pay: [0.1, 0.3, 0.8, 2] }, K: { e: 'K', pay: [0.1, 0.3, 0.8, 2] },
    Q: { e: 'Q', pay: [0.08, 0.2, 0.5, 1.5] }, J: { e: 'J', pay: [0.08, 0.2, 0.5, 1.5] },
    W: { e: '🏠' }, S: { e: '🐾' },
  };
  const PAY_SCALE = 0.06;
  for (const k in SYMS) if (SYMS[k].pay) SYMS[k].pay = SYMS[k].pay.map(p => p * PAY_SCALE);
  const W = { D: 4, P: 5, H: 6, B: 7, A: 10, K: 10, Q: 11, J: 11 };
  const WILD_W = 2, WILD_W_FS = 0.61, SCAT_W = 0.9, WILD_MULTS = [2, 3];
  const MAX_STEPS = 25, MAX_WIN = 5000;
  const FS = { 3: 7, 4: 11, 5: 15, 6: 20 }, BUY_COST = 95;
  const rnd = n => Math.floor(Math.random() * n);
  const kpick = w => { let t = 0; for (const k in w) t += w[k]; let r = Math.random() * t; for (const k in w) if ((r -= w[k]) < 0) return k; };
  const randHeights = () => Array.from({ length: REELS }, () => MINH + rnd(MAXH - MINH + 1));

  // opts: scatter — можно ли выпасть скаттеру; free — фриспины (дикие с множителем)
  function randCell(reel, o) {
    const total = Object.values(W).reduce((a, b) => a + b, 0), wild = reel >= 1 ? (o.free ? WILD_W_FS : WILD_W) : 0, sc = o.scatter ? SCAT_W : 0;
    let r = Math.random() * (total + wild + sc);
    if (r < wild) return o.free ? { s: 'W', m: WILD_MULTS[rnd(2)] } : { s: 'W', m: 1 };
    r -= wild; if (r < sc) return { s: 'S' };
    return { s: kpick(W) };
  }
  const newGrid = (heights, o) => heights.map((h, r) => Array.from({ length: h }, () => randCell(r, o)));

  function evaluate(grid, bet, free) {
    const wins = [];
    for (const sym of Object.keys(SYMS)) {
      if (!SYMS[sym].pay) continue;
      let n = 0, ways = 1; const counts = [];
      for (let r = 0; r < REELS; r++) {
        const c = grid[r].filter(x => x.s === sym || x.s === 'W').length; if (!c) break; counts.push(c); ways *= c; n++;
      }
      if (n < 3 || !grid[0].some(x => x.s === sym)) continue;
      let wm = 0; const cells = [];
      for (let r = 0; r < n; r++) grid[r].forEach((x, i) => {
        if (x.s === sym) cells.push([r, i]);
        else if (x.s === 'W') { wm += x.m; if (!free) cells.push([r, i]); }
      });
      const mult = free && wm > 0 ? wm : 1;
      wins.push({ sym, reels: n, ways, mult, cells, win: SYMS[sym].pay[Math.min(n, 6) - 3] * bet * ways * mult });
    }
    return wins;
  }
  function cascade(grid, wins, free) {          // убираем выигравшие (дикие с множителем — липкие, остаются)
    const dead = new Set(wins.flatMap(w => w.cells.map(([r, i]) => r + ',' + i)));
    return grid.map((col, r) => {
      const keepIdx = col.map((x, i) => (x.s === 'W' && free) ? i : -1).filter(i => i >= 0);
      const fixed = new Set(keepIdx), items = col.filter((x, i) => !fixed.has(i) && !dead.has(r + ',' + i));
      const out = new Array(col.length);
      keepIdx.forEach(i => out[i] = col[i]);
      const free_pos = []; for (let i = 0; i < col.length; i++) if (!fixed.has(i)) free_pos.push(i);
      const fresh = free_pos.length - items.length;
      free_pos.forEach((p, k) => out[p] = k < fresh ? randCell(r, { scatter: false, free }) : items[k - fresh]);
      return out;
    });
  }
  // sticky — сетка из предыдущих спинов фриспинов (позиции липких диких)
  function spin(bet, { free = false, heights, sticky, forceScatters = 0 } = {}) {
    heights = heights || randHeights();
    let grid = newGrid(heights, { scatter: true, free });
    if (sticky) sticky.forEach(([r, i, m]) => { if (grid[r] && i < grid[r].length) grid[r][i] = { s: 'W', m }; });
    if (forceScatters) { let k = 0; while (k < forceScatters) { const r = rnd(REELS), i = rnd(grid[r].length); if (grid[r][i].s !== 'S') { grid[r][i] = { s: 'S' }; k++; } } }
    const grids = [grid], steps = []; let total = 0;
    for (;;) {
      const wins = evaluate(grid, bet, free); steps.push(wins);
      if (!wins.length || steps.length > MAX_STEPS) break;
      total += wins.reduce((a, w) => a + w.win, 0);
      grid = cascade(grid, wins, free); grids.push(grid);
    }
    total = Math.min(total, MAX_WIN * bet);
    const sc = grids[0].flat().filter(x => x.s === 'S').length;
    const stickyOut = free ? grids[grids.length - 1].flatMap((col, r) => col.map((x, i) => x.s === 'W' ? [r, i, x.m] : null).filter(Boolean)) : [];
    const ways = grids[0].reduce((a, c) => a * c.length, 1);
    return { heights, grids, steps, total, scatters: sc, fs: sc >= 3 ? FS[Math.min(sc, 6)] : 0, sticky: [], ways };
  }
  function simulate(n, { buy = false } = {}) {
    let cost = 0, won = 0, trig = 0;
    for (let i = 0; i < n; i++) {
      cost += buy ? BUY_COST : 1;
      let r = spin(1, { forceScatters: buy ? 3 : 0 }); won += r.total;
      if (r.fs) {
        trig++; let left = r.fs, sticky = [], h = randHeights();
        while (left-- > 0) { r = spin(1, { free: true, heights: h, sticky }); sticky = r.sticky; won += r.total; if (r.fs) left += r.fs; }
      }
    }
    return { rtp: +(won / cost).toFixed(4), fs: trig / n };
  }
  return { REELS, SYMS, BUY_COST, MAX_WIN, spin, simulate, randHeights };
})();

(() => {
  const { $, rnd, sleep, msg, fmt, setBalance } = Casino;
  const DE = DogEngine, SYM = DE.SYMS;
  const gridEl = $('dgGrid'), cols = [];                    // cols[reel] = массив DOM-ячеек
  for (let r = 0; r < DE.REELS; r++) { const c = document.createElement('div'); c.className = 'dgcol'; gridEl.appendChild(c); cols.push([]); }
  // drop: анимация падения; prev — предыдущее поле (тогда падают только сдвинувшиеся и новые клетки)
  function render(grid, drop, prev) {
    const dy = drop ? (prev ? Anim.dropDiff(prev, grid) : grid.map(col => col.map(() => col.length + 1))) : null;
    grid.forEach((col, r) => {
      const host = gridEl.children[r]; host.replaceChildren(); cols[r] = [];
      col.forEach((x, i) => {
        const d = document.createElement('div'), dd = dy ? dy[r][i] : 0;
        d.className = 'dc' + (x.s === 'W' ? ' wild' : x.s === 'S' ? ' scat' : '') + ('AKQJ'.includes(x.s) ? ' letter' : '') + (dd ? ' drop' : '');
        if (dd) { d.style.setProperty('--dy', dd); d.style.setProperty('--d', (prev ? r * 0.012 : r * 0.05 + (col.length - i) * 0.025) + 's'); }
        d.innerHTML = x.s === 'W' ? `${Art.html('dog', 'W')}${x.m > 1 ? `<b class="wm">×${x.m}</b>` : ''}` : 'AKQJ'.includes(x.s) ? x.s : (Art.html('dog', x.s) || SYM[x.s].e);
        host.appendChild(d); cols[r].push(d);
      });
    });
    $('dgWays').textContent = grid.reduce((a, c) => a * c.length, 1).toLocaleString('ru-RU') + ' способов';
  }
  async function exitGrid() {                        // старые символы уходят вниз перед новым спином
    if (Anim.reduce()) return;
    cols.forEach((col, r) => col.forEach((el, i) => { el.style.setProperty('--d', (r * 0.03 + (col.length - i) * 0.015) + 's'); el.classList.add('exit'); }));
    await d(420);
  }
  render(DE.spin(1).grids[0], false);
  [10, 20, 50, 100, 200, 500, 1000, 2500].forEach(v => $('dgBet').add(new Option(v, v)));
  $('dgPay').innerHTML = '<table><tr><th></th><th>3</th><th>4</th><th>5</th><th>6</th></tr>' +
    Object.entries(SYM).filter(([, s]) => s.pay).map(([k, s]) => `<tr><td>${'AKQJ'.includes(k) ? k : Art.html('dog', k)}</td>${s.pay.map(p => `<td>×${Math.round(p * 1000) / 1000}</td>`).join('')}</tr>`).join('') +
    '</table><small>множитель ставки за каждый способ (число способов = произведение символов на барабанах)</small>';
  const updCost = () => { $('dgCost').textContent = $('dgBet').value; $('dgBuy').textContent = `Купить бонус (${DE.BUY_COST * $('dgBet').value} ₽)`; };
  $('dgBet').onchange = updCost; updCost();

  let busy = false, auto = false, turbo = false;
  const d = ms => sleep(turbo ? ms / 3 : ms);
  const setOff = off => { $('dgSpin').disabled = $('dgBuy').disabled = $('dgBet').disabled = off; };
  const randSyms = ['D', 'P', 'H', 'B', 'A', 'K', 'Q', 'J'];

  async function playSpin(r) {
    Anim.countTo($('dgWin'), 0, 200);
    await exitGrid(); render(r.grids[0], true); await d(700);
    let acc = 0;
    for (let i = 0; i < r.steps.length; i++) {
      const wins = r.steps[i]; if (!wins.length) break;
      wins.forEach(w => w.cells.forEach(([a, b]) => cols[a][b] && cols[a][b].classList.add('hit')));
      const step = wins.reduce((s, w) => s + w.win, 0); acc += step; Anim.countTo($('dgWin'), fmt(acc), 500);
      msg($('dgMsg'), wins.map(w => `${SYM[w.sym].e}×${w.reels} · ${w.ways} путей${w.mult > 1 ? ' · ×' + w.mult : ''}`).join('  |  ') + ` = ${fmt(step)} ₽`, 'win');
      await d(1000);
      wins.forEach(w => w.cells.forEach(([a, b]) => cols[a][b] && cols[a][b].classList.add('pop'))); await d(400);
      render(r.grids[i + 1], true, r.grids[i]); await d(600);
    }
  }
  async function spinOnce(bet, opts) {
    const r = DE.spin(bet, opts); await playSpin(r);
    if (r.total > 0) setBalance(Casino.balance + r.total);
    const capped = r.total >= DE.MAX_WIN * bet;
    msg($('dgMsg'), r.total ? `Выигрыш: ${fmt(r.total)} ₽${capped ? ' (максимум!)' : ''}` : 'Без выигрыша', r.total ? 'win' : 'lose');
    return r;
  }
  async function round(buy) {
    if (busy) return; const bet = +$('dgBet').value, cost = buy ? DE.BUY_COST * bet : bet;
    if (cost > Casino.balance) { auto = false; ap.cancel(); setOff(false); return msg($('dgMsg'), 'Недостаточно средств', 'lose'); }
    busy = true; setOff(true); setBalance(Casino.balance - cost); $('dgFs').style.display = 'none';
    let r = await spinOnce(bet, { forceScatters: buy ? 3 : 0 }), total = r.total;
    if (r.fs) {
      let left = r.fs, n = 0; const heights = DE.randHeights();
      msg($('dgMsg'), `🐾 ${left} бесплатных вращений! Дикие 🏠 с множителями ×2/×3 липнут до конца вращения`, 'win'); await d(1800);
      $('dgFs').style.display = 'block';
      while (left > 0) {
        await Casino.whenActive('doghouse');                     // ушли со слота — фриспины ждут возвращения
        left--; n++; $('dgFs').textContent = `🐾 Фриспины: осталось ${left} · выиграно ${fmt(total)} ₽`;
        r = await spinOnce(bet, { free: true, heights }); total += r.total;
        if (r.fs) { left += r.fs; msg($('dgMsg'), `+${r.fs} фриспинов!`, 'win'); await d(1200); }
        $('dgFs').textContent = `🐾 Фриспины: осталось ${left} · выиграно ${fmt(total)} ₽`; await d(500);
      }
      msg($('dgMsg'), `Бонус окончен: ${n} вращений, итого ${fmt(total)} ₽ (×${fmt(total / bet)})`, total ? 'win' : 'lose');
    }
    Anim.winFx(total, bet);
    busy = false; if (!auto) setOff(false);
    if (auto && ap.after(total, bet)) { await sleep(total > 0 ? 900 : 300); if (auto) round(false); }
  }
  $('dgSpin').onclick = () => { auto = false; ap.cancel(); round(false); };
  $('dgBuy').onclick = () => { if (!busy && confirm(`Купить бонус за ${DE.BUY_COST * $('dgBet').value} ₽?`)) round(true); };
  const ap = SlotUI.auto($('dgAuto'), { start: () => { auto = true; if (!busy) round(false); }, stop: () => { auto = false; if (!busy) setOff(false); } });
  $('dgTurbo').onclick = () => { turbo = !turbo; $('doghouse').classList.toggle('turbo', turbo); $('dgTurbo').textContent = 'Турбо: ' + (turbo ? 'вкл' : 'выкл'); };
})();
