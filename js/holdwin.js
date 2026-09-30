// Hold & Win (в стиле Money Train / Cash Collect): 6+ монет запускают бонус с респинами
const HoldWinEngine = (() => {
  const SYMS = {
    G: { e: '🔫', pay: [10, 50, 250] }, H: { e: '🤠', pay: [8, 40, 150] },
    B: { e: '👢', pay: [6, 25, 100] },  S: { e: '🧲', pay: [5, 20, 80] },
    A: { e: 'A', pay: [3, 10, 40] },    K: { e: 'K', pay: [3, 10, 40] },
    Q: { e: 'Q', pay: [2, 8, 30] },     J: { e: 'J', pay: [2, 8, 30] },
    W: { e: '⭐' }, C: { e: '🪙' },
  };
  const PAY_SCALE = 3.4;
  for (const k in SYMS) if (SYMS[k].pay) SYMS[k].pay = SYMS[k].pay.map(p => p * PAY_SCALE);
  const LINES = [
    [1,1,1,1,1], [0,0,0,0,0], [2,2,2,2,2], [0,1,2,1,0], [2,1,0,1,2],
    [0,0,1,2,2], [2,2,1,0,0], [1,0,0,0,1], [1,2,2,2,1], [0,1,1,1,0],
  ];
  const W = { G: 4, H: 5, B: 6, S: 7, A: 10, K: 10, Q: 12, J: 12, C: 9 };
  const WMID = { ...W, W: 6 };
  // значения монет: × общая ставка; джекпоты — фиксированные множители
  const COINS = [[1, 30], [2, 24], [3, 16], [5, 12], [8, 7], [10, 5], [15, 3], [25, 1.5], ['MINI', 1.2], ['MINOR', .5], ['MAJOR', .12]];
  const JP = { MINI: 20, MINOR: 50, MAJOR: 200, GRAND: 1000 };
  const TRIGGER = 6, RESPINS = 3, P_COIN = 0.085;
  const rnd = n => Math.floor(Math.random() * n);
  const wpick = arr => { let t = 0; for (const [, w] of arr) t += w; let r = Math.random() * t; for (const [v, w] of arr) if ((r -= w) < 0) return v; return arr[0][0]; };
  const kpick = w => { let t = 0; for (const k in w) t += w[k]; let r = Math.random() * t; for (const k in w) if ((r -= w[k]) < 0) return k; };
  const coin = () => { const v = wpick(COINS); return typeof v === 'string' ? { s: 'C', jp: v, v: JP[v] } : { s: 'C', v }; };
  const cell = reel => { const k = kpick(reel >= 1 && reel <= 3 ? WMID : W); return k === 'C' ? coin() : { s: k }; };
  const spinGrid = () => Array.from({ length: 5 }, (_, r) => [cell(r), cell(r), cell(r)]);

  function lineWins(grid, lines, lineBet) {
    const wins = []; let sum = 0;
    for (let li = 0; li < lines; li++) {
      const syms = LINES[li].map((row, r) => grid[r][row].s);
      let sym = null, n = 0;
      for (const s of syms) { if (s === 'W') { n++; continue; } if (s === 'C') break; if (sym === null) sym = s; if (s === sym) n++; else break; }
      if (n < 3) continue; if (sym === null) sym = 'G';
      const win = SYMS[sym].pay[n - 3] * lineBet; sum += win;
      wins.push({ line: li, sym, count: n, win, cells: LINES[li].slice(0, n).map((row, r) => [r, row]) });
    }
    return { wins, sum };
  }
  function spin(lines, lineBet) {
    const grid = spinGrid(), l = lineWins(grid, lines, lineBet);
    const coins = grid.flat().filter(c => c.s === 'C').length;
    return { grid, wins: l.wins, lineWin: l.sum, coins, bonus: coins >= TRIGGER, total: l.sum };
  }
  // Бонус Hold & Win: монеты фиксируются, 3 респина, каждая новая монета сбрасывает счётчик на 3.
  // Возвращает шаги для анимации: [{ board, added:[[r,w]], left }]
  function holdAndWin(startGrid) {
    let board = startGrid.map(col => col.map(c => c.s === 'C' ? { ...c } : null)), left = RESPINS;
    const steps = [];
    while (left > 0 && board.flat().some(c => !c)) {
      const added = [];
      board = board.map((col, r) => col.map((c, w) => { if (c) return c; if (Math.random() < P_COIN) { added.push([r, w]); return coin(); } return null; }));
      left = added.length ? RESPINS : left - 1;
      steps.push({ board: board.map(col => col.slice()), added, left });
    }
    const full = board.flat().every(Boolean);
    const sum = board.flat().reduce((a, c) => a + (c ? c.v : 0), 0) + (full ? JP.GRAND : 0);
    return { steps, board, full, sumX: sum };            // sumX — × общей ставки
  }
  function simulate(n, lines = 10, lineBet = 1) {
    let cost = 0, won = 0, trig = 0, grand = 0; const total = lines * lineBet;
    for (let i = 0; i < n; i++) {
      cost += total; const r = spin(lines, lineBet); won += r.total;
      if (r.bonus) { trig++; const h = holdAndWin(r.grid); won += h.sumX * total; if (h.full) grand++; }
    }
    return { rtp: +(won / cost).toFixed(4), bonus: trig / n, grand };
  }
  return { SYMS, LINES, JP, TRIGGER, RESPINS, spin, holdAndWin, simulate, coin };
})();

