"""Build a deployable ZIP without local credentials, IDE files or Git history."""
from pathlib import Path
import json
import sys
import zipfile

root = Path(__file__).resolve().parent.parent
target = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.home() / 'Downloads' / 'oblepiha-site-2026-10-01.zip'
if target.exists():
    raise SystemExit('Archive already exists; choose a new output name.')
allowed = {'.html', '.css', '.js', '.json', '.txt', '.xml', '.svg', '.png', '.ico', '.md', '.yml', '.conf'}
files = [(p, p.relative_to(root).as_posix()) for p in root.iterdir()
         if p.is_file() and not p.name.startswith('.') and (p.suffix in allowed or p.name == 'Caddyfile')]
for directory in ['assets', 'server', 'shared', 'tools']:
    for p in (root / directory).rglob('*'):
        if p.is_file() and not any(part.startswith('.') or part == '__pycache__' for part in p.relative_to(root).parts):
            files.append((p, p.relative_to(root).as_posix()))

# Preserve current CMS state, but omit orphaned uploads from previous edits.
data = root / '.news-data'
images = set()
for name in ['news.json', 'vacancies.json', 'advertisement.json']:
    p = data / name
    if not p.exists():
        continue
    value = json.loads(p.read_text(encoding='utf-8'))
    files.append((p, 'site-data/' + name))
    for item in value if isinstance(value, list) else [value]:
        image = item.get('image', '')
        if image.startswith('/news-media/'):
            images.add(image.split('/')[-1])
for name in sorted(images):
    p = data / 'uploads' / name
    if not p.is_file() or p.resolve().parent != (data / 'uploads').resolve():
        raise SystemExit('Missing referenced CMS image: ' + name)
    files.append((p, 'site-data/uploads/' + name))

target.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    archive.writestr('oblepiha-site/site-data/uploads/', '')
    for p, name in sorted(files, key=lambda item: item[1]):
        archive.write(p, 'oblepiha-site/' + name)
with zipfile.ZipFile(target) as archive:
    if archive.testzip():
        raise SystemExit('Archive integrity check failed.')
    names = archive.namelist()
    assert not any('/.env' in name or '/.git/' in name or '.news-admin-access' in name or '/.idea/' in name for name in names)
    assert 'oblepiha-site/yandex_c9a8ccae38e772ef.html' in names
    assert 'oblepiha-site/DEPLOY.md' in names
print(target)
print(f'{len(names)} entries; {target.stat().st_size / 1024**2:.1f} MB; ZIP integrity verified.')
