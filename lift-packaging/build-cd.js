const pptxgen = require('pptxgenjs');
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5
pres.title = 'Упаковка лифта «Воздух»: модули C–D';
const C = {dark:'1F2A30', mid:'34444D', steel:'5B6B75', light:'F3F4F5', line:'D5DADD', acc:'E8590C', white:'FFFFFF', soft:'FDE9DC', ok:'2E7D5B'};
const F = 'Arial';
const W = 13.33, M = 0.6;
let n = 0;

function base(title, kicker) {
  const s = pres.addSlide(); n++;
  s.background = {color: C.white};
  if (kicker) s.addText(kicker.toUpperCase(), {x:M,y:0.4,w:9,h:0.3,fontFace:F,fontSize:12,bold:true,color:C.acc,charSpacing:2,margin:0,isTextBox:true});
  s.addText(title, {x:M,y:0.7,w:W-2*M,h:0.9,fontFace:F,fontSize:30,bold:true,color:C.dark,margin:0,valign:'top',isTextBox:true});
  s.addText(String(n), {x:W-M-0.6,y:7.0,w:0.6,h:0.3,fontFace:F,fontSize:11,color:C.steel,align:'right',margin:0,isTextBox:true});
  return s;
}
function card(s,x,y,w,h,head,body,opt={}) {
  s.addShape(pres.shapes.RECTANGLE,{x,y,w,h,fill:{color:opt.fill||C.light},line:{color:opt.fill||C.light}});
  s.addText(head,{x:x+0.25,y:y+0.18,w:w-0.5,h:0.4,fontFace:F,fontSize:opt.hs||16,bold:true,color:opt.hc||C.dark,margin:0,isTextBox:true,valign:'top'});
  s.addText(body,{x:x+0.25,y:y+0.65,w:w-0.5,h:h-0.8,fontFace:F,fontSize:opt.bs||13,color:opt.bc||C.mid,margin:0,isTextBox:true,valign:'top',paraSpaceAfter:4});
}
function bullets(arr){return arr.map((t,i)=>({text:t,options:{bullet:true,breakLine:i<arr.length-1}}));}
function table(s,rows,x,y,w,colW,opt={}) {
  const data = rows.map((r,i)=>r.map(c=>({text:c,options:{
    bold:i===0, color:i===0?C.white:C.dark, fill:{color:i===0?C.dark:(i%2?C.white:C.light)},
    fontFace:F, fontSize:opt.fs||12, valign:'middle', margin:[0.05,0.1,0.05,0.1]}})));
  s.addTable(data,{x,y,w,colW,border:{type:'solid',pt:0.5,color:C.line},rowH:opt.rowH});
}


// 1 Title
{
  const s = pres.addSlide(); n++;
  s.background={color:C.dark};
  s.addText('ПРОМЫШЛЕННЫЙ ДИЗАЙН · МОДУЛИ C–D',{x:0.8,y:1.2,w:10,h:0.4,fontFace:F,fontSize:14,bold:true,color:C.acc,charSpacing:3,margin:0,isTextBox:true});
  s.addText('Упаковка лифта «Воздух»: материалы и чертежи',{x:0.8,y:1.8,w:9.2,h:2.2,fontFace:F,fontSize:42,bold:true,color:C.white,margin:0,valign:'top',isTextBox:true});
  s.addText('Материалы и производственная реализуемость · габаритные чертежи · схемы сборки и разборки по сценариям',{x:0.8,y:4.3,w:8.5,h:0.9,fontFace:F,fontSize:18,color:'C9D1D6',margin:0,valign:'top',isTextBox:true});
  s.addText('Ершов Е.М., ПИ 4-1',{x:0.8,y:6.4,w:6,h:0.4,fontFace:F,fontSize:14,color:'C9D1D6',margin:0,isTextBox:true});
  const bx=[[10.0,4.6,2.4,2.0],[10.0,2.4,1.1,2.0],[11.3,2.4,1.1,2.0],[10.0,1.0,2.4,1.2]];
  bx.forEach(([x,y,w,h],i)=>s.addShape(pres.shapes.RECTANGLE,{x,y,w,h,fill:{color:i===0?C.acc:C.mid},line:{color:C.steel,width:1}}));
}

