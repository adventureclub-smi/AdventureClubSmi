// Minimal service worker. Its only job is to satisfy browser installability
// criteria (a controlling service worker with a fetch handler) — this site
// always needs a live connection, so no offline caching is implemented here.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
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
