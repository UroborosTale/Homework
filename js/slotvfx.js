// Визуальные эффекты для всех слотов: всплывающая сумма выигрыша, искры на выигрышных символах,
// осколки при взрыве в лавинах, блик по рамке, заставки начала и конца фриспинов.
(() => {
  const SLOTS = ['slots', 'olympus', 'sweet', 'egypt', 'bigbass', 'doghouse', 'holdwin', 'avalanche', 'legacy', 'samurai',
    'cluster', 'chicago', 'pirates', 'dragons', 'circus', 'diamonds'];
  const FRAME = '.kitframe, .slotframe, .olygrid, .dggrid, .gzframe';
  const reduce = () => Anim.reduce();
  const frameOf = sec => sec.querySelector(FRAME);
  const active = () => { const s = document.querySelector('main > section.active'); return s && SLOTS.includes(s.id) ? s : null; };
  const fmt = v => (Math.round(v * 100) / 100).toLocaleString('ru-RU');

  // блик, который время от времени пробегает по рамке
  SLOTS.forEach(id => {
    const sec = document.getElementById(id); if (!sec) return;
    const f = frameOf(sec); if (!f) return;
    f.classList.add('vfxframe');
    const sh = document.createElement('i'); sh.className = 'fshine'; f.appendChild(sh);
    const fx = document.createElement('div'); fx.className = 'vfxlayer'; f.appendChild(fx);
  });
  const layer = sec => { const f = frameOf(sec); return f && f.querySelector('.vfxlayer'); };

  // ---------- искры и осколки ----------
  let budget = 0; setInterval(() => budget = 0, 120);       // не больше ~40 частиц за 120 мс
  function burst(el, kind) {
    if (reduce() || budget > 40) return;
    const sec = el.closest('section'), L = sec && layer(sec); if (!L) return;
    const a = el.getBoundingClientRect(), b = L.getBoundingClientRect(); if (!a.width) return;
    const cx = a.left + a.width / 2 - b.left, cy = a.top + a.height / 2 - b.top, n = kind === 'pop' ? 8 : 5;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i'), ang = Math.random() * Math.PI * 2, dist = a.width * (.45 + Math.random() * .5);
      p.className = 'vfxp ' + kind;
      p.style.cssText = `left:${cx}px;top:${cy}px;--x:${Math.cos(ang) * dist}px;--y:${Math.sin(ang) * dist}px;--h:${Math.floor(Math.random() * 360)}`;
      L.appendChild(p); budget++;
      setTimeout(() => p.remove(), 800);
    }
  }
  const mo = new MutationObserver(list => {
    for (const m of list) {
      const el = m.target, old = m.oldValue || '';
      if (el.classList.contains('hit') && !/\bhit\b/.test(old)) burst(el, 'spark');
      else if (el.classList.contains('pop') && !/\bpop\b/.test(old)) burst(el, 'pop');
    }
  });
  SLOTS.forEach(id => { const s = document.getElementById(id); if (s) mo.observe(s, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true }); });

  // ---------- всплывающая сумма выигрыша ----------
  let lastBet = 0, fsSum = 0, fsOn = null;
  document.addEventListener('casino:balance', e => {
    const sec = active(); if (!sec) return;
    const d = e.detail.delta;
    if (d < 0) { lastBet = -d; return; }
    if (fsOn === sec) fsSum += d;
    const L = layer(sec); if (!L || d <= 0) return;
    const x = lastBet ? d / lastBet : 1, tier = x >= 10 ? 'big' : x >= 2 ? 'mid' : 'small';
    const p = document.createElement('div'); p.className = 'winpop ' + tier; p.textContent = '+' + fmt(d) + ' ₽';
    L.querySelectorAll('.winpop').forEach(o => o.classList.add('out'));
    L.appendChild(p); setTimeout(() => p.remove(), 1900);
    const f = frameOf(sec); if (tier !== 'small' && f) { f.classList.remove('winflash'); void f.offsetWidth; f.classList.add('winflash'); }
  });

  // ---------- заставки фриспинов ----------
  function splash(sec, html, cls) {
    if (!sec) return; const L = layer(sec); if (!L) return;
    const s = document.createElement('div'); s.className = 'fsplash ' + cls; s.innerHTML = html; L.appendChild(s);
    setTimeout(() => s.remove(), 2400);
  }
  document.addEventListener('slot:fsstart', e => {
    const sec = e.target; fsOn = sec; fsSum = 0; sec.classList.add('fsmode');
    splash(sec, '<b>FREE SPINS</b><small>бесплатные вращения</small>', 'start');
  });
  document.addEventListener('slot:fsend', e => {
    const sec = e.target; sec.classList.remove('fsmode');
    if (fsOn === sec) splash(sec, `<b>${fsSum ? '+' + fmt(fsSum) + ' ₽' : 'БОНУС ОКОНЧЕН'}</b><small>${fsSum ? 'выиграно в бонусе' : 'в этот раз без выигрыша'}</small>`, 'end');
    fsOn = null;
  });
  document.addEventListener('casino:tab', () => { lastBet = 0; });
})();
