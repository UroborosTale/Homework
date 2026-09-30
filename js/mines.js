// Мины: открывайте безопасные клетки и вовремя забирайте выигрыш
(() => {
  const { $, rnd, msg, fmt, setBalance, readBet } = Casino;
  const N = 25, EDGE = 0.97;                                   // поле 5×5, RTP 97%
  const GEM = Art.html('olympus', 'green');
  const BOMB = `<svg class="sym" viewBox="0 0 100 100"><circle cx="46" cy="58" r="32" fill="url(#black2)" stroke="#000" stroke-width="3"/><ellipse cx="34" cy="46" rx="9" ry="6" fill="#fff" opacity=".35" transform="rotate(-35 34 46)"/>
    <rect x="58" y="22" width="16" height="14" rx="3" fill="#555" transform="rotate(40 66 29)"/><path d="M70 22 Q78 8 90 12" stroke="#8d6e63" stroke-width="4" fill="none"/><circle cx="90" cy="12" r="7" fill="#ffca28"/><circle cx="90" cy="12" r="3.5" fill="#fff"/></svg>`;
  const cells = [], grid = $('mnGrid');
  for (let i = 0; i < N; i++) {
    const d = document.createElement('button'); d.className = 'mcell'; d.disabled = true; d.onclick = () => pick(i);
    grid.appendChild(d); cells.push(d);
  }
  for (let m = 1; m <= 24; m++) $('mnCount').add(new Option(m, m)); $('mnCount').value = 3;

  let playing = false, mines = new Set(), opened = 0, bet = 0, count = 3;
  const mult = k => { let m = EDGE; for (let i = 0; i < k; i++) m *= (N - i) / (N - count - i); return Math.floor(m * 100) / 100; };

  function info() {
    const cur = mult(opened), nxt = opened < N - count ? mult(opened + 1) : cur;
    $('mnInfo').innerHTML = `Открыто: <b>${opened}</b> · Множитель: <b>×${cur.toFixed(2)}</b> · Следующий: <b>×${nxt.toFixed(2)}</b> · Забрать: <b>${fmt(bet * cur)} ₽</b>`;
  }
  function end(win, text, cls) {
    playing = false;
    cells.forEach((c, i) => { c.disabled = true; if (!c.classList.contains('open')) { c.classList.add('faded'); c.innerHTML = mines.has(i) ? BOMB : GEM; } });
    $('mnStart').disabled = $('mnBet').disabled = $('mnCount').disabled = false; $('mnCash').disabled = true; $('mnRand').disabled = true;
    if (win) setBalance(Casino.balance + win);
    msg($('mnMsg'), text, cls);
  }
  function cashOut() {
    if (!playing || opened === 0) return;
    const win = Math.floor(bet * mult(opened) * 100) / 100;
    end(win, `Вы забрали ${fmt(win)} ₽ (×${mult(opened).toFixed(2)})`, 'win'); Anim.winFx(win, bet);
  }
  function pick(i) {
    if (!playing || cells[i].classList.contains('open')) return;
    const c = cells[i]; c.classList.add('open');
    if (mines.has(i)) { c.innerHTML = BOMB; c.classList.add('boom'); grid.classList.remove('shake'); void grid.offsetWidth; grid.classList.add('shake'); return end(0, 'Мина! Ставка проиграна.', 'lose'); }
    c.innerHTML = GEM; opened++; info(); Anim.countTo($('mnMultBig'), mult(opened), 300, v => '×' + v.toFixed(2)); $('mnCash').disabled = false;
    if (opened === N - count) cashOut();                     // все безопасные клетки открыты
  }
  $('mnStart').onclick = () => {
    if (playing) return; bet = readBet($('mnBet'), $('mnMsg')); if (!bet) return;
    count = +$('mnCount').value; setBalance(Casino.balance - bet);
    mines = new Set(); while (mines.size < count) mines.add(rnd(N));
    opened = 0; playing = true;
    cells.forEach((c, i) => { c.className = 'mcell reset'; c.style.setProperty('--dl', (i % 5 + Math.floor(i / 5)) * 0.03 + 's'); c.textContent = ''; c.disabled = false; }); $('mnMultBig').textContent = '×1.00';
    $('mnStart').disabled = $('mnBet').disabled = $('mnCount').disabled = true; $('mnCash').disabled = true; $('mnRand').disabled = false;
    msg($('mnMsg'), 'Открывайте клетки, избегая мин'); info();
  };
  $('mnCash').onclick = cashOut;
  $('mnRand').onclick = () => { const left = cells.map((c, i) => c.classList.contains('open') ? -1 : i).filter(i => i >= 0); if (left.length) pick(left[rnd(left.length)]); };
})();
