// Big Bass-style: рыбак собирает денежных рыб, фриспины с уровнями
const BassEngine = (() => {
  const SYMS = {
    R: { e: '🎣', pay: [10, 75, 300] }, T: { e: '🧰', pay: [8, 50, 200] },
    F: { e: '🐸', pay: [6, 40, 150] },  D: { e: '🦆', pay: [5, 25, 100] },
    A: { e: 'A', pay: [3, 12, 50] },    K: { e: 'K', pay: [3, 12, 50] },
    Q: { e: 'Q', pay: [2, 10, 40] },    J: { e: 'J', pay: [2, 10, 40] },
    W: { e: '🧔' },                     // рыбак: дикий и «сборщик» (только барабан 5)
    S: { e: '⚓' },                     // скаттер
    M: { e: '🐟' },                     // денежная рыба (значение × общая ставка)
  };
  const LINES = [
    [1,1,1,1,1], [0,0,0,0,0], [2,2,2,2,2], [0,1,2,1,0], [2,1,0,1,2],
    [0,0,1,2,2], [2,2,1,0,0], [1,0,0,0,1], [1,2,2,2,1], [0,1,1,1,0],
  ];
  const W = { R: 4, T: 5, F: 6, D: 7, A: 10, K: 10, Q: 12, J: 12, S: 2.5, M: 5.4 };
  const W5 = { ...W, W: 3 };                              // на 5-м барабане добавляется рыбак
  const FISH = [[2, 30], [3, 22], [4, 16], [5, 12], [10, 8], [15, 5], [20, 3], [25, 2], [50, 1]];   // × общая ставка
  const SCATTER_PAY = { 3: 2, 4: 10, 5: 50 }, START_FS = { 3: 10, 4: 15, 5: 20 }, RETRIGGER = 10;
  const LEVELS = [[4, 2], [8, 3], [12, 10]];              // собрано рыбаков → множитель рыбы и +10 вращений

  const wpick = arr => { let t = 0; for (const [, w] of arr) t += w; let r = Math.random() * t; for (const [v, w] of arr) if ((r -= w) < 0) return v; return arr[0][0]; };
  const kpick = w => { let t = 0; for (const k in w) t += w[k]; let r = Math.random() * t; for (const k in w) if ((r -= w[k]) < 0) return k; };
  const cell = reel => { const k = kpick(reel === 4 ? W5 : W); return k === 'M' ? { s: 'M', v: wpick(FISH) } : { s: k }; };
  const spinGrid = () => Array.from({ length: 5 }, (_, r) => [cell(r), cell(r), cell(r)]);

  function lineWins(grid, lines, lineBet) {
    const wins = []; let sum = 0;
    for (let li = 0; li < lines; li++) {
      const syms = LINES[li].map((row, r) => grid[r][row].s);
      let sym = null, n = 0;
      for (const s of syms) {
        if (s === 'W') { n++; continue; }
        if (s === 'S' || s === 'M') break;
        if (sym === null) sym = s;
        if (s === sym) n++; else break;
      }
      if (n < 3 || sym === null) continue;
      const win = SYMS[sym].pay[n - 3] * lineBet; sum += win;
      wins.push({ line: li, sym, count: n, win, cells: LINES[li].slice(0, n).map((row, r) => [r, row]) });
    }
    return { wins, sum };
  }
  // fishMult — множитель денежной рыбы (во фриспинах растёт с числом собранных рыбаков)
  function spin(lines, lineBet, fishMult = 1) {
    const grid = spinGrid(), total = lines * lineBet, l = lineWins(grid, lines, lineBet);
    const wildRows = grid[4].map((c, i) => c.s === 'W' ? i : -1).filter(i => i >= 0);
    const fish = []; grid.forEach((col, r) => col.forEach((c, w) => c.s === 'M' && fish.push({ r, w, v: c.v })));
    const fishSum = fish.reduce((a, f) => a + f.v, 0);
    const collect = wildRows.length && fish.length ? wildRows.length * fishSum * total * fishMult : 0;
    const scat = grid.flat().filter(c => c.s === 'S').length;
    const scatCells = []; if (scat >= 3) grid.forEach((col, r) => col.forEach((c, w) => c.s === 'S' && scatCells.push([r, w])));
    return { grid, wins: l.wins, lineWin: l.sum, wilds: wildRows.length, wildRows, fish, fishSum, collect,
             scatters: scat, scatCells, scatWin: scat >= 3 ? SCATTER_PAY[Math.min(scat, 5)] * total : 0,
             fs: scat >= 3 ? START_FS[Math.min(scat, 5)] : 0, total: l.sum + collect + (scat >= 3 ? SCATTER_PAY[Math.min(scat, 5)] * total : 0) };
  }
  // Состояние фриспинов: считаем рыбаков, повышаем уровень
  function fsLevel(collected) { let lvl = 0, mult = 1; LEVELS.forEach(([n, m], i) => { if (collected >= n) { lvl = i + 1; mult = m; } }); return { lvl, mult }; }
  function simulate(n, lines = 10, lineBet = 1) {
    let cost = 0, won = 0, fsTrig = 0; const total = lines * lineBet;
    for (let i = 0; i < n; i++) {
      cost += total; let r = spin(lines, lineBet); won += r.total;
      if (r.fs) {
        fsTrig++; let left = r.fs, coll = 0, lv = 0;
        while (left-- > 0) {
          const { mult } = fsLevel(coll); r = spin(lines, lineBet, mult); won += r.total; coll += r.wilds;
          const nl = fsLevel(coll).lvl; if (nl > lv) { left += RETRIGGER * (nl - lv); lv = nl; }
          if (r.fs) left += RETRIGGER;
        }
      }
    }
    return { rtp: +(won / cost).toFixed(4), fs: fsTrig / n };
  }
  return { SYMS, LINES, LEVELS, RETRIGGER, spin, fsLevel, simulate };
})();

