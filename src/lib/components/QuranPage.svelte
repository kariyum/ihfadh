<script module>
	const parseSVGPathElement = (p: SVGPathElement) => ({
		surah: Number(p.getAttribute('surah')),
		ayah: Number(p.getAttribute('ayah')),
		el: p
	});
	const highlight = (el: SVGPathElement) => {
		el.setAttribute('fill-opacity', '0.15');
	};
	const dim = (el: SVGPathElement) => {
		el.setAttribute('fill-opacity', '0');
	};
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

	let selectedAyah: { ayah: number; surah: number; el: SVGGeometryElement } | undefined = $state();
</script>

<script lang="ts">
	import { player } from '#lib/quran/player.svelte.ts';

	let { svgContent, applyResizing }: { svgContent: string; applyResizing: boolean } = $props();

	let container: HTMLDivElement;

	$effect(() => {
		svgContent;

		if (!container) return;
		const svgElement = container.querySelector('svg');
		if (!svgElement) return;
		if (applyResizing) resizeSVG(svgElement);

		const pathElements = svgElement.querySelectorAll<SVGPathElement>('.ayahPolygon');
		const parsedPathElements = Array.from(pathElements).map(parseSVGPathElement);
		for (const { surah, ayah, el } of parsedPathElements) {
			el.style.cursor = 'pointer';
			el.setAttribute('fill', '#F9F05F');
			el.addEventListener('click', () => {
				console.log(surah, ayah);
				player.play(surah, ayah);
				if (selectedAyah) dim(selectedAyah.el);
				selectedAyah = { surah, ayah, el };
				highlight(el);
			});
		}
	});
</script>

<div class="svg" bind:this={container}>
	{@html svgContent}
</div>

<style>
	.svg {
		width: 100%;
		height: auto;
		scale: 1;
	}
	.svg {
		color: #fff; /* TODO refactor into .dark and .light classes for svg */
	}
</style>
