// Анимации: прокрутка барабанов лентой, падение символов (тумбл), плавные счётчики
const Anim = (() => {
  const reduce = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
  const easeInOut = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  // Барабан-лента: старые символы уезжают вниз, новые въезжают сверху, в конце небольшой «отскок».
  // col — .rcol с тремя .sc; o.commit() записывает итоговые символы в настоящие ячейки (вызывается после снимка старых).
  // o.final — 3 итоговых элемента (сверху вниз), o.rand() — случайный символ, o.fill(el, item) — заполняет клетку.
  function reelSpin(col, o) {
    const cells = [...col.children].filter(e => e.classList.contains('sc'));
    const olds = cells.map(c => { const n = c.cloneNode(true); n.classList.remove('hit'); return n; });
    o.commit();
    if (reduce()) return Promise.resolve();
    return new Promise(resolve => {
      const h = cells[0].offsetHeight, gap = parseFloat(getComputedStyle(col).rowGap) || 0, step = h + gap, n = o.count;
      const strip = document.createElement('div'); strip.className = 'rstrip';
      strip.style.cssText = `position:absolute;left:0;right:0;top:0;display:flex;flex-direction:column;gap:${gap}px;will-change:transform`;
      const mk = el => { el.style.height = h + 'px'; el.style.aspectRatio = 'auto'; el.style.flex = '0 0 auto'; strip.appendChild(el); };
      o.final.forEach(it => { const d = document.createElement('div'); d.className = 'sc'; o.fill(d, it); mk(d); });
      for (let i = 0; i < n; i++) { const d = document.createElement('div'); d.className = 'sc'; o.fill(d, o.rand()); mk(d); }
      olds.forEach(mk);
      col.classList.add('rolling'); col.appendChild(strip);
      const total = (n + 3) * step, over = h * 0.13, D = o.ms, t1 = 0.84;   // total — путь до итоговых символов
      let t0 = null, lastY = -total;
      const setY = y => { strip.style.transform = `translateY(${y}px)`; const v = Math.abs(y - lastY); lastY = y; strip.style.filter = v > 12 ? `blur(${Math.min(2.6, v / 26).toFixed(1)}px)` : 'none'; };
      setY(-total);
      const frame = now => {
        if (t0 === null) t0 = now + (o.delay || 0);
        const t = Math.max(0, Math.min(1, (now - t0) / D));
        let y;
        if (t < t1) y = -total + (total + over) * easeOutCubic(t / t1);       // разгон и торможение до небольшого перелёта
        else y = over * (1 - easeInOut((t - t1) / (1 - t1)));                 // возврат на место
        setY(y);
        if (t < 1) requestAnimationFrame(frame);
        else { strip.remove(); col.classList.remove('rolling'); resolve(); }
      };
      requestAnimationFrame(frame);
    });
  }

  // Для каждой клетки нового поля определяет, на сколько рядов она падает (0 — не двигалась).
  // Использует то, что «оставшиеся» символы — те же объекты, что и в предыдущем поле.
  function dropDiff(prev, next) {
    return next.map((col, c) => {
      const old = new Map(prev[c].map((x, i) => [x, i])), fresh = col.filter(x => !old.has(x)).length;
      return col.map((x, r) => old.has(x) ? Math.max(0, r - old.get(x)) : Math.max(1, fresh));
    });
  }

  // Плавный счётчик числа в элементе
  const tokens = new WeakMap();
  function countTo(el, to, ms = 600, fmt = v => Math.round(v * 100) / 100) {
    const from = parseFloat(String(el.textContent).replace(/\s/g, '').replace(',', '.')) || 0, tok = {}; tokens.set(el, tok);
    if (reduce() || from === to) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const step = now => {
      if (tokens.get(el) !== tok) return;
      const t = Math.min(1, (now - t0) / ms); el.textContent = fmt(from + (to - from) * easeOutCubic(t));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  return { reelSpin, dropDiff, countTo, reduce, easeOutCubic };
})();
