const pptxgen = require('pptxgenjs');
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5
pres.title = 'Транспортно-монтажная упаковка лифта «Воздух»: защита проекта';
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


{
  const s = pres.addSlide(); n++;
  s.background={color:C.dark};
  s.addText('ПРОМЫШЛЕННЫЙ ДИЗАЙН · ЗАЩИТА ПРОЕКТА',{x:0.8,y:1.2,w:10,h:0.4,fontFace:F,fontSize:14,bold:true,color:C.acc,charSpacing:3,margin:0,isTextBox:true});
  s.addText('Транспортно-монтажная упаковка комплекта лифта «Воздух»',{x:0.8,y:1.8,w:9.2,h:2.2,fontFace:F,fontSize:44,bold:true,color:C.white,margin:0,valign:'top',isTextBox:true});
  s.addText('Модульная гибридная система: основание, фиксация, съёмная защита',{x:0.8,y:4.3,w:8.5,h:0.9,fontFace:F,fontSize:18,color:'C9D1D6',margin:0,valign:'top',isTextBox:true});
  s.addText('Ершов Е.М., ПИ 4-1 · 01.10.2026',{x:0.8,y:6.4,w:6,h:0.4,fontFace:F,fontSize:14,color:'C9D1D6',margin:0,isTextBox:true});
  const bx=[[10.0,4.6,2.4,2.0],[10.0,2.4,1.1,2.0],[11.3,2.4,1.1,2.0],[10.0,1.0,2.4,1.2]];
  bx.forEach(([x,y,w,h],i)=>s.addShape(pres.shapes.RECTANGLE,{x,y,w,h,fill:{color:i===0?C.acc:C.mid},line:{color:C.steel,width:1}}));
}

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

