// Мины: открывайте безопасные клетки и вовремя забирайте выигрыш
(() => {
  const { $, rnd, msg, fmt, setBalance, readBet } = Casino;
  const N = 25, EDGE = 0.97;                                   // поле 5×5, RTP 97%
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
    cells.forEach((c, i) => { c.disabled = true; if (!c.classList.contains('open')) { c.classList.add('faded'); c.textContent = mines.has(i) ? '💣' : '💎'; } });
    $('mnStart').disabled = $('mnBet').disabled = $('mnCount').disabled = false; $('mnCash').disabled = true; $('mnRand').disabled = true;
    if (win) setBalance(Casino.balance + win);
    msg($('mnMsg'), text, cls);
  }
  function cashOut() {
    if (!playing || opened === 0) return;
    const win = Math.floor(bet * mult(opened) * 100) / 100;
    end(win, `Вы забрали ${fmt(win)} ₽ (×${mult(opened).toFixed(2)})`, 'win');
  }
  function pick(i) {
    if (!playing || cells[i].classList.contains('open')) return;
    const c = cells[i]; c.classList.add('open');
    if (mines.has(i)) { c.textContent = '💥'; c.classList.add('boom'); return end(0, 'Мина! Ставка проиграна.', 'lose'); }
    c.textContent = '💎'; opened++; info(); $('mnCash').disabled = false;
    if (opened === N - count) cashOut();                     // все безопасные клетки открыты
  }
  $('mnStart').onclick = () => {
    if (playing) return; bet = readBet($('mnBet'), $('mnMsg')); if (!bet) return;
    count = +$('mnCount').value; setBalance(Casino.balance - bet);
    mines = new Set(); while (mines.size < count) mines.add(rnd(N));
    opened = 0; playing = true;
    cells.forEach(c => { c.className = 'mcell'; c.textContent = ''; c.disabled = false; });
    $('mnStart').disabled = $('mnBet').disabled = $('mnCount').disabled = true; $('mnCash').disabled = true; $('mnRand').disabled = false;
    msg($('mnMsg'), 'Открывайте клетки, избегая мин'); info();
  };
  $('mnCash').onclick = cashOut;
  $('mnRand').onclick = () => { const left = cells.map((c, i) => c.classList.contains('open') ? -1 : i).filter(i => i >= 0); if (left.length) pick(left[rnd(left.length)]); };
})();
