export function toArabicNumeral(n: number) {
	return n.toLocaleString('ar-EG');
}

export function revelationLabel(place: 'makkah' | 'madinah') {
	return place === 'makkah' ? 'Meccan' : 'Medinan';
}
