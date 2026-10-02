// Самураи Megaways: 6 барабанов по 2–7 символов, тумбл, во фриспинах множитель +1 за каждую лавину без сброса
const SamuraiEngine = (() => {
  const REELS = 6, MINH = 2, MAXH = 7;
  const SYMS = {
    helm: { e: '⛩️', pay: [1, 3, 8, 25] }, sword: { e: '🗡️', pay: [.8, 2.5, 6, 18] },
    fan:  { e: '🪭', pay: [.6, 2, 4, 12] }, lantern: { e: '🏮', pay: [.5, 1.5, 3, 8] },
    A: { e: 'A', pay: [.2, .5, 1.5, 4] }, K: { e: 'K', pay: [.2, .5, 1.5, 4] }, Q: { e: 'Q', pay: [.15, .4, 1, 3] },
    J: { e: 'J', pay: [.15, .4, 1, 3] }, T: { e: '10', pay: [.1, .3, .8, 2] },
    W: { e: '🐉' }, S: { e: '🔴' },
  };
  const PAY_SCALE = 0.071;
  for (const k in SYMS) if (SYMS[k].pay) SYMS[k].pay = SYMS[k].pay.map(p => Math.round(p * PAY_SCALE * 10000) / 10000);
  const W = { helm: 3, sword: 4, fan: 5, lantern: 6, A: 9, K: 9, Q: 10, J: 10, T: 11 };
  const WILD_W = 2.2, SCAT_W = 1.7;
  const MAX_STEPS = 30, MAX_WIN = 10000, BUY_COST = 100;
  const rnd = n => Math.floor(Math.random() * n);
  const kpick = w => { let t = 0; for (const k in w) t += w[k]; let r = Math.random() * t; for (const k in w) if ((r -= w[k]) < 0) return k; };
  const randHeights = () => Array.from({ length: REELS }, () => MINH + rnd(MAXH - MINH + 1));
  const total0 = Object.values(W).reduce((a, b) => a + b, 0);
  function randCell(reel, scatter) {
    const wild = reel >= 1 && reel <= 4 ? WILD_W : 0, sc = scatter ? SCAT_W : 0;
    let r = Math.random() * (total0 + wild + sc);
    if (r < wild) return { s: 'W' }; r -= wild; if (r < sc) return { s: 'S' };
    return { s: kpick(W) };
  }
  const newGrid = h => h.map((n, r) => Array.from({ length: n }, () => randCell(r, true)));
  function evaluate(grid, bet) {
    const wins = [];
    for (const sym of Object.keys(SYMS)) {
      if (!SYMS[sym].pay || !grid[0].some(x => x.s === sym)) continue;
      let n = 0, ways = 1;
      for (let r = 0; r < REELS; r++) { const c = grid[r].filter(x => x.s === sym || x.s === 'W').length; if (!c) break; ways *= c; n++; }
      if (n < 3) continue;
      const cells = []; for (let r = 0; r < n; r++) grid[r].forEach((x, i) => { if (x.s === sym || x.s === 'W') cells.push([r, i]); });
      wins.push({ sym, reels: n, ways, cells, win: SYMS[sym].pay[Math.min(n, 6) - 3] * bet * ways });
    }
    return wins;
  }
  function cascade(grid, wins) {
    const dead = new Set(wins.flatMap(w => w.cells.map(([r, i]) => r + ',' + i)));
    return grid.map((col, r) => { const keep = col.filter((x, i) => !dead.has(r + ',' + i)); return Array.from({ length: col.length - keep.length }, () => randCell(r, false)).concat(keep); });
  }
  // mult — текущий множитель фриспинов (растёт на 1 после каждой лавины и не сбрасывается)
  function spin(bet, { free = false, mult = 1, forceScatters = 0 } = {}) {
    const heights = randHeights(); let grid = newGrid(heights);
    if (forceScatters) { let k = 0; while (k < forceScatters) { const r = rnd(REELS), i = rnd(grid[r].length); if (grid[r][i].s !== 'S') { grid[r][i] = { s: 'S' }; k++; } } }
    const grids = [grid], steps = []; let total = 0, m = mult;
    for (;;) {
      const wins = evaluate(grid, bet); steps.push({ wins, mult: free ? m : 1 });
      if (!wins.length || steps.length > MAX_STEPS) break;
      total += wins.reduce((a, w) => a + w.win, 0) * (free ? m : 1);
      if (free) m++;
      grid = cascade(grid, wins); grids.push(grid);
    }
    total = Math.min(total, MAX_WIN * bet);
    const sc = grids[0].flat().filter(x => x.s === 'S').length;
    const fs = free ? (sc >= 3 ? 5 : 0) : (sc >= 4 ? 12 + 5 * (sc - 4) : 0);
    return { heights, grids, steps, total, scatters: sc, fs, mult: m, ways: grids[0].reduce((a, c) => a * c.length, 1) };
  }
  function simulate(n, { buy = false } = {}) {
    let cost = 0, won = 0, trig = 0;
    for (let i = 0; i < n; i++) {
      cost += buy ? BUY_COST : 1; let r = spin(1, { forceScatters: buy ? 4 : 0 }); won += r.total;
      if (r.fs) { trig++; let left = r.fs, m = 1; while (left-- > 0) { r = spin(1, { free: true, mult: m }); m = r.mult; won += r.total; left += r.fs; } }
    }
    return { rtp: +(won / cost).toFixed(4), fs: trig / n };
  }
  return { REELS, SYMS, BUY_COST, MAX_WIN, spin, simulate, randHeights };
})();

