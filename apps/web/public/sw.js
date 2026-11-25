const CACHE_NAME = "muslim-ayat-public-v2";
const PRECACHE_URLS = [
  "/offline.html",
  "/icons/icon.svg",
  "/manifest.webmanifest",
  "/quran",
  "/surah/1",
];

function isPublicReaderPath(pathname) {
  const normalizedPath = pathname.replace(/\/$/u, "");
  return normalizedPath === "/quran" || /^\/surah\/\d+$/u.test(normalizedPath);
}

function canCachePublicReaderResponse(response) {
  const cacheControl = response.headers.get("Cache-Control") ?? "";
  return (
    response.ok &&
    response.headers.get("X-Muslim-Ayat-Cache") === "public" &&
    !/private|no-store/i.test(cacheControl) &&
    !response.headers.has("Set-Cookie")
  );
}

async function fetchAndCachePublicPage(request) {
  const response = await fetch(request);
  if (canCachePublicReaderResponse(response)) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("muslim-ayat-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    if (isPublicReaderPath(url.pathname)) {
      event.respondWith(
        fetchAndCachePublicPage(request).catch(async () => {
          return (await caches.match(request)) ?? (await caches.match("/offline.html"));
        }),
      );
    } else {
      event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
    }
    return;
  }

  const isPublicStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/quran-data/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest";
  const isPublicReaderData = isPublicReaderPath(url.pathname);

  if (!isPublicStaticAsset && !isPublicReaderData) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) return cachedResponse;

      const response = await fetch(request);
      const cacheControl = response.headers.get("Cache-Control") ?? "";
      if (
        isPublicStaticAsset &&
        response.ok &&
        !/private|no-store/i.test(cacheControl) &&
        !response.headers.has("Set-Cookie")
      ) {
        await cache.put(request, response.clone());
      } else if (isPublicReaderData && canCachePublicReaderResponse(response)) {
        await cache.put(request, response.clone());
      }
      return response;
    }),
  );
});