// 2 Assumptions
{
  const s = base('Допущения: в задании этих данных нет','Исходные условия');
  table(s,[
    ['Параметр','Принято в проекте','Статус'],
    ['Кабина: упаковочный габарит','2280 × 1800 × 2500 мм (основание 150 + изделие 2300 + верхняя защита 50)','эскиз из модуля B'],
    ['Кассета дверей','2250 × 1100 мм в плане, высота ≈ 450 мм (4 двери с разделителями)','толщина дверей неизвестна'],
    ['Противовес','1400 × 800 × 2400 мм, вертикально','ориентацию подтвердить'],
    ['Лебёдка и пульт','поддон 1000 × 800 × 800; короб 700 × 500 × 300','оценка'],
    ['Масса брутто','≈ 2,0–2,2 т: узлы 1670 кг + упаковка ≈ 20 % + пульт','оценка, нужен расчёт'],
    ['Кузов еврофуры','13,6 × 2,45 × 2,6 м, номинально','замерить конкретную машину'],
  ],M,1.7,W-2*M,[3.3,6.2,2.63],{fs:13,rowH:0.6});
  s.addText('Все размеры упаковки ниже проектные. Они нужны, чтобы проверить концепцию, и должны быть заменены данными изготовителя лифта после уточнения.',{x:M,y:6.15,w:W-2*M,h:0.7,fontFace:F,fontSize:14,bold:true,color:C.acc,margin:0,valign:'top',isTextBox:true});
}

// 3 Module C: kit of parts
{
  const s = base('3D-концепт: конструктор из трёх типов оснований','Модуль C · конструкция');
  // exploded stack drawing
  const cx=M+0.3,cw=3.6;
  s.addShape(pres.shapes.RECTANGLE,{x:cx,y:1.85,w:cw,h:0.7,fill:{color:C.soft},line:{color:C.acc,width:1.5,dashType:'dash'}});
  s.addText('4  съёмная защита: панели на быстросъёмных замках',{x:cx,y:1.85,w:cw,h:0.7,fontFace:F,fontSize:12,bold:true,color:C.acc,align:'center',valign:'middle',margin:0,isTextBox:true});
  s.addShape(pres.shapes.RECTANGLE,{x:cx+0.2,y:2.85,w:cw-0.4,h:0.6,fill:{color:C.line},line:{color:C.steel}});
  s.addText('3  мягкие сменные прокладки',{x:cx+0.2,y:2.85,w:cw-0.4,h:0.6,fontFace:F,fontSize:12,color:C.dark,align:'center',valign:'middle',margin:0,isTextBox:true});
  s.addShape(pres.shapes.RECTANGLE,{x:cx+0.4,y:3.75,w:cw-0.8,h:0.9,fill:{color:C.mid},line:{color:C.mid}});
  s.addText('УЗЕЛ',{x:cx+0.4,y:3.75,w:cw-0.8,h:0.9,fontFace:F,fontSize:15,bold:true,color:C.white,align:'center',valign:'middle',margin:0,isTextBox:true});
  s.addShape(pres.shapes.RECTANGLE,{x:cx+0.2,y:4.95,w:cw-0.4,h:0.5,fill:{color:C.steel},line:{color:C.steel}});
  s.addText('2  фиксаторы: болты M12, ремни',{x:cx+0.2,y:4.95,w:cw-0.4,h:0.5,fontFace:F,fontSize:12,color:C.white,align:'center',valign:'middle',margin:0,isTextBox:true});
  s.addShape(pres.shapes.RECTANGLE,{x:cx,y:5.75,w:cw,h:0.7,fill:{color:C.dark},line:{color:C.dark}});
  s.addText('1  сварное основание с карманами под вилы',{x:cx,y:5.75,w:cw,h:0.7,fontFace:F,fontSize:12,bold:true,color:C.white,align:'center',valign:'middle',margin:0,isTextBox:true});
  table(s,[
    ['Место','Основание','Защита'],
    ['Кабина','тип 1: рама 2280 × 1800, 150 мм','каркас-кожух: 4 угла + верх'],
    ['Противовес','тип 1: та же логика, шире база','стойки и хомут верха'],
    ['Лебёдка','тип 2: силовой поддон','кожух-колпак'],
    ['Кассета дверей','тип 2: плоский поддон','крышка с разделителями'],
    ['Пульт','тип 3: короб-контейнер','встроена в короб'],
  ],5.0,1.85,7.73,[1.8,3.0,2.93],{fs:12,rowH:0.6});
  s.addText('Силовые основания кабины и противовеса общие по интерфейсу (карманы, точки строповки, посадка защиты), но рассчитываются отдельно.',{x:5.0,y:5.7,w:7.73,h:0.9,fontFace:F,fontSize:13,color:C.mid,margin:0,valign:'top',isTextBox:true});
}

