import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const siteUrl = 'https://oblepiha-22.ru/';
export const siteName = 'Гостиничный комплекс «Облепиха»';
export const pages = {
  'index.html': ['Облепиха — гостиница в Новоалтайске, кафе и отдых', 'Гостиничный комплекс «Облепиха» в Новоалтайске рядом с Барнаулом: номера, кафе, гриль-бар, банкетный и конференц-залы, финская сауна. Дорожная, 13.', 'assets/hero.webp', 'Главная'],
  'rooms.html': ['Номера гостиницы в Новоалтайске — Облепиха', 'Номера гостиницы «Облепиха» в Новоалтайске: фотографии, удобства и стоимость проживания. Выберите номер и забронируйте онлайн. Адрес: Дорожная, 13.', 'assets/rooms/standard_double/01.webp', 'Гостиница'],
  'cafe.html': ['Кафе с детским уголком в Новоалтайске — Облепиха', 'Кафе «Облепиха» в Новоалтайске: блюда из свежих продуктов, еда с собой и детский уголок с игрушками. Посмотрите фотографии и приезжайте на Дорожную, 13.', 'assets/cafe-pdf/slide-01.webp', 'Кафе'],
  'banquet.html': ['Банкетный зал в Новоалтайске — Облепиха', 'Банкетный зал «Облепиха» в Новоалтайске для свадеб, юбилеев, корпоративов и семейных праздников. Фотографии зала и контакты для обсуждения мероприятия.', 'assets/banquet-page/slide-02.webp', 'Банкетный зал'],
  'conference.html': ['Конференц-зал в Новоалтайске — Облепиха', 'Конференц-зал «Облепиха» в Новоалтайске для встреч, переговоров, презентаций и деловых мероприятий. Фотографии, оборудование и контакты комплекса.', 'assets/conference-page/slide-01.webp', 'Конференц-зал'],
  'grill.html': ['Гриль-бар в Новоалтайске — Облепиха', 'Гриль-бар «Облепиха» в Новоалтайске: сочные блюда, уютный интерьер и отдых с друзьями. Посмотрите фотографии и свяжитесь с нами. Дорожная, 13.', 'assets/grill-page/slide-01.webp', 'Гриль-бар'],
  'sauna.html': ['Финская сауна с джакузи в Новоалтайске — Облепиха', 'Финская сауна и джакузи в комплексе «Облепиха», Новоалтайск. Фотографии парной и зоны отдыха, условия посещения и запись по телефону.', 'assets/sauna-page/slide-01.webp', 'Финская сауна'],
  'news.html': ['Новости и акции комплекса Облепиха в Новоалтайске', 'Последние новости, акции и предложения гостиничного комплекса «Облепиха» в Новоалтайске. Даты начала акций и подробные условия участия.', 'assets/about-hotel.jpg', 'Новости и акции'],
  'promotions.html': ['Условия акций гостиничного комплекса — Облепиха', 'Подробные условия акций комплекса «Облепиха» в Новоалтайске. Облепиховый чай с 1 декабря 2026 года и предложения для гостей из Казахстана.', 'assets/about-hotel.jpg', 'Условия акций'],
  'vacancies.html': ['Вакансии в Новоалтайске — гостиничный комплекс Облепиха', 'Работа в гостиничном комплексе «Облепиха» в Новоалтайске: открытые вакансии, обязанности, условия и контактные телефоны для отклика.', 'assets/about-hotel.jpg', 'Вакансии'],
};

export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
const jsonLd = value => JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
const absolute = path => new URL(path, siteUrl).href;
export const canonicalFor = name => name === 'index.html' ? siteUrl : siteUrl + name;

