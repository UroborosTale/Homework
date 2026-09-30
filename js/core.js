// Общее ядро: баланс, вкладки, утилиты и карты. Подключается первым.
const Casino = (() => {
  const $ = id => document.getElementById(id);
  const START = 500000, KEY = 'casinoBalance500k';
  let balance = NaN;
  try { balance = parseFloat(localStorage.getItem(KEY)); } catch (e) {}
  if (isNaN(balance)) balance = START;

  const rnd = n => Math.floor(Math.random() * n);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const fmt = v => Math.round(v * 100) / 100;

  let shown = balance, balRaf = 0;                       // на экране баланс «докручивается» до нового значения
  function paintBalance(to) {
    cancelAnimationFrame(balRaf);
    const from = shown, t0 = performance.now(), ms = Math.min(700, 250 + Math.abs(to - from) / 40);
    if (from === to || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) { shown = to; $('balance').textContent = to; return; }
    const step = now => {
      const t = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - t, 3);
      shown = t < 1 ? Math.round((from + (to - from) * e) * 100) / 100 : to; $('balance').textContent = shown;
      if (t < 1) balRaf = requestAnimationFrame(step);
    };
    balRaf = requestAnimationFrame(step);
  }
  function setBalance(v) {
    balance = Math.max(0, Math.round(v * 100) / 100);
    paintBalance(balance);
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
  // Обновляет руку без перерисовки старых карт: новые карты «вылетают» из шуза, закрытая карта переворачивается
  function syncHand(box, cards, hidden = [], { offset = 0, stagger = 0.18 } = {}) {
    let k = 0;
    for (let i = box.children.length - 1; i >= 0; i--) if (!cards[i] || box.children[i]._card !== cards[i]) box.children[i].remove();
    cards.forEach((c, i) => {
      const hid = hidden.includes(i), el = box.children[i];
      if (!el) { const n = cardEl(c, hid); n._card = c; n.classList.add('dealt'); n.style.setProperty('--dl', (offset + k++ * stagger) + 's'); box.appendChild(n); }
      else if (el.classList.contains('back') && !hid) { const f = cardEl(c); f._card = c; f.classList.add('flip'); box.replaceChild(f, el); }
    });
  }
  function shoe(decks) {
    const cards = [], S = ['♠', '♥', '♦', '♣'], R = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    for (let d = 0; d < decks; d++) for (const s of S) for (const r of R) cards.push({ s, r });
    for (let i = cards.length - 1; i > 0; i--) { const j = rnd(i + 1); [cards[i], cards[j]] = [cards[j], cards[i]]; }
    return cards;
  }

  // Навигация: каталог ↔ игра (последние открытые запоминаются для «Недавних»)
  const titles = {};                                     // id → название (заполняет каталог)
  function openTab(t) {
    const sec = document.getElementById(t); if (!sec || sec.tagName !== 'SECTION') return;
    document.querySelectorAll('main > section').forEach(s => s.classList.toggle('active', s === sec));
    $('tabs').classList.toggle('in-game', t !== 'catalog');
    $('curGame').textContent = t === 'catalog' ? '' : (titles[t] || t);
    window.scrollTo(0, 0);
    try { history.replaceState(null, '', t === 'catalog' ? location.pathname : '#' + t); } catch (e) {}
    if (t !== 'catalog') {
      try {
        const rec = JSON.parse(localStorage.getItem('casinoRecent') || '[]').filter(x => x !== t); rec.unshift(t);
        localStorage.setItem('casinoRecent', JSON.stringify(rec.slice(0, 4)));
      } catch (e) {}
    }
    document.dispatchEvent(new CustomEvent('casino:tab', { detail: t }));
  }
  setBalance(balance);
  $('reset').onclick = () => { try { localStorage.removeItem(KEY); } catch (e) {} setBalance(START); };
  $('tabs').onclick = e => { if (e.target.dataset.tab) openTab(e.target.dataset.tab); };

  return { $, rnd, sleep, fmt, msg, readBet, setBalance, cardEl, syncHand, shoe, openTab, titles, START, get balance() { return balance; } };
})();
