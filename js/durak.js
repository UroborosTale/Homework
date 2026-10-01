// Дурак: лобби, онлайн-комнаты (хост ведёт партию и ботов), стол, ставки виртуальным балансом
(() => {
  const { $, sleep, msg, fmt, setBalance, cardEl } = Casino;
  const E = DurakEngine;
  const MAX_NAME = 14;
  const randomName = () => ['Игрок', 'Лис', 'Тигр', 'Сокол', 'Волк', 'Кот', 'Ёж'][Math.floor(Math.random() * 7)] + Math.floor(10 + Math.random() * 89);
  const clean = s => String(s || '').replace(/[<>&"]/g, '').trim().slice(0, MAX_NAME) || 'Игрок';
  let myName = ''; try { myName = localStorage.getItem('durakName') || ''; } catch (e) {}
  $('dkName').value = myName || randomName();

  // ---------------- состояние ----------------
  let role = 'none';            // none | host | client
  let net = null, code = '';
  let cfg = { mode: 'podkidnoy', seats: 4, stake: 1000 };
  let seats = [];               // хост: [{ name, kind: 'host'|'human'|'bot', id }]
  let st = null;                // хост: полное состояние партии
  let V = null, me = -1;        // вид партии для меня и мой номер места
  let gameId = 0, paidGame = 0, settledGame = 0, botTimer = 0, sel = null;
  const isHost = () => role === 'host';

  // ---------------- экраны ----------------
  function screen(name) { ['dkLobby', 'dkRoom', 'dkGame'].forEach(id => $(id).style.display = id === name ? '' : 'none'); }
  const note = (t, cls) => msg($('dkNote'), t, cls);

  // ---------------- лобби ----------------
  function readCfg() {
    cfg = { mode: $('dkMode').value, seats: +$('dkSeats').value, stake: Math.max(0, Math.floor(+$('dkStake').value) || 0) };
    myName = clean($('dkName').value); try { localStorage.setItem('durakName', myName); } catch (e) {}
  }
  $('dkSolo').onclick = () => {
    readCfg(); if (cfg.stake > Casino.balance) return note('Недостаточно средств для ставки', 'lose');
    role = 'host'; net = null; code = '';
    seats = [{ name: myName, kind: 'host' }]; while (seats.length < cfg.seats) seats.push({ name: botName(), kind: 'bot' });
    startGame();
  };
  $('dkCreate').onclick = async () => {
    readCfg(); if (cfg.stake > Casino.balance) return note('Недостаточно средств для ставки', 'lose');
    note('Создаю комнату…'); $('dkCreate').disabled = true;
    try {
      for (let tries = 0; tries < 3; tries++) {
        code = DurakNet.newCode();
        try { net = await DurakNet.host(code, { onJoin, onData: onHostData, onLeave }); break; } catch (e) { if (tries === 2) throw e; }
      }
      role = 'host'; seats = [{ name: myName, kind: 'host' }];
      showRoom(); note('');
    } catch (e) { note(e.message || 'Не удалось создать комнату', 'lose'); }
    $('dkCreate').disabled = false;
  };
  $('dkJoin').onclick = () => joinRoom(($('dkCode').value || '').toUpperCase().trim());
  async function joinRoom(c) {
    readCfg(); if (!/^[A-Z0-9]{5}$/.test(c)) return note('Введите код из 5 символов', 'lose');
    note('Подключаюсь…'); $('dkJoin').disabled = true;
    try {
      net = await DurakNet.join(c, { onData: onClientData, onClose: onHostGone }, stage => note(stage));
      role = 'client'; code = c; net.send({ t: 'hello', name: myName }); note('');
      SlotUI.toast(net.kind === 'peer' ? 'Подключено напрямую' : net.kind === 'relay' ? 'Подключено через ретранслятор' : 'Подключено (вкладки этого браузера)');
      $('dkRoomCode').textContent = code; screen('dkRoom'); $('dkRoomInfo').textContent = 'Ждём, когда хозяин начнёт игру…';
    } catch (e) { note(e.message || 'Не удалось подключиться', 'lose'); }
    $('dkJoin').disabled = false;
  }
  const BOT_NAMES = ['Бот Иван', 'Бот Маша', 'Бот Пётр', 'Бот Оля', 'Бот Гоша', 'Бот Нина'];
  const botName = () => { const used = seats.map(s => s.name); return BOT_NAMES.find(n => !used.includes(n)) || 'Бот'; };

  function roomLink() { const u = new URL(location.href); u.hash = 'durak'; u.searchParams.set('room', code); return u.toString(); }
  function showRoom() {
    screen('dkRoom'); $('dkRoomCode').textContent = code || '—';
    $('dkRoomList').innerHTML = seats.map((s, i) => `<li class="${s.kind}">${i + 1}. ${s.kind === 'bot' ? '🤖' : '👤'} ${s.name}${s.kind === 'host' ? ' (хозяин)' : ''}${isHost() && s.kind === 'bot' ? ` <button class="btn dkkick" data-i="${i}">✕</button>` : ''}</li>`).join('') +
      Array.from({ length: Math.max(0, cfg.seats - seats.length) }, () => '<li class="empty">— свободное место —</li>').join('');
    const host = isHost();
    $('dkAddBot').style.display = $('dkStart').style.display = host ? '' : 'none';
    $('dkAddBot').disabled = seats.length >= cfg.seats; $('dkStart').disabled = seats.length < 2;
    $('dkRoomInfo').textContent = host ? `${modeName(cfg.mode)} · ставка ${cfg.stake} ₽ · мест ${cfg.seats}. Отправьте друзьям код или ссылку.` : `${modeName(cfg.mode)} · ставка ${cfg.stake} ₽ · ждём, когда хозяин начнёт игру…`;
    const k = net && net.kinds;
    $('dkNetKind').textContent = !net ? '' : net.kind === 'local' ? '⚠️ Онлайн-сервисы недоступны: комната работает только между вкладками этого браузера. Проверьте интернет или попробуйте другую сеть/VPN.'
      : k && !k.includes('peer') ? 'ℹ️ Прямое соединение недоступно — игра пойдёт через ретранслятор (это нормально)' : k && !k.includes('relay') ? 'ℹ️ Ретранслятор недоступен — только прямое соединение' : '';
  }
  const modeName = m => m === 'perevodnoy' ? 'Переводной' : 'Подкидной';
  $('dkRoomList').onclick = e => { const b = e.target.closest('.dkkick'); if (!b || !isHost()) return; seats.splice(+b.dataset.i, 1); lobbyChanged(); };
  $('dkAddBot').onclick = () => { if (seats.length < cfg.seats) { seats.push({ name: botName(), kind: 'bot' }); lobbyChanged(); } };
  $('dkCopy').onclick = async () => { try { await navigator.clipboard.writeText(roomLink()); SlotUI.toast('Ссылка скопирована'); } catch (e) { prompt('Скопируйте ссылку:', roomLink()); } };
  $('dkLeave').onclick = () => leave();
  $('dkStart').onclick = () => { if (isHost() && seats.length >= 2) startGame(); };
  function lobbyChanged() { showRoom(); seats.forEach((s, i) => s.kind === 'human' && net.send(s.id, { t: 'lobby', seats: pubSeats(), cfg, you: i })); }
  const pubSeats = () => seats.map(s => ({ name: s.name, kind: s.kind }));

  // ---------------- хост: сеть ----------------
  function onJoin(id) { /* ждём hello с именем */ }
  function onHostData(id, m) {
    if (!m || typeof m !== 'object') return;
    if (m.t === 'hello') {
      if (seats.some(s => s.id === id)) return;                // повторное приветствие
      if (st && st.phase === 'play') return net.send(id, { t: 'err', msg: 'Партия уже идёт — подождите следующей' });
      if (seats.length >= cfg.seats) { const b = seats.findIndex(s => s.kind === 'bot'); if (b < 0) return net.send(id, { t: 'err', msg: 'Мест нет' }); seats.splice(b, 1); }
      seats.push({ name: clean(m.name), kind: 'human', id }); lobbyChanged();
    } else if (m.t === 'act') {
      const i = seats.findIndex(s => s.id === id); if (i < 0 || !st) return;
      const r = E.act(st, i, m.a); if (!r.ok) net.send(id, { t: 'err', msg: r.err }); else changed();
    }
  }
  function onLeave(id) {
    const i = seats.findIndex(s => s.id === id); if (i < 0) return;
    if (st && st.phase === 'play') { seats[i] = { name: seats[i].name + ' (бот)', kind: 'bot' }; SlotUI.toast(`${seats[i].name.replace(' (бот)', '')} вышел — его заменил бот`); changed(); }
    else { seats.splice(i, 1); lobbyChanged(); }
  }

  // ---------------- клиент: сеть ----------------
  function onClientData(m) {
    if (!m || typeof m !== 'object') return;
    if (m.t === 'lobby') { cfg = m.cfg; seats = m.seats; me = m.you; if (!V || V.phase !== 'play') showRoom(); }
    else if (m.t === 'view') { cfg = m.cfg; seats = m.seats; gameId = m.gameId; applyView(m.v); }
    else if (m.t === 'err') SlotUI.toast(m.msg);
  }
  function onHostGone() {
    if (role !== 'client') return;
    if (V && V.phase === 'play' && paidGame === gameId && settledGame !== gameId) { settledGame = gameId; setBalance(Casino.balance + cfg.stake); }
    SlotUI.toast('Хозяин комнаты отключился'); reset(); note('Хозяин комнаты отключился. Ставка возвращена.', 'lose');
  }

  // ---------------- партия ----------------
  function startGame() {
    clearTimeout(botTimer); gameId++;
    st = E.newGame(seats.map(s => s.name), cfg.mode);
    changed();
  }
  function changed() {                                      // хост: разослать виды, обновить себя, запустить ботов
    if (!st) return;
    seats.forEach((s, i) => { if (s.kind === 'human' && net) net.send(s.id, { t: 'view', v: E.view(st, i), cfg, seats: pubSeats(), gameId }); });
    me = 0; applyView(E.view(st, 0));
    scheduleBots();
  }
  function scheduleBots() {
    clearTimeout(botTimer);
    if (!st || st.phase !== 'play') return;
    const order = [st.defender, st.attacker, ...seats.map((_, i) => i)];
    if (!order.some(i => seats[i] && seats[i].kind === 'bot' && E.botMove(st, i))) return;
    botTimer = setTimeout(() => {
      if (!st || st.phase !== 'play') return;
      for (const i of [st.defender, st.attacker, ...seats.map((_, k) => k)]) {
        if (!seats[i] || seats[i].kind !== 'bot') continue;
        const m = E.botMove(st, i); if (m && E.act(st, i, m).ok) break;
      }
      changed();
    }, 650 + Math.random() * 450);
  }
  function send(a) {                                        // мой ход
    if (isHost()) { const r = E.act(st, 0, a); if (!r.ok) SlotUI.toast(r.err); else changed(); }
    else if (net) net.send({ t: 'act', a });
  }

  // ---------------- отрисовка ----------------
  let prevHand = new Set(), prevTable = 0, prevDef = new Set();
  const key = c => c.r + c.s;
  function applyView(v) {
    const first = !V || V.round > v.round || gameId !== (V && V._g);
    V = v; V._g = gameId; me = v.me; sel = null;
    if (v.phase === 'play' && paidGame !== gameId) { paidGame = gameId; setBalance(Casino.balance - cfg.stake); }
    screen('dkGame'); render(first);
    if (v.phase === 'over') settle();
  }
  function sortHand(h) { const t = V.trumpSuit, so = s => (s === t ? 9 : E.SUITS.indexOf(s)); return h.slice().sort((a, b) => so(a.s) - so(b.s) || E.rv(a.r) - E.rv(b.r)); }
  function render(first) {
    const v = V, n = v.names.length;
    // соперники по кругу, начиная со следующего после меня
    $('dkOpps').innerHTML = Array.from({ length: n - 1 }, (_, k) => (me + 1 + k) % n).map(i => {
      const cnt = v.hands[i].length, role = v.out[i] ? 'вышел' : i === v.defender ? (v.taking ? 'берёт' : 'отбивается') : i === v.attacker ? 'ходит' : v.passed.includes(i) ? 'пас' : '';
      const fan = Array.from({ length: Math.min(cnt, 10) }, (_, j) => `<i style="--k:${j - Math.min(cnt, 10) / 2}"></i>`).join('');
      const bot = seats[i] && seats[i].kind === 'bot';
      return `<div class="dkopp ${i === v.defender ? 'def' : ''} ${i === v.attacker ? 'att' : ''} ${v.out[i] ? 'out' : ''}"><div class="dkfan">${fan}</div><div class="dkname">${bot ? '🤖' : '👤'} ${v.names[i]}</div><div class="dkcnt">${cnt} карт${role ? ' · <b>' + role + '</b>' : ''}</div></div>`;
    }).join('');
    // колода и козырь
    const tc = cardEl(v.trump); tc.classList.add('dktrump');
    $('dkDeck').replaceChildren(...(v.deckCount > 0 ? [tc] : []));
    if (v.deckCount > 1) { const back = cardEl(null, true); back.classList.add('dkpile'); $('dkDeck').appendChild(back); }
    $('dkDeckN').textContent = v.deckCount ? `${v.deckCount} в колоде` : `козырь ${v.trumpSuit}`;
    $('dkTrumpBadge').textContent = v.trumpSuit; $('dkTrumpBadge').className = 'dktb ' + ('♥♦'.includes(v.trumpSuit) ? 'red' : '');
    // стол
    const tbl = $('dkTable'); tbl.replaceChildren();
    v.table.forEach((p, i) => {
      const pair = document.createElement('div'); pair.className = 'dkpair'; pair.dataset.i = i;
      const a = cardEl(p.a); if (i >= prevTable) a.classList.add('dealt'); pair.appendChild(a);
      if (p.d) { const d = cardEl(p.d); d.classList.add('dkdef'); if (!prevDef.has(key(p.d))) d.classList.add('newdef'); pair.appendChild(d); }
      tbl.appendChild(pair);
    });
    prevTable = v.table.length; prevDef = new Set(v.table.filter(p => p.d).map(p => key(p.d)));
    if (!v.table.length) tbl.innerHTML = `<div class="dkempty">${v.phase === 'over' ? '' : v.attacker === me ? 'Ваш ход — выберите карту' : `Ходит ${v.names[v.attacker]}`}</div>`;
    // моя рука
    const hand = sortHand(v.hands[me] || []), now = new Set(hand.map(key));
    $('dkHand').style.setProperty('--n', hand.length);
    $('dkHand').replaceChildren(...hand.map((c, k) => {
      const el = cardEl(c); el.dataset.k = key(c); el.style.setProperty('--k', k - hand.length / 2);
      if (!first && !prevHand.has(key(c))) el.classList.add('dealt');
      if (canUse(c)) el.classList.add('play');
      return el;
    }));
    prevHand = now;
    // кнопки и подсказка
    const iDef = me === v.defender;
    $('dkPass').style.display = E.canPass(v, me) ? '' : 'none';
    $('dkPass').textContent = v.taking ? 'Хватит подкидывать' : 'Бито';
    $('dkTake').style.display = E.canTake(v, me) ? '' : 'none';
    $('dkTransfer').style.display = v.mode === 'perevodnoy' && iDef && hand.some(c => E.canTransfer(v, me, c)) ? '' : 'none';
    $('dkTransfer').disabled = !(sel && E.canTransfer(v, me, sel));
    $('dkLast').textContent = v.last || '';
    $('dkMode2').textContent = `${modeName(v.mode)} · ставка ${cfg.stake} ₽` + (code ? ` · комната ${code}` : '');
    let hint = '';
    if (v.phase === 'over') hint = '';
    else if (v.out[me]) hint = 'Вы вышли из игры — ждём окончания';
    else if (iDef) hint = v.taking ? 'Вы берёте карты' : v.table.some(p => !p.d) ? 'Отбивайтесь: выберите карту' + (v.mode === 'perevodnoy' ? ', переведите или возьмите' : ' или возьмите') : 'Ждём подкидывания…';
    else if (v.table.length === 0) hint = v.attacker === me ? 'Ваш ход' : '';
    else if (E.canPass(v, me)) hint = v.taking ? 'Можно подкинуть вдогонку или нажать «Хватит»' : 'Подкиньте карту или нажмите «Бито»';
    else if (v.hands[me].some(c => E.canAttack(v, me, c))) hint = 'Можно подкинуть';
    msg($('dkMsg'), hint, iDef && v.table.some(p => !p.d) && !v.taking ? 'win' : '');
    $('dkOver').style.display = v.phase === 'over' ? 'flex' : 'none';
  }
  function canUse(c) {
    const v = V; if (v.phase !== 'play') return false;
    if (me === v.defender) return v.table.some((p, i) => E.canDefend(v, me, i, c)) || E.canTransfer(v, me, c);
    return E.canAttack(v, me, c);
  }

  // ---------------- клики ----------------
  $('dkHand').onclick = e => {
    const el = e.target.closest('.card'); if (!el || !V || V.phase !== 'play') return;
    const c = (V.hands[me] || []).find(x => key(x) === el.dataset.k); if (!c) return;
    if (me === V.defender) {
      const targets = V.table.map((p, i) => E.canDefend(V, me, i, c) ? i : -1).filter(i => i >= 0), tr = E.canTransfer(V, me, c);
      if (targets.length === 1 && !tr) return send({ type: 'defend', i: targets[0], card: c });
      if (!targets.length && tr) return send({ type: 'transfer', card: c });
      if (!targets.length) return SlotUI.toast('Этой картой не побить');
      sel = c; document.querySelectorAll('#dkHand .card').forEach(x => x.classList.toggle('sel', x === el));
      document.querySelectorAll('#dkTable .dkpair').forEach(p => p.classList.toggle('target', targets.includes(+p.dataset.i)));
      $('dkTransfer').disabled = !tr;
      msg($('dkMsg'), tr ? 'Нажмите карту на столе, чтобы побить, или «Перевести»' : 'Нажмите карту на столе, которую бьёте', 'win');
    } else if (E.canAttack(V, me, c)) send({ type: 'attack', card: c });
    else SlotUI.toast(V.table.length ? 'Подкинуть можно только карту того же достоинства, что на столе' : 'Сейчас не ваш ход');
  };
  $('dkTable').onclick = e => {
    const p = e.target.closest('.dkpair'); if (!p || !sel || me !== V.defender) return;
    const i = +p.dataset.i; if (E.canDefend(V, me, i, sel)) send({ type: 'defend', i, card: sel });
  };
  $('dkPass').onclick = () => send({ type: 'pass' });
  $('dkTake').onclick = () => send({ type: 'take' });
  $('dkTransfer').onclick = () => { if (sel) send({ type: 'transfer', card: sel }); };

  // ---------------- конец партии и ставки ----------------
  function settle() {
    const v = V, n = v.names.length;
    if (settledGame !== gameId) {
      settledGame = gameId;
      let pay = 0;
      if (v.loser === null) pay = cfg.stake;                                   // ничья — ставка возвращается
      else if (v.loser !== me) pay = cfg.stake * n / (n - 1);                   // банк делят все, кроме дурака
      if (pay) setBalance(Casino.balance + pay);
      const res = v.loser === null ? 'Ничья — ставки возвращены' : v.loser === me ? `Вы — дурак 🃏 Проигрыш ${cfg.stake} ₽` : `Дурак — ${v.names[v.loser]}. Ваш выигрыш +${fmt(pay - cfg.stake)} ₽`;
      $('dkResult').textContent = res; $('dkResult').className = v.loser === me ? 'lose' : 'win';
      $('dkOrder').innerHTML = v.finished.map((i, k) => `<li>${k + 1}. ${v.names[i]}</li>`).join('') + (v.loser !== null ? `<li class="lose">🃏 ${v.names[v.loser]} — дурак</li>` : '');
      if (v.loser !== null && v.loser !== me && cfg.stake) Anim.winFx(pay, cfg.stake);
    }
    $('dkAgain').style.display = isHost() ? '' : 'none';
    $('dkWait').style.display = isHost() ? 'none' : '';
  }
  $('dkAgain').onclick = () => {
    if (!isHost()) return;
    if (cfg.stake > Casino.balance) return SlotUI.toast('Недостаточно средств для ставки');
    startGame();
  };
  $('dkToLobby').onclick = () => leave();
  function leave() {
    if (V && V.phase === 'play' && paidGame === gameId && settledGame !== gameId) { settledGame = gameId; if (!isHost() || !net) SlotUI.toast('Партия прервана — ставка сгорает'); }
    reset();
  }
  function reset() {
    clearTimeout(botTimer); if (net) try { net.close(); } catch (e) {}
    net = null; role = 'none'; st = null; V = null; seats = []; code = ''; prevHand = new Set(); prevTable = 0; prevDef = new Set(); screen('dkLobby');
  }

  // ушли со вкладки дурака — выходим из комнаты (хозяин закрывает её, гостю место занимает бот)
  document.addEventListener('casino:tab', e => {
    if (e.detail !== 'durak' && role !== 'none') { leave(); SlotUI.toast('Вы вышли из комнаты дурака'); }
  });

  // ---------------- вход по ссылке ?room=CODE ----------------
  const m = /[?&]room=([A-Z0-9]{5})\b/.exec(location.search);
  screen('dkLobby');
  if (m) { $('dkCode').value = m[1]; setTimeout(() => { Casino.openTab('durak'); joinRoom(m[1]); }, 300); }
})();
