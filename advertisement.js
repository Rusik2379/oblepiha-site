(() => {
  const storageKey = 'oblepiha-advertisement-seen';
  const seen = revision => { try { return sessionStorage.getItem(storageKey) === revision; } catch { return false; } };
  const markSeen = revision => { try { sessionStorage.setItem(storageKey, revision); } catch {} };
  (async () => {
    try {
      const response = await fetch('/api/advertisement', { cache: 'no-store' });
      if (!response.ok) return;
      const ad = await response.json();
      if (!ad?.enabled || !ad.image || !ad.revision || seen(ad.revision)) return;
      const image = new Image(); image.className = 'site-ad-image'; image.alt = ad.title || 'Предложение «Облепихи»'; image.src = ad.image;
      await image.decode();
      // A booking dialog already opened by the guest takes priority.
      if (document.querySelector('[id^="tl-lightbox-"], dialog[open]')) return;
      const dialog = document.createElement('dialog'); dialog.className = 'site-ad-dialog'; dialog.setAttribute('aria-label', image.alt);
      const close = document.createElement('button'); close.type = 'button'; close.className = 'site-ad-close'; close.textContent = '×'; close.setAttribute('aria-label', 'Закрыть рекламу');
      const content = document.createElement(ad.link ? 'a' : 'div'); content.className = 'site-ad-content';
      if (ad.link) content.href = ad.link;
      content.append(image); dialog.append(close, content); document.body.append(dialog);
      let previousFocus;
      close.addEventListener('click', () => dialog.close());
      dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
      dialog.addEventListener('close', () => {
        document.documentElement.classList.remove('site-ad-open'); dialog.remove();
        if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
      }, { once: true });
      content.addEventListener('click', () => { if (ad.link) dialog.close(); });
      previousFocus = document.activeElement;
      dialog.showModal(); document.documentElement.classList.add('site-ad-open');
      markSeen(ad.revision); close.focus({ preventScroll: true });
    } catch { /* An unavailable banner must not interrupt the website. */ }
  })();
})();
