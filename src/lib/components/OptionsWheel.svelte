<script lang="ts" generics="T extends string | number">
	import { onMount } from 'svelte';

	interface Props {
		options: T[];
		selectedIndex?: number;
		format?: (option: T) => string;
		onchange?: (option: T, index: number) => void;
	}
	let {
		options,
		selectedIndex = $bindable(0),
		format = (option) => String(option),
		onchange
	}: Props = $props();
	let sections: HTMLDivElement[] = $state([]);

	onMount(() => {
		sections[selectedIndex]?.scrollIntoView({ behavior: 'instant', block: 'center' });
		let ready = false;
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;
					const index = parseInt((entry.target as HTMLElement).dataset.section ?? '0');
					if (index === selectedIndex) continue;
					selectedIndex = index;
					// ignore the initial observer callbacks fired by the programmatic scroll
					if (ready) {
						navigator.vibrate?.(15);
						onchange?.(options[index], index);
					}
				}
			},
			{ threshold: 0.5 }
		);
		sections.forEach((section) => observer.observe(section));
		const readyTimeout = setTimeout(() => (ready = true), 100);

		return () => {
			clearTimeout(readyTimeout);
			observer.disconnect();
		};
	});
</script>

<div class="container">
	<div class="sets-container">
		{#each options as opt, section (opt)}
			<div
				bind:this={sections[section]}
				data-section={section}
				data-selected={selectedIndex == section}
			>
				{format(opt)}
			</div>
		{/each}
	</div>
</div>

<style>
	.container {
		width: 100%;
		height: 3rem;
	}

	.sets-container {
		height: 3rem;
		width: 100%;
		overflow: auto;
		scroll-snap-type: y mandatory;
		text-align: center;
		font-size: var(--wheel-font-size, 2rem);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem 0;

		&::-webkit-scrollbar {
			display: none;
		}

		& > * {
			color: var(--text);
			scroll-snap-align: center;
			flex: none;
			font-weight: 500;
			font-family: monospace;
			transition: color 0.3s ease-in-out;
		}

		& > [data-selected='false'] {
			color: var(--border);
		}
	}
</style>
