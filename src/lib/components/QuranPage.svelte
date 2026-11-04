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
	import type { Player } from '#lib/quran/player.svelte.ts';
	import { onMount } from 'svelte';

	let {
		svgContent,
		applyResizing,
		player
	}: { svgContent: string; applyResizing: boolean; player: Player } = $props();

	let container: HTMLDivElement;
	onMount(() => {
		if (!svgContent || !container) return;
		const svgElement = container.querySelector('svg');
		if (!svgElement) return;
		if (applyResizing) resizeSVG(svgElement);

		const pathElements = svgElement.querySelectorAll<SVGPathElement>('.ayahPolygon');
		const parsedPathElements = Array.from(pathElements).map(parseSVGPathElement);
		for (const { surah, ayah, el } of parsedPathElements) {
		    // instead of onNext we can store the elements in a hashmap keyed by ayah index
			// and highlight, dim ayah on next 
			player.onNext((currentAyahIndex) => {
				const isPressed =
					currentAyahIndex &&
					surah == currentAyahIndex.surahIndex &&
					currentAyahIndex.index == ayah;
				console.log(
					`isPressed ${isPressed} ${currentAyahIndex?.index} ${currentAyahIndex?.surahIndex}`
				);
				el.setAttribute('aria-pressed', isPressed ? 'true' : 'false');
			});
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
