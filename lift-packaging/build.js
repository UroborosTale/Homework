const pptxgen = require('pptxgenjs');
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5
pres.title = 'Транспортно-монтажная упаковка комплекта лифта «Воздух»';
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
  s.addText('ПРОМЫШЛЕННЫЙ ДИЗАЙН · МОДУЛИ A–B',{x:0.8,y:1.2,w:10,h:0.4,fontFace:F,fontSize:14,bold:true,color:C.acc,charSpacing:3,margin:0,isTextBox:true});
  s.addText('Транспортно-монтажная упаковка комплекта лифта «Воздух»',{x:0.8,y:1.8,w:9.2,h:2.2,fontFace:F,fontSize:44,bold:true,color:C.white,margin:0,valign:'top',isTextBox:true});
  s.addText('Анализ задачи, пользователей и сценариев · концептуальный поиск · выбор направления',{x:0.8,y:4.3,w:8.5,h:0.9,fontFace:F,fontSize:18,color:'C9D1D6',margin:0,valign:'top',isTextBox:true});
  s.addText('Ершов Е.М., ПИ 4-1',{x:0.8,y:6.4,w:6,h:0.4,fontFace:F,fontSize:14,color:'C9D1D6',margin:0,isTextBox:true});
  // motif: packed modules
  const bx=[[10.0,4.6,2.4,2.0],[10.0,2.4,1.1,2.0],[11.3,2.4,1.1,2.0],[10.0,1.0,2.4,1.2]];
  bx.forEach(([x,y,w,h],i)=>s.addShape(pres.shapes.RECTANGLE,{x,y,w,h,fill:{color:i===0?C.acc:C.mid},line:{color:C.steel,width:1}}));
}

// 2 Task
{
  const s = base('Не тара, а система от комплектации до монтажа','Задача');
  table(s,[
    ['Компонент','Габариты, мм','Масса'],
    ['Кабина','2100 × 1600 × 2300','≈ 600 кг'],
    ['Двери шахты, 4 шт.','900 × 2100 каждая','≈ 80 кг каждая'],
    ['Лебёдка','800 × 600 × 500','≈ 350 кг'],
    ['Противовес','1200 × 600 × 2200','≈ 400 кг'],
    ['Пульт управления','600 × 400 × 200','не указана'],
  ],M,1.9,7.2,[2.8,2.8,1.6],{fs:14,rowH:0.55});
  s.addText('Защита при ж/д и авто-перевозке, удобное вскрытие, перемещение узлов на площадке, меньше типоразмеров, повторное применение или утилизация.',{x:M,y:5.5,w:7.2,h:1.0,fontFace:F,fontSize:14,color:C.mid,margin:0,valign:'top',isTextBox:true});
  s.addShape(pres.shapes.RECTANGLE,{x:8.4,y:1.9,w:4.3,h:2.2,fill:{color:C.dark},line:{color:C.dark}});
  s.addText('≈ 1670 кг',{x:8.6,y:2.05,w:3.9,h:1.0,fontFace:F,fontSize:44,bold:true,color:C.white,margin:0,isTextBox:true});
  s.addText('масса компонентов без пульта и упаковки',{x:8.6,y:3.05,w:3.9,h:0.8,fontFace:F,fontSize:14,color:'C9D1D6',margin:0,valign:'top',isTextBox:true});
  s.addShape(pres.shapes.RECTANGLE,{x:8.4,y:4.3,w:4.3,h:2.2,fill:{color:C.acc},line:{color:C.acc}});
  s.addText('13,6 × 2,45 × 2,6 м',{x:8.6,y:4.45,w:3.9,h:0.8,fontFace:F,fontSize:28,bold:true,color:C.white,margin:0,isTextBox:true});
  s.addText('еврофура: у кабины высотой 2,3 м номинальный запас только 300 мм',{x:8.6,y:5.3,w:3.9,h:1.0,fontFace:F,fontSize:14,color:C.white,margin:0,valign:'top',isTextBox:true});
}

