import { browser } from '$app/env';
import { settings } from '#lib/stores/settings.svelte.js';
import { cacheVerseAudio, getVerseAudioSource, verseAudioUrl } from './audio';

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused';

const SURAH_COUNT = 114;

class Player {
	surahNumber = $state<number | null>(null);
	verse = $state<number | null>(null);
	status = $state<PlayerStatus>('idle');
	error = $state<string | null>(null);

	#audioContext: AudioContext | null = null;
	#sources: AudioBufferSourceNode[] = [];

	constructor() {
		if (browser) {
			this.#audioContext = new AudioContext();
		}
	}

	async play(startSurah: number, startVerse: number) {
		if (!this.#audioContext) return;

		this.surahNumber = startSurah;
		this.verse = startVerse;
		this.status = 'loading';
		this.error = null;

		const url = verseAudioUrl(settings.reciter, startSurah, startVerse);
		const data = await getVerseAudioSource(url);
		const source = this.#audioContext.createBufferSource();
		this.#sources.push(source);
		source.buffer = await this.#audioContext.decodeAudioData(data.arrayBuffer);
		source.connect(this.#audioContext.destination);
        source.start(0);
		await this.#audioContext.resume();
		this.status = 'playing';
	}

	pause() {
		this.status = 'paused';
	}

	async resume() {
		if (!this.#audioContext) return;
		await this.#audioContext.resume();
		// if (this.status === 'paused') {
		// 	await this.#audio.play();
		// 	this.status = 'playing';
		// } else if (this.status === 'idle') {
		// 	await this.play(this.surahNumber, Math.max(this.verse, 1));
		// }
	}

	toggle() {
		if (this.status === 'playing') this.pause();
		else void this.resume();
	}

	async next() {}

	async previous() {}

	stop() {}
}

export const player = new Player();
