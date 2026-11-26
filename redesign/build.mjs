import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {homePage} from './homepage.mjs';
import {contactMessengers} from './guest-sections.mjs';
import {introSection} from './intro-variants.mjs';
const out=import.meta.dirname, root=resolve(out,'..');
const A='../assets/';
const selectedIntro='editorial';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arrow='<span aria-hidden="true">↗</span>';
const img=(src,alt,cls='',eager=false)=>`<img src="${A+src}" alt="${esc(alt)}" class="${cls}" ${eager?'fetchpriority="high"':'loading="lazy"'} decoding="async">`;
const roomSource=readFileSync(resolve(root,'rooms.html'),'utf8');
const clean=s=>s.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const rooms=[...roomSource.matchAll(/<article class="room-card[\s\S]*?<\/article>/g)].map((m,i)=>{
 const html=m[0],photos=JSON.parse(html.match(/data-images='([^']+)'/)[1]).map(s=>s.replace(/^assets\//,''));
 const names=['Эконом · две кровати','Эконом · три кровати','Стандарт · большая кровать','Стандарт · две кровати','Семейный','Стандарт-плюс','Стандарт-комфорт'];
 return {id:html.match(/data-tl-room="(\d+)"/)[1],name:names[i],group:[0,1,4,5].includes(i)?'family':'double',guests:[2,3,2,2,3,3,2][i],area:['30','30–35','22','22','30','30','30'][i],price:Number(clean(html.match(/class="room-price">([\s\S]*?)<\/div>/)[1]).replace(/\D/g,'')),photos,facts:[...html.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(x=>clean(x[1]))};
});
const posts=JSON.parse(readFileSync(resolve(out,'news-snapshot.json'),'utf8')).sort((a,b)=>Number(b.pinned)-Number(a.pinned)||new Date(b.publishedAt)-new Date(a.publishedAt));
rooms.forEach((r,i)=>{r.category=i<2?'economy':i===4?'family':'standard';r.breakfast=i>=2;r.description=i<2?'Номер с отдельными кроватями для остановки в дороге или рабочей поездки.':i===4?'Номер для совместной поездки: двуспальная и отдельная кровати, собственный санузел и Wi-Fi.':'Номер с собственным санузлом, Wi-Fi и телевизором. Выберите подходящий вариант кроватей.';});
const services={
 cafe:{name:'Кафе',tag:'ВКУС ПУТЕШЕСТВИЯ',title:'Хороший день начинается\nс завтрака.',intro:'Завтраки для гостей, обед в дороге и время за одним столом. В кафе «Облепиха» можно спокойно поесть всей семьёй и взять любимые блюда с собой.',photo:'cafe-pdf/slide-01.webp',phone:'+79609423311',phoneText:'+7 960 942-33-11',cta:'Позвонить в кафе',facts:[['Завтрак','Включён в стандартный тариф'],['С собой','Еда и напитки в дорогу'],['Для детей','Уголок с игрушками']],gallery:['cafe-pdf/slide-01.webp','kids-corner.webp','cafe.jpg'],subhead:'Пока вы отдыхаете,\nдети играют.',subtext:'В кафе есть детский уголок с игрушками. Можно не торопиться с обедом и провести время вместе после дороги.',subphoto:'kids-corner.webp'},
 grill:{name:'Гриль-бар',tag:'ВЕЧЕР В ОБЛЕПИХЕ',title:'У каждого вечера\nсвой вкус.',intro:'Тёплый свет, неспешные разговоры и блюда с гриля. Место для ужина с близкими или приятного завершения дня в дороге.',photo:'grill-page/slide-01.webp',phone:'+79069435500',phoneText:'+7 906 943-55-00',cta:'Уточнить столик',facts:[['На гриле','Сочные блюда и яркие вкусы'],['Вместе','Вечера с друзьями и семьёй'],['Без спешки','Отдых после дороги']],gallery:['grill-page/slide-01.webp','grill.jpg','grill-page/slide-02.webp'],subhead:'Остаться\nещё на один разговор.',subtext:'Соберитесь за одним столом. А если не хочется продолжать дорогу вечером — выберите номер в гостинице.',subphoto:'grill.jpg'},
 banquet:{name:'Банкетный зал',tag:'ВАЖНЫЕ МОМЕНТЫ',title:'Ваш день.\nВаши люди.',intro:'Свадьбы, дни рождения, выпускные и семейные торжества. Пространство, которое становится частью вашей истории.',photo:'banquet-page/slide-02.webp',phone:'+79640819904',phoneText:'+7 964 081-99-04',cta:'Обсудить мероприятие',facts:[['До 120','Гостей в банкетном зале'],['Ваш формат','Свадьбы, юбилеи, корпоративы'],['Рядом','Номера для гостей события']],gallery:['banquet-page/slide-02.webp','banquet-page/slide-03.webp','banquet.jpg'],subhead:'Место для того,\nчто хочется запомнить.',subtext:'Обсудим дату, количество гостей и формат торжества по телефону. Подробности и стоимость согласовываются индивидуально.',subphoto:'banquet-page/slide-03.webp'},
 conference:{name:'Конференц-зал',tag:'ВСТРЕЧИ СО СМЫСЛОМ',title:'Пространство\nдля ваших идей.',intro:'Конференции, деловые встречи, презентации и обучение. Соберите команду в одном месте — от рабочего дня до размещения гостей.',photo:'conference-page/slide-01.webp',phone:'+79640819904',phoneText:'+7 964 081-99-04',cta:'Обсудить аренду',facts:[['До 120','Участников мероприятия'],['Гибко','Различные варианты рассадки'],['Wi-Fi','На территории комплекса']],gallery:['conference-page/slide-01.webp','conference.jpg','conference-page/slide-02.webp'],subhead:'Работа, встреча,\nхорошая пауза.',subtext:'Для участников можно совместить деловую программу, питание в кафе и проживание в гостинице. Оборудование, рассадку и условия аренды уточняйте при согласовании.',subphoto:'conference.jpg'},
 sauna:{name:'Финская сауна',tag:'ВРЕМЯ ДЛЯ СЕБЯ',title:'Тепло, которое\nвозвращает силы.',intro:'Финская парная, джакузи и комната отдыха. Оставьте суету за дверью и проведите время в своей компании.',photo:'sauna-page/slide-01.webp',phone:'+79237116891',phoneText:'+7 923 711-68-91',cta:'Записаться в сауну',facts:[['Парная','Сухое тепло финской сауны'],['Джакузи','Гидромассаж и расслабление'],['Отдых','Отдельная комната для компании']],gallery:['sauna-page/slide-01.webp','sauna-page/slide-02.webp','sauna-page/slide-03.webp'],subhead:'Хороший отдых —\nв хорошей компании.',subtext:'До 6 человек — 1 500 ₽. До 8 человек — 2 000 ₽. За каждого последующего гостя доплата 200 ₽. Запись и свободное время — по телефону.',subphoto:'sauna-page/slide-02.webp'}
};
const nav=[['Номера','index.html#rooms'],['Кафе и бар','index.html#dining'],['Мероприятия','index.html#events'],['Сауна','sauna.html'],['Гостям','index.html#stay'],['Контакты','index.html#contacts']];
const brand=`<span class="brand-symbol" aria-hidden="true">${img('optimized/logo-berry-256.webp','','',true)}</span><span><b>ОБЛЕПИХА</b><small>ГОСТИНИЧНЫЙ КОМПЛЕКС</small></span>`;
function header(){return `<a class="skip-link" href="#main">К содержанию</a><header class="site-header"><a class="brand" href="index.html" aria-label="Облепиха — главная">${brand}</a><nav class="main-nav" id="main-nav" aria-label="Главная навигация">${nav.map(([label,href])=>`<a href="${href}">${label}</a>`).join('')}<a class="nav-mobile-extra" href="grill.html">Гриль-бар</a><a class="nav-mobile-extra" href="conference.html">Конференц-зал</a><a class="nav-mobile-extra" href="news.html">Новости и предложения</a></nav><a class="header-phone" href="tel:+79069435500">+7 906 943-55-00</a><button class="menu-toggle" aria-label="Открыть меню" aria-controls="main-nav" aria-expanded="false"><span></span><span></span></button></header>`;}
function footer(){
 return `<footer class="site-footer"><div class="site-footer-inner wrap">
  <div class="site-footer-lead">
   <h2>До встречи<br><em>в «Облепихе»</em></h2>
   <div class="site-footer-booking">
    <div><span class="site-footer-label">Стойка размещения · круглосуточно</span><a class="site-footer-phone" href="tel:+79069435500">+7 906 943-55-00</a></div>
    <a class="site-footer-book" href="index.html#booking" data-tl-booking-open="true">Выбрать номер <span aria-hidden="true">↗</span></a>
   </div>
  </div>
  <div class="site-footer-grid">
   <div class="site-footer-location">
    <a class="brand" href="index.html" aria-label="Облепиха — главная">${brand}</a>
    <address>Новоалтайск, ул. Дорожная, 13</address>
    <a class="site-footer-route" href="https://yandex.ru/maps/org/oblepikha/24483320354/" target="_blank" rel="noopener">Построить маршрут <span aria-hidden="true">↗</span></a>
   </div>
   <nav class="site-footer-group" aria-label="Проживание"><h3>Проживание</h3>
    <a href="index.html#rooms">Номера и цены</a><a href="index.html#stay">Условия проживания</a>
   </nav>
   <nav class="site-footer-group" aria-label="Услуги комплекса"><h3>Комплекс</h3>
    ${Object.entries(services).map(([key,s])=>`<a href="${key}.html">${s.name}</a>`).join('')}
   </nav>
   <nav class="site-footer-group" aria-label="Информация и связь"><h3>Информация</h3>
    <a href="news.html">Новости и предложения</a><a href="vacancies.html">Вакансии</a><a href="index.html#contacts">Контакты</a>
    ${contactMessengers('site-footer-socials')}
   </nav>
  </div>
  <div class="site-footer-bottom">
   <span>© 2026 «Облепиха»</span>
   <a class="site-footer-credit" href="https://nr-com.ru/" target="_blank" rel="noopener"><span>Сайт разработан</span><img src="images/brands/novye-resheniya.svg" alt="Новые решения" width="384" height="114" loading="lazy" decoding="async"></a>
  </div>
 </div></footer>`;
}
function dialogs(){return `<dialog class="room-dialog" id="room-dialog" aria-label="Информация о номере"><button class="dialog-close" data-close aria-label="Закрыть окно">×</button><div id="room-dialog-content"></div></dialog><dialog class="lightbox" id="lightbox" aria-label="Просмотр фотографии"><button class="dialog-close" data-close aria-label="Закрыть фотографию">×</button><button class="gallery-arrow" data-photo-step="-1" aria-label="Предыдущее фото">←</button><figure><img id="lightbox-photo" alt=""><figcaption id="lightbox-caption"></figcaption></figure><button class="gallery-arrow" data-photo-step="1" aria-label="Следующее фото">→</button></dialog><dialog class="article-dialog" id="article-dialog" aria-label="Новость"><button class="dialog-close" data-close aria-label="Закрыть новость">×</button><div id="article-content"></div></dialog>`;}
function shell(title,body,key='home',{welcomeVariant='classic',introVariant=selectedIntro}={}){return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#29251f"><title>${key==='home'?'Гостиница «Облепиха» в Новоалтайске — официальный сайт':esc(title)+' — Облепиха'}</title><link rel="icon" href="../favicon.ico"><link rel="stylesheet" href="styles.css?v=20261117-2"><link rel="stylesheet" href="footer.css?v=2">${key==='home'?'<link rel="stylesheet" href="hero-welcome.css?v=20261117-2"><link rel="stylesheet" href="homepage.css?v=20261123-1"><link rel="stylesheet" href="sauna-services.css?v=20261120-1"><link rel="stylesheet" href="events.css?v=20261123-1"><link rel="stylesheet" href="guest-sections.css?v=20261126-4"><link rel="stylesheet" href="welcome-variants.css?v=20261120-3">'+(introVariant?'<link rel="stylesheet" href="intro-variants.css?v=20261120-1">':''):''}<script src="data.js?v=20261117-3" defer></script><script src="app.js?v=20261126-1" defer></script><script src="booking.js?v=20261120-2" defer></script></head><body data-page="${key}"${key==='home'?' data-welcome-variant="'+welcomeVariant+'"':''}>${header()}<main id="main">${body}</main>${footer()}<div hidden aria-hidden="true">${rooms.map(r=>`<a id="tl-room-${r.id}" href="index.html#booking" data-tl-booking-open="true" data-tl-room="${r.id}">Забронировать ${esc(r.name)}</a>`).join('')}</div>${dialogs()}</body></html>`;}
const label=(n,text)=>`<div class="section-label"><span>${n}</span>${text}</div>`;
function roomCard(r){return `<article class="room-card" data-room-card data-guests="${r.guests}"><button class="room-image" data-room="${r.id}" aria-label="Посмотреть номер ${esc(r.name)}">${img(r.photos[0],r.name)}<span class="image-tag">${r.area} м² · ${r.guests} гостя</span><span class="image-arrow">↗</span></button><div class="room-card-info"><h3><button data-room="${r.id}">${r.name}</button></h3><span class="room-price">от ${r.price.toLocaleString('ru-RU')} ₽</span></div><div class="room-card-bottom"><span>Завтрак включён</span><button class="text-link" data-room="${r.id}">Подробнее ${arrow}</button></div></article>`;}
function newsCards(limit=posts.length){return posts.slice(0,limit).map(p=>{const photo=p.image.startsWith('images/')?'<img src="'+esc(p.image)+'" alt="'+esc(p.title)+'" loading="lazy" decoding="async">':img(p.image.replace(/^\/?assets\//,''),p.title); const tag=p.id==='winter-tea'?'С 1 ДЕКАБРЯ 2026':p.pinned?'ЗАКРЕПЛЕНО':new Date(p.publishedAt).toLocaleDateString('ru-RU'); const excerpt=p.text.split('\n').filter(Boolean)[0];return '<article class="news-card"><button class="news-image" data-article="'+esc(p.id)+'" aria-label="'+esc(p.title)+'">'+photo+'<span class="image-tag">'+tag+'</span>'+arrow+'</button><div><span class="eyebrow">'+(p.kind==='promotion'?'ПРЕДЛОЖЕНИЕ':'НОВОСТЬ')+'</span><h3><button data-article="'+esc(p.id)+'">'+esc(p.title)+'</button></h3><p class="news-excerpt">'+esc(excerpt)+'</p><button class="text-link" data-article="'+esc(p.id)+'">Читать подробнее '+arrow+'</button></div></article>';}).join('');}
function home(introVariant=selectedIntro){
 let body=homePage({img,arrow,label,rooms,newsCards});
 if(introVariant){
  const start=body.indexOf('<section class="hotel-intro'),end=body.indexOf('<section class="home-rooms');
  if(start<0||end<start)throw new Error('Intro section markers missing');
  body=body.slice(0,start)+introSection(introVariant,{img,arrow})+'\n'+body.slice(end);
 }
 return body;
}
function servicePage(s,key){return `<section class="service-hero">${img(s.photo,s.name,'service-hero-photo',true)}<div class="service-hero-content"><a class="breadcrumb" href="index.html">Главная / ${s.name}</a><span class="eyebrow">${s.tag}</span><h1>${s.title.split('\n').join('<br>')}</h1><a class="button" href="tel:${s.phone}">${s.cta} ${arrow}</a></div></section><section class="service-intro section wrap"><span class="eyebrow">${s.name.toUpperCase()} В НОВОАЛТАЙСКЕ</span><p class="lead">${s.intro}</p><div class="service-facts">${s.facts.map(([a,b])=>`<div><strong>${a}</strong><span>${b}</span></div>`).join('')}</div></section><section class="service-story wrap"><div>${img(s.subphoto,s.name)}</div><div><span class="eyebrow">${s.tag}</span><h2>${s.subhead.split('\n').join('<br>')}</h2>${key==='sauna'?'<div class="sauna-rates"><div><span>До 6 человек</span><strong>1 500 ₽</strong></div><div><span>До 8 человек</span><strong>2 000 ₽</strong></div></div><p>За каждого последующего гостя — доплата 200 ₽</p>':`<p>${s.subtext}</p>`}<a class="text-link" href="tel:${s.phone}">${s.phoneText} ${arrow}</a>${key==='cafe'?'<a class="text-link secondary-story-link" href="grill.html">Или провести вечер в гриль-баре ↗</a>':''}</div></section><section class="section wrap"><div class="section-heading"><h2>ВЗГЛЯНИТЕ<br><em>ПОБЛИЖЕ</em></h2><span class="muted">Фотографии нашего комплекса</span></div><div class="service-gallery">${s.gallery.map((photo,i)=>`<button data-gallery="service" data-photo="${A+photo}" data-caption="${s.name} · фото ${i+1}">${img(photo,s.name+' — фото '+(i+1))}${arrow}</button>`).join('')}</div></section><section class="service-contact wrap"><span class="eyebrow">БУДЕМ РАДЫ ВАМ</span><h2>Договоримся<br><em>о встрече?</em></h2><p>Даты, детали и пожелания обсудим по телефону</p><a class="button" href="tel:${s.phone}">${s.cta} ${arrow}</a><a class="text-link" href="index.html#contacts">Адрес и контакты ${arrow}</a></section>`;}
mkdirSync(out,{recursive:true});
writeFileSync(resolve(out,'data.js'),`window.OBLEPIHA_PREVIEW=${JSON.stringify({rooms,posts})};`);
writeFileSync(resolve(out,'index.html'),shell('Гостиничный комплекс в Новоалтайске',home()));
// Hero comparison pages; the chosen classic treatment is now the local homepage default.
for(const [variant,name,other,otherName] of [
 ['classic','01 · Тёплая классика','modern','02 · Современная простота'],
 ['modern','02 · Современная простота','classic','01 · Тёплая классика']
]){
 const previewBar='<aside class="welcome-comparisonbar" aria-label="Сравнение первого экрана"><span>Вариант '+name+'</span><nav><a href="welcome-'+other+'.html">Вариант '+otherName+'</a><a href="welcome-options.html">Сравнить оба</a><a href="index.html">Текущая главная</a></nav></aside>';
 const html=shell('Гостиничный комплекс в Новоалтайске',home(),'home',{welcomeVariant:variant})
  .replace('<section class="hotel-intro',previewBar+'<section class="hotel-intro');
 writeFileSync(resolve(out,'welcome-'+variant+'.html'),html);
}

for(const [variant,name,other,otherName] of [
 ['editorial','01 · Спокойная композиция','panorama','02 · Фотоистория'],
 ['panorama','02 · Фотоистория','editorial','01 · Спокойная композиция']
]){
 const bar='<aside class="welcome-comparisonbar" aria-label="Сравнение второго раздела"><span>Второй раздел · '+name+'</span><nav><a href="intro-'+other+'.html#about">Вариант '+otherName+'</a><a href="intro-options.html">Оба варианта подряд</a><a href="index.html#about">Текущий раздел</a></nav></aside>';
 const body=home(variant).replace('<section class="home-rooms',bar+'<section class="home-rooms');
 writeFileSync(resolve(out,'intro-'+variant+'.html'),shell('Гостиничный комплекс в Новоалтайске',body,'home',{introVariant:variant}));
}
const introOptionsHead=readFileSync(resolve(out,'intro-options-template.html'),'utf8');
const introOptions=introOptionsHead
 .replace('<!-- EDITORIAL -->',introSection('editorial',{img,arrow}).replace('id="about"','id="preview-editorial"').replace('href="#contacts"','href="intro-editorial.html#contacts"'))
 .replace('<!-- PANORAMA -->',introSection('panorama',{img,arrow}).replace('id="about"','id="preview-panorama"').replace('href="#contacts"','href="intro-panorama.html#contacts"'));
writeFileSync(resolve(out,'intro-options.html'),introOptions);

for(const [key,s] of Object.entries(services))writeFileSync(resolve(out,key+'.html'),shell(s.name,servicePage(s,key),key));
writeFileSync(resolve(out,'news.html'),shell('Новости и предложения',`<section class="page-intro wrap"><span class="eyebrow">ЖИЗНЬ КОМПЛЕКСА</span><h1>ПРИЯТНЫЕ<br><em>ПОВОДЫ ПРИЕХАТЬ</em></h1><p>Предложения для гостей, новости и события «Облепихи»</p></section><section class="wrap section news-grid">${newsCards()}</section>`,'news'));
writeFileSync(resolve(out,'vacancies.html'),shell('Вакансии',`<section class="page-intro wrap"><span class="eyebrow">КОМАНДА ОБЛЕПИХИ</span><h1>РАБОТАТЬ<br><em>С ТЕПЛОМ</em></h1><p>Хотите стать частью команды? Свяжитесь с нами, чтобы узнать об актуальных вакансиях</p><a class="button" href="tel:+79069435500">Уточнить вакансии ${arrow}</a><a class="text-link" href="index.html#contacts">Адрес и контакты ${arrow}</a></section>`,'vacancies'));
console.log('Built 8 local pages, 2 hero alternatives and 3 intro comparison pages. Production files were not modified.');
