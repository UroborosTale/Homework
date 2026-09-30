(() => {
  const { $, rnd, sleep, msg, fmt, setBalance, readBet } = Casino;
  /* ================= РУЛЕТКА ================= */
  const ORDER = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
  const REDS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
  const colorOf = n => n === 0 ? 'g' : REDS.has(n) ? 'r' : 'b';
  const COL = { r: '#d32f2f', b: '#1b1b1b', g: '#1b8a4a' };

  // Рисуем колесо: деревянный обод, дорожка для шарика, лунки с золотыми перегородками, конус с «крестовиной»
  (function drawWheel() {
    const c = $('wheel'), g = c.getContext('2d'), R = 260, step = 2 * Math.PI / 37;
    g.translate(R, R);
    const rg = (r0, r1, stops) => { const gr = g.createRadialGradient(0, 0, r0, 0, 0, r1); stops.forEach(([o, col]) => gr.addColorStop(o, col)); return gr; };
    g.beginPath(); g.arc(0, 0, R, 0, 7); g.fillStyle = rg(200, R, [[0, '#6d3b12'], [.5, '#a86b32'], [.8, '#5a2d0a'], [1, '#2a1206']]); g.fill();
    g.beginPath(); g.arc(0, 0, 238, 0, 7); g.fillStyle = rg(200, 238, [[0, '#2a2a2a'], [.7, '#8a8a8a'], [1, '#d8d8d8']]); g.fill();
    ORDER.forEach((n, i) => {
      const a0 = -Math.PI / 2 + i * step, a1 = a0 + step, col = colorOf(n);
      g.beginPath(); g.arc(0, 0, 222, a0, a1); g.arc(0, 0, 150, a1, a0, true); g.closePath();
      g.fillStyle = rg(150, 222, col === 'r' ? [[0, '#8a0f14'], [1, '#e53935']] : col === 'b' ? [[0, '#050505'], [1, '#3a3a3a']] : [[0, '#0b4d24'], [1, '#2ea55a']]);
      g.fill(); g.strokeStyle = '#e8c35a'; g.lineWidth = 2.5; g.stroke();
      g.save(); g.rotate(a0 + step / 2 + Math.PI / 2); g.fillStyle = '#fff'; g.font = 'bold 20px Georgia, serif';
      g.textAlign = 'center'; g.shadowColor = '#000'; g.shadowBlur = 3; g.fillText(n, 0, -196); g.restore();
    });
    g.beginPath(); g.arc(0, 0, 150, 0, 7); g.fillStyle = rg(0, 150, [[0, '#d9a441'], [.35, '#8a5a1a'], [.8, '#3b2410'], [1, '#1a0f06']]); g.fill();
    g.lineWidth = 5; g.strokeStyle = '#e8c35a'; g.stroke();
    for (let k = 0; k < 4; k++) { g.save(); g.rotate(k * Math.PI / 2); g.fillStyle = '#f3d27a'; g.strokeStyle = '#6a4a10'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(-6, 0); g.lineTo(-3, -100); g.arc(0, -100, 8, Math.PI, 0); g.lineTo(6, 0); g.closePath(); g.fill(); g.stroke(); g.restore(); }
    g.beginPath(); g.arc(0, 0, 24, 0, 7); g.fillStyle = rg(0, 24, [[0, '#fff6c8'], [1, '#b8860b']]); g.fill(); g.stroke();
  })();
  // Шарик: крутится против колеса, замедляется и с отскоками падает в лунку под указателем
  const wrap = $('wheel').parentElement, rb = document.createElement('div'); rb.className = 'rball'; wrap.appendChild(rb);
  function placeBall(ang, rr) { const W = wrap.clientWidth, a = ang * Math.PI / 180; rb.style.transform = `translate(${W / 2 + Math.cos(a) * rr * W - 7}px, ${W / 2 + Math.sin(a) * rr * W - 7}px)`; }
  placeBall(-90, 0.455);
  function rollBall(ms) {
    const bounce = u => { const n1 = 7.5625, d1 = 2.75; if (u < 1 / d1) return n1 * u * u; if (u < 2 / d1) return n1 * (u -= 1.5 / d1) * u + .75; if (u < 2.5 / d1) return n1 * (u -= 2.25 / d1) * u + .9375; return n1 * (u -= 2.625 / d1) * u + .984375; };
    return new Promise(done => { const t0 = performance.now(), Rout = 0.455, Rin = 0.358;
      const f = now => { const t = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - t, 3);
        const ang = -90 - 360 * 8 * (1 - e), rr = t < .6 ? Rout : t < .82 ? Rout - (Rout - Rin) * bounce((t - .6) / .22) : Rin;
        placeBall(ang, rr); if (t < 1) requestAnimationFrame(f); else done(); };
      requestAnimationFrame(f); });
  }

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
    bets[key] = (bets[key] || 0) + chipVal; renderBets(key);
  }
  function renderBets(changed) {                    // фишки обновляются на месте; новая «падает» на поле
    Object.entries(cellEls).forEach(([k, el]) => {
      let st = el.querySelector('.stake');
      if (!bets[k]) { if (st) st.remove(); return; }
      if (!st) { st = document.createElement('span'); st.className = 'stake'; el.appendChild(st); }
      if (st.textContent !== String(bets[k])) { st.textContent = bets[k]; st.dataset.v = bets[k] >= 500 ? 500 : bets[k] >= 100 ? 100 : bets[k] >= 25 ? 25 : bets[k] >= 5 ? 5 : 1;
        if (k === changed) { st.classList.remove('drop'); void st.offsetWidth; st.classList.add('drop'); } }
    });
    Anim.countTo($('totalBet'), Object.values(bets).reduce((a, b) => a + b, 0), 250);
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
    await Promise.all([rollBall(5000), sleep(5200)]);

    const ball = $('ball');
    ball.textContent = n; ball.style.background = COL[colorOf(n)];
    ball.classList.remove('pop'); void ball.offsetWidth; ball.classList.add('pop');
    const wc = cellEls['n' + n]; if (wc) { wc.classList.add('winner'); setTimeout(() => wc.classList.remove('winner'), 2600); }
    let win = 0;
    for (const [k, v] of Object.entries(bets)) win += v * payoutMult(k, n);
    const h = document.createElement('span');
    h.textContent = n; h.style.background = COL[colorOf(n)];
    $('history').prepend(h); if ($('history').children.length > 15) $('history').lastChild.remove();

    if (win) { setBalance(Casino.balance + win); msg($('rouMsg'), `Выпало ${n}. Выигрыш: ${win} ₽ (чистыми ${win - total})`, 'win'); Anim.winFx(win, total); }
    else msg($('rouMsg'), `Выпало ${n}. Ставки проиграли.`, 'lose');
    for (const k in bets) delete bets[k]; renderBets();
    rouBusy = false; $('rouSpin').disabled = false; $('clearBets').disabled = false;
  };

})();
