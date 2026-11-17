import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { renderPublicPage } from './seo.mjs';
const root = resolve(import.meta.dirname, '..');
const posts = count => Array.from({length:count}, (_, i) => ({id:'preview-'+i,title:'Публикация '+i,text:'Текст публикации',image:'assets/hero.webp',kind:'news',pinned:i===count-1,publishedAt:new Date(2026,8,i+1).toISOString()}));
test('homepage preview reports the full total and preserves pinned-first order', () => {
  const items=posts(10), result=renderPublicPage(root,'index.html',new URL('https://oblepiha-22.ru/'),items,[]);
  const feed=result.html.match(/<!-- news-feed:start -->([\s\S]*?)<!-- news-feed:end -->/)[1];
  assert.equal((feed.match(/class="news-card"/g)||[]).length,4);
  assert.ok(feed.indexOf('preview-9')<feed.indexOf('preview-8'));
  assert.match(result.html,/data-count="4" data-total="10"/);
  assert.match(result.html,/Показано 4 из 10/);
  assert.match(result.html,/Ещё 6 новостей/);
  const full=renderPublicPage(root,'news.html',new URL('https://oblepiha-22.ru/news.html'),items,[]);
  assert.equal((full.html.match(/class="news-card"/g)||[]).length,10);
});
test('remaining-news label handles one, few and many and does not imply extras for a sparse feed', () => {
  for(const [count,label] of [[0,'Все новости'],[2,'Все новости'],[5,'Ещё 1 новость'],[6,'Ещё 2 новости'],[15,'Ещё 11 новостей'],[25,'Ещё 21 новость']]) {
    const html=renderPublicPage(root,'index.html',new URL('https://oblepiha-22.ru/'),posts(count),[]).html;
    assert.ok(html.includes('<span data-news-more-label>'+label+'</span>'));
    if(!count)assert.match(html,/data-news-summary hidden/);
  }
});
