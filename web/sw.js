/* Service worker for the hosted "Opi ja pelaa" web app.
   Cache-first so it keeps working offline once added to the home screen.
   Bump CACHE whenever the game files change to force a refresh. */
var CACHE = "opijapelaa-v5";
var ASSETS = [
  "./", "index.html", "hub.css", "logic.js", "celebrate.js", "ui.js", "success.wav",
  "manifest.webmanifest",
  "lue.html", "laske.html", "kello.html", "vastakohdat.html", "varit.html",
  "vertailu.html", "muodot.html", "montako.html", "lukujono.html",
  "kirjaimet.html", "viikonpaivat.html", "tavut.html",
  "mikakuuluu.html", "mikaon.html", "riimit.html",
  "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) { return caches.delete(k); }
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") { return; }
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).catch(function () {
        return caches.match("index.html");
      });
    })
  );
});
