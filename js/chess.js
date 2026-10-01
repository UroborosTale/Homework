// Шахматы: доска, подсветка ходов, превращение пешки, предложение ничьей, запись партии
(() => {
  const E = ChessEngine;
  const GLYPH = { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' };
  const pieceHtml = p => `<span class="cp ${p < 'a' ? 'w' : 'b'}">${GLYPH[E.typeOf(p)]}︎</span>`;
  let sel = -1, promoPending = null, prevKey = '';

  Duel.create({
    id: 'chess', engine: E,
    opts: [{ key: 'color', label: 'Цвет хозяина', def: 'white', values: [['white', 'Белые'], ['black', 'Чёрные'], ['random', 'Случайно']] }],
    help: 'Классические шахматы против бота или друга онлайн. В реванше цвета меняются.',
    rules: `<p>Все правила классических шахмат: рокировка, взятие на проходе, превращение пешки (выбор фигуры).
      Ничья — пат, троекратное повторение, 50 ходов без взятий и ходов пешкой, недостаточно фигур для мата или по соглашению.<br>
      Нажмите на свою фигуру — точки покажут, куда она может пойти. Взятия обведены кружком.</p>`,
    turnSeat: v => E.seatOf(v, v.turn),
    playerInfo: (v, seat) => {
      const c = E.seatColor(v, seat), taken = v.taken[c].map(p => GLYPH[E.typeOf(p)] + '︎').join('');
      const VAL = { P: 1, N: 3, B: 3, R: 5, Q: 9 }, sum = cc => v.taken[cc].reduce((a, p) => a + VAL[E.typeOf(p)], 0);
      const diff = sum(c) - sum(c === 'w' ? 'b' : 'w');
      return `${c === 'w' ? '⚪ белые' : '⚫ чёрные'} <span class="cptaken ${c === 'w' ? 'b' : 'w'}">${taken}</span>${diff > 0 ? ` +${diff}` : ''}`;
    },
    botDelay: () => 450,
    mount(board, api) {
      board.innerHTML = `<div class="chwrap"><div class="chboard"></div><div class="chpromo" style="display:none"></div></div><ol class="chmoves"></ol>`;
      const B = board.querySelector('.chboard'), P = board.querySelector('.chpromo'), L = board.querySelector('.chmoves');
      const draw = document.createElement('button'); draw.className = 'btn ch-draw'; draw.textContent = '🤝 Предложить ничью';
      const acc = document.createElement('button'); acc.className = 'btn primary ch-acc'; acc.textContent = '✔ Принять ничью';
      const dec = document.createElement('button'); dec.className = 'btn ch-dec'; dec.textContent = '✕ Отклонить';
      api.ctrl.prepend(draw, acc, dec);
      draw.onclick = () => api.send({ type: 'offer' });
      acc.onclick = () => api.send({ type: 'accept' });
      dec.onclick = () => api.send({ type: 'decline' });

      const mine = v => v.phase === 'play' && E.seatColor(v, v.me) === v.turn;
      function render(v, info) {
        if (info.fresh) { sel = -1; promoPending = null; P.style.display = 'none'; }
        const flip = E.seatColor(v, v.me) === 'b', myTurn = mine(v);
        const moves = myTurn ? E.legal(v) : [];
        const targets = sel >= 0 ? moves.filter(m => m.from === sel) : [];
        const key = v.b.join('') + v.moves.length, moved = key !== prevKey && v.lastMove; prevKey = key;
        let html = '';
        for (let k = 0; k < 64; k++) {
          const s = flip ? 63 - k : k, r = s >> 3, f = s & 7, p = v.b[s];
          const cls = ['sq', (r + f) % 2 ? 'dk' : 'lt'];
          if (v.lastMove && (s === v.lastMove.from || s === v.lastMove.to)) cls.push('lastm');
          if (s === v.check) cls.push('check');
          if (s === sel) cls.push('sel');
          const t = targets.find(m => m.to === s); if (t) cls.push(t.cap ? 'cap' : 'dot');
          if (myTurn && p !== '.' && E.colorOf(p) === v.turn && moves.some(m => m.from === s)) cls.push('own');
          let inner = p !== '.' ? pieceHtml(p) : '';
          if (moved && s === v.lastMove.to && p !== '.') {           // анимация хода: фигура «едет» с исходной клетки
            const fr = v.lastMove.from, dx = ((fr & 7) - f) * (flip ? -1 : 1), dy = ((fr >> 3) - r) * (flip ? -1 : 1);
            inner = inner.replace('class="cp', `style="--dx:${dx * 100}%;--dy:${dy * 100}%" class="cp slide`);
          }
          const coord = (k % 8 === 0 ? `<i class="rk">${8 - r}</i>` : '') + (k >= 56 ? `<i class="fl">${'abcdefgh'[f]}</i>` : '');
          html += `<div class="${cls.join(' ')}" data-s="${s}">${inner}${coord}</div>`;
        }
        B.innerHTML = html;
        // запись партии
        L.innerHTML = v.moves.reduce((a, m, i) => i % 2 ? a : a + `<li><b>${i / 2 + 1}.</b> ${m} ${v.moves[i + 1] || ''}</li>`, '');
        L.scrollTop = L.scrollHeight;
        // кнопки ничьей
        const offer = v.drawOffer;
        draw.style.display = v.phase === 'play' && offer < 0 ? '' : 'none';
        acc.style.display = dec.style.display = v.phase === 'play' && offer >= 0 && offer !== v.me ? '' : 'none';
        let hint = '', cls = '';
        if (v.phase === 'over') hint = v.reason;
        else if (offer >= 0 && offer !== v.me) { hint = 'Соперник предлагает ничью'; cls = 'win'; }
        else if (offer === v.me) hint = 'Вы предложили ничью — ждём ответа';
        else if (myTurn) { hint = v.check >= 0 ? 'Шах! Ваш ход' : 'Ваш ход'; cls = 'win'; }
        else hint = `Ходит ${v.names[E.seatOf(v, v.turn)]}…`;
        api.msg(hint, cls);
      }
      B.onclick = e => {
        const v = api.view; if (!v) return;
        const sq = e.target.closest('.sq'); if (!sq || !mine(v) || promoPending) return;
        const s = +sq.dataset.s, moves = E.legal(v), p = v.b[s];
        if (sel >= 0) {
          const opts = moves.filter(m => m.from === sel && m.to === s);
          if (opts.length) {
            if (opts[0].promo) return askPromo(sel, s, E.colorOf(v.b[sel]));
            const from = sel; sel = -1; return api.send({ type: 'move', from, to: s });
          }
        }
        if (p !== '.' && E.colorOf(p) === v.turn && moves.some(m => m.from === s)) sel = s === sel ? -1 : s;
        else sel = -1;
        render(v, { fresh: false });
      };
      function askPromo(from, to, c) {
        promoPending = { from, to };
        P.innerHTML = '<div>Превратить в:</div>' + ['Q', 'R', 'B', 'N'].map(t => `<button class="btn" data-t="${t}">${pieceHtml(c === 'w' ? t : t.toLowerCase())}</button>`).join('');
        P.style.display = 'flex';
      }
      P.onclick = e => {
        const b = e.target.closest('[data-t]'); if (!b || !promoPending) return;
        const { from, to } = promoPending; promoPending = null; sel = -1; P.style.display = 'none';
        api.send({ type: 'move', from, to, promo: b.dataset.t });
      };
      return { render, reset() { sel = -1; promoPending = null; prevKey = ''; P.style.display = 'none'; } };
    },
  });
})();
