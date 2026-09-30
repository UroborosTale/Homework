(() => {
  const { $, rnd, sleep, msg, fmt, setBalance, readBet } = Casino;
  /* ================= БЛЭКДЖЕК ================= */
  const { cardEl, syncHand } = Casino;
  const SUITS = ['♠', '♥', '♦', '♣'], RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  let deck = [], player = [], dealer = [], bjBet = 0, bjState = 'idle', canDouble = false;

  function newDeck() {
    deck = [];
    for (let d = 0; d < 4; d++) for (const s of SUITS) for (const r of RANKS) deck.push({ s, r });
    for (let i = deck.length - 1; i > 0; i--) { const j = rnd(i + 1); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  }
  const draw = () => { if (deck.length < 15) newDeck(); return deck.pop(); };
  function score(hand) {
    let t = 0, aces = 0;
    for (const c of hand) {
      if (c.r === 'A') { aces++; t += 11; } else t += 'JQK'.includes(c.r) ? 10 : +c.r;
    }
    while (t > 21 && aces) { t -= 10; aces--; }
    return t;
  }
  const isBJ = h => h.length === 2 && score(h) === 21;
  function render(hideDealer) {
    syncHand($('pHand'), player, [], { offset: 0, stagger: 0.18 });
    syncHand($('dHand'), dealer, hideDealer ? [1] : [], { offset: 0.09, stagger: 0.18 });
    $('pScore').textContent = player.length ? score(player) : '';
    $('dScore').textContent = dealer.length ? (hideDealer ? score([dealer[0]]) : score(dealer)) : '';
  }
  function setActions(on) {
    $('bjActions').style.display = on ? 'flex' : 'none';
    $('bjBetRow').style.display = on ? 'none' : 'flex';
    $('double').disabled = !(on && canDouble && Casino.balance >= bjBet);
  }
  function finish(result, text) {
    bjState = 'idle';
    let pay = 0, cls = 'lose';
    if (result === 'blackjack') { pay = bjBet * 2.5; cls = 'win'; }
    else if (result === 'win') { pay = bjBet * 2; cls = 'win'; }
    else if (result === 'push') { pay = bjBet; cls = ''; }
    setBalance(Casino.balance + pay);
    render(false); setActions(false);
    msg($('bjMsg'), text + (pay > bjBet ? ` Выигрыш: ${pay - bjBet} ₽` : ''), cls);
  }
  $('deal').onclick = () => {
    if (bjState !== 'idle') return;
    const bet = readBet($('bjBet'), $('bjMsg')); if (!bet) return;
    if (deck.length < 15) newDeck();
    bjBet = bet; setBalance(Casino.balance - bet);
    player = [draw(), draw()]; dealer = [draw(), draw()];
    bjState = 'player'; canDouble = true; msg($('bjMsg'), 'Ваш ход');
    render(true); setActions(true);
    const pbj = isBJ(player), dbj = isBJ(dealer);
    if (pbj || dbj) {
      if (pbj && dbj) finish('push', 'Оба блэкджек — ничья.');
      else if (pbj) finish('blackjack', 'БЛЭКДЖЕК! 3:2');
      else finish('lose', 'У дилера блэкджек.');
    }
  };
  $('hit').onclick = () => {
    if (bjState !== 'player') return;
    canDouble = false; player.push(draw()); render(true);
    const s = score(player);
    if (s > 21) finish('lose', `Перебор (${s}).`);
    else if (s === 21) dealerPlay();
    else setActions(true);
  };
  $('stand').onclick = () => { if (bjState === 'player') dealerPlay(); };
  $('double').onclick = () => {
    if (bjState !== 'player' || !canDouble || Casino.balance < bjBet) return;
    setBalance(Casino.balance - bjBet); bjBet *= 2; player.push(draw()); render(true);
    if (score(player) > 21) finish('lose', `Перебор (${score(player)}).`); else dealerPlay();
  };
  async function dealerPlay() {
    bjState = 'dealer'; setActions(false); $('bjActions').style.display = 'flex';
    document.querySelectorAll('#bjActions button').forEach(b => b.disabled = true);
    render(false); await sleep(600);
    while (score(dealer) < 17) { dealer.push(draw()); render(false); await sleep(700); }
    document.querySelectorAll('#bjActions button').forEach(b => b.disabled = false);
    const p = score(player), d = score(dealer);
    if (d > 21) finish('win', `У дилера перебор (${d}). Вы выиграли!`);
    else if (p > d) finish('win', `${p} против ${d}. Вы выиграли!`);
    else if (p < d) finish('lose', `${p} против ${d}. Дилер выиграл.`);
    else finish('push', `${p} — ничья.`);
  }
  newDeck();
})();
