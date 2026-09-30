const SlotEngine = (() => {
  const SYMS = {
    C: { e: '🍒', pay: [3, 10, 30] },   L: { e: '🍋', pay: [3, 12, 40] },
    O: { e: '🍊', pay: [5, 15, 50] },   G: { e: '🍇', pay: [6, 20, 60] },
    B: { e: '🔔', pay: [10, 30, 100] },  S: { e: '⭐', pay: [15, 50, 200] },
    D: { e: '💎', pay: [25, 80, 400] }, 7: { e: '7️⃣', pay: [50, 200, 1000] },
    W: { e: '👑' }, F: { e: '🎁' }, $: { e: '💰' },
  };
  const LINES = [
    [1,1,1,1,1], [0,0,0,0,0], [2,2,2,2,2], [0,1,2,1,0], [2,1,0,1,2],
    [0,0,1,2,2], [2,2,1,0,0], [1,0,0,0,1], [1,2,2,2,1], [0,1,1,1,0],
  ];
  const BASE = { C: 30, L: 26, O: 22, G: 16, B: 10, S: 6, D: 4, 7: 2, F: 4 };
  const MID = { W: 17, $: 5 };
  const REELS = [0, 1, 2, 3, 4].map(i => ({ ...BASE, ...(i >= 1 && i <= 3 ? MID : {}) }));
  const SCATTER_PAY = { 3: 2, 4: 10, 5: 50 };     // × общая ставка
  const FREE_SPINS = { 3: 10, 4: 15, 5: 20 };
  const FS_MULT = 3, RETRIGGER = 10;
  const CHESTS = [0.5, 0.5, 1, 1, 1, 2, 2, 3, 5]; // × общая ставка, открываются 3 из 9

  const rnd = n => Math.floor(Math.random() * n);
  function pick(w) {
    let t = 0; for (const k in w) t += w[k];
    let r = Math.random() * t;
    for (const k in w) { if ((r -= w[k]) < 0) return k; }
  }
  const spinGrid = () => REELS.map(w => [pick(w), pick(w), pick(w)]);   // grid[reel][row]

  function evaluate(grid, lines, lineBet) {
    const wins = []; let lineWin = 0;
    for (let li = 0; li < lines; li++) {
      const syms = LINES[li].map((row, r) => grid[r][row]);
      let sym = null, n = 0;
      for (const s of syms) {
        if (s === 'W') { n++; continue; }
        if (s === 'F' || s === '$') break;
        if (sym === null) sym = s;
        if (s === sym) n++; else break;
      }
      if (n < 3) continue;
      if (sym === null) sym = '7';
      const win = SYMS[sym].pay[n - 3] * lineBet;
      lineWin += win;
      wins.push({ line: li, sym, count: n, win, cells: LINES[li].slice(0, n).map((row, r) => [r, row]) });
    }
    const cnt = ch => grid.reduce((a, col) => a + col.filter(s => s === ch).length, 0);
    const cellsOf = ch => grid.flatMap((col, r) => col.map((s, row) => s === ch ? [r, row] : null).filter(Boolean));
    const f = cnt('F'), b = cnt('$');
    return {
      wins, lineWin, scatters: f, scatterCells: f >= 3 ? cellsOf('F') : [],
      scatterWin: f >= 3 ? SCATTER_PAY[Math.min(f, 5)] * lineBet * lines : 0,
      freeSpins: f >= 3 ? FREE_SPINS[Math.min(f, 5)] : 0,
      bonus: b >= 3, bonusCells: b >= 3 ? cellsOf('$') : [],
    };
  }
  const shuffledChests = () => CHESTS.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(x => x[1]);

  // симуляция полной игры (для проверки RTP)
  function simulate(lineBet, lines, n) {
    const total = lineBet * lines; let bet = 0, won = 0, trig = 0, bonus = 0;
    for (let i = 0; i < n; i++) {
      bet += total;
      let fs = 0, first = true;
      while (first || fs > 0) {
        const mult = first ? 1 : FS_MULT; if (!first) fs--; first = false;
        const r = evaluate(spinGrid(), lines, lineBet);
        won += r.lineWin * mult + r.scatterWin;
        if (r.freeSpins) { fs += (mult > 1 ? RETRIGGER : r.freeSpins); trig++; }
        if (r.bonus) { bonus++; won += shuffledChests().slice(0, 3).reduce((a, b) => a + b, 0) * total; }
      }
    }
    return { rtp: won / bet, freeSpinTrig: trig / n, bonus: bonus / n };
  }
  return { SYMS, LINES, REELS, FS_MULT, RETRIGGER, spinGrid, evaluate, shuffledChests, simulate };
})();


