<script module>
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
</script>

<script lang="ts">
	import { player } from '#lib/quran/data.js';
	import type { Ayah } from '#lib/quran/types.ts';
	import { onMount } from 'svelte';

	let {
		svgContent,
		applyResizing
	}: { svgContent: string; applyResizing: boolean } = $props();

	let container: HTMLDivElement;
	let ayahSvg: Map<string, SVGPathElement> = new Map();

	const ayahKey = (ayah: Ayah) => `${ayah.surahIndex}-${ayah.index}`;
	onMount(() => {
		if (!svgContent || !container) return;
		const svgElement = container.querySelector('svg');
		if (!svgElement) return;
		if (applyResizing) resizeSVG(svgElement);

		const pathElements = svgElement.querySelectorAll<SVGPathElement>('.ayahPolygon');
		const parsedPathElements = Array.from(pathElements).map(parseSVGPathElement);

		player.onRecite((previousAyah, nextAyah) => {
			if (previousAyah) ayahSvg.get(ayahKey(previousAyah))?.setAttribute('aria-pressed', 'false');
			if (nextAyah) ayahSvg.get(ayahKey(nextAyah))?.setAttribute('aria-pressed', 'true');
		});

		for (const { surah, ayah, el } of parsedPathElements) {
			ayahSvg.set(ayahKey({ surahIndex: surah, index: ayah }), el);
			el.addEventListener('click', () => {
				player.play({
					surahIndex: surah,
					index: ayah
				});
			});
		}
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