// 4 Materials
{
  const s = base('Материалы: сталь несёт, панели защищают','Модуль C · материалы');
  table(s,[
    ['Элемент','Материал (предложение)','Зачем','После использования'],
    ['Основания, стойки','Сталь, профильная труба, сварка, покраска','Несущая способность, многооборотность','Возврат, ремонт'],
    ['Панели защиты','Сотовый полипропилен или фанера 12 мм','Лёгкие, влагостойкие, снимаются вручную','Сортировка по материалу'],
    ['Прокладки','Вспененный полиэтилен, сменные','Мягкий контакт, без царапин','Замена, переработка'],
    ['Кромки и углы','Угловые профили из ПЭ или картона','Защита кромок дверей и кабины','Утилизация'],
    ['Влагозащита','Стрейч-плёнка, влагопоглотитель, пакеты для пульта','Защита от влаги и пыли','Раздельный сбор'],
    ['Крепёж и ремни','Болты M12 одного размера, храповые ремни 50 мм','Один ключ на всю систему','Возврат в комплекте'],
  ],M,1.7,W-2*M,[2.3,4.3,3.3,2.23],{fs:12,rowH:0.62});
  s.addText('Материалы и сечения нужно подтвердить расчётом нагрузок и испытаниями на макете. Здесь это исходный выбор.',{x:M,y:6.3,w:W-2*M,h:0.5,fontFace:F,fontSize:13,bold:true,color:C.dark,margin:0,isTextBox:true});
}

// 5 Manufacturability
{
  const s = base('Производственная реализуемость','Модуль C · технологичность');
  const c=[['Сварные основания','Резка профиля, сварка в кондукторе, порошковая покраска. Обычная слесарная технология, два типоразмера рам.','Риск: коробление рамы 2280 мм, нужен кондуктор и контроль плоскостности'],
   ['Панели защиты','Раскрой на ЧПУ или лазером из листа, единые пазы под замок. Один размер панели на несколько мест.','Риск: разная высота, нужен ряд кратных размеров'],
   ['Мягкие элементы','Вырубка из листа вспененного ПЭ, без оснастки под каждый узел.','Риск: усадка, износ, замена по регламенту'],
   ['Сборка и упаковка','Упаковка по карте: комплектовщик собирает место за одну смену без спецоснастки.','Риск: ошибки комплектации, нужен чек-лист']];
  c.forEach((it,i)=>{
    const x=M+(i%2)*6.15,y=1.8+Math.floor(i/2)*2.6;
    s.addShape(pres.shapes.RECTANGLE,{x,y,w:5.95,h:2.4,fill:{color:C.light},line:{color:C.light}});
    s.addText(it[0],{x:x+0.25,y:y+0.15,w:5.45,h:0.4,fontFace:F,fontSize:17,bold:true,color:C.dark,margin:0,isTextBox:true});
    s.addText(it[1],{x:x+0.25,y:y+0.65,w:5.45,h:0.95,fontFace:F,fontSize:13,color:C.mid,margin:0,valign:'top',isTextBox:true});
    s.addText(it[2],{x:x+0.25,y:y+1.6,w:5.45,h:0.7,fontFace:F,fontSize:12.5,bold:true,color:C.acc,margin:0,valign:'top',isTextBox:true});
  });
}