// 3 Requirements
{
  const s = base('Семь требований по приоритету','Требования');
  const r=[['1','Защита и фиксация','Нет смещения, опрокидывания, контакта деталей; влага и пыль; вибрация и удары'],
   ['2','Безопасная работа с тяжёлым','Точки строповки и захвата, центр тяжести, без ручной переноски кабины и противовеса'],
   ['3','Понятная распаковка','Доступ к крепежу, маркировка порядка открытия и ориентации'],
   ['4','Монтажная логика','Узлы выдаются в порядке монтажа, упаковка не блокирует доступ'],
   ['5','Стандартизация','Меньше панелей, опор и крепежа при разных уровнях защиты'],
   ['6','Повторное использование','Разборность, ремонтопригодность, сортировка материалов, компактное хранение'],
   ['7','Логистика','Габариты, масса брутто, размещение в кузове, точки крепления, погрузка']];
  r.forEach((it,i)=>{
    const col=i<4?0:1, row=i<4?i:i-4;
    const x=M+col*6.15, y=1.8+row*1.25;
    s.addShape(pres.shapes.OVAL,{x,y:y+0.1,w:0.6,h:0.6,fill:{color:i<2?C.acc:C.dark},line:{color:i<2?C.acc:C.dark}});
    s.addText(it[0],{x,y:y+0.1,w:0.6,h:0.6,fontFace:F,fontSize:18,bold:true,color:C.white,align:'center',valign:'middle',margin:0,isTextBox:true});
    s.addText(it[1],{x:x+0.8,y,w:5.1,h:0.35,fontFace:F,fontSize:16,bold:true,color:C.dark,margin:0,isTextBox:true});
    s.addText(it[2],{x:x+0.8,y:y+0.38,w:5.1,h:0.7,fontFace:F,fontSize:13,color:C.mid,margin:0,valign:'top',isTextBox:true});
  });
}

// 4 Users
{
  const s = base('Пользователи: приоритет у монтажников и логистики','Группы пользователей');
  table(s,[
    ['Группа','Задача','Что нужно от упаковки'],
    ['Производство и комплектовщики','Упаковать комплект без ошибок','Быстрая сборка тары, повторяемая схема, контроль комплектации'],
    ['Склад и погрузчики','Переместить и загрузить','Устойчивое основание, доступ вил, масса и центр тяжести, точки строповки'],
    ['Перевозчики авто и ж/д','Сохранить груз в пути','Надёжная фиксация, защита от ударов, вибрации и влаги'],
    ['Приёмка на объекте','Проверить состояние и комплект','Идентификация мест, видимые повреждения, перечень содержимого'],
    ['Монтажная бригада','Извлечь и установить узлы','Быстрый доступ, последовательная маркировка, понятное снятие фиксаторов'],
    ['Охрана труда','Предотвратить травмы','Предупреждения, безопасный порядок вскрытия, опасные зоны'],
    ['Закупки и логистика','Снизить стоимость','Минимум типоразмеров, доступные материалы, заполнение кузова'],
    ['Экология и утилизация','Сократить отходы','Разделяемые материалы, маркировка материалов'],
  ],M,1.7,W-2*M,[3.1,3.0,6.03],{fs:12,rowH:0.52});
}

