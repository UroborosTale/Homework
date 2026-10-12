// P2P без сервера: два браузера соединяются напрямую по WebRTC, обмениваясь короткими кодами (текст, ссылка или QR).
// Хозяин → гостю: код приглашения. Гость → хозяину: код ответа. После этого данные идут напрямую, никакого сервера не нужно
// (кроме публичных STUN-серверов, которые подсказывают браузеру его внешний адрес; в одной Wi-Fi-сети работает и без них).
//
// Код — это упакованные в байты ключи соединения (ufrag, pwd, отпечаток сертификата) и адреса (кандидаты ICE).
// Из них на другой стороне собирается минимальный SDP. Длина кода — около 150–250 символов.
const P2P = (() => {
  const ICE = { iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] },
    { urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443', 'turn:openrelay.metered.ca:443?transport=tcp'], username: 'openrelayproject', credential: 'openrelayproject' },
  ] };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const TYPES = ['host', 'srflx', 'relay', 'prflx'];

  // ---------- упаковка SDP в байты ----------
  const crc8 = b => { let c = 0; for (const x of b) { c ^= x; for (let i = 0; i < 8; i++) c = c & 128 ? ((c << 1) ^ 0x07) & 255 : (c << 1) & 255; } return c; };
  const b64 = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64 = s => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return Uint8Array.from(atob(s), c => c.charCodeAt(0)); };
  const hex = (s) => s.match(/.{2}/g).map(h => parseInt(h, 16));
  const tohex = bytes => [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
  function ip6bytes(a) {
    const [h, t = ''] = a.split('::'), L = h ? h.split(':') : [], R = t ? t.split(':') : [];
    const g = a.includes('::') ? [...L, ...Array(8 - L.length - R.length).fill('0'), ...R] : L;
    return g.flatMap(x => { const v = parseInt(x || '0', 16); return [v >> 8, v & 255]; });
  }
  const ip6str = bytes => { const g = []; for (let i = 0; i < 16; i += 2) g.push(((bytes[i] << 8) | bytes[i + 1]).toString(16)); return g.join(':'); };

  function parseSdp(sdp) {
    const get = re => { const m = re.exec(sdp); return m && m[1].trim(); };
    const ufrag = get(/a=ice-ufrag:(.+)/), pwd = get(/a=ice-pwd:(.+)/), fp = /a=fingerprint:([\w-]+) ([0-9A-Fa-f:]+)/.exec(sdp);
    if (!ufrag || !pwd || !fp) throw new Error('Браузер не вернул параметры соединения');
    if (fp[1].toLowerCase() !== 'sha-256') throw new Error('Неподдерживаемый тип сертификата');
    const cands = [];
    for (const line of sdp.split(/\r?\n/)) {
      const m = /^a=candidate:\S+ (\d+) (\w+) (\d+) (\S+) (\d+) typ (\w+)/.exec(line);
      if (!m || m[2].toLowerCase() !== 'udp' || m[1] !== '1') continue;
      const addr = m[4], type = TYPES.indexOf(m[6]); if (type < 0) continue;
      if (/^fe80:/i.test(addr)) continue;                          // link-local IPv6 в другой сети бесполезен
      cands.push({ type, addr, port: +m[5] });
    }
    // не больше 6 адресов: сначала host и srflx, IPv6 — не больше двух
    const rank = c => (c.type === 0 ? 0 : c.type === 1 ? 1 : 2) + (c.addr.includes(':') ? .5 : 0);
    cands.sort((a, b) => rank(a) - rank(b));
    return { ufrag, pwd, fp: hex(fp[2].replace(/:/g, '')), cands: cands.slice(0, 6) };
  }
  function pack(sdp, kind) {
    const p = parseSdp(sdp), out = [1, kind === 'answer' ? 1 : 0];
    for (const s of [p.ufrag, p.pwd]) { out.push(s.length, ...[...s].map(c => c.charCodeAt(0) & 255)); }
    out.push(...p.fp, p.cands.length);
    for (const c of p.cands) {
      const mdns = /^[0-9a-f-]{36}\.local$/i.exec(c.addr), v6 = !mdns && c.addr.includes(':');
      const ak = mdns ? 2 : v6 ? 1 : 0;
      out.push((c.type << 4) | ak, c.port >> 8, c.port & 255);
      out.push(...(mdns ? hex(c.addr.slice(0, 36).replace(/-/g, '')) : v6 ? ip6bytes(c.addr) : c.addr.split('.').map(Number)));
    }
    out.push(crc8(out));
    return 'K1-' + b64(out);
  }
  function unpack(code, kind) {
    code = String(code || '').replace(/\s+/g, '');
    const m = /(?:^|[?&=\/#])K1-([A-Za-z0-9_-]+)/.exec(code); if (!m) throw new Error('Это не код приглашения');
    let b; try { b = unb64(m[1]); } catch (e) { throw new Error('Код повреждён — скопируйте его целиком'); }
    if (b.length < 40 || crc8(b.slice(0, -1)) !== b[b.length - 1]) throw new Error('Код повреждён — скопируйте его целиком');
    if (b[0] !== 1) throw new Error('Код от другой версии игры');
    if (b[1] !== (kind === 'answer' ? 1 : 0)) throw new Error(kind === 'answer' ? 'Это код приглашения, а нужен код ответа игрока' : 'Это код ответа, а нужен код приглашения от хозяина');
    let i = 2; const str = () => { const n = b[i++], s = String.fromCharCode(...b.slice(i, i + n)); i += n; return s; };
    const ufrag = str(), pwd = str(), fp = [...b.slice(i, i + 32)].map(x => x.toString(16).padStart(2, '0').toUpperCase()).join(':'); i += 32;
    const n = b[i++], lines = [];
    for (let k = 0; k < n; k++) {
      const type = b[i] >> 4, ak = b[i] & 15, port = (b[i + 1] << 8) | b[i + 2]; i += 3;
      let addr;
      if (ak === 0) { addr = [...b.slice(i, i + 4)].join('.'); i += 4; }
      else if (ak === 1) { addr = ip6str(b.slice(i, i + 16)); i += 16; }
      else { const h = tohex(b.slice(i, i + 16)); i += 16; addr = `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}.local`; }
      const pri = (({ 0: 126, 1: 100, 2: 0, 3: 110 })[type] << 24) | ((65535 - k) << 8) | 255;
      lines.push(`a=candidate:${k + 1} 1 udp ${pri >>> 0} ${addr} ${port} typ ${TYPES[type]}${type ? ' raddr 0.0.0.0 rport 0' : ''}`);
    }
    return ['v=0', 'o=- 4611731400430051336 2 IN IP4 127.0.0.1', 's=-', 't=0 0', 'a=group:BUNDLE 0', 'a=msid-semantic: WMS',
      'm=application 9 UDP/DTLS/SCTP webrtc-datachannel', 'c=IN IP4 0.0.0.0', `a=ice-ufrag:${ufrag}`, `a=ice-pwd:${pwd}`, `a=fingerprint:sha-256 ${fp}`,
      `a=setup:${kind === 'answer' ? 'active' : 'actpass'}`, 'a=mid:0', 'a=sctp-port:5000', 'a=max-message-size:262144', ...lines, 'a=end-of-candidates', ''].join('\r\n');
  }

  // ---------- WebRTC ----------
  function waitIce(pc, ms = 3500) {
    return new Promise(resolve => {
      const has = () => /a=candidate:/.test((pc.localDescription || {}).sdp || '');
      let done = false; const fin = () => { if (!done) { done = true; resolve(); } };
      pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') fin(); });
      setTimeout(() => { if (has()) fin(); }, ms);
      setTimeout(fin, 9000);
      if (pc.iceGatheringState === 'complete') fin();
    });
  }
  const opened = (dc, ms, err) => new Promise((resolve, reject) => {
    if (dc.readyState === 'open') return resolve(dc);
    const t = ms ? setTimeout(() => reject(new Error(err)), ms) : 0;
    dc.addEventListener('open', () => { clearTimeout(t); resolve(dc); });
    dc.addEventListener('close', () => { clearTimeout(t); reject(new Error('Соединение закрыто')); });
  });
  function newPC() {
    if (typeof RTCPeerConnection === 'undefined') throw new Error('Браузер не поддерживает прямое соединение (WebRTC)');
    const pc = new RTCPeerConnection(ICE), dc = pc.createDataChannel('g', { negotiated: true, id: 0 });
    return { pc, dc };
  }
  // Хозяин: создаёт приглашение. accept(кодОтвета) → канал данных (RTCDataChannel) после установления соединения
  async function createOffer() {
    const { pc, dc } = newPC();
    await pc.setLocalDescription(await pc.createOffer()); await waitIce(pc);
    return {
      code: pack(pc.localDescription.sdp, 'offer'), dc,
      async accept(answerCode) {
        await pc.setRemoteDescription({ type: 'answer', sdp: unpack(answerCode, 'answer') });
        return opened(dc, 25000, 'Не удалось соединиться. Возможно, мобильная сеть блокирует прямые соединения — попробуйте одну Wi-Fi сеть');
      },
      cancel() { try { pc.close(); } catch (e) {} },
    };
  }
  // Гость: по коду приглашения делает код ответа. opened — промис канала данных (ждёт, пока хозяин введёт ответ)
  async function createAnswer(offerCode) {
    const sdp = unpack(offerCode, 'offer'), { pc, dc } = newPC();
    await pc.setRemoteDescription({ type: 'offer', sdp });
    await pc.setLocalDescription(await pc.createAnswer()); await waitIce(pc);
    return { code: pack(pc.localDescription.sdp, 'answer'), dc, opened: opened(dc, 240000, 'Хозяин не подтвердил приглашение за 4 минуты'), cancel() { try { pc.close(); } catch (e) {} } };
  }

  // ---------- QR ----------
  const inviteUrl = (code, hash = '') => { const u = new URL(location.href); u.search = ''; u.hash = ''; u.searchParams.set('p2p', code); return u.toString() + (hash ? '#' + hash : ''); };
  function qrSvg(text) {
    if (typeof qrcode === 'undefined') return '';
    const q = qrcode(0, 'L'); q.addData(text, 'Byte'); q.make();
    return q.createSvgTag({ cellSize: 4, margin: 3, scalable: true });
  }
  // Сканирование QR камерой: BarcodeDetector, а если его нет (iOS) — jsQR. → строка или null, если отменили
  function scan() {
    return new Promise(async resolve => {
      const m = document.createElement('div'); m.className = 'modal show p2pscan';
      m.innerHTML = '<div class="mbox"><h3>📷 Наведите камеру на QR-код</h3><video playsinline muted></video><p class="fxnote p2pscanst">Запрашиваю доступ к камере…</p><div class="mbtns"><button class="btn">Отмена</button></div></div>';
      document.body.appendChild(m);
      const video = m.querySelector('video'), st = m.querySelector('.p2pscanst'); let stream = null, stop = false;
      const finish = v => { stop = true; if (stream) stream.getTracks().forEach(t => t.stop()); m.remove(); resolve(v); };
      m.querySelector('.btn').onclick = () => finish(null);
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('нет доступа к камере');
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        video.srcObject = stream; await video.play(); st.textContent = 'Ищу QR-код…';
      } catch (e) { st.textContent = 'Камера недоступна: ' + (e.message || e.name) + '. Вставьте код текстом.'; return; }
      let det = null; try { if (window.BarcodeDetector) det = new BarcodeDetector({ formats: ['qr_code'] }); } catch (e) {}
      const cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });
      const tick = async () => {
        if (stop) return;
        try {
          if (video.readyState >= 2 && video.videoWidth) {
            if (det) { const r = await det.detect(video); if (r.length) return finish(r[0].rawValue); }
            else if (typeof jsQR !== 'undefined') {
              const w = Math.min(640, video.videoWidth), h = Math.round(w * video.videoHeight / video.videoWidth); cv.width = w; cv.height = h; cx.drawImage(video, 0, 0, w, h);
              const r = jsQR(cx.getImageData(0, 0, w, h).data, w, h); if (r && r.data) return finish(r.data);
            }
          }
        } catch (e) {}
        setTimeout(tick, 180);
      };
      tick();
    });
  }
  // код из текста, ссылки или QR
  const extract = s => { s = String(s || '').trim(); const m = /[?&]p2p=([^&#\s]+)/.exec(s); return m ? decodeURIComponent(m[1]) : s; };
  // код приглашения из адресной строки (?p2p=…) — отдаём один раз и убираем из адреса
  function pendingOffer() {
    const m = /[?&]p2p=([^&#\s]+)/.exec(location.search); if (!m) return null;
    try { const u = new URL(location.href); u.searchParams.delete('p2p'); history.replaceState(null, '', u.toString()); } catch (e) {}
    return decodeURIComponent(m[1]);
  }

  // ---------- интерфейс ----------
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  async function copy(text, what) {
    try { await navigator.clipboard.writeText(text); SlotUI.toast(what + ' скопирован'); }
    catch (e) { prompt('Скопируйте:', text); }
  }
  async function share(title, text, url) { if (navigator.share) { try { await navigator.share({ title, text, url }); return true; } catch (e) { return false; } } return false; }

  // Панель хозяина: invite() → { code, accept(answerCode) } — создаёт приглашение; можно звать несколько раз (для нескольких игроков)
  function hostPanel(box, { invite, game = 'играть', hash = '' }) {
    box.classList.add('p2pbox');
    box.innerHTML = `<div class="p2phead">📱 Пригласить друга без сервера (QR или код)</div><div class="p2plist"></div>
      <div class="dkbtns"><button class="btn primary p2padd">➕ Пригласить игрока</button></div>
      <p class="dkhelp">Друг сканирует QR (или открывает ссылку), присылает вам ответ — и вы соединены напрямую, без VPN. Одна Wi-Fi сеть работает надёжнее всего.</p>`;
    const list = box.querySelector('.p2plist'), add = box.querySelector('.p2padd');
    const cards = new Set();
    add.onclick = async () => {
      add.disabled = true; add.textContent = 'Готовлю приглашение…';
      try {
        const inv = await invite(), link = inviteUrl(inv.code, hash), card = document.createElement('div'); card.className = 'p2pcard'; cards.add(card);
        card.innerHTML = `<div class="p2pstep"><b>1.</b> Отправьте приглашение другу</div>
          <div class="p2pqr">${qrSvg(link)}</div>
          <div class="p2pbtns"><button class="btn" data-a="link">🔗 Ссылка</button><button class="btn" data-a="code">📋 Код</button>${navigator.share ? '<button class="btn" data-a="share">📤 Отправить</button>' : ''}</div>
          <div class="p2pstep"><b>2.</b> Вставьте ответ друга</div>
          <textarea class="p2pta" rows="2" placeholder="Код ответа от друга (или отсканируйте QR)"></textarea>
          <div class="p2pbtns"><button class="btn" data-a="scan">📷 Сканировать QR</button><button class="btn primary" data-a="ok">Подключить</button><button class="btn" data-a="x">Отмена</button></div>
          <div class="p2pst"></div>`;
        const ta = card.querySelector('textarea'), status = card.querySelector('.p2pst');
        const connect = async () => {
          const v = extract(ta.value); if (!v) return status.textContent = 'Вставьте код ответа';
          status.className = 'p2pst'; status.textContent = 'Соединяю…';
          try { await inv.accept(v); status.className = 'p2pst ok'; status.textContent = '✔ Игрок подключился'; setTimeout(() => { card.remove(); cards.delete(card); }, 1500); }
          catch (e) { status.className = 'p2pst err'; status.textContent = e.message; }
        };
        card.onclick = async e => {
          const a = e.target.dataset && e.target.dataset.a; if (!a) return;
          if (a === 'link') copy(link, 'Ссылка');
          else if (a === 'code') copy(inv.code, 'Код');
          else if (a === 'share') share('Мини-казино', `Присоединяйся к игре: ${game}`, link);
          else if (a === 'scan') { const t = await scan(); if (t) { ta.value = extract(t); connect(); } }
          else if (a === 'ok') connect();
          else if (a === 'x') { inv.cancel && inv.cancel(); card.remove(); cards.delete(card); }
        };
        list.appendChild(card);
      } catch (e) { SlotUI.toast(e.message || 'Не удалось создать приглашение'); }
      add.disabled = false; add.textContent = '➕ Пригласить игрока';
    };
    return { clear() { list.innerHTML = ''; cards.clear(); } };
  }

  // Панель гостя: connect(код приглашения) → { answerCode, ready: Promise<api> }; onReady(api) — когда соединились
  function guestPanel(box, { connect, onReady, prefill = '' }) {
    box.classList.add('p2pbox', 'p2pguest');
    box.innerHTML = `<div class="p2phead">📱 Войти по приглашению (QR или код)</div>
      <div class="p2pstage1"><textarea class="p2pta" rows="2" placeholder="Вставьте код или ссылку приглашения"></textarea>
        <div class="p2pbtns"><button class="btn" data-a="scan">📷 Сканировать QR</button><button class="btn primary" data-a="next">Далее</button></div></div>
      <div class="p2pstage2" style="display:none"><div class="p2pstep"><b>Покажите ответ хозяину комнаты</b></div><div class="p2pqr"></div>
        <div class="p2pbtns"><button class="btn" data-a="code">📋 Код ответа</button>${navigator.share ? '<button class="btn" data-a="share">📤 Отправить</button>' : ''}<button class="btn" data-a="back">Назад</button></div></div>
      <div class="p2pst"></div>`;
    const ta = box.querySelector('textarea'), st1 = box.querySelector('.p2pstage1'), st2 = box.querySelector('.p2pstage2'), status = box.querySelector('.p2pst'), qr = box.querySelector('.p2pqr');
    let cur = null;
    ta.value = prefill;
    const next = async () => {
      const v = extract(ta.value); if (!v) return status.textContent = 'Вставьте код приглашения';
      status.className = 'p2pst'; status.textContent = 'Готовлю ответ…';
      try {
        cur = await connect(v); qr.innerHTML = qrSvg(cur.answerCode); st1.style.display = 'none'; st2.style.display = '';
        status.textContent = 'Отправьте ответ хозяину (QR, код или сообщением). Ждём подключения…';
        cur.ready.then(api => { status.className = 'p2pst ok'; status.textContent = '✔ Соединено'; onReady(api); })
          .catch(e => { if (cur) { status.className = 'p2pst err'; status.textContent = e.message; } });
      } catch (e) { status.className = 'p2pst err'; status.textContent = e.message || 'Не удалось'; }
    };
    box.onclick = async e => {
      const a = e.target.dataset && e.target.dataset.a; if (!a) return;
      if (a === 'next') next();
      else if (a === 'scan') { const t = await scan(); if (t) { ta.value = extract(t); next(); } }
      else if (a === 'code') copy(cur.answerCode, 'Код ответа');
      else if (a === 'share') share('Ответ на приглашение', 'Код ответа: ' + cur.answerCode);
      else if (a === 'back') { cur && cur.cancel && cur.cancel(); cur = null; st2.style.display = 'none'; st1.style.display = ''; status.textContent = ''; }
    };
    if (prefill) setTimeout(next, 50);
    return { fill(v) { ta.value = v; return next(); }, reset() { cur && cur.cancel && cur.cancel(); cur = null; st2.style.display = 'none'; st1.style.display = ''; status.textContent = ''; } };
  }

  return { createOffer, createAnswer, pack, unpack, scan, qrSvg, extract, pendingOffer, hostPanel, guestPanel, inviteUrl, ICE };
})();
