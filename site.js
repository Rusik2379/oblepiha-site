(() => {
  const breakpoint = window.matchMedia('(max-width: 1439px)');
  const onHomePage = /(?:^|\/)index\.html$/.test(window.location.pathname) || window.location.pathname.endsWith('/');
  const homeHref = onHomePage ? '#home' : 'index.html#home';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const updateViewportWidth = () => document.documentElement.style.setProperty('--viewport-width', `${document.documentElement.clientWidth}px`);
  updateViewportWidth();
  window.addEventListener('resize', updateViewportWidth, { passive: true });

  document.querySelectorAll('.social-icon[aria-disabled="true"]').forEach((link) => {
    link.removeAttribute('aria-disabled');
    link.setAttribute('href', homeHref);
    link.setAttribute('aria-label', `${link.getAttribute('aria-label').split(' — ')[0]} — на главную`);
  });

  const footerIcons = new Map([
    ['Позвонить', 'assets/social/phone-white.png'],
    ['WhatsApp', 'assets/social/whatsapp-white.png'],
    ['Почта', 'assets/social/mail-white.png'],
    ['ВКонтакте', 'assets/social/vk-white.png'],
    ['Telegram', 'assets/social/telegram-white.png'],
  ]);

  document.querySelectorAll('.footer-socials .social-icon').forEach((link) => {
    const label = link.getAttribute('aria-label') || '';
    const icon = [...footerIcons].find(([name]) => label.startsWith(name));
    const image = link.querySelector('img');
    if (icon && image) image.src = icon[1];
  });

  document.querySelectorAll('.header').forEach((header) => {
    const toggle = header.querySelector('.menu-toggle');
    const nav = header.querySelector('[data-menu]');
    if (!toggle || !nav) return;

    const setOpen = (open) => {
      header.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      toggle.textContent = open ? '×' : '☰';
    };

    toggle.addEventListener('click', () => setOpen(!header.classList.contains('menu-open')));
    nav.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      if (!link) return;
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const href = link.getAttribute('href');
      const target = onHomePage && href?.startsWith('#') && document.getElementById(href.slice(1));
      if (target) {
        // Native fragment scrolling can also scroll clipped canvas ancestors in Firefox.
        // Close the menu first, then move only the document viewport once.
        event.preventDefault();
        setOpen(false);
        window.requestAnimationFrame(() => {
          const offset = getComputedStyle(header).position === 'fixed' ? header.getBoundingClientRect().height + 12 : 0;
          const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);
          if (window.location.hash !== href) window.history.pushState(null, '', href);
          window.scrollTo({ top, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
        });
      } else {
        setOpen(false);
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setOpen(false);
    });
    breakpoint.addEventListener?.('change', (event) => {
      if (!event.matches) setOpen(false);
    });
  });
})();
