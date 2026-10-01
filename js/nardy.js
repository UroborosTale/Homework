// Нарды: доска с 24 пунктами, бар, выброс шашек, кубики. Длинные и короткие правила — в NardyEngine.
(() => {
  const E = NardyEngine;
  const PIPS = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
  const die = (v, cls = '') => `<span class="pdie nd ${cls}">${Array.from({ length: 9 }, (_, i) => `<i${PIPS[v].includes(i + 1) ? ' class="on"' : ''}></i>`).join('')}</span>`;
  const COLOR = ['w', 'b'];
  let sel = null, prevTrail = 0, prevDice = '';

  Duel.create({
    id: 'nardy', engine: E,
    opts: [{ key: 'variant', label: 'Нарды', def: 'long', values: [['long', 'Длинные'], ['short', 'Короткие']] }],
    help: 'Длинные или короткие нарды против бота или друга онлайн.',
    rules: `<p><b>Длинные нарды.</b> У каждого 15 шашек на «голове». Шашки идут против часовой стрелки по всему кругу в свой дом (нижняя правая четверть).
      Бить нельзя: на пункт, где стоит хоть одна чужая шашка, ходить нельзя. С головы за ход снимается одна шашка (первым броском 6–6, 4–4 или 3–3 — две).
      Нельзя строить «забор» из 6 своих пунктов подряд, если впереди него нет ни одной шашки соперника.<br>
      <b>Короткие нарды (бэкгаммон).</b> Соперники идут навстречу. Одиночную шашку соперника можно побить — она уходит на бар и должна снова войти в игру через ваш дом. На пункт с двумя и более чужими шашками ходить нельзя.<br>
      <b>Общее.</b> Дубль играется 4 раза. Нужно использовать максимум кубиков; если можно сыграть только один из двух — обязательно больший.
      Когда все 15 шашек в доме, их можно выбрасывать. Побеждает тот, кто первым выбросит все. Если соперник не выбросил ни одной — «марс».<br>
      Нажмите на шашку, затем на подсвеченный пункт. Чтобы выбросить шашку — нажмите на лоток справа.</p>`,
    turnSeat: v => v.turn,
    playerInfo: (v, seat) => `${seat === 0 ? '⚪' : '⚫'} пипсов ${E.pips(v, seat)} · выброшено ${v.off[seat]}/15`,
    botDelay: (st, m) => m.type === 'roll' ? 750 : 520,
    overDelay: 1400,
    mount(board, api) {
      board.innerHTML = `<div class="nwrap"><div class="nboard"></div><div class="ntray"><div class="noff opp"></div><div class="noff me"></div></div></div>`;
      const B = board.querySelector('.nboard'), T = board.querySelector('.ntray');
      const roll = document.createElement('button'); roll.className = 'btn primary n-roll'; roll.textContent = '🎲 Бросить кубики';
      api.ctrl.prepend(roll); roll.onclick = () => api.send({ type: 'roll' });

      // ячейка отображения → индекс моей дорожки: верх справа налево 0..11, низ слева направо 12..23 (дом внизу справа)
      const slotTrack = (row, c) => row === 0 ? 11 - c : 12 + c;
      function stack(n, color, mineSide, fresh) {
        if (!n) return '';
        const vis = Math.min(n, 5);
        return Array.from({ length: vis }, (_, k) => `<i class="nck ${color}${fresh && k === vis - 1 ? ' land' : ''}">${k === vis - 1 && n > 5 ? n : ''}</i>`).join('');
      }
      function render(v, info) {
        if (info.fresh) { sel = null; prevTrail = 0; }
        const me = v.me, op = 1 - me, myTurn = v.phase === 'move' && v.turn === me;
        const legal = myTurn ? v.legal : [];
        if (sel !== null && !legal.some(l => l.from === sel)) sel = null;
        const dests = sel === null ? [] : legal.filter(l => l.from === sel);
        const landed = new Set(v.trail.slice(prevTrail).map(t => t.p + ':' + t.to)); prevTrail = v.trail.length;
        let html = '';
        for (const row of [0, 1]) {
          for (let c = 0; c < 12; c++) {
            if (c === 6) {                                       // бар посередине
              const who = row === 0 ? op : me, n = v.bar[who];
              const cls = ['nbar']; if (row === 1 && legal.some(l => l.from === -1)) cls.push('src'); if (row === 1 && sel === -1) cls.push('sel');
              html += `<div class="${cls.join(' ')} r${row}" data-from="${row === 1 ? -1 : ''}">${stack(n, COLOR[who])}</div>`;
            }
            const i = slotTrack(row, c), a = E.abs(v.variant, me, i), oi = E.abs(v.variant, op, a);
            const mineN = v.tr[me][i], oppN = v.tr[op][oi];
            const cls = ['npt', `r${row}`, (c + row) % 2 ? 'pa' : 'pb'];
            if (legal.some(l => l.from === i)) cls.push('src');
            if (sel === i) cls.push('sel');
            const d = dests.find(l => l.to === i); if (d) cls.push('dst');
            if (i >= 18) cls.push('home');
            html += `<div class="${cls.join(' ')}" data-i="${i}">${mineN ? stack(mineN, COLOR[me], true, landed.has(me + ':' + i)) : stack(oppN, COLOR[op], false, landed.has(op + ':' + oi))}${d ? `<b class="ndie-tag">${d.die}</b>` : ''}</div>`;
          }
          if (row === 0) {                                       // середина: кубики
            let dice = '';
            if (v.dice.length && (v.phase === 'move' || v.trail.length || v.phase === 'roll')) {
              const faces = v.dice[0] === v.dice[1] ? [v.dice[0], v.dice[0], v.dice[0], v.dice[0]] : v.dice;
              const leftCopy = v.left.slice();
              const spin = prevDice !== v.dice.join() + v.turn && v.phase === 'move' && !v.trail.length;
              prevDice = v.dice.join() + v.turn;
              dice = faces.map(f => { const j = leftCopy.indexOf(f), live = v.phase === 'move' && j >= 0; if (live) leftCopy.splice(j, 1); return die(f, (live ? '' : 'used') + (spin ? ' roll' : '')); }).join('');
            }
            html += `<div class="nmid">${dice}<span class="nturn">${v.phase === 'over' ? '' : v.turn === me ? (v.phase === 'roll' ? 'Ваш бросок' : 'Ваш ход') : 'Ход соперника'}</span></div>`;
          }
        }
        B.innerHTML = html;
        B.classList.toggle('flipcolor', me === 1);
        // лоток выброшенных
        const offDst = dests.find(l => l.to === 24);
        T.querySelector('.opp').innerHTML = `<span>${v.off[op]}</span>` + Array.from({ length: v.off[op] }, () => `<i class="nbar-ck ${COLOR[op]}"></i>`).join('');
        T.querySelector('.me').innerHTML = Array.from({ length: v.off[me] }, () => `<i class="nbar-ck ${COLOR[me]}"></i>`).join('') + `<span>${v.off[me]}</span>`;
        T.classList.toggle('dst', !!offDst);
        roll.style.display = v.phase === 'roll' && v.turn === me ? '' : 'none';
        let hint = '', cls = '';
        if (v.phase === 'over') hint = v.reason;
        else if (v.turn !== me) hint = `Ходит ${v.names[op]}…`;
        else if (v.phase === 'roll') { hint = 'Бросьте кубики'; cls = 'win'; }
        else { hint = sel === null ? 'Выберите шашку' : 'Выберите пункт (на нём — кубик хода)'; cls = 'win'; }
        api.msg(hint, cls);
      }
      B.onclick = e => {
        const v = api.view; if (!v || v.phase !== 'move' || v.turn !== v.me) return;
        const el = e.target.closest('.npt, .nbar'); if (!el) return;
        const i = el.classList.contains('nbar') ? (el.dataset.from === '-1' ? -1 : null) : +el.dataset.i;
        if (i === null) return;
        if (sel !== null) {
          const d = v.legal.filter(l => l.from === sel && l.to === i);
          if (d.length) { const from = sel; sel = null; return api.send({ type: 'move', from, die: d[0].die }); }
        }
        sel = v.legal.some(l => l.from === i) && sel !== i ? i : null;
        render(v, { fresh: false });
      };
      T.onclick = () => {
        const v = api.view; if (!v || sel === null) return;
        const d = v.legal.filter(l => l.from === sel && l.to === 24).sort((a, b) => a.die - b.die);
        if (d.length) { const from = sel; sel = null; api.send({ type: 'move', from, die: d[0].die }); }
      };
      return { render, reset() { sel = null; prevTrail = 0; prevDice = ''; } };
    },
  });
})();
