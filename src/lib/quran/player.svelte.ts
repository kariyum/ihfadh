import { browser } from '$app/env';
import { settings } from '#lib/stores/settings.svelte.js';
import { cacheVerseAudio, getVerseAudioSource, verseAudioUrl } from './audio';
import type { QuranIndexKeeper } from './quran';
import type { Ayah } from './types';

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused';

export class Player {
	error = $state<string | null>(null);
	status = $state<PlayerStatus>('idle');

	currentAyah = $state<Ayah | null>(null);
	#startAyah = $state<Ayah | null>(null);

	#audioContext: AudioContext | null = null;
	#sources: AudioBufferSourceNode[] = [];
	#scheduledEndTime: number = 0;
	#quranIndexKeeper: QuranIndexKeeper;
	#loopPromise: Promise<void> | null = null;
	#ayahToSchedule: Ayah | null = null;
	#onReciteHandlers: ((previous: Ayah | null, next: Ayah | null) => void)[] = [];
	#ayahBufferCount: number = 0;

	constructor(quranIndexKeeper: QuranIndexKeeper) {
		this.#quranIndexKeeper = quranIndexKeeper;
		if (browser) {
			this.#audioContext = new AudioContext();
		}
	}

	async play(ayah: Ayah) {
		if (!this.#audioContext) return;
		if (this.status == 'playing') {
			return;
		}

		this.#startAyah = ayah;
		this.currentAyah = ayah;
		this.#ayahToSchedule = ayah;

		this.status = 'loading';
		this.error = null;
		this.#scheduledEndTime = 0;

		this.notifyOnRecite(null, this.currentAyah);
		this.playLoop();

		await this.#audioContext.resume();
		this.status = 'playing';
	}

	private notifyOnRecite(currentAyah: Ayah | null, nextAyah: Ayah | null) {
		for (const handler of this.#onReciteHandlers) {
			handler(currentAyah, nextAyah);
		}
	}

	private async schedule() {
		if (!this.#audioContext || !this.#ayahToSchedule) return;
		const data = await getVerseAudioSource(verseAudioUrl(settings.reciter, this.#ayahToSchedule));
		const source = this.#audioContext.createBufferSource();
		this.#sources.push(source);
		source.onended = () => this.onVerseEnd();
		source.buffer = await this.#audioContext.decodeAudioData(data.arrayBuffer);
		source.connect(this.#audioContext.destination);
		const startTime = Math.max(this.#audioContext.currentTime, this.#scheduledEndTime);
		source.start(startTime);
		this.#scheduledEndTime = startTime + source.buffer.duration - 0.08;
		this.#ayahToSchedule = this.#quranIndexKeeper.next(this.#ayahToSchedule);
		this.#ayahBufferCount += 1;
	}

	private onVerseEnd() {
		if (this.currentAyah) {
			const nextAyah = this.#quranIndexKeeper.next(this.currentAyah);
			if (!nextAyah) {
				this.status = 'idle';
			}

			this.notifyOnRecite(this.currentAyah, nextAyah);
			this.currentAyah = nextAyah;
			this.#ayahBufferCount -= 1;
		}
	}

	private async playLoop() {
		setTimeout(async () => {
			if (this.#ayahBufferCount < 5) {
				await this.schedule();
			}
			this.playLoop();
		}, 500);
	}

	async pause() {
		await this.#audioContext?.suspend();
		this.status = 'paused';
	}

	async resume() {
		this.status = 'loading';
		await this.#audioContext?.resume();
		this.status = 'playing';
	}

	toggle() {
		if (this.status === 'playing') this.pause();
		else void this.resume();
	}

	async next() {}

	async previous() {}

	async onRecite(handler: (previous: Ayah | null, next: Ayah | null) => void) {
		this.#onReciteHandlers.push(handler);
		return () => {
			this.#onReciteHandlers.filter((h) => h != handler);
		};
	}
	stop() {}
}
