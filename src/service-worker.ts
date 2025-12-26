/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = `bingo-party-${version}`;

// Assets to cache: built JS/CSS and static files
const ASSETS = [...build, ...files];

// Install: cache all static assets
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(ASSETS))
			.then(() => self.skipWaiting())
	);
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
			)
			.then(() => self.clients.claim())
	);
});

// Fetch: cache-first for assets, network-first for pages
self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	// Skip non-GET requests
	if (event.request.method !== 'GET') return;

	// Skip WebSocket connections and PartyKit
	if (url.protocol === 'ws:' || url.protocol === 'wss:') return;
	if (url.hostname.includes('partykit')) return;

	// Skip chrome-extension and other non-http(s) requests
	if (!url.protocol.startsWith('http')) return;

	// For same-origin requests
	if (url.origin === self.location.origin) {
		// Cache-first for static assets
		if (ASSETS.includes(url.pathname)) {
			event.respondWith(
				caches.match(event.request).then((cached) => cached || fetch(event.request))
			);
			return;
		}

		// Network-first for HTML pages (dynamic content)
		if (event.request.mode === 'navigate') {
			event.respondWith(
				fetch(event.request)
					.then((response) => {
						// Cache the page for offline access
						const clone = response.clone();
						caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
						return response;
					})
					.catch(() => caches.match(event.request).then((cached) => cached || caches.match('/')))
			);
			return;
		}
	}

	// For external resources (fonts, etc): network with cache fallback
	event.respondWith(
		fetch(event.request)
			.then((response) => {
				// Only cache successful responses
				if (response.ok) {
					const clone = response.clone();
					caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
				}
				return response;
			})
			.catch(() => caches.match(event.request))
	);
});
