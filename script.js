(() => {
  // Reflow the same content on smaller screens; never shrink a phone-sized canvas.
  const REFLOW_WIDTH = 1439;
  const stage = document.getElementById('design');
  const viewport = document.getElementById('viewport');
  let resizeFrame = 0;

  // Keep short Russian prepositions and conjunctions with the following word.
  // This prevents typographic orphans such as a lone "в" or "на" at line ends.
  function protectShortWords(root) {
    const pattern = /(^|[\s(«„"—–-])(в|во|на|и|а|но|с|со|к|ко|у|о|об|от|до|за|по|из|для|под|над|при|не|ни|же|ли|бы)\s+(?=[а-яё0-9«„"])/g;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;

    while ((node = walker.nextNode())) {
      const parentTag = node.parentElement?.tagName;
      if (parentTag === 'SCRIPT' || parentTag === 'STYLE' || parentTag === 'NOSCRIPT') continue;
      node.nodeValue = node.nodeValue.replace(pattern, '$1$2\u00a0');
    }
  }

  protectShortWords(stage);

  const desktopHeader = document.querySelector('.header');
  const desktopQuery = window.matchMedia('(min-width: 1000px)');
  const headerSections = [
    ['.hero', 'hero'], ['.about-panel', 'warm'],
    ['.idea-section', 'paper'], ['.services-section', 'paper'],
    ['.reviews-section', 'cream'], ['.winter-promo', 'cream'],
    ['.news-section', 'warm'], ['.partners-promo', 'warm'], ['.contacts-area', 'cream'],
    ['.closing-area', 'dark'],
  ].map(([selector, tone]) => ({ element: document.querySelector(selector), tone }));
  let headerFrame = 0;
  function updateHeaderTone() {
    headerFrame = 0;
    if (!desktopHeader) return;
    if (!desktopQuery.matches) {
      delete desktopHeader.dataset.tone;
      return;
    }
    // Follow the visible section below the fixed header, including anchor spacing.
    const sampleY = desktopHeader.getBoundingClientRect().height + 20;
    const section = headerSections.findLast(({ element }) => {
      if (!element) return false;
      const bounds = element.getBoundingClientRect();
      return bounds.top <= sampleY && bounds.bottom > sampleY;
    });
    // The short footer cannot reach the header at the end of the document.
    const closing = headerSections.at(-1).element;
    const atPageEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    const footerVisible = closing && closing.getBoundingClientRect().top < window.innerHeight;
    desktopHeader.dataset.tone = atPageEnd && footerVisible ? 'dark' : section?.tone || 'cream';
  }
  function scheduleHeaderTone() {
    if (!headerFrame) headerFrame = requestAnimationFrame(updateHeaderTone);
  }
  window.addEventListener('scroll', scheduleHeaderTone, { passive: true });
  window.addEventListener('resize', scheduleHeaderTone, { passive: true });
  window.addEventListener('load', scheduleHeaderTone);
  new ResizeObserver(scheduleHeaderTone).observe(stage);
  desktopQuery.addEventListener('change', scheduleHeaderTone);
  updateHeaderTone();

  // One-time entrance animations never hide content while waiting for JavaScript.
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const revealed = new WeakSet();
  const revealAnimations = new Set();
  let revealObserver;
  const revealElements = Array.from(document.querySelectorAll([
    '.hero-content', '.about-option-collage', '.about-option-copy',
    '.approach-heading', '.approach-section .detail', '.idea-photo', '.idea-copy',
    '.services-heading', '.service-card', '.reviews-heading', '.reviews-2gis-block', '.review-desktop-heading',
    '.news-section-heading', '.news-section-actions', '.winter-promo-title', '.winter-info-card', '.winter-tea-card', '.winter-ski-card',
    '.partners-copy', '.partners-visual', '.partner-step', '.partners-benefit',
    '.contacts-script-title', '.contact-lines', '.closing-title', '.closing-actions',
  ].join(', ')));
  function configureReveals() {
    revealObserver?.disconnect();
    revealAnimations.forEach(animation => animation.cancel());
    revealAnimations.clear();
    if (!desktopQuery.matches || motionPreference.matches) return;
    const headerOffset = (desktopHeader?.getBoundingClientRect().height || 0) + 12;
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting || revealed.has(target)) return;
        revealed.add(target);
        revealObserver.unobserve(target);
        const peers = Array.from(target.parentElement.children).filter(element =>
          element.matches('.service-card, .detail, .partner-step, .partners-benefit'));
        const delay = Math.max(0, peers.indexOf(target) % 3) * 80;
        const animation = target.animate([
          { opacity: 0, transform: 'translateY(24px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], { duration: 650, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
        revealAnimations.add(animation);
        animation.finished.then(() => revealAnimations.delete(animation)).catch(() => {});
      });
    }, { rootMargin: `-${headerOffset}px 0px -32px 0px`, threshold: 0.12 });
    revealElements.forEach(element => {
      if (!revealed.has(element)) revealObserver.observe(element);
    });
  }
  desktopQuery.addEventListener('change', configureReveals);
  motionPreference.addEventListener('change', configureReveals);
  configureReveals();

  const scrollSections = Array.from(document.querySelectorAll([
    '.hero', '.about-option', '.approach-section', '.idea-section',
    '.services-section', '.reviews-section', '.news-section', '.winter-promo',
    '.partners-promo', '.contacts-area', '.closing-area',
  ].join(', ')));
  let wheelAmount = 0;
  let lastWheelTime = 0;
  let wheelLockUntil = 0;
  function hasOwnScroll(target) {
    for (let element = target instanceof Element ? target : null;
      element && element !== document.body; element = element.parentElement) {
      if (element.matches('input, textarea, select, [contenteditable="true"], .header-menu, .pages-dropdown-links')) return true;
      const overflow = getComputedStyle(element).overflowY;
      if (/auto|scroll/.test(overflow) && element.scrollHeight > element.clientHeight + 1) return true;
    }
    return false;
  }
  window.addEventListener('wheel', event => {
    if (document.querySelector('[id^="tl-lightbox-"], .site-ad-dialog[open]') ||
      !desktopQuery.matches || event.ctrlKey || event.defaultPrevented || !event.deltaY ||
      Math.abs(event.deltaX) > Math.abs(event.deltaY) || hasOwnScroll(event.target)) return;
    const now = performance.now();
    if (now < wheelLockUntil) {
      event.preventDefault();
      lastWheelTime = now;
      return;
    }
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
    if (now - lastWheelTime > 160 || Math.sign(delta) !== Math.sign(wheelAmount)) wheelAmount = 0;
    wheelAmount += delta;
    lastWheelTime = now;
    event.preventDefault();
    if (Math.abs(wheelAmount) < 40) return;
    const direction = Math.sign(wheelAmount);
    wheelAmount = 0;
    const offset = desktopHeader.getBoundingClientRect().height + 12;
    const availableHeight = innerHeight - offset;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    const targets = scrollSections.map(element => ({
      element,
      top: Math.min(maxScroll, Math.max(0, element.getBoundingClientRect().top + scrollY - offset)),
      height: element.getBoundingClientRect().height,
    }));
    const current = Math.max(0, targets.findLastIndex(section => section.top <= scrollY + 3));
    const readingEnd = section => Math.min(maxScroll,
      section.top + Math.max(0, section.height - availableHeight));
    let destination;
    if (direction > 0) {
      const next = targets[Math.min(current + 1, targets.length - 1)].top;
      const end = readingEnd(targets[current]);
      const needsMoreReading = current > 0 && scrollY < end - 3;
      // Stop at the bottom of a tall section before snapping to the next one.
      destination = needsMoreReading ? Math.min(end, scrollY + availableHeight * .75) : next;
    } else if (scrollY > targets[current].top + 3) {
      destination = Math.max(targets[current].top, scrollY - availableHeight * .75);
    } else {
      const previous = targets[Math.max(0, current - 1)];
      destination = previous.height > availableHeight + 1 && current > 1
        ? readingEnd(previous) : previous.top;
    }
    if (Math.abs(destination - scrollY) < 1) return;
    wheelLockUntil = now + (motionPreference.matches ? 180 : 800);
    window.scrollTo({ top: destination, behavior: motionPreference.matches ? 'instant' : 'smooth' });
  }, { passive: false });
  // Keyboard and navigation clicks can take over immediately from a wheel gesture.
  const releaseWheel = () => { wheelLockUntil = 0; wheelAmount = 0; };
  window.addEventListener('keydown', releaseWheel);
  document.addEventListener('pointerdown', releaseWheel);
  desktopQuery.addEventListener('change', releaseWheel);

  const pagesDropdown = document.querySelector('.pages-dropdown');
  document.addEventListener('click', (event) => {
    if (pagesDropdown && !pagesDropdown.contains(event.target)) pagesDropdown.open = false;
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && pagesDropdown?.open) {
      pagesDropdown.open = false;
      pagesDropdown.querySelector('summary').focus();
    }
  });
  window.matchMedia('(min-width: 1000px)').addEventListener('change', () => {
    if (pagesDropdown) pagesDropdown.open = false;
  });

  function fit() {
    const availableWidth = Math.max(1, document.documentElement.clientWidth);
    document.documentElement.style.setProperty('--viewport-width', `${availableWidth}px`);
    // All homepage layouts now use natural document flow, including desktop.
    stage.style.left = '';
    stage.style.transform = '';
    viewport.style.height = '';
    document.documentElement.style.setProperty('--site-scale', '1');
  }

  function scheduleFit() {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(fit);
  }

  fit();
  scheduleFit();
  window.addEventListener('resize', scheduleFit, { passive: true });
  window.addEventListener('orientationchange', scheduleFit, { passive: true });
  window.visualViewport?.addEventListener('resize', scheduleFit, { passive: true });

  window.matchMedia(`(max-width: ${REFLOW_WIDTH}px)`).addEventListener('change', () => {
    const header = document.querySelector('.header');
    const toggle = header?.querySelector('.menu-toggle');
    header?.classList.remove('menu-open');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Открыть меню');
      toggle.textContent = '☰';
    }
  });

  const carousel = document.querySelector('[data-carousel]');
  if (!carousel) return;

  const slides = Array.from(carousel.querySelectorAll('[data-review-card]'));
  const prevBtn = carousel.querySelector('.prev');
  const nextBtn = carousel.querySelector('.next');
  const dotsRoot = document.querySelector('[data-review-dots]');
  const reviewsStage = carousel.querySelector('.reviews-stage');
  const reviewCounter = document.querySelector('[data-review-counter]');
  carousel.setAttribute('tabindex', '0');
  carousel.setAttribute('role', 'region');
  carousel.setAttribute('aria-label', 'Отзывы гостей. Используйте стрелки для переключения.');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let active = 1;
  let timer = null;
  const AUTOPLAY_MS = 9000;

  function fitActiveReview() {
    if (!reviewsStage) return;
    const img = slides[active]?.querySelector('img');
    if (window.innerWidth <= 999 && img?.naturalWidth) {
      // Portrait reviews stay full-width and readable instead of shrinking into a short box.
      reviewsStage.style.height = `${Math.ceil(slides[active].clientWidth * img.naturalHeight / img.naturalWidth) + 56}px`;
    } else {
      reviewsStage.style.height = '';
    }
  }
  window.addEventListener('resize', fitActiveReview, { passive: true });
  slides.forEach(slide => slide.querySelector('img')?.addEventListener('load', fitActiveReview));

  function circularDiff(index, current, total) {
    let diff = index - current;
    const half = total / 2;
    if (diff > half) diff -= total;
    if (diff < -half) diff += total;
    return diff;
  }

  function update() {
    fitActiveReview();
    slides.forEach((slide, index) => {
      const diff = circularDiff(index, active, slides.length);
      slide.dataset.pos = String(Math.max(-2, Math.min(2, diff)));
      slide.dataset.hidden = Math.abs(diff) > 2 ? 'true' : 'false';
      slide.setAttribute('aria-hidden', index === active ? 'false' : 'true');
    });

    Array.from(dotsRoot.children).forEach((dot, index) => {
      dot.classList.toggle('active', index === active);
      dot.setAttribute('aria-current', index === active ? 'true' : 'false');
    });
    if (reviewCounter) reviewCounter.textContent = `${String(active + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
  }

  function goTo(index) {
    active = (index + slides.length) % slides.length;
    update();
  }

  function next() { goTo(active + 1); }
  function prev() { goTo(active - 1); }

  function startAuto() {
    stopAuto();
    // Touch readers control the carousel themselves, without the page moving while reading.
    if (window.matchMedia('(max-width: 999px)').matches || reducedMotion.matches) return;
    timer = setInterval(next, AUTOPLAY_MS);
  }

  window.matchMedia('(max-width: 999px)').addEventListener('change', startAuto);
  reducedMotion.addEventListener('change', startAuto);

  function stopAuto() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  slides.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Показать отзыв ${index + 1}`);
    dot.addEventListener('click', () => {
      goTo(index);
      startAuto();
    });
    dotsRoot.appendChild(dot);
  });

  prevBtn?.addEventListener('click', () => {
    prev();
    startAuto();
  });

  nextBtn?.addEventListener('click', () => {
    next();
    startAuto();
  });
  carousel.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') prev(); else next();
    stopAuto();
  });
  slides.forEach((slide, index) => slide.addEventListener('click', event => {
    if (window.innerWidth < 1000 || event.target.closest('a')) return;
    goTo(index);
    stopAuto();
  }));

  carousel.addEventListener('mouseenter', stopAuto);
  carousel.addEventListener('mouseleave', startAuto);
  carousel.addEventListener('focusin', stopAuto);
  carousel.addEventListener('focusout', startAuto);

  let touchStartX = 0;
  let touchDeltaX = 0;

  carousel.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0].clientX;
    touchDeltaX = 0;
    stopAuto();
  }, { passive: true });

  carousel.addEventListener('touchmove', (event) => {
    touchDeltaX = event.changedTouches[0].clientX - touchStartX;
  }, { passive: true });

  carousel.addEventListener('touchend', () => {
    if (touchDeltaX > 45) prev();
    else if (touchDeltaX < -45) next();
    startAuto();
  }, { passive: true });

  update();
  startAuto();
})();
