var CACHE = 'cm-v7';
var ARCHIVOS = ['./', './manifest.json', './icono-192.png', './icono-512.png', './icono-maskable.png'];
function limpia(r) {
  // una respuesta que vino de una redireccion no se puede usar para abrir la pagina; se copia limpia
  if (!r || !r.redirected) return Promise.resolve(r);
  return r.blob().then(function (b) { return new Response(b, { status: 200, headers: r.headers }); });
}
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(ARCHIVOS.map(function (u) { return fetch(u, { cache: 'reload' }).then(limpia).then(function (r) { return c.put(u, r); }); }));
  }));
  self.skipWaiting();
});
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (k) { return Promise.all(k.filter(function (x) { return x !== CACHE; }).map(function (x) { return caches.delete(x); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.hostname.indexOf('script.google') >= 0 || u.hostname.indexOf('googleusercontent') >= 0) return;
  if (e.request.mode === 'navigate') {
    // abrir la app: con senal trae la version nueva; sin senal usa la guardada
    e.respondWith(fetch(e.request).then(function (r) {
      if (r.ok) limpia(r.clone()).then(function (cp) { caches.open(CACHE).then(function (c) { c.put('./', cp); }); });
      return r;
    }).catch(function () { return caches.match('./'); }));
    return;
  }
  if (u.origin === location.origin) {
    e.respondWith(fetch(e.request).then(function (r) { if (r.ok && !r.redirected) { var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, cp); }); } return r; })
      .catch(function () { return caches.match(e.request, { ignoreSearch: true }); }));
  } else {
    e.respondWith(caches.match(e.request).then(function (r) { return r || fetch(e.request).then(function (n) { var cp = n.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, cp); }); return n; }); }));
  }
});
