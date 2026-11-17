import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, sep } from 'node:path';
import { randomBytes, scryptSync } from 'node:crypto';
import { request as httpRequest } from 'node:http';
const root = resolve(import.meta.dirname, '..');
const folder = mkdtempSync(resolve(tmpdir(), 'oblepiha-news-test-'));
const password = 'Test-only-' + randomBytes(20).toString('hex');
const salt = randomBytes(16).toString('hex');
const secret = salt + ':' + scryptSync(password, salt, 64).toString('hex');
let child, origin, csrf, cookie, postId, image, vacancyId, advertisementRevision;
async function start() {
  child = spawn(process.execPath, ['server/server.mjs'], { cwd: root, env: { ...process.env, PORT:'0', NODE_ENV:'test', TRUST_PROXY:'0', NEWS_DATA_DIR:folder, NEWS_ADMIN_PASSWORD_HASH:secret }, stdio: ['ignore','pipe','pipe'] });
  await new Promise((accept, reject) => {
    const timeout = setTimeout(() => reject(new Error('Server did not start')), 10000);
    child.stdout.on('data', chunk => { const match = chunk.toString().match(/http:\/\/127\.0\.0\.1:\d+/); if (match) { origin = match[0]; clearTimeout(timeout); accept(); } });
    child.on('exit', code => { clearTimeout(timeout); reject(new Error('Server exited: ' + code)); });
  });
}
async function stop() { if (child && child.exitCode === null) { const exit = new Promise(r => child.once('exit', r)); child.kill(); await exit; } }
const req = (path, method = 'GET', data, headers = {}) => fetch(origin + path, { method, headers: { Origin:origin, ...(cookie ? {Cookie:cookie} : {}), ...(csrf ? {'X-CSRF-Token':csrf} : {}), ...(data && !Buffer.isBuffer(data) ? {'Content-Type':'application/json'} : {}), ...headers }, body: data ? Buffer.isBuffer(data) ? data : JSON.stringify(data) : undefined });
before(start);
after(async () => { await stop(); const target = resolve(folder); if (!target.startsWith(resolve(tmpdir()) + sep) || !target.split(sep).at(-1).startsWith('oblepiha-news-test-')) throw new Error('Unsafe cleanup path'); rmSync(target, {recursive:true,force:true}); });
test('public feed is readable but private files and writes are protected', async () => {
  assert.equal((await req('/api/news')).status, 200);
  assert.equal((await req('/api/admin/news')).status, 401);
  assert.equal((await req('/api/admin/news','POST',{})).status, 401);
  assert.deepEqual(await (await req('/api/vacancies')).json(), []);
  assert.equal((await req('/api/admin/vacancies')).status, 401);
  assert.equal((await req('/api/admin/vacancies','POST',{})).status, 401);
  assert.equal(await (await req('/api/advertisement')).json(), null);
  assert.equal((await req('/api/admin/advertisement')).status, 401);
  assert.equal((await req('/api/admin/advertisement','PUT',{})).status, 401);
  for (const path of ['/.env.news','/.news-admin-access.txt','/server/server.mjs','/.news-data/news.json','/site-data/news.json','/tools/update_seo.mjs','/shared/header.html']) assert.equal((await req(path)).status, 404);
});

