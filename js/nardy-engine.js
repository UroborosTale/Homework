// Нарды: длинные (без боя, старт с «головы») и короткие (бэкгаммон: бой, бар, вход в игру).
// Чистая логика без DOM — работает и в браузере, и в node (для тестов).
// У каждого игрока своя «дорожка» 0..23: 0 — начало пути, 18..23 — дом, 24 — выброшена с доски.
// Абсолютный пункт доски (0..23) зависит от варианта: в длинных оба идут в одну сторону со сдвигом 12,
// в коротких — навстречу друг другу.
const NardyEngine = (() => {
  const abs = (v, p, i) => p === 0 ? i : v === 'long' ? (i + 12) % 24 : 23 - i;
  const inv = abs;                                        // отображение обратно себе (сдвиг на 12 и зеркало — инволюции)
  const rnd6 = () => 1 + Math.floor(Math.random() * 6);

  function newGame(names, cfg = {}) {
    const v = cfg.variant === 'short' ? 'short' : 'long';
    const tr = [0, 1].map(() => Array(24).fill(0));
    if (v === 'long') { tr[0][0] = 15; tr[1][0] = 15; }
    else for (const p of [0, 1]) { tr[p][0] = 2; tr[p][11] = 5; tr[p][16] = 3; tr[p][18] = 5; }
    // кто ходит первым — бросаем по кубику, пока не будет разных значений
    let a, b; do { a = rnd6(); b = rnd6(); } while (a === b);
    const first = a > b ? 0 : 1;
    return { variant: v, names: names.slice(), tr, bar: [0, 0], off: [0, 0], turn: first, phase: 'roll', dice: [], left: [],
      head: 0, moved: [false, false], phase0: true, winner: null, reason: '', mars: false,
      last: `Жребий: ${names[0]} — ${a}, ${names[1]} — ${b}. Первым ходит ${names[first]}`, trail: [], opening: [a, b] };
  }

  // ---------- ходы ----------
  const clone = s => ({ variant: s.variant, tr: [s.tr[0].slice(), s.tr[1].slice()], bar: s.bar.slice(), off: s.off.slice(), head: s.head, first: s.first, dbl: s.dbl, die6: s.die6 });
  const allHome = (s, p) => s.bar[p] === 0 && s.tr[p].slice(0, 18).every(n => n === 0);
  // можно ли сделать шаг одной шашкой с from на die пунктов (без правила «используй оба кубика»)
  function stepOk(s, p, from, die) {
    const v = s.variant, q = 1 - p;
    if (v === 'short' && s.bar[p] > 0 && from !== -1) return false;
    if (from === -1) { if (v !== 'short' || s.bar[p] === 0) return false; }
    else if (!s.tr[p][from]) return false;
    const to = from + die;
    if (to >= 24) {                                          // выбрасывание
      if (!allHome(s, p)) return false;
      if (to > 24) for (let i = 18; i < from; i++) if (s.tr[p][i]) return false;
      return true;
    }
    const oq = s.tr[q][inv(v, q, abs(v, p, to))];
    if (v === 'long' ? oq > 0 : oq > 1) return false;
    if (v === 'long' && from === 0) {                         // с головы — одна шашка за ход (кроме 6-6, 4-4, 3-3 первым броском)
      const lim = s.first && s.dbl && [6, 4, 3].includes(s.die6) ? 2 : 1;
      if (s.head >= lim) return false;
    }
    if (v === 'long' && !blockOk(s, p, from, to)) return false;
    return true;
  }
  // длинные нарды: нельзя ставить «забор» из 6 пунктов подряд, если впереди него нет ни одной шашки соперника
  function blockOk(s, p, from, to) {
    const t = s.tr[p].slice(); t[from]--; t[to]++;
    const v = s.variant, q = 1 - p;
    for (let i = 0; i + 5 < 24; i++) {
      let ok = true; for (let k = 0; k < 6; k++) if (!t[i + k]) { ok = false; break; }
      if (!ok) continue;
      const idx = Array.from({ length: 6 }, (_, k) => inv(v, q, abs(v, p, i + k)));
      if (idx.some((x, k) => k && x < idx[k - 1])) continue;  // забор проходит через начало пути соперника — не ограничиваем
      const hi = Math.max(...idx);
      let ahead = s.off[q] > 0; for (let j = hi + 1; j < 24 && !ahead; j++) if (s.tr[q][j]) ahead = true;
      if (!ahead) return false;
    }
    return true;
  }
  function apply(s, p, from, die) {
    const v = s.variant, q = 1 - p, to = Math.min(from + die, 24);
    if (from === -1) s.bar[p]--; else s.tr[p][from]--;
    if (v === 'long' && from === 0) s.head++;
    if (to >= 24) { s.off[p]++; return { hit: false, to: 24 }; }
    const qi = inv(v, q, abs(v, p, to)); let hit = false;
    if (v === 'short' && s.tr[q][qi] === 1) { s.tr[q][qi] = 0; s.bar[q]++; hit = true; }
    s.tr[p][to]++;
    return { hit, to };
  }
  const key = s => s.tr[0].join(',') + '|' + s.tr[1].join(',') + '|' + s.bar + '|' + s.off + '|' + s.head;
  // все последовательности ходов (для правила «использовать максимум кубиков» и для бота)
  function sequences(s, p, left) {
    const out = [], seen = new Map();
    // возвращает, сколько ещё шагов можно сделать из этой позиции; повторные позиции не перебираем заново
    (function dfs(cur, rest, path) {
      let best = 0;
      const tried = new Set();
      for (let k = 0; k < rest.length; k++) {
        const d = rest[k]; if (tried.has(d)) continue; tried.add(d);
        const froms = cur.variant === 'short' && cur.bar[p] ? [-1] : cur.tr[p].map((n, i) => n ? i : -1).filter(i => i >= 0);
        for (const f of froms) {
          if (!stepOk(cur, p, f, d)) continue;
          const nx = clone(cur); apply(nx, p, f, d);
          const r2 = rest.slice(); r2.splice(k, 1);
          const step = path.concat([{ from: f, die: d }]), kk = key(nx) + '#' + r2.join('');
          let more;
          if (seen.has(kk)) { more = seen.get(kk); out.push({ path: step, len: step.length + more, end: null }); }
          else { seen.set(kk, 0); more = dfs(nx, r2, step); seen.set(kk, more); }
          best = Math.max(best, 1 + more);
        }
      }
      if (!best) out.push({ path, len: path.length, end: cur });
      return best;
    })(clone(s), left, []);
    return out;
  }
  function ctx(st) {                                          // рабочее состояние для правил текущего хода
    const s = clone(st); s.first = !st.moved[st.turn]; s.dbl = st.dice[0] === st.dice[1]; s.die6 = st.dice[0]; s.head = st.head; return s;
  }
  // законные шаги прямо сейчас: начало какой-либо максимальной последовательности
  function steps(st) {
    if (st.phase !== 'move') return [];
    const p = st.turn, seqs = sequences(ctx(st), p, st.left);
    const max = Math.max(0, ...seqs.map(x => x.len)); if (!max) return [];
    let best = seqs.filter(x => x.len === max);
    // если можно сыграть только один кубик из двух разных — обязательно больший
    if (max === 1 && st.left.length === 2 && st.left[0] !== st.left[1]) {
      const hi = Math.max(...st.left), big = best.filter(x => x.path[0].die === hi); if (big.length) best = big;
    }
    const res = [], u = new Set();
    for (const x of best) { const f = x.path[0], k = f.from + ':' + f.die; if (!u.has(k)) { u.add(k); res.push({ from: f.from, die: f.die, to: Math.min(f.from + f.die, 24) }); } }
    return res;
  }

  // ---------- партия ----------
  function endTurn(st) { st.moved[st.turn] = true; st.turn = 1 - st.turn; st.phase = 'roll'; st.left = []; st.head = 0; }
  function act(st, p, a) {
    if (st.phase === 'over') return { ok: false, err: 'Партия окончена' };
    if (p !== st.turn) return { ok: false, err: 'Сейчас ход соперника' };
    if (a.type === 'roll') {
      if (st.phase !== 'roll') return { ok: false, err: 'Кубики уже брошены' };
      const d = [rnd6(), rnd6()]; st.dice = d; st.left = d[0] === d[1] ? [d[0], d[0], d[0], d[0]] : d.slice(); st.phase = 'move'; st.head = 0; st.trail = [];
      st.last = `${st.names[p]}: ${d[0]}–${d[1]}`;
      if (!steps(st).length) { st.last += ' — ходов нет'; endTurn(st); }
      return { ok: true };
    }
    if (a.type === 'move') {
      if (st.phase !== 'move') return { ok: false, err: 'Сначала бросьте кубики' };
      const ok = steps(st).find(x => x.from === a.from && x.die === a.die);
      if (!ok) return { ok: false, err: 'Так ходить нельзя' };
      const r = apply(st, p, a.from, a.die);
      st.left.splice(st.left.indexOf(a.die), 1);
      st.trail.push({ p, from: a.from, to: r.to, hit: r.hit });
      if (r.hit) st.last = `${st.names[p]} бьёт шашку!`;
      if (st.off[p] === 15) {
        st.phase = 'over'; st.winner = p; const q = 1 - p;
        st.mars = st.off[q] === 0;
        const koks = st.variant === 'short' && st.mars && (st.bar[q] > 0 || st.tr[q].slice(0, 6).some(n => n));
        st.reason = koks ? 'Кокс (бэкгаммон)!' : st.mars ? 'Марс!' : 'Все шашки выброшены';
        return { ok: true };
      }
      if (!st.left.length || !steps(st).length) endTurn(st);
      return { ok: true };
    }
    return { ok: false, err: 'Неизвестный ход' };
  }
  const view = (st, me) => ({ ...st, me, legal: st.turn === me ? steps(st) : [] });
  const pips = (s, p) => s.tr[p].reduce((a, n, i) => a + n * (24 - i), 0) + s.bar[p] * 25;

  // ---------- бот ----------
  function score(s, p) {
    const q = 1 - p, v = s.variant;
    let sc = (pips(s, q) - pips(s, p)) * 1.0 + (s.off[p] - s.off[q]) * 6;
    const occ = Array(24).fill(0);                           // абсолютная доска: + мои, - соперника
    for (let i = 0; i < 24; i++) { if (s.tr[p][i]) occ[abs(v, p, i)] += s.tr[p][i]; if (s.tr[q][i]) occ[abs(v, q, i)] -= s.tr[q][i]; }
    if (v === 'short') {
      sc += s.bar[q] * 12 - s.bar[p] * 14;
      for (let i = 0; i < 24; i++) {
        const n = s.tr[p][i]; if (!n) continue;
        if (n >= 2) sc += i >= 12 ? 4 : 2;                     // занятые пункты
        if (n === 1) {                                          // одиночка под боем
          const a = abs(v, p, i); let threat = s.bar[q] && i < 6 ? 2 : 0;
          for (let j = 0; j < 24; j++) if (s.tr[q][j]) { const d = inv(v, q, a) - j; if (d >= 1 && d <= 12) threat += d <= 6 ? 3 : 1; }
          sc -= Math.min(threat, 8) * (1 + i / 24) * 2;
        }
      }
    } else {
      sc -= Math.max(0, s.tr[p][0] - (s.first ? 13 : 10)) * 1.5;   // не держать всё на голове
      for (let i = 1; i < 24; i++) if (s.tr[p][i]) sc += 1.6 + (i >= 12 && i < 18 ? 1 : 0);
      // блоки перед соперником
      let run = 0, bestRun = 0;
      for (let i = 0; i < 24; i++) { if (s.tr[p][i]) { run++; bestRun = Math.max(bestRun, run); } else run = 0; }
      sc += bestRun * bestRun * 0.8;
      sc -= s.tr[p].reduce((a, n) => a + Math.max(0, n - 4), 0) * 0.8;   // большие стопки
    }
    return sc;
  }
  function botMove(st, p, level = 2) {
    if (st.phase === 'over' || st.turn !== p) return null;
    if (st.phase === 'roll') return { type: 'roll' };
    const legal = steps(st); if (!legal.length) return null;
    const seqs = sequences(ctx(st), p, st.left), max = Math.max(...seqs.map(x => x.len));
    let cand = seqs.filter(x => x.end && x.len === max && legal.some(l => l.from === x.path[0].from && l.die === x.path[0].die));
    if (!cand.length) return { type: 'move', from: legal[0].from, die: legal[0].die };
    const noise = level >= 3 ? 0 : level === 2 ? 3 : 14;
    let best = null, bs = -Infinity;
    for (const c of cand) { const sc = score(c.end, p) + (Math.random() - .5) * noise; if (sc > bs) { bs = sc; best = c; } }
    return { type: 'move', from: best.path[0].from, die: best.path[0].die };
  }
  return { newGame, act, view, steps, botMove, abs, pips, sequences };
})();
if (typeof module !== 'undefined') module.exports = NardyEngine;
