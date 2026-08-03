// Minimal service worker. Its only job is to satisfy browser installability
// criteria (a controlling service worker with a fetch handler) — this site
// always needs a live connection, so no offline caching is implemented here.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Only these two external tile hosts actually need the explicit
// respondWith(fetch()) passthrough below (see the comment on the fetch
// listener) — every other request on the site falls through untouched,
// as a plain "fetch" listener with no respondWith is required to do by
// spec. Scoping this narrowly matters: some environments (traffic-
// scanning antivirus/proxies doing TLS interception, seen live as
// injected kaspersky-labs.com requests) can make the *inner* fetch()
// call made from inside this handler reject even for perfectly healthy
// resources — and since respondWith() was called, that rejection hard-
// fails the resource instead of falling back to a normal load. Wrapping
// every request on the site in that risk (as an earlier version of this
// file did) silently broke unrelated things — including audio playback
// — for anyone with that kind of interference present, all to fix one
// specific map bug. Scoping it to only the hosts that need it removes
// that blast radius entirely.
const TILE_HOSTS = new Set(["server.arcgisonline.com", "s3.amazonaws.com"]);

self.addEventListener("fetch", (event) => {
  let url;

  try {
    url = new URL(event.request.url);
  } catch {
    return;
  }

  if (!TILE_HOSTS.has(url.hostname)) return;

  // Explicit network passthrough. Leaving this handler a no-op (never
  // calling respondWith) let some browsers downgrade cross-origin image
  // responses passing through it to "opaque" — fine for a plain <img> or
  // WebGL texture, but fatal for MapLibre's raster-dem terrain tiles, which
  // must read real pixel values back out of the image via canvas
  // getImageData() to compute elevation. An opaque image throws a
  // SecurityError there, which silently killed the whole map's render loop
  // (see TrekRoute3DCanvas) while leaving DOM-only bits like markers and
  // attribution unaffected — exactly the "blank map, visible pin" symptom.
  event.respondWith(fetch(event.request));
});
