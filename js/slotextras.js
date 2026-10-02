// Улучшения для всех слотов: высокие ставки, кнопки −/+/MAX, турбо для линейных слотов, запуск пробелом
(() => {
  const { $ } = Casino;
  // id селекта ставки → дополнительные (более крупные) ставки
  // максимальная общая ставка — 50 000 ₽ (у линейных слотов здесь ставка на линию × 10 линий)
  const LINE = [100, 250, 500, 1000, 2500, 5000], TOTAL = [5000, 10000, 25000, 50000];
  const BETS = {
    slotBet: LINE, egBet: LINE, bbBet: LINE, hwBet: LINE, lgBet: LINE, gzBet: LINE,
    olyBet: TOTAL, swBet: TOTAL, dgBet: TOTAL, smBet: TOTAL,
    clusterBet: TOTAL, chicagoBet: TOTAL, piratesBet: TOTAL, dragonsBet: TOTAL, circusBet: TOTAL, diamondsBet: TOTAL,
  };
  const ALL = Object.keys(BETS);
  for (const [id, extra] of Object.entries(BETS)) {
    const sel = $(id); const have = new Set([...sel.options].map(o => +o.value));
    extra.forEach(v => { if (!have.has(v)) sel.add(new Option(v, v)); });
  }
  const change = sel => sel.dispatchEvent(new Event('change'));
  ALL.forEach(id => {
    const sel = $(id), host = sel.closest('label') || sel;
    const box = document.createElement('span'); box.className = 'betstep';
    box.innerHTML = '<button class="btn" data-d="-1" title="Меньше">−</button><button class="btn" data-d="1" title="Больше">+</button><button class="btn maxb" data-d="max" title="Максимальная ставка">MAX</button>';
    host.insertAdjacentElement('afterend', box);
    box.onclick = e => {
      const d = e.target.dataset.d; if (!d || sel.disabled) return;
      sel.selectedIndex = d === 'max' ? sel.options.length - 1 : Math.max(0, Math.min(sel.options.length - 1, sel.selectedIndex + +d));
      change(sel); sel.classList.remove('bumped'); void sel.offsetWidth; sel.classList.add('bumped');
    };
    const sync = () => box.querySelectorAll('button').forEach(b => b.disabled = sel.disabled);
    new MutationObserver(sync).observe(sel, { attributes: true, attributeFilter: ['disabled'] }); sync();
  });
  // Турбо для линейных слотов (у тумбл-слотов своя кнопка)
  [['slots', 'auto'], ['egypt', 'egAuto'], ['bigbass', 'bbAuto'], ['holdwin', 'hwAuto'], ['legacy', 'lgAuto'], ['avalanche', 'gzAuto']].forEach(([sec, after]) => {
    const b = document.createElement('button'); b.className = 'btn'; b.textContent = 'Турбо: выкл';
    b.onclick = () => { const on = $(sec).classList.toggle('turbo'); b.textContent = 'Турбо: ' + (on ? 'вкл' : 'выкл'); };
    $(after).insertAdjacentElement('afterend', b);
  });
  // Пробел / Enter — главная кнопка активной игры (если фокус не в поле ввода)
  const MAIN = { slots: 'spin', olympus: 'olySpin', sweet: 'swSpin', egypt: 'egSpin', bigbass: 'bbSpin', doghouse: 'dgSpin', holdwin: 'hwSpin', avalanche: 'gzSpin', legacy: 'lgSpin', samurai: 'smSpin', cluster: 'clusterSpin', chicago: 'chicagoSpin', pirates: 'piratesSpin', dragons: 'dragonsSpin', circus: 'circusSpin', diamonds: 'diamondsSpin' };
  document.addEventListener('keydown', e => {
    if (e.key !== ' ' || e.repeat || /INPUT|SELECT|TEXTAREA|BUTTON/.test(e.target.tagName) || document.querySelector('.modal.show')) return;
    const sec = document.querySelector('main > section.active'); if (!sec || !MAIN[sec.id]) return;
    const btn = $(MAIN[sec.id]); e.preventDefault();
    if (btn && !btn.disabled) { btn.click(); btn.classList.remove('kpress'); void btn.offsetWidth; btn.classList.add('kpress'); }
  });
})();
