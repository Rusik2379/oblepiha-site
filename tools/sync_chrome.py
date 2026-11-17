"""Render the shared public header and closing section into static HTML pages."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
PAGES = ('index', 'rooms', 'cafe', 'banquet', 'conference', 'grill', 'sauna', 'news', 'promotions', 'vacancies')

for name in PAGES:
    path = ROOT / f'{name}.html'
    text = path.read_text(encoding='utf-8')
    prefix = '' if name == 'index' else 'index.html'
    header = (ROOT / 'shared/header.html').read_text(encoding='utf-8').strip().replace('{{home_prefix}}', prefix)
    closing = (ROOT / 'shared/closing.html').read_text(encoding='utf-8').strip().replace('{{home_prefix}}', prefix)
    text, count = re.subn(r'<header class="header[^\"]*">.*?</header>', lambda _: header, text, count=1, flags=re.S)
    assert count == 1, f'Missing header: {name}'
    pattern = r'<(?:section|div)\b[^>]*class="[^\"]*\bclosing-area\b[^\"]*"[^>]*>.*?</footer>\s*</(?:section|div)>'
    text, count = re.subn(pattern, lambda _: closing, text, count=1, flags=re.S)
    if not count:
        assert name in ('news', 'promotions'), f'Missing closing section: {name}'
        end = text.rfind('</main>') + len('</main>') if name == 'news' else text.rfind('</main>')
        text = text[:end] + '\n' + closing + '\n' + text[end:]
    if 'shared-chrome.css' not in text:
        text = text.replace('</head>', '<link rel="stylesheet" href="shared-chrome.css?v=20261001-1"/>\n</head>')
    if 'booking.js' not in text:
        text = text.replace('</head>', '<link rel="stylesheet" href="booking.css?v=20261001-2"/><script defer src="booking.js?v=20261001-1"></script>\n</head>')
    text = text.replace('site.js?v=20261001-1', 'site.js?v=20261001-2')
    if 'advertisement.js' not in text:
        text = text.replace('</head>', '<link rel="stylesheet" href="advertisement.css?v=20261001-2"/><script defer src="advertisement.js?v=20261001-1"></script>\n</head>')
    path.write_text(text, encoding='utf-8')
