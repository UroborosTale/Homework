// Общие механики слотов: выбор фриспинов, меню покупки бонуса (обычный и супер), интрига на барабанах,
// прогрессивный джекпот на все слоты.
const SlotFX = (() => {
  const { fmt } = Casino;
  const plural = n => (n % 10 === 1 && n % 100 !== 11) ? 'фриспин' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? 'фриспина' : 'фриспинов';

  // ---------- модальное окно с карточками ----------
  function modal(id) {
    let m = document.getElementById(id);
    if (!m) { m = document.createElement('div'); m.id = id; m.className = 'modal fxmodal'; m.innerHTML = '<div class="mbox"></div>'; document.body.appendChild(m); }
    return m;
  }

  // ---------- 1. Выбор фриспинов ----------
  // options: [{ spins, g, label }] — g умножает все выигрыши во фриспинах; def — вариант по умолчанию.
  // В автоигре (или если игрок не выбрал за 20 с) выбирается вариант по умолчанию.
  function chooseFs({ title = 'Выберите фриспины', options, def = 0, auto = false, note = '' }) {
    const m = modal('fsChoice'), box = m.firstChild;
    return new Promise(resolve => {
      let left = auto ? 3 : 20, timer = 0, done = false;
      box.innerHTML = `<h3>🎁 ${title}</h3>${note ? `<p class="fxnote">${note}</p>` : ''}<div class="fscards">${options.map((o, i) => `
        <button class="fscard${i === def ? ' def' : ''}" data-i="${i}">
          <b class="fsn">${o.spins}</b><span>${plural(o.spins)}</span><i class="fsx${String(o.label || '').length > 9 ? ' long' : ''}">${o.label || '×' + o.g}</i>
          <small>${o.hint || ['спокойнее', 'баланс', 'рискованнее', 'максимальный риск'][Math.min(i, 3)]}</small>
          <span class="fsvol">${'⚡'.repeat(i + 1)}</span></button>`).join('')}</div>
        <div class="fxtimer">Автовыбор через <b>${left}</b> с</div>`;
      const finish = i => { if (done) return; done = true; clearInterval(timer); m.classList.remove('show'); resolve(options[i]); };
      box.onclick = e => { const c = e.target.closest('.fscard'); if (c) finish(+c.dataset.i); };
      timer = setInterval(() => { left--; const b = box.querySelector('.fxtimer b'); if (b) b.textContent = left; if (left <= 0) finish(def); }, 1000);
      m.classList.add('show');
    });
  }

  // Варианты от базового числа спинов n: table — [[доля спинов, множитель g]]; вариант [1, 1] — по умолчанию
  function fsChoice(n, table, { auto = false, show, title, note } = {}) {
    const options = table.map(([k, g]) => ({ spins: Math.max(1, Math.round(n * k)), g, label: show ? show(g) : `выигрыши ×${g}` }));
    const def = Math.max(0, table.findIndex(([k, g]) => k === 1 && g === 1));
    return chooseFs({ title: title || `Бонус: выберите фриспины`, options, def, auto, note: note || 'Меньше вращений — больше множитель. Средний выигрыш у всех вариантов одинаковый.' });
  }

  // ---------- 2. Меню покупки бонуса ----------
  // items: [{ key, name, desc, cost }] — cost в «ставках» (умножается на bet()); onBuy(key, price)
  function buyMenu(btn, { bet, items, onBuy, busy = () => false, label = 'Купить бонус' }) {
    const paint = () => { btn.textContent = `🛒 ${label} от ${fmt(Math.min(...items.map(i => i.cost)) * bet())} ₽`; };
    btn.onclick = () => {
      if (busy()) return;
      const m = modal('buyMenu'), box = m.firstChild, b = bet();
      box.innerHTML = `<h3>🛒 Покупка бонуса</h3><p class="fxnote">Ставка ${fmt(b)} ₽ — бонус начнётся сразу</p><div class="buycards">${items.map(it => `
        <div class="buycard ${it.key}"><div class="bcname">${it.name}</div><div class="bcdesc">${it.desc}</div>
        <div class="bcprice">${fmt(it.cost * b)} ₽ <small>×${it.cost}</small></div>
        <button class="btn primary" data-k="${it.key}"${it.cost * b > Casino.balance ? ' disabled' : ''}>${it.cost * b > Casino.balance ? 'Не хватает средств' : 'Купить'}</button></div>`).join('')}</div>
        <div class="mbtns"><button class="btn" data-k="">Отмена</button></div>`;
      box.onclick = e => {
        const k = e.target.dataset && e.target.dataset.k; if (k === undefined) return;
        m.classList.remove('show'); if (!k || busy()) return;
        const it = items.find(x => x.key === k), price = it.cost * bet();
        if (price > Casino.balance) return SlotUI.toast('Недостаточно средств');
        onBuy(k, price);
      };
      m.onclick = e => { if (e.target === m) m.classList.remove('show'); };
      m.classList.add('show');
    };
    paint();
    return { paint };
  }

  // ---------- 3. Интрига ----------
  // Для барабанов слева направо: если на остановившихся барабанах уже at+ скаттеров,
  // следующие барабаны крутятся дольше. Возвращает дополнительную задержку (мс) для каждого барабана и первый «томящий» барабан.
  function tease(cols, isScat, at, canHold = () => true) {
    const extra = cols.map(() => 0); let from = -1, seen = 0, add = 0;
    if (Anim.reduce()) return { extra, from };
    cols.forEach((col, r) => {
      if (seen >= at && canHold(r)) { add += 1250; extra[r] = add; if (from < 0) from = r; }
      seen += col.filter(isScat).length;
    });
    return { extra, from };
  }
  // Прокрутка барабанов 5×3 с интригой. o: { cols (DOM .rcol), grid, fill, rand, put, tease: { is, at, canHold } }
  function spinReels({ cols, grid, fill, rand, put, tease: t }) {
    const T = t ? tease(grid, t.is, t.at, t.canHold) : { extra: grid.map(() => 0), from: -1 };
    const sec = cols[0].closest('section'), sp = sec && sec.classList.contains('turbo') ? .45 : 1;
    const timers = [];
    if (T.from >= 0) {
      const r0 = T.from - 1, startAt = ((r0 * 90) + 900 + r0 * 260 + T.extra[r0]) * sp;   // когда остановился барабан перед интригой
      timers.push(setTimeout(() => sec.classList.add('teasing'), startAt));
      cols.forEach((col, r) => { if (T.extra[r]) timers.push(setTimeout(() => col.classList.add('tease'), startAt)); });
    }
    return Promise.all(cols.map((col, r) => Anim.reelSpin(col, {
      count: 10 + r * 4 + Math.round(T.extra[r] / 70), ms: 900 + r * 260 + T.extra[r], delay: r * 90, final: grid[r], rand, fill,
      commit: () => grid[r].forEach((it, w) => put(r, w, it)),
    }).then(() => {
      if (col.classList.contains('tease')) { col.classList.remove('tease'); if (t && grid[r].some(t.is)) { col.classList.add('teasehit'); setTimeout(() => col.classList.remove('teasehit'), 900); } }
    }))).then(() => { timers.forEach(clearTimeout); if (sec) sec.classList.remove('teasing'); cols.forEach(c => c.classList.remove('tease')); });
  }
  // Для тумбл-слотов (падение колонками): доп. задержка падения колонки в секундах и класс подсветки
  function teaseDrop(colEls, grid, isScat, at, turbo, canHold) {
    const T = tease(grid, isScat, at, canHold), k = turbo ? 1 / 3 : 1, sec = colEls[0] && colEls[0].closest('section');
    const extraS = T.extra.map(ms => ms / 1000);
    if (T.from >= 0) {
      if (sec) sec.classList.add('teasing');
      colEls.forEach((el, c) => { if (T.extra[c]) el.classList.add('tease'); });
      colEls.forEach((el, c) => { if (T.extra[c]) setTimeout(() => { el.classList.remove('tease'); if (grid[c].some(isScat)) { el.classList.add('teasehit'); setTimeout(() => el.classList.remove('teasehit'), 900); } }, (T.extra[c] + 500) * k); });
      setTimeout(() => sec && sec.classList.remove('teasing'), (Math.max(...T.extra) + 600) * k);
    }
    return { extraS, waitMs: Math.max(0, ...T.extra) * k };
  }

  // ---------- 4. Прогрессивный джекпот ----------
  // Общий на все слоты: 1% каждой ставки идёт в фонд. Шанс сорвать — пропорционален ставке.
  const JP_KEY = 'casinoJackpot', SEED = 50000, RATE = 0.01, CHANCE = 2e-7;
  let jp = { pool: SEED, last: 0, lastAt: 0, wins: 0 };
  try { Object.assign(jp, JSON.parse(localStorage.getItem(JP_KEY) || '{}')); } catch (e) {}
  const save = () => { try { localStorage.setItem(JP_KEY, JSON.stringify(jp)); } catch (e) {} };
  const money = v => fmt(Math.floor(v));
  function paintJp(ms = 900) {
    document.querySelectorAll('.jpval').forEach(el => Anim.countTo(el, Math.floor(jp.pool), ms, v => money(v)));
    const l = document.getElementById('jpLast'); if (l) l.textContent = jp.last ? `Последний джекпот: ${money(jp.last)} ₽` : 'Джекпот ещё никто не сорвал';
  }
  function bet(amount) {
    if (!(amount > 0)) return;
    jp.pool += amount * RATE;
    const hit = Math.random() < Math.min(0.02, amount * CHANCE);
    if (hit) { const won = Math.floor(jp.pool); jp.last = won; jp.lastAt = Date.now(); jp.wins++; jp.pool = SEED; save(); setTimeout(() => jackpotWin(won), 2600); }
    save(); paintJp(600);
    document.querySelectorAll('.jpbox').forEach(el => { el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); });
  }
  function jackpotWin(won) {
    Casino.setBalance(Casino.balance + won);
    let o = document.getElementById('jpWin');
    if (!o) { o = document.createElement('div'); o.id = 'jpWin'; document.body.appendChild(o); o.onclick = () => o.classList.remove('show'); }
    o.innerHTML = `<div class="jpwbox"><div class="jpwt">💎 ДЖЕКПОТ! 💎</div><div class="jpwa"><span>0</span> ₽</div><small>Прогрессивный джекпот ваш! Нажмите, чтобы закрыть</small></div>`;
    o.classList.add('show'); Anim.countTo(o.querySelector('.jpwa span'), won, 2500, v => money(v));
    coinRain(o);
    paintJp(1500);
    setTimeout(() => o.classList.remove('show'), 9000);
  }
  function coinRain(host) {                                  // золотые монеты падают за надписью джекпота
    host.querySelectorAll('.jpcoin').forEach(e => e.remove());
    if (Anim.reduce()) return;
    for (let i = 0; i < 40; i++) {
      const c = document.createElement('i'); c.className = 'jpcoin';
      c.style.cssText = `left:${Math.random() * 100}%;animation-delay:${Math.random() * 2.5}s;animation-duration:${2 + Math.random() * 2}s;font-size:${18 + Math.random() * 22}px`;
      c.textContent = Math.random() < .25 ? '💎' : '🪙'; host.appendChild(c);
    }
  }
  // виджеты: в шапке и баннер в каталоге
  function mount() {
    const bal = document.querySelector('header .balance');
    if (bal && !document.querySelector('header .jpbox')) bal.insertAdjacentHTML('beforebegin', '<div class="jpbox" title="Прогрессивный джекпот — общий на все слоты">💎 <span class="jpval">0</span> ₽</div>');
    const cat = document.getElementById('catRecent');
    if (cat && !document.getElementById('catJackpot')) cat.insertAdjacentHTML('beforebegin', `<div class="jpbanner" id="catJackpot">
      <div class="jpbt">💎 ПРОГРЕССИВНЫЙ ДЖЕКПОТ 💎</div><div class="jpba"><span class="jpval">0</span> ₽</div>
      <div class="jpbs">Растёт с каждой ставки во всех 10 слотах. Шанс сорвать — с любого спина, чем больше ставка, тем выше шанс.</div><div class="jpbl" id="jpLast"></div></div>`);
    document.querySelectorAll('.jpval').forEach(el => el.textContent = money(jp.pool));
    paintJp(0);
  }
  mount();
  return { chooseFs, fsChoice, buyMenu, tease, spinReels, teaseDrop, jackpot: { bet, get pool() { return jp.pool; }, win: jackpotWin, SEED, RATE, CHANCE } };
})();
