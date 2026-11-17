(() => {
  'use strict';
  const config = window.OBLEPIHA_ANALYTICS;
  const counter = Number(config?.metrikaId);
  const pages = { '/': 'home', '/index.html': 'home', '/rooms.html': 'rooms', '/cafe.html': 'cafe', '/banquet.html': 'banquet', '/conference.html': 'conference', '/grill.html': 'grill', '/sauna.html': 'sauna', '/news.html': 'news', '/promotions.html': 'promotions', '/vacancies.html': 'vacancies' };
  const page = pages[location.pathname];
  if (window.__oblepihaAnalytics || !page || !config?.hosts?.includes(location.hostname) || location.protocol !== 'https:' || !Number.isSafeInteger(counter) || counter <= 0) return;
  window.__oblepihaAnalytics = true;
  // Explicit pageviews keep unknown query fields and fragments out of telemetry.
  const cleanUrl = new URL(location.origin + location.pathname);
  for (const key of ['id', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'yclid', 'gclid', 'ysclid']) {
    const value = new URL(location.href).searchParams.get(key);
    if (value && value.length <= 200 && !/[@\r\n]/.test(value)) cleanUrl.searchParams.set(key, value);
  }
  let referer = '';
  try { const source = new URL(document.referrer); referer = source.origin + source.pathname; } catch {}
  window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
  window.ym.l = Date.now();
  window.dataLayer = window.dataLayer || [];
  window.ym(counter, 'init', { ssr: true, defer: true, triggerEvent: true, clickmap: config.clickmap === true, trackLinks: config.trackLinks === true, accurateTrackBounce: true, webvisor: config.webvisor === true, ecommerce: 'dataLayer' });
  window.ym(counter, 'hit', cleanUrl.href, { title: document.title, referer, params: { page } });
  if (!document.querySelector('script[src^="https://mc.yandex.ru/metrika/tag.js"]')) {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://mc.yandex.ru/metrika/tag.js?id=' + counter;
    document.head.appendChild(script);
  }
  document.addEventListener('click', event => {
    if (!event.isTrusted || event.button !== 0) return;
    const link = event.target.closest('a');
    if (!link) return;
    const position = link.closest('header') ? 'header' : link.closest('.site-closing') ? 'footer' : 'content';
    const params = { page, position };
    let goal;
    if (link.hasAttribute('data-tl-booking-open')) {
      goal = 'booking_click'; params.service = 'rooms';
      const room = link.getAttribute('data-tl-room');
      if (/^\d{1,10}$/.test(room || '')) params.room = room;
    } else if (link.protocol === 'tel:') {
      goal = page === 'vacancies' && link.classList.contains('vacancy-apply') ? 'vacancy_apply' : 'phone_click';
      // Classify public business numbers without sending the actual number.
      params.service = ({ '+79132385484':'rooms', '+79609423311':'cafe', '+79640819904':'banquet', '+79237116891':'sauna' })[link.getAttribute('href').slice(4)] || page;
    } else {
      let target;
      try { target = new URL(link.href); } catch { return; }
      const channel = ({ 'vk.ru':'vk', 'vk.com':'vk', 't.me':'telegram', 'max.ru':'max' })[target.hostname];
      if (channel) { goal = 'messenger_click'; params.channel = channel; }
      else if (target.hostname === '2gis.ru' || target.hostname === 'yandex.ru' && target.pathname.startsWith('/maps/')) {
        goal = 'reviews_click'; params.channel = target.hostname === '2gis.ru' ? '2gis' : 'yandex_maps';
      } else if (target.origin === location.origin && target.pathname === '/news.html' && target.searchParams.has('id')) goal = 'news_read';
    }
    if (goal) window.ym(counter, 'reachGoal', goal, params);
  }, { capture: true });
})();
