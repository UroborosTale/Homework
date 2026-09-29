// Кости: Sic Bo (три кубика)
(() => {
  const { $, rnd, sleep, msg, fmt, setBalance } = Casino;
  const FACE = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  const TOT = { 4: 60, 5: 30, 6: 17, 7: 12, 8: 8, 9: 6, 10: 6, 11: 6, 12: 6, 13: 8, 14: 12, 15: 17, 16: 30, 17: 60 };
  const bets = {}, cellEls = {}; let chip = 5, busy = false;

  function cell(parent, key, html, cls) {
    const d = document.createElement('div'); d.className = 'cell ' + (cls || ''); d.innerHTML = html;
    d.onclick = () => place(key); parent.appendChild(d); cellEls[key] = d;
  }
  const rowA = $('sbMain'), rowB = $('sbSingles'), rowC = $('sbTotals'), rowD = $('sbTriples');
  cell(rowA, 'small', 'Малое 4–10<small> 1:1</small>'); cell(rowA, 'any3', 'Любая тройка<small> 24:1</small>'); cell(rowA, 'big', 'Большое 11–17<small> 1:1</small>');
  for (let k = 1; k <= 6; k++) cell(rowB, 'n' + k, `<span class="die">${FACE[k - 1]}</span><small>1 кубик 1:1, 2 — 2:1, 3 — 3:1</small>`);
  for (let t = 4; t <= 17; t++) cell(rowC, 't' + t, `${t}<small>${TOT[t]}:1</small>`);
  for (let k = 1; k <= 6; k++) cell(rowD, 'tr' + k, `<span class="die">${FACE[k - 1]}${FACE[k - 1]}${FACE[k - 1]}</span><small>150:1</small>`);

  function place(key) {
    if (busy) return;
    const tot = Object.values(bets).reduce((a, b) => a + b, 0);
    if (tot + chip > Casino.balance) return msg($('sbMsg'), 'Недостаточно средств', 'lose');
    bets[key] = (bets[key] || 0) + chip; render();
  }
  function render() {
    for (const [k, el] of Object.entries(cellEls)) {
      const o = el.querySelector('.stake'); if (o) o.remove();
      if (bets[k]) { const s = document.createElement('span'); s.className = 'stake'; s.textContent = bets[k]; el.appendChild(s); }
    }
    $('sbTotalBet').textContent = Object.values(bets).reduce((a, b) => a + b, 0);
  }
  $('sbChips').onclick = e => {
    if (!e.target.dataset.v) return; chip = +e.target.dataset.v;
    $('sbChips').querySelectorAll('.chip').forEach(c => c.classList.toggle('sel', c === e.target));
  };
  $('sbClear').onclick = () => { if (busy) return; for (const k in bets) delete bets[k]; render(); };

  function payout(key, d) {                         // возвращает множитель с учётом ставки (0 = проигрыш)
    const sum = d[0] + d[1] + d[2], triple = d[0] === d[1] && d[1] === d[2];
    if (key === 'small') return !triple && sum <= 10 ? 2 : 0;
    if (key === 'big') return !triple && sum >= 11 ? 2 : 0;
    if (key === 'any3') return triple ? 25 : 0;
    if (key[0] === 'n') { const c = d.filter(x => x === +key.slice(1)).length; return c ? 1 + c : 0; }
    if (key[0] === 't' && key[1] !== 'r') return sum === +key.slice(1) ? 1 + TOT[sum] : 0;
    if (key.slice(0, 2) === 'tr') return triple && d[0] === +key.slice(2) ? 151 : 0;
    return 0;
  }
  $('sbRoll').onclick = async () => {
    if (busy) return; const tot = Object.values(bets).reduce((a, b) => a + b, 0);
    if (!tot) return msg($('sbMsg'), 'Сначала сделайте ставку', 'lose');
    if (tot > Casino.balance) return msg($('sbMsg'), 'Недостаточно средств', 'lose');
    busy = true; $('sbRoll').disabled = $('sbClear').disabled = true; setBalance(Casino.balance - tot); msg($('sbMsg'), 'Бросаем…');
    const d = [rnd(6) + 1, rnd(6) + 1, rnd(6) + 1], els = [0, 1, 2].map(i => $('sbD' + i));
    els.forEach(e => e.classList.add('rolling'));
    for (let t = 0; t < 12; t++) { els.forEach(e => e.textContent = FACE[rnd(6)]); await sleep(80); }
    els.forEach((e, i) => { e.classList.remove('rolling'); e.textContent = FACE[d[i] - 1]; });
    const sum = d[0] + d[1] + d[2]; let win = 0;
    for (const [k, v] of Object.entries(bets)) win += v * payout(k, d);
    $('sbSum').textContent = `Сумма: ${sum}` + (d[0] === d[1] && d[1] === d[2] ? ' (тройка!)' : '');
    if (win) { setBalance(Casino.balance + win); msg($('sbMsg'), `Выпало ${d.join('-')}. Выплата: ${fmt(win)} ₽ (чистыми ${fmt(win - tot)})`, win >= tot ? 'win' : ''); }
    else msg($('sbMsg'), `Выпало ${d.join('-')}. Ставки проиграли.`, 'lose');
    for (const k in bets) delete bets[k]; render();
    busy = false; $('sbRoll').disabled = $('sbClear').disabled = false;
  };
})();