// 6 Nomenclature
{
  const s = base('Номенклатура: минимум разных деталей','Модуль C · унификация');
  const st=[['3','типа оснований'],['1','размер болта, M12'],['1','ключ на весь комплект'],['2','типоразмера панели защиты']];
  st.forEach((it,i)=>{
    const x=M+i*3.06;
    s.addShape(pres.shapes.RECTANGLE,{x,y:1.8,w:2.85,h:1.8,fill:{color:i%2?C.acc:C.dark},line:{color:i%2?C.acc:C.dark}});
    s.addText(it[0],{x:x+0.2,y:1.9,w:2.4,h:1.0,fontFace:F,fontSize:54,bold:true,color:C.white,margin:0,isTextBox:true});
    s.addText(it[1],{x:x+0.2,y:2.95,w:2.5,h:0.55,fontFace:F,fontSize:14,color:C.white,margin:0,valign:'top',isTextBox:true});
  });
  card(s,M,3.9,5.95,2.7,'Что общее',bullets(['Карманы под вилы и точки строповки на одних местах','Посадка защиты на основание одним типом замка','Цвет и формат маркировки','Сменные прокладки одного набора толщин']),{bs:13.5});
  card(s,M+6.15,3.9,5.98,2.7,'Что разное',bullets(['Несущая способность оснований кабины и противовеса','Форма защиты под геометрию узла','Уровень влагозащиты: пульт и двери строже','Способ фиксации: ремни, болты, хомуты']),{bs:13.5,fill:C.soft,hc:C.acc});
}

// 7 Module D: cabin cross-section
{
  const s = base('Габаритный чертёж: кабина в сечении кузова','Модуль D · чертёж');
  const k=0.0017, ox=M+0.7, oy=1.75;
  const tw=2450*k, th=2600*k;
  // truck section
  s.addShape(pres.shapes.RECTANGLE,{x:ox,y:oy,w:tw,h:th,fill:{color:C.white},line:{color:C.steel,width:2,dashType:'dash'}});
  const px=ox+(2450-2280)/2*k, pw=2280*k;
  const bot=oy+th;
  s.addShape(pres.shapes.RECTANGLE,{x:px,y:bot-150*k,w:pw,h:150*k,fill:{color:C.dark},line:{color:C.dark}});
  s.addShape(pres.shapes.RECTANGLE,{x:px,y:bot-2450*k,w:pw,h:2300*k,fill:{color:C.light},line:{color:C.mid,width:1.5}});
  s.addShape(pres.shapes.RECTANGLE,{x:px+(2280-2100)/2*k,y:bot-2450*k,w:2100*k,h:2300*k,fill:{color:'C9D1D6'},line:{color:C.mid,width:1}});
  s.addShape(pres.shapes.RECTANGLE,{x:px,y:bot-2500*k,w:pw,h:50*k,fill:{color:C.acc},line:{color:C.acc}});
  s.addText('кабина 2100 × 2300',{x:px,y:bot-1700*k,w:pw,h:0.4,fontFace:F,fontSize:12,bold:true,color:C.dark,align:'center',margin:0,isTextBox:true});
  s.addText('кузов 2450 × 2600 (номинал)',{x:ox,y:oy-0.32,w:tw,h:0.3,fontFace:F,fontSize:11,color:C.steel,align:'center',margin:0,isTextBox:true});
  // legend / dims
  const lx=ox+tw+0.5;
  table(s,[
    ['Размер','мм'],
    ['Изделие, высота','2300'],
    ['Основание с карманами под вилы','150'],
    ['Верхняя защита','50'],
    ['Упаковка, высота','2500'],
    ['Запас до 2600','100'],
    ['Упаковка, ширина','2280'],
    ['Запас по ширине, суммарно','170'],
  ],lx,1.8,W-M-lx,[3.4,1.2],{fs:13,rowH:0.44});
  s.addText('Запас 100 мм по высоте слишком мал для неровности пола и просадки подвески. Действие: уменьшать основание и верхнюю защиту, изделие не менять. Вариант: опустить изделие в основание, чтобы вернуть 30–50 мм.',{x:lx,y:5.5,w:W-M-lx,h:1.3,fontFace:F,fontSize:12.5,color:C.mid,margin:0,valign:'top',isTextBox:true});
}

