// The same confirmed terms, grouped by the questions guests plan their stay around.
const icons={
 arrival:'<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4m8-4v4M4 10h16m-8 3v3l2 1"/>',
 payment:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18M7 15h4"/>',
 breakfast:'<path d="M4 9h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Zm12 1h2a3 3 0 0 1 0 6h-2M7 3v3m4-3v3M3 21h15"/>',
 family:'<circle cx="9" cy="7" r="3"/><circle cx="17" cy="10" r="2"/><path d="M3 21v-4a6 6 0 0 1 12 0v4m0-6a4 4 0 0 1 6 4v2"/>',
 amenities:'<path d="M3 9a15 15 0 0 1 18 0M6 13a10 10 0 0 1 12 0m-9 4a5 5 0 0 1 6 0"/><circle cx="12" cy="21" r=".7"/>',
 business:'<rect x="3" y="7" width="18" height="14" rx="3"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12a20 20 0 0 0 18 0m-9 0v3"/>'
};
const icon=key=>`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icons[key]}</svg>`;
const topics=[
 {id:'arrival',label:'Заезд и выезд',note:'Время заселения',title:'Заезд и выезд',body:`
   <p>Стойка размещения работает круглосуточно. Администратор поможет заселиться и ответит на вопросы</p>
   <div class="stay-time-cards"><div><span>Заезд с</span><strong>14:00</strong></div><div><span>Выезд до</span><strong>12:00</strong></div></div>
   <p class="stay-panel-note">Ранний заезд возможен при наличии свободного номера, поздний выезд оплачивается дополнительно. Возможность, время и стоимость заранее согласуйте с администратором</p>`},
 {id:'payment',label:'Бронирование и оплата',note:'Как спланировать поездку',title:'Бронирование и оплата',body:`
   <p>В модуле TravelLine можно посмотреть свободные номера, актуальные цены и условия тарифов. Для бронирования также можно позвонить администратору</p>
   <div class="stay-detail-card"><strong>Оплата на стойке размещения</strong><p>Условия оплаты и отмены зависят от выбранного тарифа — проверьте их в модуле перед бронированием</p></div>
   <a class="stay-book-link" href="#booking" data-tl-booking-open="true">Выбрать номер</a>`},
 {id:'breakfast',label:'Завтрак и тарифы',note:'Начало хорошего дня',title:'Завтрак в нашем кафе',body:`
   <p>Включён ли завтрак в проживание, зависит от категории номера и выбранного тарифа</p>
   <div class="stay-meal-cards"><div><strong>Эконом</strong><span>Без завтрака</span></div><div><strong>Стандарт и семейный</strong><span>С завтраком в тарифе</span></div></div>
   <p class="stay-panel-note">Состав услуг и условия проживания всегда указаны в описании тарифа при бронировании</p>`},
 {id:'family',label:'Дети и питомцы',note:'В поездку с близкими',title:'Дети и питомцы',body:`
   <p>Чтобы разместиться вместе, выбирайте семейный номер. В кафе есть детский уголок с игрушками</p>
   <div class="stay-detail-card"><strong>Можно приехать с питомцем</strong><p>Заранее согласуйте размещение и доплату с администратором</p></div>
   <p class="stay-panel-note">Условия проживания детей уточняйте при бронировании — поможем подобрать подходящий вариант</p>`},
 {id:'amenities',label:'Удобства и парковка',note:'Всё для спокойного отдыха',title:'Удобства в гостинице',body:`
   <ul class="stay-amenities"><li>Wi-Fi во всех категориях номеров</li><li>Собственные душ и туалет</li><li>Бесплатная парковка для гостей гостиницы</li><li>Стиральная машина и сушка</li></ul>
   <p class="stay-panel-note">Стоимость стирки и сушки уточняйте на стойке размещения</p>`},
 {id:'business',label:'Командировки',note:'Для рабочих поездок',title:'Для командировок',body:`
   <p>Работаем с организациями и принимаем гостей в командировках</p>
   <div class="stay-detail-card"><strong>Договор и документы</strong><p>Обсудите со службой бронирования оплату, договор и необходимые документы для вашей поездки</p></div>
   <p class="stay-panel-note">Сообщите ваши требования заранее, чтобы согласовать всё до приезда</p>`}
];

export function staySection(){
 const panels=topics.map((t,i)=>`<div class="stay-panel" id="stay-panel-${t.id}" role="tabpanel" aria-labelledby="stay-tab-${t.id}" tabindex="0"${i?' hidden':''}>
   <h3>${t.title}</h3>${t.body}</div>`).join('');
 const tabs=topics.map((t,i)=>`<button class="stay-tab" type="button" id="stay-tab-${t.id}" role="tab" aria-selected="${!i}" aria-controls="stay-panel-${t.id}" tabindex="${i?-1:0}">
   <span class="stay-tab-icon">${icon(t.id)}</span><span><strong>${t.label}</strong><span>${t.note}</span></span></button>`).join('');
 return `<section class="home-stay" id="stay"><figure class="stay-photo"><img src="../assets/hotel-card.jpg" alt="Стойка размещения гостиницы «Облепиха»" width="1536" height="1024" loading="lazy" decoding="async"></figure><div class="stay-heading"><h2>Условия <em>проживания</em></h2></div>
   <div class="stay-explorer" data-stay-tabs><div class="stay-content">${panels}<a class="stay-contact" href="tel:+79069435500"><span>Служба размещения</span><strong>+7 906 943-55-00</strong></a></div>
   <div class="stay-menu" role="tablist" aria-label="Условия проживания" aria-orientation="vertical">${tabs}</div></div></section>`;
}
