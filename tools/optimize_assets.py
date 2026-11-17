"""Create smaller delivery files, retaining the original photographs and layout."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
output = root / 'assets' / 'optimized'
output.mkdir(exist_ok=True)
for source, variants in {
    'logo-berry.webp': [(256, 94)],
    'hero.webp': [(640, 88), (1280, 88), (1920, 90)],
    'footer-bg.webp': [(768, 85), (1920, 88)],
}.items():
    image = Image.open(root / 'assets' / source)
    for width, quality in variants:
        variant = image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS)
        path = output / f'{Path(source).stem}-{width}.webp'
        variant.save(path, 'WEBP', quality=quality, method=6)
        print(f'{path.relative_to(root)}: {path.stat().st_size} bytes; {variant.size}')
