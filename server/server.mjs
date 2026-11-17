import { createServer } from 'node:http';
import { randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, statSync, createReadStream } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { renderPublicPage, sitemap, siteUrl } from './seo.mjs';
const hashPassword = promisify(scrypt);
const root = resolve(import.meta.dirname, '..');
const dataDir = resolve(process.env.NEWS_DATA_DIR || resolve(root, '.news-data'));
const envFile = resolve(root, '.env.news');
if (!process.env.NEWS_ADMIN_PASSWORD_HASH && existsSync(envFile)) {
  const line = readFileSync(envFile, 'utf8').match(/^NEWS_ADMIN_PASSWORD_HASH=(.+)$/m);
  if (line) process.env.NEWS_ADMIN_PASSWORD_HASH = line[1].trim();
}
const passwordHash = process.env.NEWS_ADMIN_PASSWORD_HASH || '';
if (passwordHash && !/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(passwordHash)) throw new Error('Invalid admin password hash');
mkdirSync(resolve(dataDir, 'uploads'), { recursive: true });
const database = resolve(dataDir, 'news.json');
if (!existsSync(database)) writeFileSync(database, readFileSync(resolve(root, 'news-seed.json')), { mode: 0o600 });
const vacancyDatabase = resolve(dataDir, 'vacancies.json');
if (!existsSync(vacancyDatabase)) writeFileSync(vacancyDatabase, '[]', { mode: 0o600 });
const advertisementDatabase = resolve(dataDir, 'advertisement.json');
const emptyAdvertisement = () => ({ enabled: false, title: '', image: '', link: '', revision: '', updatedAt: '' });
if (!existsSync(advertisementDatabase)) writeFileSync(advertisementDatabase, JSON.stringify(emptyAdvertisement()), { mode: 0o600 });
const sessions = new Map();
const attempts = new Map();
const sessionDuration = 8 * 60 * 60 * 1000;
const secureCookie = process.env.NODE_ENV === 'production';
const sessionCookie = secureCookie ? '__Host-news_session' : 'news_session';
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.txt':'text/plain; charset=utf-8', '.xml':'application/xml; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.ico':'image/x-icon', '.ttf':'font/ttf', '.woff':'font/woff', '.woff2':'font/woff2' };
class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const loadNews = () => JSON.parse(readFileSync(database, 'utf8'));
function saveNews(news) {
  saveData(database, news);
}
const loadVacancies = () => JSON.parse(readFileSync(vacancyDatabase, 'utf8'));
const loadAdvertisement = () => JSON.parse(readFileSync(advertisementDatabase, 'utf8'));
function saveData(path, data) {
  const tmp = path + '.tmp';
  writeFileSync(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
  renameSync(tmp, path);
}
function json(res, status, body) {
  res.setHeader('X-Robots-Tag', 'noindex');
  res.writeHead(status, { 'Content-Type': mime['.json'], 'Cache-Control':'no-store' });
  res.end(JSON.stringify(body));
}
async function body(req, max = 65536) {
  if (Number(req.headers['content-length']) > max) throw new HttpError(413, 'Файл слишком большой. Максимум — 8 МБ.');
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > max) throw new HttpError(413, 'Превышен допустимый размер запроса.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
async function jsonBody(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) throw new HttpError(415, 'Ожидается JSON.');
  try { return JSON.parse((await body(req)).toString()); }
  catch (error) { if (error instanceof HttpError) throw error; throw new HttpError(400, 'Некорректный запрос.'); }
}
function session(req) {
  const token = (req.headers.cookie || '').split(';').map(p => p.trim()).find(p => p.startsWith(sessionCookie + '='))?.slice(sessionCookie.length + 1);
  const item = sessions.get(token);
  if (!item || item.expires < Date.now()) { sessions.delete(token); return null; }
  return { ...item, token };
}
function sameOrigin(req) {
  let origin;
  try { origin = new URL(req.headers.origin || req.headers.referer || '').host; } catch {}
  if (!origin || origin !== req.headers.host) throw new HttpError(403, 'Запрос должен поступать с этого сайта.');
}
function auth(req, mutation = false) {
  const current = session(req);
  if (!current) throw new HttpError(401, 'Войдите в редактор.');
  if (mutation) {
    sameOrigin(req);
    if (req.headers['x-csrf-token'] !== current.csrf) throw new HttpError(403, 'Обновите страницу редактора.');
  }
  return current;
}
function cookie(res, token, expires = 28800) {
  res.setHeader('Set-Cookie', `${sessionCookie}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${expires}${secureCookie ? '; Secure' : ''}`);
}
async function correctPassword(password) {
  if (!passwordHash || typeof password !== 'string' || password.length > 256) return false;
  const [salt, hash] = passwordHash.split(':');
  const actual = await hashPassword(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(hash, 'hex'));
}
function validImage(value) {
  const image = typeof value === 'string' ? value : '';
  if (!/^assets\/[a-zA-Z0-9_./-]+\.(?:jpg|jpeg|png|webp)$/.test(image) && !/^\/news-media\/[a-f0-9-]+\.(?:jpg|png|webp)$/.test(image)) throw new HttpError(400, 'Прикрепите фотографию JPG, PNG или WebP.');
  const imageFile = image.startsWith('/news-media/') ? resolve(dataDir, 'uploads', image.split('/').at(-1)) : resolve(root, image);
  if (!existsSync(imageFile) || !imageFile.startsWith(image.startsWith('/news-media/') ? resolve(dataDir, 'uploads') + sep : resolve(root, 'assets') + sep)) throw new HttpError(400, 'Фотография не найдена.');
  return image;
}
function validPost(input, previous) {
  if (!input || typeof input !== 'object') throw new HttpError(400, 'Заполните новость.');
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const text = typeof input.text === 'string' ? input.text.trim() : '';
  if (!title || title.length > 140 || !text || text.length > 12000) throw new HttpError(400, 'Нужны заголовок до 140 символов и текст до 12 000 символов.');
  const image = validImage(input.image);
  const startDate = input.startDate || '';
  if (startDate && (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !Number.isFinite(Date.parse(startDate)) || new Date(startDate).toISOString().slice(0,10) !== startDate)) throw new HttpError(400, 'Проверьте дату начала акции.');
  return { id: previous?.id || randomUUID(), title, text, image, pinned: input.pinned === true,
    kind: input.kind === 'promotion' ? 'promotion' : 'news', startDate,
    publishedAt: previous?.publishedAt || new Date().toISOString(), updatedAt: new Date().toISOString(),
    ...(previous?.promotion ? { promotion: previous.promotion } : {}) };
}
function validVacancy(input, previous) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpError(400, 'Заполните вакансию.');
  const field = (key, max, required = false) => {
    const value = typeof input[key] === 'string' ? input[key].trim() : '';
    if ((required && !value) || value.length > max) throw new HttpError(400, 'Проверьте название, описание и контактный телефон вакансии.');
    return value;
  };
  const title = field('title', 140, true), text = field('text', 12000, true);
  const salary = field('salary', 120), schedule = field('schedule', 140), phone = field('phone', 32, true);
  const digits = phone.replace(/\D/g, '');
  if (!/^\+?[\d ()-]+$/.test(phone) || digits.length < 8 || digits.length > 15) throw new HttpError(400, 'Укажите корректный контактный телефон.');
  if (input.published !== undefined && typeof input.published !== 'boolean') throw new HttpError(400, 'Проверьте статус публикации.');
  return { id: previous?.id || randomUUID(), title, text, salary, schedule, phone, published: input.published !== false,
    createdAt: previous?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
}
function validAdvertisement(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || typeof input.enabled !== 'boolean') throw new HttpError(400, 'Проверьте настройки рекламы.');
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (title.length > 140) throw new HttpError(400, 'Название рекламы — до 140 символов.');
  const image = input.image ? validImage(input.image) : '';
  if (input.enabled && !image) throw new HttpError(400, 'Загрузите картинку перед включением рекламы.');
  const link = typeof input.link === 'string' ? input.link.trim() : '';
  if (link) {
    let url;
    try { url = new URL(link, 'https://website.invalid/'); } catch {}
    const allowed = /^https?:\/\//i.test(link) || /^\/(?!\/)/.test(link) || /^[a-zA-Z0-9][a-zA-Z0-9_./?=&%#-]*$/.test(link);
    if (link.length > 2000 || /[\s\\\x00-\x1f]/.test(link) || !allowed || !url || !['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new HttpError(400, 'Укажите ссылку на страницу сайта или полный адрес http:// либо https://.');
  }
  return { enabled: input.enabled, title: title || 'Предложение «Облепихи»', image, link, revision: randomUUID(), updatedAt: new Date().toISOString() };
}
function file(res, req, path, cache = 'no-cache') {
  if (!existsSync(path) || !statSync(path).isFile()) throw new HttpError(404, 'Страница не найдена.');
  res.writeHead(200, { 'Content-Type': mime[extname(path).toLowerCase()] || 'application/octet-stream', 'Cache-Control': cache, 'Content-Length': statSync(path).size });
  if (req.method === 'HEAD') res.end(); else createReadStream(path).pipe(res);
}
const server = createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  try {
    const url = new URL(req.url, 'http://localhost');
    const path = decodeURIComponent(url.pathname);
    const host = (req.headers.host || '').split(':')[0].toLowerCase();
    if (['GET','HEAD'].includes(req.method) && (host === 'www.oblepiha-22.ru' || host === 'oblepiha-22.ru' && path === '/index.html')) {
      const destination = new URL(path === '/index.html' ? '/' : url.pathname, siteUrl);
      destination.search = url.search;
      res.writeHead(308, {Location:destination.href, 'Cache-Control':'public, max-age=3600'});
      return res.end();
    }
    if (path.startsWith('/api/')) {
      if (path === '/api/news' && req.method === 'GET') return json(res, 200, loadNews());
      if (path === '/api/vacancies' && req.method === 'GET') return json(res, 200, loadVacancies().filter(v => v.published));
      if (path === '/api/advertisement' && req.method === 'GET') {
        const advertisement = loadAdvertisement();
        return json(res, 200, advertisement.enabled && advertisement.image ? advertisement : null);
      }
      if (path === '/api/admin/advertisement' && req.method === 'GET') { auth(req); return json(res, 200, loadAdvertisement()); }
      if (path === '/api/admin/advertisement' && req.method === 'PUT') {
        auth(req, true); const advertisement = validAdvertisement(await jsonBody(req));
        saveData(advertisementDatabase, advertisement); return json(res, 200, advertisement);
      }
      if (path === '/api/admin/advertisement' && req.method === 'DELETE') {
        auth(req, true); const advertisement = emptyAdvertisement(); saveData(advertisementDatabase, advertisement); return json(res, 200, advertisement);
      }
      if (path === '/api/admin/session' && req.method === 'GET') {
        const current = session(req);
        return json(res, 200, { authenticated: !!current, csrf: current?.csrf || '', configured: !!passwordHash });
      }
      if (path === '/api/admin/login' && req.method === 'POST') {
        sameOrigin(req);
        if (!passwordHash) throw new HttpError(503, 'Пароль редактора ещё не настроен.');
        const key = process.env.TRUST_PROXY === '1' ? req.headers['x-real-ip'] || req.socket.remoteAddress : req.socket.remoteAddress;
        const attempt = attempts.get(key) || { count: 0, until: Date.now() + 15 * 60000 };
        if (attempt.until < Date.now()) { attempt.count = 0; attempt.until = Date.now() + 15 * 60000; }
        if (attempt.count >= 8) throw new HttpError(429, 'Слишком много попыток. Попробуйте через 15 минут.');
        const { password } = await jsonBody(req);
        attempt.count++; attempts.set(key, attempt);
        if (!await correctPassword(password)) throw new HttpError(401, 'Неверный пароль.');
        attempts.delete(key);
        const old = session(req); if (old) sessions.delete(old.token);
        const token = randomBytes(32).toString('hex'); const csrf = randomBytes(24).toString('hex');
        sessions.set(token, { csrf, expires: Date.now() + sessionDuration }); cookie(res, token);
        return json(res, 200, { authenticated: true, csrf });
      }
      if (path === '/api/admin/logout' && req.method === 'POST') { const current = auth(req, true); sessions.delete(current.token); cookie(res, '', 0); return json(res, 200, { ok: true }); }
      if (path === '/api/admin/upload' && req.method === 'POST') {
        auth(req, true);
        const image = await body(req, 8 * 1024 * 1024);
        let extension;
        if (image.length > 12 && image.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) extension = 'png';
        else if (image.length > 12 && image[0] === 255 && image[1] === 216 && image[2] === 255) extension = 'jpg';
        else if (image.length > 12 && image.toString('ascii',0,4) === 'RIFF' && image.toString('ascii',8,12) === 'WEBP') extension = 'webp';
        else throw new HttpError(415, 'Поддерживаются фотографии JPG, PNG и WebP.');
        const name = randomUUID() + '.' + extension;
        writeFileSync(resolve(dataDir, 'uploads', name), image);
        return json(res, 201, { image: '/news-media/' + name });
      }
      if (path === '/api/admin/news' && req.method === 'GET') { auth(req); return json(res, 200, loadNews()); }
      if (path === '/api/admin/news' && req.method === 'POST') {
        auth(req, true); const input = await jsonBody(req); const post = validPost(input); const news = loadNews();
        if (news.length >= 500) throw new HttpError(400, 'Достигнут предел в 500 новостей.');
        news.unshift(post); saveNews(news); return json(res, 201, post);
      }
      const match = path.match(/^\/api\/admin\/news\/([a-zA-Z0-9-]+)$/);
      if (match && ['PUT','DELETE','PATCH'].includes(req.method)) {
        auth(req, true);
        // Parse first, then read the latest file so concurrent requests cannot overwrite newer posts.
        const input = req.method === 'DELETE' ? null : await jsonBody(req);
        const news = loadNews(); const index = news.findIndex(p => p.id === match[1]);
        if (index < 0) throw new HttpError(404, 'Новость не найдена.');
        if (req.method === 'DELETE') news.splice(index, 1);
        else if (req.method === 'PATCH') {
          if (typeof input?.pinned !== 'boolean' || Object.keys(input).some(key => key !== 'pinned')) throw new HttpError(400, 'Укажите статус закрепления новости.');
          news[index] = {...news[index], pinned:input.pinned, updatedAt:new Date().toISOString()};
        } else news[index] = validPost(input, news[index]);
        saveNews(news); return json(res, 200, { ok: true });
      }
      if (path === '/api/admin/vacancies' && req.method === 'GET') { auth(req); return json(res, 200, loadVacancies()); }
      if (path === '/api/admin/vacancies' && req.method === 'POST') {
        auth(req, true); const vacancy = validVacancy(await jsonBody(req)); const vacancies = loadVacancies();
        if (vacancies.length >= 200) throw new HttpError(400, 'Достигнут предел в 200 вакансий.');
        vacancies.unshift(vacancy); saveData(vacancyDatabase, vacancies); return json(res, 201, vacancy);
      }
      const vacancyMatch = path.match(/^\/api\/admin\/vacancies\/([a-zA-Z0-9-]+)$/);
      if (vacancyMatch && ['PUT','DELETE'].includes(req.method)) {
        auth(req, true); const input = req.method === 'PUT' ? await jsonBody(req) : null;
        const vacancies = loadVacancies(), index = vacancies.findIndex(v => v.id === vacancyMatch[1]);
        if (index < 0) throw new HttpError(404, 'Вакансия не найдена.');
        if (req.method === 'DELETE') vacancies.splice(index, 1);
        else vacancies[index] = validVacancy(input, vacancies[index]);
        saveData(vacancyDatabase, vacancies); return json(res, 200, { ok: true });
      }
      throw new HttpError(404, 'Запрос не найден.');
    }
    if (!['GET','HEAD'].includes(req.method)) throw new HttpError(405, 'Метод не поддерживается.');
    if (path === '/sitemap.xml') {
      const xml = sitemap(loadNews());
      res.writeHead(200, { 'Content-Type':mime['.xml'], 'Cache-Control':'no-cache', 'Content-Length':Buffer.byteLength(xml) });
      return res.end(req.method === 'HEAD' ? undefined : xml);
    }
    if (['/', '/index.html', '/news.html', '/vacancies.html'].includes(path)) {
      const name = path === '/' ? 'index.html' : path.slice(1);
      const {html, status} = renderPublicPage(root, name, url, loadNews(), name === 'vacancies.html' ? loadVacancies() : []);
      if (status === 404) res.setHeader('X-Robots-Tag', 'noindex');
      res.writeHead(status, { 'Content-Type':mime['.html'], 'Cache-Control':'no-cache', 'Content-Length':Buffer.byteLength(html) });
      return res.end(req.method === 'HEAD' ? undefined : html);
    }
    if (path.startsWith('/news-media/')) {
      if (!/^\/news-media\/[a-f0-9-]+\.(?:jpg|png|webp)$/.test(path)) throw new HttpError(404, 'Файл не найден.');
      return file(res, req, resolve(dataDir, 'uploads', path.split('/').at(-1)), 'public, max-age=31536000, immutable');
    }
    // Serve only website assets locally; never expose the backend, credentials or private data.
    if (path.split('/').some(p => p.startsWith('.')) || /^\/(?:server|node_modules|tools|shared|site-data|exports)(?:\/|$)/.test(path)) throw new HttpError(404, 'Страница не найдена.');
    const target = resolve(root, '.' + (path === '/' ? '/index.html' : path));
    if (!target.startsWith(root + sep) || !mime[extname(target).toLowerCase()]) throw new HttpError(404, 'Страница не найдена.');
    if (path === '/editor.html') { res.setHeader('X-Robots-Tag', 'noindex, nofollow'); res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' blob:; script-src 'self'; style-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"); }
    return file(res, req, target, path === '/editor.html' ? 'no-store' : 'no-cache');
  } catch (error) {
    if (!res.headersSent) json(res, error.status || 500, { error: error.status ? error.message : 'Не удалось сохранить данные. Попробуйте ещё раз.' });
    else res.end();
    if (!error.status) console.error(error);
  }
});
server.requestTimeout = 30000;
server.headersTimeout = 15000;
setInterval(() => {
  for (const [key, value] of sessions) if (value.expires < Date.now()) sessions.delete(key);
  for (const [key, value] of attempts) if (value.until < Date.now()) attempts.delete(key);
}, 60000).unref();
server.listen(Number(process.env.PORT || 8765), process.env.HOST || '127.0.0.1', () => {
  console.log(`Сайт и редактор новостей: http://${process.env.HOST || '127.0.0.1'}:${server.address().port}`);
  if (!passwordHash) console.log('Для настройки пароля: node server/setup.mjs');
});
