// Ретранслятор онлайн-игр казино для Яндекс Облака.
// Схема: игрок ⇄ API Gateway (WebSocket) → эта функция → API Gateway → другой игрок.
// В Object Storage хранится только «комната → соединение хозяина» и «соединение → комната».
// Внешних библиотек нет: только встроенный fetch (Node.js 18+).
//
// Переменная окружения BUCKET — имя бакета Object Storage.
// Сервисному аккаунту функции нужны роли storage.editor и api-gateway.websocketWriter.
//
// Протокол (JSON-сообщения от игрока):
//   { a: 'host', room, prev? }  — стать хозяином комнаты (prev — прежнее соединение при переподключении)
//   { a: 'join', room, prev? }  — войти в комнату гостем
//   { a: 'to', c, m }           — переслать m соединению c (гость пишет хозяину, хозяин — конкретному гостю)
//   { a: 'ping' }               — не дать соединению «заснуть»
// Ответы и уведомления игроку:
//   { a: 'hosted', me } | { a: 'joined', me, host } | { e: 'busy' | 'noroom' | 'bad' }
//   { a: 'joined', c, prev? } (хозяину) | { a: 'msg', c, m } | { a: 'left', c } | { a: 'gone', c } | { a: 'bye' }
'use strict';
const S3 = () => `https://storage.yandexcloud.net/${process.env.BUCKET}/`;
const WS = 'https://apigateway-connections.api.cloud.yandex.net/apigateways/websocket/v1/connections/';
const ROOM_RE = /^[A-Z0-9]{5}$/, CONN_RE = /^[A-Za-z0-9._-]{1,50}$/;
let token = '';
const auth = () => ({ Authorization: 'Bearer ' + token });

async function sget(key) {
  const r = await fetch(S3() + key, { headers: auth() });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`storage GET ${key}: ${r.status}`);
  return r.json();
}
async function sput(key, obj) {
  const r = await fetch(S3() + key, { method: 'PUT', headers: { ...auth(), 'Content-Type': 'application/json' }, body: JSON.stringify(obj) });
  if (!r.ok) throw new Error(`storage PUT ${key}: ${r.status}`);
}
const sdel = key => fetch(S3() + key, { method: 'DELETE', headers: auth() }).catch(() => {});
// отправить сообщение в соединение; false — соединения больше нет
async function send(conn, obj) {
  if (!conn) return false;
  const r = await fetch(WS + encodeURIComponent(conn) + ':send', {
    method: 'POST', headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: Buffer.from(JSON.stringify(obj)).toString('base64'), type: 'TEXT' }),
  });
  return r.ok;
}
const reply = obj => ({ statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) });
const ok = () => ({ statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: '' });

module.exports.handler = async (event, context) => {
  token = (context.token && context.token.access_token) || '';
  const rc = event.requestContext || {}, me = rc.connectionId, type = rc.eventType;
  if (type === 'CONNECT') return { statusCode: 200 };
  if (type === 'DISCONNECT') {
    const info = await sget('c/' + me).catch(() => null);
    if (!info) return ok();
    await sdel('c/' + me);
    if (info.role === 'host') {
      const room = await sget('r/' + info.room).catch(() => null);
      // хозяин мог уже переподключиться — тогда комнату не трогаем
      if (room && room.host === me) { await sdel('r/' + info.room); await Promise.all((room.guests || []).map(g => send(g, { a: 'bye' }).catch(() => {}))); }
    } else {
      const room = await sget('r/' + info.room).catch(() => null);
      if (room) await send(room.host, { a: 'left', c: me }).catch(() => {});
    }
    return ok();
  }

  let m;
  try { m = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString() : event.body || ''); } catch (e) { return reply({ e: 'bad' }); }
  if (!m || typeof m !== 'object') return reply({ e: 'bad' });
  try {
    switch (m.a) {
      case 'ping': return reply({ a: 'pong' });
      case 'host': {
        if (!ROOM_RE.test(m.room)) return reply({ e: 'bad' });
        const room = await sget('r/' + m.room);
        // код занят живым хозяином (проверяем, что его соединение ещё открыто)
        if (room && room.host !== m.prev && room.host !== me && await send(room.host, { a: 'pong' })) return reply({ e: 'busy' });
        const guests = room && room.host === m.prev ? room.guests || [] : [];
        await sput('r/' + m.room, { host: me, guests, t: Date.now() });
        await sput('c/' + me, { room: m.room, role: 'host' });
        return reply({ a: 'hosted', me });
      }
      case 'join': {
        if (!ROOM_RE.test(m.room)) return reply({ e: 'bad' });
        const room = await sget('r/' + m.room);
        if (!room || !await send(room.host, { a: 'joined', c: me, prev: CONN_RE.test(m.prev || '') ? m.prev : undefined })) return reply({ e: 'noroom' });
        room.guests = (room.guests || []).filter(g => g !== m.prev && g !== me).concat(me).slice(-10);
        await sput('r/' + m.room, room);
        await sput('c/' + me, { room: m.room, role: 'guest' });
        return reply({ a: 'joined', me, host: room.host });
      }
      case 'to': {
        if (!CONN_RE.test(m.c || '')) return reply({ e: 'bad' });
        if (!await send(m.c, { a: 'msg', c: me, m: m.m })) return reply({ a: 'gone', c: m.c });
        return ok();
      }
      default: return reply({ e: 'bad' });
    }
  } catch (e) {
    console.error(e);
    return reply({ e: 'server', msg: String(e.message || e).slice(0, 200) });
  }
};