export function seoHead(name, post = null, notFound = false) {
  const [baseTitle, baseDescription, baseImage, label] = pages[name];
  const title = notFound ? 'Публикация не найдена — Облепиха' : post ? post.title + ' — Облепиха' : baseTitle;
  const description = post ? post.text.replace(/\s+/g, ' ').slice(0, 170) : baseDescription;
  const url = canonicalFor(name) + (post ? '?id=' + encodeURIComponent(post.id) : '');
  const image = absolute(post?.image || baseImage);
  const hotel = {
    '@type':'Hotel', '@id':siteUrl + '#hotel', name:siteName, url:siteUrl,
    image:absolute('assets/about-hotel.jpg'), telephone:'+7-913-238-54-84',
    address:{'@type':'PostalAddress', addressLocality:'Новоалтайск', addressRegion:'Алтайский край', streetAddress:'ул. Дорожная, 13', addressCountry:'RU'},
    sameAs:['https://vk.ru/club229298300', 'https://2gis.ru/novoaltajsk/firm/563479234723565', 'https://yandex.ru/maps/org/oblepikha/24483320354/'],
    hasMap:'https://yandex.ru/maps/org/oblepikha/24483320354/',
  };
  const crumbs = [{ '@type':'ListItem', position:1, name:'Главная', item:siteUrl }];
  if (name !== 'index.html') crumbs.push({'@type':'ListItem', position:2, name:label, item:canonicalFor(name)});
  if (post) crumbs.push({'@type':'ListItem', position:3, name:post.title, item:url});
  const graph = [hotel,
    {'@type':'WebSite', '@id':siteUrl + '#website', url:siteUrl, name:siteName, alternateName:'Облепиха', inLanguage:'ru-RU', publisher:{'@id':hotel['@id']}},
    {'@type':name === 'news.html' && !post ? 'CollectionPage' : 'WebPage', '@id':url + '#webpage', url, name:title, description, inLanguage:'ru-RU', isPartOf:{'@id':siteUrl + '#website'}, about:{'@id':hotel['@id']}, primaryImageOfPage:{'@type':'ImageObject', url:image}, breadcrumb:{'@id':url + '#breadcrumbs'}},
    {'@type':'BreadcrumbList', '@id':url + '#breadcrumbs', itemListElement:crumbs},
  ];
  const serviceTypes = { 'rooms.html':'Проживание в гостинице', 'cafe.html':'Кафе', 'banquet.html':'Банкетный зал', 'conference.html':'Конференц-зал', 'grill.html':'Гриль-бар', 'sauna.html':'Финская сауна с джакузи' };
  if (serviceTypes[name]) {
    const service = {'@type':'Service', '@id':url + '#service', name:label + ' «Облепиха» в Новоалтайске', serviceType:serviceTypes[name], description, url, image, provider:{'@id':hotel['@id']}, areaServed:{'@type':'City', name:'Новоалтайск'}};
    graph.push(service);
    graph.find(node => node['@type'] === 'WebPage').mainEntity = {'@id':service['@id']};
  }
  if (post) graph.push({'@type':'BlogPosting', '@id':url + '#article', headline:post.title, description, image, datePublished:post.publishedAt, dateModified:post.updatedAt || post.publishedAt, inLanguage:'ru-RU', mainEntityOfPage:{'@id':url + '#webpage'}, author:{'@id':hotel['@id']}, publisher:{'@id':hotel['@id']}, articleBody:post.text});
  const meta = (key, value, property = false) => `<meta ${property ? 'property' : 'name'}="${key}" content="${escapeHtml(value)}"/>`;
  return `<!-- seo-head:start -->
<title>${escapeHtml(title)}</title>
${meta('description', description)}
${meta('robots', notFound ? 'noindex, follow' : 'index, follow, max-image-preview:large')}
<link rel="canonical" href="${escapeHtml(url)}"/>
${meta('og:title', title, true)}
${meta('og:description', description, true)}
${meta('og:type', post ? 'article' : 'website', true)}
${meta('og:url', url, true)}
${meta('og:site_name', siteName, true)}
${meta('og:locale', 'ru_RU', true)}
${meta('og:image', image, true)}
${meta('og:image:alt', post?.title || label + ' — Облепиха', true)}
${meta('twitter:card', 'summary_large_image')}
${meta('twitter:title', title)}
${meta('twitter:description', description)}
${meta('twitter:image', image)}
<script type="application/ld+json">${jsonLd({'@context':'https://schema.org', '@graph':graph})}</script>
<!-- seo-head:end -->`;
}

const date = value => new Intl.DateTimeFormat('ru-RU', {day:'numeric', month:'long', year:'numeric', timeZone:'Asia/Barnaul'}).format(new Date(value));
const today = () => new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Barnaul'}).format(new Date());
const articleUrl = post => 'news.html?id=' + encodeURIComponent(post.id);
const startLabel = post => post.startDate ? `${post.startDate > today() ? 'Начало акции: ' : 'Акция с '}${date(post.startDate + 'T12:00:00+07:00')}` : '';
const postMeta = post => `<div class="news-card-meta"><span class="news-card-kind">${post.kind === 'promotion' ? 'Акция' : 'Новость'}</span><time datetime="${escapeHtml(post.publishedAt)}">${escapeHtml(date(post.publishedAt))}</time></div>`;
function newsCard(post) {
  const url = escapeHtml(articleUrl(post));
  return `<article class="news-card" data-promotion="${escapeHtml(post.promotion || '')}"><a class="news-card-image-link" href="${url}" aria-label="${escapeHtml(post.title)}"><img class="news-card-image" src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" loading="lazy" decoding="async"/>${post.pinned ? '<span class="news-card-pin">Закреплено</span>' : ''}</a><div class="news-card-body">${postMeta(post)}<h3><a href="${url}">${escapeHtml(post.title)}</a></h3>${post.startDate ? `<p class="news-card-start">${escapeHtml(startLabel(post))}</p>` : ''}<p class="news-card-excerpt">${escapeHtml(post.text.split('\n\n').slice(0,2).join(' '))}</p><a class="news-card-more" href="${url}">Читать подробнее<span>→</span></a></div></article>`;
}
function newsArticle(post) {
  return `<article class="news-article" data-promotion="${escapeHtml(post.promotion || '')}">${postMeta(post)}<h1>${escapeHtml(post.title)}</h1>${post.pinned ? '<p class="news-card-start">Закреплённая публикация</p>' : ''}${post.startDate ? `<p class="news-card-start">${escapeHtml(startLabel(post))}</p>` : ''}<img class="news-article-image" src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" decoding="async" fetchpriority="high"/><p class="news-article-text">${escapeHtml(post.text)}</p>${['winter','partners'].includes(post.promotion) ? `<a class="news-button" href="promotions.html#${post.promotion}">Подробнее об условиях →</a>` : ''}</article>`;
}
const replaceFeed = (html, key, content) => html.replace(new RegExp(`<!-- ${key}:start -->[\\s\\S]*?<!-- ${key}:end -->`), () => `<!-- ${key}:start -->${content}<!-- ${key}:end -->`);