(() => {
  const { $, rnd, sleep, msg, fmt, setBalance, readBet } = Casino;
  /* ================= СЛОТЫ (5×3, 10 линий, дикий, фриспины, бонус, риск) ================= */
  const SE = SlotEngine, SYM = SE.SYMS;
  const slotGrid = $('slotGrid'), svg = $('lineSvg');
  const cells = [];                                          // cells[reel][row]
  for (let r = 0; r < 5; r++) {
    const col = document.createElement('div'); col.className = 'rcol'; cells[r] = [];
    for (let w = 0; w < 3; w++) { const d = document.createElement('div'); d.className = 'sc'; col.appendChild(d); cells[r][w] = d; }
    slotGrid.appendChild(col);
  }
  const sym = k => Art.html('fruit', k) || SYM[k].e;
  const showGrid = g => g.forEach((col, r) => col.forEach((k, w) => cells[r][w].innerHTML = sym(k)));
  showGrid(SE.spinGrid());
  for (let i = 1; i <= 10; i++) $('slotLines').add(new Option(i, i));
  $('slotLines').value = 10;
  [1, 2, 5, 10, 25, 50].forEach(v => $('slotBet').add(new Option(v, v)));
  const LINE_COLORS = ['#ff5252','#40c4ff','#69f0ae','#ffd740','#e040fb','#ff6e40','#18ffff','#b2ff59','#ff4081','#7c4dff'];
  $('fsm').textContent = SE.FS_MULT;
  $('payTable').innerHTML = '<table><tr><th></th><th>×3</th><th>×4</th><th>×5</th></tr>' +
    Object.entries(SYM).filter(([, s]) => s.pay).reverse().map(([k, s]) => `<tr><td>${sym(k)}</td>${s.pay.map(p => `<td>×${p}</td>`).join('')}</tr>`).join('') +
    '</table><small>множители от ставки на линию</small>';

  const slotTotal = () => +$('slotLines').value * +$('slotBet').value;
  const updTotal = () => $('slotTotal').textContent = slotTotal();
  $('slotLines').onchange = $('slotBet').onchange = updTotal; updTotal();

  let slotBusy = false, autoOn = false, freeSpins = 0, fsWin = 0, cycleId = 0, gamble = null;

  function clearWins() {
    cycleId++; svg.style.transition = 'opacity .22s'; svg.style.opacity = 0; setTimeout(() => { svg.innerHTML = ''; svg.style.opacity = 1; }, 230);
    cells.flat().forEach(c => c.classList.remove('hit'));
  }
  function drawLine(li, n) {
    const W = 560, H = 340, cw = W / 5, rh = H / 3;
    const pts = SE.LINES[li].slice(0, n).map((row, r) => `${(r + .5) * cw},${(row + .5) * rh}`).join(' ');
    svg.innerHTML = `<polyline points="${pts}" fill="none" stroke="${LINE_COLORS[li]}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round" opacity=".85"/>`;
  }
  async function cycleWins(res) {            // по очереди подсвечиваем выигрышные линии
    const id = ++cycleId; if (!res.wins.length) return;
    while (id === cycleId) {
      for (const w of res.wins) {
        if (id !== cycleId) return;
        cells.flat().forEach(c => c.classList.remove('hit'));
        w.cells.forEach(([r, row]) => cells[r][row].classList.add('hit')); drawLine(w.line, w.count);
        await sleep(1100);
      }
    }
  }
  function updFsBanner() {
    const b = $('fsBanner');
    b.style.display = freeSpins > 0 || fsWin > 0 ? 'block' : 'none';
    b.textContent = `🎁 БЕСПЛАТНЫЕ ВРАЩЕНИЯ: осталось ${freeSpins} · множитель ×${SE.FS_MULT} · выиграно ${fmt(fsWin)} ₽`;
  }
  async function animateSpin(grid) {
    const cols = [...slotGrid.querySelectorAll('.rcol')], keys = Object.keys(SYM);
    await Promise.all(cols.map((col, r) => Anim.reelSpin(col, {
      count: 10 + r * 4, ms: 900 + r * 260, delay: r * 90, final: grid[r],
      rand: () => keys[rnd(keys.length)], fill: (el, k) => { el.innerHTML = sym(k); },
      commit: () => grid[r].forEach((k, w) => cells[r][w].innerHTML = sym(k)),
    })));
  }

  // В авто-режиме кнопки не «мигают» между спинами: блокировка снимается только при остановке
  const lock = () => { $('spin').disabled = true; $('slotLines').disabled = $('slotBet').disabled = true; };
  const unlock = () => { if (!gamble) $('spin').disabled = false; $('slotLines').disabled = $('slotBet').disabled = false; };
  async function doSpin() {
    if (slotBusy) return;
    const isFree = freeSpins > 0, lines = +$('slotLines').value, lineBet = +$('slotBet').value, total = slotTotal();
    if (gamble) takeGamble();
    if (!isFree) { if (total > Casino.balance) { autoOn = false; ap.cancel(); unlock(); return msg($('slotMsg'), 'Недостаточно средств', 'lose'); } setBalance(Casino.balance - total); }
    else freeSpins--;
    slotBusy = true; lock();
    clearWins(); updFsBanner(); if (!autoOn) msg($('slotMsg'), isFree ? 'Бесплатное вращение…' : 'Крутим…');
    const grid = SE.spinGrid();
    await animateSpin(grid);
    const res = SE.evaluate(grid, lines, lineBet), mult = isFree ? SE.FS_MULT : 1;
    let win = res.lineWin * mult + res.scatterWin, text = [];
    if (res.wins.length) text.push(`Линий: ${res.wins.length}`);
    if (mult > 1 && res.lineWin) text.push(`×${mult}`);
    if (res.scatterWin) { text.push(`🎁 ×${res.scatters}: +${res.scatterWin}`); res.scatterCells.forEach(([r, w]) => cells[r][w].classList.add('hit')); }
    if (res.freeSpins) {
      const add = isFree ? SE.RETRIGGER : res.freeSpins; freeSpins += add;
      text.push(`+${add} бесплатных вращений!`);
    }
    if (win) { setBalance(Casino.balance + win); if (isFree) fsWin += win; Anim.winFx(win, total); }
    updFsBanner();
    msg($('slotMsg'), win ? `${text.join(' · ')} — выигрыш ${fmt(win)} ₽` : (text.join(' · ') || 'Не повезло, крутите ещё'), win ? 'win' : 'lose');
    cycleWins(res);
    if (res.bonus) { res.bonusCells.forEach(([r, w]) => cells[r][w].classList.add('hit')); await sleep(900); await chestBonus(total); }
    if (isFree && freeSpins === 0) {
      msg($('slotMsg'), `Бесплатные вращения окончены! Итого выиграно: ${fmt(fsWin)} ₽`, 'win'); fsWin = 0; await sleep(1500); updFsBanner();
    }
    slotBusy = false; if (!autoOn) unlock();
    if (win && !isFree && !res.bonus) offerGamble(win);
    else if (!isFree) hideGambleBtns();
    if (freeSpins > 0) { await sleep(900); doSpin(); }
    else if (autoOn && !gamble && ap.after(win, total)) { await sleep(win ? 1500 : 450); if (autoOn) doSpin(); }
  }
  $('spin').onclick = () => { autoOn = false; ap.cancel(); doSpin(); };
  const ap = SlotUI.auto($('auto'), { start: () => { autoOn = true; if (!slotBusy) doSpin(); }, stop: () => { autoOn = false; if (!slotBusy) unlock(); } });

  /* --- Риск-игра --- */
  function hideGambleBtns() { $('gambleBtn').style.display = $('collectBtn').style.display = 'none'; }
  let lastWin = 0;
  function offerGamble(win) {
    lastWin = win; $('gambleBtn').style.display = $('collectBtn').style.display = 'inline-block';
    if (autoOn) { hideGambleBtns(); }
  }
  $('collectBtn').onclick = hideGambleBtns;
  $('gambleBtn').onclick = () => {
    if (slotBusy || !lastWin) return;
    setBalance(Casino.balance - lastWin);                       // выигрыш ставится на кон
    gamble = { amt: lastWin, step: 0 }; hideGambleBtns();
    $('gamblePanel').style.display = 'block'; drawGamble(); $('spin').disabled = true;
  };
  function drawGamble() { $('gAmt').textContent = fmt(gamble.amt); $('gStep').textContent = gamble.step; }
  function takeGamble() {
    if (!gamble) return;
    setBalance(Casino.balance + gamble.amt); msg($('slotMsg'), `Забрано ${fmt(gamble.amt)} ₽`, 'win');
    gamble = null; $('gamblePanel').style.display = 'none'; $('spin').disabled = false; lastWin = 0;
  }
  function guess(color) {
    if (!gamble) return;
    const card = Math.random() < .5 ? 'red' : 'black';
    if (card === color) {
      gamble.amt *= 2; gamble.step++;
      msg($('slotMsg'), `Угадали! Карта ${card === 'red' ? '♥ красная' : '♠ чёрная'}. Выигрыш ${fmt(gamble.amt)} ₽`, 'win');
      if (gamble.step >= 5) return takeGamble();
      drawGamble();
    } else {
      msg($('slotMsg'), `Не угадали: ${card === 'red' ? '♥ красная' : '♠ чёрная'}. Выигрыш потерян.`, 'lose');
      gamble = null; lastWin = 0; $('gamblePanel').style.display = 'none'; $('spin').disabled = false;
    }
  }
  $('gRed').onclick = () => guess('red'); $('gBlack').onclick = () => guess('black');
  $('gTake').onclick = takeGamble;

  /* --- Бонус «Сундуки» --- */
  function chestBonus(total) {
    return new Promise(resolve => {
      const prizes = SE.shuffledChests(); let left = 3, sum = 0;
      const box = $('chests'); box.innerHTML = ''; $('chestLeft').textContent = left; $('chestPanel').style.display = 'block';
      prizes.forEach(p => {
        const b = document.createElement('button'); b.className = 'chest'; b.textContent = '🧰';
        b.onclick = () => {
          if (b.classList.contains('open') || left === 0) return;
          left--; b.classList.add('open'); b.textContent = '×' + p; sum += p * total; $('chestLeft').textContent = left;
          if (left === 0) setTimeout(() => {
            setBalance(Casino.balance + sum); $('chestPanel').style.display = 'none';
            msg($('slotMsg'), `💰 Бонус: выигрыш ${fmt(sum)} ₽!`, 'win'); resolve();
          }, 1200);
        };
        box.appendChild(b);
      });
    });
  }

})();
