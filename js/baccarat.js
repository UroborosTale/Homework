// Баккара: Игрок / Банкир / Ничья
(() => {
  const { $, sleep, msg, fmt, setBalance, readBet, cardEl, shoe } = Casino;
  let deck = [], side = 'player', busy = false;
  const val = c => ('JQK'.includes(c.r) || c.r === '10') ? 0 : c.r === 'A' ? 1 : +c.r;
  const score = h => h.reduce((a, c) => a + val(c), 0) % 10;
  const draw = () => { if (deck.length < 20) deck = shoe(8); return deck.pop(); };

  $('bcSides').onclick = e => {
    if (!e.target.dataset.side || busy) return; side = e.target.dataset.side;
    $('bcSides').querySelectorAll('button').forEach(b => b.classList.toggle('active', b === e.target));
  };
  const show = (p, b) => {
    $('bcP').replaceChildren(...p.map(c => cardEl(c))); $('bcB').replaceChildren(...b.map(c => cardEl(c)));
    $('bcPs').textContent = p.length ? score(p) : ''; $('bcBs').textContent = b.length ? score(b) : '';
  };
  $('bcDeal').onclick = async () => {
    if (busy) return; const bet = readBet($('bcBet'), $('bcMsg')); if (!bet) return;
    busy = true; $('bcDeal').disabled = true; setBalance(Casino.balance - bet); msg($('bcMsg'), 'Раздача…');
    const P = [], B = [];
    for (const [hand, who] of [[P, 0], [B, 1], [P, 0], [B, 1]]) { hand.push(draw()); show(P, B); await sleep(450); }
    if (score(P) < 8 && score(B) < 8) {                 // натурала нет — третья карта по правилам
      let p3 = null;
      if (score(P) <= 5) { p3 = draw(); P.push(p3); show(P, B); await sleep(500); }
      const b = score(B); let bDraw;
      if (p3 === null) bDraw = b <= 5;
      else { const v = val(p3); bDraw = b <= 2 || (b === 3 && v !== 8) || (b === 4 && v >= 2 && v <= 7) || (b === 5 && v >= 4 && v <= 7) || (b === 6 && (v === 6 || v === 7)); }
      if (bDraw) { B.push(draw()); show(P, B); await sleep(500); }
    }
    const ps = score(P), bs = score(B), res = ps > bs ? 'player' : bs > ps ? 'banker' : 'tie';
    let pay = 0;
    if (res === 'tie') pay = side === 'tie' ? bet * 9 : bet;          // при ничьей ставки на игрока/банкира возвращаются
    else if (side === res) pay = res === 'banker' ? bet * 1.95 : bet * 2;
    const names = { player: 'Игрок', banker: 'Банкир', tie: 'Ничья' };
    setBalance(Casino.balance + pay);
    const net = pay - bet;
    msg($('bcMsg'), `${names[res]} (${ps}:${bs}). ` + (net > 0 ? `Выигрыш ${fmt(net)} ₽` : net === 0 ? 'Ставка возвращена.' : 'Проигрыш.'), net > 0 ? 'win' : net < 0 ? 'lose' : '');
    busy = false; $('bcDeal').disabled = false;
  };
})();
