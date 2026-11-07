import { Player } from './player.svelte.ts';
import { QuranIndexKeeper } from './quran.ts';
import surahsData from './surah.json';
import type { SurahIndex } from './types';

export const surahs: SurahIndex[] = surahsData;
export const quranIndexKeeper = new QuranIndexKeeper(surahs);
export const player = new Player(quranIndexKeeper);

