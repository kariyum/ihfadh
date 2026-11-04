export type Surah = {
	number: number;
	name: string;
	arabicName: string;
	meaning: string;
	revelation: 'makkah' | 'madinah';
	verses: string[];
};

export type ReciterId = 'sudais' | 'ali-jaber';

export type Reciter = {
	id: ReciterId;
	name: string;
	folder: string;
};

export type SurahIndex = {
	number: number;
	nameArabic: string;
    ayahCount: number;
    juzNumber: number;
    pageNumber: number
};

export type Ayah = {
    surahIndex: number;
    index: number;
}
