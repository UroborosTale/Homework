// Морской бой: расстановка (случайно или вручную), стрельба по полю соперника
(() => {
  const E = SeaEngine, S = E.S, COLS = 'АБВГДЕЖЗИК';
  let selShip = -1, prevShots = '', prevOpp = '';

  Duel.create({
    id: 'sea', engine: E,
    help: 'Морской бой 10×10 против бота или друга онлайн.',
    rules: `<p>Флот: один 4-палубный, два 3-палубных, три 2-палубных и четыре одиночных корабля. Корабли не касаются друг друга даже углами.<br>
      Расстановка: «Случайно» — новая расстановка; или нажмите на свой корабль, затем на клетку, куда его поставить, и «Повернуть».<br>
      Стреляйте по полю соперника. Попали — стреляете ещё раз. Вокруг потопленного корабля клетки отмечаются сами. Побеждает тот, кто первым потопит весь флот.</p>`,
    turnSeat: v => v.phase === 'play' ? v.turn : -1,
    playerInfo: (v, seat) => v.phase === 'setup' ? (v.ready[seat] ? '✔ готов' : 'расставляет флот…') : `🚢 кораблей: ${v.left[seat === v.me ? 0 : 1]}`,
    botDelay: (st, m) => m.type === 'ready' ? 1200 : 750,
    overDelay: 1600,
    mount(board, api) {
      board.innerHTML = `<div class="sewrap">
        <div class="sefield mine"><div class="setitle">Ваш флот</div><div class="segrid"></div></div>
        <div class="sefield opp"><div class="setitle">Поле соперника</div><div class="segrid"></div></div></div>`;
      const MG = board.querySelector('.mine .segrid'), OG = board.querySelector('.opp .segrid'), OF = board.querySelector('.sefield.opp');
      const mk = (t, cls, fn) => { const b = document.createElement('button'); b.className = 'btn ' + cls; b.textContent = t; b.onclick = fn; return b; };
      const shuffle = mk('🔀 Случайно', 'se-shuffle', () => { selShip = -1; api.send({ type: 'shuffle' }); });
      const rotate = mk('↻ Повернуть', 'se-rotate', () => rotateSel());
      const ready = mk('✔ Готов', 'primary se-ready', () => { selShip = -1; api.send({ type: 'ready' }); });
      api.ctrl.prepend(shuffle, rotate, ready);

      const labels = () => `<i class="secorner"></i>${[...COLS].map(c => `<i class="selab">${c}</i>`).join('')}`;
      function grid(el, cells, clickable) {
        let h = labels();
        for (let y = 0; y < S; y++) { h += `<i class="selab">${y + 1}</i>`; for (let x = 0; x < S; x++) h += cells(x, y); }
        el.innerHTML = h; el.classList.toggle('aim', clickable);
      }
      const shipCell = (ships, x, y) => ships.findIndex(sh => E.cellsOf(sh).some(([a, b]) => a === x && b === y));
      // класс клетки с частью корабля: начало/конец для скруглений
      const part = (sh, x, y) => { const cs = E.cellsOf(sh), i = cs.findIndex(([a, b]) => a === x && b === y); return sh.len === 1 ? 'one' : i === 0 ? (sh.v ? 'top' : 'left') : i === sh.len - 1 ? (sh.v ? 'bot' : 'right') : (sh.v ? 'midv' : 'midh'); };

      function render(v, info) {
        if (info.fresh) { selShip = -1; prevShots = ''; prevOpp = ''; }
        const setup = v.phase === 'setup', canEdit = setup && !v.ready[v.me];
        if (!canEdit) selShip = -1;
        const myShotKey = v.myShots.length, oppShotKey = v.oppShots.length;
        // мой флот + выстрелы соперника
        grid(MG, (x, y) => {
          const i = shipCell(v.myShips, x, y), sh = v.myShips[i], s = v.oppShots.find(o => o.x === x && o.y === y);
          const cls = ['sec'];
          if (sh) cls.push('ship', part(sh, x, y)); if (sh && sh.sunk) cls.push('sunk'); if (i === selShip) cls.push('selship');
          if (s) cls.push(s.hit ? 'hit' : 'miss'); if (s && !s.auto && v.lastShot && v.lastShot.p !== v.me && v.lastShot.x === x && v.lastShot.y === y && prevOpp !== oppShotKey) cls.push('fresh');
          return `<i class="${cls.join(' ')}" data-x="${x}" data-y="${y}"></i>`;
        }, false);
        // поле соперника
        const aim = v.phase === 'play' && v.turn === v.me;
        grid(OG, (x, y) => {
          const s = v.myShots.find(o => o.x === x && o.y === y), i = shipCell(v.oppShips, x, y), sh = v.oppShips[i];
          const cls = ['sec'];
          if (sh) cls.push('ship', part(sh, x, y), sh.sunk ? 'sunk' : 'reveal');
          if (s) cls.push(s.hit ? 'hit' : 'miss'); else if (aim) cls.push('free');
          if (s && !s.auto && v.lastShot && v.lastShot.p === v.me && v.lastShot.x === x && v.lastShot.y === y && prevShots !== myShotKey) cls.push('fresh');
          return `<i class="${cls.join(' ')}" data-x="${x}" data-y="${y}"></i>`;
        }, aim);
        prevShots = myShotKey; prevOpp = oppShotKey;
        OF.classList.toggle('dim', setup);
        shuffle.style.display = canEdit ? '' : 'none'; ready.style.display = canEdit ? '' : 'none';
        rotate.style.display = canEdit ? '' : 'none'; rotate.disabled = selShip < 0;
        let hint = '', cls = '';
        if (v.phase === 'over') hint = v.reason;
        else if (setup) hint = v.ready[v.me] ? 'Ждём, пока соперник расставит флот…' : selShip >= 0 ? 'Нажмите клетку, куда поставить корабль, или «Повернуть»' : 'Расставьте флот: «Случайно» или нажмите на корабль, чтобы переставить. Затем «Готов»';
        else if (aim) { hint = 'Ваш выстрел — выберите клетку на поле соперника'; cls = 'win'; }
        else hint = `Стреляет ${v.names[1 - v.me]}…`;
        api.msg(hint, cls);
      }
      function place(ships) { api.send({ type: 'place', ships: ships.map(({ x, y, v, len }) => ({ x, y, v, len })) }); }
      function rotateSel() {
        const v = api.view; if (!v || selShip < 0) return;
        const ships = v.myShips.map(s => ({ ...s })), sh = { ...ships[selShip], v: !ships[selShip].v };
        if (!E.fits(ships, sh, selShip)) return SlotUI.toast('Повернуть не получится — мешают другие корабли или край поля');
        ships[selShip] = sh; place(ships);
      }
      MG.onclick = e => {
        const v = api.view, c = e.target.closest('.sec'); if (!v || !c || v.phase !== 'setup' || v.ready[v.me]) return;
        const x = +c.dataset.x, y = +c.dataset.y, i = shipCell(v.myShips, x, y);
        if (i >= 0 && i !== selShip) { selShip = i; return render(v, { fresh: false }); }
        if (i === selShip && i >= 0) { selShip = -1; return render(v, { fresh: false }); }
        if (selShip < 0) return;
        const ships = v.myShips.map(s => ({ ...s })), sh = { ...ships[selShip], x, y };
        if (!E.fits(ships, sh, selShip)) return SlotUI.toast('Сюда нельзя: корабли не должны касаться');
        ships[selShip] = sh; place(ships);
      };
      OG.onclick = e => {
        const v = api.view, c = e.target.closest('.sec.free'); if (!v || !c) return;
        api.send({ type: 'shot', x: +c.dataset.x, y: +c.dataset.y });
      };
      return { render, reset() { selShip = -1; prevShots = ''; prevOpp = ''; } };
    },
  });
})();
