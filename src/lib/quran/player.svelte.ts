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
    #endAyah = $state<Ayah | null>(null);

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

	async play(ayah: Ayah, lastAyah: Ayah | null) {
		if (!this.#audioContext) return;
		await this.stop();
		this.#startAyah = ayah;
		this.currentAyah = ayah;
		this.#ayahToSchedule = ayah;
        this.#endAyah = lastAyah;

		this.status = 'loading';
		this.error = null;
		this.#scheduledEndTime = 0;

		this.notifyOnRecite(null, this.currentAyah);
        this.playLoop(this.#state);

		await this.#audioContext.resume();
		this.status = 'playing';
	}

	private sameAyah(a: Ayah | null, b: Ayah | null) {
		return !!a && !!b && a.surahIndex === b.surahIndex && a.index === b.index;
	}

	private nextInRange(ayah: Ayah): Ayah | null {
		if (this.#endAyah && this.#startAyah && this.sameAyah(ayah, this.#endAyah)) {
			return this.#startAyah;
		}
		return this.#quranIndexKeeper.next(ayah);
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
		if (state == this.#state) {
			source.onended = () => this.onVerseEnd();
			source.connect(this.#audioContext.destination);
			const startTime = Math.max(this.#audioContext.currentTime, this.#scheduledEndTime);
			source.start(startTime);
			this.#sources.push(source);
			this.#scheduledEndTime = startTime + source.buffer.duration - 0.08;
			this.#ayahToSchedule = this.nextInRange(this.#ayahToSchedule);
			this.#ayahBufferCount += 1;
			this.error = null;
		}
	}

	private onVerseEnd() {
		if (this.currentAyah) {
			const nextAyah = this.nextInRange(this.currentAyah);
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
				this.#schedulePromise = this.schedule(state).catch((error) => {
					this.error = String(error);
				});
				await this.#schedulePromise;
			}
			if (state == this.#state) this.playLoop(state);
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
		this.stopSources();
		this.notifyOnRecite(this.currentAyah, null);
		this.#sources = [];
		this.#ayahBufferCount = 0;
		this.#scheduledEndTime = 0;
		this.#startAyah = null;
		this.#endAyah = null;
		this.currentAyah = null;
		this.#ayahToSchedule = null;
		this.status = 'idle';
	}

	private stopSources() {
		for (const source of this.#sources) {
			source.onended = null;
			try {
				source.stop();
			} catch (error) {
				console.error(error);
			}
		}
	}
}
