const EgyptEngine = (() => {
  const SYMS = {
    X: { e: '🤠', pay: [30, 150, 1000], rank: 'high' }, S: { e: '🪲', pay: [20, 100, 500], rank: 'high' },
    F: { e: '🦅', pay: [10, 40, 200], rank: 'high' },   U: { e: '⚱️', pay: [8, 30, 150], rank: 'high' },
    A: { e: 'A', pay: [5, 20, 100], rank: 'low' }, K: { e: 'K', pay: [5, 20, 100], rank: 'low' },
    Q: { e: 'Q', pay: [3, 10, 50], rank: 'low' },  J: { e: 'J', pay: [3, 10, 50], rank: 'low' },
    B: { e: '📖' },
  };
  const LINES = [
    [1,1,1,1,1], [0,0,0,0,0], [2,2,2,2,2], [0,1,2,1,0], [2,1,0,1,2],
    [0,0,1,2,2], [2,2,1,0,0], [1,0,0,0,1], [1,2,2,2,1], [0,1,1,1,0],
  ];
  const WEIGHTS = { X: 4, S: 5, F: 7, U: 8, A: 12, K: 12, Q: 14, J: 14, B: 3.1 };
  const BOOK_PAY = { 3: 2, 4: 20, 5: 200 };        // × общая ставка
  const FS = 10;
  const rnd = n => Math.floor(Math.random() * n);
  const keys = Object.keys(WEIGHTS), total = keys.reduce((a, k) => a + WEIGHTS[k], 0);
  const pick = () => { let r = Math.random() * total; for (const k of keys) if ((r -= WEIGHTS[k]) < 0) return k; return 'J'; };
  const spinGrid = () => Array.from({ length: 5 }, () => [pick(), pick(), pick()]);

  function lineWins(grid, lines, lineBet, only, except) {
    const wins = []; let sum = 0;
    for (let li = 0; li < lines; li++) {
      const syms = LINES[li].map((row, r) => grid[r][row]);
      let sym = null, n = 0;
      for (const s of syms) {
        if (s === 'B') { n++; continue; }
        if (sym === null) sym = s;
        if (s === sym) n++; else break;
      }
      if (n < 3) continue; if (sym === null) sym = 'X';
      if (only && sym !== only) continue; if (except && sym === except) continue;
      const win = SYMS[sym].pay[n - 3] * lineBet; sum += win;
      wins.push({ line: li, sym, count: n, win, cells: LINES[li].slice(0, n).map((row, r) => [r, row]) });
    }
    return { wins, sum };
  }
  function bookInfo(grid, total) {
    const cells = []; grid.forEach((col, r) => col.forEach((s, w) => s === 'B' && cells.push([r, w])));
    const n = cells.length;
    return { count: n, cells, win: n >= 3 ? BOOK_PAY[Math.min(n, 5)] * total : 0, fs: n >= 3 ? FS : 0 };
  }
  // Один спин. expand — расширяющийся символ (только во фриспинах)
  function spin(lines, lineBet, expand) {
    const grid = spinGrid(), total = lines * lineBet, book = bookInfo(grid, total);
    let wins, lineWin, expanded = null, grid2 = null;
    if (expand) {
      const reels = grid.map((col, r) => col.includes(expand) ? r : -1).filter(r => r >= 0);
      const need = SYMS[expand].rank === 'high' ? 2 : 3;
      if (reels.length >= need) {
        grid2 = grid.map((col, r) => reels.includes(r) ? [expand, expand, expand] : col.slice());
        const a = lineWins(grid, lines, lineBet, null, expand), b = lineWins(grid2, lines, lineBet, expand);
        wins = a.wins.concat(b.wins); lineWin = a.sum + b.sum; expanded = reels;
      }
    }
    if (!expanded) { const a = lineWins(grid, lines, lineBet); wins = a.wins; lineWin = a.sum; }
    return { grid, grid2, expanded, wins, lineWin, book, total: lineWin + book.win };
  }
  const randomExpand = () => ['X', 'S', 'F', 'U', 'A', 'K', 'Q', 'J'][rnd(8)];
  function simulate(n, lines = 10, lineBet = 1) {
    let cost = 0, won = 0, fsTrig = 0;
    for (let i = 0; i < n; i++) {
      cost += lines * lineBet;
      let r = spin(lines, lineBet); won += r.total;
      if (r.book.fs) {
        fsTrig++; let left = FS; const ex = randomExpand();
        while (left-- > 0) { r = spin(lines, lineBet, ex); won += r.total; if (r.book.fs) left += FS; }
      }
    }
    return { rtp: +(won / cost).toFixed(4), fs: fsTrig / n };
  }
  return { SYMS, LINES, FS, BOOK_PAY, spinGrid, spin, randomExpand, simulate, lineWins };
})();

