(() => {
  const slider = document.getElementById('grillSlider');

  OblPage.createSlider({
    slider,
    image: document.getElementById('grillSlide'),
    previous: document.getElementById('grillPrev'),
    next: document.getElementById('grillNext'),
    slides: [
    'assets/grill-page/slide-01.webp?v=20260916-3',
    'assets/grill-page/slide-02.webp?v=20260916-3'
    ],
    insertBefore: '.header-wash',
  });
})();
