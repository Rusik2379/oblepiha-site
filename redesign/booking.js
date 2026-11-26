/* TravelLine integration supplied for the hotel «Облепиха». */
(function (w) {
  const queue = [['setContext', 'TL-INT-oblepiha-22-ru_2026-09-30', 'ru']];
  if (document.getElementById('tl-search-form')) {
    queue.push(['embed', 'search-form', { container: 'tl-search-form' }]);
    const booking = document.getElementById('booking');
    if (booking && 'IntersectionObserver' in w) {
      // Keep the floating chat off the mobile form while the guest can interact with it.
      const observer = new IntersectionObserver(([entry]) => {
        document.body.classList.toggle('booking-in-view', entry.isIntersecting);
      });
      observer.observe(booking);
    }
  }
  const integration = (w.travelline = w.travelline || {}).integration =
    w.travelline.integration || {};
  integration.__cq = integration.__cq ? integration.__cq.concat(queue) : queue;
  // Fresh dates and occupancy override TravelLine's remembered search for room CTAs.
  w.OBLEPIHA_BOOKING = {
    openRoom(roomId) {
      // TravelLine accepts a comma-separated roomTypes filter for a category group.
      const roomIds = String(roomId);
      if (!/^\d+(?:,\d+)*$/.test(roomIds)) return false;
      const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Barnaul', year: 'numeric', month: '2-digit', day: '2-digit'
      }).formatToParts(new Date()).map(part => [part.type, part.value]));
      const command = ['embed', 'booking-form-modal', {
        room: roomIds, date: parts.year + '-' + parts.month + '-' + parts.day,
        nights: 1, adults: 1, childrenAge: '', isBookingModal: true
      }];
      const commands = integration.__cq;
      if (Array.isArray(commands)) commands.push(command);
      else commands.push(...command);
      return true;
    }
  };
  if (integration.__loader) return;
  integration.__loader = true;
  const hosts = ['ru-ibe.tlintegration.ru', 'ibe.tlintegration.ru', 'ibe.tlintegration.com'];
  function load(index) {
    if (index >= hosts.length) return;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://' + hosts[index] + '/integration/loader.js';
    script.onerror = script.onload = function () {
      if (!w.TL) { script.remove(); load(index + 1); }
    };
    document.head.appendChild(script);
  }
  load(0);
})(window);