// 5 Analogs
{
  const s = base('Аналоги: у каждого решения своя слабость','Текущие решения');
  const a=[['Деревянный ящик или обрешётка','Жёсткая защита, простота','Много древесины, неудобное вскрытие, после монтажа отход'],
   ['Паллеты и отдельные короба','Удобны для погрузчика, раздельная выдача','Много мест, риск потери мелочи, сложнее контроль комплекта'],
   ['Плёнка и мягкие прокладки','Быстро и дёшево, защита от грязи и царапин','Не защищают тяжёлые узлы от удара, сдавливания и смещения'],
   ['Возвратная многооборотная тара','Меньше одноразовых материалов','Нужна обратная логистика, склад, стандартные маршруты']];
  a.forEach((it,i)=>{
    const x=M+i*3.06;
    s.addShape(pres.shapes.RECTANGLE,{x,y:1.8,w:2.85,h:3.6,fill:{color:C.light},line:{color:C.light}});
    s.addText(it[0],{x:x+0.2,y:1.95,w:2.45,h:0.8,fontFace:F,fontSize:15,bold:true,color:C.dark,margin:0,valign:'top',isTextBox:true});
    s.addText('Плюс',{x:x+0.2,y:2.8,w:2.45,h:0.25,fontFace:F,fontSize:11,bold:true,color:C.ok,margin:0,isTextBox:true});
    s.addText(it[1],{x:x+0.2,y:3.05,w:2.45,h:0.9,fontFace:F,fontSize:12,color:C.mid,margin:0,valign:'top',isTextBox:true});
    s.addText('Минус',{x:x+0.2,y:4.0,w:2.45,h:0.25,fontFace:F,fontSize:11,bold:true,color:C.acc,margin:0,isTextBox:true});
    s.addText(it[2],{x:x+0.2,y:4.25,w:2.45,h:1.05,fontFace:F,fontSize:12,color:C.mid,margin:0,valign:'top',isTextBox:true});
  });
  s.addShape(pres.shapes.RECTANGLE,{x:M,y:5.7,w:W-2*M,h:1.0,fill:{color:C.dark},line:{color:C.dark}});
  s.addText('Вывод: исследовать гибрид, то есть общие стандартные основания и защитные элементы плюс специальные фиксаторы для хрупких и тяжёлых узлов.',{x:M+0.3,y:5.75,w:W-2*M-0.6,h:0.9,fontFace:F,fontSize:15,bold:true,color:C.white,margin:0,valign:'middle',isTextBox:true});
}

// 6 Contradictions
{
  const s = base('Проектная ситуация: пять противоречий','Анализ');
  const p=[['Защита ↔ масса и объём','Максимум защиты против минимума упаковки'],
   ['Унификация ↔ геометрия','Общие элементы против разных размеров и масс узлов'],
   ['Плотная загрузка ↔ доступ','Компактный кузов против удобного доступа на объекте'],
   ['Одноразовость ↔ возврат','Простота против обратной логистики'],
   ['Быстрая распаковка ↔ жёсткость','Скорость против безопасности до последнего этапа']];
  p.forEach((it,i)=>{
    const y=1.8+i*0.95;
    s.addShape(pres.shapes.RECTANGLE,{x:M,y,w:6.6,h:0.8,fill:{color:C.light},line:{color:C.light}});
    s.addText(it[0],{x:M+0.2,y:y+0.05,w:6.2,h:0.35,fontFace:F,fontSize:15,bold:true,color:C.dark,margin:0,isTextBox:true});
    s.addText(it[1],{x:M+0.2,y:y+0.4,w:6.2,h:0.35,fontFace:F,fontSize:12,color:C.mid,margin:0,isTextBox:true});
  });
  card(s,7.6,1.8,5.13,4.6,'Что уточнить до фиксации концепции',bullets([
    'Можно ли менять ориентацию при перевозке','Допустимо ли штабелирование','Где разрешённые точки захвата и строповки','Какие поверхности нельзя нагружать','Нужна ли влагозащита и какая','Возврат тары и обратный рейс','Ограничения объекта: шахта, проёмы, кран','Точная масса пульта и упаковки']),{fill:C.dark,hc:C.white,bc:'E4E8EA',bs:13});
}

