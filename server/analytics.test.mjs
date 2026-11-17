import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const code = readFileSync(new URL('../analytics.js', import.meta.url),'utf8');
function setup(url = 'https://oblepiha-22.ru/rooms.html', id = 12345678, options = {}) {
  const calls = [], scripts = [], handlers = {};
  const context = {
    URL, location:new URL(url),
    window:{ OBLEPIHA_ANALYTICS:{ metrikaId:id, hosts:['oblepiha-22.ru','www.oblepiha-22.ru'], ...options }, ym:(...args)=>calls.push(args) },
    document:{title:'Номера гостиницы',referrer:'https://yandex.ru/search/?text=private',querySelector:()=>null,createElement:()=>({}),head:{appendChild:s=>scripts.push(s)},addEventListener:(type,handler)=>handlers[type]=handler}
  };
  runInNewContext(code,context);
  const click = (href, attrs = {}, position = 'content', trusted = true) => {
    const target = new URL(href,context.location);
    const link = { href:target.href, protocol:target.protocol, hasAttribute:key=>key in attrs, getAttribute:key=>key==='href'?href:attrs[key], classList:{contains:name=>name===attrs.class},closest:selector=>selector==='header'?position==='header':selector==='.site-closing'?position==='footer':false };
    handlers.click?.({isTrusted:trusted,button:0,target:{closest:()=>link}});
  };
  return {calls,scripts,click,context};
}
test('analytics is disabled for previews, admin, invalid IDs and unsupported pages',()=>{
  for (const [url,id] of [['http://localhost:8765/',123],['https://other.example/',123],['https://oblepiha-22.ru/editor.html',123],['https://oblepiha-22.ru/api/news',123],['https://oblepiha-22.ru/',0],['https://oblepiha-22.ru/',-1],['https://oblepiha-22.ru/',1.2]]) {
    const result=setup(url,id); assert.equal(result.calls.length,0);assert.equal(result.scripts.length,0);
  }
});
test('one clean pageview keeps attribution, disables session recording and excludes arbitrary fields',()=>{
  const result=setup('https://oblepiha-22.ru/news.html?id=winter-tea&utm_source=vk&email=guest@example.com&phone=999#personal');
  assert.equal(result.calls[0][1],'init'); assert.equal(result.calls[0][2].defer,true);assert.equal(result.calls[0][2].webvisor,false);
  assert.equal(result.calls[1][1],'hit'); assert.equal(result.calls[1][2],'https://oblepiha-22.ru/news.html?id=winter-tea&utm_source=vk');
  assert.equal(result.calls[1][3].referer,'https://yandex.ru/search/');
  assert.equal(result.scripts.length,1);
  runInNewContext(code,result.context); assert.equal(result.calls.length,2);assert.equal(result.scripts.length,1);
});
test('business goals classify room and service interactions without guest details or fake purchases',()=>{
  const result=setup();
  result.click('#',{'data-tl-booking-open':'true','data-tl-room':'413828'},'footer');
  result.click('tel:+79237116891',{},'content');
  result.click('https://max.ru/id222201179247_1_bot',{},'header');
  result.click('https://yandex.ru/maps/org/oblepikha/24483320354/reviews/');
  result.click('/news.html?id=winter-tea');
  result.click('#',{'data-tl-booking-open':'true'},'content',false);
  const goals=result.calls.filter(call=>call[1]==='reachGoal');
  assert.deepEqual(goals.map(call=>call[2]),['booking_click','phone_click','messenger_click','reviews_click','news_read']);
  assert.equal(goals[0][3].room,'413828'); assert.equal(goals[0][3].position,'footer'); assert.equal(goals[1][3].service,'sauna');
  const text=JSON.stringify(goals); assert.ok(!text.includes('+79237116891')); assert.ok(!text.includes('purchase')); assert.ok(!text.includes('booking_success'));
});
test('provided counter settings enable recordings and maps without duplicating pageviews',()=>{
  const result=setup('https://oblepiha-22.ru/',113281307,{webvisor:true,clickmap:true,trackLinks:true});
  assert.equal(result.calls[0][0],113281307);
  assert.equal(result.calls[0][2].webvisor,true);
  assert.equal(result.calls[0][2].clickmap,true);
  assert.equal(result.calls[0][2].trackLinks,true);
  assert.equal(result.calls[0][2].ssr,true);
  assert.equal(result.calls[0][2].ecommerce,'dataLayer');
  assert.equal(result.calls.filter(c=>c[1]==='hit').length,1);
  assert.equal(result.scripts[0].src,'https://mc.yandex.ru/metrika/tag.js?id=113281307');
  runInNewContext(code,result.context);
  assert.equal(result.calls.filter(c=>c[1]==='init').length,1);
  assert.equal(result.calls.filter(c=>c[1]==='hit').length,1);
});
