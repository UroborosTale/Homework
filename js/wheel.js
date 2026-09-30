// Колесо фортуны: крутите колесо — множитель сектора применяется к ставке
(() => {
  const { $, rnd, sleep, msg, fmt, setBalance, readBet } = Casino;
  // [множитель, число секторов], всего по 40 секторов. RTP: 96.25% / 95% / 95%
  const TABLES = {
    low:  [[0, 14], [0.5, 8], [1, 8], [1.5, 5], [2, 3], [3, 1], [10, 1]],
    mid:  [[0, 25], [1, 6], [2, 4], [3, 3], [5, 1], [10, 1]],
    high: [[0, 35], [2, 2], [5, 1], [10, 1], [19, 1]],
  };
  const cv = $('whCanvas'), g = cv.getContext('2d'), R = 260;
  let segs = [], angle = 0, busy = false, hist = [];

  const colorOf = m => m === 0 ? '#37474f' : m < 1 ? '#5c6bc0' : m === 1 ? '#0288d1' : m < 3 ? '#2e7d32' : m < 5 ? '#f9a825' : m < 10 ? '#ef6c00' : '#c62828';
  const label = m => m === 0 ? '0' : '×' + m;
  function build(risk) {                                  // раскладываем секторы вперемешку
    segs = TABLES[risk].flatMap(([m, c]) => Array(c).fill(m));
    for (let i = segs.length - 1; i > 0; i--) { const j = rnd(i + 1); [segs[i], segs[j]] = [segs[j], segs[i]]; }
    const step = 2 * Math.PI / segs.length; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.translate(R, R);
    segs.forEach((m, i) => {
      const a0 = -Math.PI / 2 + i * step, a1 = a0 + step;
      g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R - 26, a0, a1); g.closePath();
      const sg = g.createRadialGradient(0, 0, 40, 0, 0, R - 26); sg.addColorStop(0, '#00000055'); sg.addColorStop(.6, colorOf(m)); sg.addColorStop(1, colorOf(m));
      g.fillStyle = sg; g.fill(); g.strokeStyle = '#ffe082'; g.lineWidth = 2; g.stroke();
      g.save(); g.rotate(a0 + step / 2 + Math.PI / 2); g.fillStyle = '#fff'; g.font = 'bold 20px sans-serif'; g.textAlign = 'center';
      g.shadowColor = '#000'; g.shadowBlur = 4; g.fillText(label(m), 0, -R + 62); g.restore();
    });
    g.beginPath(); g.arc(0, 0, R - 2, 0, 7); g.arc(0, 0, R - 26, 0, 7, true); const rim = g.createLinearGradient(-R, -R, R, R);
    rim.addColorStop(0, '#fff3b0'); rim.addColorStop(.5, '#c8901a'); rim.addColorStop(1, '#7a4a00'); g.fillStyle = rim; g.fill();
    for (let i = 0; i < segs.length; i++) { const a = -Math.PI / 2 + i * step; g.beginPath(); g.arc(Math.cos(a) * (R - 14), Math.sin(a) * (R - 14), 5, 0, 7);
      g.fillStyle = i % 2 ? '#fffde7' : '#ffca28'; g.shadowColor = '#ffeb3b'; g.shadowBlur = 8; g.fill(); g.shadowBlur = 0; }
    g.beginPath(); g.arc(0, 0, 60, 0, 7); g.fillStyle = '#212121'; g.fill(); g.lineWidth = 6; g.strokeStyle = '#ffd54f'; g.stroke();
    g.fillStyle = '#ffd54f'; g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.fillText('★', 0, 12);
    cv.style.transition = 'none'; cv.style.transform = 'none'; angle = 0; void cv.offsetWidth; cv.style.transition = '';
    const cnt = TABLES[risk], n = segs.length, rtp = cnt.reduce((a, [m, c]) => a + m * c, 0) / n;
    $('whLegend').innerHTML = cnt.slice().reverse().map(([m, c]) => `<span style="background:${colorOf(m)}">${label(m)} · ${c}</span>`).join('') + `<em>RTP ${(rtp * 100).toFixed(1)}%</em>`;
  }
  $('whRisk').onchange = () => { if (!busy) build($('whRisk').value); };
  $('whSpin').onclick = async () => {
    if (busy) return; const bet = readBet($('whBet'), $('whMsg')); if (!bet) return;
    busy = true; $('whSpin').disabled = $('whRisk').disabled = $('whBet').disabled = true;
    setBalance(Casino.balance - bet); msg($('whMsg'), 'Крутим колесо…');
    const idx = rnd(segs.length), step = 360 / segs.length;
    angle = Math.ceil(angle / 360) * 360 + 360 * 6 - (idx + 0.5) * step;
    cv.style.transform = `rotate(${angle}deg)`;
    const ptr = cv.parentElement.querySelector('.pointer'); let lastSeg = -1, spinning = true;
    const watch = () => { if (!spinning) return; const m = getComputedStyle(cv).transform; if (m && m !== 'none') { const [a, b] = m.slice(7, -1).split(',').map(Number);
      const deg = (Math.atan2(b, a) * 180 / Math.PI + 360) % 360, seg = Math.floor(deg / (360 / segs.length));
      if (seg !== lastSeg) { lastSeg = seg; ptr.classList.remove('tick'); void ptr.offsetWidth; ptr.classList.add('tick'); } } requestAnimationFrame(watch); };
    requestAnimationFrame(watch); await sleep(5300); spinning = false;
    const m = segs[idx], win = Math.round(bet * m * 100) / 100, ball = $('whBall');
    ball.textContent = label(m); ball.style.background = colorOf(m); ball.classList.remove('pop'); void ball.offsetWidth; ball.classList.add('pop'); if (win > bet) Anim.winFx(win, bet);
    if (win) setBalance(Casino.balance + win);
    hist.unshift(m); hist = hist.slice(0, 14);
    $('whHist').replaceChildren(...hist.map(v => { const s = document.createElement('span'); s.className = 'wide'; s.textContent = label(v); s.style.background = colorOf(v); return s; }));
    msg($('whMsg'), m === 0 ? 'Ноль. Ставка проиграна.' : win > bet ? `${label(m)}! Выигрыш ${fmt(win - bet)} ₽` : win === bet ? 'Ставка возвращена.' : `${label(m)}: возврат ${fmt(win)} ₽`, win > bet ? 'win' : win === bet ? '' : 'lose');
    busy = false; $('whSpin').disabled = $('whRisk').disabled = $('whBet').disabled = false;
  };
  build('mid');
})();
