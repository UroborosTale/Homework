// Скретч-карты: сотрите защитный слой — три одинаковые суммы дают выигрыш
(() => {
  const { $, rnd, sleep, msg, fmt, setBalance } = Casino;
  // [множитель цены билета, вероятность]; RTP ≈ 95.5%
  const PRIZES = [[1, .13], [2, .075], [3, .04], [5, .03], [10, .012], [20, .005], [50, .0015], [100, .0006], [1000, .00005]];
  const ALL = PRIZES.map(p => p[0]);
  const cv = $('scCanvas'), g = cv.getContext('2d'), grid = $('scGrid');
  let price = 50, ticket = null, scratching = false, revealed = true, lastPt = null, moves = 0;

  function drawPrize() { let r = Math.random(); for (const [m, p] of PRIZES) { if ((r -= p) < 0) return m; } return 0; }
  function makeTicket() {
    const win = drawPrize(), vals = [];
    if (win) vals.push(win, win, win);
    const pool = ALL.filter(v => v !== win); const count = {};
    while (vals.length < 9) { const v = pool[rnd(pool.length)]; if ((count[v] || 0) < 2) { count[v] = (count[v] || 0) + 1; vals.push(v); } }
    for (let i = 8; i > 0; i--) { const j = rnd(i + 1); [vals[i], vals[j]] = [vals[j], vals[i]]; }
    return { win, vals };
  }
  function paintCover() {                                   // металлический защитный слой
    const w = cv.width, h = cv.height; g.globalCompositeOperation = 'source-over';
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#d9d9d9'); gr.addColorStop(.35, '#9e9e9e'); gr.addColorStop(.5, '#f5f5f5'); gr.addColorStop(.7, '#8d8d8d'); gr.addColorStop(1, '#cfcfcf');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffffff18'; for (let i = 0; i < 400; i++) g.fillRect(rnd(w), rnd(h), 2, 2);
    g.fillStyle = '#6d6d6d'; g.font = 'bold 22px sans-serif'; g.textAlign = 'center';
    for (let y = 60; y < h; y += 120) for (let x = 70; x < w; x += 150) g.fillText('★ СОТРИ ★', x + (y / 120 % 2) * 40, y);
  }
  function renderTicket() {
    grid.replaceChildren(...ticket.vals.map(v => { const d = document.createElement('div'); d.className = 'scc'; d.innerHTML = `<span class="sci">💰</span><b>${fmt(v * price)}</b><small>₽</small>`; return d; }));
  }
  function pos(e) { const r = cv.getBoundingClientRect(), t = e.touches ? e.touches[0] : e; return { x: (t.clientX - r.left) * cv.width / r.width, y: (t.clientY - r.top) * cv.height / r.height }; }
  function scratchAt(p) {
    g.globalCompositeOperation = 'destination-out'; g.lineWidth = 46; g.lineCap = 'round';
    g.beginPath(); g.moveTo((lastPt || p).x, (lastPt || p).y); g.lineTo(p.x, p.y); g.stroke(); lastPt = p;
    if (++moves % 12 === 0 && cleared() > .6) finish();
  }
  function cleared() {                                       // доля стёртого слоя (по разреженной выборке пикселей)
    const d = g.getImageData(0, 0, cv.width, cv.height).data; let n = 0, t = 0;
    for (let i = 3; i < d.length; i += 4 * 97) { t++; if (d[i] === 0) n++; }
    return n / t;
  }
  const start = e => { if (revealed) return; scratching = true; lastPt = null; scratchAt(pos(e)); e.preventDefault(); };
  const move = e => { if (!scratching || revealed) return; scratchAt(pos(e)); e.preventDefault(); };
  const end = () => { scratching = false; lastPt = null; };
  cv.addEventListener('mousedown', start); cv.addEventListener('mousemove', move); addEventListener('mouseup', end);
  cv.addEventListener('touchstart', start, { passive: false }); cv.addEventListener('touchmove', move, { passive: false }); cv.addEventListener('touchend', end);

  async function finish() {
    if (revealed) return; revealed = true; scratching = false;
    cv.classList.add('fade'); await sleep(450);
    const els = [...grid.children];
    if (ticket.win) {
      els.forEach((el, i) => { if (ticket.vals[i] === ticket.win) el.classList.add('match'); else el.classList.add('dim'); });
      const w = ticket.win * price; setBalance(Casino.balance + w);
      msg($('scMsg'), `Три по ${fmt(w)} ₽! Выигрыш ${fmt(w)} ₽`, 'win'); Anim.winFx(w, price);
    } else { els.forEach(el => el.classList.add('dim')); msg($('scMsg'), 'Совпадений нет. Попробуйте ещё билет!', 'lose'); }
    $('scBuy').disabled = $('scPrice').disabled = false; $('scReveal').disabled = true;
  }
  $('scBuy').onclick = async () => {
    price = +$('scPrice').value;
    if (price > Casino.balance) return msg($('scMsg'), 'Недостаточно средств', 'lose');
    setBalance(Casino.balance - price); ticket = makeTicket();
    const card = $('scCard'); card.classList.remove('deal'); void card.offsetWidth; card.classList.add('deal');
    cv.classList.remove('fade'); renderTicket(); paintCover(); revealed = false; moves = 0;
    $('scBuy').disabled = $('scPrice').disabled = true; $('scReveal').disabled = false;
    msg($('scMsg'), 'Сотрите слой мышкой или пальцем');
  };
  $('scReveal').onclick = finish;
  [10, 50, 100, 500, 1000].forEach(v => $('scPrice').add(new Option(v + ' ₽', v))); $('scPrice').value = 50;
  $('scPay').innerHTML = PRIZES.slice().reverse().map(([m]) => `<span>3× — ${m === 1 ? 'возврат цены' : '×' + m}</span>`).join('');
  ticket = makeTicket(); price = 50; renderTicket(); paintCover();
})();
