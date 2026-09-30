// Ракета (Crash): множитель растёт, пока не «улетит» — успейте забрать выигрыш
(() => {
  const { $, sleep, msg, fmt, setBalance, readBet } = Casino;
  const cv = $('crCanvas'), g = cv.getContext('2d'), W = cv.width, H = cv.height;
  const K = 0.11;                                        // скорость роста: m = e^(K·t)
  let state = 'idle', bet = 0, crashAt = 1, t0 = 0, mult = 1, cashed = 0, auto = 0, raf = 0;
  const hist = [];

  function newCrashPoint() { return Math.max(1, Math.floor(96 / (1 - Math.random())) / 100); }   // RTP 96%
  // Звёзды (параллакс), кривая с заливкой, векторная ракета с пламенем, взрыв при крахе
  const stars = Array.from({ length: 90 }, () => ({ x: Math.random() * W, y: Math.random() * H, z: .3 + Math.random() * 1.2 }));
  let cashT = 0, boom = null;
  function rocket(x, y, ang, t) {
    g.save(); g.translate(x, y); g.rotate(ang);
    const fl = 14 + Math.sin(t * 40) * 4 + Math.random() * 4;             // пламя
    const fg = g.createLinearGradient(-26 - fl, 0, -16, 0); fg.addColorStop(0, '#ff572200'); fg.addColorStop(.5, '#ff9800'); fg.addColorStop(1, '#fff59d');
    g.fillStyle = fg; g.beginPath(); g.moveTo(-16, -6); g.quadraticCurveTo(-26 - fl, 0, -16, 6); g.closePath(); g.fill();
    const bg = g.createLinearGradient(0, -9, 0, 9); bg.addColorStop(0, '#ffffff'); bg.addColorStop(.6, '#cfd8dc'); bg.addColorStop(1, '#78909c');
    g.fillStyle = bg; g.beginPath(); g.moveTo(22, 0); g.quadraticCurveTo(10, -10, -16, -8); g.lineTo(-16, 8); g.quadraticCurveTo(10, 10, 22, 0); g.fill();
    g.fillStyle = '#e53935'; g.beginPath(); g.moveTo(22, 0); g.quadraticCurveTo(17, -6, 12, -7); g.lineTo(12, 7); g.quadraticCurveTo(17, 6, 22, 0); g.fill();
    g.beginPath(); g.moveTo(-10, -8); g.lineTo(-20, -16); g.lineTo(-16, -7); g.moveTo(-10, 8); g.lineTo(-20, 16); g.lineTo(-16, 7); g.fill();
    g.fillStyle = '#4fc3f7'; g.beginPath(); g.arc(4, 0, 3.6, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke();
    g.restore();
  }
  function draw(t, crashed) {
    const bgd = g.createLinearGradient(0, 0, 0, H); bgd.addColorStop(0, '#050a1e'); bgd.addColorStop(1, crashed ? '#2a0610' : '#0c2340');
    g.fillStyle = bgd; g.fillRect(0, 0, W, H);
    stars.forEach(st => { const x = ((st.x - t * 30 * st.z) % W + W) % W, y = (st.y + t * 12 * st.z) % H; g.fillStyle = `rgba(255,255,255,${.25 + st.z * .4})`; g.fillRect(x, y, st.z * 1.6, st.z * 1.6); });
    const tmax = Math.max(6, t * 1.15), mmax = Math.max(2, mult * 1.2);
    const X = s => 40 + (W - 60) * s / tmax, Y = m => H - 30 - (H - 60) * (Math.log(m) / Math.log(mmax));
    g.strokeStyle = '#ffffff18'; g.fillStyle = '#ffffff77'; g.font = '12px sans-serif'; g.lineWidth = 1;
    for (const m of [1.5, 2, 3, 5, 10, 20, 50, 100, 500, 1000]) if (m < mmax) { g.beginPath(); g.moveTo(40, Y(m)); g.lineTo(W - 10, Y(m)); g.stroke(); g.fillText('×' + m, 4, Y(m) + 4); }
    const pts = []; for (let s = 0; s <= t; s += t / 80 + 0.001) pts.push([X(s), Y(Math.exp(K * s))]); pts.push([X(t), Y(mult)]);
    const col = crashed ? '#ff5252' : '#ffd54f';
    g.beginPath(); g.moveTo(X(0), H - 30); pts.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(X(t), H - 30); g.closePath();
    const fill = g.createLinearGradient(0, 0, 0, H); fill.addColorStop(0, crashed ? '#ff525255' : '#ffd54f55'); fill.addColorStop(1, '#ffd54f00'); g.fillStyle = fill; g.fill();
    g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.lineWidth = 4; g.strokeStyle = col; g.shadowColor = col; g.shadowBlur = 12; g.stroke(); g.shadowBlur = 0;
    if (cashed && cashT) { const cx = X(cashT), cy = Y(cashed); g.fillStyle = '#69f0ae'; g.beginPath(); g.arc(cx, cy, 6, 0, 7); g.fill(); g.font = 'bold 13px sans-serif'; g.fillText('✓ ×' + cashed.toFixed(2), cx + 8, cy - 8); }
    const [px, py] = pts[pts.length - 1], [qx, qy] = pts[Math.max(0, pts.length - 4)], ang = Math.atan2(py - qy, px - qx || 1);
    if (!crashed) rocket(Math.min(px, W - 26), Math.max(py, 22), t < .05 ? -0.3 : ang, t);
    g.font = 'bold 56px sans-serif'; g.fillStyle = crashed ? '#ff5252' : cashed ? '#69f0ae' : '#fff'; g.textAlign = 'center';
    g.shadowColor = '#000'; g.shadowBlur = 10; g.fillText('×' + mult.toFixed(2), W / 2, H / 2 - 10); g.shadowBlur = 0;
    if (crashed) { g.font = 'bold 22px sans-serif'; g.fillText('КРАХ', W / 2, H / 2 + 24); }
    g.textAlign = 'left';
    return [Math.min(px, W - 26), Math.max(py, 22)];
  }
  function explode(t) {                                    // взрыв: разлетающиеся искры поверх последнего кадра
    const [x, y] = draw(t, true), parts = Array.from({ length: 60 }, () => ({ a: Math.random() * 7, v: 1 + Math.random() * 5, r: 1.5 + Math.random() * 3 })), t1 = performance.now();
    const f = now => { const k = (now - t1) / 900; if (k >= 1 || state === 'run') return; draw(t, true);
      parts.forEach(p => { const d = p.v * k * 60; g.fillStyle = `hsla(${20 + p.r * 10},100%,${60 - k * 30}%,${1 - k})`; g.beginPath(); g.arc(x + Math.cos(p.a) * d, y + Math.sin(p.a) * d + k * k * 30, p.r * (1 - k * .5), 0, 7); g.fill(); });
      g.fillStyle = `rgba(255,200,80,${.5 * (1 - k)})`; g.beginPath(); g.arc(x, y, 30 * k + 8, 0, 7); g.fill(); requestAnimationFrame(f); };
    requestAnimationFrame(f);
  }
  function pushHist(m) {
    hist.unshift(m); if (hist.length > 14) hist.pop();
    $('crHist').replaceChildren(...hist.map(v => { const s = document.createElement('span'); s.className = 'wide'; s.textContent = v.toFixed(2) + '×';
      s.style.background = v < 2 ? '#c62828' : v < 10 ? '#2e7d32' : '#6a1b9a'; return s; }));
  }
  function cashOut(at) {
    if (state !== 'run' || cashed) return;
    cashed = at; cashT = Math.log(at) / K; const win = Math.floor(bet * at * 100) / 100; setBalance(Casino.balance + win); Anim.winFx(win, bet);
    msg($('crMsg'), `Забрали на ×${at.toFixed(2)}: +${fmt(win - bet)} ₽`, 'win'); $('crBtn').textContent = 'Ждём взлёт…'; $('crBtn').disabled = true;
  }
  function frame(now) {
    const t = (now - t0) / 1000; mult = Math.exp(K * t);
    if (auto > 1 && !cashed && mult >= auto && auto < crashAt) cashOut(auto);
    if (mult >= crashAt) {                                // крах
      mult = crashAt; state = 'idle'; explode(t); pushHist(crashAt);
      if (!cashed) msg($('crMsg'), `Ракета улетела на ×${crashAt.toFixed(2)}. Ставка проиграна.`, 'lose');
      $('crBtn').textContent = 'ИГРАТЬ 🚀'; $('crBtn').disabled = false; $('crBet').disabled = $('crAuto').disabled = false; return;
    }
    draw(t, false); raf = requestAnimationFrame(frame);
  }
  $('crBtn').onclick = () => {
    if (state === 'run') return cashOut(mult);
    bet = readBet($('crBet'), $('crMsg')); if (!bet) return;
    auto = +$('crAuto').value || 0; setBalance(Casino.balance - bet);
    state = 'run'; cashed = 0; cashT = 0; crashAt = newCrashPoint(); mult = 1;
    $('crBtn').textContent = 'ЗАБРАТЬ'; $('crBet').disabled = $('crAuto').disabled = true; msg($('crMsg'), 'Полёт…');
    t0 = performance.now(); raf = requestAnimationFrame(frame);
  };
  draw(0, false);
})();
