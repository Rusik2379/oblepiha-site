import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pages, seoHead, sitemap, renderPublicPage } from '../server/seo.mjs';
const root = resolve(import.meta.dirname, '..');
for (const name of Object.keys(pages)) {
  let html = readFileSync(resolve(root, name), 'utf8');
  const headings = { 'banquet.html':['banquet-content-title','Банкетный зал в Новоалтайске'], 'conference.html':['conference-content-title','Конференц-зал в Новоалтайске'], 'grill.html':['grill-content-title','Гриль-бар в Новоалтайске'], 'sauna.html':['sauna-content-title','Финская сауна с джакузи в Новоалтайске'] };
  if (headings[name]) {
    const [id, text] = headings[name];
    html = html.replace(new RegExp(`(<h1 id="${id}">)[\\s\\S]*?(</h1>)`), `$1${text}$2`);
  }
  if (name === 'promotions.html' && !/<h1\b/.test(html)) html = html.replace('<nav class="promotions-navigation"', '<h1 class="visually-hidden">Акции и предложения комплекса «Облепиха»</h1>\n<nav class="promotions-navigation"');
  html = html.replace(/src="assets\/logo-berry.webp"/g, 'width="256" height="171" src="assets/optimized/logo-berry-256.webp"');
  html = html.replace(/src="assets\/footer-bg.webp"/g, 'src="assets/optimized/footer-bg-1920.webp" srcset="assets/optimized/footer-bg-768.webp 768w, assets/optimized/footer-bg-1920.webp 1920w" sizes="100vw"');
  if (name === 'index.html' && !html.includes('srcset="assets/optimized/hero-')) html = html.replace('class="hero-photo" decoding="async" fetchpriority="high" src="assets/hero.webp"', 'class="hero-photo" decoding="async" fetchpriority="high" src="assets/hero.webp" srcset="assets/optimized/hero-640.webp 640w, assets/optimized/hero-1280.webp 1280w, assets/optimized/hero-1920.webp 1920w, assets/hero.webp 2560w" sizes="100vw"');
  if (!html.includes('href="seo-images.css')) html = html.replace('<head>', '<head>\n<link rel="stylesheet" href="seo-images.css?v=20261001-1"/>');
  if (!html.includes('src="analytics.js')) html = html.replace('</head>', '<script defer src="analytics-config.js?v=20261001-1"></script>\n<script defer src="analytics.js?v=20261001-1"></script>\n</head>');
  html = html.replace(/analytics-config\.js\?v=[\d-]+/g, 'analytics-config.js?v=20261002-1').replace(/analytics\.js\?v=[\d-]+/g, 'analytics.js?v=20261002-1');
  html = html.replace(/<!-- seo-head:start -->[\s\S]*?<!-- seo-head:end -->/g, '');
  html = html.replace(/<title>[\s\S]*?<\/title>/gi, '').replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<meta\b[^>]*(?:name="(?:description|robots|twitter:[^"]+)"|property="og:[^"]+")[^>]*\/?\s*>/gi, '');
  html = html.replace(/<link\b[^>]*rel="canonical"[^>]*\/?\s*>/gi, '');
  html = html.replace('</head>', seoHead(name) + '\n</head>');
  for (const key of ['news', 'vacancy']) {
    const marker = `${key}-feed`;
    if (!html.includes(`<!-- ${marker}:start -->`)) {
      const re = key === 'news' ? /(<div\b[^>]*data-news-feed[^>]*>)([\s\S]*?)(<\/div>)/ : /(<div\b[^>]*id="vacancy-feed"[^>]*>)([\s\S]*?)(<\/div>)/;
      html = html.replace(re, `$1<!-- ${marker}:start -->$2<!-- ${marker}:end -->$3`);
    }
  }
  html = html.replace(/news\.js\?v=[\d-]+/g, 'news.js?v=20261002-3').replace(/news\.css\?v=[\d-]+/g, 'news.css?v=20261002-3').replace(/vacancies\.js\?v=[\d-]+/g, 'vacancies.js?v=20261001-2');
  if (name === 'index.html') html = html.replace('data-limit="3"', 'data-limit="4"');
  writeFileSync(resolve(root, name), html);
}
// A useful static fallback remains when previewed without the Node server.
const seed = JSON.parse(readFileSync(resolve(root,'news-seed.json'), 'utf8'));
for (const name of ['index.html','news.html','vacancies.html']) {
  writeFileSync(resolve(root,name), renderPublicPage(root,name,new URL('https://oblepiha-22.ru/' + name),seed,[]).html);
}
writeFileSync(resolve(root,'sitemap.xml'), sitemap(seed));
console.log('Updated SEO on 10 public pages and the fallback sitemap.');
