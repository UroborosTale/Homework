// Анимации: прокрутка барабанов лентой, падение символов (тумбл), плавные счётчики
const Anim = (() => {
  const reduce = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
  // cubic-bezier как в CSS: плавный разгон и долгое торможение
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = t => ((ax * t + bx) * t + cx) * t, sy = t => ((ay * t + by) * t + cy) * t;
    return x => { let t = x; for (let i = 0; i < 8; i++) { const e = sx(t) - x; if (Math.abs(e) < 1e-5) break; const d = (3 * ax * t + 2 * bx) * t + cx; if (Math.abs(d) < 1e-6) break; t -= e / d; } return sy(Math.min(1, Math.max(0, t))); };
  }
  const spinEase = bezier(.32, 0, .1, 1);
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
      const sp = col.closest('section.turbo') ? .45 : 1;       // турбо ускоряет прокрутку
      const total = (n + 3) * step, over = h * 0.13, D = o.ms * sp, t1 = 0.84;   // total — путь до итоговых символов
      let t0 = null, lastY = -total;
      const setY = y => { strip.style.transform = `translateY(${y}px)`; const v = Math.abs(y - lastY); lastY = y; strip.style.filter = v > 12 ? `blur(${Math.min(2.6, v / 26).toFixed(1)}px)` : 'none'; };
      setY(-total);
      const frame = now => {
        if (t0 === null) t0 = now + (o.delay || 0) * sp;
        const t = Math.max(0, Math.min(1, (now - t0) / D));
        let y;
        if (t < t1) y = -total + (total + over) * spinEase(t / t1);       // разгон и торможение до небольшого перелёта
        else y = over * (1 - easeInOut((t - t1) / (1 - t1)));                 // возврат на место
        setY(y);
        if (t < 1) requestAnimationFrame(frame);
        else {
          strip.remove(); col.classList.remove('rolling');
          col.classList.remove('landed'); void col.offsetWidth; col.classList.add('landed');          // отскок символов при остановке
          const fr = col.closest('.slotframe'); if (fr) { fr.classList.remove('thud'); void fr.offsetWidth; fr.classList.add('thud'); }
          resolve();
        }
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
    const from = parseFloat(String(el.textContent).replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0, tok = {}; tokens.set(el, tok);
    if (reduce() || from === to) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const step = now => {
      if (tokens.get(el) !== tok) return;
      const t = Math.min(1, (now - t0) / ms); el.textContent = fmt(from + (to - from) * easeOutCubic(t));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // Крупный выигрыш: оверлей BIG/MEGA/EPIC WIN с набегающей суммой и дождём монет (не блокирует игру)
  let fxBusy = false;
  function winFx(win, bet) {
    if (!bet || win < bet * 10 || fxBusy) return;
    const ratio = win / bet, tier = ratio >= 100 ? 'EPIC WIN' : ratio >= 50 ? 'MEGA WIN' : ratio >= 25 ? 'SUPER WIN' : 'BIG WIN';
    let o = document.getElementById('winfx');
    if (!o) {
      o = document.createElement('div'); o.id = 'winfx';
      o.innerHTML = '<canvas></canvas><div class="wfx-box"><div class="wfx-t"></div><div class="wfx-a"><span>0</span> ₽</div><div class="wfx-x"></div></div>';
      document.body.appendChild(o); o.onclick = () => o.classList.remove('show');
    }
    fxBusy = true; o.className = 'show tier-' + tier.split(' ')[0].toLowerCase();
    o.querySelector('.wfx-t').textContent = tier; o.querySelector('.wfx-x').textContent = '×' + (Math.round(ratio * 10) / 10);
    const amt = o.querySelector('.wfx-a span'); amt.textContent = 0; countTo(amt, Math.round(win * 100) / 100, 1600);
    const cv = o.querySelector('canvas'), g = cv.getContext('2d'); cv.width = innerWidth; cv.height = innerHeight;
    const n = Math.min(160, 40 + ratio * 1.2), coins = Array.from({ length: n }, () => ({
      x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * .8, vx: (Math.random() - .5) * 2, vy: 2 + Math.random() * 4,
      r: 7 + Math.random() * 9, a: Math.random() * 6, va: .1 + Math.random() * .2 }));
    const t0 = performance.now(), D = reduce() ? 1400 : 3000;
    const frame = now => {
      const t = now - t0; g.clearRect(0, 0, cv.width, cv.height);
      if (!reduce()) coins.forEach(c => {
        c.vy += .12; c.x += c.vx; c.y += c.vy; c.a += c.va; const w = Math.abs(Math.cos(c.a)) * c.r + 1;
        const gr = g.createLinearGradient(c.x - w, c.y, c.x + w, c.y); gr.addColorStop(0, '#fff3b0'); gr.addColorStop(.5, '#f5b920'); gr.addColorStop(1, '#a56a00');
        g.fillStyle = gr; g.beginPath(); g.ellipse(c.x, c.y, w, c.r, 0, 0, 7); g.fill(); g.strokeStyle = '#7a4a00'; g.lineWidth = 1.5; g.stroke();
      });
      if (t < D && o.classList.contains('show')) requestAnimationFrame(frame);
      else { o.classList.remove('show'); g.clearRect(0, 0, cv.width, cv.height); fxBusy = false; }
    };
    requestAnimationFrame(frame);
  }
  return { reelSpin, dropDiff, countTo, reduce, easeOutCubic, bezier, winFx };
})();
