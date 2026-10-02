const CACHE='herit-lens-shell-v218-core1';
const ASSETS=['./','./index.html','./styles.css?v=2.18-core1','./app.js?v=2.18-core1','./cloud.js?v=2.18-core1','./i18n.js?v=1.0','./targeting.js','./buildings.js','./manifest.webmanifest','./icon.svg','./about.html','./sources.html','./privacy.html','./legal.html','./terms.html','./pricing.html','./dashboard.html','./coverage.html','./test-mode-v25.html','./prospects.html','./info.css?v=2.18-audit1'];
self.addEventListener('install',e=>e.waitUntil(
  caches.open(CACHE)
    .then(async c=>{ await Promise.allSettled(ASSETS.map(asset=>c.add(asset))); })
    .then(()=>self.skipWaiting())
));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const u=new URL(e.request.url);
 if(u.origin!==location.origin)return;
 e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./'))));
});