(() => {
  const { $, rnd, sleep, msg, fmt, setBalance } = Casino;
  const SE = SamuraiEngine, SYM = SE.SYMS, LOW = ['A', 'K', 'Q', 'J', 'T'];
  const gridEl = $('smGrid'), cols = [];
  for (let r = 0; r < SE.REELS; r++) { const c = document.createElement('div'); c.className = 'dgcol'; gridEl.appendChild(c); cols.push([]); }
  const face = s => LOW.includes(s) ? SYM[s].e : (Art.html('samurai', s) || SYM[s].e);
  function render(grid, drop, prev, extra) {
    const dy = drop ? (prev ? Anim.dropDiff(prev, grid) : grid.map(col => col.map(() => col.length + 1))) : null;
    grid.forEach((col, r) => {
      const host = gridEl.children[r]; host.replaceChildren(); cols[r] = [];
      col.forEach((x, i) => {
        const d = document.createElement('div'), dd = dy ? dy[r][i] : 0;
        d.className = 'dc' + (x.s === 'W' ? ' wild' : x.s === 'S' ? ' scat' : '') + (LOW.includes(x.s) ? ' letter' : '') + (dd ? ' drop' : '');
        if (dd) { d.style.setProperty('--dy', dd); d.style.setProperty('--d', (prev ? r * 0.012 : r * 0.05 + (col.length - i) * 0.025 + (extra ? extra[r] : 0)) + 's'); }
        d.innerHTML = face(x.s); host.appendChild(d); cols[r].push(d);
      });
    });
    $('smWays').textContent = grid.reduce((a, c) => a * c.length, 1).toLocaleString('ru-RU') + ' способов';
  }
  render(SE.spin(1).grids[0], false);
  [10, 20, 50, 100, 200, 500, 1000, 2500, 5000, 10000, 25000].forEach(v => $('smBet').add(new Option(v, v)));
  $('smPay').innerHTML = '<table><tr><th></th><th>3</th><th>4</th><th>5</th><th>6</th></tr>' +
    Object.entries(SYM).filter(([, s]) => s.pay).map(([k, s]) => `<tr><td>${LOW.includes(k) ? `<b class="smlow">${s.e}</b>` : Art.html('samurai', k)}</td>${s.pay.map(p => `<td>×${p}</td>`).join('')}</tr>`).join('') +
    '</table><small>множитель ставки за каждый способ</small>';
  const updCost = () => { $('smCost').textContent = $('smBet').value; };
  $('smBet').onchange = updCost; updCost();

  let busy = false, auto = false, turbo = false;
  const d = ms => sleep(turbo ? ms / 3 : ms);
  const setOff = off => { $('smSpin').disabled = $('smBuy').disabled = $('smBet').disabled = off; };
  function multBadge(m, bump) {
    const el = $('smMult'); el.textContent = '×' + m;
    if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  }
  async function exitGrid() {
    if (Anim.reduce()) return;
    cols.forEach((col, r) => col.forEach((el, i) => { el.style.setProperty('--d', (r * 0.03 + (col.length - i) * 0.015) + 's'); el.classList.add('exit'); }));
    await d(420);
  }
  async function playSpin(r, free) {
    Anim.countTo($('smWin'), 0, 200);
    await exitGrid();
    const T = SlotFX.teaseDrop([...gridEl.children], r.grids[0], x => x.s === 'S', 3, turbo);
    render(r.grids[0], true, null, T.extraS); await d(700); await sleep(T.waitMs);
    let acc = 0;
    for (let i = 0; i < r.steps.length; i++) {
      const { wins, mult } = r.steps[i]; if (!wins.length) break;
      wins.forEach(w => w.cells.forEach(([a, b]) => cols[a][b] && cols[a][b].classList.add('hit')));
      const step = wins.reduce((s, w) => s + w.win, 0) * mult; acc += step; Anim.countTo($('smWin'), fmt(acc), 500);
      msg($('smMsg'), wins.map(w => `${w.ways} путей`).join(' · ') + (free ? ` × ${mult}` : '') + ` = ${fmt(step)} ₽`, 'win');
      await d(950);
      wins.forEach(w => w.cells.forEach(([a, b]) => cols[a][b] && cols[a][b].classList.add('pop', 'slash')));
      if (free) multBadge(mult + 1, true);
      await d(420);
      render(r.grids[i + 1], true, r.grids[i]); await d(600);
    }
  }
  async function spinOnce(bet, opts, g = 1) {              // g — множитель выбранных фриспинов
    const r = SE.spin(bet, opts); await playSpin(r, !!opts.free);
    r.total = Math.round(r.total * g * 100) / 100;
    if (r.total > 0) setBalance(Casino.balance + r.total);
    msg($('smMsg'), r.total ? `Выигрыш: ${fmt(r.total)} ₽${r.total >= SE.MAX_WIN * bet ? ' (максимум!)' : ''}` : 'Без выигрыша', r.total ? 'win' : 'lose');
    return r;
  }
  const fsBar = SlotUI.fsProgress($('smFs'));
  const FS_TABLE = [[1, 1], [2 / 3, 2], [5 / 12, 4.5]], SUPER = 140;
  async function round(buy) {
    if (busy) return; const bet = +$('smBet').value, cost = buy ? (buy === 'super' ? SUPER : SE.BUY_COST) * bet : bet;
    if (cost > Casino.balance) { auto = false; ap.cancel(); setOff(false); return msg($('smMsg'), 'Недостаточно средств', 'lose'); }
    busy = true; setOff(true); setBalance(Casino.balance - cost); SlotFX.jackpot.bet(cost); $('smFs').style.display = 'none'; fsBar.hide(); $('samurai').classList.remove('sm-fs');
    let r = await spinOnce(bet, { forceScatters: buy ? 4 : 0 }), total = r.total;
    if (r.fs) {
      const o = buy === 'super' ? { spins: r.fs, g: 1 } : await SlotFX.fsChoice(r.fs, FS_TABLE, { auto });
      let left = o.spins, n = 0, m = buy === 'super' ? 5 : 1; $('samurai').classList.add('sm-fs'); multBadge(m);
      msg($('smMsg'), `🔴 ${left} бесплатных вращений${o.g !== 1 ? ` · выигрыши ×${o.g}` : ''}! Множитель ${m > 1 ? `начинается с ×${m}, ` : ''}растёт с каждой лавиной и не сбрасывается`, 'win'); await d(1800);
      $('smFs').style.display = 'flex';
      while (left > 0) {
        await Casino.whenActive('samurai');                     // ушли со слота — фриспины ждут возвращения
        left--; n++; $('smFsLeft').textContent = left; fsBar.show(n, n + left); Anim.countTo($('smFsWon'), fmt(total), 400);
        r = await spinOnce(bet, { free: true, mult: m }, o.g); m = r.mult; multBadge(m); total += r.total;
        if (r.fs) { left += r.fs; msg($('smMsg'), `+${r.fs} фриспинов!`, 'win'); await d(1200); }
        $('smFsLeft').textContent = left; fsBar.show(n, n + left); Anim.countTo($('smFsWon'), fmt(total), 400); await d(450);
      }
      msg($('smMsg'), `Бонус окончен: ${n} вращений, множитель дошёл до ×${m}, итого ${fmt(total)} ₽ (×${fmt(total / bet)})`, total ? 'win' : 'lose');
      $('samurai').classList.remove('sm-fs');
    }
    Anim.winFx(total, bet);
    busy = false; if (!auto) setOff(false);
    if (auto && ap.after(total, bet)) { await sleep(total > 0 ? 900 : 300); if (auto) round(false); }
  }
  $('smSpin').onclick = () => { auto = false; ap.cancel(); round(false); };
  const bm = SlotFX.buyMenu($('smBuy'), { bet: () => +$('smBet').value, busy: () => busy,
    items: [{ key: 'bonus', name: 'Бонус', desc: '12+ фриспинов с растущим множителем — или меньше спинов ×2 / ×4.5', cost: SE.BUY_COST },
            { key: 'super', name: '🔥 Супер-бонус', desc: 'Фриспины, множитель сразу ×5 и растёт дальше', cost: SUPER }],
    onBuy(k) { auto = false; ap.cancel(); round(k); } });
  $('smBet').addEventListener('change', bm.paint);
  const ap = SlotUI.auto($('smAuto'), { start: () => { auto = true; if (!busy) round(false); }, stop: () => { auto = false; if (!busy) setOff(false); } });
  $('smTurbo').onclick = () => { turbo = !turbo; $('samurai').classList.toggle('turbo', turbo); $('smTurbo').textContent = 'Турбо: ' + (turbo ? 'вкл' : 'выкл'); };
})();
