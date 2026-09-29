(() => {
  const { $, rnd, sleep, msg, fmt, setBalance, readBet } = Casino;
  /* ================= РУЛЕТКА ================= */
  const ORDER = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
  const REDS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
  const colorOf = n => n === 0 ? 'g' : REDS.has(n) ? 'r' : 'b';
  const COL = { r: '#d32f2f', b: '#1b1b1b', g: '#1b8a4a' };

  // Рисуем колесо (сектор idx начинается на idx*step по часовой от верха)
  (function drawWheel() {
    const c = $('wheel'), g = c.getContext('2d'), R = 260, step = 2 * Math.PI / 37;
    g.translate(R, R);
    ORDER.forEach((n, i) => {
      const a0 = -Math.PI / 2 + i * step, a1 = a0 + step;
      g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R - 4, a0, a1); g.closePath();
      g.fillStyle = COL[colorOf(n)]; g.fill(); g.strokeStyle = '#c9a227'; g.lineWidth = 2; g.stroke();
      g.save(); g.rotate(a0 + step / 2 + Math.PI / 2); g.fillStyle = '#fff'; g.font = 'bold 22px sans-serif';
      g.textAlign = 'center'; g.fillText(n, 0, -R + 34); g.restore();
    });
    g.beginPath(); g.arc(0, 0, 90, 0, 7); g.fillStyle = '#3b2a12'; g.fill();
    g.lineWidth = 6; g.strokeStyle = '#c9a227'; g.stroke();
  })();

  // Поле ставок
  const bets = {}; // key -> сумма
  let chipVal = 5, rouBusy = false;
  const cellEls = {};
  function addCell(parent, key, label, cls, style) {
    const d = document.createElement('div');
    d.className = 'cell ' + (cls || ''); d.textContent = label;
    if (style) Object.assign(d.style, style);
    d.onclick = () => placeBet(key);
    parent.appendChild(d); cellEls[key] = d;
  }
  const board = $('board');
  addCell(board, 'n0', '0', 'g', { gridRow: '1 / span 3' });
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 12; col++) {
      const n = col * 3 + (3 - row);
      addCell(board, 'n' + n, n, colorOf(n));
    }
  [['d1','1-я дюжина (1–12)'],['d2','2-я дюжина (13–24)'],['d3','3-я дюжина (25–36)']].forEach(([k, l]) => addCell($('dozens'), k, l));
  [['low','1–18'],['even','Чёт'],['red','Красное','r'],['black','Чёрное','b'],['odd','Нечет'],['high','19–36']]
    .forEach(([k, l, c]) => addCell($('simple'), k, l, c));

  function placeBet(key) {
    if (rouBusy) return;
    const total = Object.values(bets).reduce((a, b) => a + b, 0);
    if (total + chipVal > Casino.balance) return msg($('rouMsg'), 'Недостаточно средств', 'lose');
    bets[key] = (bets[key] || 0) + chipVal; renderBets();
  }
  function renderBets() {
    Object.entries(cellEls).forEach(([k, el]) => {
      const old = el.querySelector('.stake'); if (old) old.remove();
      if (bets[k]) { const s = document.createElement('span'); s.className = 'stake'; s.textContent = bets[k]; el.appendChild(s); }
    });
    $('totalBet').textContent = Object.values(bets).reduce((a, b) => a + b, 0);
  }
  $('chips').onclick = e => {
    if (!e.target.dataset.v) return;
    chipVal = +e.target.dataset.v;
    document.querySelectorAll('.chip').forEach(c => c.classList.toggle('sel', c === e.target));
  };
  $('clearBets').onclick = () => { if (rouBusy) return; for (const k in bets) delete bets[k]; renderBets(); };

  function payoutMult(key, n) { // возвращает суммарный множитель (ставка включена), 0 если проигрыш
    if (key[0] === 'n') return +key.slice(1) === n ? 36 : 0;
    if (n === 0) return 0;
    switch (key) {
      case 'd1': return n <= 12 ? 3 : 0;
      case 'd2': return n > 12 && n <= 24 ? 3 : 0;
      case 'd3': return n > 24 ? 3 : 0;
      case 'low': return n <= 18 ? 2 : 0;
      case 'high': return n > 18 ? 2 : 0;
      case 'even': return n % 2 === 0 ? 2 : 0;
      case 'odd': return n % 2 === 1 ? 2 : 0;
      case 'red': return REDS.has(n) ? 2 : 0;
      case 'black': return !REDS.has(n) ? 2 : 0;
    }
    return 0;
  }

  let wheelAngle = 0;
  $('rouSpin').onclick = async () => {
    if (rouBusy) return;
    const total = Object.values(bets).reduce((a, b) => a + b, 0);
    if (!total) return msg($('rouMsg'), 'Сначала сделайте ставку', 'lose');
    if (total > Casino.balance) return msg($('rouMsg'), 'Недостаточно средств', 'lose');
    rouBusy = true; $('rouSpin').disabled = true; $('clearBets').disabled = true;
    setBalance(Casino.balance - total); msg($('rouMsg'), 'Крутим…');

    const idx = rnd(37), n = ORDER[idx], step = 360 / 37;
    wheelAngle = Math.ceil(wheelAngle / 360) * 360 + 360 * 5 - (idx + 0.5) * step;
    $('wheel').style.transform = `rotate(${wheelAngle}deg)`;
    await sleep(5200);

    const ball = $('ball');
    ball.textContent = n; ball.style.background = COL[colorOf(n)];
    let win = 0;
    for (const [k, v] of Object.entries(bets)) win += v * payoutMult(k, n);
    const h = document.createElement('span');
    h.textContent = n; h.style.background = COL[colorOf(n)];
    $('history').prepend(h); if ($('history').children.length > 15) $('history').lastChild.remove();

    if (win) { setBalance(Casino.balance + win); msg($('rouMsg'), `Выпало ${n}. Выигрыш: ${win} ₽ (чистыми ${win - total})`, 'win'); }
    else msg($('rouMsg'), `Выпало ${n}. Ставки проиграли.`, 'lose');
    for (const k in bets) delete bets[k]; renderBets();
    rouBusy = false; $('rouSpin').disabled = false; $('clearBets').disabled = false;
  };

})();
