(() => {
  const slider = document.getElementById('banquetSlider');

  OblPage.createSlider({
    slider,
    image: document.getElementById('banquetSlide'),
    previous: document.getElementById('banquetPrev'),
    next: document.getElementById('banquetNext'),
    slides: [
    'assets/banquet-page/slide-02.webp?v=20260916-3',
    'assets/banquet-page/slide-03.webp?v=20260916-3',
    'assets/banquet-page/slide-04.webp?v=20260916-3',
    'assets/banquet-page/slide-05.webp?v=20260916-3',
    'assets/banquet-page/slide-06.webp?v=20260916-3'
    ],
    insertBefore: '.header-wash',
  });
})();
