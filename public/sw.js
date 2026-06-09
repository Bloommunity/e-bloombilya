const CACHE_NAME = "ebloombilya-nuxt-v1";

self.addEventListener("install", (event) => {
	event.waitUntil(self.skipWaiting());
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
	self.clients.claim();
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

	if (["image", "style", "script", "font"].includes(request.destination)) {
		event.respondWith(cacheFirst(request));
		return;
	}

	event.respondWith(networkFirst(request));
});
