(() => {
  const slider = document.getElementById('conferenceSlider');

  OblPage.createSlider({
    slider,
    image: document.getElementById('conferenceSlide'),
    previous: document.getElementById('conferencePrev'),
    next: document.getElementById('conferenceNext'),
    slides: [
    'assets/conference-page/slide-01.webp?v=20260916-3',
    'assets/conference-page/slide-02.webp?v=20260916-3',
    'assets/conference-page/slide-03.webp?v=20260916-3'
    ],
    insertBefore: '.header-wash',
  });
})();
