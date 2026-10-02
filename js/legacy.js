// «Наследие» (в стиле Book of Dead / Legacy of Dead): каждый ретриггер добавляет расширяющийся символ
const LegacyEngine = (() => {
  // «Наследие»: книга — дикий и скаттер; во фриспинах расширяющихся символов становится больше с каждым ретриггером
  const SYMS = {
    P: { e: '👑', pay: [50, 250, 2000], rank: 'high' }, N: { e: '🐺', pay: [30, 150, 750], rank: 'high' },
    H: { e: '👁️', pay: [20, 80, 400], rank: 'high' },  S: { e: '🪲', pay: [10, 40, 200], rank: 'high' },
    A: { e: 'A', pay: [5, 20, 100], rank: 'low' }, K: { e: 'K', pay: [5, 20, 100], rank: 'low' },
    Q: { e: 'Q', pay: [3, 10, 50], rank: 'low' },  J: { e: 'J', pay: [3, 10, 50], rank: 'low' }, T: { e: '10', pay: [3, 10, 50], rank: 'low' },
    B: { e: '📖' },
  };
  const LINES = [
    [1,1,1,1,1], [0,0,0,0,0], [2,2,2,2,2], [0,1,2,1,0], [2,1,0,1,2],
    [0,0,1,2,2], [2,2,1,0,0], [1,0,0,0,1], [1,2,2,2,1], [0,1,1,1,0],
  ];
  const PAY_SCALE = 1.58;
  for (const k in SYMS) if (SYMS[k].pay) SYMS[k].pay = SYMS[k].pay.map(p => p * PAY_SCALE);
  const WEIGHTS = { P: 3, N: 4, H: 6, S: 8, A: 11, K: 11, Q: 13, J: 13, T: 14, B: 3.1 };
  const BOOK_PAY = { 3: 2, 4: 20, 5: 200 }, FS = 10;
  const keys = Object.keys(WEIGHTS), total = keys.reduce((a, k) => a + WEIGHTS[k], 0);
  const pick = () => { let r = Math.random() * total; for (const k of keys) if ((r -= WEIGHTS[k]) < 0) return k; return 'T'; };
  const spinGrid = () => Array.from({ length: 5 }, () => [pick(), pick(), pick()]);
  function lineWins(grid, lines, lineBet, only, except) {
    const wins = []; let sum = 0;
    for (let li = 0; li < lines; li++) {
      const syms = LINES[li].map((row, r) => grid[r][row]);
      let sym = null, n = 0;
      for (const s of syms) { if (s === 'B') { n++; continue; } if (sym === null) sym = s; if (s === sym) n++; else break; }
      if (n < 3) continue; if (sym === null) sym = 'P';
      if (only && sym !== only) continue; if (except && except.includes(sym)) continue;
      const win = SYMS[sym].pay[n - 3] * lineBet; sum += win;
      wins.push({ line: li, sym, count: n, win, cells: LINES[li].slice(0, n).map((row, r) => [r, row]) });
    }
    return { wins, sum };
  }
  function bookInfo(grid, tot) {
    const cells = []; grid.forEach((col, r) => col.forEach((s, w) => s === 'B' && cells.push([r, w])));
    const n = cells.length; return { count: n, cells, win: n >= 3 ? BOOK_PAY[Math.min(n, 5)] * tot : 0, fs: n >= 3 ? FS : 0 };
  }
  // expands — массив расширяющихся символов; каждый расширяется и платит отдельно
  function spin(lines, lineBet, expands = []) {
    const grid = spinGrid(), tot = lines * lineBet, book = bookInfo(grid, tot), expansions = [];
    const active = expands.filter(sym => grid.filter(col => col.includes(sym)).length >= (SYMS[sym].rank === 'high' ? 2 : 3));
    const base = lineWins(grid, lines, lineBet, null, active);
    let wins = base.wins, lineWin = base.sum;
    for (const sym of active) {
      const reels = grid.map((col, r) => col.includes(sym) ? r : -1).filter(r => r >= 0);
      const g2 = grid.map((col, r) => reels.includes(r) ? [sym, sym, sym] : col.slice());
      const b = lineWins(g2, lines, lineBet, sym); wins = wins.concat(b.wins); lineWin += b.sum;
      expansions.push({ sym, reels, grid: g2, wins: b.wins, win: b.sum });
    }
    return { grid, expansions, wins, lineWin, book, total: lineWin + book.win };
  }
  const EXP_POOL = ['P', 'N', 'H', 'S', 'A', 'K', 'Q', 'J', 'T'];
  const newExpand = have => { const pool = EXP_POOL.filter(s => !have.includes(s)); return pool[Math.floor(Math.random() * pool.length)]; };
  function simulate(n, lines = 10, lineBet = 1) {
    let cost = 0, won = 0, trig = 0;
    for (let i = 0; i < n; i++) {
      cost += lines * lineBet; let r = spin(lines, lineBet); won += r.total;
      if (r.book.fs) {
        trig++; let left = FS; const ex = [newExpand([])];
        while (left-- > 0) { r = spin(lines, lineBet, ex); won += r.total; if (r.book.fs) { left += FS; const s = newExpand(ex); if (s) ex.push(s); } }
      }
    }
    return { rtp: +(won / cost).toFixed(4), fs: trig / n };
  }
  return { SYMS, LINES, FS, spin, newExpand, simulate };
})();

