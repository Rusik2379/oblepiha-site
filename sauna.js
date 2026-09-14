(() => {
  const slider = document.getElementById('saunaSlider');

  OblPage.createSlider({
    slider,
    image: document.getElementById('saunaSlide'),
    previous: document.getElementById('saunaPrev'),
    next: document.getElementById('saunaNext'),
    slides: [
    'assets/sauna-page/slide-01.webp',
    'assets/sauna-page/slide-02.webp',
    'assets/sauna-page/slide-03.webp',
    'assets/sauna-page/slide-04.webp',
    'assets/sauna-page/slide-05.webp'
    ],
    insertBefore: '.header-wash',
  });
})();