// 7 Scenarios chain
{
  const s = base('Цепочка от комплектации до возврата тары','Сценарии использования');
  const st=[['А','Комплектация','Сверка списка, маркированные места, фиксация тяжёлых узлов, проверка массы и габарита'],
   ['Б','Погрузка и перевозка','Захват только за зоны, крепление по массе и центру тяжести'],
   ['В','Приёмка и распаковка','Идентификация мест, снятие фиксаторов по порядку, механизированная выгрузка'],
   ['Г','Монтаж','Подача по очереди монтажа, защита снимается перед использованием'],
   ['Д','Возврат или утилизация','Складывание, ремонт, сортировка по материалам']];
  st.forEach((it,i)=>{
    const x=M+i*2.45;
    s.addShape(pres.shapes.RECTANGLE,{x,y:2.0,w:2.25,h:0.9,fill:{color:i===2||i===3?C.acc:C.dark},line:{color:i===2||i===3?C.acc:C.dark}});
    s.addText(it[0]+'  '+it[1],{x:x+0.1,y:2.0,w:2.05,h:0.9,fontFace:F,fontSize:14,bold:true,color:C.white,valign:'middle',margin:0,isTextBox:true});
    s.addText(it[2],{x,y:3.1,w:2.25,h:2.0,fontFace:F,fontSize:12.5,color:C.mid,margin:0,valign:'top',isTextBox:true});
    if(i<4) s.addText('›',{x:x+2.22,y:2.1,w:0.25,h:0.7,fontFace:F,fontSize:26,bold:true,color:C.steel,align:'center',margin:0,isTextBox:true});
  });
  s.addText('Критические точки: упаковочный габарит кабины, фиксация тяжёлых узлов, безопасность вскрытия, механизированный подъём, порядок выдачи монтажникам.',{x:M,y:5.5,w:W-2*M,h:0.9,fontFace:F,fontSize:15,bold:true,color:C.dark,margin:0,valign:'top',isTextBox:true});
}

// 8 Three directions
{
  const s = base('Модуль B: три направления концепции','Концептуальный поиск');
  const d=[['А','Отдельные закрытые ящики','Понятная защита, простое изготовление','Много материала, трудоёмкое вскрытие, ящик мешает доступу, больше отходов',false],
   ['Б','Открытые многооборотные рамы','Доступность узла, ремонтопригодность, повторное использование','Грязь и влага, обратная логистика, масса и цена рамы',false],
   ['В','Модульная гибридная система','Защита по риску каждого узла, основание служит средством перемещения, унификация крепежа','Сложные соединения, риск избытка переходников',true]];
  d.forEach((it,i)=>{
    const x=M+i*4.1, hl=it[4];
    s.addShape(pres.shapes.RECTANGLE,{x,y:1.8,w:3.9,h:4.9,fill:{color:hl?C.dark:C.light},line:{color:hl?C.acc:C.light,width:hl?3:0.75}});
    s.addText('Направление '+it[0],{x:x+0.25,y:1.95,w:3.4,h:0.3,fontFace:F,fontSize:12,bold:true,color:C.acc,margin:0,isTextBox:true});
    s.addText(it[1],{x:x+0.25,y:2.3,w:3.4,h:0.9,fontFace:F,fontSize:19,bold:true,color:hl?C.white:C.dark,margin:0,valign:'top',isTextBox:true});
    s.addText('Плюсы',{x:x+0.25,y:3.3,w:3.4,h:0.3,fontFace:F,fontSize:12,bold:true,color:hl?'8FD3B0':C.ok,margin:0,isTextBox:true});
    s.addText(it[2],{x:x+0.25,y:3.6,w:3.4,h:1.3,fontFace:F,fontSize:13,color:hl?'E4E8EA':C.mid,margin:0,valign:'top',isTextBox:true});
    s.addText('Минусы',{x:x+0.25,y:5.0,w:3.4,h:0.3,fontFace:F,fontSize:12,bold:true,color:hl?'FFB58A':C.acc,margin:0,isTextBox:true});
    s.addText(it[3],{x:x+0.25,y:5.3,w:3.4,h:1.3,fontFace:F,fontSize:13,color:hl?'E4E8EA':C.mid,margin:0,valign:'top',isTextBox:true});
  });
}

