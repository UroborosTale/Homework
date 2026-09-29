// Ракета (Crash): множитель растёт, пока не «улетит» — успейте забрать выигрыш
(() => {
  const { $, sleep, msg, fmt, setBalance, readBet } = Casino;
  const cv = $('crCanvas'), g = cv.getContext('2d'), W = cv.width, H = cv.height;
  const K = 0.11;                                        // скорость роста: m = e^(K·t)
  let state = 'idle', bet = 0, crashAt = 1, t0 = 0, mult = 1, cashed = 0, auto = 0, raf = 0;
  const hist = [];

  function newCrashPoint() { return Math.max(1, Math.floor(96 / (1 - Math.random())) / 100); }   // RTP 96%
  function draw(t, crashed) {
    g.clearRect(0, 0, W, H);
    const tmax = Math.max(6, t * 1.15), mmax = Math.max(2, mult * 1.2);
    const X = s => 40 + (W - 60) * s / tmax, Y = m => H - 30 - (H - 60) * (Math.log(m) / Math.log(mmax));
    g.strokeStyle = '#ffffff22'; g.fillStyle = '#ffffff88'; g.font = '12px sans-serif'; g.lineWidth = 1;
    for (const m of [1.5, 2, 3, 5, 10, 20, 50, 100, 500, 1000]) if (m < mmax) { g.beginPath(); g.moveTo(40, Y(m)); g.lineTo(W - 10, Y(m)); g.stroke(); g.fillText('×' + m, 4, Y(m) + 4); }
    g.beginPath(); g.moveTo(X(0), Y(1));
    for (let s = 0; s <= t; s += t / 80 + 0.001) g.lineTo(X(s), Y(Math.exp(K * s)));
    g.lineTo(X(t), Y(mult)); g.lineWidth = 4; g.strokeStyle = crashed ? '#ff5252' : '#ffd54f'; g.stroke();
    const x = X(t), y = Y(mult);
    g.font = '28px sans-serif'; g.fillText(crashed ? '💥' : '🚀', Math.min(x, W - 40), Math.max(y, 30));
    g.font = 'bold 54px sans-serif'; g.fillStyle = crashed ? '#ff5252' : cashed ? '#69f0ae' : '#fff'; g.textAlign = 'center';
    g.fillText('×' + mult.toFixed(2), W / 2, H / 2 - 10);
    if (crashed) { g.font = 'bold 22px sans-serif'; g.fillText('КРАХ', W / 2, H / 2 + 24); }
    g.textAlign = 'left';
  }
  function pushHist(m) {
    hist.unshift(m); if (hist.length > 14) hist.pop();
    $('crHist').replaceChildren(...hist.map(v => { const s = document.createElement('span'); s.className = 'wide'; s.textContent = v.toFixed(2) + '×';
      s.style.background = v < 2 ? '#c62828' : v < 10 ? '#2e7d32' : '#6a1b9a'; return s; }));
  }
  function cashOut(at) {
    if (state !== 'run' || cashed) return;
    cashed = at; const win = Math.floor(bet * at * 100) / 100; setBalance(Casino.balance + win);
    msg($('crMsg'), `Забрали на ×${at.toFixed(2)}: +${fmt(win - bet)} ₽`, 'win'); $('crBtn').textContent = 'Ждём взлёт…'; $('crBtn').disabled = true;
  }
  function frame(now) {
    const t = (now - t0) / 1000; mult = Math.exp(K * t);
    if (auto > 1 && !cashed && mult >= auto && auto < crashAt) cashOut(auto);
    if (mult >= crashAt) {                                // крах
      mult = crashAt; draw(t, true); state = 'idle'; pushHist(crashAt);
      if (!cashed) msg($('crMsg'), `Ракета улетела на ×${crashAt.toFixed(2)}. Ставка проиграна.`, 'lose');
      $('crBtn').textContent = 'ИГРАТЬ 🚀'; $('crBtn').disabled = false; $('crBet').disabled = $('crAuto').disabled = false; return;
    }
    draw(t, false); raf = requestAnimationFrame(frame);
  }
  $('crBtn').onclick = () => {
    if (state === 'run') return cashOut(mult);
    bet = readBet($('crBet'), $('crMsg')); if (!bet) return;
    auto = +$('crAuto').value || 0; setBalance(Casino.balance - bet);
    state = 'run'; cashed = 0; crashAt = newCrashPoint(); mult = 1;
    $('crBtn').textContent = 'ЗАБРАТЬ'; $('crBet').disabled = $('crAuto').disabled = true; msg($('crMsg'), 'Полёт…');
    t0 = performance.now(); raf = requestAnimationFrame(frame);
  };
  draw(0, false);
})();
