import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const serviceWorkerSource = readFileSync(new URL("../../../public/sw.js", import.meta.url), "utf8");

describe("public reader service worker", () => {
  it("keeps serving fresh responses when Cache Storage operations fail", async () => {
    const listeners = new Map<string, (event: unknown) => void>();
    const cache = {
      addAll: vi.fn(),
      match: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockRejectedValue(new Error("Storage quota exceeded")),
    };
    const caches = {
      delete: vi.fn(),
      keys: vi.fn().mockResolvedValue([]),
      match: vi.fn().mockResolvedValue(new Response("offline copy")),
      open: vi
        .fn()
        .mockResolvedValueOnce(cache)
        .mockResolvedValueOnce(cache)
        .mockRejectedValueOnce(new Error("Cache Storage unavailable")),
    };
    const fetchedResponses = [
      new Response("fresh page", { headers: { "X-Muslim-Ayat-Cache": "public" } }),
      new Response("fresh asset"),
      new Response("network after cache open failure"),
    ];
    const fetch = vi.fn().mockImplementation(() => Promise.resolve(fetchedResponses.shift()));
    const self = {
      addEventListener: (type: string, listener: (event: unknown) => void) => listeners.set(type, listener),
      clients: { claim: vi.fn() },
      location: { origin: "https://example.test" },
      skipWaiting: vi.fn(),
    };

    runInNewContext(serviceWorkerSource, { caches, fetch, Promise, Response, self, URL });

    const fetchListener = listeners.get("fetch") as
      | ((event: {
          request: { method: string; mode: string; url: string };
          respondWith: (response: Promise<Response>) => void;
        }) => void)
      | undefined;
    if (!fetchListener) throw new Error("Service worker did not register a fetch listener.");

    const requests = [
      {
        request: { method: "GET", mode: "navigate", url: "https://example.test/surah/2" },
        expectedBody: "fresh page",
      },
      {
        request: { method: "GET", mode: "cors", url: "https://example.test/_next/static/app.js" },
        expectedBody: "fresh asset",
      },
      {
        request: { method: "GET", mode: "cors", url: "https://example.test/_next/static/chunk.js" },
        expectedBody: "network after cache open failure",
      },
    ];

    for (const { request, expectedBody } of requests) {
      let responsePromise: Promise<Response> | undefined;
      fetchListener({
        request,
        respondWith: (response) => {
          responsePromise = response;
        },
      });
      if (!responsePromise) throw new Error("Service worker did not provide a fetch response.");

      expect(await (await responsePromise).text()).toBe(expectedBody);
    }

    expect(cache.put).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("evicts the oldest entry when the public cache exceeds its size limit", async () => {
    const listeners = new Map<string, (event: unknown) => void>();
    const cachedRequests = Array.from({ length: 257 }, (_, index) => ({
      url: `https://example.test/old-${index}`,
    }));
    const cache = {
      delete: vi.fn().mockResolvedValue(true),
      keys: vi.fn().mockResolvedValue(cachedRequests),
      match: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
    };
    const caches = {
      delete: vi.fn(),
      keys: vi.fn().mockResolvedValue([]),
      match: vi.fn(),
      open: vi.fn().mockResolvedValue(cache),
    };
    const fetch = vi.fn().mockResolvedValue(new Response("fresh asset"));
    const self = {
      addEventListener: (type: string, listener: (event: unknown) => void) => listeners.set(type, listener),
      clients: { claim: vi.fn() },
      location: { origin: "https://example.test" },
      skipWaiting: vi.fn(),
    };

    runInNewContext(serviceWorkerSource, { caches, fetch, Promise, Response, self, URL });

    const fetchListener = listeners.get("fetch") as
      | ((event: {
          request: { method: string; mode: string; url: string };
          respondWith: (response: Promise<Response>) => void;
        }) => void)
      | undefined;
    if (!fetchListener) throw new Error("Service worker did not register a fetch listener.");

    let responsePromise: Promise<Response> | undefined;
    fetchListener({
      request: { method: "GET", mode: "cors", url: "https://example.test/_next/static/app.js" },
      respondWith: (response) => {
        responsePromise = response;
      },
    });
    if (!responsePromise) throw new Error("Service worker did not provide a fetch response.");

    expect(await (await responsePromise).text()).toBe("fresh asset");
    expect(cache.delete).toHaveBeenCalledTimes(1);
    expect(cache.delete).toHaveBeenCalledWith(cachedRequests[0]);
  });
});