export function renderPublicPage(root, name, url, news, vacancies) {
  let html = readFileSync(resolve(root, name), 'utf8'), status = 200;
  const sorted = [...news].sort((a,b) => Number(b.pinned) - Number(a.pinned) || new Date(b.publishedAt) - new Date(a.publishedAt));
  const id = name === 'news.html' ? url.searchParams.get('id') : null;
  if (id !== null) {
    const post = news.find(p => p.id === id);
    status = post ? 200 : 404;
    html = html.replace(/<!-- seo-head:start -->[\s\S]*?<!-- seo-head:end -->/, () => seoHead(name, post, !post));
    html = html.replace(/<div class="news-section-heading" data-news-list-heading>[\s\S]*?<\/a><\/div>/, '');
    html = html.replace(/<div class="news-filters"[\s\S]*?<\/div>/, '');
    html = html.replace('class="news-grid" data-news-feed', 'data-news-feed');
    html = replaceFeed(html, 'news-feed', post ? newsArticle(post) : '<h1>Публикация не найдена</h1><p class="news-empty">Вернитесь к списку новостей.</p>');
  } else if (name === 'index.html' || name === 'news.html') {
    const posts = name === 'index.html' ? sorted.slice(0,4) : sorted;
    html = html.replace(/(<div\b[^>]*data-news-feed[^>]*)(>)/, (match, before, end) => before.replace(/ data-(?:count|total)="\d+"/g, '') + ` data-count="${posts.length}" data-total="${sorted.length}"` + end);
    html = replaceFeed(html, 'news-feed', posts.map(newsCard).join('') || '<p class="news-empty">Здесь скоро появятся новые публикации.</p>');
    if (name === 'index.html') {
      const remaining = sorted.length - posts.length;
      const word = remaining % 100 >= 11 && remaining % 100 <= 14 ? 'новостей' : remaining % 10 === 1 ? 'новость' : remaining % 10 >= 2 && remaining % 10 <= 4 ? 'новости' : 'новостей';
      html = html.replace(/<span class="news-section-summary" data-news-summary(?: hidden)?[^>]*>[\s\S]*?<\/span>/, `<span class="news-section-summary" data-news-summary${sorted.length ? '' : ' hidden'}>Показано ${posts.length} из ${sorted.length}</span>`);
      html = html.replace(/(<span data-news-more-label>)[\s\S]*?(<\/span>)/, `$1${remaining ? `Ещё ${remaining} ${word}` : 'Все новости'}$2`);
    }
    if (name === 'news.html') html = html.replace('href="news.html" class="news-back">← Все новости и акции', 'href="index.html#news" class="news-back">← На главную');
  } else if (name === 'vacancies.html') {
    const published = vacancies.filter(v => v.published).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    html = replaceFeed(html, 'vacancy-feed', published.map(v => `<article class="vacancy-card"><h3>${escapeHtml(v.title)}</h3><div class="vacancy-meta">${v.salary ? `<span>Оплата: ${escapeHtml(v.salary)}</span>` : ''}${v.schedule ? `<span>График: ${escapeHtml(v.schedule)}</span>` : ''}</div><p class="vacancy-text">${escapeHtml(v.text)}</p><a class="vacancy-apply" href="tel:${escapeHtml(v.phone.replace(/[^+\d]/g, ''))}">Откликнуться по телефону</a><span class="vacancy-contact">${escapeHtml(v.phone)}</span></article>`).join('') || '<p class="vacancy-message">Сейчас открытых вакансий нет. Когда появятся новые предложения, мы опубликуем их здесь.</p>');
  }
  html = html.replace(/data-news-feed(?: data-server-rendered="true")*/g, 'data-news-feed data-server-rendered="true"').replace(/id="vacancy-feed"(?: data-server-rendered="true")*/g, 'id="vacancy-feed" data-server-rendered="true"');
  return {html, status};
}

export function sitemap(news) {
  const entries = Object.keys(pages).map(name => `<url><loc>${escapeHtml(canonicalFor(name))}</loc></url>`);
  for (const post of news) {
    const modified = new Date(post.updatedAt || post.publishedAt);
    entries.push(`<url><loc>${escapeHtml(siteUrl + articleUrl(post))}</loc>${Number.isFinite(modified.getTime()) ? `<lastmod>${modified.toISOString()}</lastmod>` : ''}</url>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
}
