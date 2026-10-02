// Движки новых слотов (чистая логика, выигрыши — в долях общей ставки). Интерфейс — SlotKit.create в kit-slots.js
const { rnd: kRnd, wpick: kPick } = SlotKit;
const kGrid = (C, R, f) => Array.from({ length: C }, (_, c) => Array.from({ length: R }, (_, r) => f(c, r)));

// ===== 1. Космо-кластер: поле 7×7, кластеры от 5, лавины, шкала заряда с эффектами =====
const ClusterEngine = (() => {
  const COLS = 7, ROWS = 7, HIGH = ['red', 'green', 'blue', 'purple'], LOW = ['c1', 'c2', 'c3'], SYMS = [...HIGH, ...LOW];
  const W = { red: 9, green: 10, blue: 11, purple: 12, c1: 15, c2: 16, c3: 17 }, SC_P = 0.008;
  const BASE = { red: 1, green: 0.7, blue: 0.5, purple: 0.4, c1: 0.25, c2: 0.2, c3: 0.15 };
  const CURVE = [1, 1.4, 2, 2.7, 3.5, 5, 7, 10, 14, 20, 40];
  const LEVELS = [15, 30, 45], FS = { 3: 10, 4: 12, 5: 15 };
  const E = { COLS, ROWS, SCALE: 5.06, FS_BUY: 10, MAX_WIN: 5000, LEVELS, SYMS };
  const pay = (s, n) => BASE[s] * CURVE[Math.min(n, 15) - 5] * E.SCALE;
  const cell = sc => sc && Math.random() < SC_P ? { s: 'S' } : { s: kPick(W) };
  E.randCell = () => cell(true);
  function tumble(grid, dead) {
    return grid.map((col, c) => { const keep = col.filter((x, r) => !dead.has(c + ',' + r)); return Array.from({ length: ROWS - keep.length }, () => cell(false)).concat(keep); });
  }
  function effect(lvl, grid) {
    const pos = []; grid.forEach((col, c) => col.forEach((x, r) => { if (x.s !== 'S' && x.s !== 'W') pos.push([c, r]); }));
    if (lvl === 0) {                                     // 3 диких
      const pick = pos.sort(() => Math.random() - .5).slice(0, 3), g = grid.map(col => col.slice());
      pick.forEach(([c, r]) => g[c][r] = { s: 'W' });
      return { name: 'wild', cells: pick, grid: g, note: '⚡ Заряд 1: три диких пришельца!' };
    }
    if (lvl === 1) {                                     // метеор 3×3
      const c0 = 1 + kRnd(COLS - 2), r0 = 1 + kRnd(ROWS - 2), dead = new Set(), cells = [];
      for (let c = c0 - 1; c <= c0 + 1; c++) for (let r = r0 - 1; r <= r0 + 1; r++) if (grid[c][r].s !== 'S') { dead.add(c + ',' + r); cells.push([c, r]); }
      return { name: 'meteor', cells, grid: tumble(grid, dead), note: '☄️ Заряд 2: метеор!' };
    }
    const from = LOW[kRnd(3)], to = HIGH[kRnd(4)], cells = [];   // превращение
    const g = grid.map((col, c) => col.map((x, r) => { if (x.s === from) { cells.push([c, r]); return { s: to }; } return x; }));
    return { name: 'morph', cells, grid: g, note: '🌀 Заряд 3: превращение в старших пришельцев!' };
  }
  E.spin = (st = {}) => {
    let grid = kGrid(COLS, ROWS, () => cell(true));
    const grid0 = grid, phases = []; let total = 0, charge = 0, lvl = 0, steps = 0, mult = st.free ? st.fs.mult : 1;
    for (;;) {
      const wins = SlotKit.clusterWins(grid, { pay, syms: SYMS });
      if (wins.length && steps < 40) {
        const win = wins.reduce((a, w) => a + w.win, 0) * mult; total += win;
        const dead = new Set(wins.flatMap(w => w.cells.map(([c, r]) => c + ',' + r)));
        charge += dead.size;
        phases.push({ type: 'win', wins, win, mult, charge, note: `Кластеры: ${wins.map(w => w.size).join(', ')}${mult > 1 ? ` · ×${mult}` : ''}` });
        grid = tumble(grid, dead); phases.push({ type: 'tumble', grid, charge }); steps++;
        if (st.free) mult++;
        continue;
      }
      if (lvl < 3 && charge >= LEVELS[lvl]) { const e = effect(lvl, grid); lvl++; grid = e.grid; phases.push({ type: 'effect', ...e, charge, lvl }); continue; }
      break;
    }
    if (st.free && st.fs.keep) st.fs.mult = mult;
    const sc = grid0.flat().filter(x => x.s === 'S').length;
    return { grid0, phases, total: Math.min(total, E.MAX_WIN), fsAward: !st.free && sc >= 3 ? FS[Math.min(sc, 5)] : 0, fsAdd: st.free && sc >= 3 ? 5 : 0 };
  };
  E.fsInit = kind => ({ mult: 2, keep: kind === 'super' });
  return E;
})();

