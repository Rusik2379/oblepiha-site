(() => {
  const slider = document.getElementById('grillSlider');

  OblPage.createSlider({
    slider,
    image: document.getElementById('grillSlide'),
    previous: document.getElementById('grillPrev'),
    next: document.getElementById('grillNext'),
    slides: [
    'assets/grill-page/slide-01.webp',
    'assets/grill-page/slide-02.webp'
    ],
    insertBefore: '.header-wash',
  });
})();
