// Сеть для дурака: комнаты по коду. Основной канал — PeerJS (WebRTC, браузеры связываются напрямую),
// запасной — BroadcastChannel (между вкладками одного браузера; включается ?net=local или если PeerJS недоступен).
const DurakNet = (() => {
  const PREFIX = 'mkcasino-durak-v1-';
  const PEER_JS = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';
  let loading = null;
  const forceLocal = () => /[?&]net=local\b/.test(location.search);
  function loadPeer() {
    if (window.Peer) return Promise.resolve(true);
    if (!loading) loading = new Promise(res => {
      const s = document.createElement('script'); s.src = PEER_JS; s.async = true;
      s.onload = () => res(!!window.Peer); s.onerror = () => res(false); document.head.appendChild(s);
      setTimeout(() => res(!!window.Peer), 8000);
    });
    return loading;
  }
  async function backend() { return !forceLocal() && await loadPeer() ? 'peer' : 'local'; }
  const uid = () => Math.random().toString(36).slice(2, 10);
  const withTimeout = (p, ms, err) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(err)), ms))]);

  // ---------- PeerJS ----------
  function peerHost(code, h) {
    return withTimeout(new Promise((resolve, reject) => {
      const peer = new Peer(PREFIX + code, { debug: 0 }), conns = new Map();
      peer.on('open', () => resolve({
        kind: 'peer',
        send: (id, msg) => { const c = conns.get(id); if (c && c.open) c.send(msg); },
        close: () => { conns.forEach(c => c.close()); peer.destroy(); },
      }));
      peer.on('connection', conn => {
        const id = conn.connectionId || uid();
        conn.on('open', () => { conns.set(id, conn); h.onJoin(id); });
        conn.on('data', d => h.onData(id, d));
        conn.on('close', () => { conns.delete(id); h.onLeave(id); });
        conn.on('error', () => {});
      });
      peer.on('error', e => reject(new Error(e.type === 'unavailable-id' ? 'Код занят, попробуйте ещё раз' : 'Сеть недоступна: ' + e.type)));
      peer.on('disconnected', () => { try { peer.reconnect(); } catch (e) {} });
    }), 12000, 'Не удалось подключиться к сети');
  }
  function peerJoin(code, h) {
    return withTimeout(new Promise((resolve, reject) => {
      const peer = new Peer({ debug: 0 });
      peer.on('open', () => {
        const conn = peer.connect(PREFIX + code, { reliable: true });
        conn.on('open', () => resolve({ kind: 'peer', send: msg => conn.open && conn.send(msg), close: () => { conn.close(); peer.destroy(); } }));
        conn.on('data', d => h.onData(d));
        conn.on('close', () => h.onClose());
      });
      peer.on('error', e => reject(new Error(e.type === 'peer-unavailable' ? 'Комната не найдена' : 'Сеть недоступна: ' + e.type)));
    }), 12000, 'Комната не отвечает');
  }

  // ---------- BroadcastChannel (вкладки одного браузера) ----------
  function localHost(code, h) {
    const ch = new BroadcastChannel('durak-' + code), clients = new Set();
    ch.onmessage = ({ data: m }) => {
      if (m.to !== 'host') return;
      if (m.t === 'connect') { clients.add(m.from); ch.postMessage({ to: m.from, t: 'accepted' }); h.onJoin(m.from); }
      else if (m.t === 'bye') { if (clients.delete(m.from)) h.onLeave(m.from); }
      else if (m.t === 'data' && clients.has(m.from)) h.onData(m.from, m.msg);
    };
    const bye = () => clients.forEach(id => ch.postMessage({ to: id, t: 'bye' }));
    addEventListener('pagehide', bye);
    return Promise.resolve({ kind: 'local', send: (id, msg) => ch.postMessage({ to: id, t: 'data', msg }), close: () => { bye(); ch.close(); } });
  }
  function localJoin(code, h) {
    const ch = new BroadcastChannel('durak-' + code), me = uid();
    return withTimeout(new Promise(resolve => {
      ch.onmessage = ({ data: m }) => {
        if (m.to !== me) return;
        if (m.t === 'accepted') resolve({ kind: 'local', send: msg => ch.postMessage({ to: 'host', from: me, t: 'data', msg }), close: () => { ch.postMessage({ to: 'host', from: me, t: 'bye' }); ch.close(); } });
        else if (m.t === 'data') h.onData(m.msg);
        else if (m.t === 'bye') h.onClose();
      };
      addEventListener('pagehide', () => ch.postMessage({ to: 'host', from: me, t: 'bye' }));
      ch.postMessage({ to: 'host', from: me, t: 'connect' });
    }), 3000, 'Комната не найдена (откройте её в этом же браузере или используйте онлайн-режим)');
  }

  async function host(code, h) { return (await backend()) === 'peer' ? peerHost(code, h) : localHost(code, h); }
  async function join(code, h) { return (await backend()) === 'peer' ? peerJoin(code, h) : localJoin(code, h); }
  const newCode = () => Array.from({ length: 5 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
  return { host, join, newCode, backend, forceLocal };
})();