// E1 signs
{
  const s = base('Знаки безопасности на каждом месте','Модуль E · визуальная коммуникация');
  const cells=[['tri','Тяжёлый груз','масса на этикетке, не поднимать вручную'],['proh','Не стоять под грузом','опасная зона при подъёме краном'],['mand','Сначала подхват','фиксаторы снимать только после строповки'],['lift','Точка строповки','оранжевая метка, только для подъёма'],['top','Верх','стрелки на двух сторонах места'],['cog','Центр тяжести','отметка на каждом месте']];
  cells.forEach((c,i)=>{
    const x=M+(i%3)*4.1,y=1.8+Math.floor(i/3)*2.55;
    s.addShape(pres.shapes.RECTANGLE,{x,y,w:3.9,h:2.35,fill:{color:C.light},line:{color:C.light}});
    const ix=x+0.3,iy=y+0.4,sz=1.3;
    if(c[0]==='tri'){
      s.addShape(pres.shapes.ISOSCELES_TRIANGLE,{x:ix,y:iy,w:sz,h:sz*0.9,fill:{color:'FFC20E'},line:{color:'111111',width:3}});
      s.addText('!',{x:ix,y:iy+0.25,w:sz,h:sz*0.65,fontFace:F,fontSize:34,bold:true,color:'111111',align:'center',valign:'middle',margin:0,isTextBox:true});
    } else if(c[0]==='proh'){
      s.addShape(pres.shapes.OVAL,{x:ix,y:iy,w:sz,h:sz,fill:{color:C.white},line:{color:'C8102E',width:6}});
      s.addShape(pres.shapes.RECTANGLE,{x:ix+0.35,y:iy+0.55,w:0.6,h:0.5,fill:{color:'111111'},line:{color:'111111'}});
      s.addShape(pres.shapes.LINE,{x:ix+0.2,y:iy+sz-0.2,w:sz-0.4,h:-(sz-0.4),line:{color:'C8102E',width:6}});
    } else if(c[0]==='mand'){
      s.addShape(pres.shapes.OVAL,{x:ix,y:iy,w:sz,h:sz,fill:{color:'005EB8'},line:{color:'005EB8'}});
      s.addText('1',{x:ix,y:iy,w:sz,h:sz,fontFace:F,fontSize:48,bold:true,color:C.white,align:'center',valign:'middle',margin:0,isTextBox:true});
    } else if(c[0]==='lift'){
      s.addShape(pres.shapes.ROUNDED_RECTANGLE,{x:ix,y:iy,w:sz,h:sz,rectRadius:0.15,fill:{color:C.acc},line:{color:C.acc}});
      s.addShape(pres.shapes.OVAL,{x:ix+0.35,y:iy+0.35,w:0.6,h:0.6,fill:{color:C.acc},line:{color:C.white,width:5}});
    } else if(c[0]==='top'){
      s.addShape(pres.shapes.RECTANGLE,{x:ix,y:iy,w:sz,h:sz,fill:{color:C.white},line:{color:'111111',width:3}});
      s.addText('↑↑',{x:ix,y:iy,w:sz,h:sz,fontFace:F,fontSize:44,bold:true,color:'111111',align:'center',valign:'middle',margin:0,isTextBox:true});
    } else {
      s.addShape(pres.shapes.RECTANGLE,{x:ix,y:iy,w:sz,h:sz,fill:{color:C.white},line:{color:'111111',width:3}});
      s.addShape(pres.shapes.OVAL,{x:ix+0.3,y:iy+0.3,w:0.7,h:0.7,fill:{color:C.white},line:{color:'111111',width:3}});
      s.addShape(pres.shapes.LINE,{x:ix+0.2,y:iy+0.65,w:0.9,h:0,line:{color:'111111',width:3}});
      s.addShape(pres.shapes.LINE,{x:ix+0.65,y:iy+0.2,w:0,h:0.9,line:{color:'111111',width:3}});
    }
    s.addText(c[1],{x:x+1.85,y:y+0.35,w:1.9,h:0.8,fontFace:F,fontSize:15,bold:true,color:C.dark,margin:0,valign:'top',isTextBox:true});
    s.addText(c[2],{x:x+1.85,y:y+1.15,w:1.9,h:1.1,fontFace:F,fontSize:12,color:C.mid,margin:0,valign:'top',isTextBox:true});
  });
  s.addText('Знаки условные, на макете. В производство знаки берутся по ISO 7010 и ISO 780.',{x:M,y:6.9,w:9,h:0.3,fontFace:F,fontSize:11,color:C.steel,margin:0,isTextBox:true});
}

// E2 colour code
{
  const s = base('Цветовой код: пять цветов, у каждого одно значение','Модуль E · система');
  const cs=[['C8102E','Красный','Запрет: не стоять под грузом, не снимать раньше подхвата'],['FFC20E','Жёлтый','Предупреждение: тяжёлый груз, риск опрокидывания'],['005EB8','Синий','Обязательное действие: сначала строповка, затем фиксаторы'],['009A44','Зелёный','Безопасное состояние: путь эвакуации тары, склад'],[C.acc,'Оранжевый','Код проекта: только точки строповки и подъёма']];
  cs.forEach((c,i)=>{
    const y=1.8+i*0.98;
    s.addShape(pres.shapes.RECTANGLE,{x:M,y,w:1.4,h:0.82,fill:{color:c[0]},line:{color:c[0]}});
    s.addText(c[1],{x:M+1.6,y,w:2.2,h:0.82,fontFace:F,fontSize:16,bold:true,color:C.dark,valign:'middle',margin:0,isTextBox:true});
    s.addText(c[2],{x:M+3.9,y,w:4.0,h:0.82,fontFace:F,fontSize:13,color:C.mid,valign:'middle',margin:0,isTextBox:true});
  });
  card(s,8.9,1.8,3.83,4.75,'Правило',bullets(['Один цвет, одно значение на всех местах','Красный и жёлтый только для безопасности','Бренд и маркетинг не используют эти цвета','Знаки не закрываются съёмными панелями']),{fill:C.dark,hc:C.white,bc:'E4E8EA',bs:13});
}

