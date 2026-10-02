// Каталог игр: карточки с поиском, категориями и «недавними»
(() => {
  const { $, titles, openTab } = Casino;
  const CATS = { slots: '🎰 Слоты', table: '🃏 Настольные', duel: '♟️ Игры на двоих', fast: '🚀 Быстрые игры' };
  // id совпадает с id секции игры
  const GAMES = [
    { id: 'slots', cat: 'slots', art: ['fruit', '7'], icon: '🍒', title: 'Фруктовый слот', desc: '5×3, 10 линий, дикий, фриспины, бонус «Сундуки» и риск-игра', tags: ['10 линий', 'бонус'], c: ['#c62828', '#f9a825'] },
    { id: 'olympus', cat: 'slots', art: ['olympus', 'scatter'], icon: '⚡', title: 'Олимп', desc: 'Платит везде, тумбл, шары множителей до ×500, ante и покупка бонуса', tags: ['8+ платит', '×500'], c: ['#283593', '#7c4dff'] },
    { id: 'sweet', cat: 'slots', art: ['sweet', 'lolly'], icon: '🍬', title: 'Sweet', desc: 'Сладкий тумбл, бомбы-множители во фриспинах, ante и покупка бонуса', tags: ['8+ платит', 'бомбы'], c: ['#ec407a', '#7e57c2'] },
    { id: 'egypt', cat: 'slots', art: ['egypt', 'B'], icon: '📖', title: 'Египет', desc: 'Книга — дикий и скаттер, расширяющийся символ во фриспинах', tags: ['10 линий', 'расширение'], c: ['#8d5a1b', '#e0a800'] },
    { id: 'bigbass', cat: 'slots', art: ['bass', 'W'], icon: '🎣', title: 'Big Bass', desc: 'Рыбак собирает денежных рыб, во фриспинах растут уровни', tags: ['10 линий', 'рыбалка'], c: ['#0277bd', '#26c6da'] },
    { id: 'doghouse', cat: 'slots', art: ['dog', 'W'], icon: '🐕', title: 'Dog House', desc: 'До 117 649 способов, тумбл и липкие дикие с множителями', tags: ['Megaways', 'тумбл'], c: ['#558b2f', '#ef6c00'] },
    { id: 'holdwin', cat: 'slots', art: ['west', 'W'], icon: '🤠', title: 'Hold & Win', desc: 'Дикий Запад: 6+ монет — респины с фиксацией и джекпоты до GRAND ×1000', tags: ['джекпоты', 'респины'], c: ['#6d3b12', '#e0a526'] },
    { id: 'avalanche', cat: 'slots', art: ['stone', 'gold'], icon: '🗿', title: 'Эльдорадо', desc: 'Лавины каменных масок и растущий множитель ×1→×5, во Free Falls до ×15', tags: ['лавина', '×15'], c: ['#1b5e20', '#8d6e63'] },
    { id: 'legacy', cat: 'slots', art: ['legacy', 'N'], icon: '📜', title: 'Наследие', desc: 'Книга-скаттер, а каждый ретриггер добавляет ещё один расширяющийся символ', tags: ['10 линий', 'расширение'], c: ['#1a1446', '#c9962a'] },
    { id: 'samurai', cat: 'slots', art: ['samurai', 'helm'], icon: '⚔️', title: 'Самураи Megaways', desc: 'До 117 649 способов, лавины и множитель фриспинов, растущий без сброса', tags: ['Megaways', '∞ множитель'], c: ['#1a0a12', '#b71c1c'] },
    { id: 'cluster', cat: 'slots', art: ['alien', 'green'], icon: '👽', title: 'Космо-кластер', desc: 'Поле 7×7: кластеры пришельцев, лавины и шкала заряда с метеором', tags: ['кластеры', 'лавины'], c: ['#1a237e', '#00bfa5'] },
    { id: 'chicago', cat: 'slots', art: ['mob', 'W'], icon: '🎩', title: 'Чикаго 1930', desc: 'Ходячие дикие: каждый спин шаг влево и бесплатный респин', tags: ['ходячие дикие', 'респины'], c: ['#212121', '#b71c1c'] },
    { id: 'pirates', cat: 'slots', art: ['pirate', 'X'], icon: '🏴‍☠️', title: 'Пиратское золото', desc: 'Бочки «?» раскрываются в один и тот же символ — иногда в диких', tags: ['мистери', '10 линий'], c: ['#01579b', '#6d4c41'] },
    { id: 'dragons', cat: 'slots', art: ['dragon', 'R'], icon: '🐉', title: 'Драконьи сокровища', desc: 'Колоссальные символы 2×2 и 3×3, до 1024 способов', tags: ['колоссы', '1024 способа'], c: ['#b71c1c', '#ff8f00'] },
    { id: 'circus', cat: 'slots', art: ['circus', 'C'], icon: '🎪', title: 'Цирк удачи', desc: 'Три билета — колесо бонусов: призы до ×100, фриспины или сундуки', tags: ['колесо', 'бонус-игры'], c: ['#c62828', '#fdd835'] },
    { id: 'diamonds', cat: 'slots', art: ['diamonds', 'W'], icon: '💎', title: 'Двойные бриллианты', desc: 'Разделённые символы считаются за 2 и 3 — способов больше', tags: ['243 способа', 'двойные'], c: ['#0277bd', '#7b1fa2'] },
    { id: 'roulette', cat: 'table', icon: '🎡', title: 'Рулетка', desc: 'Европейская рулетка: числа, дюжины, красное/чёрное и другое', tags: ['1 ноль', '35:1'], c: ['#1b5e20', '#b71c1c'] },
    { id: 'blackjack', cat: 'table', icon: '🃏', title: 'Блэкджек', desc: 'Взять, стоп, удвоить. Блэкджек платит 3:2', tags: ['3:2', '21'], c: ['#004d40', '#26a69a'] },
    { id: 'baccarat', cat: 'table', icon: '🎴', title: 'Баккара', desc: 'Игрок, Банкир или Ничья с классическими правилами третьей карты', tags: ['8 колод'], c: ['#4a148c', '#ad1457'] },
    { id: 'durak', cat: 'duel', icon: '🃏', title: 'Дурак онлайн', desc: 'Подкидной и переводной: с ботами или с друзьями по ссылке, ставки на баланс', tags: ['мультиплеер', '36 карт'], c: ['#0d47a1', '#b71c1c'] },
    { id: 'hilo', cat: 'table', icon: '🂡', title: 'Hi-Lo', desc: 'Выше или ниже? Каждый верный ответ умножает выигрыш — забирайте вовремя', tags: ['цепочка', 'RTP 97%'], c: ['#283593', '#00897b'] },
    { id: 'sicbo', cat: 'table', icon: '🎲', title: 'Кости (Sic Bo)', desc: 'Три кубика: малое/большое, числа, суммы и тройки до 150:1', tags: ['3 кубика', '150:1'], c: ['#b71c1c', '#ff7043'] },
    { id: 'chess', cat: 'duel', icon: '♞', title: 'Шахматы', desc: 'Классические шахматы: бот трёх уровней или друг онлайн по коду комнаты', tags: ['онлайн', '3 уровня бота'], c: ['#5d4037', '#a1887f'] },
    { id: 'nardy', cat: 'duel', icon: '🎲', title: 'Нарды', desc: 'Длинные и короткие нарды против бота или друга онлайн, марс и кокс', tags: ['онлайн', '2 варианта'], c: ['#6d4c41', '#c62828'] },
    { id: 'sea', cat: 'duel', icon: '🚢', title: 'Морской бой', desc: 'Расставьте флот и топите корабли соперника — бот или друг онлайн', tags: ['онлайн', '10×10'], c: ['#01579b', '#26c6da'] },
    { id: 'crash', cat: 'fast', icon: '🚀', title: 'Ракета', desc: 'Множитель растёт — успейте забрать выигрыш до взрыва. Авто-вывод', tags: ['RTP 96%', 'авто-вывод'], c: ['#0d47a1', '#00bcd4'] },
    { id: 'plinko', cat: 'fast', icon: '🔻', title: 'Плинко', desc: '8/12/16 рядов и три уровня риска, множители до ×100+', tags: ['3 риска'], c: ['#311b92', '#00acc1'] },
    { id: 'mines', cat: 'fast', icon: '💣', title: 'Мины', desc: 'Открывайте безопасные клетки 5×5 и вовремя забирайте выигрыш', tags: ['1–24 мины', 'RTP 97%'], c: ['#37474f', '#43a047'] },
    { id: 'fortune', cat: 'fast', icon: '🎯', title: 'Колесо фортуны', desc: 'Крутите колесо и получите множитель ставки до ×19. Три уровня риска', tags: ['×19', '3 риска'], c: ['#f9a825', '#e91e63'] },
    { id: 'scratch', cat: 'fast', icon: '🎟️', title: 'Скретч-карты', desc: 'Сотрите слой и найдите три одинаковые суммы — до ×1000 цены билета', tags: ['до ×1000', 'мгновенно'], c: ['#b8860b', '#6a1b9a'] },
    { id: 'dice', cat: 'fast', icon: '🎲', title: 'Кубики', desc: 'Выберите порог и «больше/меньше»: шанс от 2% до 98%, RTP 98%', tags: ['RTP 98%', 'авто'], c: ['#00897b', '#3949ab'] },
  ];
  GAMES.forEach(g => titles[g.id] = g.icon + ' ' + g.title);
  let cat = 'all', q = '';

  function card(g) {
    const b = document.createElement('button'); b.className = 'gcard'; b.dataset.id = g.id;
    b.style.setProperty('--c1', g.c[0]); b.style.setProperty('--c2', g.c[1]);
    b.innerHTML = `<span class="gicon">${(g.art && Art.html(...g.art)) || g.icon}</span><span class="gtitle">${g.title}</span><span class="gdesc">${g.desc}</span>` +
      `<span class="gtags">${g.tags.map(t => `<i>${t}</i>`).join('')}</span><span class="gplay">Играть ▸</span>`;
    b.onclick = () => openTab(g.id); return b;
  }
  const match = g => (cat === 'all' || g.cat === cat) && (!q || (g.title + ' ' + g.desc + ' ' + g.tags.join(' ')).toLowerCase().includes(q));
  function render() {
    const list = $('catList'); list.replaceChildren();
    let shown = 0;
    for (const [key, name] of Object.entries(CATS)) {
      const items = GAMES.filter(g => g.cat === key && match(g)); if (!items.length) continue;
      shown += items.length;
      const h = document.createElement('h2'); h.className = 'cathead'; h.textContent = `${name} · ${items.length}`;
      const grid = document.createElement('div'); grid.className = 'cgrid'; items.forEach((g, i) => { const c = card(g); c.style.setProperty('--i', i * 0.04 + 's'); grid.appendChild(c); });
      list.append(h, grid);
    }
    if (!shown) list.innerHTML = '<div class="catempty">Ничего не найдено 🤷</div>';
    // недавние
    let rec = []; try { rec = JSON.parse(localStorage.getItem('casinoRecent') || '[]'); } catch (e) {}
    const recent = rec.map(id => GAMES.find(g => g.id === id)).filter(Boolean);
    const box = $('catRecent'); box.replaceChildren();
    if (recent.length && !q && cat === 'all') {
      const h = document.createElement('h2'); h.className = 'cathead'; h.textContent = '🕘 Недавние';
      const grid = document.createElement('div'); grid.className = 'cgrid recent'; recent.forEach(g => grid.appendChild(card(g))); box.append(h, grid);
    }
  }
  const chips = $('catChips');
  [['all', 'Все · ' + GAMES.length], ...Object.entries(CATS).map(([k, v]) => [k, `${v} · ${GAMES.filter(g => g.cat === k).length}`])].forEach(([k, label]) => {
    const b = document.createElement('button'); b.className = 'chipbtn' + (k === 'all' ? ' on' : ''); b.textContent = label;
    b.onclick = () => { cat = k; chips.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); render(); };
    chips.appendChild(b);
  });
  $('catSearch').oninput = e => { q = e.target.value.trim().toLowerCase(); render(); };
  document.addEventListener('casino:tab', e => { if (e.detail === 'catalog') render(); });   // обновляем «Недавние»
  render();
  const h = location.hash.slice(1); if (h && GAMES.some(g => g.id === h)) openTab(h);          // ссылка вида …/#crash
})();
