(() => {
  const slider = document.getElementById('cafeSlider');
  OblPage.createSlider({
    slider,
    image: document.getElementById('cafeSlide'),
    previous: document.getElementById('cafePrev'),
    next: document.getElementById('cafeNext'),
    slides: [
    'assets/cafe.jpg',
    'assets/cafe-pdf/slide-02.webp',
    'assets/cafe-pdf/slide-03.webp',
    'assets/cafe-pdf/slide-04.webp',
    'assets/cafe-pdf/slide-05.webp'
    ],
    insertBefore: '.cafe-mobile-title',
  });
})();