// E3 info panel
{
  const s = base('Информация на боковой стороне: три уровня чтения','Модуль E · вспомогательная информация');
  const px=M,py=1.8,pw=6.2,ph=4.8;
  s.addShape(pres.shapes.RECTANGLE,{x:px,y:py,w:pw,h:ph,fill:{color:C.white},line:{color:C.dark,width:2}});
  s.addShape(pres.shapes.RECTANGLE,{x:px,y:py,w:pw,h:1.0,fill:{color:C.dark},line:{color:C.dark}});
  s.addText('К-01',{x:px+0.25,y:py,w:2.2,h:1.0,fontFace:F,fontSize:40,bold:true,color:C.white,valign:'middle',margin:0,isTextBox:true});
  s.addText('КАБИНА · место 1 из 5',{x:px+2.5,y:py,w:3.5,h:1.0,fontFace:F,fontSize:14,bold:true,color:C.acc,valign:'middle',margin:0,isTextBox:true});
  s.addText('≈ ___ кг',{x:px+0.25,y:py+1.15,w:2.6,h:0.7,fontFace:F,fontSize:26,bold:true,color:C.dark,valign:'middle',margin:0,isTextBox:true});
  s.addShape(pres.shapes.RECTANGLE,{x:px+3.0,y:py+1.15,w:0.7,h:0.7,fill:{color:C.white},line:{color:'111111',width:2}});
  s.addText('↑↑',{x:px+3.0,y:py+1.15,w:0.7,h:0.7,fontFace:F,fontSize:18,bold:true,color:'111111',align:'center',valign:'middle',margin:0,isTextBox:true});
  s.addShape(pres.shapes.ISOSCELES_TRIANGLE,{x:px+3.9,y:py+1.15,w:0.75,h:0.68,fill:{color:'FFC20E'},line:{color:'111111',width:2}});
  s.addShape(pres.shapes.ROUNDED_RECTANGLE,{x:px+4.85,y:py+1.15,w:0.7,h:0.7,rectRadius:0.1,fill:{color:C.acc},line:{color:C.acc}});
  s.addText('Порядок вскрытия',{x:px+0.25,y:py+2.05,w:3,h:0.3,fontFace:F,fontSize:12,bold:true,color:C.dark,margin:0,isTextBox:true});
  for(let i=0;i<6;i++){
    s.addShape(pres.shapes.OVAL,{x:px+0.25+i*0.62,y:py+2.4,w:0.5,h:0.5,fill:{color:i===3?C.acc:C.dark},line:{color:i===3?C.acc:C.dark}});
    s.addText(String(i+1),{x:px+0.25+i*0.62,y:py+2.4,w:0.5,h:0.5,fontFace:F,fontSize:13,bold:true,color:C.white,align:'center',valign:'middle',margin:0,isTextBox:true});
  }
  s.addText('Содержимое: кабина, панели, комплект крепежа',{x:px+0.25,y:py+3.1,w:pw-0.5,h:0.4,fontFace:F,fontSize:12,color:C.mid,margin:0,isTextBox:true});
  s.addShape(pres.shapes.RECTANGLE,{x:px+0.25,y:py+3.6,w:0.95,h:0.95,fill:{color:C.white},line:{color:C.dark,width:2}});
  s.addText('QR',{x:px+0.25,y:py+3.6,w:0.95,h:0.95,fontFace:F,fontSize:16,bold:true,color:C.dark,align:'center',valign:'middle',margin:0,isTextBox:true});
  s.addText('схема сборки и перечень содержимого этого места',{x:px+1.4,y:py+3.6,w:pw-1.65,h:0.95,fontFace:F,fontSize:12,color:C.mid,valign:'middle',margin:0,isTextBox:true});
  card(s,7.1,1.8,5.63,1.5,'Уровень 1. С расстояния 3 м',bullets(['Код места, масса, верх']),{bs:13});
  card(s,7.1,3.45,5.63,1.5,'Уровень 2. Вблизи, 1 м',bullets(['Знаки, порядок вскрытия, содержимое']),{bs:13});
  card(s,7.1,5.1,5.63,1.5,'Уровень 3. По QR-коду',bullets(['Полная схема сборки, инструкция, перечень']),{bs:13,fill:C.soft,hc:C.acc});
}

