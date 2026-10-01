// Дуэли на двоих (шахматы, нарды, морской бой): лобби, игра с ботом, онлайн-комната по коду, ставки, сдача и реванш.
// Сеть — общий модуль DurakNet; хозяин комнаты ведёт партию (движок у него), гость шлёт ходы и получает «вид» партии.
// Движок игры: newGame(names, cfg, gameNo), act(st, p, a) → { ok, err }, view(st, me), botMove(st, p, level).
// Состояние партии должно содержать phase ('over' в конце), winner (0, 1 или null — ничья), reason, last.
const Duel = (() => {
  const { msg, fmt, setBalance } = Casino;
  const clean = s => String(s || '').replace(/[<>&"]/g, '').trim().slice(0, 14) || 'Игрок';
  const randomName = () => ['Игрок', 'Лис', 'Тигр', 'Сокол', 'Волк', 'Кот', 'Ёж'][Math.floor(Math.random() * 7)] + Math.floor(10 + Math.random() * 89);
  const LEVELS = [[1, 'Новичок'], [2, 'Любитель'], [3, 'Мастер']];

  const games = {};                                     // id → api (для отладки и тестов)
  function create(G) {
    const sec = document.getElementById(G.id), E = G.engine;
    const sel = (o) => `<label>${o.label} <select data-opt="${o.key}">${o.values.map(([v, l]) => `<option value="${v}"${v === o.def ? ' selected' : ''}>${l}</option>`).join('')}</select></label>`;
    sec.insertAdjacentHTML('beforeend', `
      <div class="dkpanel duel-lobby">
        <div class="dkform">
          <label>Ваше имя <input class="d-name" maxlength="14"></label>
          ${(G.opts || []).map(sel).join('')}
          <label>Сила бота <select class="d-level">${LEVELS.map(([v, l]) => `<option value="${v}"${v === 2 ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
          <label>Ставка, ₽ <input type="number" class="d-stake" value="1000" min="0" step="100"></label>
        </div>
        <div class="dkbtns"><button class="btn primary d-solo">🤖 Играть с ботом</button><button class="btn primary d-create">🌐 Создать онлайн-комнату</button></div>
        <div class="dkjoin"><input class="d-code" maxlength="5" placeholder="КОД" autocomplete="off"><button class="btn d-join">Войти в комнату</button></div>
        <div class="msg d-note"></div>
        <p class="dkhelp">${G.help} Ставка по желанию (можно 0): победитель забирает банк — обе ставки, при ничьей ставки возвращаются.</p>
      </div>
      <div class="dkpanel duel-room" style="display:none">
        <div class="dkcode">Код комнаты: <b class="d-rcode">—</b> <button class="btn d-copy">📋 Скопировать ссылку</button></div>
        <div class="dknet d-netkind"></div>
        <ul class="dkseats d-seats"></ul>
        <div class="dkinfo d-rinfo"></div>
        <div class="dkbtns"><button class="btn primary d-start">▶ Начать игру</button><button class="btn d-leave">Выйти</button></div>
      </div>
      <div class="duel-game" style="display:none">
        <div class="duel-bar"><div class="duel-pl d-pl0"></div><div class="duel-vs">VS<small class="d-bank"></small></div><div class="duel-pl d-pl1"></div></div>
        <div class="duel-board"></div>
        <div class="msg d-msg"></div>
        <div class="dklast d-last"></div>
        <div class="controls d-ctrl"><button class="btn d-resign">🏳 Сдаться</button></div>
        <div class="dkover duel-over" style="display:none"><div class="dkoverbox"><h3 class="d-result"></h3><p class="d-reason"></p>
          <div class="dkbtns"><button class="btn primary d-again">Ещё партию</button><span class="dkinfo d-wait">Ждём, когда хозяин начнёт новую партию…</span><button class="btn d-tolobby">В лобби</button></div></div></div>
      </div>
      <details class="paytable"><summary>Правила</summary>${G.rules}</details>`);
    const found = {}, q = c => found[c] || (found[c] = sec.querySelector('.' + c));   // запоминаем: msg() перезаписывает className
    const nameKey = 'duelName';
    try { q('d-name').value = localStorage.getItem(nameKey) || localStorage.getItem('durakName') || randomName(); } catch (e) { q('d-name').value = randomName(); }

    // ---------------- состояние ----------------
    let role = 'none', net = null, code = '', cfg = {}, seats = [], st = null, V = null, me = 0;
    let gameNo = 0, paidGame = 0, settledGame = 0, botTimer = 0, myName = '';
    const isHost = () => role === 'host';
    const screen = n => ['duel-lobby', 'duel-room', 'duel-game'].forEach(c => q(c).style.display = c === n ? '' : 'none');
    const note = (t, cls) => msg(q('d-note'), t, cls);
    const api = {
      send, ctrl: q('d-ctrl'), board: q('duel-board'), msg: (t, cls) => msg(q('d-msg'), t, cls), toast: SlotUI.toast,
      get view() { return V; }, get me() { return me; }, get seats() { return seats; }, get cfg() { return cfg; },
    };
    const ui = G.mount(q('duel-board'), api);

    // ---------------- лобби ----------------
    function readCfg() {
      cfg = { stake: Math.max(0, Math.floor(+q('d-stake').value) || 0), level: +q('d-level').value };
      sec.querySelectorAll('[data-opt]').forEach(s => cfg[s.dataset.opt] = s.value);
      myName = clean(q('d-name').value); try { localStorage.setItem(nameKey, myName); } catch (e) {}
    }
    q('d-solo').onclick = () => {
      readCfg(); if (cfg.stake > Casino.balance) return note('Недостаточно средств для ставки', 'lose');
      role = 'host'; net = null; code = '';
      seats = [{ name: myName, kind: 'host' }, { name: '🤖 Бот (' + LEVELS[cfg.level - 1][1].toLowerCase() + ')', kind: 'bot' }];
      startGame();
    };
    q('d-create').onclick = async () => {
      readCfg(); if (cfg.stake > Casino.balance) return note('Недостаточно средств для ставки', 'lose');
      note('Создаю комнату…'); q('d-create').disabled = true;
      try {
        for (let t = 0; t < 3; t++) {
          code = DurakNet.newCode();
          try { net = await DurakNet.host(code, { onJoin() {}, onData: onHostData, onLeave }); break; } catch (e) { if (t === 2) throw e; }
        }
        role = 'host'; seats = [{ name: myName, kind: 'host' }]; showRoom(); note('');
      } catch (e) { note(e.message || 'Не удалось создать комнату', 'lose'); }
      q('d-create').disabled = false;
    };
    q('d-join').onclick = () => joinRoom((q('d-code').value || '').toUpperCase().trim());
    async function joinRoom(c) {
      readCfg(); if (!/^[A-Z0-9]{5}$/.test(c)) return note('Введите код из 5 символов', 'lose');
      note('Подключаюсь…'); q('d-join').disabled = true;
      try {
        net = await DurakNet.join(c, { onData: onClientData, onClose: onHostGone }, s => note(s));
        role = 'client'; code = c; net.send({ t: 'hello', name: myName, game: G.id }); note('');
        SlotUI.toast(net.kind === 'peer' ? 'Подключено напрямую' : net.kind === 'relay' ? 'Подключено через ретранслятор' : 'Подключено (вкладки этого браузера)');
        q('d-rcode').textContent = code; screen('duel-room'); q('d-rinfo').textContent = 'Ждём, когда хозяин начнёт игру…';
        q('d-start').style.display = 'none'; q('d-seats').innerHTML = ''; q('d-netkind').textContent = '';
      } catch (e) { note(e.message || 'Не удалось подключиться', 'lose'); }
      q('d-join').disabled = false;
    }
    function roomLink() { const u = new URL(location.href); u.hash = G.id; u.searchParams.set('room', code); return u.toString(); }
    const optText = () => [...(G.opts || []).map(o => (o.values.find(([v]) => v === cfg[o.key]) || [, ''])[1]), `ставка ${fmt(cfg.stake)} ₽`].filter(Boolean).join(' · ');
    function showRoom() {
      screen('duel-room'); q('d-rcode').textContent = code || '—';
      q('d-seats').innerHTML = seats.map(s => `<li>${s.kind === 'bot' ? '🤖' : '👤'} ${s.name}${s.kind === 'host' ? ' (хозяин)' : ''}</li>`).join('') + (seats.length < 2 ? '<li class="empty">— ждём соперника —</li>' : '');
      q('d-start').style.display = isHost() ? '' : 'none'; q('d-start').disabled = seats.length < 2;
      q('d-rinfo').textContent = isHost() ? `${optText()}. Отправьте другу код или ссылку.` : `${optText()} · ждём, когда хозяин начнёт игру…`;
      const k = net && net.kinds;
      q('d-netkind').textContent = !net ? '' : net.kind === 'local' ? '⚠️ Онлайн-сервисы недоступны: комната работает только между вкладками этого браузера.'
        : k && !k.includes('peer') ? 'ℹ️ Прямое соединение недоступно — игра пойдёт через ретранслятор (это нормально)' : '';
    }
    q('d-copy').onclick = async () => { try { await navigator.clipboard.writeText(roomLink()); SlotUI.toast('Ссылка скопирована'); } catch (e) { prompt('Скопируйте ссылку:', roomLink()); } };
    q('d-leave').onclick = () => leave();
    q('d-start').onclick = () => { if (isHost() && seats.length === 2) { if (cfg.stake > Casino.balance) return SlotUI.toast('Недостаточно средств для ставки'); startGame(); } };
    const pubSeats = () => seats.map(s => ({ name: s.name, kind: s.kind }));
    const toGuest = m => { const g = seats[1]; if (net && g && g.kind === 'human') net.send(g.id, { ...m, game: G.id }); };

    // ---------------- хозяин: сеть ----------------
    function onHostData(id, m) {
      if (!m || typeof m !== 'object') return;
      if (m.t === 'hello') {
        if (m.game !== G.id) return net.send(id, { t: 'err', msg: 'Это комната другой игры', fatal: true });
        if (seats.some(s => s.id === id)) return;
        if (seats.length >= 2 || (st && st.phase !== 'over')) return net.send(id, { t: 'err', msg: 'Комната занята', fatal: true, game: G.id });
        seats.push({ name: clean(m.name), kind: 'human', id }); showRoom(); toGuest({ t: 'lobby', seats: pubSeats(), cfg });
        SlotUI.toast(`${clean(m.name)} вошёл в комнату`);
      } else if (m.t === 'act') {
        if (!seats[1] || seats[1].id !== id || !st) return;
        const r = apply(1, m.a); if (!r.ok) net.send(id, { t: 'err', msg: r.err, game: G.id }); else changed();
      }
    }
    function onLeave(id) {
      if (!seats[1] || seats[1].id !== id) return;
      const name = seats[1].name;
      if (st && st.phase !== 'over') { st.phase = 'over'; st.winner = 0; st.reason = `${name} вышел из игры — победа за вами`; changed(); }
      seats.splice(1, 1); SlotUI.toast(`${name} вышел`);
      if (!st || st.phase === 'over') { if (q('duel-room').style.display !== 'none') showRoom(); }
    }

    // ---------------- гость: сеть ----------------
    function onClientData(m) {
      if (!m || typeof m !== 'object') return;
      if (m.game !== G.id) { SlotUI.toast('Это комната другой игры'); reset(); return note('Этот код — комната другой игры', 'lose'); }
      if (m.t === 'lobby') {
        cfg = m.cfg; seats = m.seats; me = 1;
        if (cfg.stake > Casino.balance) { reset(); return note('Недостаточно средств для ставки этой комнаты', 'lose'); }
        if (!V || V.phase === 'over') showRoom();
      } else if (m.t === 'view') { cfg = m.cfg; seats = m.seats; gameNo = m.gameNo; applyView(m.v); }
      else if (m.t === 'err') { SlotUI.toast(m.msg); if (m.fatal) { reset(); note(m.msg, 'lose'); } }
    }
    function onHostGone() {
      if (role !== 'client') return;
      const playing = V && V.phase !== 'over' && paidGame === gameNo && settledGame !== gameNo;
      if (playing) { V.phase = 'over'; V.winner = me; V.reason = 'Соперник отключился — победа за вами'; settle(); role = 'none'; net = null; q('d-again').style.display = 'none'; q('d-wait').style.display = 'none'; return; }
      SlotUI.toast('Хозяин комнаты отключился'); reset(); note('Хозяин комнаты отключился', 'lose');
    }

    // ---------------- партия ----------------
    function apply(p, a) {
      if (!st || st.phase === 'over') return { ok: false, err: 'Партия окончена' };
      if (a && a.type === 'resign') { st.phase = 'over'; st.winner = 1 - p; st.reason = `${st.names[p]} сдался`; return { ok: true }; }
      return E.act(st, p, a);
    }
    function startGame() {
      clearTimeout(botTimer); gameNo++;
      st = E.newGame(seats.map(s => s.name), cfg, gameNo);
      toGuest({ t: 'lobby', seats: pubSeats(), cfg });
      changed();
    }
    function changed() {
      if (!st) return;
      toGuest({ t: 'view', v: E.view(st, 1), cfg, seats: pubSeats(), gameNo });
      me = 0; applyView(E.view(st, 0));
      scheduleBot();
    }
    function scheduleBot() {
      clearTimeout(botTimer);
      if (!st || st.phase === 'over' || !seats[1] || seats[1].kind !== 'bot') return;
      const m = E.botMove(st, 1, cfg.level); if (!m) return;
      const delay = G.botDelay ? G.botDelay(st, m) : 700;
      botTimer = setTimeout(() => { if (!st || st.phase === 'over') return; const m2 = E.botMove(st, 1, cfg.level); if (m2 && apply(1, m2).ok) changed(); }, delay);
    }
    function send(a) {
      if (isHost()) { const r = apply(0, a); if (!r.ok) SlotUI.toast(r.err); else changed(); }
      else if (net) net.send({ t: 'act', a });
    }

    // ---------------- отрисовка ----------------
    function applyView(v) {
      const fresh = !V || V._g !== gameNo; V = v; V._g = gameNo; me = v.me;
      if (v.phase !== 'over' && paidGame !== gameNo) { paidGame = gameNo; setBalance(Casino.balance - cfg.stake); }
      screen('duel-game');
      const turn = G.turnSeat ? G.turnSeat(v) : v.turn;
      [0, 1].forEach(i => {
        const el = q('d-pl' + i), seat = i === 0 ? me : 1 - me, s = seats[seat] || { name: v.names[seat], kind: 'human' };
        el.className = `duel-pl d-pl${i}` + (v.phase !== 'over' && turn === seat ? ' turn' : '') + (v.phase === 'over' && v.winner === seat ? ' won' : '');
        el.innerHTML = `<b>${s.kind === 'bot' ? '' : '👤 '}${v.names[seat]}${i === 0 ? ' (вы)' : ''}</b><small>${G.playerInfo ? G.playerInfo(v, seat) : ''}</small>`;
      });
      q('d-bank').textContent = cfg.stake ? `банк ${fmt(cfg.stake * 2)} ₽` : '';
      q('d-last').textContent = v.last || '';
      q('d-resign').style.display = v.phase === 'over' ? 'none' : '';
      ui.render(v, { fresh, me, seats, cfg, online: !!net });
      if (v.phase === 'over') settle(); else q('duel-over').style.display = 'none';
    }
    function settle() {
      const v = V;
      if (settledGame !== gameNo) {
        settledGame = gameNo;
        const pay = paidGame !== gameNo ? 0 : v.winner === null ? cfg.stake : v.winner === me ? cfg.stake * 2 : 0;
        if (pay) setBalance(Casino.balance + pay);
        const res = v.winner === null ? 'Ничья' + (cfg.stake ? ' — ставки возвращены' : '') : v.winner === me ? '🏆 Победа!' + (cfg.stake ? ` +${fmt(cfg.stake)} ₽` : '') : 'Поражение' + (cfg.stake ? ` −${fmt(cfg.stake)} ₽` : '');
        q('d-result').textContent = res; q('d-result').className = 'd-result ' + (v.winner === null ? '' : v.winner === me ? 'win' : 'lose');
        q('d-reason').textContent = v.reason || '';
        if (v.winner === me && cfg.stake) Anim.winFx(cfg.stake * 2, cfg.stake / 5);
      }
      q('d-again').style.display = isHost() ? '' : 'none';
      q('d-wait').style.display = role === 'client' ? '' : 'none';
      setTimeout(() => { if (V === v) q('duel-over').style.display = 'flex'; }, G.overDelay || 900);
    }
    q('d-resign').onclick = () => { if (V && V.phase !== 'over' && confirm('Сдаться? Партия будет проиграна.')) send({ type: 'resign' }); };
    q('d-again').onclick = () => {
      if (!isHost()) return;
      if (cfg.stake > Casino.balance) return SlotUI.toast('Недостаточно средств для ставки');
      if (!seats[1]) { q('duel-over').style.display = 'none'; return showRoom(); }
      q('duel-over').style.display = 'none'; startGame();
    };
    q('d-tolobby').onclick = () => leave();
    function leave() {
      if (V && V.phase !== 'over' && paidGame === gameNo && settledGame !== gameNo) { settledGame = gameNo; SlotUI.toast('Партия прервана — ставка проиграна'); }
      reset();
    }
    function reset() {
      clearTimeout(botTimer); if (net) try { net.close(); } catch (e) {}
      net = null; role = 'none'; st = null; V = null; seats = []; code = ''; q('duel-over').style.display = 'none';
      if (ui.reset) ui.reset();
      screen('duel-lobby');
    }
    document.addEventListener('casino:tab', e => { if (e.detail !== G.id && role !== 'none') { leave(); SlotUI.toast('Вы вышли из игры'); } });

    // вход по ссылке ?room=CODE#игра
    const m = /[?&]room=([A-Z0-9]{5})\b/.exec(location.search);
    screen('duel-lobby');
    if (m && location.hash === '#' + G.id) { q('d-code').value = m[1]; setTimeout(() => { Casino.openTab(G.id); joinRoom(m[1]); }, 300); }
    games[G.id] = api;
    return { api };
  }
  return { create, games };
})();
