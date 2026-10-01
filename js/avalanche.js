// Лавина (в стиле Gonzo's Quest): выигравшие камни рассыпаются, множитель растёт с каждой лавиной
const AvalancheEngine = (() => {
  // Каменные маски разных цветов (как в лавинных слотах): от старших к младшим
  const SYMS = {
    gold:   { e: '🟨', pay: [25, 100, 500] }, grey:  { e: '⬜', pay: [15, 50, 250] },
    teal:   { e: '🟩', pay: [10, 25, 100] },  red:   { e: '🟥', pay: [5, 15, 50] },
    purple: { e: '🟪', pay: [4, 10, 40] },    blue:  { e: '🟦', pay: [3, 7, 25] },
    W: { e: '❓' }, F: { e: '🌀' },
  };
  const LINES = [
    [1,1,1,1,1], [0,0,0,0,0], [2,2,2,2,2], [0,1,2,1,0], [2,1,0,1,2],
    [0,0,1,2,2], [2,2,1,0,0], [1,0,0,0,1], [1,2,2,2,1], [0,1,1,1,0],
  ];
  const PAY_SCALE = 0.77;
  const W = { gold: 3, grey: 5, teal: 7, red: 10, purple: 12, blue: 14, W: 2.5 };
  const SCAT_W = 2.6;                                     // скаттер только на барабанах 1–3
  const MULTS = [1, 2, 3, 5], FS_MULTS = [3, 6, 9, 15], FS = 10;
  for (const k in SYMS) if (SYMS[k].pay) SYMS[k].pay = SYMS[k].pay.map(p => p * PAY_SCALE);
  const kpick = w => { let t = 0; for (const k in w) t += w[k]; let r = Math.random() * t; for (const k in w) if ((r -= w[k]) < 0) return k; };
  const cell = (reel, scatter) => { const w = scatter && reel <= 2 ? { ...W, F: SCAT_W } : W; return { s: kpick(w) }; };
  const newGrid = () => Array.from({ length: 5 }, (_, r) => [cell(r, true), cell(r, true), cell(r, true)]);

  function lineWins(grid, lineBet) {
    const wins = [];
    for (let li = 0; li < LINES.length; li++) {
      const syms = LINES[li].map((row, r) => grid[r][row].s);
      let sym = null, n = 0;
      for (const s of syms) { if (s === 'W') { n++; continue; } if (s === 'F') break; if (sym === null) sym = s; if (s === sym) n++; else break; }
      if (n < 3) continue; if (sym === null) sym = 'gold';
      wins.push({ line: li, sym, count: n, win: SYMS[sym].pay[n - 3] * lineBet, cells: LINES[li].slice(0, n).map((row, r) => [r, row]) });
    }
    return wins;
  }
  function avalanche(grid, wins) {                        // выигравшие камни рассыпаются, сверху падают новые
    const dead = new Set(wins.flatMap(w => w.cells.map(([r, i]) => r + ',' + i)));
    return grid.map((col, r) => {
      const keep = col.filter((x, i) => !dead.has(r + ',' + i));
      return Array.from({ length: 3 - keep.length }, () => cell(r, false)).concat(keep);
    });
  }
  function spin(lineBet, free = false) {
    let grid = newGrid(); const grids = [grid], steps = []; let total = 0, k = 0;
    const scat = grid.slice(0, 3).flat().filter(x => x.s === 'F').length;
    for (;;) {
      const wins = lineWins(grid, lineBet), mults = free ? FS_MULTS : MULTS, mult = mults[Math.min(k, 3)];
      steps.push({ wins, mult }); if (!wins.length) break;
      total += wins.reduce((a, w) => a + w.win, 0) * mult; k++;
      grid = avalanche(grid, wins); grids.push(grid);
    }
    return { grids, steps, total, scatters: scat, fs: scat >= 3 ? FS : 0 };
  }
  function simulate(n, lineBet = 1) {
    let cost = 0, won = 0, trig = 0; const tb = lineBet * LINES.length;
    for (let i = 0; i < n; i++) {
      cost += tb; let r = spin(lineBet); won += r.total;
      if (r.fs) { trig++; let left = r.fs; while (left-- > 0) { r = spin(lineBet, true); won += r.total; if (r.fs) left += r.fs; } }
    }
    return { rtp: +(won / cost).toFixed(4), fs: trig / n };
  }
  return { SYMS, LINES, MULTS, FS_MULTS, FS, spin, simulate };
})();

