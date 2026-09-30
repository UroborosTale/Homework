// Блэкджек: сплит (до 4 рук), удвоение (и после сплита), страховка, сдача, фишки, подсказка по базовой стратегии
(() => {
  const { $, rnd, sleep, msg, fmt, setBalance, syncHand } = Casino;
  const SUITS = ['♠', '♥', '♦', '♣'], RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  let deck = [], dealer = [], hands = [], cur = 0, state = 'idle', lastBet = 0, insurance = 0;
  const stats = { w: 0, l: 0, p: 0 };

  function newDeck() {
    deck = [];
    for (let d = 0; d < 6; d++) for (const s of SUITS) for (const r of RANKS) deck.push({ s, r });
    for (let i = deck.length - 1; i > 0; i--) { const j = rnd(i + 1); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  }
  const draw = () => { if (deck.length < 30) newDeck(); return deck.pop(); };
  const val = c => c.r === 'A' ? 11 : 'JQK'.includes(c.r) ? 10 : +c.r;
  function total(cards) {                                   // { t — лучший счёт, soft — есть ли туз, считающийся 11 }
    let t = 0, aces = 0; for (const c of cards) { t += val(c); if (c.r === 'A') aces++; }
    while (t > 21 && aces) { t -= 10; aces--; }
    return { t, soft: aces > 0 && t <= 21 };
  }
  const label = cards => { const { t, soft } = total(cards); return soft && t < 21 ? `${t - 10} / ${t}` : String(t); };
  const isBJ = h => h.cards.length === 2 && total(h.cards).t === 21 && !h.split;
  const hand = () => hands[cur];

  // ---- фишки и ставка
  const betEl = $('bjBet');
  const getBet = () => Math.max(0, Math.floor(+betEl.value) || 0);
  function setBet(v) { betEl.value = Math.max(0, Math.floor(v)); drawStack(); }
  function drawStack() {                                    // стопка фишек в круге ставки
    let v = getBet(); const box = $('bjStack'), vals = [5000, 1000, 500, 100, 50, 10], chips = [];
    for (const c of vals) while (v >= c && chips.length < 12) { chips.push(c); v -= c; }
    box.innerHTML = chips.map((c, i) => `<i class="bjc c${c}" style="bottom:${i * 4}px"></i>`).join('') + `<b>${getBet() || ''}</b>`;
  }
  document.querySelectorAll('#bjChips [data-c]').forEach(b => b.onclick = () => { if (state === 'idle') setBet(getBet() + +b.dataset.c); });
  $('bjClear').onclick = () => { if (state === 'idle') setBet(0); };
  $('bjRebet').onclick = () => { if (state === 'idle' && lastBet) setBet(lastBet); };
  $('bjX2').onclick = () => { if (state === 'idle') setBet(getBet() * 2); };
  betEl.oninput = drawStack;

  // ---- отрисовка
  function render(hideDealer) {
    syncHand($('dHand'), dealer, hideDealer ? [1] : [], { offset: 0.09, stagger: 0.18 });
    $('dScore').textContent = dealer.length ? (hideDealer ? label([dealer[0]]) : label(dealer)) : '';
    const box = $('pHands');
    while (box.children.length > hands.length) box.lastChild.remove();
    hands.forEach((h, i) => {
      let el = box.children[i];
      if (!el) { el = document.createElement('div'); el.className = 'phand'; el.innerHTML = '<div class="hand-label"><span class="hb"></span> <b></b> <em></em></div><div class="hand"></div>'; box.appendChild(el); }
      el.classList.toggle('active', state === 'player' && i === cur && hands.length > 1);
      el.querySelector('.hb').textContent = hands.length > 1 ? `Рука ${i + 1} · ${h.bet} ₽` : `Вы · ${h.bet} ₽`;
      el.querySelector('b').textContent = label(h.cards);
      el.querySelector('em').textContent = h.result || '';
      el.querySelector('em').className = h.cls || '';
      syncHand(el.querySelector('.hand'), h.cards, [], { offset: 0, stagger: 0.18 });
    });
  }
  function buttons() {
    const h = hand(), on = state === 'player';
    $('bjActions').style.display = on || state === 'insurance' ? 'flex' : 'none';
    $('bjBetRow').style.display = state === 'idle' ? 'flex' : 'none';
    $('bjInsRow').style.display = state === 'insurance' ? 'flex' : 'none';
    ['hit', 'stand', 'double', 'split', 'surrender', 'bjHint'].forEach(id => $(id).style.display = on ? '' : 'none');
    if (!on) return;
    const two = h.cards.length === 2, bal = Casino.balance >= h.bet;
    $('double').disabled = !(two && bal);
    $('split').disabled = !(two && val(h.cards[0]) === val(h.cards[1]) && hands.length < 4 && bal);
    $('surrender').disabled = !(two && hands.length === 1 && !h.split);
    $('hit').disabled = $('stand').disabled = false;
  }
  function updStats() { $('bjStats').textContent = `Побед: ${stats.w} · Поражений: ${stats.l} · Ничьих: ${stats.p}`; }

  // ---- ход игры
  $('deal').onclick = async () => {
    if (state !== 'idle') return;
    const bet = getBet();
    if (bet < 1) return msg($('bjMsg'), 'Поставьте фишки', 'lose');
    if (bet > Casino.balance) return msg($('bjMsg'), 'Недостаточно средств', 'lose');
    lastBet = bet; setBalance(Casino.balance - bet); insurance = 0;
    hands = [{ cards: [draw(), draw()], bet, done: false }]; dealer = [draw(), draw()]; cur = 0;
    state = 'dealing'; render(true); buttons(); await sleep(800);
    const up = dealer[0];
    if (up.r === 'A' && Casino.balance >= bet / 2 && !isBJ(hands[0])) {         // предложить страховку
      state = 'insurance'; buttons(); msg($('bjMsg'), 'У дилера туз. Страховка? (половина ставки, платит 2:1)'); return;
    }
    await afterPeek();
  };
  async function insure(yes) {
    if (state !== 'insurance') return;
    if (yes) { insurance = hands[0].bet / 2; setBalance(Casino.balance - insurance); }
    state = 'dealing'; buttons(); await afterPeek();
  }
  $('insYes').onclick = () => insure(true); $('insNo').onclick = () => insure(false);

  async function afterPeek() {                              // дилер проверяет блэкджек при тузе или десятке
    const dbj = total(dealer).t === 21, pbj = isBJ(hands[0]);
    if (val(dealer[0]) >= 10 && dbj) {
      if (insurance) { setBalance(Casino.balance + insurance * 3); msg($('bjMsg'), 'У дилера блэкджек — страховка выплачена 2:1', 'win'); await sleep(900); }
      return settle(true);
    }
    if (insurance) msg($('bjMsg'), 'У дилера нет блэкджека — страховка проиграна', 'lose');
    if (pbj) return settle(false);
    state = 'player'; render(true); buttons(); if (!insurance) msg($('bjMsg'), 'Ваш ход');
  }
  async function next() {                                   // к следующей руке или к дилеру
    hand().done = true;
    while (cur < hands.length && hands[cur].done) cur++;
    if (cur < hands.length) {
      if (hands[cur].cards.length === 1) { hands[cur].cards.push(draw()); render(true); await sleep(350); }
      if (hands[cur].aces) { hands[cur].done = true; return next(); }                  // после сплита тузов — по одной карте
      state = 'player'; render(true); buttons(); msg($('bjMsg'), `Рука ${cur + 1}: ваш ход`); return;
    }
    cur = hands.length - 1; await dealerPlay();
  }
  $('hit').onclick = async () => {
    if (state !== 'player') return; const h = hand();
    h.cards.push(draw()); render(true);
    const t = total(h.cards).t;
    if (t > 21) { h.result = 'Перебор'; h.cls = 'lose'; state = 'busy'; buttons(); await sleep(500); return next(); }
    if (t === 21) { state = 'busy'; buttons(); await sleep(400); return next(); }
    buttons();
  };
  $('stand').onclick = () => { if (state === 'player') { state = 'busy'; buttons(); next(); } };
  $('double').onclick = async () => {
    const h = hand(); if (state !== 'player' || h.cards.length !== 2 || Casino.balance < h.bet) return;
    setBalance(Casino.balance - h.bet); h.bet *= 2; h.doubled = true; h.cards.push(draw()); state = 'busy'; render(true); buttons();
    if (total(h.cards).t > 21) { h.result = 'Перебор'; h.cls = 'lose'; }
    await sleep(600); next();
  };
  $('split').onclick = async () => {
    const h = hand(); if (state !== 'player' || $('split').disabled) return;
    setBalance(Casino.balance - h.bet);
    const aces = h.cards[0].r === 'A', b = { cards: [h.cards.pop()], bet: h.bet, split: true, aces };
    h.split = true; h.aces = aces; hands.splice(cur + 1, 0, b);
    state = 'busy'; render(true); await sleep(350);
    h.cards.push(draw()); render(true); await sleep(350);
    if (aces) { h.done = true; return next(); }
    state = 'player'; render(true); buttons(); msg($('bjMsg'), `Рука ${cur + 1}: ваш ход`);
  };
  $('surrender').onclick = () => {
    const h = hand(); if (state !== 'player' || $('surrender').disabled) return;
    h.surrender = true; h.result = 'Сдача'; h.cls = ''; setBalance(Casino.balance + h.bet / 2); state = 'busy'; buttons();
    settle(false, true);
  };

  async function dealerPlay() {
    state = 'dealer'; buttons(); render(false); await sleep(700);
    const live = hands.some(h => !h.surrender && total(h.cards).t <= 21);
    if (live) while (total(dealer).t < 17) { dealer.push(draw()); render(false); await sleep(700); }
    settle(false);
  }
  function settle(dealerBJ, surrendered) {
    render(false);
    const d = total(dealer).t; let back = 0, spent = 0;
    for (const h of hands) {
      spent += h.bet; const p = total(h.cards).t;
      if (h.surrender) { back += h.bet / 2; stats.l++; continue; }
      let r;
      if (dealerBJ) r = isBJ(h) ? 'push' : 'lose';
      else if (isBJ(h)) r = 'bj';
      else if (p > 21) r = 'lose';
      else if (d > 21 || p > d) r = 'win';
      else if (p < d) r = 'lose'; else r = 'push';
      const pay = r === 'bj' ? h.bet * 2.5 : r === 'win' ? h.bet * 2 : r === 'push' ? h.bet : 0;
      back += pay;
      h.result = { bj: 'Блэкджек 3:2!', win: 'Победа', lose: h.result || 'Проигрыш', push: 'Ничья' }[r];
      h.cls = r === 'bj' || r === 'win' ? 'win' : r === 'lose' ? 'lose' : '';
      stats[r === 'bj' || r === 'win' ? 'w' : r === 'lose' ? 'l' : 'p']++;
    }
    if (!surrendered) setBalance(Casino.balance + back);
    state = 'idle'; render(false); buttons(); updStats();
    const net = back - spent;
    const dtxt = dealerBJ ? 'У дилера блэкджек. ' : d > 21 ? `У дилера перебор (${d}). ` : `Дилер: ${d}. `;
    msg($('bjMsg'), surrendered ? 'Вы сдались — возвращена половина ставки.' : dtxt + (net > 0 ? `Выигрыш ${fmt(net)} ₽` : net === 0 ? 'Ставки возвращены.' : `Проигрыш ${fmt(-net)} ₽`), net > 0 ? 'win' : net < 0 ? 'lose' : '');
    if (net > 0) Anim.winFx(back, spent);
  }

  // ---- подсказка: базовая стратегия (6 колод, дилер стоит на мягких 17)
  function advice() {
    const h = hand(), up = val(dealer[0]), { t, soft } = total(h.cards), two = h.cards.length === 2;
    const can = { d: two && Casino.balance >= h.bet, p: !$('split').disabled, r: !$('surrender').disabled };
    if (two && val(h.cards[0]) === val(h.cards[1]) && can.p) {
      const v = val(h.cards[0]);
      if (v === 11 || v === 8) return 'Сплит';
      if ((v === 2 || v === 3 || v === 7) && up <= 7) return 'Сплит';
      if (v === 6 && up <= 6) return 'Сплит';
      if (v === 9 && up <= 9 && up !== 7) return 'Сплит';
      if (v === 4 && (up === 5 || up === 6)) return 'Сплит';
    }
    if (soft) {
      if (t >= 19) return 'Стоп';
      if (t === 18) return up >= 3 && up <= 6 && can.d ? 'Удвоить' : up <= 8 ? 'Стоп' : 'Взять';
      const lo = { 13: 5, 14: 5, 15: 4, 16: 4, 17: 3 }[t] || 7;
      return up >= lo && up <= 6 && can.d ? 'Удвоить' : 'Взять';
    }
    if (can.r && ((t === 16 && up >= 9) || (t === 15 && up === 10))) return 'Сдаться';
    if (t >= 17) return 'Стоп';
    if (t >= 13) return up <= 6 ? 'Стоп' : 'Взять';
    if (t === 12) return up >= 4 && up <= 6 ? 'Стоп' : 'Взять';
    if (t === 11) return up <= 10 && can.d ? 'Удвоить' : 'Взять';
    if (t === 10) return up <= 9 && can.d ? 'Удвоить' : 'Взять';
    if (t === 9) return up >= 3 && up <= 6 && can.d ? 'Удвоить' : 'Взять';
    return 'Взять';
  }
  $('bjHint').onclick = () => { if (state === 'player') msg($('bjMsg'), `💡 Базовая стратегия советует: ${advice()}`); };

  newDeck(); drawStack(); updStats(); buttons();
})();