(() => {
  const { $, sleep, msg, fmt, setBalance } = Casino;
  const HE = HoldWinEngine, SYM = HE.SYMS, LOW = 'AKQJ';
  let totalBet = 10;
  const coinLabel = c => c.jp ? c.jp : fmt(c.v * totalBet);
  function fill(el, c) {
    const k = c.s;
    el.className = 'sc' + (LOW.includes(k) ? ' letter' : '') + (k === 'C' ? ' coin' + (c.jp ? ' jp jp-' + c.jp.toLowerCase() : '') : '') + (k === 'W' ? ' wildc' : '');
    if (k === 'C') el.innerHTML = `${Art.html('west', 'C')}<b class="cv">${coinLabel(c)}</b>`;
    else if (LOW.includes(k)) el.textContent = k;
    else el.innerHTML = Art.html('west', k) || SYM[k].e;
  }
  const keys = ['G', 'H', 'B', 'S', 'A', 'K', 'Q', 'J', 'W', 'C'];
  const ui = SlotUI.create({ grid: $('hwGrid'), svg: $('hwSvg'), lines: HE.LINES, fill,
    rand: () => { const k = keys[Casino.rnd(keys.length)]; return k === 'C' ? HE.coin() : { s: k }; } });
  ui.show(HE.spin(10, 1).grid);
  for (let i = 1; i <= 10; i++) $('hwLines').add(new Option(i, i)); $('hwLines').value = 10;
  [1, 2, 5, 10, 25, 50].forEach(v => $('hwBet').add(new Option(v, v)));
  $('hwPay').innerHTML = SlotUI.payTable(SYM, k => LOW.includes(k) ? k : Art.html('west', k));
  const total = () => +$('hwLines').value * +$('hwBet').value;
  function updJackpots() {
    totalBet = total(); $('hwTotal').textContent = totalBet;
    for (const [k, x] of Object.entries(HE.JP)) Anim.countTo($('hwJ' + k), x * totalBet, 400);
  }
  $('hwLines').onchange = $('hwBet').onchange = updJackpots; updJackpots();

  let busy = false, auto = false;
  const lock = () => { $('hwSpin').disabled = true; $('hwLines').disabled = $('hwBet').disabled = true; };
  const unlock = () => { $('hwSpin').disabled = false; $('hwLines').disabled = $('hwBet').disabled = false; };

  // ---- Бонус Hold & Win
  async function bonus(grid) {
    const h = HE.holdAndWin(grid), sec = $('holdwin'), cells = ui.cells;
    sec.classList.add('hw-bonus'); $('hwRespins').style.display = 'flex';
    msg($('hwMsg'), '💰 HOLD & WIN! Монеты зафиксированы — 3 респина', 'win');
    // только монеты остаются, остальные клетки пустеют
    grid.forEach((col, r) => col.forEach((c, w) => { const el = cells[r][w]; if (c.s === 'C') el.classList.add('locked'); else { el.className = 'sc empty'; el.innerHTML = ''; } }));
    const setLeft = n => { const el = $('hwLeft'); el.textContent = n; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); };
    setLeft(3); await sleep(1400);
    for (const st of h.steps) {
      const empties = cells.flat().filter(el => el.classList.contains('empty'));
      empties.forEach(el => el.classList.add('respin')); await sleep(750);
      empties.forEach(el => el.classList.remove('respin'));
      for (const [r, w] of st.added) {
        const el = cells[r][w]; fill(el, st.board[r][w]); el.classList.add('locked', 'land');
        setTimeout(() => el.classList.remove('land'), 700);
      }
      setLeft(st.left); await sleep(st.added.length ? 900 : 550);
    }
    if (h.full) { msg($('hwMsg'), '🏆 ВСЁ ПОЛЕ ЗАПОЛНЕНО — GRAND!', 'win'); $('hwJGRAND').parentElement.classList.add('won'); await sleep(1400); }
    // сбор монет: по одной подсвечиваем и прибавляем к сумме
    let acc = 0; $('hwCollect').style.display = 'block';
    for (let w = 0; w < 3; w++) for (let r = 0; r < 5; r++) {
      const c = h.board[r][w]; if (!c) continue;
      acc += c.v * totalBet; const el = cells[r][w]; el.classList.add('collect');
      Anim.countTo($('hwCollectSum'), fmt(acc), 250); await sleep(220);
    }
    if (h.full) { acc += HE.JP.GRAND * totalBet; Anim.countTo($('hwCollectSum'), fmt(acc), 800); await sleep(900); }
    await sleep(700);
    sec.classList.remove('hw-bonus'); $('hwRespins').style.display = 'none'; $('hwCollect').style.display = 'none'; $('hwJGRAND').parentElement.classList.remove('won');
    cells.flat().forEach(el => el.classList.remove('locked', 'collect'));
    return acc;
  }

  async function doSpin() {
    if (busy) return; const lines = +$('hwLines').value, lineBet = +$('hwBet').value, tot = total();
    if (tot > Casino.balance) { auto = false; ap.cancel(); unlock(); return msg($('hwMsg'), 'Недостаточно средств', 'lose'); }
    setBalance(Casino.balance - tot); busy = true; lock(); ui.clear();
    if (!auto) msg($('hwMsg'), 'Крутим…');
    const r = HE.spin(lines, lineBet);
    await ui.animate(r.grid);
    let win = r.lineWin;
    if (r.lineWin) { setBalance(Casino.balance + r.lineWin); msg($('hwMsg'), `Линий: ${r.wins.length} — выигрыш ${fmt(r.lineWin)} ₽`, 'win'); ui.cycleWins(r.wins); }
    else if (!r.bonus) msg($('hwMsg'), r.coins >= 4 ? `Монет: ${r.coins} из ${HE.TRIGGER} — почти!` : 'Не повезло, крутите ещё', 'lose');
    if (r.bonus) {
      ui.stop(); await sleep(r.lineWin ? 1200 : 500);
      const b = await bonus(r.grid); win += b; setBalance(Casino.balance + b);
      msg($('hwMsg'), `Бонус Hold & Win: ${fmt(b)} ₽ (×${fmt(b / tot)})`, 'win');
    }
    if (win) Anim.winFx(win, tot);
    busy = false; if (!auto) unlock();
    if (auto && ap.after(win, tot)) { await sleep(win ? 1500 : 450); if (auto) doSpin(); }
  }
  $('hwSpin').onclick = () => { auto = false; ap.cancel(); doSpin(); };
  const ap = SlotUI.auto($('hwAuto'), { start: () => { auto = true; if (!busy) doSpin(); }, stop: () => { auto = false; if (!busy) unlock(); } });
})();
