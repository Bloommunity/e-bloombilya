const CACHE_NAME = "ebloombilya-nuxt-v3";
const PRECACHE_URLS = [
	"/",
	"/manifest.webmanifest",
	"/images/bloombilya-512.png",
	"/images/bloombilya-768.png",
	"/images/bloombilya.png",
	"/images/favicon.ico",
];

function toSameOriginUrl(candidate) {
	if (
		!candidate ||
		candidate.startsWith("data:") ||
		candidate.startsWith("mailto:") ||
		candidate.startsWith("tel:")
	) {
		return null;
	}

	try {
		const url = new URL(candidate, globalThis.location.origin);
		return url.origin === globalThis.location.origin ? url.toString() : null;
	} catch {
		return null;
	}
}

function extractAssetUrls(html) {
	const matches = html.matchAll(/(?:src|href)=(['"])([^'"]+)\1/gi);
	const urls = new Set();

	for (const match of matches) {
		const resolved = toSameOriginUrl(match[2]);
		if (resolved) urls.add(resolved);
	}

	return [...urls];
}

async function cacheResponse(cache, requestUrl) {
	const response = await fetch(requestUrl);
	if (!response.ok) return;

	try {
		await cache.put(requestUrl, response.clone());
	} catch {
		// ignore opaque or non-cacheable responses
	}

	return response;
}

async function precacheAppShell() {
	const cache = await caches.open(CACHE_NAME);
	const shellResponse = await cacheResponse(cache, "/");

	await Promise.all(PRECACHE_URLS.slice(1).map((requestUrl) => cacheResponse(cache, requestUrl)));

	if (!shellResponse) return;

	const html = await shellResponse.clone().text();
	const assetUrls = extractAssetUrls(html);
	await Promise.all(assetUrls.map((requestUrl) => cacheResponse(cache, requestUrl)));
}

self.addEventListener("install", (event) => {
	event.waitUntil(
		(async () => {
			await precacheAppShell();
			await globalThis.skipWaiting();
		})(),
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys.map((key) =>
						key === CACHE_NAME ? Promise.resolve() : caches.delete(key),
					),
				),
			),
	);
	globalThis.clients.claim();
});

async function cacheFirst(request) {
	const cached = await caches.match(request);
	if (cached) return cached;

	const response = await fetch(request);
	const cache = await caches.open(CACHE_NAME);
	try {
		cache.put(request, response.clone());
	} catch {
		// ignore opaque or non-cacheable responses
	}
	return response;
}

async function networkFirst(request) {
	try {
		const response = await fetch(request);
		const cache = await caches.open(CACHE_NAME);
		try {
			cache.put(request, response.clone());
		} catch {
			// ignore opaque or non-cacheable responses
		}
		return response;
	} catch {
		const cached = await caches.match(request);
		if (cached) return cached;
		return caches.match("/");
	}
}

self.addEventListener("fetch", (event) => {
	const { request } = event;

	if (request.method !== "GET") return;

	if (request.mode === "navigate") {
		event.respondWith(networkFirst(request));
		return;
	}

	if (request.destination === "manifest") {
		event.respondWith(cacheFirst(request));
		return;
	}

	if (["image", "style", "script", "font"].includes(request.destination)) {
		event.respondWith(cacheFirst(request));
		return;
	}

	event.respondWith(networkFirst(request));
});