(() => {
  const { $, rnd, sleep, msg, fmt, setBalance } = Casino;
  const BE = BassEngine, SYM = BE.SYMS;
  const cells = [], grid5 = $('bbGrid'), svg = $('bbSvg');
  for (let r = 0; r < 5; r++) {
    const col = document.createElement('div'); col.className = 'rcol'; cells[r] = [];
    for (let w = 0; w < 3; w++) { const d = document.createElement('div'); d.className = 'sc'; col.appendChild(d); cells[r][w] = d; }
    grid5.appendChild(col);
  }
  function fillEl(el, c) {                                    // c — ячейка вида { s, v }
    const k = c.s;
    el.classList.toggle('letter', 'AKQJ'.includes(k)); el.classList.toggle('fish', k === 'M'); el.classList.toggle('fisher', k === 'W');
    if (k === 'M') el.innerHTML = `${Art.html('bass', 'M')}<b class="fv">×${c.v}</b>`; else if ('AKQJ'.includes(k)) el.textContent = k; else el.innerHTML = Art.html('bass', k) || SYM[k].e;
  }
  const put = (r, w, c) => fillEl(cells[r][w], c);
  const show = g => g.forEach((col, r) => col.forEach((c, w) => put(r, w, c)));
  show(BE.spin(10, 1).grid);
  for (let i = 1; i <= 10; i++) $('bbLines').add(new Option(i, i)); $('bbLines').value = 10;
  [1, 2, 5, 10, 25, 50].forEach(v => $('bbBet').add(new Option(v, v)));
  const COLORS = ['#ff5252','#40c4ff','#69f0ae','#ffd740','#e040fb','#ff6e40','#18ffff','#b2ff59','#ff4081','#7c4dff'];
  $('bbPay').innerHTML = '<table><tr><th></th><th>×3</th><th>×4</th><th>×5</th></tr>' +
    Object.entries(SYM).filter(([, s]) => s.pay).map(([k, s]) => `<tr><td>${'AKQJ'.includes(k) ? k : Art.html('bass', k)}</td>${s.pay.map(p => `<td>×${p}</td>`).join('')}</tr>`).join('') + '</table><small>множители от ставки на линию</small>';
  const total = () => +$('bbLines').value * +$('bbBet').value;
  const upd = () => $('bbTotal').textContent = total();
  $('bbLines').onchange = $('bbBet').onchange = upd; upd();

  let busy = false, auto = false, cycle = 0, freeLeft = 0, coll = 0, lvl = 0, fsSum = 0;
  const clear = () => { cycle++; svg.style.transition = 'opacity .22s'; svg.style.opacity = 0; setTimeout(() => { svg.innerHTML = ''; svg.style.opacity = 1; }, 230); cells.flat().forEach(c => c.classList.remove('hit')); };
  function drawLine(li, n) {
    const W = 560, H = 340, cw = W / 5, rh = H / 3;
    svg.innerHTML = `<polyline points="${BE.LINES[li].slice(0, n).map((row, r) => `${(r + .5) * cw},${(row + .5) * rh}`).join(' ')}" fill="none" stroke="${COLORS[li]}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round" opacity=".85"/>`;
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
    const b = $('bbFs'); b.style.display = freeLeft > 0 ? 'block' : 'none';
    b.textContent = `🎣 ФРИСПИНЫ: осталось ${freeLeft} · рыбаков собрано ${coll} · множитель рыбы ×${BE.fsLevel(coll).mult} · выиграно ${fmt(fsSum)} ₽`;
  }
  async function animate(g) {
    const cols = [...grid5.querySelectorAll('.rcol')], keys = ['R', 'T', 'F', 'D', 'A', 'K', 'Q', 'J', 'S', 'W', 'M'];
    await Promise.all(cols.map((col, r) => Anim.reelSpin(col, {
      count: 10 + r * 4, ms: 900 + r * 260, delay: r * 90, final: g[r],
      rand: () => { const k = keys[rnd(keys.length)]; return k === 'M' ? { s: 'M', v: [2, 3, 5, 10][rnd(4)] } : { s: k }; }, fill: fillEl,
      commit: () => g[r].forEach((c, w) => put(r, w, c)),
    })));
  }
  const lock = () => { $('bbSpin').disabled = true; $('bbLines').disabled = $('bbBet').disabled = true; };
  const unlock = () => { $('bbSpin').disabled = false; $('bbLines').disabled = $('bbBet').disabled = false; };
  async function doSpin() {
    if (busy) return; const free = freeLeft > 0, lines = +$('bbLines').value, lineBet = +$('bbBet').value, tot = total();
    if (!free) {
      if (tot > Casino.balance) { auto = false; $('bbAuto').textContent = 'Авто: выкл'; unlock(); return msg($('bbMsg'), 'Недостаточно средств', 'lose'); }
      setBalance(Casino.balance - tot);
    } else freeLeft--;
    busy = true; lock();
    clear(); banner(); if (!auto) msg($('bbMsg'), free ? 'Бесплатное вращение…' : 'Забрасываем удочку…');
    const r = BE.spin(lines, lineBet, free ? BE.fsLevel(coll).mult : 1);
    await animate(r.grid);
    const text = []; let started = false;
    if (r.wins.length) text.push(`Линий: ${r.wins.length}`);
    if (r.collect) {                                          // рыбак собирает всю рыбу на экране
      r.wildRows.forEach(w => cells[4][w].classList.add('hit')); r.fish.forEach(f => cells[f.r][f.w].classList.add('hit'));
      text.push(`🧔 собрал 🐟 ×${fmt(r.fishSum * r.wilds * (free ? BE.fsLevel(coll).mult : 1))}: +${fmt(r.collect)} ₽`); await sleep(900);
    }
    if (r.scatWin) { text.push(`⚓ ×${r.scatters}: +${r.scatWin}`); r.scatCells.forEach(([a, b]) => cells[a][b].classList.add('hit')); }
    if (free) {
      coll += r.wilds; const nl = BE.fsLevel(coll).lvl;
      if (nl > lvl) { freeLeft += BE.RETRIGGER * (nl - lvl); text.push(`Уровень ${nl}! Рыба ×${BE.fsLevel(coll).mult}, +${BE.RETRIGGER} вращений`); lvl = nl; }
      if (r.fs) { freeLeft += BE.RETRIGGER; text.push(`+${BE.RETRIGGER} фриспинов (⚓)`); }
    } else if (r.fs) { freeLeft = r.fs; coll = 0; lvl = 0; fsSum = 0; started = true; text.push(`${r.fs} фриспинов!`); }
    if (r.total) { setBalance(Casino.balance + r.total); Anim.winFx(r.total, tot); }
    if (free) fsSum += r.total;
    banner();
    msg($('bbMsg'), r.total ? `${text.join(' · ')} — выигрыш ${fmt(r.total)} ₽` : (text.join(' · ') || 'Не повезло, забрасывайте снова'), r.total ? 'win' : 'lose');
    cycleWins(r.wins);
    if (free && freeLeft === 0) { await sleep(1200); msg($('bbMsg'), `Бонус окончен! Итого во фриспинах: ${fmt(fsSum)} ₽`, 'win'); fsSum = 0; coll = 0; lvl = 0; banner(); }
    busy = false; if (!auto) unlock();
    if (freeLeft > 0) { await sleep(started ? 2200 : 1400); doSpin(); }
    else if (auto) { await sleep(r.total ? 1500 : 450); if (auto) doSpin(); }
  }
  $('bbSpin').onclick = () => { auto = false; $('bbAuto').textContent = 'Авто: выкл'; doSpin(); };
  $('bbAuto').onclick = () => { auto = !auto; $('bbAuto').textContent = 'Авто: ' + (auto ? 'вкл' : 'выкл'); if (auto && !busy) doSpin(); else if (!auto && !busy) unlock(); };
})();