// 8 Loading plan top view
{
  const s = base('План загрузки еврофуры: по длине запас 8,5 м','Модуль D · чертёж');
  const k=11.9/13600, ox=M, oy=2.3;
  s.addShape(pres.shapes.RECTANGLE,{x:ox,y:oy,w:13600*k,h:2450*k,fill:{color:C.white},line:{color:C.steel,width:2}});
  const items=[[100,85,1800,2280,'Кабина',C.dark],[2050,100,1100,2250,'Двери',C.mid],[3300,100,800,1400,'Противовес',C.dark],[4250,100,800,1000,'Лебёдка',C.mid],[4250,1200,800,700,'Пульт',C.acc]];
  items.forEach(([l,w0,len,wd,t,col])=>{
    s.addShape(pres.shapes.RECTANGLE,{x:ox+l*k,y:oy+w0*k,w:len*k,h:wd*k,fill:{color:col},line:{color:C.white,width:1}});
    s.addText(t,{x:ox+l*k-0.15,y:oy+w0*k,w:len*k+0.3,h:wd*k,fontFace:F,fontSize:8,bold:true,color:C.white,align:'center',valign:'middle',rotate:0,margin:0,isTextBox:true});
  });
  s.addText('вид сверху, масштаб 1:1140. Кабина занимает ширину 2280 из 2450',{x:ox,y:oy+2450*k+0.1,w:9,h:0.3,fontFace:F,fontSize:11,color:C.steel,margin:0,isTextBox:true});
  s.addText('занято ≈ 5,1 м',{x:ox+100*k,y:oy-0.4,w:5050*k,h:0.3,fontFace:F,fontSize:12,bold:true,color:C.dark,align:'center',margin:0,isTextBox:true});
  s.addText('свободно ≈ 8,5 м',{x:ox+5100*k,y:oy-0.4,w:8400*k,h:0.3,fontFace:F,fontSize:12,bold:true,color:C.ok,align:'center',margin:0,isTextBox:true});
  card(s,M,4.95,3.9,1.85,'Порядок выгрузки',bullets(['Пульт и лебёдка первыми (ближе к дверям)','Противовес, двери, кабина последней']),{bs:12.5});
  card(s,M+4.1,4.95,3.9,1.85,'Крепление',bullets(['Ремни на точки основания','Распорные брусья по бокам, зазоры 100 мм']),{bs:12.5});
  card(s,M+8.2,4.95,3.93,1.85,'Проверить',bullets(['Ось груза и нагрузка на оси','Реальную высоту кузова','Габарит на ж/д платформе']),{bs:12.5,fill:C.soft,hc:C.acc});
}