// E4 brand
{
  const s = base('Бренд на упаковке: спокойно и не в ущерб безопасности','Модуль E · поддержка бренда');
  s.addShape(pres.shapes.RECTANGLE,{x:M,y:1.8,w:5.6,h:4.8,fill:{color:C.dark},line:{color:C.dark}});
  s.addText('ВОЗДУХ',{x:M+0.4,y:2.6,w:4.8,h:1.0,fontFace:F,fontSize:54,bold:true,color:C.white,margin:0,isTextBox:true});
  s.addText('лифтовое оборудование',{x:M+0.4,y:3.6,w:4.8,h:0.5,fontFace:F,fontSize:18,color:'C9D1D6',margin:0,isTextBox:true});
  s.addShape(pres.shapes.OVAL,{x:M+0.4,y:4.5,w:0.4,h:0.4,fill:{color:C.acc},line:{color:C.acc}});
  s.addText('макет торцевой панели',{x:M+0.4,y:6.0,w:4.8,h:0.4,fontFace:F,fontSize:11,color:C.steel,margin:0,isTextBox:true});
  card(s,6.6,1.8,6.13,2.2,'Что показываем',bullets(['Название и знак на двух торцах места','Графит и один акцентный цвет','Пометка «возвратная тара» на многооборотных основаниях']),{bs:13});
  card(s,6.6,4.2,6.13,2.4,'Чего не делаем',bullets(['Не размещаем бренд поверх знаков безопасности','Не используем красный и жёлтый для оформления','Не перегружаем упаковку текстом рекламного характера']),{bs:13,fill:C.soft,hc:C.acc});
}

// F summary
{
  const s = pres.addSlide(); n++;
  s.background={color:C.dark};
  s.addText('Итоги проекта',{x:0.8,y:0.6,w:11,h:0.9,fontFace:F,fontSize:36,bold:true,color:C.white,margin:0,isTextBox:true});
  const st=[['5','маркированных мест вместо одного ящика'],['3','типа оснований, 1 размер болта'],['100 мм','запас по высоте: главный риск'],['5,1 м','из 13,6 м занято в еврофуре']];
  st.forEach((it,i)=>{
    const x=0.8+i*3.05;
    s.addText(it[0],{x,y:1.8,w:2.8,h:0.9,fontFace:F,fontSize:40,bold:true,color:C.acc,margin:0,isTextBox:true});
    s.addText(it[1],{x,y:2.75,w:2.7,h:0.9,fontFace:F,fontSize:14,color:C.white,margin:0,valign:'top',isTextBox:true});
  });
  const t=[['Что решает концепция','Защита в пути, безопасное вскрытие в правильном порядке, выдача узлов по очереди монтажа, возврат и сортировка тары'],['Что ещё нужно','Данные изготовителя, расчёт оснований и креплений, макет для проверки габарита, испытания на вибрацию и удар']];
  t.forEach((it,i)=>{
    const x=0.8+i*6.0;
    s.addText(it[0],{x,y:4.1,w:5.6,h:0.45,fontFace:F,fontSize:18,bold:true,color:C.white,margin:0,isTextBox:true});
    s.addText(it[1],{x,y:4.65,w:5.5,h:1.6,fontFace:F,fontSize:15,color:'C9D1D6',margin:0,valign:'top',isTextBox:true});
  });
}

// G Q&A
{
  const s = base('Возможные вопросы и короткие ответы','Модуль G · защита');
  const qa=[['Почему не один большой ящик?','Узлы разные по массе и уязвимости. Отдельные места проще принять, открыть по очереди и выдать в порядке монтажа.'],
   ['Как решён риск по высоте?','Запас 100 мм. Уменьшаем основание и верхнюю защиту или опускаем изделие в основание, габарит изделия не меняется. Нужен замер машины.'],
   ['Почему основания не одинаковые?','Интерфейс общий, несущая способность нет. Основания кабины и противовеса считаются отдельно.'],
   ['Что с возвратом тары?','Основания стальные, многооборотные. Панели и прокладки сменные и сортируются по материалам. Возврат нужно согласовать с логистикой.']];
  qa.forEach((it,i)=>{
    const x=M+(i%2)*6.15,y=1.8+Math.floor(i/2)*2.6;
    card(s,x,y,5.95,2.4,it[0],it[1],{bs:13.5,fill:i%3===0?C.light:C.light});
  });
}

