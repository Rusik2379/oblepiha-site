import { randomBytes, scryptSync } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const env = resolve(root, '.env.news');
if (existsSync(env) && !process.argv.includes('--reset')) {
  console.log('Пароль уже настроен. Для смены запустите: node server/setup.mjs --reset');
  process.exit(0);
}
const password = randomBytes(18).toString('base64url');
const salt = randomBytes(16).toString('hex');
const hash = scryptSync(password, salt, 64).toString('hex');
writeFileSync(env, `NEWS_ADMIN_PASSWORD_HASH=${salt}:${hash}\n`, { mode: 0o600 });
writeFileSync(resolve(root, '.news-admin-access.txt'), `Редактор: /editor.html\nПароль: ${password}\n\nЭтот файл не публикуется сайтом и исключён из Git.\n`, { mode: 0o600 });
console.log('Пароль создан. Данные для входа записаны в .news-admin-access.txt');

