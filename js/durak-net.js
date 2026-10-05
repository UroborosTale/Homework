// Сеть для онлайн-игр (дурак, шахматы, нарды, морской бой): комнаты по коду.
// 0) свой ретранслятор в Яндекс Облаке (WebSocket, работает в России без VPN) — если указан в js/net-config.js;
// 1) PeerJS (WebRTC) — браузеры связываются напрямую;
// 2) запасной канал — публичный MQTT-брокер (сообщения идут через сервер, работает почти в любой сети);
// 3) BroadcastChannel — только вкладки одного браузера (?net=local или если интернет-каналы недоступны).
// Хозяин слушает все доступные каналы сразу, гость пробует их по очереди.
const DurakNet = (() => {
  const PREFIX = 'mkcasino-durak-v1-';
  const LIBS = {
    peer: ['js/vendor/peerjs.min.js', 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js'],       // своя копия, CDN — запасной
    mqtt: ['js/vendor/mqtt.min.js', 'https://cdn.jsdelivr.net/npm/mqtt@5.10.1/dist/mqtt.min.js'],
  };
  const BROKERS = ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt'];
  const ICE = { iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:global.stun.twilio.com:3478'] },
    { urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443', 'turn:openrelay.metered.ca:443?transport=tcp'], username: 'openrelayproject', credential: 'openrelayproject' },
  ] };
  const forceLocal = () => /[?&]net=local\b/.test(location.search);
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const withTimeout = (p, ms, err) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(err)), ms))]);

  // загрузка библиотеки с запасным CDN
  const loaded = {};
  function load(name, test) {
    if (test()) return Promise.resolve(true);
    if (!loaded[name]) loaded[name] = (async () => {
      for (const src of LIBS[name]) {
        const ok = await new Promise(res => {
          const s = document.createElement('script'); s.src = src; s.async = true;
          s.onload = () => res(test()); s.onerror = () => res(false); document.head.appendChild(s);
          setTimeout(() => res(test()), 8000);
        });
        if (ok) return true;
      }
      return false;
    })();
    return loaded[name];
  }
  const loadPeer = () => load('peer', () => !!window.Peer);
  const loadMqtt = () => load('mqtt', () => !!(window.mqtt && window.mqtt.connect));
  const peerErr = t => ({
    'peer-unavailable': 'Комната не найдена', 'unavailable-id': 'Код занят', 'server-error': 'Сервер прямого соединения недоступен',
    'network': 'Нет связи с сервером соединения', 'browser-incompatible': 'Браузер не поддерживает WebRTC', 'socket-error': 'Ошибка соединения',
  }[t] || 'Ошибка соединения: ' + t);

  // ---------- PeerJS ----------
  function peerHost(code, h) {
    return withTimeout(new Promise((resolve, reject) => {
      const peer = new Peer(PREFIX + code, { debug: 0, config: ICE }), conns = new Map(); let opened = false;
      peer.on('open', () => { opened = true; resolve({
        send: (id, msg) => { const c = conns.get(id); if (c && c.open) c.send(msg); },
        close: () => { conns.forEach(c => c.close()); peer.destroy(); },
      }); });
      peer.on('connection', conn => {
        const id = 'p:' + (conn.connectionId || uid());
        conn.on('open', () => { conns.set(id, conn); h.onJoin(id); });
        conn.on('data', d => h.onData(id, d));
        conn.on('close', () => { if (conns.delete(id)) h.onLeave(id); });
        conn.on('error', () => {});
      });
      peer.on('error', e => { if (!opened) reject(new Error(peerErr(e.type))); });
      peer.on('disconnected', () => { setTimeout(() => { try { if (!peer.destroyed) peer.reconnect(); } catch (e) {} }, 1500); });
    }), 10000, 'Сервер прямого соединения не отвечает');
  }
  function peerJoinOnce(code, h) {
    let peer = null;
    return withTimeout(new Promise((resolve, reject) => {
      // свой id — без запроса к серверу (из-за этого запроса раньше бывала ошибка server-error)
      peer = new Peer(PREFIX + 'c-' + uid(), { debug: 0, config: ICE });
      peer.on('open', () => {
        const conn = peer.connect(PREFIX + code, { reliable: true });
        conn.on('open', () => resolve({ send: msg => conn.open && conn.send(msg), close: () => { conn.close(); peer.destroy(); } }));
        conn.on('data', d => h.onData(d));
        conn.on('close', () => h.onClose());
        conn.on('error', () => {});
      });
      peer.on('error', e => reject(new Error(peerErr(e.type))));
    }), 9000, 'Прямое соединение не установилось').catch(e => { try { peer && peer.destroy(); } catch (x) {} throw e; });
  }

  // ---------- MQTT-ретранслятор ----------
  const base = code => `mkcasino/durak/v1/${code}`;
  function mqttConnect(url) {
    return withTimeout(new Promise((resolve, reject) => {
      const c = mqtt.connect(url, { clientId: 'mkc_' + uid(), clean: true, connectTimeout: 7000, reconnectPeriod: 2000, keepalive: 30 });
      c.once('connect', () => resolve(c)); c.once('error', e => { c.end(true); reject(e); });
    }), 9000, 'Брокер не отвечает');
  }
  const pub = (c, topic, obj) => c.publish(topic, JSON.stringify(obj), { qos: 1 });
  async function mqttHost(code, h) {
    const clients = await Promise.allSettled(BROKERS.map(mqttConnect)).then(r => r.filter(x => x.status === 'fulfilled').map(x => x.value));
    if (!clients.length) throw new Error('Ретранслятор недоступен');
    const seen = new Map();                                 // id → { c, cid, t }
    clients.forEach(c => {
      c.subscribe(base(code) + '/h', { qos: 1 });
      c.on('message', (topic, raw) => {
        let m; try { m = JSON.parse(raw.toString()); } catch (e) { return; }
        if (!m || !m.f) return; const id = 'm:' + m.f;
        if (m.t === 'connect') { if (!seen.has(id)) { seen.set(id, { c, cid: m.f, t: Date.now() }); pub(c, `${base(code)}/c/${m.f}`, { t: 'accepted' }); h.onJoin(id); } return; }
        const s = seen.get(id); if (!s || s.c !== c) return; s.t = Date.now();   // одно и то же сообщение могло прийти через второй брокер
        if (m.t === 'data') h.onData(id, m.m);
        else if (m.t === 'bye') { seen.delete(id); h.onLeave(id); }
      });
    });
    const hb = setInterval(() => seen.forEach((s, id) => {
      if (Date.now() - s.t > 20000) { seen.delete(id); h.onLeave(id); } else pub(s.c, `${base(code)}/c/${s.cid}`, { t: 'ping' });
    }), 5000);
    return {
      send: (id, msg) => { const s = seen.get(id); if (s) pub(s.c, `${base(code)}/c/${s.cid}`, { t: 'data', m: msg }); },
      close: () => { clearInterval(hb); seen.forEach(s => pub(s.c, `${base(code)}/c/${s.cid}`, { t: 'bye' })); setTimeout(() => clients.forEach(c => c.end(true)), 300); },
    };
  }
  async function mqttJoin(code, h) {
    let lastErr = null;
    for (const url of BROKERS) {
      let c = null;
      try {
        c = await mqttConnect(url); const me = uid(), mine = `${base(code)}/c/${me}`;
        let lastHost = Date.now(), hb = 0;
        const api = await withTimeout(new Promise(resolve => {
          c.subscribe(mine, { qos: 1 }, () => pub(c, base(code) + '/h', { t: 'connect', f: me }));
          c.on('message', (topic, raw) => {
            let m; try { m = JSON.parse(raw.toString()); } catch (e) { return; }
            lastHost = Date.now();
            if (m.t === 'accepted') resolve({
              send: msg => pub(c, base(code) + '/h', { t: 'data', f: me, m: msg }),
              close: () => { clearInterval(hb); pub(c, base(code) + '/h', { t: 'bye', f: me }); setTimeout(() => c.end(true), 300); },
            });
            else if (m.t === 'data') h.onData(m.m);
            else if (m.t === 'bye') { clearInterval(hb); h.onClose(); }
          });
        }), 6000, 'Комната не найдена');
        hb = setInterval(() => { pub(c, base(code) + '/h', { t: 'ping', f: me }); if (Date.now() - lastHost > 20000) { clearInterval(hb); h.onClose(); } }, 5000);
        addEventListener('pagehide', () => pub(c, base(code) + '/h', { t: 'bye', f: me }));
        return api;
      } catch (e) { lastErr = e; try { c && c.end(true); } catch (x) {} }
    }
    throw lastErr || new Error('Ретранслятор недоступен');
  }

  // ---------- Ретранслятор в Яндекс Облаке (API Gateway WebSocket + функция) ----------
  // Соединение живёт до 60 минут, поэтому и хозяин, и гость умеют незаметно переподключаться.
  const relayUrl = () => (window.CASINO_NET && window.CASINO_NET.relay) || '';
  function ycSocket(onMsg, onDrop) {
    return withTimeout(new Promise((resolve, reject) => {
      const ws = new WebSocket(relayUrl()); let opened = false;
      ws.onopen = () => { opened = true; resolve(ws); };
      ws.onerror = () => { if (!opened) reject(new Error('Сервер игр недоступен')); };
      ws.onclose = () => { if (opened) onDrop(ws); };
      ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (x) { return; } if (m && typeof m === 'object') onMsg(m, ws); };
    }), 8000, 'Сервер игр не отвечает');
  }
  const ycSend = (ws, o) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); };
  // ждём ответ определённого вида на запрос
  function ycAsk(state, req, okType) {
    return withTimeout(new Promise((resolve, reject) => { state.wait = { okType, resolve, reject }; ycSend(state.ws, req); }), 8000, 'Сервер игр не отвечает')
      .finally(() => { state.wait = null; });
  }
  function ycAnswer(state, m) {
    const w = state.wait; if (!w) return false;
    if (m.a === w.okType && !m.c) { w.resolve(m); return true; }
    if (m.e) { w.reject(new Error(m.e === 'busy' ? 'Код занят' : m.e === 'noroom' ? 'Комната не найдена' : 'Ошибка сервера игр')); return true; }
    return false;
  }
  async function ycHost(code, h) {
    const st = { ws: null, wait: null, me: '', closed: false }, guests = new Map();   // стабильный id гостя → его текущее соединение
    const byConn = c => { for (const [id, cur] of guests) if (cur === c) return id; return null; };
    const leaveLater = new Map();
    const onMsg = m => {
      if (ycAnswer(st, m)) return;
      if (m.a === 'joined' && m.c) {
        const old = m.prev && byConn(m.prev);
        if (old) { guests.set(old, m.c); clearTimeout(leaveLater.get(old)); return; }        // гость переподключился
        const id = 'y:' + m.c; if (!guests.has(id)) { guests.set(id, m.c); h.onJoin(id); }
      } else if (m.a === 'msg') { const id = byConn(m.c); if (id && !(m.m && m.m.__ping)) h.onData(id, m.m); }
      else if (m.a === 'left' || m.a === 'gone') {
        const id = byConn(m.c); if (!id) return;
        clearTimeout(leaveLater.get(id));                                                   // ждём: вдруг это переподключение
        leaveLater.set(id, setTimeout(() => { if (guests.get(id) === m.c) { guests.delete(id); h.onLeave(id); } }, 15000));
      }
    };
    const connect = async prev => {
      st.ws = await ycSocket(onMsg, ws => { if (!st.closed && ws === st.ws) reconnect(); });
      const r = await ycAsk(st, { a: 'host', room: code, prev }, 'hosted'); st.me = r.me;
      guests.forEach(c => ycSend(st.ws, { a: 'to', c, m: { __host: r.me } }));          // сообщаем гостям новое соединение хозяина
    };
    const reconnect = async () => { for (let i = 0; i < 6 && !st.closed; i++) { try { await connect(st.me); return; } catch (e) { await sleep(1500 * (i + 1)); } } };
    await connect();
    const hb = setInterval(() => { ycSend(st.ws, { a: 'ping' }); guests.forEach(c => ycSend(st.ws, { a: 'to', c, m: { __ping: 1 } })); }, 30000);
    return {
      send: (id, msg) => { const c = guests.get(id); if (c) ycSend(st.ws, { a: 'to', c, m: msg }); },
      close: () => { st.closed = true; clearInterval(hb); guests.forEach(c => ycSend(st.ws, { a: 'to', c, m: { __bye: 1 } })); setTimeout(() => { try { st.ws.close(); } catch (e) {} }, 300); },
    };
  }
  async function ycJoin(code, h) {
    const st = { ws: null, wait: null, me: '', host: '', closed: false }; let lost = 0;
    const onMsg = m => {
      if (ycAnswer(st, m)) return;
      if (m.a === 'msg') {
        if (m.m && m.m.__host) { st.host = m.m.__host; clearTimeout(lost); return; }
        if (m.c !== st.host) return;
        if (m.m && m.m.__ping) return;
        if (m.m && m.m.__bye) { finish(); return; }
        h.onData(m.m);
      } else if (m.a === 'bye') finish();
      else if (m.a === 'gone' && m.c === st.host) { clearTimeout(lost); lost = setTimeout(finish, 15000); }   // хозяин мог переподключаться
    };
    const finish = () => { if (st.closed) return; st.closed = true; clearInterval(hb); try { st.ws.close(); } catch (e) {} h.onClose(); };
    const connect = async prev => {
      st.ws = await ycSocket(onMsg, ws => { if (!st.closed && ws === st.ws) reconnect(); });
      const r = await ycAsk(st, { a: 'join', room: code, prev }, 'joined'); st.me = r.me; st.host = r.host;
    };
    const reconnect = async () => { for (let i = 0; i < 6 && !st.closed; i++) { try { await connect(st.me); return; } catch (e) { await sleep(1500 * (i + 1)); } } finish(); };
    await connect();
    const hb = setInterval(() => ycSend(st.ws, { a: 'to', c: st.host, m: { __ping: 1 } }), 30000);
    addEventListener('pagehide', () => { try { st.ws.close(); } catch (e) {} });
    return {
      send: msg => ycSend(st.ws, { a: 'to', c: st.host, m: msg }),
      close: () => { st.closed = true; clearInterval(hb); try { st.ws.close(); } catch (e) {} },
    };
  }

  // ---------- BroadcastChannel (вкладки одного браузера) ----------
  function localHost(code, h) {
    const ch = new BroadcastChannel('durak-' + code), clients = new Set();
    ch.onmessage = ({ data: m }) => {
      if (m.to !== 'host') return; const id = 'l:' + m.from;
      if (m.t === 'connect') { clients.add(id); ch.postMessage({ to: m.from, t: 'accepted' }); h.onJoin(id); }
      else if (m.t === 'bye') { if (clients.delete(id)) h.onLeave(id); }
      else if (m.t === 'data' && clients.has(id)) h.onData(id, m.msg);
    };
    const bye = () => clients.forEach(id => ch.postMessage({ to: id.slice(2), t: 'bye' }));
    addEventListener('pagehide', bye);
    return { send: (id, msg) => { if (clients.has(id)) ch.postMessage({ to: id.slice(2), t: 'data', msg }); }, close: () => { bye(); ch.close(); } };
  }
  function localJoin(code, h) {
    const ch = new BroadcastChannel('durak-' + code), me = uid();
    return withTimeout(new Promise(resolve => {
      ch.onmessage = ({ data: m }) => {
        if (m.to !== me) return;
        if (m.t === 'accepted') resolve({ send: msg => ch.postMessage({ to: 'host', from: me, t: 'data', msg }), close: () => { ch.postMessage({ to: 'host', from: me, t: 'bye' }); ch.close(); } });
        else if (m.t === 'data') h.onData(m.msg);
        else if (m.t === 'bye') h.onClose();
      };
      addEventListener('pagehide', () => ch.postMessage({ to: 'host', from: me, t: 'bye' }));
      ch.postMessage({ to: 'host', from: me, t: 'connect' });
    }), 3000, 'Комната не найдена');
  }

  // ---------- общий интерфейс ----------
  // Хозяин: поднимает все доступные каналы. kinds — какие каналы работают.
  async function host(code, h) {
    const parts = [], kinds = []; let closed = false;
    // запасные каналы: PeerJS и MQTT; busy — ошибка «Код занят» от любого из них
    const extra = async () => {
      const [okPeer, okMqtt] = await Promise.all([loadPeer(), loadMqtt()]);
      const tries = await Promise.allSettled([okPeer ? peerHost(code, h) : Promise.reject(new Error('PeerJS не загрузился')), okMqtt ? mqttHost(code, h) : Promise.reject(new Error('MQTT не загрузился'))]);
      tries.forEach((t, i) => {
        if (t.status !== 'fulfilled') return;
        if (closed) { try { t.value.close(); } catch (e) {} return; }      // комнату уже закрыли, пока канал подключался
        parts.push(t.value); kinds.push(i ? 'relay' : 'peer');
      });
      const busy = tries.find(t => t.status === 'rejected' && /занят/.test(t.reason.message));
      return busy && busy.reason;
    };
    if (!forceLocal()) {
      if (relayUrl()) { try { parts.push(await ycHost(code, h)); kinds.push('yc'); } catch (e) { if (/занят/.test(e.message)) throw e; } }
      if (kinds.includes('yc')) extra().catch(() => {});                  // сервер игр работает — запасные каналы подключаются в фоне
      else { const busy = await extra(); if (busy && !parts.length) throw busy; }
    }
    parts.push(localHost(code, h)); kinds.push('local');
    return {
      kinds, kind: kinds.some(k => k !== 'local') ? 'online' : 'local',
      send: (id, msg) => parts.forEach(p => p.send(id, msg)),   // каждый канал отправляет только «своим» id
      close: () => { closed = true; parts.forEach(p => { try { p.close(); } catch (e) {} }); },
    };
  }
  // Гость: сервер игр в Яндекс Облаке → прямое соединение (2 попытки) → MQTT-ретранслятор → вкладки этого браузера
  async function join(code, h, onStage = () => {}) {
    const errs = [];
    if (!forceLocal() && relayUrl()) {
      onStage('Подключаюсь к серверу игр…');
      try { const c = await ycJoin(code, h); return { ...c, kind: 'yc' }; } catch (e) { errs.push(e.message); }
    }
    if (!forceLocal()) {
      if (await loadPeer()) for (let i = 0; i < 2; i++) {
        onStage(`Прямое соединение${i ? ' (ещё попытка)' : ''}…`);
        try { const c = await peerJoinOnce(code, h); return { ...c, kind: 'peer' }; } catch (e) { errs.push(e.message); if (/не найдена/.test(e.message)) break; await sleep(800); }
      }
      if (await loadMqtt()) {
        onStage('Подключаюсь через ретранслятор…');
        try { const c = await mqttJoin(code, h); return { ...c, kind: 'relay' }; } catch (e) { errs.push(e.message); }
      }
    }
    try { const c = await localJoin(code, h); return { ...c, kind: 'local' }; } catch (e) { errs.push(e.message); }
    throw new Error(errs.includes('Комната не найдена') ? 'Комната не найдена — проверьте код и что хозяин не закрыл вкладку' : 'Не удалось подключиться: ' + [...new Set(errs)].join('; '));
  }
  const newCode = () => Array.from({ length: 5 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
  return { host, join, newCode, forceLocal };
})();
