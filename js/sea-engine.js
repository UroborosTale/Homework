// Морской бой: поле 10×10, флот 4+3+3+2+2+2+1+1+1+1, корабли не касаются даже углами.
// Попал — стреляешь ещё; у потопленного корабля клетки вокруг отмечаются автоматически.
// Чистая логика без DOM — работает и в браузере, и в node (для тестов).
const SeaEngine = (() => {
  const S = 10, FLEET = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];
  const rnd = n => Math.floor(Math.random() * n);
  const cellsOf = sh => Array.from({ length: sh.len }, (_, k) => sh.v ? [sh.x, sh.y + k] : [sh.x + k, sh.y]);
  const inside = (x, y) => x >= 0 && y >= 0 && x < S && y < S;
  // можно ли поставить корабль: в поле и не касается других
  function fits(ships, sh, skip = -1) {
    const cs = cellsOf(sh); if (!cs.every(([x, y]) => inside(x, y))) return false;
    return ships.every((o, i) => i === skip || cellsOf(o).every(([a, b]) => cs.every(([x, y]) => Math.abs(a - x) > 1 || Math.abs(b - y) > 1)));
  }
  function randomFleet() {
    for (;;) {
      const ships = []; let ok = true;
      for (const len of FLEET) {
        let placed = false;
        for (let t = 0; t < 200 && !placed; t++) { const sh = { x: rnd(S), y: rnd(S), v: Math.random() < .5, len }; if (fits(ships, sh)) { ships.push(sh); placed = true; } }
        if (!placed) { ok = false; break; }
      }
      if (ok) return ships;
    }
  }
  function validFleet(ships) {
    if (!Array.isArray(ships) || ships.length !== FLEET.length) return false;
    const lens = ships.map(s => s.len).sort((a, b) => b - a); if (lens.join() !== FLEET.join()) return false;
    const norm = ships.map(s => ({ x: s.x | 0, y: s.y | 0, v: !!s.v, len: s.len | 0 }));
    return norm.every((sh, i) => fits(norm.slice(0, i), sh));
  }

  function newGame(names) {
    return { names: names.slice(), phase: 'setup', ships: [randomFleet(), randomFleet()], ready: [false, false],
      shots: [[], []],               // shots[p] — куда стрелял игрок p: { x, y, hit }
      turn: rnd(2), winner: null, reason: '', last: 'Расставьте корабли и нажмите «Готов»', lastShot: null, streak: 0 };
  }
  const shipAt = (ships, x, y) => ships.findIndex(sh => cellsOf(sh).some(([a, b]) => a === x && b === y));
  const sunk = (st, owner, i) => cellsOf(st.ships[owner][i]).every(([x, y]) => st.shots[1 - owner].some(s => s.x === x && s.y === y));
  const shotAt = (st, p, x, y) => st.shots[p].find(s => s.x === x && s.y === y);

  function act(st, p, a) {
    if (st.phase === 'over') return { ok: false, err: 'Партия окончена' };
    switch (a && a.type) {
      case 'shuffle':
        if (st.phase !== 'setup' || st.ready[p]) return { ok: false, err: 'Расстановка уже закончена' };
        st.ships[p] = randomFleet(); return { ok: true };
      case 'place':                                          // своя расстановка
        if (st.phase !== 'setup' || st.ready[p]) return { ok: false, err: 'Расстановка уже закончена' };
        if (!validFleet(a.ships)) return { ok: false, err: 'Неверная расстановка' };
        st.ships[p] = a.ships.map(s => ({ x: s.x | 0, y: s.y | 0, v: !!s.v, len: s.len | 0 })); return { ok: true };
      case 'ready':
        if (st.phase !== 'setup') return { ok: false, err: 'Игра уже идёт' };
        st.ready[p] = true;
        if (st.ready[0] && st.ready[1]) { st.phase = 'play'; st.last = `Оба готовы! Первым стреляет ${st.names[st.turn]}`; }
        else st.last = `${st.names[p]} готов`;
        return { ok: true };
      case 'shot': {
        if (st.phase !== 'play') return { ok: false, err: 'Бой ещё не начался' };
        if (st.turn !== p) return { ok: false, err: 'Сейчас стреляет соперник' };
        const x = a.x | 0, y = a.y | 0; if (!inside(x, y)) return { ok: false, err: 'Мимо поля' };
        if (shotAt(st, p, x, y)) return { ok: false, err: 'Сюда уже стреляли' };
        const q = 1 - p, i = shipAt(st.ships[q], x, y), hit = i >= 0;
        st.shots[p].push({ x, y, hit }); st.lastShot = { p, x, y, hit };
        const L = 'АБВГДЕЖЗИК'[x] + (y + 1);
        if (!hit) { st.turn = q; st.streak = 0; st.last = `${st.names[p]}: ${L} — мимо`; return { ok: true }; }
        st.streak++;
        if (sunk(st, q, i)) {
          // клетки вокруг потопленного корабля — заведомо пустые
          for (const [cx, cy] of cellsOf(st.ships[q][i])) for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
            const nx = cx + dx, ny = cy + dy; if (inside(nx, ny) && !shotAt(st, p, nx, ny) && shipAt(st.ships[q], nx, ny) < 0) st.shots[p].push({ x: nx, y: ny, hit: false, auto: true });
          }
          st.last = `${st.names[p]}: ${L} — ${st.ships[q][i].len > 1 ? 'потоплен ' + st.ships[q][i].len + '-палубный' : 'потоплен одиночный'}!`;
          if (st.ships[q].every((_, k) => sunk(st, q, k))) { st.phase = 'over'; st.winner = p; st.reason = 'Весь флот соперника потоплен'; }
        } else st.last = `${st.names[p]}: ${L} — ранил!`;
        return { ok: true };
      }
      default: return { ok: false, err: 'Неизвестный ход' };
    }
  }
  // вид для игрока: свой флот целиком, у соперника — только потопленные корабли (в конце — все)
  function view(st, me) {
    const q = 1 - me, open = st.phase === 'over';
    return { names: st.names, me, phase: st.phase, ready: st.ready.slice(), turn: st.turn, winner: st.winner, reason: st.reason, last: st.last, lastShot: st.lastShot,
      myShips: st.ships[me].map(s => ({ ...s, sunk: sunk(st, me, st.ships[me].indexOf(s)) })),
      oppShips: st.ships[q].map((s, i) => ({ ...s, sunk: sunk(st, q, i) })).filter(s => open || s.sunk),
      myShots: st.shots[me].slice(), oppShots: st.shots[q].slice(),
      left: [me, q].map(o => st.ships[o].filter((_, i) => !sunk(st, o, i)).length) };
  }

  // ---------- бот ----------
  // level 1 — случайно; 2 — добивает раненых; 3 — добивает и стреляет по клеткам с наибольшей вероятностью корабля
  function botMove(st, p, level = 2) {
    if (st.phase === 'setup') return st.ready[p] ? null : { type: 'ready' };
    if (st.phase !== 'play' || st.turn !== p) return null;
    const q = 1 - p, shot = Array.from({ length: S }, () => Array(S).fill(0));   // 0 — неизвестно, 1 — мимо, 2 — ранен, 3 — потоплен
    for (const s of st.shots[p]) shot[s.x][s.y] = s.hit ? 2 : 1;
    st.ships[q].forEach((sh, i) => { if (sunk(st, q, i)) cellsOf(sh).forEach(([x, y]) => shot[x][y] = 3); });
    const free = []; for (let x = 0; x < S; x++) for (let y = 0; y < S; y++) if (!shot[x][y]) free.push([x, y]);
    const pick = arr => arr[rnd(arr.length)];
    if (level <= 1 && Math.random() < .9) { const [x, y] = pick(free); return { type: 'shot', x, y }; }
    // раненые клетки — добиваем вдоль линии
    const hits = []; for (let x = 0; x < S; x++) for (let y = 0; y < S; y++) if (shot[x][y] === 2) hits.push([x, y]);
    if (hits.length) {
      const cand = [];
      const lineH = hits.length > 1 && hits.every(([, y]) => y === hits[0][1]), lineV = hits.length > 1 && hits.every(([x]) => x === hits[0][0]);
      for (const [x, y] of hits) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (lineH && dy) continue; if (lineV && dx) continue;
        const nx = x + dx, ny = y + dy; if (inside(nx, ny) && !shot[nx][ny]) cand.push([nx, ny]);
      }
      if (cand.length) { const [x, y] = pick(cand); return { type: 'shot', x, y }; }
    }
    if (level >= 3) {                                          // карта плотности: сколько оставшихся кораблей могут здесь стоять
      const alive = st.ships[q].filter((_, i) => !sunk(st, q, i)).map(s => s.len), heat = Array.from({ length: S }, () => Array(S).fill(0));
      const blocked = (x, y) => shot[x][y] === 1 || shot[x][y] === 3 ||
        [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]].some(([dx, dy]) => inside(x + dx, y + dy) && shot[x + dx][y + dy] === 3);
      for (const len of alive) for (let x = 0; x < S; x++) for (let y = 0; y < S; y++) for (const v of [false, true]) {
        const cs = cellsOf({ x, y, v, len }); if (!cs.every(([a, b]) => inside(a, b) && !blocked(a, b))) continue;
        cs.forEach(([a, b]) => { if (!shot[a][b]) heat[a][b]++; });
      }
      let best = -1, opts = [];
      for (const [x, y] of free) { const h = heat[x][y]; if (h > best) { best = h; opts = [[x, y]]; } else if (h === best) opts.push([x, y]); }
      if (opts.length) { const [x, y] = pick(opts); return { type: 'shot', x, y }; }
    }
    // шахматный порядок — так быстрее находятся корабли длиной от 2
    const par = free.filter(([x, y]) => (x + y) % 2 === 0), [x, y] = pick(par.length && level >= 2 ? par : free);
    return { type: 'shot', x, y };
  }
  return { S, FLEET, newGame, act, view, botMove, randomFleet, validFleet, cellsOf, fits };
})();
if (typeof module !== 'undefined') module.exports = SeaEngine;
