<script lang="ts">
	import QuranPage from '#lib/components/QuranPage.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount, untrack } from 'svelte';

	async function fetchQuranPage(page: number) {
		const pageNumber = (page + 1).toString().padStart(3, '0');
		const res = await fetch(`/hafs-svg/svg/${pageNumber}.svg`);

		if (!res.ok) {
			console.error(`SVG icon "${pageNumber}" not found`);
		}

		let svgContent = await res.text();
		svgContent = svgContent.replace(/fill="[^"]*"/g, 'fill="currentColor"'); // TODO pre-process them instead

		return svgContent;
	}

	let pageNumber = $derived.by(() => {
		const pageParam = page.url.searchParams.get('page') ?? '0';
		const pageNumber = Number(pageParam);
		if (isNaN(pageNumber)) {
			return 0;
		}
		return pageNumber - 1;
	});

	$effect(() => {
		let pageIndex = pageNumber;
		untrack(() => {
			if (pageIndex != pageIndexInView) {
				pageElements[pageIndex]?.scrollIntoView({ behavior: 'instant' });
			}
		});
	});

	const PAGE_COUNT = 604;
	let pages: string[] = $state(new Array(PAGE_COUNT));
	let pageElements: HTMLDivElement[] = $state([]);
	let pageIndexInView: number = $state(untrack(() => pageNumber));

	let containerElement: HTMLDivElement;

	function onScollIntoView(index: number) {
		return (node: HTMLElement) => {
			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting) {
							pageIndexInView = index;
						}
					});
				},
				{
					root: containerElement,
					threshold: 0.6
				}
			);

			observer.observe(node);

			return () => {
				observer.disconnect();
			};
		};
	}

	onMount(async () => {
		if (pageNumber < 0) {
			await goto(resolve('/quran?page=1'), { persistState: true });
		}
		if (pageNumber > PAGE_COUNT) {
			await goto(resolve(`/quran?page=${PAGE_COUNT}`), { persistState: true });
		}
		pageElements[pageNumber]?.scrollIntoView({ behavior: 'instant' });
	});

	$effect(() => {
		let index = pageIndexInView;
		goto(resolve(`/quran?page=${index + 1}`), { persistState: true });
		untrack(() => {
			fetchAround(index);
		});
	});

	async function fetchAround(pageIndex: number) {
		fetchAndAssignPage(pageIndex);
		fetchAhead(pageIndex);
		return;
	}

	function fetchAndAssignPage(pageIndex: number) {
		if (
			0 <= pageIndex &&
			pageIndex < PAGE_COUNT &&
			(!pages[pageIndex] || pages[pageIndex].length == 0)
		) {
			fetchQuranPage(pageIndex).then((value) => {
				pages[pageIndex] = value;
			});
		}
	}

	async function fetchAhead(pageIndex: number) {
		for (const i of [1, 2]) {
			fetchAndAssignPage(pageIndex + i);
			fetchAndAssignPage(pageIndex - i);
		}

		clearOutside(pageIndex);
	}

	async function clearOutside(pageIndex: number) {
		if (0 <= pageIndex - 3) {
			pages[pageIndex - 3] = '';
		}

		if (pageIndex + 3 < PAGE_COUNT) {
			pages[pageIndex + 3] = '';
		}
	}
</script>

<div class="container" bind:this={containerElement}>
	{#each pages as svgContent, index (index)}
		<div class="page" {@attach onScollIntoView(index)} bind:this={pageElements[index]}>
			{#if svgContent && svgContent.length}
				<QuranPage {svgContent} applyResizing={index == 0 || index == 1}></QuranPage>
			{/if}
		</div>
	{/each}
</div>

<style>
	.container {
		display: flex;
		gap: 1rem;
		flex-direction: row-reverse;
		overflow-x: auto;
		overflow-y: hidden;
		height: 100%;
		width: 100%;

		scroll-snap-type: x mandatory;
		scroll-behavior: smooth;

		&::-webkit-scrollbar {
			display: none;
		}
	}

	.page {
		display: block;
		min-width: 100%;
		scroll-snap-align: center;
		scroll-snap-stop: always;
	}
</style>
