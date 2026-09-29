// Общее ядро: баланс, вкладки, утилиты и карты. Подключается первым.
const Casino = (() => {
  const $ = id => document.getElementById(id);
  const START = 50000, KEY = 'casinoBalance50k';
  let balance = NaN;
  try { balance = parseFloat(localStorage.getItem(KEY)); } catch (e) {}
  if (isNaN(balance)) balance = START;

  const rnd = n => Math.floor(Math.random() * n);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const fmt = v => Math.round(v * 100) / 100;

  function setBalance(v) {
    balance = Math.max(0, Math.round(v * 100) / 100);
    $('balance').textContent = balance;
    try { localStorage.setItem(KEY, balance); } catch (e) {}
  }
  function msg(el, text, cls) { el.textContent = text; el.className = 'msg ' + (cls || ''); }
  function readBet(input, el) {
    const b = Math.floor(+input.value);
    if (!(b >= 1)) { msg(el, 'Введите корректную ставку', 'lose'); return 0; }
    if (b > balance) { msg(el, 'Недостаточно средств', 'lose'); return 0; }
    return b;
  }

  // Игральная карта (используют блэкджек и баккара)
  function cardEl(c, hidden) {
    const d = document.createElement('div');
    if (hidden) { d.className = 'card back'; return d; }
    d.className = 'card' + (c.s === '♥' || c.s === '♦' ? ' red' : '');
    d.innerHTML = `<span>${c.r}${c.s}</span><span class="c">${c.s}</span><span class="bt">${c.r}${c.s}</span>`;
    return d;
  }
  function shoe(decks) {
    const cards = [], S = ['♠', '♥', '♦', '♣'], R = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    for (let d = 0; d < decks; d++) for (const s of S) for (const r of R) cards.push({ s, r });
    for (let i = cards.length - 1; i > 0; i--) { const j = rnd(i + 1); [cards[i], cards[j]] = [cards[j], cards[i]]; }
    return cards;
  }

  // Вкладки (последняя открытая запоминается)
  function openTab(t) {
    const btn = document.querySelector(`nav button[data-tab="${t}"]`); if (!btn) return;
    document.querySelectorAll('nav button').forEach(b => b.classList.toggle('active', b === btn));
    document.querySelectorAll('main > section').forEach(s => s.classList.toggle('active', s.id === t));
    try { localStorage.setItem('casinoTab', t); } catch (e) {}
  }
  setBalance(balance);
  $('reset').onclick = () => { try { localStorage.removeItem(KEY); } catch (e) {} setBalance(START); };
  $('tabs').onclick = e => { if (e.target.dataset.tab) openTab(e.target.dataset.tab); };
  let last = null; try { last = localStorage.getItem('casinoTab'); } catch (e) {}
  if (last) openTab(last);

  return { $, rnd, sleep, fmt, msg, readBet, setBalance, cardEl, shoe, START, get balance() { return balance; } };
})();
