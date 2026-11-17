(() => {
  const feed = document.getElementById('vacancy-feed');
  const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text) node.textContent = text; return node; };
  (async () => {
    try {
      const response = await fetch('/api/vacancies', { cache: 'no-store' });
      if (!response.ok) throw new Error('Unavailable');
      const vacancies = await response.json();
      if (!Array.isArray(vacancies)) throw new Error('Invalid vacancies');
      vacancies.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      feed.replaceChildren(...vacancies.map(vacancy => {
        const card = el('article', 'vacancy-card'), meta = el('div', 'vacancy-meta');
        card.append(el('h3', '', vacancy.title));
        if (vacancy.salary) meta.append(el('span', '', 'Оплата: ' + vacancy.salary));
        if (vacancy.schedule) meta.append(el('span', '', 'График: ' + vacancy.schedule));
        if (meta.childNodes.length) card.append(meta);
        card.append(el('p', 'vacancy-text', vacancy.text));
        const apply = el('a', 'vacancy-apply', 'Откликнуться по телефону');
        apply.href = 'tel:' + vacancy.phone.replace(/[^+\d]/g, '');
        card.append(apply, el('span', 'vacancy-contact', vacancy.phone));
        return card;
      }));
      if (!vacancies.length) feed.append(el('p', 'vacancy-message', 'Сейчас открытых вакансий нет. Когда появятся новые предложения, мы опубликуем их здесь.'));
    } catch {
      if (feed.dataset.serverRendered) return;
      const message = el('p', 'vacancy-message', 'Не удалось загрузить вакансии. Обновите страницу или ');
      const contact = el('a', '', 'свяжитесь с нами'); contact.href = 'index.html#contacts';
      message.append(contact, document.createTextNode('.')); feed.replaceChildren(message);
    }
  })();
})();