(() => {
  const { $, rnd, sleep, msg, fmt, setBalance, readBet } = Casino;
  const EE = EgyptEngine, SYM = EE.SYMS;
  const cells = [], grid5 = $('egGrid'), svg = $('egSvg');
  for (let r = 0; r < 5; r++) {
    const col = document.createElement('div'); col.className = 'rcol'; cells[r] = [];
    for (let w = 0; w < 3; w++) { const d = document.createElement('div'); d.className = 'sc'; col.appendChild(d); cells[r][w] = d; }
    grid5.appendChild(col);
  }
  const put = (r, w, k) => { const c = cells[r][w]; if (k.length === 1 && 'AKQJ'.includes(k)) c.textContent = k; else c.innerHTML = Art.html('egypt', k) || SYM[k].e; c.classList.toggle('letter', k.length === 1 && 'AKQJ'.includes(k)); c.classList.toggle('book', k === 'B'); };
  const show = g => g.forEach((col, r) => col.forEach((k, w) => put(r, w, k)));
  show(EE.spinGrid());
  for (let i = 1; i <= 10; i++) $('egLines').add(new Option(i, i)); $('egLines').value = 10;
  [1, 2, 5, 10, 25, 50].forEach(v => $('egBet').add(new Option(v, v)));
  const COLORS = ['#ff5252','#40c4ff','#69f0ae','#ffd740','#e040fb','#ff6e40','#18ffff','#b2ff59','#ff4081','#7c4dff'];
  $('egPay').innerHTML = '<table><tr><th></th><th>×3</th><th>×4</th><th>×5</th></tr>' +
    Object.entries(SYM).filter(([, s]) => s.pay).map(([k, s]) => `<tr><td>${'AKQJ'.includes(k) ? k : Art.html('egypt', k)}</td>${s.pay.map(p => `<td>×${p}</td>`).join('')}</tr>`).join('') + '</table><small>множители от ставки на линию</small>';
  const total = () => +$('egLines').value * +$('egBet').value;
  const upd = () => $('egTotal').textContent = total();
  $('egLines').onchange = $('egBet').onchange = upd; upd();

  let busy = false, auto = false, cycle = 0, freeLeft = 0, fsSum = 0, expandSym = null;
  const clear = () => { cycle++; svg.innerHTML = ''; cells.flat().forEach(c => c.classList.remove('hit')); };
  function drawLine(li, n) {
    const W = 560, H = 340, cw = W / 5, rh = H / 3;
    svg.innerHTML = `<polyline points="${EE.LINES[li].slice(0, n).map((row, r) => `${(r + .5) * cw},${(row + .5) * rh}`).join(' ')}" fill="none" stroke="${COLORS[li]}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round" opacity=".85"/>`;
  }
  async function cycleWins(wins) {
    const id = ++cycle; if (!wins.length) return;
    while (id === cycle) for (const w of wins) {
      if (id !== cycle) return;
      cells.flat().forEach(c => c.classList.remove('hit'));
      w.cells.forEach(([r, row]) => cells[r][row].classList.add('hit')); drawLine(w.line, w.count); await sleep(1000);
    }
  }
  function banner() {
    const b = $('egFs'); b.style.display = freeLeft > 0 ? 'block' : 'none';
    b.textContent = `📖 ФРИСПИНЫ: осталось ${freeLeft} · расширяется ${expandSym ? SYM[expandSym].e : ''} · выиграно ${fmt(fsSum)} ₽`;
  }
  async function animate(g) {
    const cols = grid5.querySelectorAll('.rcol'), keys = Object.keys(SYM);
    cols.forEach(c => c.classList.add('spinning'));
    for (let r = 0; r < 5; r++) {
      const stop = Date.now() + 450 + r * 320;
      while (Date.now() < stop) { for (let a = r; a < 5; a++) cells[a].forEach((_, w) => put(a, w, keys[rnd(keys.length)])); await sleep(70); }
      cols[r].classList.remove('spinning'); g[r].forEach((k, w) => put(r, w, k));
    }
  }
  async function doSpin() {
    if (busy) return; const free = freeLeft > 0, lines = +$('egLines').value, lineBet = +$('egBet').value, tot = total();
    if (!free) {
      if (tot > Casino.balance) { auto = false; $('egAuto').textContent = 'Авто: выкл'; return msg($('egMsg'), 'Недостаточно средств', 'lose'); }
      setBalance(Casino.balance - tot);
    } else { freeLeft--; }
    busy = true; $('egSpin').disabled = true; $('egLines').disabled = $('egBet').disabled = true;
    clear(); banner(); msg($('egMsg'), free ? 'Бесплатное вращение…' : 'Крутим…');
    const r = EE.spin(lines, lineBet, free ? expandSym : null);
    await animate(r.grid);
    let text = [];
    if (r.expanded) {                                  // расширение символа на весь барабан
      r.expanded.forEach(rr => cells[rr].forEach(c => c.classList.add('hit'))); msg($('egMsg'), `${SYM[expandSym].e} расширяется!`, 'win');
      await sleep(900); show(r.grid2); cells.flat().forEach(c => c.classList.remove('hit')); await sleep(300);
    }
    if (r.wins.length) text.push(`Линий: ${r.wins.length}`);
    if (r.book.win) { text.push(`📖 ×${r.book.count}: +${r.book.win}`); r.book.cells.forEach(([a, b]) => cells[a][b].classList.add('hit')); }
    let started = false;
    if (r.book.fs) {
      if (!free) { freeLeft = EE.FS; fsSum = 0; expandSym = EE.randomExpand(); started = true; text.push(`${EE.FS} фриспинов! Расширяется ${SYM[expandSym].e}`); }
      else { freeLeft += EE.FS; text.push(`+${EE.FS} фриспинов!`); }
    }
    if (r.total) setBalance(Casino.balance + r.total);
    if (free) fsSum += r.total;
    banner();
    msg($('egMsg'), r.total ? `${text.join(' · ')} — выигрыш ${fmt(r.total)} ₽` : (text.join(' · ') || 'Не повезло, крутите ещё'), r.total ? 'win' : 'lose');
    cycleWins(r.wins);
    if (free && freeLeft === 0) { await sleep(1200); msg($('egMsg'), `Бонус окончен! Итого во фриспинах: ${fmt(fsSum)} ₽`, 'win'); fsSum = 0; banner(); }
    busy = false; $('egSpin').disabled = false; $('egLines').disabled = $('egBet').disabled = false;
    if (freeLeft > 0) { await sleep(started ? 2200 : 1300); doSpin(); }
    else if (auto) { await sleep(900); if (auto) doSpin(); }
  }
  $('egSpin').onclick = () => { auto = false; $('egAuto').textContent = 'Авто: выкл'; doSpin(); };
  $('egAuto').onclick = () => { auto = !auto; $('egAuto').textContent = 'Авто: ' + (auto ? 'вкл' : 'выкл'); if (auto && !busy) doSpin(); };
})();