// 9 Chosen concept diagram
{
  const s = base('Выбрано В: «основание + фиксация + съёмная защита»','Концепция');
  // layered diagram
  s.addShape(pres.shapes.RECTANGLE,{x:1.0,y:1.9,w:4.6,h:1.5,fill:{color:C.soft},line:{color:C.acc,width:1.5,dashType:'dash'}});
  s.addText('съёмная защита (под каждый узел)',{x:1.0,y:1.9,w:4.6,h:1.5,fontFace:F,fontSize:14,bold:true,color:C.acc,align:'center',valign:'top',margin:[0.1,0,0,0],isTextBox:true});
  s.addShape(pres.shapes.RECTANGLE,{x:1.8,y:2.4,w:3.0,h:0.85,fill:{color:C.mid},line:{color:C.mid}});
  s.addText('УЗЕЛ',{x:1.8,y:2.4,w:3.0,h:0.85,fontFace:F,fontSize:16,bold:true,color:C.white,align:'center',valign:'middle',margin:0,isTextBox:true});
  s.addShape(pres.shapes.RECTANGLE,{x:1.2,y:3.4,w:0.3,h:0.5,fill:{color:C.steel},line:{color:C.steel}});
  s.addShape(pres.shapes.RECTANGLE,{x:5.1,y:3.4,w:0.3,h:0.5,fill:{color:C.steel},line:{color:C.steel}});
  s.addText('фиксаторы',{x:1.6,y:3.45,w:3.4,h:0.4,fontFace:F,fontSize:13,color:C.steel,align:'center',margin:0,isTextBox:true});
  s.addShape(pres.shapes.RECTANGLE,{x:1.0,y:3.9,w:4.6,h:0.7,fill:{color:C.dark},line:{color:C.dark}});
  s.addText('типовое основание',{x:1.0,y:3.9,w:4.6,h:0.7,fontFace:F,fontSize:15,bold:true,color:C.white,align:'center',valign:'middle',margin:0,isTextBox:true});
  s.addText('зоны захвата: вилы и стропы',{x:1.0,y:4.7,w:4.6,h:0.35,fontFace:F,fontSize:13,color:C.steel,align:'center',margin:0,isTextBox:true});
  s.addText('Два режима работы',{x:6.4,y:1.9,w:6.3,h:0.4,fontFace:F,fontSize:18,bold:true,color:C.dark,margin:0,isTextBox:true});
  s.addText([
    {text:'Транспорт: ',options:{bold:true,color:C.dark}},{text:'удерживать узлы, защищать, позволять закрепить груз в авто и на ж/д',options:{breakLine:true}},
    {text:'Монтаж: ',options:{bold:true,color:C.dark}},{text:'открываться предсказуемо, давать доступ к одному узлу, сохранять защиту остальных'}
  ],{x:6.4,y:2.4,w:6.3,h:1.5,fontFace:F,fontSize:14,color:C.mid,margin:0,valign:'top',paraSpaceAfter:8,isTextBox:true});
  s.addText('Почему выбрано',{x:6.4,y:4.0,w:6.3,h:0.4,fontFace:F,fontSize:18,bold:true,color:C.dark,margin:0,isTextBox:true});
  s.addText('Лучше остальных решает две главные задачи: сохранить оборудование в пути и безопасно выдать его монтажникам. Комплект не сводится в один ящик: пять маркированных мест на общей конструктивной логике.',{x:6.4,y:4.45,w:6.3,h:1.8,fontFace:F,fontSize:14,color:C.mid,margin:0,valign:'top',isTextBox:true});
}