test('public SEO uses the live domain, unique titles, valid structured data and the original Yandex file', async () => {
  const titles = new Set();
  for (const name of ['index','rooms','cafe','banquet','conference','grill','sauna','news','promotions','vacancies']) {
    const response = await req('/' + name + '.html'); assert.equal(response.status,200);
    const html = await response.text();
    const title = html.match(/<title>([\s\S]*?)<\/title>/)[1]; assert.ok(!titles.has(title)); titles.add(title);
    assert.equal((html.match(/rel="canonical"/g) || []).length,1);
    assert.match(html, /rel="canonical" href="https:\/\/oblepiha-22\.ru\//);
    assert.match(html, /name="description" content="[^"]+"/);
    assert.equal((html.match(/<h1\b/g) || []).length,1);
    assert.equal((html.match(/src="analytics\.js\?/g) || []).length,1);
    const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.ok(schema['@graph'].find(node => node['@type'] === 'Hotel'));
    if (['rooms','cafe','banquet','conference','grill','sauna'].includes(name)) assert.ok(schema['@graph'].find(node => node['@type'] === 'Service' && node.areaServed.name === 'Новоалтайск'));
    const ogImage = html.match(/property="og:image" content="([^"]+)"/)[1];
    assert.equal((await req(new URL(ogImage).pathname)).status,200);
  }
  const verification = await req('/yandex_c9a8ccae38e772ef.html'); assert.equal(verification.status,200);
  assert.equal(await verification.text(), readFileSync(resolve(root,'yandex_c9a8ccae38e772ef.html'),'utf8'));
  assert.equal((await req('/editor.html')).headers.get('x-robots-tag'),'noindex, nofollow');
});
test('canonical redirects retain attribution and do not affect local previews', async () => {
  for (const [path,host,target] of [['/index.html?utm_source=vk','oblepiha-22.ru','https://oblepiha-22.ru/?utm_source=vk'],['/cafe.html?utm_source=maps','www.oblepiha-22.ru','https://oblepiha-22.ru/cafe.html?utm_source=maps']]) {
    const response = await new Promise((accept,reject)=>{
      const request = httpRequest(origin+path,{headers:{Host:host}},res=>{res.resume();accept({status:res.statusCode,location:res.headers.location});});
      request.on('error',reject);request.end();
    });
    assert.equal(response.status,308);assert.equal(response.location,target);
  }
  assert.equal((await req('/index.html')).status,200);
});

test('login verifies the password and requires the website origin', async () => {
  assert.equal((await req('/api/admin/login','POST',{password},{Origin:'https://other.example'})).status, 403);
  assert.equal((await req('/api/admin/login','POST',{password:'wrong'})).status, 401);
  const response = await req('/api/admin/login','POST',{password}); assert.equal(response.status,200);
  cookie = response.headers.get('set-cookie').split(';')[0];
  assert.match(response.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
  csrf = (await response.json()).csrf;
  assert.equal((await (await req('/api/admin/session')).json()).authenticated,true);
});
test('image uploads reject active formats and cross-site requests', async () => {
  assert.equal((await req('/api/admin/upload','POST',Buffer.from('<svg onload="alert(1)"></svg>'))).status,415);
  assert.equal((await req('/api/admin/upload','POST',Buffer.from('bad'),{'X-CSRF-Token':'wrong'})).status,403);
  assert.equal((await req('/api/admin/upload','POST',Buffer.from('bad'),{Origin:'https://other.example'})).status,403);
  const response = await req('/api/admin/upload','POST',readFileSync(resolve(root,'assets/about-hotel.jpg')),{'Content-Type':'image/jpeg'});
  assert.equal(response.status,201); image = (await response.json()).image;
  const photo = await req(image); assert.equal(photo.status,200); assert.equal(photo.headers.get('content-type'),'image/jpeg');
});
test('create and edit preserve content and pin state without interpreting HTML', async () => {
  const response = await req('/api/admin/news','POST',{title:'Тест публикации',text:'<script>alert(1)</script>\n\nВторой абзац.',image,kind:'news',pinned:true});
  assert.equal(response.status,201); const post = await response.json(); postId = post.id;
  assert.equal(post.text,'<script>alert(1)</script>\n\nВторой абзац.');
  assert.equal((await req('/api/admin/news/' + postId,'PUT',{...post,image:'../../.env.news'})).status,400);
  assert.equal((await req('/api/admin/news/' + postId,'PUT',{...post,title:'Обновлено',kind:'promotion',startDate:'2026-12-01'})).status,200);
  const saved = (await (await req('/api/news')).json()).find(p => p.id === postId); assert.equal(saved.title,'Обновлено'); assert.equal(saved.pinned,true); assert.equal(saved.startDate,'2026-12-01');
});

test('pinning changes only the flag, requires authorization and survives in public HTML', async () => {
  const original = (await (await req('/api/news')).json()).find(post=>post.id===postId);
  assert.equal((await req('/api/admin/news/'+postId,'PATCH',{pinned:false},{'X-CSRF-Token':'wrong'})).status,403);
  assert.equal((await req('/api/admin/news/'+postId,'PATCH',{pinned:false},{Origin:'https://other.example'})).status,403);
  for (const data of [{pinned:'true'},{pinned:true,title:'Overwrite'},null]) {
    assert.equal((await req('/api/admin/news/'+postId,'PATCH',data || {})).status,400);
  }
  for (const pinned of [false,true]) {
    assert.equal((await req('/api/admin/news/'+postId,'PATCH',{pinned})).status,200);
    const saved = (await (await req('/api/news')).json()).find(post=>post.id===postId);
    assert.equal(saved.pinned,pinned);
    for (const key of ['title','text','image','kind','startDate','publishedAt']) assert.equal(saved[key],original[key]);
  }
  const unauthorized = await fetch(origin+'/api/admin/news/'+postId,{method:'PATCH',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({pinned:false})});
  assert.equal(unauthorized.status,401);
});

test('news render without JavaScript, escape user content and automatically update sitemap and canonical', async () => {
  const response = await req('/news.html?id=' + postId); assert.equal(response.status,200);
  const html = await response.text();
  assert.match(html, /<h1>Обновлено<\/h1>/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(html.includes(`rel="canonical" href="https://oblepiha-22.ru/news.html?id=${postId}"`));
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  assert.equal(graph.find(node => node['@type'] === 'BlogPosting').articleBody,'<script>alert(1)</script>\n\nВторой абзац.');
  assert.ok((await (await req('/sitemap.xml')).text()).includes('news.html?id=' + postId));
  assert.match(await (await req('/')).text(), /Обновлено/);
  const missing = await req('/news.html?id=missing'); assert.equal(missing.status,404);
  assert.equal(missing.headers.get('x-robots-tag'),'noindex');
  assert.match(await missing.text(), /Публикация не найдена/);
  assert.equal((await req('/news.html?id=' + postId,'HEAD')).status,200);
});
test('vacancies validate fields and protect drafts and mutations', async () => {
  const vacancy = { title:'Тестовая должность', text:'Обязанности\n\n<script>alert(1)</script>', salary:'от 45 000 ₽', schedule:'2/2', phone:'+7 913 238 54 84', published:false };
  assert.equal((await req('/api/admin/vacancies','POST',vacancy,{'X-CSRF-Token':'wrong'})).status,403);
  assert.equal((await req('/api/admin/vacancies','POST',vacancy,{Origin:'https://other.example'})).status,403);
  for (const invalid of [{...vacancy,title:''},{...vacancy,text:''},{...vacancy,phone:'javascript:alert(1)'},{...vacancy,title:'x'.repeat(141)},{...vacancy,published:'true'}]) {
    assert.equal((await req('/api/admin/vacancies','POST',invalid)).status,400);
  }
  const response = await req('/api/admin/vacancies','POST',vacancy);
  assert.equal(response.status,201); const created = await response.json(); vacancyId = created.id;
  assert.equal(created.text, vacancy.text);
  assert.deepEqual(await (await req('/api/vacancies')).json(), []);
  assert.ok(!(await (await req('/vacancies.html')).text()).includes('Тестовая должность'));
  assert.equal((await (await req('/api/admin/vacancies')).json()).length,1);
});

test('advertisements require an image, validate links and protect administration', async () => {
  const advertisement = { enabled:true, title:'Тестовый баннер', image, link:'promotions.html#winter' };
  assert.equal((await req('/api/admin/advertisement','PUT',advertisement,{'X-CSRF-Token':'wrong'})).status,403);
  assert.equal((await req('/api/admin/advertisement','PUT',advertisement,{Origin:'https://other.example'})).status,403);
  for (const link of ['javascript:alert(1)','data:text/html,test','//other.example/','https://name:password@example.com/','/\\other.example/','https://example.com/\n']) {
    // A trailing newline is trimmed as ordinary pasted whitespace; embedded controls are forbidden.
    const invalid = link.endsWith('\n') ? 'https://exam\nple.com/' : link;
    assert.equal((await req('/api/admin/advertisement','PUT',{...advertisement,link:invalid})).status,400);
  }
  assert.equal((await req('/api/admin/advertisement','PUT',{...advertisement,image:''})).status,400);
  assert.equal((await req('/api/admin/advertisement','PUT',{...advertisement,image:'../../.env.news'})).status,400);
  assert.equal((await req('/api/admin/advertisement','PUT',{...advertisement,enabled:'true'})).status,400);
  assert.equal((await req('/api/admin/advertisement','PUT',{...advertisement,enabled:false})).status,200);
  assert.equal(await (await req('/api/advertisement')).json(),null);
  assert.equal((await (await req('/api/admin/advertisement')).json()).image,image);
  const response = await req('/api/admin/advertisement','PUT',advertisement); assert.equal(response.status,200);
  advertisementRevision = (await response.json()).revision;
  const visible = await (await req('/api/advertisement')).json();
  assert.equal(visible.link,advertisement.link); assert.equal(visible.image,image); assert.equal(visible.revision,advertisementRevision);
});

test('news, vacancies, advertisements and photos survive restart; sessions expire on restart', async () => {
  await stop(); await start();
  const posts = await (await req('/api/news')).json(); assert.ok(posts.find(p=>p.id===postId)); assert.equal((await req(image)).status,200);
  assert.equal((await req('/api/admin/news')).status,401);
  assert.equal((await req('/api/admin/vacancies')).status,401);
  const response = await req('/api/admin/login','POST',{password}); cookie=response.headers.get('set-cookie').split(';')[0]; csrf=(await response.json()).csrf;
  assert.ok((await (await req('/api/admin/vacancies')).json()).find(v=>v.id===vacancyId));
  assert.deepEqual(await (await req('/api/vacancies')).json(), []);
  assert.equal((await (await req('/api/advertisement')).json()).revision,advertisementRevision);
});

test('vacancies can be published, edited, hidden and deleted independently of news', async () => {
  const vacancy = (await (await req('/api/admin/vacancies')).json())[0];
  assert.equal((await req('/api/admin/vacancies/'+vacancyId,'PUT',{...vacancy,title:'Обновлённая должность',published:true})).status,200);
  let feed = await (await req('/api/vacancies')).json(); assert.equal(feed.length,1); assert.equal(feed[0].title,'Обновлённая должность');
  const html = await (await req('/vacancies.html')).text(); assert.match(html, /Обновлённая должность/); assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.equal(feed[0].createdAt, vacancy.createdAt);
  assert.equal((await req('/api/admin/vacancies/'+vacancyId,'DELETE',null,{'X-CSRF-Token':'wrong'})).status,403);
  assert.equal((await req('/api/admin/vacancies/'+vacancyId,'PUT',{...feed[0],published:false})).status,200);
  assert.deepEqual(await (await req('/api/vacancies')).json(), []);
  assert.ok(!(await (await req('/vacancies.html')).text()).includes('Обновлённая должность'));
  assert.equal((await req('/api/admin/vacancies/'+vacancyId,'DELETE')).status,200);
  assert.equal((await req('/api/admin/vacancies/'+vacancyId,'DELETE')).status,404);
  assert.equal((await (await req('/api/admin/vacancies')).json()).length,0);
  assert.ok((await (await req('/api/news')).json()).find(p=>p.id===postId));
});
test('advertisements can be changed, disabled and removed', async () => {
  const advertisement = await (await req('/api/admin/advertisement')).json();
  let response = await req('/api/admin/advertisement','PUT',{...advertisement,title:'Новый баннер',link:'https://example.com/offer'});
  assert.equal(response.status,200); const updated = await response.json(); assert.notEqual(updated.revision,advertisementRevision);
  assert.equal((await (await req('/api/advertisement')).json()).title,'Новый баннер');
  assert.equal((await req('/api/admin/advertisement','PUT',{...updated,enabled:false})).status,200);
  assert.equal(await (await req('/api/advertisement')).json(),null);
  assert.equal((await (await req('/api/admin/advertisement')).json()).image,image);
  assert.equal((await req('/api/admin/advertisement','DELETE',null,{'X-CSRF-Token':'wrong'})).status,403);
  assert.equal((await req('/api/admin/advertisement','DELETE')).status,200);
  assert.equal((await (await req('/api/admin/advertisement')).json()).image,'');
  assert.equal(await (await req('/api/advertisement')).json(),null);
});

test('deletion and logout require authentication', async () => {
  assert.equal((await req('/api/admin/news/' + postId,'DELETE')).status,200);
  assert.ok(!(await (await req('/api/news')).json()).find(p=>p.id===postId));
  assert.ok(!(await (await req('/sitemap.xml')).text()).includes('news.html?id=' + postId));
  assert.equal((await req('/news.html?id=' + postId)).status,404);
  assert.equal((await req('/api/admin/logout','POST')).status,200);
  assert.equal((await req('/api/admin/news','POST',{})).status,401);
  assert.equal((await req('/api/admin/vacancies','POST',{})).status,401);
  assert.equal((await req('/api/admin/advertisement','PUT',{})).status,401);
  assert.equal((await req('/api/admin/advertisement','DELETE')).status,401);
});
test('repeated incorrect passwords are rate limited', async () => {
  cookie=''; csrf=''; for (let i=0;i<8;i++) assert.equal((await req('/api/admin/login','POST',{password:'wrong'})).status,401);
  assert.equal((await req('/api/admin/login','POST',{password:'wrong'})).status,429);
});
