/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />
import { version } from '$app/env';
import { assets, immutable, prerendered } from '$app/manifest';

const sw = self as unknown as ServiceWorkerGlobalScope;

// The app may be served from a sub-path (GitHub Pages), so derive the base from the SW scope.
const base = new URL(sw.registration.scope).pathname.replace(/\/$/, '');
const FALLBACK = `${base}/404.html`;

const SHELL_CACHE = `ayah-shell-${version}`;
const AUDIO_CACHE = 'quran-audio-v1';
const SHELL_ASSETS = [
	FALLBACK,
	...immutable.map((file) => `${base}/${file.path}`),
	...prerendered.map((page) => `${base}/${page.path}`),
	...assets.map((file) => `${base}/${file.path}`)
];
const SHELL_SET = new Set(SHELL_ASSETS);

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(SHELL_CACHE)
			.then((cache) => cache.addAll(SHELL_ASSETS))
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((key) => key !== SHELL_CACHE && key !== AUDIO_CACHE)
						.map((key) => caches.delete(key))
				)
			)
			.then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;

	const url = new URL(request.url);
	if (url.origin !== location.origin) return;

	// Every route is client-rendered. Use the network when online, and fall back to the cached shell offline.
	if (request.mode === 'navigate') {
		event.respondWith(fetch(request).catch(() => caches.match(FALLBACK) as Promise<Response>));
		return;
	}

	if (SHELL_SET.has(url.pathname)) {
		event.respondWith(caches.match(url.pathname).then((hit) => hit ?? fetch(request)));
	}
});