(() => {
  const { $, sleep, msg, fmt, setBalance } = Casino;
  const AE = AvalancheEngine, SYM = AE.SYMS;
  const gridEl = $('gzGrid'), svg = $('gzSvg'), cells = [];
  for (let r = 0; r < 5; r++) {
    const col = document.createElement('div'); col.className = 'gzcol'; cells[r] = [];
    for (let w = 0; w < 3; w++) { const d = document.createElement('div'); d.className = 'oc'; col.appendChild(d); cells[r][w] = d; }
    gridEl.appendChild(col);
  }
  function render(g, drop, prev) {
    const dy = drop ? (prev ? Anim.dropDiff(prev, g) : g.map(col => col.map(() => 4))) : null;
    g.forEach((col, r) => col.forEach((x, w) => {
      const el = cells[r][w], d = dy ? dy[r][w] : 0;
      el.className = 'oc' + (x.s === 'F' ? ' scatter' : '') + (d ? ' drop' : '');
      if (d) { el.style.setProperty('--dy', d); el.style.setProperty('--d', (prev ? r * 0.015 : r * 0.07 + (2 - w) * 0.04) + 's'); }
      el.innerHTML = Art.html('stone', x.s);
    }));
  }
  render(AE.spin(1).grids[0], false);
  [1, 2, 5, 10, 25, 50].forEach(v => $('gzBet').add(new Option(v, v)));
  $('gzPay').innerHTML = SlotUI.payTable(SYM, k => Art.html('stone', k), 'множители от ставки на линию · 10 линий');
  const total = () => +$('gzBet').value * AE.LINES.length;
  const upd = () => $('gzTotal').textContent = total(); $('gzBet').onchange = upd; upd();

  function multBar(free, k) {                     // подсветка текущего множителя лавины
    const arr = free ? AE.FS_MULTS : AE.MULTS;
    $('gzMults').innerHTML = arr.map((m, i) => `<span class="${i === Math.min(k, 3) ? 'on' : ''}">×${m}</span>`).join('');
  }
  multBar(false, 0);
  async function exitGrid() {
    if (Anim.reduce()) return;
    cells.forEach((col, r) => col.forEach((el, w) => { el.style.setProperty('--d', (r * 0.04 + (2 - w) * 0.02) + 's'); el.classList.add('exit'); }));
    await sleep(450);
  }
  function drawLines(wins) {
    const cw = 560 / 5, rh = 340 / 3;
    svg.innerHTML = wins.map(w => `<polyline class="wline" points="${AE.LINES[w.line].slice(0, w.count).map((row, r) => `${(r + .5) * cw},${(row + .5) * rh}`).join(' ')}" fill="none" stroke="${SlotUI.COLORS[w.line]}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round" opacity=".9"/>`).join('');
  }
  let busy = false, auto = false, freeLeft = 0, fsSum = 0;
  const lock = () => { $('gzSpin').disabled = $('gzBet').disabled = true; };
  const unlock = () => { $('gzSpin').disabled = $('gzBet').disabled = false; };
  function banner() { const b = $('gzFs'); b.style.display = freeLeft > 0 || fsSum ? 'block' : 'none'; b.textContent = `🌀 FREE FALLS: осталось ${freeLeft} · множители ×3/×6/×9/×15 · выиграно ${fmt(fsSum)} ₽`; }

  async function playSpin(r, free) {
    let acc = 0; Anim.countTo($('gzWin'), 0, 200); multBar(free, 0);
    await exitGrid(); render(r.grids[0], true); await sleep(800);
    for (let i = 0; i < r.steps.length; i++) {
      const { wins, mult } = r.steps[i]; if (!wins.length) break;
      multBar(free, i);
      wins.forEach(w => w.cells.forEach(([a, b]) => cells[a][b].classList.add('hit'))); drawLines(wins);
      const step = wins.reduce((s, w) => s + w.win, 0) * mult; acc += step; Anim.countTo($('gzWin'), fmt(acc), 500);
      msg($('gzMsg'), `Лавина ${i + 1}: ${wins.length} лин. × ${mult} = ${fmt(step)} ₽`, 'win');
      await sleep(1000); svg.innerHTML = '';
      wins.forEach(w => w.cells.forEach(([a, b]) => cells[a][b].classList.add('pop', 'crumble'))); await sleep(420);
      render(r.grids[i + 1], true, r.grids[i]); multBar(free, i + 1); await sleep(650);
    }
  }
  async function doSpin() {
    if (busy) return; const free = freeLeft > 0, lineBet = +$('gzBet').value, tot = total();
    if (!free) {
      if (tot > Casino.balance) { auto = false; ap.cancel(); unlock(); return msg($('gzMsg'), 'Недостаточно средств', 'lose'); }
      setBalance(Casino.balance - tot);
    } else freeLeft--;
    busy = true; lock(); banner();
    if (!auto && !free) msg($('gzMsg'), 'Камни падают…');
    const r = AE.spin(lineBet, free);
    await playSpin(r, free);
    if (r.total) setBalance(Casino.balance + r.total);
    if (free) fsSum += r.total;
    if (!r.total) msg($('gzMsg'), 'Без выигрыша', 'lose'); else msg($('gzMsg'), `Выигрыш: ${fmt(r.total)} ₽`, 'win');
    if (r.fs) {
      cells.flat().forEach((el, i) => { if (el.classList.contains('scatter')) el.classList.add('hit'); });
      if (!free) { freeLeft = r.fs; fsSum = 0; } else freeLeft += r.fs;
      msg($('gzMsg'), `🌀 ${free ? '+' : ''}${r.fs} FREE FALLS!`, 'win'); banner(); await sleep(1600);
    }
    if (free && freeLeft === 0) { msg($('gzMsg'), `Free Falls окончены: ${fmt(fsSum)} ₽`, 'win'); Anim.winFx(fsSum, tot); fsSum = 0; await sleep(1200); banner(); }
    else if (!free && r.total && !r.fs) Anim.winFx(r.total, tot);
    busy = false;
    if (freeLeft > 0) { await sleep(700); await Casino.whenActive('avalanche'); doSpin(); return; }
    multBar(false, 0);
    if (!auto) unlock();
    if (auto && ap.after(r.total, tot)) { await sleep(r.total ? 1100 : 350); if (auto) doSpin(); }
  }
  $('gzSpin').onclick = () => { auto = false; ap.cancel(); doSpin(); };
  const ap = SlotUI.auto($('gzAuto'), { start: () => { auto = true; if (!busy) doSpin(); }, stop: () => { auto = false; if (!busy) unlock(); } });
})();
