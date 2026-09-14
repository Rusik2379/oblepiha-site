(() => {
  const DESIGN_W = 1920;
  const DESIGN_H = 13984;
  // Reflow the same content on smaller screens; never shrink a phone-sized canvas.
  const REFLOW_WIDTH = 1439;
  const MAX_SCALE = 1;
  const stage = document.getElementById('design');
  const viewport = document.getElementById('viewport');
  let resizeFrame = 0;

  function fit() {
    const availableWidth = Math.max(1, document.documentElement.clientWidth);
    document.documentElement.style.setProperty('--viewport-width', `${availableWidth}px`);
    if (window.matchMedia(`(max-width: ${REFLOW_WIDTH}px)`).matches) {
      stage.style.left = '';
      stage.style.transform = '';
      viewport.style.height = '';
      document.documentElement.style.setProperty('--site-scale', '1');
      return;
    }
    const scale = Math.min(availableWidth / DESIGN_W, MAX_SCALE);
    const renderedWidth = DESIGN_W * scale;
    stage.style.left = `${Math.max(0, (availableWidth - renderedWidth) / 2)}px`;
    stage.style.transform = `scale(${scale})`;
    viewport.style.height = `${Math.ceil(DESIGN_H * scale)}px`;
    document.documentElement.style.setProperty('--site-scale', String(scale));
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
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let active = 1;
  let timer = null;
  const AUTOPLAY_MS = 5200;

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