// ===== 2. Чикаго: ходячие дикие — каждый спин шаг влево и бесплатный респин =====
const ChicagoEngine = (() => {
  const COLS = 5, ROWS = 3, PAYS = { G: [25, 120, 600], C: [15, 75, 300], M: [12, 50, 200], H: [10, 40, 150], A: [5, 20, 80], K: [5, 20, 80], Q: [4, 15, 60], J: [4, 15, 60], T: [3, 12, 50] };
  const W = { G: 3, C: 4, M: 5, H: 6, A: 9, K: 9, Q: 10, J: 10, T: 11 };
  const E = { COLS, ROWS, LINES: SlotKit.LINES10, SCALE: 1.22, WILD: 1.1, SC: 2.8, FS_BUY: 10, PAYS };
  const cell = (c, m) => { const t = Object.values(W).reduce((a, b) => a + b, 0), x = Math.random() * (t + E.WILD + (c % 2 === 0 ? E.SC : 0));
    if (x < E.WILD) return { s: 'W', m }; if (x < E.WILD + (c % 2 === 0 ? E.SC : 0)) return { s: 'S' }; return { s: kPick(W) }; };
  E.randCell = c => cell(c, 1);
  E.spin = (st = {}) => {
    const m = st.free ? st.fs.m : 1, grid = kGrid(COLS, ROWS, c => cell(c, m)); let walk = null;
    if (st.carry) { walk = []; st.carry.forEach(([c, w, mm]) => { if (c - 1 >= 0) { grid[c - 1][w] = { s: 'W', m: mm, walked: true }; walk.push([c - 1, w]); } }); }
    const pays = {}; for (const k in PAYS) pays[k] = PAYS[k].map(p => p * E.SCALE);
    const wins = SlotKit.lineWins(grid, { pays, top: 'G', stop: s => s === 'S' }), total = wins.reduce((a, w) => a + w.win, 0);
    const sc = grid.flat().filter(x => x.s === 'S').length;
    const wilds = []; grid.forEach((col, c) => col.forEach((x, w) => { if (x.s === 'W' && c > 0) wilds.push([c, w, x.m]); }));
    return { grid0: grid, walk, phases: wins.length ? [{ type: 'win', wins, win: total, note: `Линий: ${wins.length}${wins.some(w => w.m > 1) ? ' · дикие ×' + Math.max(...wins.map(w => w.m)) : ''}` }] : [],
      total, fsAward: !st.free && sc >= 3 ? 10 : 0, fsAdd: st.free && sc >= 3 ? 5 : 0, respin: wilds.length ? wilds : null };
  };
  E.fsInit = kind => ({ m: kind === 'super' ? 3 : 2 });
  return E;
})();

// ===== 4. Пиратское золото: мистери-сундуки раскрываются в один случайный символ =====
const PirateEngine = (() => {
  const COLS = 5, ROWS = 3, PAYS = { P: [20, 100, 500], R: [15, 60, 250], M: [10, 40, 150], C: [8, 30, 120], A: [5, 15, 60], K: [5, 15, 60], Q: [3, 10, 40], J: [3, 10, 40] };
  const W = { P: 3, R: 4, M: 5, C: 6, A: 9, K: 9, Q: 10, J: 10 };
  const POOL = { P: 2, R: 3, M: 4, C: 5, A: 7, K: 7, Q: 8, J: 8, W: 1.5 }, FS_POOL = { P: 2, R: 3, M: 3, C: 4, W: 1.5 }, SUPER_POOL = { P: 2, W: 3 };
  const E = { COLS, ROWS, LINES: SlotKit.LINES10, SCALE: 4.04, X: 2.6, X_FS: 6, WILD: 1.4, SC: 2.8, FS_BUY: 10, PAYS };
  const cell = (c, xw) => { const t = Object.values(W).reduce((a, b) => a + b, 0), wild = c >= 1 && c <= 3 ? E.WILD : 0, sc = c % 2 === 0 ? E.SC : 0, x = Math.random() * (t + xw + wild + sc);
    if (x < xw) return { s: 'X' }; if (x < xw + wild) return { s: 'W' }; if (x < xw + wild + sc) return { s: 'T' }; return { s: kPick(W) }; };
  E.randCell = c => cell(c, E.X);
  E.spin = (st = {}) => {
    const grid0 = kGrid(COLS, ROWS, c => cell(c, st.free ? E.X_FS : E.X)), phases = [];
    const xs = SlotKit.cellsOf(grid0, 'X'); let grid = grid0;
    if (xs.length) {
      const sym = kPick(st.free ? (st.fs.super ? SUPER_POOL : FS_POOL) : POOL);
      grid = grid0.map(col => col.map(x => x.s === 'X' ? { s: sym } : x));
      phases.push({ type: 'reveal', grid, cells: xs, note: `🛢️ Бочки открылись: ${xs.length} × ${sym === 'W' ? 'ДИКИЙ' : 'одинаковый символ'}!` });
    }
    const pays = {}; for (const k in PAYS) pays[k] = PAYS[k].map(p => p * E.SCALE);
    const wins = SlotKit.lineWins(grid, { pays, top: 'P', stop: s => s === 'T' }), total = wins.reduce((a, w) => a + w.win, 0);
    if (wins.length) phases.push({ type: 'win', wins, win: total, note: `Линий: ${wins.length}` });
    const sc = SlotKit.countSyms(grid0, 'T');
    return { grid0, phases, total, fsAward: !st.free && sc >= 3 ? 10 : 0, fsAdd: st.free && sc >= 3 ? 5 : 0 };
  };
  E.fsInit = kind => ({ super: kind === 'super' });
  return E;
})();

