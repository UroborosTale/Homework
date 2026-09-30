// Векторная графика символов (SVG) для слотов. Оригинальные рисунки в стилистике популярных слотов.
const Art = (() => {
  // Общие градиенты: один скрытый спрайт на всю страницу
  const grad = (id, a, b, c) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/>${c ? `<stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/>` : `<stop offset="1" stop-color="${b}"/>`}</linearGradient>`;
  const rad = (id, a, b) => `<radialGradient id="${id}" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>`;
  const DEFS = [
    grad('gold', '#fff3b0', '#f5b920', '#a56a00'), grad('silver', '#ffffff', '#c5d0dc', '#7b8b9c'),
    grad('wood', '#c68a4a', '#8a5325', '#5a3210'), grad('skin', '#ffe0bd', '#f1b98a'), grad('fur', '#c98a4b', '#8a5228'),
    rad('gRed', '#ff8a8a', '#a3001b'), rad('gPurple', '#e2a8ff', '#5b0f99'), rad('gYellow', '#fffaa0', '#e09a00'),
    rad('gGreen', '#a8ffb8', '#0a7a2e'), rad('gBlue', '#a8d8ff', '#0a3fa8'), rad('gOrb', '#c8e8ff', '#1d4fd8'),
    rad('cPink', '#ffc6e0', '#e0287a'), rad('cRed', '#ff9a9a', '#c4001f'), rad('cGreen', '#d4ff9a', '#3a9a10'),
    rad('cYellow', '#fff7a0', '#f2b600'), rad('cPurple', '#e3b8ff', '#7a2cc4'), rad('cOrange', '#ffd39a', '#f06400'),
    rad('cBlue', '#b8e8ff', '#1b7ad0'), rad('cWater', '#bff0ff', '#1a8bd0'),
    grad('sGold', '#fff1a6', '#e0a526', '#8a5a08'), grad('sGrey', '#eef1f4', '#a9b3bd', '#5d6873'), grad('sTeal', '#bff3e6', '#3fb39a', '#1b6b5a'),
    grad('sRed', '#ffc7b8', '#d8583a', '#7d2414'), grad('sPurple', '#e2cdf7', '#9463c9', '#4d2a7a'), grad('sBlue', '#cde6ff', '#4f8fd6', '#244f86'),
    grad('stoneG', '#cfc6b0', '#9c927a', '#6b6450'), grad('black2', '#4a4a55', '#15151c'), grad('copper', '#ffd2a0', '#c8732a', '#6e3408'),
    grad('sand', '#f8e4a8', '#e0b866', '#b98a33'), grad('cream', '#ffffff', '#f6e7d8'), grad('red2', '#ff6b6b', '#b3000f'),
    grad('teal', '#7af0e0', '#0a8a8a', '#065a5a'), grad('brown', '#a97142', '#6d4220'), grad('leaf', '#8ee06a', '#2c8a1c'),
  ].join('');
  if (typeof document !== 'undefined') {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('width', 0); s.setAttribute('height', 0); s.style.cssText = 'position:absolute;pointer-events:none';
    s.innerHTML = `<defs>${DEFS}</defs>`; document.body.prepend(s);
  }

  // Огранённый самоцвет (как в «Олимпе»)
  const gem = (fill) => `<path d="M50 6 L88 28 L88 72 L50 94 L12 72 L12 28 Z" fill="url(#${fill})" stroke="#ffffffcc" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M50 6 L88 28 L50 50 L12 28 Z" fill="#fff" opacity=".3"/><path d="M50 50 L88 28 L88 72 L50 94 Z" fill="#000" opacity=".22"/>
    <path d="M50 50 L12 28 L12 72 L50 94 Z" fill="#fff" opacity=".08"/><path d="M50 50 L88 72" stroke="#fff" opacity=".25"/>
    <path d="M22 34 L42 22" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".8"/><circle cx="30" cy="44" r="3" fill="#fff" opacity=".8"/>`;
  const stroke = 'stroke="#5a3a00" stroke-width="2.2" stroke-linejoin="round"';

  const olympus = {
    crown: `<path d="M12 76 L16 34 L36 54 L50 20 L64 54 L84 34 L88 76 Z" fill="url(#gold)" ${stroke}/><rect x="12" y="74" width="76" height="14" rx="4" fill="url(#gold)" ${stroke}/>
      <circle cx="16" cy="32" r="6" fill="url(#gRed)"/><circle cx="50" cy="18" r="7" fill="url(#gBlue)"/><circle cx="84" cy="32" r="6" fill="url(#gRed)"/>
      <circle cx="30" cy="81" r="4" fill="url(#gGreen)"/><circle cx="50" cy="81" r="4" fill="url(#gRed)"/><circle cx="70" cy="81" r="4" fill="url(#gGreen)"/><path d="M26 66 L30 46" stroke="#fff" stroke-width="4" opacity=".6" stroke-linecap="round"/>`,
    hour: `<rect x="20" y="8" width="60" height="10" rx="4" fill="url(#gold)" ${stroke}/><rect x="20" y="82" width="60" height="10" rx="4" fill="url(#gold)" ${stroke}/>
      <path d="M28 18 H72 Q72 42 54 50 Q72 58 72 82 H28 Q28 58 46 50 Q28 42 28 18 Z" fill="#bfe6ff" fill-opacity=".55" stroke="#f5b920" stroke-width="4" stroke-linejoin="round"/>
      <path d="M34 22 H66 Q64 36 52 47 H48 Q36 36 34 22 Z" fill="url(#gold)"/><path d="M50 50 L38 80 H62 Z" fill="url(#gold)"/><path d="M36 26 Q34 40 44 48" stroke="#fff" stroke-width="3" fill="none" opacity=".7" stroke-linecap="round"/>`,
    ring: `<circle cx="50" cy="62" r="27" fill="none" stroke="url(#gold)" stroke-width="13"/><circle cx="50" cy="62" r="27" fill="none" stroke="#5a3a00" stroke-width="2" opacity=".5"/>
      <path d="M50 4 L66 16 L50 36 L34 16 Z" fill="url(#gBlue)" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><path d="M50 4 L66 16 L50 20 L34 16Z" fill="#fff" opacity=".4"/>
      <path d="M30 50 Q34 40 42 38" stroke="#fff" stroke-width="4" fill="none" opacity=".6" stroke-linecap="round"/>`,
    cup: `<path d="M22 14 H78 Q80 50 50 60 Q20 50 22 14 Z" fill="url(#gold)" ${stroke}/><path d="M22 20 Q6 20 10 38 Q14 48 30 46" fill="none" stroke="url(#gold)" stroke-width="7" stroke-linecap="round"/><path d="M78 20 Q94 20 90 38 Q86 48 70 46" fill="none" stroke="url(#gold)" stroke-width="7" stroke-linecap="round"/>
      <rect x="44" y="58" width="12" height="22" fill="url(#gold)" ${stroke}/><ellipse cx="50" cy="86" rx="26" ry="8" fill="url(#gold)" ${stroke}/><circle cx="50" cy="32" r="7" fill="url(#gRed)" stroke="#fff" stroke-width="1.5"/><path d="M30 24 Q30 40 40 48" stroke="#fff" stroke-width="4" fill="none" opacity=".6" stroke-linecap="round"/>`,
    red: gem('gRed'), purple: gem('gPurple'), yellow: gem('gYellow'), green: gem('gGreen'), blue: gem('gBlue'),
    scatter: `<circle cx="50" cy="50" r="42" fill="url(#gOrb)" stroke="#fff" stroke-width="3"/><circle cx="50" cy="50" r="42" fill="none" stroke="#7ad0ff" stroke-width="2" opacity=".8"/>
      <path d="M58 10 L28 54 H47 L38 92 L74 42 H54 Z" fill="url(#gold)" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><ellipse cx="34" cy="28" rx="14" ry="8" fill="#fff" opacity=".35" transform="rotate(-30 34 28)"/>`,
  };

  const sweet = {
    lolly: `<rect x="46" y="60" width="8" height="36" rx="4" fill="url(#cream)" stroke="#c8a" stroke-width="1.5"/><circle cx="50" cy="38" r="32" fill="#fff" stroke="#e0287a" stroke-width="3"/>
      <path d="M50 38 m0 0 a5 5 0 1 1 6 6 a10 10 0 1 1 -14 -12 a16 16 0 1 1 22 20 a22 22 0 1 1 -30 -28" fill="none" stroke="#e0287a" stroke-width="6" stroke-linecap="round"/><path d="M26 22 Q30 12 42 9" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>`,
    candy: `<path d="M22 50 L4 32 L4 68 Z" fill="url(#cPink)" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><path d="M78 50 L96 32 L96 68 Z" fill="url(#cPink)" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
      <ellipse cx="50" cy="50" rx="30" ry="26" fill="url(#cPurple)" stroke="#fff" stroke-width="3"/><path d="M34 30 Q50 44 34 70 M50 24 Q68 50 50 76 M66 30 Q76 50 66 70" stroke="#fff" stroke-width="5" fill="none" opacity=".55" stroke-linecap="round"/><ellipse cx="38" cy="36" rx="9" ry="5" fill="#fff" opacity=".6" transform="rotate(-30 38 36)"/>`,
    cake: `<path d="M20 58 L28 92 H72 L80 58 Z" fill="url(#cOrange)" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><path d="M34 60 V90 M50 60 V92 M66 60 V90" stroke="#fff" opacity=".35" stroke-width="3"/>
      <path d="M14 58 Q10 42 30 42 Q28 26 46 28 Q52 12 68 24 Q88 24 86 44 Q94 56 82 60 Z" fill="url(#cPink)" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><circle cx="52" cy="14" r="8" fill="url(#cRed)" stroke="#fff" stroke-width="2"/><path d="M52 8 Q56 0 62 2" stroke="#2c8a1c" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="30" cy="48" r="2.5" fill="#fff"/><circle cx="60" cy="40" r="2.5" fill="#ffe14d"/><circle cx="74" cy="50" r="2.5" fill="#7ad7ff"/>`,
    donut: `<circle cx="50" cy="52" r="40" fill="#e8a35a" stroke="#fff" stroke-width="2.5"/><circle cx="50" cy="50" r="38" fill="url(#cPink)" stroke="#fff" stroke-width="2"/><circle cx="50" cy="50" r="13" fill="#0006" stroke="#fff" stroke-width="2.5"/>
      <path d="M30 26 L38 32 M64 22 L60 32 M78 46 L70 46 M72 72 L66 66 M40 78 L44 70 M22 56 L30 54" stroke="#fff176" stroke-width="4" stroke-linecap="round"/><path d="M28 70 L34 64 M58 80 L56 72 M70 30 L76 36" stroke="#7ad7ff" stroke-width="4" stroke-linecap="round"/><path d="M20 38 Q26 22 40 16" stroke="#fff" stroke-width="5" fill="none" opacity=".6" stroke-linecap="round"/>`,
    apple: `<path d="M50 30 Q20 18 14 50 Q10 82 36 92 Q46 96 50 92 Q54 96 64 92 Q90 82 86 50 Q80 18 50 30 Z" fill="url(#cRed)" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><path d="M50 30 Q50 16 60 8" stroke="#6d4220" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M56 16 Q74 4 84 18 Q66 26 56 16 Z" fill="url(#leaf)" stroke="#fff" stroke-width="1.5"/><path d="M26 44 Q28 32 38 30" stroke="#fff" stroke-width="6" fill="none" opacity=".65" stroke-linecap="round"/>`,
    peach: `<path d="M50 24 Q16 20 12 56 Q10 90 50 94 Q90 90 88 56 Q84 20 50 24 Z" fill="url(#cOrange)" stroke="#fff" stroke-width="2.5"/><path d="M50 26 Q42 58 50 92" stroke="#c4380a" stroke-width="3" fill="none" opacity=".55"/><path d="M52 22 Q60 6 78 8 Q76 26 52 22 Z" fill="url(#leaf)" stroke="#fff" stroke-width="1.5"/><path d="M24 46 Q26 34 36 30" stroke="#fff" stroke-width="6" fill="none" opacity=".6" stroke-linecap="round"/>`,
    grape: `<path d="M50 20 Q56 8 70 8" stroke="#6d4220" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M50 16 Q62 4 78 14 Q66 24 50 16 Z" fill="url(#leaf)" stroke="#fff" stroke-width="1.5"/>
      ${[[34,34],[52,32],[70,36],[26,54],[44,52],[62,52],[78,54],[36,72],[54,72],[70,72],[46,90],[60,88]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="12" fill="url(#cPurple)" stroke="#fff" stroke-width="1.8"/><circle cx="${x-4}" cy="${y-4}" r="3" fill="#fff" opacity=".7"/>`).join('')}`,
    melon: `<path d="M8 40 H92 Q90 90 50 90 Q10 90 8 40 Z" fill="url(#cRed)" stroke="#2c8a1c" stroke-width="6" stroke-linejoin="round"/><path d="M8 40 H92" stroke="#f1ffd0" stroke-width="5"/>
      ${[[30,58],[50,52],[70,58],[40,72],[60,72]].map(([x,y]) => `<ellipse cx="${x}" cy="${y}" rx="3.5" ry="6" fill="#2a1a10" transform="rotate(20 ${x} ${y})"/>`).join('')}<path d="M16 46 Q18 62 30 78" stroke="#fff" stroke-width="4" fill="none" opacity=".45" stroke-linecap="round"/>`,
    banana: `<path d="M18 22 Q10 62 44 84 Q76 98 92 70 Q70 78 52 62 Q34 46 34 18 Z" fill="url(#cYellow)" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><path d="M18 22 L34 18 L32 8 L20 10 Z" fill="#6d4220" stroke="#fff" stroke-width="1.5"/><path d="M26 30 Q26 56 46 74" stroke="#fff" stroke-width="4" fill="none" opacity=".6" stroke-linecap="round"/><path d="M92 70 L88 78" stroke="#6d4220" stroke-width="5" stroke-linecap="round"/>`,
    scatter: `<rect x="14" y="60" width="72" height="30" rx="6" fill="url(#cPink)" stroke="#fff" stroke-width="2.5"/><rect x="24" y="36" width="52" height="26" rx="6" fill="url(#cYellow)" stroke="#fff" stroke-width="2.5"/><rect x="34" y="16" width="32" height="22" rx="6" fill="url(#cBlue)" stroke="#fff" stroke-width="2.5"/>
      <path d="M50 4 V16" stroke="#fff" stroke-width="4"/><path d="M50 -2 Q56 6 50 10 Q44 6 50 -2Z" fill="#ffa000"/><path d="M16 76 Q26 68 36 76 T56 76 T76 76 T86 74" stroke="#fff" stroke-width="3" fill="none" opacity=".8"/><circle cx="34" cy="50" r="3" fill="#e0287a"/><circle cx="50" cy="46" r="3" fill="#7a2cc4"/><circle cx="66" cy="50" r="3" fill="#1b7ad0"/>`,
  };

  const bass = {
    R: `<path d="M12 90 L78 12" stroke="url(#brown)" stroke-width="8" stroke-linecap="round"/><path d="M12 90 L78 12" stroke="#ffffff55" stroke-width="2" stroke-linecap="round" transform="translate(-2 -2)"/><circle cx="34" cy="64" r="17" fill="url(#gold)" ${stroke}/><circle cx="34" cy="64" r="7" fill="#5a3a00"/><path d="M34 47 V38" stroke="#5a3a00" stroke-width="5" stroke-linecap="round"/><path d="M78 12 Q94 22 88 46" fill="none" stroke="#e8f6ff" stroke-width="2.5"/><circle cx="88" cy="50" r="4" fill="#e53935"/>`,
    T: `<rect x="10" y="34" width="80" height="54" rx="8" fill="url(#red2)" stroke="#5a0008" stroke-width="3"/><path d="M32 34 V24 Q32 16 42 16 H58 Q68 16 68 24 V34" fill="none" stroke="#5a0008" stroke-width="6"/><rect x="10" y="52" width="80" height="6" fill="#00000033"/><rect x="42" y="48" width="16" height="16" rx="3" fill="url(#gold)" stroke="#5a3a00" stroke-width="2"/><rect x="18" y="42" width="12" height="4" rx="2" fill="#fff" opacity=".5"/><path d="M72 78 L84 62" stroke="#ffd54f" stroke-width="4" stroke-linecap="round"/>`,
    F: `<path d="M50 6 V22" stroke="#5a3a00" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="56" r="34" fill="#fff" stroke="#5a0008" stroke-width="3"/><path d="M50 22 A34 34 0 0 1 84 56 H16 A34 34 0 0 1 50 22 Z" fill="url(#red2)"/><circle cx="50" cy="56" r="34" fill="none" stroke="#5a0008" stroke-width="3"/><path d="M24 44 Q30 32 42 28" stroke="#fff" stroke-width="5" fill="none" opacity=".6" stroke-linecap="round"/><path d="M50 90 V98" stroke="#5a3a00" stroke-width="4"/>`,
    D: `<path d="M50 6 V52 Q50 88 30 88 Q14 88 14 72 Q14 62 24 62" fill="none" stroke="url(#silver)" stroke-width="9" stroke-linecap="round"/><path d="M50 52 Q50 88 30 88" fill="none" stroke="#3a4a5a" stroke-width="2" opacity=".5"/><circle cx="50" cy="12" r="7" fill="none" stroke="url(#silver)" stroke-width="5"/><path d="M24 62 L14 52 L30 54 Z" fill="url(#silver)"/><path d="M58 30 Q70 44 66 66 Q62 86 78 90" fill="none" stroke="url(#gold)" stroke-width="5" opacity=".0"/>`,
    W: `<path d="M14 50 Q14 12 50 12 Q86 12 86 50 Z" fill="#ffca28" stroke="#5a3a00" stroke-width="3"/><rect x="8" y="46" width="84" height="10" rx="5" fill="#f9a825" stroke="#5a3a00" stroke-width="3"/><rect x="34" y="26" width="32" height="10" fill="#e53935"/>
      <path d="M18 60 Q14 96 50 96 Q86 96 82 60 Z" fill="url(#brown)" stroke="#3b2110" stroke-width="3"/><ellipse cx="50" cy="66" rx="24" ry="20" fill="url(#skin)" stroke="#3b2110" stroke-width="2"/>
      <circle cx="40" cy="62" r="3.6" fill="#222"/><circle cx="60" cy="62" r="3.6" fill="#222"/><path d="M36 74 Q50 68 64 74 Q60 82 50 80 Q40 82 36 74 Z" fill="url(#brown)"/><path d="M34 54 L46 57 M66 54 L54 57" stroke="#3b2110" stroke-width="3" stroke-linecap="round"/>`,
    S: `<circle cx="50" cy="50" r="42" fill="#fff" stroke="#b71c1c" stroke-width="3"/><circle cx="50" cy="50" r="17" fill="#0a2a44" stroke="#b71c1c" stroke-width="3"/>
      ${[0, 90, 180, 270].map(a => `<path d="M50 8 A42 42 0 0 1 72 13 L64 33 A20 20 0 0 0 50 30 Z" fill="#e53935" stroke="#b71c1c" stroke-width="2" transform="rotate(${a} 50 50)"/>`).join('')}<circle cx="50" cy="50" r="42" fill="none" stroke="#fff" stroke-width="2" opacity=".5"/>`,
    M: `<path d="M84 50 L98 30 L98 70 Z" fill="url(#cOrange)" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><ellipse cx="46" cy="50" rx="42" ry="30" fill="url(#cWater)" stroke="#fff" stroke-width="3"/><path d="M14 50 Q46 30 78 50 Q46 70 14 50Z" fill="#ffffff22"/><circle cx="24" cy="44" r="5" fill="#fff"/><circle cx="24" cy="44" r="2.4" fill="#111"/><path d="M40 30 Q44 50 40 70 M56 32 Q60 50 56 68" stroke="#fff" stroke-width="3" fill="none" opacity=".4"/>`,
  };

  const dog = {
    D: `<path d="M22 20 Q6 8 8 46 Q12 58 24 54 Z" fill="#5a3a1a" stroke="#2a180a" stroke-width="2.5"/><path d="M78 20 Q94 8 92 46 Q88 58 76 54 Z" fill="#5a3a1a" stroke="#2a180a" stroke-width="2.5"/>
      <ellipse cx="50" cy="52" rx="32" ry="38" fill="url(#fur)" stroke="#2a180a" stroke-width="2.5"/><ellipse cx="50" cy="66" rx="18" ry="16" fill="#f3d6a6"/><ellipse cx="50" cy="60" rx="8" ry="6" fill="#222"/><path d="M50 66 V74 M50 74 Q42 82 36 76 M50 74 Q58 82 64 76" stroke="#222" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="50" cy="82" rx="8" ry="6" fill="#e5484d"/>
      <circle cx="36" cy="44" r="5" fill="#fff"/><circle cx="64" cy="44" r="5" fill="#fff"/><circle cx="37" cy="45" r="3" fill="#222"/><circle cx="65" cy="45" r="3" fill="#222"/><path d="M28 34 Q36 30 44 34 M56 34 Q64 30 72 34" stroke="#2a180a" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    P: `${[[22,30],[78,30],[16,56],[84,56],[50,12],[30,14],[70,14]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="15" fill="#fff" stroke="#9aa" stroke-width="2.2"/>`).join('')}
      <ellipse cx="50" cy="56" rx="26" ry="32" fill="#fff" stroke="#9aa" stroke-width="2.2"/><ellipse cx="50" cy="66" rx="12" ry="10" fill="#eee" stroke="#9aa" stroke-width="1.5"/><ellipse cx="50" cy="62" rx="6" ry="4.5" fill="#222"/><path d="M50 66 V72 Q44 78 38 74 M50 72 Q56 78 62 74" stroke="#222" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <circle cx="38" cy="48" r="4" fill="#222"/><circle cx="62" cy="48" r="4" fill="#222"/><circle cx="39" cy="47" r="1.4" fill="#fff"/><circle cx="63" cy="47" r="1.4" fill="#fff"/><ellipse cx="50" cy="84" rx="6" ry="5" fill="#ff6f91"/>`,
    H: `<path d="M18 26 L8 8 L34 18 Z" fill="#8a5a2a" stroke="#2a180a" stroke-width="2.5" stroke-linejoin="round"/><path d="M82 26 L92 8 L66 18 Z" fill="#8a5a2a" stroke="#2a180a" stroke-width="2.5" stroke-linejoin="round"/>
      <ellipse cx="50" cy="56" rx="38" ry="34" fill="url(#fur)" stroke="#2a180a" stroke-width="2.5"/><ellipse cx="50" cy="70" rx="24" ry="18" fill="#f0c990"/><ellipse cx="50" cy="60" rx="10" ry="7" fill="#222"/><path d="M26 74 Q38 88 50 78 Q62 88 74 74" stroke="#2a180a" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M36 80 L38 88 M64 80 L62 88" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
      <circle cx="34" cy="46" r="6" fill="#fff"/><circle cx="66" cy="46" r="6" fill="#fff"/><circle cx="35" cy="47" r="3.4" fill="#222"/><circle cx="67" cy="47" r="3.4" fill="#222"/><path d="M24 36 L44 40 M76 36 L56 40" stroke="#2a180a" stroke-width="4" stroke-linecap="round"/>`,
    B: `<path d="M22 30 A12 12 0 1 1 38 42 L62 66 A12 12 0 1 1 78 58 A12 12 0 1 1 62 76 L38 52 A12 12 0 1 1 22 30 Z" fill="url(#cream)" stroke="#8a6a3a" stroke-width="3" stroke-linejoin="round" transform="rotate(-8 50 50)"/><path d="M28 28 Q32 22 38 24" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>`,
    W: `<path d="M8 50 L50 8 L92 50 Z" fill="url(#red2)" stroke="#4a0008" stroke-width="3" stroke-linejoin="round"/><path d="M14 46 L50 12" stroke="#fff" stroke-width="3" opacity=".35" stroke-linecap="round"/><rect x="16" y="48" width="68" height="44" fill="url(#wood)" stroke="#3b2110" stroke-width="3"/>
      <path d="M16 62 H84 M16 76 H84" stroke="#3b2110" stroke-width="2" opacity=".5"/><path d="M40 92 V70 Q40 60 50 60 Q60 60 60 70 V92 Z" fill="#1b0f06" stroke="#3b2110" stroke-width="2"/><circle cx="50" cy="34" r="6" fill="#ffe082" stroke="#4a0008" stroke-width="2"/>`,
    S: `<ellipse cx="50" cy="66" rx="24" ry="22" fill="url(#gold)" ${stroke}/><ellipse cx="22" cy="40" rx="10" ry="13" fill="url(#gold)" ${stroke} transform="rotate(-20 22 40)"/><ellipse cx="42" cy="24" rx="10" ry="14" fill="url(#gold)" ${stroke} transform="rotate(-6 42 24)"/><ellipse cx="62" cy="24" rx="10" ry="14" fill="url(#gold)" ${stroke} transform="rotate(6 62 24)"/><ellipse cx="80" cy="40" rx="10" ry="13" fill="url(#gold)" ${stroke} transform="rotate(20 80 40)"/><ellipse cx="44" cy="62" rx="8" ry="5" fill="#fff" opacity=".55"/>`,
  };

  const egypt = {
    X: `<ellipse cx="50" cy="84" rx="44" ry="10" fill="#6d4220" stroke="#3b2110" stroke-width="2.5"/><path d="M22 76 Q22 22 50 22 Q78 22 78 76 Z" fill="url(#sand)" stroke="#3b2110" stroke-width="2.5"/><rect x="22" y="60" width="56" height="10" fill="#8a5325"/>
      <path d="M26 92 Q26 60 50 60 Q74 60 74 92 Z" fill="url(#skin)" stroke="#3b2110" stroke-width="2"/><circle cx="41" cy="74" r="3" fill="#222"/><circle cx="59" cy="74" r="3" fill="#222"/><path d="M42 84 Q50 89 58 84" stroke="#7a3a1a" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    S: `<ellipse cx="50" cy="58" rx="28" ry="34" fill="url(#teal)" stroke="#063a3a" stroke-width="3"/><path d="M50 26 V92" stroke="#063a3a" stroke-width="2.5"/><path d="M50 40 Q26 44 24 70 M50 40 Q74 44 76 70" fill="none" stroke="url(#gold)" stroke-width="3.5"/><circle cx="50" cy="20" r="11" fill="url(#gold)" ${stroke}/><circle cx="50" cy="20" r="4" fill="#0a8a8a"/>
      <path d="M32 30 Q18 20 8 26 M68 30 Q82 20 92 26 M22 56 L6 56 M78 56 L94 56 M26 76 L10 84 M74 76 L90 84" stroke="#063a3a" stroke-width="4" stroke-linecap="round" fill="none"/>`,
    F: `<path d="M8 52 Q50 8 92 52 Q50 88 8 52 Z" fill="#fff" stroke="url(#gold)" stroke-width="5" stroke-linejoin="round"/><circle cx="50" cy="52" r="17" fill="url(#cBlue)" stroke="#063a6a" stroke-width="3"/><circle cx="50" cy="52" r="7" fill="#04203a"/><circle cx="46" cy="48" r="2.5" fill="#fff"/>
      <path d="M8 52 Q6 40 14 30 M20 66 Q6 84 22 92 M46 66 Q40 82 50 94" stroke="url(#gold)" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M92 52 L98 46" stroke="url(#gold)" stroke-width="5" stroke-linecap="round"/>`,
    U: `<path d="M50 6 Q86 10 86 46 V60 L74 96 H26 L14 60 V46 Q14 10 50 6 Z" fill="url(#gold)" stroke="#5a3a00" stroke-width="3" stroke-linejoin="round"/><path d="M14 50 H30 V96 M86 50 H70 V96" stroke="#1565c0" stroke-width="7"/><path d="M14 30 H86" stroke="#1565c0" stroke-width="6"/>
      <ellipse cx="50" cy="52" rx="20" ry="26" fill="url(#skin)" stroke="#5a3a00" stroke-width="2"/><path d="M34 46 Q42 42 46 46 M54 46 Q58 42 66 46" stroke="#111" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M50 52 V64" stroke="#8a5a30" stroke-width="2.5"/><path d="M44 72 Q50 76 56 72" stroke="#a33" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    B: `<path d="M6 30 Q28 18 50 30 Q72 18 94 30 V84 Q72 72 50 84 Q28 72 6 84 Z" fill="url(#gold)" stroke="#5a3a00" stroke-width="3" stroke-linejoin="round"/><path d="M50 30 V84" stroke="#5a3a00" stroke-width="3"/><path d="M12 38 Q28 30 44 38 V72 Q28 64 12 72 Z" fill="#f8e4a8" stroke="#8a5a00" stroke-width="1.5"/><path d="M56 38 Q72 30 88 38 V72 Q72 64 56 72 Z" fill="#f8e4a8" stroke="#8a5a00" stroke-width="1.5"/>
      <path d="M22 52 Q28 44 34 52 Q28 58 22 52 Z" fill="#1565c0"/><circle cx="28" cy="52" r="2.2" fill="#fff"/><path d="M66 46 H80 M66 54 H80 M66 62 H76" stroke="#8a5a00" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="16" r="9" fill="url(#gRed)" stroke="#fff" stroke-width="2"/>`,
  };

  const fruit = {    // классический фруктовый слот
    C: `<path d="M50 14 Q40 40 30 66 M50 14 Q62 36 70 62" stroke="#3d7a1a" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M50 14 Q68 4 84 16 Q66 24 50 14 Z" fill="url(#leaf)" stroke="#2c6a10" stroke-width="1.5"/><circle cx="28" cy="72" r="20" fill="url(#cRed)" stroke="#fff" stroke-width="2.5"/><circle cx="70" cy="70" r="20" fill="url(#cRed)" stroke="#fff" stroke-width="2.5"/><circle cx="21" cy="64" r="5" fill="#fff" opacity=".7"/><circle cx="63" cy="62" r="5" fill="#fff" opacity=".7"/>`,
    L: `<path d="M10 52 Q14 22 50 20 Q86 22 90 52 Q86 80 50 82 Q14 80 10 52 Z" fill="url(#cYellow)" stroke="#fff" stroke-width="2.5"/><path d="M6 52 L14 48 M94 52 L86 48" stroke="#e0a800" stroke-width="6" stroke-linecap="round"/><path d="M26 38 Q36 28 50 27" stroke="#fff" stroke-width="5" fill="none" opacity=".7" stroke-linecap="round"/>`,
    O: `<circle cx="50" cy="54" r="38" fill="url(#cOrange)" stroke="#fff" stroke-width="2.5"/><path d="M50 16 Q60 4 76 10 Q64 22 50 16 Z" fill="url(#leaf)" stroke="#2c6a10" stroke-width="1.5"/><path d="M26 40 Q32 28 44 24" stroke="#fff" stroke-width="6" fill="none" opacity=".65" stroke-linecap="round"/>`,
    G: sweet.grape,
    B: `<path d="M50 6 Q26 10 22 48 Q20 66 10 74 H90 Q80 66 78 48 Q74 10 50 6 Z" fill="url(#gold)" ${stroke}/><circle cx="50" cy="84" r="10" fill="url(#gold)" ${stroke}/><path d="M32 34 Q34 22 44 16" stroke="#fff" stroke-width="5" fill="none" opacity=".7" stroke-linecap="round"/>`,
    S: `<path d="M50 4 L62 36 L96 38 L70 60 L80 94 L50 74 L20 94 L30 60 L4 38 L38 36 Z" fill="url(#gold)" ${stroke}/><path d="M50 4 L62 36 L50 46 L38 36 Z" fill="#fff" opacity=".4"/>`,
    D: gem('gBlue'),
    7: `<text x="50" y="80" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="92" fill="url(#red2)" stroke="#fff" stroke-width="4" paint-order="stroke">7</text>`,
    W: olympus.crown,
    F: `<rect x="14" y="44" width="72" height="46" rx="6" fill="url(#cPurple)" stroke="#fff" stroke-width="2.5"/><rect x="10" y="32" width="80" height="18" rx="5" fill="url(#cPink)" stroke="#fff" stroke-width="2.5"/><rect x="43" y="32" width="14" height="58" fill="url(#gold)" ${stroke}/><path d="M50 32 Q30 6 24 22 Q22 34 50 32 Z M50 32 Q70 6 76 22 Q78 34 50 32 Z" fill="url(#gold)" ${stroke}/>`,
    $: `<path d="M34 24 Q50 10 66 24 L60 34 Q50 28 40 34 Z" fill="url(#gold)" ${stroke}/><path d="M40 34 Q6 60 16 84 Q26 96 50 96 Q74 96 84 84 Q94 60 60 34 Z" fill="url(#gold)" ${stroke}/><path d="M38 34 H62" stroke="#a56a00" stroke-width="6" stroke-linecap="round"/><text x="50" y="82" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="40" fill="#5a3a00">$</text>`,
  };


  // ----- Дикий Запад (Hold & Win)
  const west = {
    G: `<path d="M8 40 H66 Q72 40 72 34 V30 H86 Q92 30 92 36 V46 H70 L64 56 H44 L40 70 Q38 86 24 88 H14 Q18 72 22 56 H8 Z" fill="url(#silver)" stroke="#39434e" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="44" y="28" width="22" height="12" rx="3" fill="url(#brown)" stroke="#3b2110" stroke-width="2"/><circle cx="55" cy="47" r="7" fill="none" stroke="#39434e" stroke-width="3"/><path d="M14 86 Q18 70 24 58 H38 Q34 74 30 86 Z" fill="url(#wood)" stroke="#3b2110" stroke-width="2"/><path d="M12 44 H62" stroke="#fff" stroke-width="3" opacity=".6" stroke-linecap="round"/>`,
    H: `<ellipse cx="50" cy="66" rx="46" ry="14" fill="url(#brown)" stroke="#3b2110" stroke-width="2.5"/><path d="M24 64 Q22 30 36 24 Q50 32 64 24 Q78 30 76 64 Q50 74 24 64 Z" fill="url(#fur)" stroke="#3b2110" stroke-width="2.5"/>
      <path d="M26 56 Q50 64 74 56 L75 62 Q50 70 25 62 Z" fill="#2a1a10"/><path d="M34 32 Q38 44 36 56" stroke="#fff" stroke-width="3" opacity=".35" fill="none" stroke-linecap="round"/><circle cx="64" cy="60" r="3" fill="url(#gold)"/>`,
    B: `<path d="M34 8 H64 V58 Q64 66 72 70 L90 78 Q96 82 94 90 H22 Q18 90 18 84 V70 Q30 66 32 56 Z" fill="url(#brown)" stroke="#3b2110" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M34 8 H64 V20 H34 Z" fill="#5a3418"/><path d="M38 30 Q48 38 58 30 M38 42 Q48 50 58 42" stroke="url(#gold)" stroke-width="3" fill="none"/><rect x="18" y="86" width="76" height="6" rx="2" fill="#2a1a10"/><path d="M10 84 L18 84 M8 88 L14 94" stroke="url(#silver)" stroke-width="4" stroke-linecap="round"/>`,
    S: `<path d="M24 86 Q8 50 26 24 Q50 0 74 24 Q92 50 76 86 L62 86 Q74 54 64 34 Q50 20 36 34 Q26 54 38 86 Z" fill="url(#silver)" stroke="#39434e" stroke-width="2.5" stroke-linejoin="round"/>
      ${[[30,74],[24,56],[30,38],[70,74],[76,56],[70,38]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#39434e"/>`).join('')}<path d="M28 30 Q38 16 50 14" stroke="#fff" stroke-width="3" fill="none" opacity=".7" stroke-linecap="round"/>`,
    W: `<path d="M50 4 L61 30 L90 30 L67 50 L76 80 L50 62 L24 80 L33 50 L10 30 L39 30 Z" fill="url(#gold)" ${stroke}/>${[[50,4],[90,30],[76,80],[24,80],[10,30]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="6" fill="url(#gold)" ${stroke}/>`).join('')}
      <circle cx="50" cy="44" r="15" fill="#a56a00" opacity=".35"/><text x="50" y="51" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="15" fill="#5a3a00">WILD</text>`,
    C: `<circle cx="50" cy="50" r="42" fill="url(#gold)" ${stroke}/><circle cx="50" cy="50" r="33" fill="none" stroke="#a56a00" stroke-width="3" stroke-dasharray="4 4"/><circle cx="50" cy="50" r="42" fill="none" stroke="#fff" stroke-width="2" opacity=".5"/><ellipse cx="34" cy="30" rx="12" ry="6" fill="#fff" opacity=".45" transform="rotate(-30 34 30)"/>`,
  };

  // ----- Каменные маски (лавинный слот)
  const mask = (g, eyes = '#1a120a') => `<rect x="10" y="10" width="80" height="80" rx="14" fill="url(#${g})" stroke="#2a2016" stroke-width="3"/>
    <path d="M10 30 H90 M10 70 H90" stroke="#00000033" stroke-width="2"/><rect x="16" y="16" width="68" height="68" rx="10" fill="none" stroke="#ffffff55" stroke-width="2"/>
    <path d="M22 38 Q32 30 44 38 Q32 46 22 38 Z M56 38 Q68 30 78 38 Q68 46 56 38 Z" fill="${eyes}"/><circle cx="33" cy="38" r="3" fill="#ffe082"/><circle cx="67" cy="38" r="3" fill="#ffe082"/>
    <path d="M50 42 L44 60 H56 Z" fill="#00000044"/><path d="M32 70 Q50 80 68 70 L66 66 Q50 74 34 66 Z" fill="${eyes}"/><path d="M20 24 L34 20" stroke="#fff" stroke-width="4" opacity=".5" stroke-linecap="round"/>`;
  const stone = {
    gold: mask('sGold'), grey: mask('sGrey'), teal: mask('sTeal'), red: mask('sRed'), purple: mask('sPurple'), blue: mask('sBlue'),
    W: `<rect x="10" y="10" width="80" height="80" rx="14" fill="url(#stoneG)" stroke="#2a2016" stroke-width="3"/><path d="M14 40 L40 36 L60 44 L86 38 M30 60 L50 66 L82 62" stroke="#00000033" stroke-width="2" fill="none"/>
      <text x="50" y="72" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="60" fill="url(#gold)" stroke="#5a3a00" stroke-width="2">?</text>`,
    F: `<circle cx="50" cy="50" r="42" fill="url(#gold)" ${stroke}/>${Array.from({ length: 12 }, (_, i) => `<path d="M50 8 L54 18 H46 Z" fill="#a56a00" transform="rotate(${i * 30} 50 50)"/>`).join('')}
      <circle cx="50" cy="50" r="24" fill="url(#copper)" stroke="#5a3a00" stroke-width="2"/><path d="M40 46 Q44 42 48 46 M52 46 Q56 42 60 46 M42 58 Q50 64 58 58" stroke="#3b1a00" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  };

  // ----- «Наследие» (тёмная гробница)
  const legacy = {
    P: `<path d="M22 20 Q50 2 78 20 L84 86 Q50 98 16 86 Z" fill="url(#gold)" ${stroke}/><path d="M22 20 L16 86 M78 20 L84 86" stroke="#1565c0" stroke-width="7"/><path d="M30 26 H70 M26 44 H74 M24 62 H76" stroke="#1565c0" stroke-width="5" opacity=".9"/>
      <ellipse cx="50" cy="56" rx="17" ry="22" fill="url(#copper)" stroke="#5a3a00" stroke-width="2"/><path d="M38 50 Q44 46 48 50 M52 50 Q56 46 62 50" stroke="#111" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M44 70 Q50 73 56 70" stroke="#6a1a10" stroke-width="3" fill="none"/><path d="M44 14 Q50 4 56 14 L50 22 Z" fill="url(#gRed)" stroke="#5a3a00" stroke-width="1.5"/>`,
    N: `<path d="M26 44 L16 4 L40 30 Z M74 44 L84 4 L60 30 Z" fill="url(#black2)" stroke="url(#gold)" stroke-width="2.5" stroke-linejoin="round"/><path d="M22 40 Q50 18 78 40 Q86 62 70 76 L62 94 H38 L30 76 Q14 62 22 40 Z" fill="url(#black2)" stroke="url(#gold)" stroke-width="2.5"/>
      <path d="M38 52 L48 56 L38 58 Z M62 52 L52 56 L62 58 Z" fill="#ffd54f"/><path d="M44 70 L50 90 L56 70 Z" fill="#2a2a33"/><ellipse cx="50" cy="74" rx="6" ry="4" fill="#111"/><path d="M30 76 L70 76" stroke="url(#gold)" stroke-width="4"/><path d="M34 84 L66 84" stroke="#1565c0" stroke-width="4"/>`,
    H: egypt.F, S: egypt.S,
    B: `<path d="M6 30 Q28 18 50 30 Q72 18 94 30 V84 Q72 72 50 84 Q28 72 6 84 Z" fill="url(#red2)" stroke="#4a0008" stroke-width="3" stroke-linejoin="round"/><path d="M50 30 V84" stroke="#4a0008" stroke-width="3"/><path d="M12 38 Q28 30 44 38 V72 Q28 64 12 72 Z M56 38 Q72 30 88 38 V72 Q72 64 56 72 Z" fill="#f8e4a8" stroke="#8a5a00" stroke-width="1.5"/>
      <path d="M20 52 Q28 42 36 52 Q28 60 20 52 Z" fill="#1565c0"/><circle cx="28" cy="52" r="2.4" fill="#fff"/><path d="M62 46 H80 M62 54 H80 M62 62 H74" stroke="#8a5a00" stroke-width="3" stroke-linecap="round"/><path d="M44 12 L50 2 L56 12 L50 22 Z" fill="url(#gold)" ${stroke}/>`,
  };
  const sets = { olympus, sweet, bass, dog, egypt, fruit, west, stone, legacy };
  function html(game, key) {
    const inner = sets[game] && sets[game][key];
    return inner ? `<svg class="sym" viewBox="0 0 100 100" aria-hidden="true">${inner}</svg>` : null;
  }
  return { html, sets };
})();
