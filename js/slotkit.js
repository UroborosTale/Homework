// SlotKit — общий конструктор новых слотов: помощники для движков (линии, способы, кластеры),
// симуляция RTP и полный интерфейс (барабаны или падение, фриспины с выбором, покупка/супер-бонус,
// колесо бонусов, джекпот, интрига, автоигра, турбо).
//
// Движок слота E (чистая логика, все выигрыши — в долях общей ставки, ставка = 1):
//   E.spin(st) → r          st = { free, fs (состояние бонуса), carry (состояние респина) }
//   r = { grid0, phases: [...], total, fsAward (в базе), fsAdd (во фриспинах), bonus (колесо), respin, blocks }
//   фазы: { type: 'win', wins, win, note } | { type: 'tumble', grid } | { type: 'reveal', grid, cells, note }
//         | { type: 'effect', name, cells, grid, note }
//   E.fsInit(kind) — состояние фриспинов ('normal' | 'super'); E.randCell(c) — случайная клетка для ленты барабана.
//   Колесо (E.bonusType === 'wheel'): E.wheelSegments(kind), E.pickValues().
const SlotKit = (() => {
  // ---------- помощники для движков ----------
  const rnd = n => Math.floor(Math.random() * n);
  function wpick(w) { let t = 0; for (const k in w) t += w[k]; let r = Math.random() * t; for (const k in w) if ((r -= w[k]) < 0) return k; return Object.keys(w)[0]; }
  const LINES10 = [[1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2], [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [1, 0, 0, 0, 1], [1, 2, 2, 2, 1], [0, 1, 1, 1, 0]];
  // Линии: pays[sym] = [×3, ×4, ×5] от ставки на линию; break(s) — символы, прерывающие линию; mult(cell) — множитель дикого
  function lineWins(grid, { pays, lines = LINES10, wild = 'W', top, stop = () => false, mult = c => c.m || 1 }) {
    const wins = [], lb = 1 / lines.length;
    lines.forEach((ln, li) => {
      const cells = ln.map((row, r) => grid[r][row]);
      let sym = null, n = 0, m = 1;
      for (const c of cells) {
        if (c.s === wild) { n++; m *= mult(c); continue; }
        if (stop(c.s) || !pays[c.s]) break;
        if (sym === null) sym = c.s;
        if (c.s === sym) n++; else break;
      }
      if (sym === null) sym = top;
      if (n < 3 || !pays[sym]) return;
      wins.push({ line: li, sym, count: n, cells: ln.slice(0, n).map((row, r) => [r, row]), win: pays[sym][n - 3] * lb * m, m });
    });
    return wins;
  }
  // Способы: count(cell) — сколько символов в клетке (разделённые считаются за 2–3)
  function waysWins(grid, { pays, wild = 'W', unit = 1, count = c => c.x || 1 }) {
    const wins = [];
    for (const sym in pays) {
      let ways = 1, n = 0; const cells = [];
      for (let r = 0; r < grid.length; r++) {
        let c = 0; grid[r].forEach((x, w) => { if (x.s === sym || x.s === wild) { c += x.s === sym ? count(x) : 1; cells.push([r, w]); } });
        if (!c) break; ways *= c; n++;
      }
      if (n < 3 || !grid[0].some(x => x.s === sym)) continue;
      const cut = cells.filter(([r]) => r < n);
      wins.push({ sym, count: n, ways, cells: cut, win: pays[sym][Math.min(n, 5) - 3] * ways * unit });
    }
    return wins;
  }
  // Кластеры: соседние по стороне одинаковые символы (дикие присоединяются к любым), от min штук
  function clusterWins(grid, { pay, wild = 'W', min = 5, syms }) {
    const C = grid.length, R = grid[0].length, wins = [];
    for (const sym of syms) {
      const seen = new Set();
      for (let c = 0; c < C; c++) for (let r = 0; r < R; r++) {
        if (grid[c][r].s !== sym || seen.has(c + ',' + r)) continue;
        const comp = [], stack = [[c, r]], local = new Set([c + ',' + r]);
        while (stack.length) {
          const [a, b] = stack.pop(); comp.push([a, b]); if (grid[a][b].s === sym) seen.add(a + ',' + b);
          for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const x = a + da, y = b + db, k = x + ',' + y;
            if (x < 0 || y < 0 || x >= C || y >= R || local.has(k)) continue;
            if (grid[x][y].s === sym || grid[x][y].s === wild) { local.add(k); stack.push([x, y]); }
          }
        }
        if (comp.filter(([a, b]) => grid[a][b].s === sym).length && comp.length >= min) wins.push({ sym, size: comp.length, cells: comp, win: pay(sym, comp.length) });
      }
    }
    return wins;
  }
  const countSyms = (grid, s) => grid.flat().filter(c => c.s === s).length;
  const cellsOf = (grid, s) => grid.flatMap((col, r) => col.map((c, w) => c.s === s ? [r, w] : null).filter(Boolean));

  // ---------- симуляция (та же логика раунда, что в интерфейсе, без анимаций) ----------
  function chainSync(E, st) {
    let r = E.spin(st), w = 0, award = 0, add = 0, bonus = false;
    for (;;) {
      w += r.total; award = Math.max(award, r.fsAward || 0); add += r.fsAdd || 0; if (r.bonus) bonus = true;
      if (!r.respin) break; r = E.spin({ ...st, carry: r.respin });
    }
    return { w, award, add, bonus };
  }
  function fsSync(E, spins, kind, g = 1) {
    const fs = E.fsInit(kind); let left = spins, w = 0;
    while (left-- > 0) { const c = chainSync(E, { free: true, fs }); w += c.w * g; left += c.add; }
    return Math.min(w, E.MAX_BONUS || Infinity);
  }
  function wheelSync(E, kind, fsOpt) {
    const segs = E.wheelSegments(kind), s = segs[rnd(segs.length)];
    if (s.fs) return fsSync(E, fsOpt ? Math.max(1, Math.round(s.fs * fsOpt[0])) : s.fs, 'normal', fsOpt ? fsOpt[1] : 1);
    if (s.pick) { const v = E.pickValues().sort(() => Math.random() - .5); return v[0] + v[1] + v[2]; }
    return s.x;
  }
  // opts: { buy: 'bonus'|'super', opt: [доля, g] — вариант фриспинов }
  function simulate(E, n, { buy = null, opt = null } = {}) {
    let won = 0, trig = 0;
    for (let i = 0; i < n; i++) {
      if (buy) { won += E.bonusType === 'wheel' ? wheelSync(E, buy, opt) : fsSync(E, opt ? Math.max(1, Math.round(E.FS_BUY * opt[0])) : E.FS_BUY, buy, opt ? opt[1] : 1); continue; }
      const c = chainSync(E, { free: false }); won += c.w;
      if (c.award) { trig++; won += fsSync(E, opt ? Math.max(1, Math.round(c.award * opt[0])) : c.award, 'normal', opt ? opt[1] : 1); }
      if (c.bonus) { trig++; won += wheelSync(E, 'normal', opt); }
    }
    return { rtp: +(won / n).toFixed(4), trig: trig / n };
  }

  // ---------- интерфейс ----------
  // cfg: { id, E, art, mode: 'reels'|'drop', fill(el, cell), rand(), tease: { is, at, canHold }, fsTable, buy: { bonus, super },
  //        buyDesc: { bonus, super }, topHtml, onPhase(ph, ui), fsText(fs, g), payHtml, rules, spinLabel, intro, bets }
  function create(cfg) {
    const { $, sleep, msg, fmt, setBalance } = Casino, E = cfg.E, id = cfg.id, sec = $(id), P = id;
    const COLS = E.COLS, ROWS = E.ROWS, lines = cfg.mode === 'reels' && E.LINES;
    sec.classList.add('kit', 'kit-' + cfg.mode);
    sec.insertAdjacentHTML('beforeend', `
      <div class="fsbanner kitbanner" id="${P}Fs"></div>
      <div class="kittop">${cfg.topHtml || ''}<div class="olybadge">Выигрыш спина: <b id="${P}Win">0</b> ₽</div></div>
      <div class="kitframe ${cfg.mode === 'reels' ? 'slotframe' : ''}" id="${P}Frame" style="--cols:${COLS};--rows:${ROWS}">
        <div class="kitgrid" id="${P}Grid"></div>${lines ? `<svg class="linesvg" id="${P}Svg" viewBox="0 0 560 340" preserveAspectRatio="none"></svg>` : ''}<div class="kitover" id="${P}Over"></div>
      </div>
      <div class="msg" id="${P}Msg">${cfg.intro || 'Сделайте ставку и крутите!'}</div>
      <div class="controls"><label>Ставка: <select id="${P}Bet"></select></label></div>
      <div class="controls">
        <button class="btn primary" id="${P}Spin">${cfg.spinLabel || 'КРУТИТЬ'}</button>
        <button class="btn" id="${P}Auto">Авто: выкл</button>
        <button class="btn" id="${P}Turbo">Турбо: выкл</button>
        <button class="btn buybtn" id="${P}Buy">Купить бонус</button>
      </div>
      <details class="paytable"><summary>Таблица выплат и правила</summary><div>${cfg.payHtml || ''}</div><p>${cfg.rules || ''}</p></details>`);
    const gridEl = $(P + 'Grid'), svg = lines ? $(P + 'Svg') : null, over = $(P + 'Over');
    const cols = [], cells = [];
    for (let c = 0; c < COLS; c++) {
      const col = document.createElement('div'); col.className = cfg.mode === 'reels' ? 'rcol' : 'kcol'; cells[c] = [];
      for (let r = 0; r < ROWS; r++) { const d = document.createElement('div'); d.className = cfg.mode === 'reels' ? 'sc' : 'oc'; col.appendChild(d); cells[c][r] = d; }
      gridEl.appendChild(col); cols.push(col);
    }
    // клетка: SVG-символ или буква; x > 1 — разделённый символ (2–3 копии), m > 1 — множитель дикого
    const fill = cfg.fill || ((el, it) => {
      const k = it.s, art = Art.html(cfg.art, k);
      el.classList.toggle('letter', !art); el.classList.toggle('split', it.x > 1); el.classList.toggle('wildm', it.s === 'W');
      if (!art) { el.textContent = k === 'T' ? '10' : k; return; }
      el.innerHTML = it.x > 1 ? `<span class="splitbox s${it.x}">${art.repeat(it.x)}</span><b class="xb">×${it.x}</b>` : art + (it.m > 1 ? `<b class="wm">×${it.m}</b>` : '');
    });
    const put = (c, r, it) => { const el = cells[c][r]; el.classList.remove('hit', 'pop', 'drop', 'reveal', 'fxcell', 'walked'); fill(el, it); };
    const show = g => g.forEach((col, c) => col.forEach((it, r) => put(c, r, it)));
    show(E.spin({ free: false }).grid0);
    (cfg.bets || [10, 20, 50, 100, 200, 500, 1000, 2500, 5000]).forEach(v => $(P + 'Bet').add(new Option(v, v)));

    let busy = false, auto = false, turbo = false, fsG = 1;
    const d = ms => sleep(turbo ? ms / 3 : ms);
    const bet = () => +$(P + 'Bet').value;
    const setOff = off => { $(P + 'Spin').disabled = $(P + 'Bet').disabled = $(P + 'Buy').disabled = off; };
    const ui = { cells, cols, sec, $, d, fmt, msg: (t, c) => msg($(P + 'Msg'), t, c), bet, get turbo() { return turbo; } };
    const clearMarks = () => { cells.flat().forEach(c => c.classList.remove('hit', 'pop')); if (svg) svg.innerHTML = ''; };
    function drawLines(wins) {
      if (!svg) return; const cw = 560 / COLS, rh = 340 / ROWS;
      svg.innerHTML = wins.filter(w => w.line !== undefined).map(w => `<polyline class="wline" points="${E.LINES[w.line].slice(0, w.count).map((row, r) => `${(r + .5) * cw},${(row + .5) * rh}`).join(' ')}" fill="none" stroke="${SlotUI.COLORS[w.line % 10]}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round" opacity=".9"/>`).join('');
    }
    function render(g, drop, prev, extra) {                    // режим падения
      const dy = drop ? (prev ? Anim.dropDiff(prev, g) : g.map(col => col.map(() => ROWS + 1))) : null;
      g.forEach((col, c) => col.forEach((x, r) => {
        const el = cells[c][r], dd = dy ? dy[c][r] : 0;
        el.className = 'oc' + (dd ? ' drop' : ''); fill(el, x);
        if (dd) { el.style.setProperty('--dy', dd); el.style.setProperty('--d', (prev ? c * 0.012 : c * 0.05 + (ROWS - r) * 0.02 + (extra ? extra[c] : 0)) + 's'); }
      }));
    }
    function blocks(list) {                                     // колоссальные символы поверх сетки
      over.innerHTML = '';
      (list || []).forEach(b => {
        const el = document.createElement('div'); el.className = 'kitblock' + (b.s === 'W' ? ' wild' : '');
        el.style.cssText = `left:calc(${b.c} * 100% / ${COLS});top:calc(${b.r} * 100% / ${ROWS});width:calc(${b.size} * 100% / ${COLS});height:calc(${b.size} * 100% / ${ROWS})`;
        el.innerHTML = (Art.html(cfg.art, b.s) || `<span class="bigl">${b.s === 'T' ? '10' : b.s}</span>`) + `<b>${b.size}×${b.size}</b>`; over.appendChild(el);
        for (let i = 0; i < b.size; i++) for (let j = 0; j < b.size; j++) cells[b.c + i][b.r + j].classList.add('underblock');
      });
    }

    // ---------- показ одного спина ----------
    async function present(r, g) {
      let acc = 0;
      Anim.countTo($(P + 'Win'), 0, 200); clearMarks(); over.innerHTML = ''; cells.flat().forEach(c => c.classList.remove('underblock', 'walked'));
      if (cfg.mode === 'reels') {
        if (r.walk) { r.walk.forEach(([c, w]) => cells[c + 1] && cells[c + 1][w].classList.add('walking')); await d(450); cells.flat().forEach(c => c.classList.remove('walking')); }
        await SlotFX.spinReels({ cols, grid: r.grid0, fill, put, rand: () => E.randCell(rnd(COLS)), tease: cfg.tease });
        if (r.walk) r.walk.forEach(([c, w]) => cells[c] && cells[c][w].classList.add('walked'));
      } else {
        if (!Anim.reduce()) { cells.flat().forEach((el, i) => { el.style.setProperty('--d', ((i / ROWS | 0) * 0.03) + 's'); el.classList.add('exit'); }); await d(380); }
        const T = cfg.tease ? SlotFX.teaseDrop(cols, r.grid0, cfg.tease.is, cfg.tease.at, turbo) : { waitMs: 0 };
        render(r.grid0, true, null, T.extraS); await d(650); await sleep(T.waitMs);
      }
      if (r.blocks) { blocks(r.blocks); await d(700); }
      let prev = r.grid0;
      for (const ph of r.phases) {
        if (cfg.onPhase) cfg.onPhase(ph, ui);
        if (ph.type === 'win') {
          clearMarks(); ph.wins.forEach(w => w.cells.forEach(([a, b]) => cells[a][b].classList.add('hit'))); drawLines(ph.wins);
          acc += ph.win; Anim.countTo($(P + 'Win'), fmt(Math.round(acc * g * bet() * 100) / 100), 500);
          ui.msg(ph.note || `Выигрыш: ${fmt(Math.round(ph.win * g * bet() * 100) / 100)} ₽`, 'win'); await d(cfg.mode === 'reels' ? 1300 : 950);
          if (cfg.mode === 'drop') { ph.wins.forEach(w => w.cells.forEach(([a, b]) => cells[a][b].classList.add('pop'))); await d(380); }
        } else if (ph.type === 'tumble') { clearMarks(); render(ph.grid, true, prev); prev = ph.grid; await d(600); }
        else if (ph.type === 'reveal' || ph.type === 'effect') {
          clearMarks(); if (ph.note) ui.msg(ph.note, 'win');
          (ph.cells || []).forEach(([a, b]) => cells[a][b].classList.add(ph.type === 'reveal' ? 'reveal' : 'fxcell', 'fx-' + (ph.name || 'reveal')));
          await d(ph.type === 'reveal' ? 450 : 750);
          if (ph.grid) { if (cfg.mode === 'drop' && ph.name === 'meteor') render(ph.grid, true, prev); else show(ph.grid); prev = ph.grid; (ph.cells || []).forEach(([a, b]) => cells[a][b].classList.add('fxcell', 'fx-' + (ph.name || 'reveal'))); }
          await d(650); cells.flat().forEach(c => c.classList.remove('fxcell', 'reveal'));
        }
      }
      if (cfg.after) await cfg.after(r, ui);
      return r.total;
    }
    // цепочка: спин + респины (ходячие дикие). Начисляет выигрыш, возвращает { w, award, add, bonus }
    async function chain(st, g) {
      let r = E.spin(st), w = 0, award = 0, add = 0, bonus = false, n = 0;
      for (;;) {
        const won = Math.round(r.total * g * bet() * 100) / 100;
        await present(r, g);
        if (won > 0) setBalance(Casino.balance + won);
        w += won; award = Math.max(award, r.fsAward || 0); add += r.fsAdd || 0; if (r.bonus) bonus = true;
        if (!r.respin) break;
        n++; ui.msg(`↻ Респин ${n}: дикие шагают влево`, 'win'); await d(700);
        r = E.spin({ ...st, carry: r.respin });
      }
      if (!w && !award && !bonus) ui.msg('Без выигрыша', 'lose');
      else if (w && !award && !bonus) ui.msg(`Выигрыш: ${fmt(w)} ₽`, 'win');
      return { w, award, add, bonus };
    }
    // ---------- фриспины ----------
    const banner = $(P + 'Fs'), fsBar = SlotUI.fsProgress(banner);
    async function freeSpins(n, kind, opt) {
      const o = kind === 'super' ? { spins: n, g: 1 } : opt || await SlotFX.fsChoice(n, cfg.fsTable, { auto });
      fsG = o.g; const fs = E.fsInit(kind); let left = o.spins, done = 0, sum = 0;
      sec.classList.add('kit-fs'); banner.style.display = 'block';
      const upd = () => { banner.textContent = `🎁 ФРИСПИНЫ: осталось ${left}${o.g !== 1 ? ` · выигрыши ×${o.g}` : ''}${cfg.fsText ? ' · ' + cfg.fsText(fs) : ''} · выиграно ${fmt(Math.round(sum * 100) / 100)} ₽`; fsBar.show(done, done + left); };
      ui.msg(`🎁 ${o.spins} фриспинов${o.g !== 1 ? ` · выигрыши ×${o.g}` : ''}${kind === 'super' && cfg.superNote ? ' · ' + cfg.superNote : ''}!`, 'win'); upd(); await d(1500);
      while (left > 0) {
        await Casino.whenActive(id);
        left--; done++; upd();
        const c = await chain({ free: true, fs }, o.g); sum += c.w;
        if (c.add) { left += c.add; ui.msg(`+${c.add} фриспинов!`, 'win'); await d(1000); }
        upd(); await d(450);
        if (E.MAX_BONUS && sum >= E.MAX_BONUS * bet()) { left = 0; ui.msg('Достигнут максимальный выигрыш бонуса!', 'win'); }
      }
      sec.classList.remove('kit-fs'); banner.style.display = 'none'; fsBar.hide(); fsG = 1;
      ui.msg(`Бонус окончен: ${done} ${done % 10 === 1 && done % 100 !== 11 ? 'вращение' : done % 10 >= 2 && done % 10 <= 4 && (done % 100 < 10 || done % 100 >= 20) ? 'вращения' : 'вращений'}, итого ${fmt(Math.round(sum * 100) / 100)} ₽ (×${fmt(Math.round(sum / bet() * 10) / 10)})`, sum ? 'win' : 'lose');
      await d(900);
      return sum;
    }
    // ---------- колесо бонусов ----------
    async function wheelBonus(kind) {
      const segs = E.wheelSegments(kind), k = rnd(segs.length), s = segs[k];
      const m = document.getElementById('kitWheel') || Object.assign(document.createElement('div'), { id: 'kitWheel', className: 'modal fxmodal' });
      if (!m.parentNode) document.body.appendChild(m);
      const n = segs.length, ang = 360 / n, colors = ['#e53935', '#fdd835', '#1e88e5', '#43a047', '#8e24aa', '#fb8c00'];
      const label = x => x.fs ? `${x.fs} FS` : x.pick ? '🎁' : '×' + x.x;
      m.innerHTML = `<div class="mbox kitwheelbox"><h3>🎪 ${kind === 'super' ? 'Золотое колесо' : 'Колесо бонусов'}</h3>
        <div class="kwheel"><div class="kwptr"></div><div class="kwdisc" style="background:conic-gradient(${segs.map((x, i) => `${colors[i % colors.length]} ${i * ang}deg ${(i + 1) * ang}deg`).join(',')})">
        ${segs.map((x, i) => `<span style="transform:rotate(${i * ang + ang / 2}deg)"><i>${label(x)}</i></span>`).join('')}</div><div class="kwhub">★</div></div>
        <p class="fxnote kwres">Колесо крутится…</p></div>`;
      m.classList.add('show');
      const disc = m.querySelector('.kwdisc'); await sleep(60);
      const target = 360 * (turbo ? 3 : 6) + (360 - (k * ang + ang / 2));
      disc.style.transition = `transform ${turbo ? 1.6 : 4.2}s cubic-bezier(.15,.7,.12,1)`; disc.style.transform = `rotate(${target}deg)`;
      await sleep(turbo ? 1700 : 4400);
      const res = m.querySelector('.kwres');
      res.textContent = s.fs ? `🎁 ${s.fs} фриспинов!` : s.pick ? '🎁 Выбор сундуков!' : `💰 Приз ×${s.x} ставки!`; res.classList.add('win');
      await sleep(1400); m.classList.remove('show');
      if (s.fs) return freeSpins(s.fs, 'normal');
      if (s.pick) return pickBonus();
      const won = s.x * bet(); setBalance(Casino.balance + won); ui.msg(`🎪 Колесо: приз ${fmt(won)} ₽ (×${s.x})`, 'win'); return won;
    }
    function pickBonus() {
      const vals = E.pickValues().sort(() => Math.random() - .5);
      const m = document.getElementById('kitPick') || Object.assign(document.createElement('div'), { id: 'kitPick', className: 'modal fxmodal' });
      if (!m.parentNode) document.body.appendChild(m);
      m.innerHTML = `<div class="mbox"><h3>🎁 Выберите 3 сундука</h3><div class="chests kitchests">${vals.map((_, i) => `<button class="chest" data-i="${i}">🧰</button>`).join('')}</div><p class="fxnote kpres">Осталось: 3</p></div>`;
      m.classList.add('show');
      return new Promise(res => {
        let left = 3, sum = 0;
        const open = b => { if (b.classList.contains('open') || !left) return; left--; const v = vals[+b.dataset.i]; sum += v; b.classList.add('open'); b.textContent = '×' + v;
          m.querySelector('.kpres').textContent = left ? `Осталось: ${left} · сумма ×${sum}` : `Итого ×${sum}!`;
          if (!left) setTimeout(() => { m.classList.remove('show'); const won = sum * bet(); setBalance(Casino.balance + won); ui.msg(`🎁 Сундуки: ${fmt(won)} ₽ (×${sum})`, 'win'); res(won); }, 1300); };
        m.querySelector('.kitchests').onclick = e => { const b = e.target.closest('.chest'); if (b) open(b); };
        if (auto) (async () => { for (let i = 0; i < 3; i++) { await sleep(700); const bs = [...m.querySelectorAll('.chest:not(.open)')]; open(bs[rnd(bs.length)]); } })();
      });
    }
    // ---------- раунд ----------
    async function round(buy) {
      if (busy) return; const b = bet(), cost = buy ? cfg.buy[buy] * b : b;
      if (cost > Casino.balance) { auto = false; ap.cancel(); setOff(false); return ui.msg('Недостаточно средств', 'lose'); }
      busy = true; setOff(true); setBalance(Casino.balance - cost); SlotFX.jackpot.bet(cost);
      let total = 0;
      if (buy) total += E.bonusType === 'wheel' ? await wheelBonus(buy) : await freeSpins(E.FS_BUY, buy);
      else {
        const c = await chain({ free: false }, 1); total += c.w;
        if (c.award) { ui.msg(`🎁 Бонус! ${c.award} фриспинов`, 'win'); await d(1300); total += await freeSpins(c.award, 'normal'); }
        if (c.bonus) { ui.msg('🎪 Бонус: колесо!', 'win'); await d(1300); total += await wheelBonus('normal'); }
      }
      Anim.winFx(total, cost);
      busy = false; if (!auto) setOff(false);
      if (auto && ap.after(total, b)) { await sleep(total > 0 ? 900 : 300); if (auto) round(null); }
    }
    $(P + 'Spin').onclick = () => { auto = false; ap.cancel(); round(null); };
    const ap = SlotUI.auto($(P + 'Auto'), { start: () => { auto = true; if (!busy) round(null); }, stop: () => { auto = false; if (!busy) setOff(false); } });
    $(P + 'Turbo').onclick = () => { turbo = !turbo; sec.classList.toggle('turbo', turbo); $(P + 'Turbo').textContent = 'Турбо: ' + (turbo ? 'вкл' : 'выкл'); };
    const bm = SlotFX.buyMenu($(P + 'Buy'), { bet, busy: () => busy,
      items: [{ key: 'bonus', name: 'Бонус', desc: cfg.buyDesc.bonus, cost: cfg.buy.bonus }, { key: 'super', name: '🔥 Супер-бонус', desc: cfg.buyDesc.super, cost: cfg.buy.super }],
      onBuy(k) { auto = false; ap.cancel(); round(k); } });
    $(P + 'Bet').addEventListener('change', bm.paint);
    return { ui, round };
  }
  return { rnd, wpick, LINES10, lineWins, waysWins, clusterWins, countSyms, cellsOf, simulate, create };
})();
