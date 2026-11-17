/* TravelLine integration supplied for the hotel «Облепиха». */
(function (w) {
  const queue = [['setContext', 'TL-INT-oblepiha-22-ru_2026-09-30', 'ru']];
  if (document.getElementById('tl-search-form')) {
    queue.push(['embed', 'search-form', { container: 'tl-search-form' }]);
  }
  const integration = (w.travelline = w.travelline || {}).integration =
    w.travelline.integration || {};
  integration.__cq = integration.__cq ? integration.__cq.concat(queue) : queue;
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
