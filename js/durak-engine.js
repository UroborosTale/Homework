// Дурак (подкидной и переводной), 36 карт, 2–6 игроков: правила, проверка ходов и боты.
// Чистая логика без DOM — работает и в браузере, и в node (для тестов).
const DurakEngine = (() => {
  const SUITS = ['♠', '♥', '♦', '♣'], RANKS = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const rv = r => RANKS.indexOf(r);
  const same = (a, b) => a && b && a.r === b.r && a.s === b.s;

  function shuffled() {
    const d = []; for (const s of SUITS) for (const r of RANKS) d.push({ s, r });
    for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
    return d;
  }
  // Новая партия. deck[0] — открытый козырь (берётся последним), добор — deck.pop()
  function newGame(names, mode = 'podkidnoy') {
    const n = names.length, deck = shuffled(), hands = names.map(() => []);
    for (let k = 0; k < 6; k++) for (let i = 0; i < n; i++) hands[i].push(deck.pop());
    const trump = deck[0] || hands[n - 1][5], st = {
      mode, names: names.slice(), deck, trump, trumpSuit: trump.s, hands, out: names.map(() => false), finished: [],
      table: [], attacker: 0, defender: 1, taking: false, passed: [], limit: 6, phase: 'play', loser: null, last: '', round: 1,
    };
    // первым ходит игрок с младшим козырем
    let best = null;
    hands.forEach((h, i) => h.forEach(c => { if (c.s === st.trumpSuit && (best === null || rv(c.r) < best.v)) best = { v: rv(c.r), i }; }));
    st.attacker = best ? best.i : 0; st.defender = nextActive(st, st.attacker);
    st.limit = Math.min(6, hands[st.defender].length);
    st.last = `${names[st.attacker]} ходит первым${best ? ' (младший козырь)' : ''}`;
    return st;
  }
  function nextActive(st, i) {
    const n = st.names.length;
    for (let k = 1; k <= n; k++) { const j = (i + k) % n; if (!st.out[j]) return j; }
    return i;
  }
  const beats = (st, a, d) => (d.s === a.s && rv(d.r) > rv(a.r)) || (d.s === st.trumpSuit && a.s !== st.trumpSuit);
  const ranksOnTable = st => new Set(st.table.flatMap(p => [p.a.r, p.d && p.d.r].filter(Boolean)));
  const undefended = st => st.table.filter(p => !p.d).length;
  const hasCard = (st, p, c) => st.hands[p].some(x => same(x, c));
  const take = (st, p, c) => { const h = st.hands[p], i = h.findIndex(x => same(x, c)); h.splice(i, 1); };

  // Может ли игрок p подкинуть карту c (или начать атаку)
  function canAttack(st, p, c) {
    if (st.phase !== 'play' || p === st.defender || st.out[p] || !hasCard(st, p, c)) return false;
    if (st.table.length === 0) return p === st.attacker;
    if (st.table.length >= st.limit) return false;
    if (!ranksOnTable(st).has(c.r)) return false;
    if (!st.taking && undefended(st) >= st.hands[st.defender].length) return false;   // защитнику должно хватить карт
    return true;
  }
  function canDefend(st, p, i, c) {
    return st.phase === 'play' && p === st.defender && !st.taking && st.table[i] && !st.table[i].d && hasCard(st, p, c) && beats(st, st.table[i].a, c);
  }
  function canTransfer(st, p, c) {
    if (st.mode !== 'perevodnoy' || st.phase !== 'play' || p !== st.defender || st.taking || !st.table.length) return false;
    if (st.table.some(x => x.d) || !hasCard(st, p, c) || st.table.some(x => x.a.r !== c.r)) return false;
    const nd = nextActive(st, p);
    return nd !== p && st.hands[nd].length >= st.table.length + 1;
  }
  const canTake = (st, p) => st.phase === 'play' && p === st.defender && !st.taking && undefended(st) > 0;
  // Есть ли у игрока хоть один законный подкид (иначе он автоматически «пасует»)
  const canThrowAny = (st, p) => st.table.length > 0 && st.hands[p].some(c => canAttack(st, p, c));
  const canPass = (st, p) => st.phase === 'play' && p !== st.defender && !st.out[p] && st.table.length > 0 && !st.passed.includes(p) && (st.taking || undefended(st) === 0);

  const cardName = c => c.r + c.s;
  // Применить ход. Возвращает { ok, err }
  function act(st, p, a) {
    const nm = st.names[p];
    switch (a.type) {
      case 'attack':
        if (!canAttack(st, p, a.card)) return { ok: false, err: 'Так подкинуть нельзя' };
        take(st, p, a.card); st.table.push({ a: a.card, d: null, by: p }); st.passed = [];
        st.last = `${nm} ${st.table.length === 1 ? 'ходит' : 'подкидывает'} ${cardName(a.card)}`; break;
      case 'defend':
        if (!canDefend(st, p, a.i, a.card)) return { ok: false, err: 'Этой картой не побить' };
        take(st, p, a.card); st.table[a.i].d = a.card; st.last = `${nm} бьёт ${cardName(st.table[a.i].a)} картой ${cardName(a.card)}`; break;
      case 'transfer': {
        if (!canTransfer(st, p, a.card)) return { ok: false, err: 'Перевести нельзя' };
        take(st, p, a.card); st.table.push({ a: a.card, d: null, by: p });
        const nd = nextActive(st, p); st.attacker = p; st.defender = nd; st.passed = [];
        st.limit = Math.min(6, st.hands[nd].length);
        st.last = `${nm} переводит на ${st.names[nd]} (${cardName(a.card)})`; break;
      }
      case 'take':
        if (!canTake(st, p)) return { ok: false, err: 'Сейчас нельзя взять' };
        st.taking = true; st.passed = []; st.last = `${nm} берёт`; break;
      case 'pass':
        if (!canPass(st, p)) return { ok: false, err: 'Сейчас нельзя пасовать' };
        st.passed.push(p); st.last = `${nm}: ${st.taking ? 'подкидывать не буду' : 'бито'}`; break;
      default: return { ok: false, err: 'Неизвестный ход' };
    }
    checkRound(st);
    return { ok: true };
  }
  // Раунд заканчивается, когда все (кто может) отказались подкидывать, а защитник отбился или берёт
  function checkRound(st) {
    if (st.phase !== 'play' || !st.table.length) return;
    const allBeaten = undefended(st) === 0;
    if (!allBeaten && !st.taking) return;
    const others = st.names.map((_, i) => i).filter(i => i !== st.defender && !st.out[i]);
    const waiting = others.filter(i => !st.passed.includes(i) && canThrowAny(st, i));
    const full = st.table.length >= st.limit || (!st.taking && st.hands[st.defender].length === 0);
    if (waiting.length && !full) return;
    endRound(st, st.taking);
  }
  function endRound(st, took) {
    const def = st.defender, cards = st.table.flatMap(p => [p.a, p.d].filter(Boolean));
    if (took) st.hands[def].push(...cards);
    st.table = []; st.taking = false; st.passed = [];
    // добор: сначала главный атакующий, затем остальные по кругу, защитник последним
    const n = st.names.length, order = [];
    for (let k = 0; k < n; k++) { const j = (st.attacker + k) % n; if (j !== def) order.push(j); }
    order.push(def);
    for (const j of order) while (st.hands[j].length < 6 && st.deck.length) st.hands[j].push(st.deck.pop());
    // кто остался без карт при пустой колоде — вышел из игры
    if (!st.deck.length) st.hands.forEach((h, i) => { if (!h.length && !st.out[i]) { st.out[i] = true; st.finished.push(i); } });
    const left = st.out.map((o, i) => o ? -1 : i).filter(i => i >= 0);
    st.round++;
    st.last = (took ? `${st.names[def]} взял ${cards.length} карт` : 'Бито') + (st.last ? '' : '');
    if (left.length <= 1) { st.phase = 'over'; st.loser = left.length ? left[0] : null; return; }
    let att = took ? nextActive(st, def) : (st.out[def] ? nextActive(st, def) : def);
    if (st.out[att]) att = nextActive(st, att);
    st.attacker = att; st.defender = nextActive(st, att); st.limit = Math.min(6, st.hands[st.defender].length);
  }

  // ---------- Бот ----------
  // level: 1 — простой, 2 — бережёт козыри и крупные карты
  const cost = (st, c) => rv(c.r) + (c.s === st.trumpSuit ? 20 : 0);
  function botMove(st, p, level = 2) {
    if (st.phase !== 'play' || st.out[p]) return null;
    const h = st.hands[p].slice().sort((a, b) => cost(st, a) - cost(st, b)), late = st.deck.length === 0;
    if (p === st.defender) {
      if (st.taking) return null;
      const open = st.table.map((x, i) => x.d ? -1 : i).filter(i => i >= 0);
      if (!open.length) return null;
      // перевод, если не жалко карту
      const tr = h.find(c => canTransfer(st, p, c));
      if (tr && (tr.s !== st.trumpSuit || late) && (level < 2 || rv(tr.r) < 6 || late)) return { type: 'transfer', card: tr };
      // жадно подбираем отбой для всех открытых карт
      const used = [], plan = [];
      for (const i of open) {
        const c = h.find(x => !used.includes(x) && beats(st, st.table[i].a, x));
        if (!c) return { type: 'take' };
        used.push(c); plan.push({ i, c });
      }
      const expensive = plan.some(x => x.c.s === st.trumpSuit && rv(x.c.r) >= 6);
      if (level >= 2 && expensive && st.deck.length > 8 && st.table.length <= 2) return { type: 'take' };
      return { type: 'defend', i: plan[0].i, card: plan[0].c };
    }
    if (st.table.length === 0) {
      if (p !== st.attacker) return null;
      const nonTrump = h.filter(c => c.s !== st.trumpSuit);
      const pool = nonTrump.length ? nonTrump : h;               // немного случайности, чтобы боты не ходили одинаково
      return { type: 'attack', card: pool[Math.random() < .3 && pool.length > 1 ? 1 : 0] };
    }
    if (st.passed.includes(p)) return null;
    const opts = h.filter(c => canAttack(st, p, c) && (late || st.taking || level < 2 || (c.s !== st.trumpSuit && rv(c.r) < 6)));
    if (opts.length && Math.random() < .92) return { type: 'attack', card: opts[Math.random() < .25 && opts.length > 1 ? 1 : 0] };
    return canPass(st, p) ? { type: 'pass' } : null;
  }

  // Вид партии для игрока me: чужие карты скрыты (массивы null нужной длины)
  function view(st, me) {
    return { mode: st.mode, names: st.names, me, trump: st.trump, trumpSuit: st.trumpSuit, deckCount: st.deck.length,
      hands: st.hands.map((h, i) => i === me ? h.slice() : h.map(() => null)), out: st.out.slice(), finished: st.finished.slice(),
      table: st.table.map(x => ({ ...x })), attacker: st.attacker, defender: st.defender, taking: st.taking, passed: st.passed.slice(),
      limit: st.limit, phase: st.phase, loser: st.loser, last: st.last, round: st.round };
  }
  return { SUITS, RANKS, rv, same, newGame, act, botMove, view, beats, canAttack, canDefend, canTransfer, canTake, canPass, canThrowAny, nextActive, cardName };
})();
if (typeof module !== 'undefined') module.exports = DurakEngine;
