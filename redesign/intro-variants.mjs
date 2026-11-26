// Same approved copy and photographs, two local compositions.
export function introSection(variant,{arrow}){
 const heading='<h2>Ваш отдых<br><em>в «Облепихе»</em></h2>';
 const lead='<p class="intro-variant-lead">Гостиница, кафе и место для встреч в Новоалтайске</p>';
 const story='<p class="intro-variant-story">Приезжайте переночевать после дороги, остановиться на время командировки или провести несколько дней с близкими. В комплексе можно поесть, отдохнуть в сауне с джакузи и устроить семейное или деловое событие</p>';
 const address='<a class="intro-address" href="#contacts">Новоалтайск, Дорожная, 13 '+arrow+'</a>';
 const facts='<div class="intro-facts"><div><strong>26</strong><span>номеров в гостинице</span></div><div><strong>24/7</strong><span>стойка размещения</span></div><div class="intro-fact-parking"><span class="intro-parking-symbol" aria-hidden="true"><svg viewBox="0 0 40 40" focusable="false"><rect x="3" y="3" width="34" height="34" rx="7"/><path d="M15 28V12h7a5 5 0 0 1 0 10h-7"/></svg></span><div class="intro-parking-copy"><strong>Бесплатная парковка</strong><span>Для гостей гостиницы</span></div></div></div>';
 const facade='<img src="images/preview-facade-840.webp" srcset="images/preview-facade-480.webp 480w, images/preview-facade-840.webp 840w" sizes="(max-width: 800px) 60vw, 40vw" width="840" height="1050" alt="Фасад гостиничного комплекса «Облепиха»" loading="lazy" decoding="async">';
 const room='<img src="images/preview-standard-840.webp" srcset="images/preview-standard-480.webp 480w, images/preview-standard-840.webp 840w" sizes="(max-width: 800px) 40vw, 30vw" width="840" height="840" alt="Номер с двуспальной кроватью в гостинице «Облепиха»" loading="lazy" decoding="async">';
 if(variant==='editorial')return `<section class="hotel-intro section wrap intro-editorial" id="about"><div class="intro-editorial-grid"><div class="intro-editorial-photos"><figure class="intro-facade">${facade}</figure><figure class="intro-room">${room}</figure></div><div class="intro-editorial-copy">${heading}${lead}${story}${address}</div></div>${facts}</section>`;
 if(variant==='panorama')return `<section class="hotel-intro section wrap intro-panorama" id="about"><div class="intro-panorama-heading">${heading}<div class="intro-panorama-copy">${lead}${story}${address}</div></div><div class="intro-panorama-photos"><figure class="intro-facade">${facade}</figure><figure class="intro-room">${room}</figure></div>${facts}</section>`;
 throw new Error('Unknown intro variant: '+variant);
}
