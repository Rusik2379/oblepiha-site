(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Entrance and scroll reveals
  const header = document.querySelector('.header');
  const heading = document.querySelector('.rooms-heading');
  const cards = [...document.querySelectorAll('.room-card')];
  const videoSection = document.querySelector('.hotel-video');
  const footerSection = document.querySelector('.rooms-closing-area');
  const branches = [...document.querySelectorAll('.branch, .branch-video')];

  if (header) header.classList.add('motion-header');
  if (heading) heading.classList.add('motion-ready');
  cards.forEach(card => card.classList.add('motion-card'));
  videoSection?.classList.add('motion-section');
  footerSection?.classList.add('motion-section');

  if (reduceMotion) {
    header?.classList.add('is-visible');
    heading?.classList.add('is-visible');
    cards.forEach(card => card.classList.add('is-visible'));
    videoSection?.classList.add('is-visible');
    footerSection?.classList.add('is-visible');
    branches.forEach(el => el.classList.add('motion-visible'));
  } else {
    requestAnimationFrame(() => {
      setTimeout(() => header?.classList.add('is-visible'), 80);
      setTimeout(() => heading?.classList.add('is-visible'), 170);
      setTimeout(() => branches.forEach(el => el.classList.add('motion-visible')), 260);
    });

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -8% 0px'
    });

    cards.forEach(card => revealObserver.observe(card));
    if (videoSection) revealObserver.observe(videoSection);
    if (footerSection) revealObserver.observe(footerSection);
  }

  // Room galleries
  const galleries = new Map();

  document.querySelectorAll('[data-room-gallery]').forEach((card) => {
    let images = [];
    try {
      images = JSON.parse(card.dataset.images || '[]');
    } catch (error) {
      console.error('Room gallery images could not be parsed', error);
    }
    if (!images.length) return;

    const frame = card.querySelector('.room-photo');
    const image = card.querySelector('.room-photo-img');
    if (!frame || !image) return;

    images.forEach((src) => {
      const preload = new Image();
      preload.src = src;
    });

    galleries.set(card, { images, index: 0, frame, image, token: 0 });
  });

  function animateImageIn(image, delta) {
    if (reduceMotion || !image.animate) return;
    const offset = delta > 0 ? 42 : -42;
    image.animate([
      { opacity: .28, transform: `translateX(${offset}px) scale(1.045)`, filter: 'blur(2px)' },
      { opacity: 1, transform: 'translateX(0) scale(1)', filter: 'blur(0)' }
    ], {
      duration: 560,
      easing: 'cubic-bezier(.22,1,.36,1)',
      fill: 'both'
    });
  }

  function show(card, delta) {
    const gallery = galleries.get(card);
    if (!gallery || gallery.images.length < 2) return;

    gallery.index = (gallery.index + delta + gallery.images.length) % gallery.images.length;
    const nextSrc = gallery.images[gallery.index];
    const token = ++gallery.token;

    gallery.frame.classList.add('is-switching');

    const commit = () => {
      if (token !== gallery.token) return;
      gallery.image.src = nextSrc;
      gallery.frame.classList.remove('is-switching');
      animateImageIn(gallery.image, delta);
    };

    const preload = new Image();
    preload.onload = commit;
    preload.onerror = commit;
    preload.src = nextSrc;

    if (preload.complete) commit();
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-gallery-action]');
    if (!button) return;
    const card = button.closest('[data-room-gallery]');
    if (!card) return;
    event.preventDefault();
    event.stopPropagation();
    show(card, button.dataset.galleryAction === 'prev' ? -1 : 1);
  });

  document.querySelectorAll('[data-room-gallery] .room-photo').forEach((frame) => {
    const card = frame.closest('[data-room-gallery]');
    if (!card) return;

    let startX = null;
    let activePointer = null;

    frame.addEventListener('pointerdown', (event) => {
      if (event.target.closest('[data-gallery-action]')) return;
      startX = event.clientX;
      activePointer = event.pointerId;
      try { frame.setPointerCapture(event.pointerId); } catch (_) {}
    });

    frame.addEventListener('pointerup', (event) => {
      if (startX === null || (activePointer !== null && event.pointerId !== activePointer)) return;
      const dx = event.clientX - startX;
      startX = null;
      activePointer = null;
      if (Math.abs(dx) >= 36) show(card, dx > 0 ? -1 : 1);
    });

    frame.addEventListener('pointercancel', () => {
      startX = null;
      activePointer = null;
    });
  });
})();