// 9 Cabin opening scheme
{
  const s = base('Схема вскрытия кабины: подхват раньше фиксаторов','Модуль D · разборка');
  const st=[['Осмотр','Проверить целостность плёнки и признаки удара или воды'],['Верх','Снять верхнюю панель защиты вдвоём, масса до 15 кг'],['Углы','Снять угловые стойки в порядке 1–4 по маркировке'],['Подхват','Завести стропы за точки подъёма, взять вес без рывка'],['Фиксаторы','Только теперь снять болты M12 с основания'],['Выгрузка','Поднять кабину краном, основание остаётся на месте']];
  st.forEach((it,i)=>{
    const x=M+i*2.05,y=2.0;
    s.addShape(pres.shapes.RECTANGLE,{x,y,w:1.9,h:0.85,fill:{color:i===3?C.acc:C.dark},line:{color:i===3?C.acc:C.dark}});
    s.addText((i+1)+'  '+it[0],{x:x+0.1,y,w:1.7,h:0.85,fontFace:F,fontSize:13,bold:true,color:C.white,valign:'middle',margin:0,isTextBox:true});
    s.addText(it[1],{x,y:3.05,w:1.9,h:1.6,fontFace:F,fontSize:12,color:C.mid,margin:0,valign:'top',isTextBox:true});
  });
  s.addShape(pres.shapes.RECTANGLE,{x:M,y:5.0,w:W-2*M,h:1.6,fill:{color:C.soft},line:{color:C.soft}});
  s.addText([{text:'Правило безопасности. ',options:{bold:true,color:C.acc}},{text:'Несущий фиксатор снимается только после подхвата. Масса каждого снимаемого вручную элемента должна быть указана на нём. Массу элементов надо будет подтвердить расчётом, значение 15 кг здесь ориентир.',options:{color:C.dark}}],{x:M+0.3,y:5.05,w:W-2*M-0.6,h:1.5,fontFace:F,fontSize:14,valign:'middle',margin:0,isTextBox:true});
}

// 10 Scenarios: production, transport, site
{
  const s = base('Схемы сборки и разборки по сценариям','Модуль D · сценарии');
  const c=[['Производство','Сборка места',['Основание на кондуктор','Фиксация узла болтами и ремнями','Прокладки и защита по карте','Замер брутто и габарита','Этикетка и чек-лист']],
   ['Транспортировка','Погрузка и крепление',['Захват за карманы или точки строповки','Расстановка по плану загрузки','Ремни и распорки','Проверка плёнки и меток','Акт состояния при приёмке']],
   ['Место установки','Вскрытие и выдача',['Приёмка и сверка мест','Вскрытие в порядке 1–6','Выдача по очереди монтажа','Защита снимается перед установкой','Тара разбирается и складывается']]];
  c.forEach((it,i)=>{
    const x=M+i*4.1;
    s.addShape(pres.shapes.RECTANGLE,{x,y:1.8,w:3.9,h:0.9,fill:{color:i===2?C.acc:C.dark},line:{color:i===2?C.acc:C.dark}});
    s.addText(it[0],{x:x+0.25,y:1.85,w:3.4,h:0.4,fontFace:F,fontSize:18,bold:true,color:C.white,margin:0,isTextBox:true});
    s.addText(it[1],{x:x+0.25,y:2.25,w:3.4,h:0.35,fontFace:F,fontSize:13,color:C.white,margin:0,isTextBox:true});
    s.addShape(pres.shapes.RECTANGLE,{x,y:2.7,w:3.9,h:3.9,fill:{color:C.light},line:{color:C.light}});
    it[2].forEach((t,j)=>{
      const y=2.9+j*0.72;
      s.addShape(pres.shapes.OVAL,{x:x+0.25,y:y+0.05,w:0.45,h:0.45,fill:{color:C.steel},line:{color:C.steel}});
      s.addText(String(j+1),{x:x+0.25,y:y+0.05,w:0.45,h:0.45,fontFace:F,fontSize:13,bold:true,color:C.white,align:'center',valign:'middle',margin:0,isTextBox:true});
      s.addText(t,{x:x+0.9,y,w:2.85,h:0.55,fontFace:F,fontSize:12.5,color:C.dark,valign:'middle',margin:0,isTextBox:true});
    });
  });
}

