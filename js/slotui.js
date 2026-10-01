// Общий интерфейс линейного слота 5×3: сетка, прокрутка барабанов, линии выигрыша, таблица выплат
const SlotUI = (() => {
  const COLORS = ['#ff5252', '#40c4ff', '#69f0ae', '#ffd740', '#e040fb', '#ff6e40', '#18ffff', '#b2ff59', '#ff4081', '#7c4dff'];
  function create({ grid, svg, lines, fill, rand, reels = 5, rows = 3 }) {
    const { rnd, sleep } = Casino;
    const cells = [];
    for (let r = 0; r < reels; r++) {
      const col = document.createElement('div'); col.className = 'rcol'; cells[r] = [];
      for (let w = 0; w < rows; w++) { const d = document.createElement('div'); d.className = 'sc'; col.appendChild(d); cells[r][w] = d; }
      grid.appendChild(col);
    }
    const put = (r, w, it) => fill(cells[r][w], it);
    const show = g => g.forEach((col, r) => col.forEach((it, w) => put(r, w, it)));
    let cycle = 0;
    function clear() {
      cycle++; cells.flat().forEach(c => c.classList.remove('hit'));
      svg.style.transition = 'opacity .22s'; svg.style.opacity = 0; setTimeout(() => { svg.innerHTML = ''; svg.style.opacity = 1; }, 230);
    }
    function drawLine(li, n, all) {
      const W = 560, H = 340, cw = W / reels, rh = H / rows;
      const pl = (i, k) => `<polyline points="${lines[i].slice(0, k).map((row, r) => `${(r + .5) * cw},${(row + .5) * rh}`).join(' ')}" fill="none" stroke="${COLORS[i % COLORS.length]}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round" opacity=".88" class="wline"/>`;
      svg.innerHTML = all ? all.map(w => pl(w.line, w.count)).join('') : pl(li, n);
    }
    async function cycleWins(wins) {
      const id = ++cycle; if (!wins.length) return;
      while (id === cycle) for (const w of wins) {
        if (id !== cycle) return;
        cells.flat().forEach(c => c.classList.remove('hit'));
        w.cells.forEach(([r, row]) => cells[r][row].classList.add('hit')); drawLine(w.line, w.count); await sleep(1000);
      }
    }
    const stop = () => { cycle++; };
    function animate(g) {
      const cols = [...grid.querySelectorAll('.rcol')];
      return Promise.all(cols.map((col, r) => Anim.reelSpin(col, {
        count: 10 + r * 4, ms: 900 + r * 260, delay: r * 90, final: g[r], rand, fill,
        commit: () => g[r].forEach((it, w) => put(r, w, it)),
      })));
    }
    return { cells, put, show, clear, drawLine, cycleWins, animate, stop };
  }
  // Таблица выплат: symIcon(k) — html символа
  function payTable(syms, symIcon, note = 'множители от ставки на линию') {
    return '<table><tr><th></th><th>×3</th><th>×4</th><th>×5</th></tr>' +
      Object.entries(syms).filter(([, s]) => s.pay).map(([k, s]) => `<tr><td>${symIcon(k)}</td>${s.pay.map(p => `<td>×${Math.round(p * 100) / 100}</td>`).join('')}</tr>`).join('') +
      `</table><small>${note}</small>`;
  }

  // ---- Автоигра с настройками: число спинов и условия остановки (общая для всех слотов)
  let cfg = { spins: 50, stopWin: 0, stopLoss: 0 };
  try { Object.assign(cfg, JSON.parse(localStorage.getItem('casinoAutoCfg') || '{}')); } catch (e) {}
  function toast(text) {
    let t = document.getElementById('toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
    t.textContent = text; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
  }
  function openModal(onStart) {
    let m = document.getElementById('autoModal');
    if (!m) {
      m = document.createElement('div'); m.id = 'autoModal'; m.className = 'modal';
      const row = (key, title, opts) => `<div class="mrow"><div class="mt">${title}</div><div class="mopts" data-key="${key}">${opts.map(([v, l]) => `<button class="mopt" data-v="${v}">${l}</button>`).join('')}</div></div>`;
      m.innerHTML = `<div class="mbox"><h3>⚙️ Автоигра</h3>
        ${row('spins', 'Количество спинов', [[10, '10'], [25, '25'], [50, '50'], [100, '100'], [250, '250'], [0, '∞']])}
        ${row('stopWin', 'Остановить при выигрыше за спин от', [[0, 'нет'], [10, '×10'], [50, '×50'], [100, '×100'], [500, '×500']])}
        ${row('stopLoss', 'Остановить при потере баланса', [[0, 'нет'], [0.1, '10%'], [0.25, '25%'], [0.5, '50%']])}
        <div class="mbtns"><button class="btn" data-act="cancel">Отмена</button><button class="btn primary" data-act="start">▶ Запустить</button></div></div>`;
      document.body.appendChild(m);
      m.addEventListener('click', e => {
        const o = e.target.closest('.mopt');
        if (o) { const k = o.parentElement.dataset.key; cfg[k] = +o.dataset.v; paint(); return; }
        if (e.target === m || e.target.dataset.act === 'cancel') m.classList.remove('show');
        if (e.target.dataset.act === 'start') { m.classList.remove('show'); try { localStorage.setItem('casinoAutoCfg', JSON.stringify(cfg)); } catch (err) {} m._start && m._start({ ...cfg }); }
      });
    }
    const paint = () => m.querySelectorAll('.mopts').forEach(g => g.querySelectorAll('.mopt').forEach(b => b.classList.toggle('on', +b.dataset.v === cfg[g.dataset.key])));
    paint(); m._start = onStart; m.classList.add('show');
  }
  function auto(btn, { start, stop }) {
    const st = { on: false, left: Infinity, cfg: null, startBal: 0 }, sec = btn.closest('section');
    document.addEventListener('casino:tab', e => {                  // ушли со слота — автоигра останавливается
      if (st.on && sec && e.detail !== sec.id) { st.on = false; label(); stop(); toast('Автоигра остановлена: вы вышли из слота'); }
    });
    const label = () => { btn.textContent = st.on ? `■ Стоп${isFinite(st.left) ? ` (${st.left})` : ''}` : 'Авто: выкл'; btn.classList.toggle('autoon', st.on); };
    btn.onclick = () => {
      if (st.on) { st.on = false; label(); stop(); return; }
      openModal(c => { st.on = true; st.cfg = c; st.left = c.spins || Infinity; st.startBal = Casino.balance; label(); start(); });
    };
    return {
      get on() { return st.on; },
      cancel() { st.on = false; label(); },
      after(win, bet) {                                    // вызывается в конце раунда; false — авто остановлено
        if (!st.on) return false;
        st.left--; let why = '';
        if (st.left <= 0) why = 'Автоигра завершена';
        else if (st.cfg.stopWin && win >= bet * st.cfg.stopWin) why = `Автоигра остановлена: выигрыш ×${Math.round(win / bet)}`;
        else if (st.cfg.stopLoss && Casino.balance <= st.startBal * (1 - st.cfg.stopLoss)) why = 'Автоигра остановлена: достигнут лимит потерь';
        if (why) { st.on = false; label(); stop(); toast(why); return false; }
        label(); return true;
      },
    };
  }
  // ---- Полоса прогресса бонуса. anchor — элемент, рядом с которым она появляется
  // set(v, max, html, ticks) — ticks: [{ at, label }] — отметки уровней на полосе
  function progress(anchor, { cls = '', where = 'afterend' } = {}) {
    const el = document.createElement('div'); el.className = 'pbar ' + cls; el.style.display = 'none';
    el.innerHTML = '<div class="pbfill"></div><div class="pbmarks"></div><span class="pbtext"></span>';
    anchor.insertAdjacentElement(where, el);
    const [fill, marks, text] = el.children;
    let last = -1;
    return {
      el,
      set(v, max, html, ticks = []) {
        el.style.display = '';
        const k = max > 0 ? Math.max(0, Math.min(1, v / max)) : 0;
        fill.style.width = (k * 100).toFixed(2) + '%'; el.classList.toggle('full', k >= 1);
        text.innerHTML = `<span>${html}</span>`;
        marks.innerHTML = ticks.map(t => `<i class="${v >= t.at ? 'on' : ''}" style="left:${t.at / max * 100}%"><b>${t.label}</b></i>`).join('');
        if (last >= 0 && v > last) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
        last = v;
      },
      hide() { el.style.display = 'none'; last = -1; },
    };
  }
  // Прогресс фриспинов по счётчику «осталось»: сам считает сыгранные и докупленные вращения.
  // sync(left, active) — active=false (бонус закончился) прячет полосу и сбрасывает счёт
  function fsProgress(anchor, opts) {
    const bar = progress(anchor, { cls: 'pbfs', ...opts }); let done = 0, total = 0, prev = 0;
    const draw = () => bar.set(done, total, `Фриспин <b>${Math.min(done, total)}</b> из <b>${total}</b>`, []);
    return {
      el: bar.el,
      sync(left, active = true) {
        if (!active) { done = total = prev = 0; bar.hide(); return; }
        if (left > prev) total += left - prev; else done += prev - left;
        prev = left; if (total) draw();
      },
      show(n, totalNow) { done = n; total = totalNow; prev = totalNow - n; draw(); },
      hide() { done = total = prev = 0; bar.hide(); },
    };
  }
  return { create, payTable, COLORS, auto, toast, progress, fsProgress };
})();