// 10 Per-component
{
  const s = base('Решения по узлам','Эскизные решения');
  const c=[['Кабина','Свой каркас-основание, фиксация за конструктивные точки, съёмные угловые и верхние защиты. Габарит упаковки ≈ 2280 × 1800 × 2500 мм.'],
   ['Двери (4 шт.)','Отдельная кассета с разделителями и защитой кромок, извлечение по одной. Габарит ≈ 2250 × 1100 мм, высота не назначена. Комплект ≈ 320 кг.'],
   ['Лебёдка','Низкий силовой поддон, локальная защита выступов. Кожух снимается, не ослабляя крепление лебёдки. ≈ 350 кг.'],
   ['Противовес','Устойчивый вертикальный модуль, широкое основание против опрокидывания, верхняя фиксация до подхвата. Ориентацию подтвердить у изготовителя.'],
   ['Пульт','Отдельное закрытое место: защита от влаги и ударов, кабели и документация вместе. Не прятать в полости другого узла.']];
  c.forEach((it,i)=>{
    const col=i%3,row=Math.floor(i/3);
    const x=M+col*4.1,y=1.8+row*2.55;
    card(s,x,y,3.9,2.35,it[0],it[1],{bs:12.5,fill:i===0?C.dark:C.light,hc:i===0?C.white:C.dark,bc:i===0?'E4E8EA':C.mid});
  });
  s.addShape(pres.shapes.RECTANGLE,{x:M+2*4.1,y:1.8+2.55,w:3.9,h:2.35,fill:{color:C.soft},line:{color:C.soft}});
  s.addText('Принцип: нагрузку несёт основание, декоративные панели не нагружаются',{x:M+2*4.1+0.25,y:1.8+2.55,w:3.4,h:2.35,fontFace:F,fontSize:15,bold:true,color:C.acc,valign:'middle',margin:0,isTextBox:true});
}

// 11 Dimensions
{
  const s = base('Главный размерный риск: кабина в еврофуре','Функциональная проверка');
  // width bar
  const x0=M, full=7.6, sc=full/2450;
  s.addText('Ширина, мм',{x:x0,y:1.9,w:4,h:0.3,fontFace:F,fontSize:13,bold:true,color:C.dark,margin:0,isTextBox:true});
  s.addShape(pres.shapes.RECTANGLE,{x:x0,y:2.3,w:full,h:0.6,fill:{color:C.line},line:{color:C.line}});
  s.addShape(pres.shapes.RECTANGLE,{x:x0,y:2.3,w:2280*sc,h:0.6,fill:{color:C.acc},line:{color:C.acc}});
  s.addShape(pres.shapes.RECTANGLE,{x:x0,y:2.3,w:2100*sc,h:0.6,fill:{color:C.dark},line:{color:C.dark}});
  s.addText('изделие 2100',{x:x0+0.1,y:2.3,w:2,h:0.6,fontFace:F,fontSize:12,bold:true,color:C.white,valign:'middle',margin:0,isTextBox:true});
  s.addText('упаковка 2280 из 2450: запас 170 мм',{x:x0,y:2.95,w:full,h:0.35,fontFace:F,fontSize:12,color:C.mid,margin:0,isTextBox:true});
  // height bar
  s.addText('Высота, мм',{x:x0,y:3.7,w:4,h:0.3,fontFace:F,fontSize:13,bold:true,color:C.dark,margin:0,isTextBox:true});
  const sh=7.6/2600;
  s.addShape(pres.shapes.RECTANGLE,{x:x0,y:4.1,w:full,h:0.6,fill:{color:C.line},line:{color:C.line}});
  s.addShape(pres.shapes.RECTANGLE,{x:x0,y:4.1,w:2500*sh,h:0.6,fill:{color:C.acc},line:{color:C.acc}});
  s.addShape(pres.shapes.RECTANGLE,{x:x0,y:4.1,w:2300*sh,h:0.6,fill:{color:C.dark},line:{color:C.dark}});
  s.addText('изделие 2300',{x:x0+0.1,y:4.1,w:2,h:0.6,fontFace:F,fontSize:12,bold:true,color:C.white,valign:'middle',margin:0,isTextBox:true});
  s.addText('упаковка 2500 из 2600: запас 100 мм',{x:x0,y:4.75,w:full,h:0.35,fontFace:F,fontSize:12,color:C.mid,margin:0,isTextBox:true});
  s.addText('Замки, ремни и защита должны входить в заявленный габарит. Высоту проёма и полезную высоту конкретной машины нужно замерить. Если запас мал, пересматривать основание и верхнюю защиту, а не габариты изделия.',{x:x0,y:5.4,w:full,h:1.3,fontFace:F,fontSize:13.5,color:C.mid,margin:0,valign:'top',isTextBox:true});
  s.addShape(pres.shapes.RECTANGLE,{x:8.8,y:1.9,w:3.93,h:2.2,fill:{color:C.dark},line:{color:C.dark}});
  s.addText('100 мм',{x:9.0,y:2.05,w:3.5,h:1.0,fontFace:F,fontSize:48,bold:true,color:C.acc,margin:0,isTextBox:true});
  s.addText('запас по высоте на основание, защиту и зазоры',{x:9.0,y:3.05,w:3.5,h:0.9,fontFace:F,fontSize:14,color:C.white,margin:0,valign:'top',isTextBox:true});
  card(s,8.8,4.3,3.93,2.4,'Не доказано',bullets(['Схема загрузки пяти мест на 13,6 м','Зазоры для крепления','Порядок выгрузки']),{fill:C.soft,hc:C.acc,bs:13});
}

