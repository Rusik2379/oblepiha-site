(() => {
  const slider = document.getElementById('cafeSlider');
  OblPage.createSlider({
    slider,
    image: document.getElementById('cafeSlide'),
    previous: document.getElementById('cafePrev'),
    next: document.getElementById('cafeNext'),
    slides: [
    'assets/cafe-pdf/slide-01.webp?v=20260916-3',
    'assets/cafe-pdf/slide-02.webp?v=20260916-3',
    'assets/cafe-pdf/slide-03.webp?v=20260916-3',
    'assets/cafe-pdf/slide-04.webp?v=20260916-3',
    'assets/cafe-pdf/slide-05.webp?v=20260916-3'
    ],
    insertBefore: '.cafe-mobile-title',
  });
})();