// ===== 5. Драконьи сокровища: 5×4, 1024 способа, колоссальные символы 2×2 и 3×3 =====
const DragonEngine = (() => {
  const COLS = 5, ROWS = 4, PAYS = { R: [1, 3, 10], G: [0.8, 2.5, 8], E: [0.6, 2, 6], H: [0.5, 1.5, 5], A: [0.2, 0.5, 1.5], K: [0.2, 0.5, 1.5], Q: [0.15, 0.4, 1.2], J: [0.15, 0.4, 1.2] };
  const W = { R: 3, G: 4, E: 5, H: 6, A: 9, K: 9, Q: 10, J: 10 }, BLOCK = { R: 2, G: 2, E: 3, H: 3, A: 2, K: 2, Q: 2, J: 2, W: 1 }, BLOCK_FS = { R: 3, G: 3, E: 3, H: 3, W: 1.5 };
  const E = { COLS, ROWS, UNIT: 0.137, WILD: 1.1, SC: 1.0, P_BLOCK: 0.25, FS_BUY: 8, PAYS };
  const cell = c => { const t = Object.values(W).reduce((a, b) => a + b, 0), wild = c >= 1 && c <= 3 ? E.WILD : 0, x = Math.random() * (t + wild + E.SC);
    if (x < wild) return { s: 'W' }; if (x < wild + E.SC) return { s: 'S' }; return { s: kPick(W) }; };
  E.randCell = c => cell(c);
  E.spin = (st = {}) => {
    const grid = kGrid(COLS, ROWS, c => cell(c)); let blocks = null;
    const big = st.free || Math.random() < E.P_BLOCK;
    if (big) {
      const size = st.free || Math.random() < 0.3 ? 3 : 2, s = st.free && st.fs.super ? 'W' : kPick(st.free ? BLOCK_FS : BLOCK);
      const c0 = size === 3 ? 1 : 1 + kRnd(2), r0 = kRnd(ROWS - size + 1);
      for (let i = 0; i < size; i++) for (let j = 0; j < size; j++) grid[c0 + i][r0 + j] = { s, blk: true };
      blocks = [{ c: c0, r: r0, size, s }];
    }
    const wins = SlotKit.waysWins(grid, { pays: PAYS, unit: E.UNIT }), total = wins.reduce((a, w) => a + w.win, 0);
    const sc = SlotKit.countSyms(grid, 'S');
    return { grid0: grid, blocks, phases: wins.length ? [{ type: 'win', wins, win: total, note: wins.map(w => `${w.ways} способов`).join(' · ') }] : [],
      total, fsAward: !st.free && sc >= 3 ? { 3: 8, 4: 12, 5: 15 }[Math.min(sc, 5)] : 0, fsAdd: st.free && sc >= 3 ? 4 : 0 };
  };
  E.fsInit = kind => ({ super: kind === 'super' });
  return E;
})();

