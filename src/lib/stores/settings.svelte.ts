import { browser } from '$app/env';
import { getReciter } from '#lib/quran/reciters.js';
import type { ReciterId } from '#lib/quran/types.js';

const STORAGE_KEY = 'ayah-settings';

type StoredSettings = {
	reciterId: ReciterId;
	autoContinue: boolean;
	loopDelay: number; // seconds between replays
};

const defaults: StoredSettings = {
	reciterId: 'sudais',
	autoContinue: true,
	loopDelay: 0
};

function load(): StoredSettings {
	if (!browser) return defaults;
	try {
		return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') };
	} catch {
		return defaults;
	}
}

class Settings {
	#state = $state(load());

	get reciterId() {
		return this.#state.reciterId;
	}

	get reciter() {
		return getReciter(this.#state.reciterId);
	}

	get autoContinue() {
		return this.#state.autoContinue;
	}

	get loopDelay() {
		return this.#state.loopDelay;
	}

	setLoopDelay(seconds: number) {
		this.#state.loopDelay = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
		this.#save();
	}

	setReciter(id: ReciterId) {
		this.#state.reciterId = id;
		this.#save();
	}

	setAutoContinue(value: boolean) {
		this.#state.autoContinue = value;
		this.#save();
	}

	#save() {
		if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(this.#state));
	}
}

export const settings = new Settings();
