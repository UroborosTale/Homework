// Кубики (Dice): выпадает число 0.00–99.99 — угадайте «больше» или «меньше» порога
(() => {
  const { $, rnd, sleep, msg, fmt, setBalance, readBet } = Casino;
  const EDGE = 0.98;                                          // RTP 98%
  let over = true, busy = false, auto = false, hist = [];
  const chance = () => { const t = +$('dcTarget').value; return over ? 100 - t : t; };
  const mult = () => Math.floor(EDGE * 100 / chance() * 10000) / 10000;
  function upd() {
    const t = +$('dcTarget').value, c = chance();
    $('dcChance').textContent = c.toFixed(2) + '%'; $('dcMult').textContent = '×' + mult().toFixed(4);
    $('dcTargetV').textContent = t.toFixed(2); $('dcMode').textContent = over ? 'Больше ▲' : 'Меньше ▼';
    const bet = Math.max(0, Math.floor(+$('dcBet').value) || 0); $('dcProfit').textContent = fmt(bet * mult() - bet);
    // зоны на шкале: зелёная — выигрыш
    $('dcTrack').style.background = over ? `linear-gradient(90deg, #e53935 ${t}%, #43a047 ${t}%)` : `linear-gradient(90deg, #43a047 ${t}%, #e53935 ${t}%)`;
  }
  $('dcTarget').oninput = upd; $('dcBet').oninput = upd;
  $('dcMode').onclick = () => { if (busy) return; over = !over; $('dcTarget').value = (100 - +$('dcTarget').value).toFixed(2); upd(); };
  document.querySelectorAll('#dice [data-mul]').forEach(b => b.onclick = () => { const v = Math.max(1, Math.floor(+$('dcBet').value * +b.dataset.mul)); $('dcBet').value = v; upd(); });

  async function roll() {
    if (busy) return; const bet = readBet($('dcBet'), $('dcMsg')); if (!bet) { auto = false; $('dcAuto').textContent = 'Авто: выкл'; return; }
    busy = true; $('dcRoll').disabled = true; setBalance(Casino.balance - bet);
    const res = rnd(10000) / 100, t = +$('dcTarget').value, win = over ? res > t : res < t, m = mult();
    const num = $('dcNum'), mark = $('dcMark');
    num.className = 'dcnum rolling'; mark.className = 'dcmark show';
    const t0 = performance.now(), D = auto ? 420 : 700;
    await new Promise(done => {                               // число «прокручивается», маркер едет по шкале
      const f = now => { const k = Math.min(1, (now - t0) / D), e = Anim.easeOutCubic(k);
        const cur = k < 1 ? (Math.random() * 100 * (1 - e) + res * e) : res;
        num.textContent = cur.toFixed(2); mark.style.left = cur + '%'; mark.dataset.v = cur.toFixed(2);
        if (k < 1) requestAnimationFrame(f); else done(); };
      requestAnimationFrame(f);
    });
    num.className = 'dcnum ' + (win ? 'win' : 'lose'); mark.className = 'dcmark show ' + (win ? 'win' : 'lose');
    if (win) { const pay = Math.floor(bet * m * 100) / 100; setBalance(Casino.balance + pay); msg($('dcMsg'), `${res.toFixed(2)} — выигрыш ${fmt(pay - bet)} ₽`, 'win'); Anim.winFx(pay, bet); }
    else msg($('dcMsg'), `${res.toFixed(2)} — мимо`, 'lose');
    hist.unshift({ res, win }); hist = hist.slice(0, 16);
    $('dcHist').replaceChildren(...hist.map(h => { const s = document.createElement('span'); s.className = 'wide'; s.textContent = h.res.toFixed(2); s.style.background = h.win ? '#2e7d32' : '#c62828'; return s; }));
    busy = false; $('dcRoll').disabled = false;
    if (auto) { await sleep(win ? 500 : 280); if (auto) roll(); }
  }
  document.addEventListener('casino:tab', e => { if (auto && e.detail !== 'dice') { auto = false; $('dcAuto').textContent = 'Авто: выкл'; } });
  $('dcRoll').onclick = () => { auto = false; $('dcAuto').textContent = 'Авто: выкл'; roll(); };
  $('dcAuto').onclick = () => { auto = !auto; $('dcAuto').textContent = 'Авто: ' + (auto ? 'вкл' : 'выкл'); if (auto && !busy) roll(); };
  upd();
})();