// ===== 6. Цирк удачи: 3 билета запускают колесо бонусов =====
const CircusEngine = (() => {
  const COLS = 5, ROWS = 3, PAYS = { C: [20, 100, 500], L: [15, 75, 300], E: [12, 50, 200], B: [10, 40, 150], A: [5, 20, 80], K: [5, 20, 80], Q: [4, 15, 60], J: [4, 15, 60] };
  const W = { C: 3, L: 4, E: 5, B: 6, A: 9, K: 9, Q: 10, J: 10 };
  const E = { COLS, ROWS, LINES: SlotKit.LINES10, SCALE: 3.1, WILD: 1.5, SC: 2.3, FS_MULT: 3, bonusType: 'wheel', PAYS };
  const cell = c => { const t = Object.values(W).reduce((a, b) => a + b, 0), wild = c >= 1 && c <= 3 ? E.WILD : 0, sc = c % 2 === 0 ? E.SC : 0, x = Math.random() * (t + wild + sc);
    if (x < wild) return { s: 'W' }; if (x < wild + sc) return { s: 'T' }; return { s: kPick(W) }; };
  E.randCell = c => cell(c);
  E.spin = (st = {}) => {
    const grid = kGrid(COLS, ROWS, c => cell(c)), m = st.free ? E.FS_MULT : 1;
    const pays = {}; for (const k in PAYS) pays[k] = PAYS[k].map(p => p * E.SCALE * m);
    const wins = SlotKit.lineWins(grid, { pays, top: 'C', stop: s => s === 'T' }), total = wins.reduce((a, w) => a + w.win, 0);
    const sc = SlotKit.countSyms(grid, 'T');
    return { grid0: grid, phases: wins.length ? [{ type: 'win', wins, win: total, note: `Линий: ${wins.length}${m > 1 ? ` · ×${m}` : ''}` }] : [],
      total, bonus: !st.free && sc >= 3, fsAdd: st.free && sc >= 3 ? 5 : 0 };
  };
  E.fsInit = () => ({});
  E.WHEEL = [{ x: 10 }, { fs: 10 }, { x: 15 }, { pick: 1 }, { x: 20 }, { fs: 12 }, { x: 10 }, { pick: 1 }, { x: 30 }, { fs: 10 }, { x: 50 }, { x: 100 }];
  E.WHEEL_SUPER = [{ x: 30 }, { fs: 15 }, { x: 50 }, { pick: 1 }, { x: 75 }, { fs: 20 }, { x: 40 }, { pick: 1 }, { x: 100 }, { fs: 15 }, { x: 150 }, { x: 250 }];
  E.wheelSegments = kind => kind === 'super' ? E.WHEEL_SUPER : E.WHEEL;
  E.pickValues = () => [3, 5, 5, 10, 10, 15, 20, 30, 60];
  return E;
})();

// ===== 9. Двойные бриллианты: 243 способа, разделённые символы считаются за 2 (во фриспинах и за 3) =====
const DiamondEngine = (() => {
  const COLS = 5, ROWS = 3, PAYS = { 7: [2, 8, 40], R: [1.5, 5, 20], E: [1, 4, 15], P: [0.8, 3, 10], Y: [0.6, 2, 8], BAR: [0.4, 1, 4], BEL: [0.3, 0.8, 3] };
  const W = { 7: 3, R: 4, E: 5, P: 6, Y: 7, BAR: 10, BEL: 11 };
  const E = { COLS, ROWS, UNIT: 0.207, WILD: 1.2, SC: 1.1, SPLIT: 0.1, FS_BUY: 10, PAYS };
  const cell = (c, sp = E.SPLIT, tri = 0) => { const t = Object.values(W).reduce((a, b) => a + b, 0), wild = c >= 1 && c <= 3 ? E.WILD : 0, x = Math.random() * (t + wild + E.SC);
    if (x < wild) return { s: 'W' }; if (x < wild + E.SC) return { s: 'S' };
    const s = kPick(W); return Math.random() < sp ? { s, x: Math.random() < tri ? 3 : 2 } : { s }; };
  E.randCell = c => cell(c);
  E.spin = (st = {}) => {
    const f = st.free ? st.fs : null, grid = kGrid(COLS, ROWS, c => f ? cell(c, f.split, f.tri) : cell(c));
    if (f && f.super) grid.forEach(col => col.forEach(x => { if (['7', 'R', 'E', 'P', 'Y'].includes(x.s) && !x.x) x.x = 2; }));
    const wins = SlotKit.waysWins(grid, { pays: PAYS, unit: E.UNIT }), total = wins.reduce((a, w) => a + w.win, 0);
    const sc = SlotKit.countSyms(grid, 'S');
    return { grid0: grid, phases: wins.length ? [{ type: 'win', wins, win: total, note: wins.map(w => `${w.ways} способов`).join(' · ') }] : [],
      total, fsAward: !st.free && sc >= 3 ? { 3: 10, 4: 12, 5: 15 }[Math.min(sc, 5)] : 0, fsAdd: st.free && sc >= 3 ? 5 : 0 };
  };
  E.fsInit = kind => kind === 'super' ? { split: 0.45, tri: 0.4, super: true } : { split: 0.45, tri: 0.4 };
  return E;
})();
