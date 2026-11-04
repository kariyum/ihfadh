import type { Ayah, SurahIndex } from './types';

export class QuranIndexKeeper {
	#surahCount: number;
	#ayahCounts: number[];

	constructor(surahIndexes: SurahIndex[]) {
		this.#surahCount = surahIndexes.length;
		this.#ayahCounts = surahIndexes
			.toSorted((a, b) => a.number - b.number)
			.map((surahIndex) => surahIndex.ayahCount);
	}

	next(ayahIndex: Ayah): Ayah | null {
		const atEndOfSurah = ayahIndex.index == this.#ayahCounts[ayahIndex.index];
		if (!atEndOfSurah) {
			return {
				index: ayahIndex.index + 1,
				surahIndex: ayahIndex.surahIndex
			};
		} else if (ayahIndex.surahIndex < this.#surahCount) {
			return {
				index: 1,
				surahIndex: ayahIndex.surahIndex + 1
			};
		}
		return null;
	}

	previous(ayahIndex: Ayah): Ayah | null {
		const atStartOfSurah = ayahIndex.index == 1;
		if (!atStartOfSurah) {
			return {
				index: ayahIndex.index - 1,
				surahIndex: ayahIndex.surahIndex
			};
		} else if (ayahIndex.surahIndex > 1) {
			const previousSurah = ayahIndex.surahIndex - 1;
			return {
				index: this.#ayahCounts[previousSurah],
				surahIndex: previousSurah
			};
		}
		return null;
	}
}
