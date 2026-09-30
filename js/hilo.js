// Hi-Lo: угадайте, будет следующая карта выше или ниже. Каждый верный ответ умножает выигрыш.
(() => {
  const { $, rnd, sleep, msg, fmt, setBalance, readBet, cardEl } = Casino;
  const EDGE = 0.97, SUITS = ['♠', '♥', '♦', '♣'], RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const rankOf = c => RANKS.indexOf(c.r) + 1;                  // туз = 1 (младший), король = 13
  const draw = () => ({ r: RANKS[rnd(13)], s: SUITS[rnd(4)] }); // бесконечная колода: вероятности не меняются
  let card = draw(), bet = 0, chain = 1, playing = false, busy = false, skips = 0, trail = [];

  const pHi = () => (14 - rankOf(card)) / 13, pLo = () => rankOf(card) / 13;
  const mOf = p => Math.floor(EDGE / p * 100) / 100;
  function showCard(c, anim) {
    const el = cardEl(c); el.classList.add('big'); if (anim) el.classList.add('flip');
    $('hlCard').replaceChildren(el);
  }
  function upd() {
    const hi = pHi(), lo = pLo(), r = rankOf(card);
    $('hlHi').innerHTML = `▲ ${r === 13 ? 'Король' : 'Выше или равно'}<small>${(hi * 100).toFixed(1)}% · ×${mOf(hi)}</small>`;
    $('hlLo').innerHTML = `▼ ${r === 1 ? 'Туз' : 'Ниже или равно'}<small>${(lo * 100).toFixed(1)}% · ×${mOf(lo)}</small>`;
    $('hlHi').disabled = !playing || busy || hi >= 1; $('hlLo').disabled = !playing || busy || lo >= 1;
    $('hlSkip').disabled = !playing || busy || skips >= 3; $('hlSkip').textContent = `Пропустить (${3 - skips})`;
    $('hlCash').disabled = !playing || busy || chain <= 1;
    $('hlStart').disabled = playing || busy; $('hlBet').disabled = playing;
    Anim.countTo($('hlMult'), chain, 350, v => '×' + v.toFixed(2));
    Anim.countTo($('hlWin'), fmt(playing ? bet * chain : 0), 350);
  }
  function pushTrail(c, mark) {
    trail.push({ c, mark }); trail = trail.slice(-10);
    $('hlTrail').replaceChildren(...trail.map(t => { const d = document.createElement('div'); d.className = 'hlt ' + (t.mark || ''); const k = cardEl(t.c); k.classList.add('mini'); d.appendChild(k); return d; }));
  }
  $('hlStart').onclick = () => {
    if (playing) return; bet = readBet($('hlBet'), $('hlMsg')); if (!bet) return;
    setBalance(Casino.balance - bet); playing = true; chain = 1; skips = 0; trail = [];
    card = draw(); showCard(card, true); pushTrail(card, 'start'); msg($('hlMsg'), 'Выше или ниже?'); upd();
  };
  async function guess(dir) {
    if (!playing || busy) return; busy = true; upd();
    const p = dir === 'hi' ? pHi() : pLo(), m = mOf(p), next = draw(), a = rankOf(card), b = rankOf(next);
    const ok = dir === 'hi' ? b >= a : b <= a;
    await sleep(200); card = next; showCard(next, true); await sleep(450);
    if (ok) {
      chain = Math.round(chain * m * 10000) / 10000; pushTrail(next, 'ok');
      msg($('hlMsg'), `Верно! ${dir === 'hi' ? '▲' : '▼'} Множитель ×${chain.toFixed(2)}`, 'win');
      $('hlCard').firstChild.classList.add('good');
    } else {
      pushTrail(next, 'bad'); $('hlCard').firstChild.classList.add('bad');
      msg($('hlMsg'), `Мимо — ставка ${fmt(bet)} ₽ проиграна`, 'lose'); playing = false;
    }
    busy = false; upd();
  }
  $('hlHi').onclick = () => guess('hi'); $('hlLo').onclick = () => guess('lo');
  $('hlSkip').onclick = async () => { if (!playing || busy || skips >= 3) return; skips++; busy = true; upd(); card = draw(); showCard(card, true); pushTrail(card, 'skip'); await sleep(400); busy = false; upd(); };
  $('hlCash').onclick = () => {
    if (!playing || busy || chain <= 1) return; const win = Math.floor(bet * chain * 100) / 100;
    setBalance(Casino.balance + win); playing = false; msg($('hlMsg'), `Вы забрали ${fmt(win)} ₽ (×${chain.toFixed(2)})`, 'win'); Anim.winFx(win, bet); upd();
  };
  document.querySelectorAll('#hilo [data-mul]').forEach(b => b.onclick = () => { if (!playing) $('hlBet').value = Math.max(1, Math.floor(+$('hlBet').value * +b.dataset.mul)); });
  showCard(card); upd();
})();
