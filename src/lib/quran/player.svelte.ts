import { browser } from '$app/env';
import { settings } from '#lib/stores/settings.svelte.js';
import { getVerseAudioSource, verseAudioUrl } from './audio';
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
	#cancelScheduleTimeout: () => void = () => {};
	#state: number = 0;
	#schedulePromise: Promise<void> = new Promise((resolve, reject) => resolve());

	constructor(quranIndexKeeper: QuranIndexKeeper) {
		this.#quranIndexKeeper = quranIndexKeeper;
		if (browser) {
			this.#audioContext = new AudioContext();
		}
	}

	async play(ayah: Ayah) {
		if (!this.#audioContext) return;
		await this.stop();
		this.#startAyah = ayah;
		this.currentAyah = ayah;
		this.#ayahToSchedule = ayah;

		this.status = 'loading';
		this.error = null;
		this.#scheduledEndTime = 0;

		this.notifyOnRecite(null, this.currentAyah);
		this.playLoop(this.#state);

		await this.#audioContext.resume();
		this.status = 'playing';
	}

	private notifyOnRecite(currentAyah: Ayah | null, nextAyah: Ayah | null) {
		for (const handler of this.#onReciteHandlers) {
			handler(currentAyah, nextAyah);
		}
	}

	private async schedule(state: number) {
		if (!this.#audioContext || !this.#ayahToSchedule) return;
		const data = await getVerseAudioSource(verseAudioUrl(settings.reciter, this.#ayahToSchedule));
		const source = this.#audioContext.createBufferSource();
		source.buffer = await this.#audioContext.decodeAudioData(data.arrayBuffer);
		source.onended = () => this.onVerseEnd();
		source.connect(this.#audioContext.destination);
		const startTime = Math.max(this.#audioContext.currentTime, this.#scheduledEndTime);
		source.start(startTime);
		if (state == this.#state) {
			this.#sources.push(source);
			this.#scheduledEndTime = startTime + source.buffer.duration - 0.08;
			this.#ayahToSchedule = this.#quranIndexKeeper.next(this.#ayahToSchedule);
			this.#ayahBufferCount += 1;
		}
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

	private async playLoop(state: number) {
		const timeoutId = setTimeout(async () => {
			if (this.#ayahBufferCount < 5 && state == this.#state) {
                this.#schedulePromise = this.schedule(state);
                await this.#schedulePromise;
			}
			this.playLoop(state);
		}, 500);
		this.#cancelScheduleTimeout = () => clearTimeout(timeoutId);
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

	onRecite(handler: (previous: Ayah | null, next: Ayah | null) => void): () => void {
		this.#onReciteHandlers.push(handler);
		return () => {
			this.#onReciteHandlers = this.#onReciteHandlers.filter((h) => h !== handler);
		};
	}
	async stop() {
		this.#state += 1;
        await this.#schedulePromise;
		this.#cancelScheduleTimeout();
		for (const source of this.#sources) {
			source.onended = null;
			try {
				source.stop();
			} catch {
				// Ignore if source hasn't started or already stopped
			}
		}
		this.notifyOnRecite(this.currentAyah, null);
		this.#sources = [];
		this.#ayahBufferCount = 0;
		this.#scheduledEndTime = 0;
		this.#startAyah = null;
		this.currentAyah = null;
		this.#ayahToSchedule = null;
        this.status = 'idle';
	}
}
