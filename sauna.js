(() => {
  const slider = document.getElementById('saunaSlider');

  OblPage.createSlider({
    slider,
    image: document.getElementById('saunaSlide'),
    previous: document.getElementById('saunaPrev'),
    next: document.getElementById('saunaNext'),
    slides: [
    'assets/sauna-page/slide-01.webp?v=20260916-3',
    'assets/sauna-page/slide-02.webp?v=20260916-3',
    'assets/sauna-page/slide-03.webp?v=20260916-3',
    'assets/sauna-page/slide-04.webp?v=20260916-3'
    ],
    insertBefore: '.header-wash',
  });
})();
