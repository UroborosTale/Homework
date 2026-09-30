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
  return { create, payTable, COLORS };
})();