(() => {
  const { $, sleep, msg, fmt, setBalance } = Casino;
  const LE = LegacyEngine, SYM = LE.SYMS, LOW = ['A', 'K', 'Q', 'J', 'T'];
  const icon = k => LOW.includes(k) ? `<span class="lgl">${SYM[k].e}</span>` : Art.html('legacy', k);
  function fill(el, k) {
    el.className = 'sc' + (LOW.includes(k) ? ' letter' : '') + (k === 'B' ? ' book' : '');
    if (LOW.includes(k)) el.textContent = SYM[k].e; else el.innerHTML = Art.html('legacy', k) || SYM[k].e;
  }
  const keys = Object.keys(SYM);
  const ui = SlotUI.create({ grid: $('lgGrid'), svg: $('lgSvg'), lines: LE.LINES, fill, rand: () => keys[Casino.rnd(keys.length)], tease: { is: k => k === 'B', at: 2 } });
  ui.show(LE.spin(10, 1).grid);
  for (let i = 1; i <= 10; i++) $('lgLines').add(new Option(i, i)); $('lgLines').value = 10;
  [1, 2, 5, 10, 25, 50].forEach(v => $('lgBet').add(new Option(v, v)));
  $('lgPay').innerHTML = SlotUI.payTable(SYM, icon);
  const total = () => +$('lgLines').value * +$('lgBet').value;
  const upd = () => $('lgTotal').textContent = total();
  $('lgLines').onchange = $('lgBet').onchange = upd; upd();

  let busy = false, auto = false, freeLeft = 0, fsSum = 0, expands = [], fsG = 1;
  const FS_TABLE = [[1, 1], [0.5, 2.2], [0.3, 3.6]], BUY = 26, SUPER = 55;
  const choose = () => SlotFX.fsChoice(LE.FS, FS_TABLE, { auto });
  const lock = () => { $('lgSpin').disabled = true; $('lgLines').disabled = $('lgBet').disabled = true; };
  const unlock = () => { $('lgSpin').disabled = false; $('lgLines').disabled = $('lgBet').disabled = false; };
  const fsBar = SlotUI.fsProgress($('lgFs'));
  function banner() {
    const b = $('lgFs'); b.style.display = freeLeft > 0 || fsSum ? 'flex' : 'none'; fsBar.sync(freeLeft, b.style.display === 'flex');
    b.innerHTML = `<span>📖 Фриспины: <b>${freeLeft}</b></span><span class="lgexp">Расширяются: ${expands.map(k => `<i>${icon(k)}</i>`).join('')}</span>${fsG !== 1 ? `<span>Выигрыши <b>×${fsG}</b></span>` : ''}<span>Выиграно: <b>${fmt(fsSum)}</b> ₽</span>`;
  }
  // выбор нового расширяющегося символа — «вращение» книги
  async function pickExpand() {
    const k = LE.newExpand(expands); if (!k) return;
    const box = $('lgPick'), inner = box.querySelector('.lgpicksym'); box.style.display = 'flex';
    const pool = ['P', 'N', 'H', 'S', 'A', 'K', 'Q', 'J', 'T'];
    for (let i = 0; i < 14; i++) { inner.innerHTML = icon(pool[i % pool.length]); inner.classList.remove('tick'); void inner.offsetWidth; inner.classList.add('tick'); await sleep(60 + i * 12); }
    inner.innerHTML = icon(k); inner.classList.add('chosen'); await sleep(1300);
    inner.classList.remove('chosen'); box.style.display = 'none'; expands.push(k); banner();
  }
  async function doSpin() {
    if (busy) return; const free = freeLeft > 0, lines = +$('lgLines').value, lineBet = +$('lgBet').value, tot = total();
    if (!free) {
      if (tot > Casino.balance) { auto = false; ap.cancel(); unlock(); return msg($('lgMsg'), 'Недостаточно средств', 'lose'); }
      setBalance(Casino.balance - tot); SlotFX.jackpot.bet(tot);
    } else freeLeft--;
    busy = true; lock(); ui.clear(); banner();
    if (!auto && !free) msg($('lgMsg'), 'Крутим…');
    const r = LE.spin(lines, lineBet, free ? expands : []);
    await ui.animate(r.grid);
    // сначала обычные выигрыши, затем поочерёдно каждое расширение
    const baseWins = r.wins.filter(w => !r.expansions.some(e => e.wins.includes(w)));
    if (baseWins.length) { baseWins.forEach(w => w.cells.forEach(([a, b]) => ui.cells[a][b].classList.add('hit'))); ui.drawLine(0, 0, baseWins); await sleep(900); ui.clear(); }
    for (const ex of r.expansions) {
      msg($('lgMsg'), 'Символ расширяется…', 'win');
      ex.reels.forEach(rr => ui.cells[rr].forEach((el, w) => { fill(el, ex.sym); el.classList.add('expand'); el.style.setProperty('--d', w * 0.08 + 's'); }));
      await sleep(900);
      if (ex.wins.length) { ui.drawLine(0, 0, ex.wins); msg($('lgMsg'), `Расширение: +${fmt(ex.win)} ₽`, 'win'); }
      await sleep(1300);
      ui.cells.flat().forEach(el => el.classList.remove('expand')); ui.show(r.grid); ui.clear(); await sleep(250);
    }
    const text = [];
    if (r.wins.length) text.push(`Линий: ${r.wins.length}`);
    if (r.book.win) { text.push(`📖 ×${r.book.count}: +${r.book.win}`); r.book.cells.forEach(([a, b]) => ui.cells[a][b].classList.add('hit')); }
    const pay = free ? Math.round(r.total * fsG) : r.total;
    if (free && fsG !== 1 && r.total) text.push(`×${fsG}`);
    if (pay) setBalance(Casino.balance + pay);
    if (free) fsSum += pay;
    msg($('lgMsg'), pay ? `${text.join(' · ')} — выигрыш ${fmt(pay)} ₽` : 'Не повезло, крутите ещё', pay ? 'win' : 'lose');
    if (!r.expansions.length) ui.cycleWins(r.wins);
    if (r.book.fs) {
      await sleep(1200);
      if (!free) { const o = await choose(); await startFs(o, 1); }
      else { freeLeft += LE.FS; msg($('lgMsg'), `📖 +${LE.FS} фриспинов и ещё один расширяющийся символ!`, 'win'); banner(); await pickExpand(); }
    }
    if (free && freeLeft === 0) {
      await sleep(1000); msg($('lgMsg'), `Бонус окончен! Итого во фриспинах: ${fmt(fsSum)} ₽`, 'win');
      Anim.winFx(fsSum, tot); fsSum = 0; expands = []; fsG = 1; banner();
    } else if (!free && r.total && !r.book.fs) Anim.winFx(r.total, tot);
    busy = false;
    if (freeLeft > 0) { await sleep(1100); await Casino.whenActive('legacy'); doSpin(); return; }
    if (!auto) unlock();
    if (auto && ap.after(pay, tot)) { await sleep(pay ? 1500 : 450); if (auto) doSpin(); }
  }
  async function startFs(o, nExp) {                         // nExp — сколько расширяющихся символов выбрать сразу
    freeLeft = o.spins; fsG = o.g; fsSum = 0; expands = []; banner();
    msg($('lgMsg'), `📖 ${o.spins} фриспинов${o.g !== 1 ? ` · выигрыши ×${o.g}` : ''}! Выбираем расширяющийся символ…`, 'win');
    for (let i = 0; i < nExp; i++) await pickExpand();
  }
  const buyBtn = document.createElement('button'); buyBtn.className = 'btn buybtn'; $('lgAuto').after(buyBtn);
  const bm = SlotFX.buyMenu(buyBtn, { bet: total, busy: () => busy || freeLeft > 0,
    items: [{ key: 'bonus', name: 'Бонус', desc: '10 фриспинов с расширяющимся символом — или 5×2.2, 3×3.6', cost: BUY },
            { key: 'super', name: '🔥 Супер-бонус', desc: '10 фриспинов, сразу 3 расширяющихся символа', cost: SUPER }],
    async onBuy(k, price) {
      auto = false; ap.cancel(); setBalance(Casino.balance - price); SlotFX.jackpot.bet(price); busy = true; lock();
      if (k === 'super') await startFs({ spins: 10, g: 1 }, 3); else await startFs(await choose(), 1);
      await sleep(600); busy = false; doSpin();
    } });
  $('lgLines').addEventListener('change', bm.paint); $('lgBet').addEventListener('change', bm.paint);
  $('lgSpin').onclick = () => { auto = false; ap.cancel(); doSpin(); };
  const ap = SlotUI.auto($('lgAuto'), { start: () => { auto = true; if (!busy) doSpin(); }, stop: () => { auto = false; if (!busy) unlock(); } });
})();
