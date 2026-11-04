import { loadSurahs } from '#lib/quran/data.js';
import { Player } from '#lib/quran/player.svelte.ts';
import { QuranIndexKeeper } from '#lib/quran/quran.ts';
import type { LayoutLoad } from './$types';

export const ssr = false;

export const load: LayoutLoad = async ({ fetch }) => {
	const surahs = await loadSurahs(fetch);
	const quranIndexKeeper = new QuranIndexKeeper(surahs);
	return {
		surahs,
		quranIndexKeeper,
		player: new Player(quranIndexKeeper)
	};
};
