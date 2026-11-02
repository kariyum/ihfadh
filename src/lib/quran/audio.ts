import type { Reciter } from './types';

// Verse audio comes from everyayah.com, which allows cross-origin requests.
// Each file is stored in the Cache API the first time it is fetched.
const CACHE_NAME = 'quran-audio-v1';

const pad = (n: number) => String(n).padStart(3, '0');

export function verseAudioUrl(reciter: Reciter, surah: number, verse: number) {
	return `https://everyayah.com/data/${reciter.folder}/${pad(surah)}${pad(verse)}.mp3`;
}

function hasCacheApi() {
	return typeof caches !== 'undefined';
}

async function fetchVerseAudio(url: string): Promise<ArrayBuffer> {
	const cache = await caches.open(CACHE_NAME);
	const cached = await cache.match(url);
	if (cached) return cached.arrayBuffer();

	const response = await fetch(url);
	console.log(response.ok);
	if (!response.ok) throw new Error(`Audio request failed (${response.status})`);

	await cache.put(url, response.clone());
	return response.arrayBuffer();
}

// Returns a URL that an <audio> element can play. Object URLs must be revoked by the caller.
export async function getVerseAudioSource(
	url: string
): Promise<{ arrayBuffer: ArrayBuffer }> {
	const arrayBuffer = await fetchVerseAudio(url);
    return { arrayBuffer };
}

export async function cacheVerseAudio(url: string) {
	if (hasCacheApi()) await fetchVerseAudio(url);
}

export async function downloadSurahAudio(
	reciter: Reciter,
	surah: number,
	verseCount: number,
	onProgress: (fraction: number) => void
) {
	for (let verse = 1; verse <= verseCount; verse++) {
		await cacheVerseAudio(verseAudioUrl(reciter, surah, verse));
		onProgress(verse / verseCount);
	}
}

export async function isSurahDownloaded(reciter: Reciter, surah: number, verseCount: number) {
	if (!hasCacheApi()) return false;
	const cache = await caches.open(CACHE_NAME);
	for (let verse = 1; verse <= verseCount; verse++) {
		if (!(await cache.match(verseAudioUrl(reciter, surah, verse)))) return false;
	}
	return true;
}
