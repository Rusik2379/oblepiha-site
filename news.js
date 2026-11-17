(() => {
  const container = document.querySelector('[data-news-feed]');
  if (!container) return;
  const homepageSection = container.closest('#news');
  let totalPosts = Number(container.dataset.total) || 0;
  const newsWord = count => count % 100 >= 11 && count % 100 <= 14 ? 'новостей' : count % 10 === 1 ? 'новость' : count % 10 >= 2 && count % 10 <= 4 ? 'новости' : 'новостей';
  function updateSummary() {
    if (!homepageSection) return;
    const shown = [...container.querySelectorAll('.news-card')].filter(card => getComputedStyle(card).display !== 'none').length;
    const summary = homepageSection.querySelector('[data-news-summary]');
    const label = homepageSection.querySelector('[data-news-more-label]');
    if (summary) { summary.textContent = `Показано ${shown} из ${totalPosts}`; summary.hidden = !totalPosts; }
    const remaining = Math.max(0, totalPosts - shown);
    if (label) label.textContent = remaining ? `Ещё ${remaining} ${newsWord(remaining)}` : 'Все новости';
  }
  if (homepageSection) {
    let fitFrame = 0;
    const fitPreview = () => {
      fitFrame = 0;
      updateSummary();
      if (innerWidth < 1000) { container.style.removeProperty('--news-card-width'); return; }
      const headerHeight = document.querySelector('.header')?.getBoundingClientRect().height || 0;
      const available = innerHeight - headerHeight - 12;
      const overflow = homepageSection.offsetHeight - available;
      const cardWidth = container.querySelector('.news-card')?.getBoundingClientRect().width;
      // Measure the actual heading, wrapped text and buttons instead of guessing their height.
      // Very short screens retain a readable minimum and can scroll through the section.
      if (overflow > 1 && cardWidth > 180) {
        container.style.setProperty('--news-card-width', Math.max(180, Math.floor(cardWidth - (overflow + 8) * .8)) + 'px');
      }
    };
    const scheduleFit = () => { if (!fitFrame) fitFrame = requestAnimationFrame(fitPreview); };
    new ResizeObserver(scheduleFit).observe(homepageSection);
    new MutationObserver(scheduleFit).observe(container, { childList: true });
    window.addEventListener('resize', () => { container.style.removeProperty('--news-card-width'); scheduleFit(); }, { passive: true });
    document.fonts?.ready.then(scheduleFit);
    scheduleFit();
  }
  const date = value => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Barnaul' }).format(new Date(value));
  const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Barnaul' }).format(new Date());
  const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text) node.textContent = text; return node; };
  const articleUrl = post => 'news.html?id=' + encodeURIComponent(post.id);
  function startLabel(post) { return post.startDate ? `${post.startDate > today() ? 'Начало акции: ' : 'Акция с '}${date(post.startDate + 'T12:00:00+07:00')}` : ''; }
  function meta(post) {
    const node = el('div', 'news-card-meta');
    node.append(el('span', 'news-card-kind', post.kind === 'promotion' ? 'Акция' : 'Новость'));
    const time = el('time', '', date(post.publishedAt)); time.dateTime = post.publishedAt; node.append(time); return node;
  }
  function image(post, className) { const img = el('img', className); img.src = post.image; img.alt = post.title; img.loading = 'lazy'; return img; }
  function card(post) {
    const node = el('article', 'news-card'); node.dataset.promotion = post.promotion || '';
    const cover = el('a', 'news-card-image-link'); cover.href = articleUrl(post); cover.setAttribute('aria-label', post.title); cover.append(image(post, 'news-card-image'));
    if (post.pinned) cover.append(el('span', 'news-card-pin', 'Закреплено'));
    const body = el('div', 'news-card-body'); body.append(meta(post));
    const h3 = el('h3'); const title = el('a', '', post.title); title.href = articleUrl(post); h3.append(title); body.append(h3);
    if (post.startDate) body.append(el('p', 'news-card-start', startLabel(post)));
    body.append(el('p', 'news-card-excerpt', post.text.split('\n\n').slice(0, 2).join(' ')));
    const more = el('a', 'news-card-more', 'Читать подробнее'); more.href = articleUrl(post); more.append(el('span', '', '→')); body.append(more); node.append(cover, body); return node;
  }
  function article(post) {
    const node = el('article', 'news-article'); node.dataset.promotion = post.promotion || '';
    node.append(meta(post), el('h1', '', post.title));
    if (post.pinned) node.append(el('p', 'news-card-start', 'Закреплённая публикация'));
    if (post.startDate) node.append(el('p', 'news-card-start', startLabel(post)));
    node.append(image(post, 'news-article-image'), el('p', 'news-article-text', post.text));
    if (['winter', 'partners'].includes(post.promotion)) { const link = el('a', 'news-button', 'Подробнее об условиях →'); link.href = 'promotions.html#' + post.promotion; node.append(link); }
    document.title = post.title + ' — Облепиха'; container.replaceChildren(node); container.classList.remove('news-grid');
    const canonical = 'https://oblepiha-22.ru/' + articleUrl(post);
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonical);
    const updates = {'og:title': document.title, 'og:description':post.text.replace(/\s+/g, ' ').slice(0,170), 'og:type':'article', 'og:url':canonical, 'og:image':new URL(post.image, 'https://oblepiha-22.ru/').href, 'og:image:alt':post.title};
    for (const [key,value] of Object.entries(updates)) document.querySelector(`meta[property="${key}"]`)?.setAttribute('content',value);
    document.querySelector('[data-news-list-heading]')?.setAttribute('hidden', '');
    document.querySelector('.news-filters')?.setAttribute('hidden', '');
  }
  let posts = [], filter = 'all';
  function render() {
    let chosen = posts.filter(post => filter === 'all' || post.kind === filter);
    const limit = Number(container.dataset.limit); if (limit) chosen = chosen.slice(0, limit);
    totalPosts = posts.length;
    container.dataset.total = String(totalPosts);
    container.style.removeProperty('--news-card-width');
    container.dataset.count = String(chosen.length); container.replaceChildren(...chosen.map(card));
    if (!chosen.length) container.append(el('p', 'news-empty', 'Здесь скоро появятся новые публикации.'));
    updateSummary();
  }
  document.querySelectorAll('[data-news-filter]').forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.newsFilter;
    document.querySelectorAll('[data-news-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button))); render();
  }));
  (async () => {
    try {
      let response = await fetch('/api/news', { cache: 'no-store' }).catch(() => null);
      if (!response?.ok) response = await fetch('news-seed.json', { cache: 'no-store' });
      posts = await response.json(); if (!Array.isArray(posts)) throw new Error('Invalid news');
      posts.sort((a,b) => Number(b.pinned) - Number(a.pinned) || new Date(b.publishedAt) - new Date(a.publishedAt));
      const id = new URLSearchParams(location.search).get('id');
      const back = document.querySelector('.news-back');
      if (back && !id) { back.href = 'index.html#news'; back.textContent = '← На главную'; }
      if (container.dataset.mode === 'all' && id) {
        const post = posts.find(p => p.id === id);
        if (post) article(post); else if (!container.dataset.serverRendered) container.replaceChildren(el('p', 'news-empty', 'Публикация не найдена. Вернитесь к списку новостей.'));
      } else render();
    } catch { if (!container.dataset.serverRendered) container.replaceChildren(el('p', 'news-empty', 'Не удалось загрузить новости. Обновите страницу или загляните позже.')); }
  })();
})();