// 12 Unification
{
  const s = base('Унифицируем интерфейсы, а не размеры ящиков','Стандартизация');
  const u=['Принцип основания и расположение зон захвата','Тип соединения съёмной защиты с основанием','Ограниченная номенклатура крепежа','Сменные мягкие прокладки для контакта с изделием','Маркировка: код узла, масса брутто, верх/низ, порядок открытия, точки подъёма','Разборка и складывание ненужных после монтажа элементов'];
  u.forEach((t,i)=>{
    const col=i%2,row=Math.floor(i/2);
    const x=M+col*3.5,y=1.8+row*1.55;
    s.addShape(pres.shapes.RECTANGLE,{x,y,w:3.3,h:1.35,fill:{color:C.light},line:{color:C.light}});
    s.addText(t,{x:x+0.2,y,w:2.9,h:1.35,fontFace:F,fontSize:13,color:C.dark,valign:'middle',margin:0,isTextBox:true});
  });
  s.addShape(pres.shapes.RECTANGLE,{x:7.9,y:1.8,w:4.83,h:4.45,fill:{color:C.dark},line:{color:C.dark}});
  s.addText('Граница унификации',{x:8.2,y:2.0,w:4.2,h:0.4,fontFace:F,fontSize:18,bold:true,color:C.acc,margin:0,isTextBox:true});
  s.addText('Силовые основания кабины и противовеса нельзя считать одинаковыми без расчёта.',{x:8.2,y:2.6,w:4.2,h:1.6,fontFace:F,fontSize:17,bold:true,color:C.white,margin:0,valign:'top',isTextBox:true});
  s.addText('Унификация интерфейса допустима. Унификация несущей способности «по аналогии» недопустима.',{x:8.2,y:4.3,w:4.2,h:1.7,fontFace:F,fontSize:14,color:'C9D1D6',margin:0,valign:'top',isTextBox:true});
}

// 13 Ergonomics
{
  const s = base('Эргономическая проверка по сценариям','Эргономика');
  table(s,[
    ['Операция','Проблема','Решение в концепции','Проверить на макете'],
    ['Найти узел','Маркировка закрыта соседним грузом','Код узла на нескольких видимых сторонах','Читается ли после загрузки'],
    ['Поднять упаковку','Неясно, куда вилы и стропы','Выделенные зоны захвата и точки подъёма','Доступны ли при реальной расстановке'],
    ['Открыть защиту','Тяжёлая панель в руках','Управляемые съёмные элементы, порядок снятия','Масса элемента, нужен ли второй работник'],
    ['Ослабить фиксацию','Узел смещается или опрокидывается','Сначала подхват, потом снятие фиксаторов','Доступ к крепежу вне опасной зоны'],
    ['Извлечь дверь','Остальные теряют опору','Независимые разделители и фиксаторы','Устойчивость кассеты после извлечения'],
    ['Убрать пустую тару','Крупные элементы перекрывают проход','Разборка и компактное складирование','Объём сложенной тары, время разборки'],
  ],M,1.7,W-2*M,[2.2,3.0,3.9,3.03],{fs:12,rowH:0.62});
  s.addText('Последовательность задаётся конструкцией, нумерацией операций и видимыми обозначениями, а не догадкой пользователя.',{x:M,y:6.3,w:W-2*M,h:0.5,fontFace:F,fontSize:13,bold:true,color:C.dark,margin:0,isTextBox:true});
}

