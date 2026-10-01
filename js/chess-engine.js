// Шахматы: полные правила (рокировка, взятие на проходе, превращение, мат, пат, ничьи) и бот (альфа-бета).
// Чистая логика без DOM — работает и в браузере, и в node (для тестов).
// Доска — массив из 64 клеток, индекс = ряд * 8 + вертикаль, ряд 0 — восьмая горизонталь (сверху у белых).
// Белые фигуры — заглавные буквы PNBRQK, чёрные — строчные, пустая клетка — '.'.
const ChessEngine = (() => {
  const START = 'rnbqkbnrpppppppp................................PPPPPPPPRNBQKBNR';
  const N = [-17, -15, -10, -6, 6, 10, 15, 17], KD = [-9, -8, -7, -1, 1, 7, 8, 9];
  const ROOK = [[-1, 0], [1, 0], [0, -1], [0, 1]], BISHOP = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  const fileOf = s => s & 7, rankOf = s => s >> 3;
  const colorOf = p => p === '.' ? null : (p < 'a' ? 'w' : 'b');
  const other = c => c === 'w' ? 'b' : 'w';
  const sqName = s => 'abcdefgh'[fileOf(s)] + (8 - rankOf(s));
  const typeOf = p => p.toUpperCase();

  // атакована ли клетка sq фигурами цвета by
  function attacked(b, sq, by) {
    const f = fileOf(sq), r = rankOf(sq), W = by === 'w';
    const pr = r + (W ? 1 : -1);                                  // белая пешка бьёт вверх, значит стоит ниже
    if (pr >= 0 && pr < 8) for (const df of [-1, 1]) { const ff = f + df; if (ff >= 0 && ff < 8 && b[pr * 8 + ff] === (W ? 'P' : 'p')) return true; }
    for (const [dr, df] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) {
      const rr = r + dr, ff = f + df; if (rr >= 0 && rr < 8 && ff >= 0 && ff < 8 && b[rr * 8 + ff] === (W ? 'N' : 'n')) return true;
    }
    for (let dr = -1; dr <= 1; dr++) for (let df = -1; df <= 1; df++) {
      if (!dr && !df) continue; const rr = r + dr, ff = f + df;
      if (rr >= 0 && rr < 8 && ff >= 0 && ff < 8 && b[rr * 8 + ff] === (W ? 'K' : 'k')) return true;
    }
    const slide = (dirs, kinds) => dirs.some(([dr, df]) => {
      let rr = r + dr, ff = f + df;
      while (rr >= 0 && rr < 8 && ff >= 0 && ff < 8) {
        const p = b[rr * 8 + ff];
        if (p !== '.') return colorOf(p) === by && kinds.includes(typeOf(p));
        rr += dr; ff += df;
      }
      return false;
    });
    return slide(ROOK, 'RQ') || slide(BISHOP, 'BQ');
  }
  const kingSq = (b, c) => b.indexOf(c === 'w' ? 'K' : 'k');
  const inCheck = (pos, c) => attacked(pos.b, kingSq(pos.b, c), other(c));

  // псевдолегальные ходы: { from, to, promo?, flag? } — flag: 'ep' | 'castle' | 'double'
  function pseudo(pos, onlyCaptures = false) {
    const { b, turn: c } = pos, out = [], W = c === 'w';
    for (let s = 0; s < 64; s++) {
      const p = b[s]; if (p === '.' || colorOf(p) !== c) continue;
      const t = typeOf(p), f = fileOf(s), r = rankOf(s);
      const add = (to, extra) => out.push({ from: s, to, ...extra });
      if (t === 'P') {
        const dir = W ? -1 : 1, r1 = r + dir, last = W ? 0 : 7, startR = W ? 6 : 1;
        const push = (to, cap) => { if (rankOf(to) === last) for (const pr of 'QRBN') add(to, { promo: W ? pr : pr.toLowerCase(), cap }); else add(to, cap ? { cap } : undefined); };
        if (r1 >= 0 && r1 < 8) {
          if (!onlyCaptures && b[r1 * 8 + f] === '.') {
            push(r1 * 8 + f);
            const r2 = r + 2 * dir; if (r === startR && b[r2 * 8 + f] === '.') add(r2 * 8 + f, { flag: 'double' });
          } else if (onlyCaptures && b[r1 * 8 + f] === '.' && rankOf(r1 * 8 + f) === last) push(r1 * 8 + f);   // превращение — тоже «тихий» сильный ход
          for (const df of [-1, 1]) {
            const ff = f + df; if (ff < 0 || ff > 7) continue; const to = r1 * 8 + ff;
            if (b[to] !== '.' && colorOf(b[to]) !== c) push(to, true);
            else if (to === pos.ep) add(to, { flag: 'ep', cap: true });
          }
        }
      } else if (t === 'N' || t === 'K') {
        const steps = t === 'N' ? [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]] : [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
        for (const [dr, df] of steps) {
          const rr = r + dr, ff = f + df; if (rr < 0 || rr > 7 || ff < 0 || ff > 7) continue;
          const to = rr * 8 + ff, q = b[to];
          if (q === '.') { if (!onlyCaptures) add(to); } else if (colorOf(q) !== c) add(to, { cap: true });
        }
        if (t === 'K' && !onlyCaptures) {                         // рокировка: поля пусты и не под боем
          const home = W ? 60 : 4, cr = pos.castle, them = other(c);
          if (s === home && !attacked(b, s, them)) {
            if (cr.includes(W ? 'K' : 'k') && b[s + 1] === '.' && b[s + 2] === '.' && b[s + 3] === (W ? 'R' : 'r') && !attacked(b, s + 1, them) && !attacked(b, s + 2, them)) add(s + 2, { flag: 'castle' });
            if (cr.includes(W ? 'Q' : 'q') && b[s - 1] === '.' && b[s - 2] === '.' && b[s - 3] === '.' && b[s - 4] === (W ? 'R' : 'r') && !attacked(b, s - 1, them) && !attacked(b, s - 2, them)) add(s - 2, { flag: 'castle' });
          }
        }
      } else {
        const dirs = t === 'R' ? ROOK : t === 'B' ? BISHOP : ROOK.concat(BISHOP);
        for (const [dr, df] of dirs) {
          let rr = r + dr, ff = f + df;
          while (rr >= 0 && rr < 8 && ff >= 0 && ff < 8) {
            const to = rr * 8 + ff, q = b[to];
            if (q === '.') { if (!onlyCaptures) add(to); }
            else { if (colorOf(q) !== c) add(to, { cap: true }); break; }
            rr += dr; ff += df;
          }
        }
      }
    }
    return out;
  }
  // сделать ход — новая позиция (исходная не меняется)
  function make(pos, m) {
    const b = pos.b.slice(), p = b[m.from], c = pos.turn, W = c === 'w';
    let castle = pos.castle, ep = -1, half = pos.half + 1;
    const captured = m.flag === 'ep' ? b[m.to + (W ? 8 : -8)] : b[m.to];
    if (typeOf(p) === 'P' || captured !== '.') half = 0;
    b[m.to] = m.promo || p; b[m.from] = '.';
    if (m.flag === 'ep') b[m.to + (W ? 8 : -8)] = '.';
    if (m.flag === 'double') ep = (m.from + m.to) / 2;
    if (m.flag === 'castle') { if (m.to > m.from) { b[m.to - 1] = b[m.to + 1]; b[m.to + 1] = '.'; } else { b[m.to + 1] = b[m.to - 2]; b[m.to - 2] = '.'; } }
    // права на рокировку пропадают при ходе короля/ладьи или взятии ладьи
    const LOSE = { 60: 'KQ', 63: 'K', 56: 'Q', 4: 'kq', 7: 'k', 0: 'q' };
    const drop = sq => { if (LOSE[sq]) for (const ch of LOSE[sq]) castle = castle.replace(ch, ''); };
    drop(m.from); drop(m.to);
    return { b, turn: other(c), castle, ep, half, full: pos.full + (W ? 0 : 1), captured: captured === '.' ? null : captured };
  }
  const legal = pos => pseudo(pos).filter(m => !inCheck(make(pos, m), pos.turn));
  const posKey = pos => pos.b.join('') + pos.turn + pos.castle + pos.ep;

  // ---------- нотация ----------
  const FIG = { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘' };
  function san(pos, m, moves) {
    const p = pos.b[m.from], t = typeOf(p);
    if (m.flag === 'castle') return m.to > m.from ? 'O-O' : 'O-O-O';
    let s = '';
    if (t === 'P') { if (m.cap) s = 'abcdefgh'[fileOf(m.from)]; }
    else {
      s = FIG[t];
      const twins = moves.filter(x => x !== m && x.to === m.to && pos.b[x.from] === p);
      if (twins.length) {
        if (!twins.some(x => fileOf(x.from) === fileOf(m.from))) s += 'abcdefgh'[fileOf(m.from)];
        else if (!twins.some(x => rankOf(x.from) === rankOf(m.from))) s += 8 - rankOf(m.from);
        else s += sqName(m.from);
      }
    }
    if (m.cap) s += '×';
    s += sqName(m.to);
    if (m.promo) s += '=' + FIG[typeOf(m.promo)];
    const nx = make(pos, m);
    if (inCheck(nx, nx.turn)) s += legal(nx).length ? '+' : '#';
    return s;
  }

  // ---------- партия ----------
  // names — [хозяин, гость]; cfg.color — цвет хозяина: white | black | random; в реваншах цвета чередуются
  function newGame(names, cfg = {}, gameNo = 1) {
    let white = cfg.color === 'black' ? 1 : cfg.color === 'random' ? (Math.random() < .5 ? 0 : 1) : 0;
    if (gameNo % 2 === 0) white = 1 - white;
    const st = { names: names.slice(), white, b: START.split(''), turn: 'w', castle: 'KQkq', ep: -1, half: 0, full: 1,
      phase: 'play', winner: null, reason: '', last: `${names[white]} играет белыми`, lastMove: null, moves: [], reps: {}, drawOffer: -1, taken: { w: [], b: [] } };
    st.reps[posKey(st)] = 1;
    return st;
  }
  const seatColor = (st, p) => (p === st.white ? 'w' : 'b');
  const seatOf = (st, c) => (c === 'w' ? st.white : 1 - st.white);
  function insufficient(b) {
    const pcs = b.map((p, s) => [p, s]).filter(([p]) => p !== '.' && typeOf(p) !== 'K');
    if (!pcs.length) return true;
    if (pcs.length === 1 && 'NB'.includes(typeOf(pcs[0][0]))) return true;
    if (pcs.every(([p]) => typeOf(p) === 'B')) { const col = new Set(pcs.map(([, s]) => (fileOf(s) + rankOf(s)) % 2)); return col.size === 1; }
    return false;
  }
  function act(st, p, a) {
    if (st.phase !== 'play') return { ok: false, err: 'Партия окончена' };
    const me = seatColor(st, p);
    switch (a && a.type) {
      case 'move': {
        if (st.turn !== me) return { ok: false, err: 'Сейчас ход соперника' };
        const moves = legal(st), m = moves.find(x => x.from === a.from && x.to === a.to && (!x.promo || typeOf(x.promo) === (a.promo || 'Q').toUpperCase()));
        if (!m) return { ok: false, err: 'Так ходить нельзя' };
        const note = san(st, m, moves), nx = make(st, m);
        if (nx.captured) st.taken[me].push(nx.captured);
        Object.assign(st, { b: nx.b, turn: nx.turn, castle: nx.castle, ep: nx.ep, half: nx.half, full: nx.full });
        st.lastMove = { from: m.from, to: m.to }; st.moves.push(note); st.drawOffer = -1;
        st.last = `${st.names[p]}: ${note}`;
        const k = posKey(st); st.reps[k] = (st.reps[k] || 0) + 1;
        const replies = legal(st);
        if (!replies.length) {
          st.phase = 'over';
          if (inCheck(st, st.turn)) { st.winner = p; st.reason = 'Мат'; } else { st.winner = null; st.reason = 'Пат — ничья'; }
        } else if (st.half >= 100) { st.phase = 'over'; st.reason = 'Ничья: 50 ходов без взятий и ходов пешкой'; }
        else if (st.reps[k] >= 3) { st.phase = 'over'; st.reason = 'Ничья: троекратное повторение позиции'; }
        else if (insufficient(st.b)) { st.phase = 'over'; st.reason = 'Ничья: недостаточно фигур для мата'; }
        return { ok: true };
      }
      case 'offer':
        if (st.drawOffer >= 0) return { ok: false, err: 'Ничья уже предложена' };
        st.drawOffer = p; st.last = `${st.names[p]} предлагает ничью`; return { ok: true };
      case 'accept':
        if (st.drawOffer < 0 || st.drawOffer === p) return { ok: false, err: 'Ничью никто не предлагал' };
        st.phase = 'over'; st.winner = null; st.reason = 'Ничья по соглашению'; return { ok: true };
      case 'decline':
        if (st.drawOffer < 0 || st.drawOffer === p) return { ok: false, err: 'Ничью никто не предлагал' };
        st.drawOffer = -1; st.last = `${st.names[p]} отклоняет ничью`; return { ok: true };
      default: return { ok: false, err: 'Неизвестный ход' };
    }
  }
  const view = (st, me) => ({ ...st, me, check: st.phase === 'play' && inCheck(st, st.turn) ? kingSq(st.b, st.turn) : -1 });

  // ---------- бот ----------
  const VAL = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 0 };
  // таблицы позиций (для белых, индекс как на доске; для чёрных — зеркально)
  const PST = {
    P: [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
    N: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
    B: [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
    R: [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
    Q: [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
    K: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20],
    KE: [-50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50],
  };
  // оценка с точки зрения белых
  function evaluate(b) {
    let s = 0, mat = 0;
    for (const p of b) if (p !== '.' && typeOf(p) !== 'P' && typeOf(p) !== 'K') mat += VAL[typeOf(p)];
    const endgame = mat <= 2600;
    for (let i = 0; i < 64; i++) {
      const p = b[i]; if (p === '.') continue;
      const t = typeOf(p), w = p < 'a', tbl = PST[t === 'K' && endgame ? 'KE' : t];
      const v = VAL[t] + tbl[w ? i : (7 - rankOf(i)) * 8 + fileOf(i)];
      s += w ? v : -v;
    }
    return s;
  }
  const MATE = 100000;
  const order = (pos, ms) => ms.map(m => ({ m, k: (m.cap ? 10 * VAL[typeOf(pos.b[m.to] === '.' ? 'P' : pos.b[m.to])] - VAL[typeOf(pos.b[m.from])] + 1000 : 0) + (m.promo ? 800 : 0) }))
    .sort((a, b) => b.k - a.k).map(x => x.m);
  function quiesce(pos, alpha, beta, depth, ctx) {
    ctx.nodes++;
    const stand = evaluate(pos.b) * (pos.turn === 'w' ? 1 : -1);
    if (stand >= beta) return beta;
    if (stand > alpha) alpha = stand;
    if (depth <= 0) return alpha;
    for (const m of order(pos, pseudo(pos, true))) {
      const nx = make(pos, m); if (inCheck(nx, pos.turn)) continue;
      const sc = -quiesce(nx, -beta, -alpha, depth - 1, ctx);
      if (sc >= beta) return beta;
      if (sc > alpha) alpha = sc;
    }
    return alpha;
  }
  function search(pos, depth, alpha, beta, ply, ctx) {
    if (depth <= 0) return quiesce(pos, alpha, beta, 6, ctx);
    ctx.nodes++;
    let any = false;
    for (const m of order(pos, pseudo(pos))) {
      const nx = make(pos, m); if (inCheck(nx, pos.turn)) continue;
      any = true;
      const sc = -search(nx, depth - 1, -beta, -alpha, ply + 1, ctx);
      if (sc >= beta) return beta;
      if (sc > alpha) alpha = sc;
      if (ctx.nodes > ctx.limit) break;
    }
    if (!any) return inCheck(pos, pos.turn) ? -MATE + ply : 0;
    return alpha;
  }
  // level: 1 — новичок, 2 — любитель, 3 — сильный
  function bestMove(pos, level = 2) {
    const moves = legal(pos); if (!moves.length) return null;
    const depth = level >= 3 ? 3 : level === 2 ? 2 : 1, noise = level >= 3 ? 4 : level === 2 ? 25 : 90;
    const ctx = { nodes: 0, limit: level >= 3 ? 400000 : 120000 };
    let best = null, bestSc = -Infinity;
    for (const m of order(pos, moves)) {
      const nx = make(pos, m);
      let sc = -search(nx, depth - 1, -MATE - 1, MATE + 1, 1, ctx);
      // повтор позиции — только если проигрываем
      const k = posKey(nx); if (pos.reps && pos.reps[k] >= 2 && sc > -150) sc -= 200;
      sc += (Math.random() - .5) * noise;
      if (sc > bestSc) { bestSc = sc; best = m; }
    }
    return { m: best, score: bestSc };
  }
  function botMove(st, p, level = 2) {
    if (st.phase !== 'play') return null;
    const me = seatColor(st, p);
    if (st.drawOffer >= 0 && st.drawOffer !== p) {           // предложение ничьи: соглашаемся, если хуже
      const e = evaluate(st.b) * (me === 'w' ? 1 : -1);
      return { type: e < -150 ? 'accept' : 'decline' };
    }
    if (st.turn !== me) return null;
    const r = bestMove(st, level); if (!r) return null;
    return { type: 'move', from: r.m.from, to: r.m.to, promo: r.m.promo ? typeOf(r.m.promo) : undefined };
  }
  return { START, legal, make, inCheck, attacked, newGame, act, view, botMove, bestMove, evaluate, seatColor, seatOf, sqName, colorOf, typeOf, san, insufficient, posKey };
})();
if (typeof module !== 'undefined') module.exports = ChessEngine;
