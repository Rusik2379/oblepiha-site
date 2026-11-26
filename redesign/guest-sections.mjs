export function reviewsSection(){
 const source='https://2gis.ru/novoaltajsk/firm/563479234723565/tab/reviews';
 const reviews=[
  ['review-01-sachkova.webp','О гостинице и кафе','Татьяна Сачкова'],
  ['review-05-petrochenko.webp','О зале и гостеприимстве','Татьяна Петроченко'],
  ['review-02-fillina.webp','Впечатления гостя','Оригинальный отзыв'],
  ['review-03-upraviteleva.webp','Впечатления гостя','Оригинальный отзыв'],
  ['review-04-verstak.webp','Впечатления гостя','Оригинальный отзыв'],
  ['review-06-kobeleva.webp','Впечатления гостя','Оригинальный отзыв'],
  ['review-07-cityspirit.webp','Впечатления гостя','Оригинальный отзыв'],
  ['review-08-bugaeva.webp','Впечатления гостя','Оригинальный отзыв'],
  ['review-09-chernysheva.webp','Впечатления гостя','Оригинальный отзыв']
 ];
 const arrow='<svg viewBox="0 0 32 24" aria-hidden="true"><path d="M3 12h25m-7-7 7 7-7 7"/></svg>';
 return `<section class="home-reviews section" id="reviews"><div class="guest-content wrap">
<div class="guest-heading"><h2>Гости<br><em>об «Облепихе»</em></h2><p>Впечатления, которыми делятся<br>после поездок и встреч у нас</p></div>
<div class="guest-carousel" data-review-carousel role="region" aria-roledescription="карусель" aria-label="Отзывы гостей"><div class="guest-reviews" data-review-track tabindex="0" aria-label="Лента отзывов, листайте стрелками или свайпом">${reviews.map(([file,topic,author],i)=>`<figure role="group" aria-roledescription="слайд" aria-label="Отзыв ${i+1} из ${reviews.length}"><a class="guest-review-image" href="${source}" target="_blank" rel="noopener" aria-label="${author} — отзыв в 2ГИС"><img src="../assets/reviews-final/${file}" alt="${author} — оригинальный отзыв из 2ГИС, ${i+1} из ${reviews.length}" loading="lazy" decoding="async"></a><figcaption><span>${topic}</span><span>${author} · 2ГИС</span></figcaption></figure>`).join('')}</div><div class="guest-carousel-controls"><span class="guest-review-count" data-review-count aria-live="polite">1–2 из ${reviews.length}</span><button type="button" data-review-step="-1" aria-label="Предыдущие отзывы" disabled>${arrow}</button><button type="button" data-review-step="1" aria-label="Следующие отзывы">${arrow}</button></div></div>
<div class="guest-reviews-footer"><div class="guest-more"><span>Больше отзывов о нас</span><svg viewBox="0 0 100 40" aria-hidden="true"><path d="M2 7C15 35 59 39 91 17m-17 1 20-4-5 18"/></svg></div><div class="guest-review-platforms"><a href="${source}" target="_blank" rel="noopener"><img class="review-platform-icon" src="images/brands/2gis.png" width="36" height="36" alt="" aria-hidden="true">2ГИС${arrow}</a><a href="https://yandex.ru/maps/org/oblepikha/24483320354/reviews/" target="_blank" rel="noopener"><img class="review-platform-icon" src="images/brands/yandex-maps.svg" width="36" height="36" alt="" aria-hidden="true">Яндекс Карты${arrow}</a></div></div>
</div></section>`;
}

export function contactMessengers(){
 const max='<svg viewBox="0 0 720 720" aria-hidden="true"><path d="M350.4,9.6C141.8,20.5,4.1,184.1,12.8,390.4c3.8,90.3,40.1,168,48.7,253.7,2.2,22.2-4.2,49.6,21.4,59.3,31.5,11.9,79.8-8.1,106.2-26.4,9-6.1,17.6-13.2,24.2-22,27.3,18.1,53.2,35.6,85.7,43.4,143.1,34.3,299.9-44.2,369.6-170.3C799.6,291.2,622.5-4.6,350.4,9.6h0ZM269.4,504c-11.3,8.8-22.2,20.8-34.7,27.7-18.1,9.7-23.7-.4-30.5-16.4-21.4-50.9-24-137.6-11.5-190.9,16.8-72.5,72.9-136.3,150-143.1,78-6.9,150.4,32.7,183.1,104.2,72.4,159.1-112.9,316.2-256.4,218.6h0Z"/></svg>';
 const telegram='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m20.5 4.1-3.1 15c-.2 1.1-.9 1.4-1.8.8l-4.7-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.4-4.9 8.8-8c.4-.3-.1-.5-.6-.2L5.3 12.9.7 11.5c-1-.3-1-1 .2-1.4L19 3.2c.8-.3 1.7.2 1.5.9Z"/></svg>';
 const vk='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.9 17.9c-5.5 0-8.6-3.8-8.8-10.2h2.8c.1 4.7 2.2 6.7 3.9 7.1V7.7h2.6v4.1c1.6-.2 3.3-2 3.9-4.1h2.6c-.4 2.5-2.3 4.3-3.6 5.1 1.3.6 3.4 2.2 4.2 5.1h-2.9c-.6-1.9-2.2-3.4-4.2-3.6v3.6Z"/></svg>';
 return `<div class="home-socials" aria-label="Мы в мессенджерах и социальных сетях"><a href="https://max.ru/id222201179247_1_bot" target="_blank" rel="noopener"><span class="messenger-icon">${max}</span><span>MAX</span></a><a href="https://t.me/+79132385484" target="_blank" rel="noopener"><span class="messenger-icon">${telegram}</span><span>Telegram</span></a><a href="https://vk.ru/club229298300" target="_blank" rel="noopener"><span class="messenger-icon">${vk}</span><span>ВКонтакте</span></a></div>`;
}
