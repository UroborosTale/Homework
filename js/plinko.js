// Плинко: шарик падает по колышкам, множитель зависит от корзины
(() => {
  const { $, rnd, msg, fmt, setBalance, readBet } = Casino;
  const cv = $('plCanvas'), g = cv.getContext('2d'), W = cv.width, H = cv.height;
  const RISK = { low: [0.5, 9, 3], mid: [0.3, 28, 3.2], high: [0.2, 110, 3.5] };   // мин., макс., крутизна
  let rows = 12, risk = 'mid', mults = [], balls = [], flash = {}, hist = [];

  function makeTable(n, rk) {                            // подгоняем множители под RTP ≈ 96%
    const [lo, hi, gm] = RISK[rk], P = [];
    let c = 1; for (let k = 0; k <= n; k++) { P.push(c / 2 ** n); c = c * (n - k) / (k + 1); }
    const raw = P.map((_, k) => lo + (hi - lo) * Math.pow(Math.abs(k - n / 2) / (n / 2), gm));
    const scale = 0.96 / raw.reduce((a, v, k) => a + v * P[k], 0);
    return raw.map(v => Math.round(v * scale * 100) / 100);
  }
  const top = 40, geo = () => { const dx = (W - 50) / rows, dy = (H - 110) / rows; return { dx, dy }; };
  const posX = (i, j) => W / 2 + (j - i / 2) * geo().dx, posY = i => top + i * geo().dy;
  const color = m => m >= 20 ? '#e53935' : m >= 5 ? '#fb8c00' : m >= 1.5 ? '#fdd835' : m >= 1 ? '#7cb342' : '#546e7a';

  function draw() {
    g.clearRect(0, 0, W, H); const { dx, dy } = geo();
    g.fillStyle = '#ffffffcc';
    for (let i = 0; i < rows; i++) for (let m = 0; m <= i; m++) { g.beginPath(); g.arc(posX(i, m), posY(i), 3.2, 0, 7); g.fill(); }
    g.font = 'bold 11px sans-serif'; g.textAlign = 'center';
    mults.forEach((m, k) => {
      const x = posX(rows, k), y = posY(rows) + 2, w = dx * .86;
      g.fillStyle = color(m); g.globalAlpha = flash[k] > 0 ? 1 : .8; g.fillRect(x - w / 2, y + (flash[k] > 0 ? 4 : 0), w, 26);
      g.globalAlpha = 1; g.fillStyle = '#111'; g.fillText(m >= 100 ? Math.round(m) : m, x, y + 17 + (flash[k] > 0 ? 4 : 0));
    });
    g.fillStyle = '#ffd54f';
    balls.forEach(b => { g.beginPath(); g.arc(b.x, b.y, 7, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); });
  }
  function step(now) {
    const { dx, dy } = geo();
    balls.forEach(b => {
      const s = Math.min(1, (now - b.t0) / 140), e = s * s;
      const i = b.i, j = b.j, nj = j + b.path[i];
      b.x = posX(i, j) + (posX(i + 1, nj) - posX(i, j)) * s;
      b.y = posY(i) - 9 + (posY(i + 1) - posY(i)) * e;
      if (s >= 1) { b.i++; b.j = nj; b.t0 = now; if (b.i >= rows) b.done = true; }
    });
    balls.filter(b => b.done).forEach(b => land(b));
    balls = balls.filter(b => !b.done);
    if (!balls.length) $('plRows').disabled = $('plRisk').disabled = false;
    for (const k in flash) flash[k] > 0 && (flash[k] -= 1);
    draw(); if (balls.length || Object.values(flash).some(v => v > 0)) requestAnimationFrame(step);
  }
  function land(b) {
    const k = b.j, m = mults[k], win = Math.round(b.bet * m * 100) / 100; flash[k] = 25;
    setBalance(Casino.balance + win);
    msg($('plMsg'), `Корзина ×${m}: ${win >= b.bet ? '+' : ''}${fmt(win - b.bet)} ₽`, win >= b.bet ? 'win' : 'lose');
    hist.unshift(m); hist = hist.slice(0, 12);
    $('plHist').replaceChildren(...hist.map(v => { const s = document.createElement('span'); s.className = 'wide'; s.textContent = v + '×'; s.style.background = color(v); s.style.color = '#111'; return s; }));
  }
  function setup() { rows = +$('plRows').value; risk = $('plRisk').value; mults = makeTable(rows, risk); flash = {}; draw(); }
  $('plRows').onchange = $('plRisk').onchange = () => { if (!balls.length) setup(); };
  $('plDrop').onclick = () => {
    const bet = readBet($('plBet'), $('plMsg')); if (!bet) return;
    $('plRows').disabled = $('plRisk').disabled = true;
    setBalance(Casino.balance - bet);
    const path = Array.from({ length: rows }, () => rnd(2));
    const idle = !balls.length;
    balls.push({ i: 0, j: 0, path, t0: performance.now(), x: W / 2, y: top - 9, bet });
    if (idle) requestAnimationFrame(step);
  };
  setup();
})();
