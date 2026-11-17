import { writeFileSync } from 'node:fs';
import { pages } from '../server/seo.mjs';
const base = new URL(process.argv[2] || 'https://oblepiha-22.ru/');
const decode = text => text.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const results = await Promise.all(Object.keys(pages).map(async name => {
  const url = new URL(name === 'index.html' ? './' : name, base);
  const started = performance.now();
  try {
    const response = await fetch(url, {signal:AbortSignal.timeout(20000)}), html = await response.text();
    const schema = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map(match => JSON.parse(match[1]));
    const title = decode(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '');
    const description = decode(html.match(/name="description" content="([^"]+)"/)?.[1] || '');
    const canonical = decode(html.match(/rel="canonical" href="([^"]+)"/)?.[1] || '');
    const h1 = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(match => match[1].replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim());
    return {name,status:response.status,title,description,canonical,h1,schemaTypes:schema.flatMap(s=>s['@graph']?.map(n=>n['@type']) || [s['@type']]),htmlBytes:Buffer.byteLength(html),responseMs:Math.round(performance.now()-started),issues:[...(response.status!==200?['HTTP '+response.status]:[]),...(!title?['Missing title']:[]),...(!description?['Missing description']:[]),...(!canonical?['Missing canonical']:[]),...(h1.length!==1?['H1 count '+h1.length]:[])]};
  } catch(error) { return {name,issues:[error.message]}; }
}));
const probes = await Promise.all(['http://oblepiha-22.ru/','https://www.oblepiha-22.ru/',new URL('index.html',base).href,new URL('robots.txt',base).href,new URL('sitemap.xml',base).href,new URL('news.html?id=missing-seo-audit',base).href].map(async url=>{
  try { const res = await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(15000)}); const text=await res.text();return {url,status:res.status,location:res.headers.get('location'),contentType:res.headers.get('content-type'),...(url.endsWith('sitemap.xml')?{urls:[...text.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>decode(m[1]))}:{}),...(url.endsWith('robots.txt')?{text}: {})}; }
  catch(error) {return {url,error:error.message};}
}));
const report = {checkedAt:new Date().toISOString(),base:base.href,pages:results,probes};
if (process.argv[3]) writeFileSync(process.argv[3],JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
