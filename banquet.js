(() => {
  const slider = document.getElementById('banquetSlider');

  OblPage.createSlider({
    slider,
    image: document.getElementById('banquetSlide'),
    previous: document.getElementById('banquetPrev'),
    next: document.getElementById('banquetNext'),
    slides: [
    'assets/banquet-page/slide-02.webp',
    'assets/banquet-page/slide-03.webp',
    'assets/banquet-page/slide-04.webp',
    'assets/banquet-page/slide-05.webp',
    'assets/banquet-page/slide-06.webp'
    ],
    insertBefore: '.header-wash',
  });
})();
