import { asset } from '$app/paths';
import type { SurahIndex } from './types';

let surahsIndex: Promise<SurahIndex[]> | null = null;

export function loadSurahs(fetcher: typeof fetch = fetch): Promise<SurahIndex[]> {
	surahsIndex ??= fetcher(asset('data/surah.json'))
		.then((res) => {
			if (!res.ok) throw new Error(`Failed to load Surah data (${res.status})`);
			return res.json() as Promise<SurahIndex[]>;
		})
		.catch((error) => {
			surahsIndex = null;
			throw error;
		});
	return surahsIndex;
}
