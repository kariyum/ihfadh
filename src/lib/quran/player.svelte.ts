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
	#scheduledEndTime: number = 0;
	#loopPromise: Promise<void> | null = null;

	constructor() {
		if (browser) {
			this.#audioContext = new AudioContext();
		}
	}

	// update: add surah, version tuple class wrapper for easy access with .next()
	async play(startSurah: number, startVerse: number) {
		if (!this.#audioContext) return;

		this.surahNumber = startSurah;
		this.verse = startVerse;
		this.status = 'loading';
		this.error = null;
		this.#scheduledEndTime = 0;

		this.playLoop(startSurah, startVerse);

		await this.#audioContext.resume();
		this.status = 'playing';
	}

	private async schedule(startSurah: number, startVerse: number) {
		if (!this.#audioContext) return;
		const url = verseAudioUrl(settings.reciter, startSurah, startVerse);
		const data = await getVerseAudioSource(url);
		const source = this.#audioContext.createBufferSource();
		this.#sources.push(source);
		source.buffer = await this.#audioContext.decodeAudioData(data.arrayBuffer);
		source.connect(this.#audioContext.destination);
		const now = this.#audioContext.currentTime;
		const startTime = Math.max(now, this.#scheduledEndTime);
		console.log(
			`Scheduled ${startSurah} ${startVerse} at ${startTime} for ${source.buffer.duration}`
		);
		source.start(startTime);
		this.#scheduledEndTime = startTime + source.buffer.duration - 0.08;
	}

	private async playLoop(startSurah: number, startVerse: number) {
		let i = 0;

		while (true) {
			await this.schedule(startSurah, startVerse + i);
			i++;
		}
		this.#loopPromise = new Promise((resolve, reject) => {
			resolve();
		});
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