// 14 Assembly suitability
{
  const s = base('Монтажная пригодность: шесть шагов','Функциональная проверка');
  const st=['Принять и идентифицировать все места','Подготовить подъёмное оборудование','Снять защиту без потери устойчивости узла','Поочерёдно извлечь компоненты','Сохранить защиту неиспользуемых деталей','Разобрать или вернуть тару'];
  st.forEach((t,i)=>{
    const x=M+(i%3)*4.1,y=1.9+Math.floor(i/3)*1.9;
    s.addShape(pres.shapes.RECTANGLE,{x,y,w:3.9,h:1.6,fill:{color:C.light},line:{color:C.light}});
    s.addShape(pres.shapes.OVAL,{x:x+0.2,y:y+0.2,w:0.6,h:0.6,fill:{color:i===2?C.acc:C.dark},line:{color:i===2?C.acc:C.dark}});
    s.addText(String(i+1),{x:x+0.2,y:y+0.2,w:0.6,h:0.6,fontFace:F,fontSize:18,bold:true,color:C.white,align:'center',valign:'middle',margin:0,isTextBox:true});
    s.addText(t,{x:x+1.0,y:y+0.1,w:2.7,h:1.4,fontFace:F,fontSize:15,bold:true,color:C.dark,valign:'middle',margin:0,isTextBox:true});
  });
  s.addShape(pres.shapes.RECTANGLE,{x:M,y:5.8,w:W-2*M,h:0.9,fill:{color:C.soft},line:{color:C.soft}});
  s.addText('Если шаг требует снять несущий фиксатор раньше, чем узел надёжно подхвачен, конструкцию нужно переработать.',{x:M+0.3,y:5.8,w:W-2*M-0.6,h:0.9,fontFace:F,fontSize:15,bold:true,color:C.acc,valign:'middle',margin:0,isTextBox:true});
}

// 15 Next
{
  const s = pres.addSlide(); n++;
  s.background={color:C.dark};
  s.addText('Следующий этап: модуль C',{x:0.8,y:0.7,w:11,h:0.9,fontFace:F,fontSize:36,bold:true,color:C.white,margin:0,isTextBox:true});
  const t=['3D-компоновка упакованных узлов в габарите еврофуры','Реальный габарит кабины с основанием и верхней защитой','Несущие основания и фиксаторы кабины, лебёдки, противовеса','Кассета дверей с безопасным извлечением одной двери','Сценарий разборки: что, кем и в каком порядке','Номенклатура материалов, крепежа и возвратных деталей'];
  t.forEach((x,i)=>{
    const col=i%2,row=Math.floor(i/2);
    const px=0.8+col*6.0,py=2.0+row*1.3;
    s.addShape(pres.shapes.OVAL,{x:px,y:py,w:0.6,h:0.6,fill:{color:C.acc},line:{color:C.acc}});
    s.addText(String(i+1),{x:px,y:py,w:0.6,h:0.6,fontFace:F,fontSize:18,bold:true,color:C.white,align:'center',valign:'middle',margin:0,isTextBox:true});
    s.addText(x,{x:px+0.85,y:py-0.1,w:4.8,h:0.8,fontFace:F,fontSize:15,color:C.white,valign:'middle',margin:0,isTextBox:true});
  });
  s.addText('Безопасность и соответствие габаритам подтверждаются расчётами, чертежами и проверкой на макете, а не эскизом.',{x:0.8,y:6.1,w:11.5,h:0.7,fontFace:F,fontSize:14,color:'C9D1D6',margin:0,valign:'top',isTextBox:true});
}
pres.writeFile({fileName:'lift-packaging.pptx'}).then(()=>console.log('ok'));
