<script module lang="ts">
	import type { Ayah } from '#lib/quran/types.ts';

	const parseSVGPathElement = (p: SVGPathElement) => ({
		surah: Number(p.getAttribute('surah')),
		ayah: Number(p.getAttribute('ayah')),
		el: p
	});

	function resizeSVG(svgElement: SVGSVGElement) {
		try {
			const b = svgElement.getBBox();
			if (b.width > 0 && b.height > 0) {
				const p = Math.max(b.width, b.height) * 0.04;
				svgElement.setAttribute(
					'viewBox',
					`${b.x - p} ${b.y - p} ${b.width + p * 2} ${b.height + p * 2}`
				);
			}
		} catch {
			/* keep the declared viewBox */
		}
	}

	const ayahKey = (ayah: Ayah) => `${ayah.surahIndex}-${ayah.index}`;

	function highlightAyah(ayahSvg: Map<string, SVGPathElement>, ayah: Ayah | null) {
		if (ayah) ayahSvg.get(ayahKey(ayah))?.setAttribute('aria-pressed', 'true');
	}

	function dimAyah(ayahSvg: Map<string, SVGPathElement>, ayah: Ayah | null) {
		if (ayah) ayahSvg.get(ayahKey(ayah))?.setAttribute('aria-pressed', 'false');
	}

	function addContextmenuEventListener(el: SVGPathElement, ayah: Ayah) {
		el.addEventListener('contextmenu', (event) => {
			event.preventDefault();
			ayahMenuState.showAt(event.clientX, event.clientY);
			ayahMenuState.select(ayah);
			el.setAttribute('aria-pressed', 'true');
			ayahMenuState.onHide(() => el.setAttribute('aria-pressed', 'false'));
		});
	}
</script>

<script lang="ts">
	import { player } from '#lib/quran/data.js';
	import { onMount } from 'svelte';
	import { ayahMenuState } from '#lib/stores/ayahmenu.svelte.ts';

	let { svgContent, applyResizing }: { svgContent: string; applyResizing: boolean } = $props();

	let container: HTMLDivElement;
	let ayahSvg: Map<string, SVGPathElement> = new Map();

	onMount(() => {
		if (!svgContent || !container) return;
		const svgElement = container.querySelector('svg');
		if (!svgElement) return;
		if (applyResizing) resizeSVG(svgElement);

		const pathElements = svgElement.querySelectorAll<SVGPathElement>('.ayahPolygon');
		const parsedPathElements = Array.from(pathElements).map(parseSVGPathElement);

		const unsubscribe = player.onRecite((previousAyah, nextAyah) => {
			dimAyah(ayahSvg, previousAyah);
			highlightAyah(ayahSvg, nextAyah);
		});

		for (const { surah, ayah, el } of parsedPathElements) {
			ayahSvg.set(ayahKey({ surahIndex: surah, index: ayah }), el);
			// el.addEventListener('click', () => {
			// 	player.play({
			// 		surahIndex: surah,
			// 		index: ayah
			// 	});
			// });
			addContextmenuEventListener(el, { surahIndex: surah, index: ayah });
		}

		highlightAyah(ayahSvg, player.currentAyah);

		return unsubscribe;
	});
</script>

<div class="svg" bind:this={container}>
	{@html svgContent}
</div>

<style>
	:global(.ayahPolygon) {
		cursor: pointer;
		fill: #f9f05f;
		fill-opacity: 0;
	}
	:global(.ayahPolygon[aria-pressed='true']) {
		fill-opacity: 0.15;
	}
	.svg {
		width: 100%;
		height: auto;
		scale: 1;
	}
	.svg {
		color: #fff; /* TODO refactor into .dark and .light classes for svg */
	}
</style>
