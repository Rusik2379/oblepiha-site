const pageCopy = {
  banquet: {
    title: 'Банкетный зал', accent: 'для вашего праздника',
    description: 'Свадьбы, юбилеи, корпоративы и выпускные в «Облепихе». Банкетный зал в Новоалтайске вмещает до 120 гостей',
    details: 'Ваше торжество', detailsAccent: 'в «Облепихе»',
    facts: [['До 120 гостей', 'Вместимость банкетного зала'], ['Меню и формат', 'Обсудим с вами с учётом количества гостей'], ['Номера рядом', 'Гости могут остаться в гостинице']],
    gallery: ['Банкетный зал', 'Праздничная сервировка', 'Интерьер зала'],
    visit: 'Свободную дату, меню и стоимость обсудим по телефону',
  },
  conference: {
    title: 'Конференц-зал', accent: 'для деловых встреч',
    description: 'Зал до 120 участников для конференций, презентаций и обучения в Новоалтайске',
    details: 'Всё для', detailsAccent: 'деловой встречи',
    facts: [['До 120 участников', 'Вместимость конференц-зала'], ['Рассадка и Wi-Fi', 'Рассадку и оборудование согласуем заранее'], ['Кафе и гостиница', 'Можно организовать питание и размещение участников']],
    gallery: ['Конференц-зал с экраном', 'Интерьер конференц-зала', 'Другой ракурс зала'],
    visit: 'Позвоните, чтобы уточнить свободную дату, оборудование и условия аренды',
  },
  cafe: {
    title: 'Кафе', accent: '«Облепиха»',
    description: 'Завтраки, обеды и блюда с собой в Новоалтайске. В зале есть детский уголок с игрушками',
    details: 'За столом', detailsAccent: 'и в дороге',
    facts: [['Завтрак', 'Включён в стандартный тариф гостиницы'], ['Еда с собой', 'Блюда и напитки можно взять в дорогу'], ['Детский уголок', 'В зале есть место для игр']],
    gallery: ['Зал кафе', 'Детский уголок', 'Столы и зона обслуживания'],
    visit: 'О меню и работе кафе можно уточнить по телефону',
  },
};

export function hasVenuePage(key) {
  return Object.hasOwn(pageCopy, key);
}

export function venuePage(key, service) {
  const copy = pageCopy[key];
  const call = 'tel:' + service.phone;
  const heroPhoto = key === 'cafe' ? 'cafe.jpg' : service.photo;
  return `<div class="venue-page">
    <section class="venue-hero" aria-labelledby="venue-title">
      <div class="venue-hero-inner wrap">
        <div class="venue-hero-copy">
          <nav class="venue-crumb" aria-label="Путь до страницы">
            <a href="index.html">Главная</a><span aria-hidden="true">/</span><span aria-current="page">${service.name}</span>
          </nav>
          <h1 id="venue-title">${copy.title} <em>${copy.accent}</em></h1>
          <p>${copy.description}</p>
          <div class="venue-page-actions">
            <a class="venue-page-button" href="${call}">${service.cta} <span aria-hidden="true" class="ui-arrow ui-arrow--diagonal"></span></a>
            <a class="venue-page-link" href="#venue-gallery">Смотреть фото <span aria-hidden="true" class="ui-arrow ui-arrow--down"></span></a>
          </div>
        </div>
        <img class="venue-hero-image" src="../assets/${heroPhoto}" alt="${service.name} в комплексе «Облепиха»" fetchpriority="high" decoding="async">
      </div>
    </section>
    <section class="venue-page-section wrap" aria-labelledby="venue-details-title">
      <div class="venue-section-heading"><h2 id="venue-details-title">${copy.details} <em>${copy.detailsAccent}</em></h2></div>
      <dl class="venue-facts">
        ${copy.facts.map(([label, detail]) => `<div><dt>${label}</dt><dd>${detail}</dd></div>`).join('')}
      </dl>
    </section>
    <section id="venue-gallery" class="venue-interiors" aria-labelledby="venue-gallery-title">
      <div class="venue-page-section wrap">
        <div class="venue-section-heading"><h2 id="venue-gallery-title">Фото <em>${key === 'cafe' ? 'кафе' : 'зала'}</em></h2></div>
        <div class="venue-page-gallery">
          ${service.gallery.map((photo, index) => {
            const src = '../assets/' + photo;
            const caption = copy.gallery[index];
            return `<figure>
              <button type="button" data-gallery="venue" data-photo="${src}" data-caption="${caption}" aria-label="Увеличить фото: ${caption}">
                <img src="${src}" alt="${caption}" loading="lazy" decoding="async"><span aria-hidden="true" class="ui-arrow ui-arrow--diagonal"></span>
              </button>
              <figcaption>${caption}</figcaption>
            </figure>`;
          }).join('')}
        </div>
      </div>
    </section>
    <section class="venue-page-section venue-visit wrap" aria-labelledby="venue-visit-title">
      <div>
        <h2 id="venue-visit-title">Как <em>приехать</em></h2>
        <address>Новоалтайск, ул. Дорожная, 13</address>
        <p>${copy.visit}</p>
${key === 'cafe' ? '<a class="venue-page-link" href="grill.html">Гриль-бар <span aria-hidden="true" class="ui-arrow ui-arrow--diagonal"></span></a>' : ''}
      </div>
      <div class="venue-page-actions">
        <a class="venue-page-button" href="${call}">${service.phoneText} <span aria-hidden="true" class="ui-arrow ui-arrow--diagonal"></span></a>
        <a class="venue-page-link" href="https://yandex.ru/maps/org/oblepikha/24483320354/" target="_blank" rel="noopener">Построить маршрут <span aria-hidden="true" class="ui-arrow ui-arrow--diagonal"></span></a>
      </div>
    </section>
  </div>`;
}