// 11 Marking
{
  const s = base('Маркировка: пять полей на каждом месте','Модуль D · знаки');
  s.addShape(pres.shapes.RECTANGLE,{x:M,y:1.8,w:5.6,h:4.7,fill:{color:C.white},line:{color:C.dark,width:2}});
  s.addShape(pres.shapes.RECTANGLE,{x:M,y:1.8,w:5.6,h:1.0,fill:{color:C.dark},line:{color:C.dark}});
  s.addText('К-01',{x:M+0.25,y:1.8,w:2.2,h:1.0,fontFace:F,fontSize:40,bold:true,color:C.white,valign:'middle',margin:0,isTextBox:true});
  s.addText('КАБИНА · место 1 из 5',{x:M+2.5,y:1.8,w:3.0,h:1.0,fontFace:F,fontSize:14,bold:true,color:C.acc,valign:'middle',margin:0,isTextBox:true});
  const rows=[['Масса брутто','≈ ___ кг (по факту взвешивания)'],['Верх ↑ / центр тяжести ⊕','пиктограммы по ISO 780'],['Точки строповки','4 шт., отмечены оранжевым'],['Порядок вскрытия','1 → 6, схема на боковой стороне'],['Содержимое','кабина, панели, комплект крепежа']];
  rows.forEach((r,i)=>{
    const y=3.0+i*0.68;
    s.addText(r[0],{x:M+0.25,y,w:2.3,h:0.6,fontFace:F,fontSize:12,bold:true,color:C.dark,valign:'middle',margin:0,isTextBox:true});
    s.addText(r[1],{x:M+2.55,y,w:2.95,h:0.6,fontFace:F,fontSize:12,color:C.mid,valign:'middle',margin:0,isTextBox:true});
  });
  card(s,6.6,1.8,6.13,2.2,'Правила размещения',bullets(['Метка на трёх видимых сторонах, не на съёмных панелях','Код узла крупно, читается с 3 м','Цвет: оранжевый только для точек подъёма и опасных зон']),{bs:13});
  card(s,6.6,4.2,6.13,2.3,'Что получит монтажник',bullets(['Код места совпадает с кодом узла на схеме сборки','Стрелка порядка вскрытия и знак «не снимать до подхвата»','Знаки безопасности и подробная схема, модуль E']),{bs:13,fill:C.soft,hc:C.acc});
}

// 12 Next
{
  const s = pres.addSlide(); n++;
  s.background={color:C.dark};
  s.addText('Итоги C–D и переход к E–G',{x:0.8,y:0.7,w:11,h:0.9,fontFace:F,fontSize:36,bold:true,color:C.white,margin:0,isTextBox:true});
  const t=[['Готово','Конструктор из трёх оснований, материалы, чертёж кабины в сечении, план загрузки, схемы по сценариям'],['Главный риск','Запас по высоте кабины 100 мм. Уменьшать основание или опускать изделие, не менять габарит изделия'],['Нужно уточнить','Данные изготовителя: точки строповки, ориентацию противовеса, размеры дверей и пульта'],['Дальше','E: знаки безопасности и визуальная коммуникация. F: сборка финальной презентации. G: защита проекта']];
  t.forEach((it,i)=>{
    const x=0.8+(i%2)*6.0,y=2.0+Math.floor(i/2)*2.2;
    s.addText(it[0],{x,y,w:5.6,h:0.45,fontFace:F,fontSize:18,bold:true,color:C.acc,margin:0,isTextBox:true});
    s.addText(it[1],{x,y:y+0.5,w:5.5,h:1.4,fontFace:F,fontSize:15,color:C.white,margin:0,valign:'top',isTextBox:true});
  });
}
pres.writeFile({fileName:'lift-packaging-CD.pptx'}).then(()=>console.log('ok'));
