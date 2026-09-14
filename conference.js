(() => {
  const slider = document.getElementById('conferenceSlider');

  OblPage.createSlider({
    slider,
    image: document.getElementById('conferenceSlide'),
    previous: document.getElementById('conferencePrev'),
    next: document.getElementById('conferenceNext'),
    slides: [
    'assets/conference-page/slide-01.webp',
    'assets/conference-page/slide-02.webp',
    'assets/conference-page/slide-03.webp',
    'assets/conference-page/slide-04.webp'
    ],
    insertBefore: '.header-wash',
  });
})();
