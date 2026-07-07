// Minimal service worker. Its only job is to satisfy browser installability
// criteria (a controlling service worker with a fetch handler) — this site
// always needs a live connection, so no offline caching is implemented here.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Intentionally empty: every request just falls through to the network.
});
