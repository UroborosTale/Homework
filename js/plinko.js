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

  const hits = {};                                        // когда шарик последний раз задел колышек (для подсветки)
  const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  function draw(now = performance.now()) {
    const bg = g.createRadialGradient(W / 2, 0, 20, W / 2, H * .6, H); bg.addColorStop(0, '#1d2b6a'); bg.addColorStop(1, '#070b1c');
    g.fillStyle = bg; g.fillRect(0, 0, W, H); const { dx } = geo();
    for (let i = 0; i < rows; i++) for (let m = 0; m <= i; m++) {
      const h = hits[i + ',' + m], k = h ? Math.max(0, 1 - (now - h) / 350) : 0, x = posX(i, m), y = posY(i);
      if (k) { g.fillStyle = `rgba(255,213,79,${.45 * k})`; g.beginPath(); g.arc(x, y, 4 + 9 * k, 0, 7); g.fill(); }
      g.fillStyle = k ? '#fff59d' : '#dfe6ff'; g.beginPath(); g.arc(x, y, 3.4 + k * 1.5, 0, 7); g.fill();
    }
    g.font = 'bold 11px sans-serif'; g.textAlign = 'center';
    mults.forEach((m, k) => {
      const f = flash[k] > 0 ? flash[k] / 25 : 0, x = posX(rows, k), y = posY(rows) + 2 + Math.sin(f * Math.PI) * 6, w = dx * .86;
      const c = color(m), gr = g.createLinearGradient(0, y, 0, y + 26); gr.addColorStop(0, c); gr.addColorStop(1, '#00000066');
      g.shadowColor = c; g.shadowBlur = f ? 18 : 0; g.fillStyle = c; rr(x - w / 2, y, w, 26, 6); g.fill(); g.fillStyle = gr; g.fill(); g.shadowBlur = 0;
      g.fillStyle = '#111'; g.fillText(m >= 100 ? Math.round(m) : m, x, y + 17);
    });
    balls.forEach(b => {
      (b.trail || []).forEach((p, i, arr) => { g.fillStyle = `rgba(255,213,79,${(i + 1) / arr.length * .35})`; g.beginPath(); g.arc(p[0], p[1], 3 + i, 0, 7); g.fill(); });
      const bgr = g.createRadialGradient(b.x - 2, b.y - 3, 1, b.x, b.y, 8); bgr.addColorStop(0, '#fffde7'); bgr.addColorStop(.5, '#ffd54f'); bgr.addColorStop(1, '#e65100');
      g.fillStyle = bgr; g.beginPath(); g.arc(b.x, b.y, 7.5, 0, 7); g.fill();
    });
  }
  function step(now) {
    const { dx, dy } = geo();
    balls.forEach(b => {
      const s = Math.min(1, (now - b.t0) / 140), e = s * s;
      const i = b.i, j = b.j, nj = j + b.path[i];
      b.x = posX(i, j) + (posX(i + 1, nj) - posX(i, j)) * s;
      b.y = posY(i) - 9 + (posY(i + 1) - posY(i)) * e;
      b.trail = (b.trail || []).concat([[b.x, b.y]]).slice(-6);
      if (s >= 1) { b.i++; b.j = nj; b.t0 = now; if (b.i >= rows) b.done = true; else hits[b.i + ',' + b.j] = now; }
    });
    balls.filter(b => b.done).forEach(b => land(b));
    balls = balls.filter(b => !b.done);
    if (!balls.length) $('plRows').disabled = $('plRisk').disabled = false;
    for (const k in flash) flash[k] > 0 && (flash[k] -= 1);
    draw(now); if (balls.length || Object.values(flash).some(v => v > 0) || Object.values(hits).some(h => now - h < 350)) requestAnimationFrame(step);
  }
  function land(b) {
    const k = b.j, m = mults[k], win = Math.round(b.bet * m * 100) / 100; flash[k] = 25; if (m >= 10) Anim.winFx(win, b.bet);
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
    balls.push({ i: 0, j: 0, path, t0: performance.now(), x: W / 2, y: top - 9, bet }); hits['0,0'] = performance.now();
    if (idle) requestAnimationFrame(step);
  };
  setup();
})();
