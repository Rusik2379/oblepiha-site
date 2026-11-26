const photos = [
  ['01', 'Финская парная', 'Деревянная парная с широкими полками'],
  ['03', 'Джакузи и зона отдыха', 'Джакузи и стол с диванами в зоне отдыха'],
  ['02', 'Внутри парной', 'Парная с деревянной отделкой и мягким светом'],
];

export function saunaPage({ phone, phoneText }) {
  const call = 'tel:' + phone;
  return `<div class="sauna-page">
    <section class="sauna-hero" aria-labelledby="sauna-title">
      <div class="sauna-hero-inner wrap">
        <div class="sauna-hero-copy">
          <nav class="sauna-crumb" aria-label="Путь до страницы"><a href="index.html">Главная</a><span aria-hidden="true">/</span><span aria-current="page">Сауна</span></nav>
          <h1 id="sauna-title">Финская сауна <em>с джакузи</em></h1>
          <p>Финская парная, джакузи с гидромассажем и отдельная комната отдыха для вашей компании</p>
          <div class="sauna-page-actions">
            <a class="sauna-page-button" href="${call}">Записаться в сауну <span aria-hidden="true">↗</span></a>
            <a class="sauna-page-link" href="#sauna-prices">Посмотреть цены <span aria-hidden="true">↓</span></a>
          </div>
        </div>
        <img class="sauna-hero-image" src="../assets/sauna-page/slide-01.webp" alt="Финская парная комплекса «Облепиха»" width="1920" height="1108" fetchpriority="high" decoding="async">
      </div>
    </section>
    <section id="sauna-prices" class="sauna-page-section wrap" aria-labelledby="sauna-prices-title">
      <div class="sauna-section-heading">
        <h2 id="sauna-prices-title">Стоимость <em>посещения</em></h2>
        <p>Свободное время, продолжительность и условия посещения уточняйте по телефону <a class="sauna-page-link" href="${call}">${phoneText}</a></p>
      </div>
      <dl class="sauna-price-list">
        <div><dt>До 6 человек</dt><dd>1 500 ₽</dd></div>
        <div><dt>До 8 человек</dt><dd>2 000 ₽</dd></div>
        <div><dt>За каждого следующего гостя</dt><dd>+200 ₽</dd></div>
      </dl>
    </section>
    <section class="sauna-interiors" aria-labelledby="sauna-interiors-title">
      <div class="sauna-page-section wrap">
        <div class="sauna-section-heading">
          <h2 id="sauna-interiors-title">Парная <em>и зона отдыха</em></h2>
          <p>Нажмите на фотографию, чтобы рассмотреть её</p>
        </div>
        <div class="sauna-page-gallery">
          ${photos.map(([number, caption, alt]) => {
            const src = `../assets/sauna-page/slide-${number}.webp`;
            return `<figure>
              <button type="button" data-gallery="sauna-interiors" data-photo="${src}" data-caption="${caption}" aria-label="Увеличить фото: ${caption}">
                <img src="${src}" alt="${alt}" width="1920" height="1108" loading="lazy" decoding="async">
                <span aria-hidden="true">↗</span>
              </button>
              <figcaption>${caption}</figcaption>
            </figure>`;
          }).join('')}
        </div>
      </div>
    </section>
    <section class="sauna-page-section sauna-visit wrap" aria-labelledby="sauna-visit-title">
      <div>
        <h2 id="sauna-visit-title">Как <em>приехать</em></h2>
        <address>Новоалтайск, ул. Дорожная, 13</address>
        <p>Душ и стирка с сушкой доступны без проживания</p>
        <a class="sauna-page-link" href="index.html#shower-heading">О душе и стирке <span aria-hidden="true">↗</span></a>
      </div>
      <div class="sauna-page-actions">
        <a class="sauna-page-button" href="${call}">${phoneText} <span aria-hidden="true">↗</span></a>
        <a class="sauna-page-link" href="https://yandex.ru/maps/org/oblepikha/24483320354/" target="_blank" rel="noopener">Построить маршрут <span aria-hidden="true">↗</span></a>
      </div>
    </section>
  </div>`;
}