const NOTES=["Здравствуйте. Проект: транспортно-монтажная упаковка комплекта лифта «Воздух». Покажу, как мы пришли к модульной системе и как она работает на всём пути от комплектации до монтажа.", "Нужно спроектировать не тару, а систему. Пять групп узлов, общая масса около 1670 кг. Главное ограничение: еврофура, у кабины запас по высоте номинально 300 мм.", "Семь требований по приоритету. Первые два: защита и фиксация, безопасная работа с тяжёлыми узлами.", "Приоритетные пользователи: монтажная бригада и логистика. Остальные группы учтены в требованиях.", "Аналоги: у ящика много отходов, у паллет много мест, плёнка не защищает тяжёлое, возвратная тара требует обратной логистики. Отсюда идея гибрида.", "Пять противоречий, которые проект должен разрешить. Справа вопросы, которые нужно уточнить у заказчика.", "Цепочка сценариев от комплектации до возврата. Самые критичные места: приёмка и монтаж.", "Рассмотрели три направления. Выбрали В: модульную гибридную систему.", "Схема: типовое основание, фиксаторы, съёмная защита под каждый узел. Два режима: транспорт и монтаж.", "Решения по узлам. Нагрузку несёт основание, декоративные панели не нагружаются.", "Главный размерный риск. Ширина упаковки кабины 2280 из 2450, высота 2500 из 2600. Запас по высоте 100 мм требует проверки на макете и на машине.", "Унифицируем интерфейсы, а не размеры ящиков. Несущую способность по аналогии не переносим.", "Эргономическая проверка по операциям. Последовательность задаёт сама конструкция.", "Шесть шагов монтажной пригодности. Главное правило: несущий фиксатор снимается только после подхвата.", "Этот раздел показывает проектные допущения. Размеры упаковки, кроме кабины, оценочные. Их нужно заменить данными изготовителя.", "Конструктор: три типа оснований, фиксаторы, прокладки, съёмная защита.", "Материалы: несущее из стали, защита из сортируемых панелей, сменные прокладки. Расчётом это ещё не подтверждено.", "Производственная реализуемость: обычные технологии, риски названы по каждому элементу.", "Номенклатура: три основания, один размер болта, один ключ, два размера панелей.", "Чертёж кабины в сечении кузова. Действие при малом запасе: уменьшать основание и защиту.", "План загрузки: занято около 5,1 м из 13,6 м. По длине большой запас, ограничения по ширине и высоте.", "Схема вскрытия кабины. Подхват раньше снятия фиксаторов.", "Схемы сборки и разборки для производства, транспортировки и места установки.", "Пример маркировки места. Пять полей, читаемых с расстояния и вблизи.", "Модуль E. Знаки безопасности на каждом месте. Знаки условные, в производство берутся по ISO 7010 и ISO 780.", "Цветовой код: один цвет, одно значение. Красный и жёлтый только для безопасности.", "Информация на боковой стороне читается на трёх уровнях: с трёх метров, вблизи и по QR-коду.", "Бренд на упаковке спокойный и не мешает знакам безопасности.", "Итоги. Концепция решает защиту, безопасное вскрытие и порядок выдачи. Нужны данные изготовителя, расчёты и макет.", "Вопросы. Подготовлены ответы на четыре наиболее вероятных."];
pres.slides.forEach((sl,i)=>{ if(NOTES[i]) sl.addNotes(NOTES[i]); });
pres.writeFile({fileName:'lift-packaging-final.pptx'}).then(()=>console.log('ok', pres.slides.length));
