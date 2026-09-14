(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function preloadImages(sources) {
    sources.forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }

  function createSlider({ slider, image, previous, next, slides, insertBefore }) {
    if (!slider || !image || !previous || !next || slides.length < 2) return;

    let index = 0;
    let touchStartX = null;
    let touchStartY = null;
    let animating = false;
    slider.tabIndex = 0;

    preloadImages(slides);

    function lockControls(locked) {
      previous.disabled = locked;
      next.disabled = locked;
      slider.classList.toggle('is-sliding', locked);
    }

    async function show(target, direction = 1) {
      if (animating) return;

      const targetIndex = (target + slides.length) % slides.length;
      if (targetIndex === index) return;

      animating = true;
      lockControls(true);

      const incoming = new Image();
      incoming.className = 'slide-transition-image';
      incoming.src = slides[targetIndex];
      incoming.alt = '';
      // Keep the current photo visible until the next file is ready, including on slow connections.
      try {
        await incoming.decode();
      } catch {
        animating = false;
        lockControls(false);
        return;
      }
      if (reducedMotion) {
        index = targetIndex;
        image.src = slides[index];
        animating = false;
        lockControls(false);
        return;
      }
      incoming.style.transform = `translate3d(${direction > 0 ? '100%' : '-100%'}, 0, 0) scale(1.015)`;
      incoming.style.opacity = '.96';

      const anchor = insertBefore ? slider.querySelector(insertBefore) : null;
      slider.insertBefore(incoming, anchor);

      // Force the browser to paint the starting position before moving the slide.
      void incoming.offsetWidth;

      requestAnimationFrame(() => {
        image.style.transform = `translate3d(${direction > 0 ? '-100%' : '100%'}, 0, 0) scale(.985)`;
        image.style.opacity = '.72';
        incoming.style.transform = 'translate3d(0, 0, 0) scale(1)';
        incoming.style.opacity = '1';
      });

      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;

        index = targetIndex;
        image.src = slides[index];
        image.style.transition = 'none';
        image.style.transform = 'translate3d(0, 0, 0) scale(1)';
        image.style.opacity = '1';
        incoming.remove();

        void image.offsetWidth;
        image.style.transition = '';
        animating = false;
        lockControls(false);
      };

      incoming.addEventListener('transitionend', finish, { once: true });
      window.setTimeout(finish, 850);
    }

    previous.addEventListener('click', () => show(index - 1, -1));
    next.addEventListener('click', () => show(index + 1, 1));

    slider.addEventListener('touchstart', (event) => {
      touchStartX = event.changedTouches[0].clientX;
      touchStartY = event.changedTouches[0].clientY;
    }, { passive: true });

    slider.addEventListener('touchend', (event) => {
      if (touchStartX === null || animating) return;

      const deltaX = event.changedTouches[0].clientX - touchStartX;
      const deltaY = event.changedTouches[0].clientY - touchStartY;
      touchStartX = null;
      touchStartY = null;

      if (Math.abs(deltaX) < 45 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
      show(index + (deltaX < 0 ? 1 : -1), deltaX < 0 ? 1 : -1);
    }, { passive: true });

    slider.addEventListener('touchcancel', () => {
      touchStartX = null;
      touchStartY = null;
    }, { passive: true });

    slider.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') event.preventDefault();
      if (event.key === 'ArrowLeft') show(index - 1, -1);
      if (event.key === 'ArrowRight') show(index + 1, 1);
    });
  }

  window.OblPage = {
    createSlider,
    preloadImages,
    reducedMotion,
  };
})();
