<script lang="ts">
	import { player } from '#lib/quran/data.ts';
	import type { Ayah } from '#lib/quran/types.ts';
	import { ayahMenuState } from '#lib/stores/ayahmenu.svelte.ts';

	let firstAyah: Ayah | null = $state(null);
	let lastAyah: Ayah | null = $state(null);

	const assignFirstAyah = () => {
		if (ayahMenuState.selectedAyah) firstAyah = ayahMenuState.selectedAyah;
		ayahMenuState.hide();
	};
	const assignLastAyahAndPlay = () => {
		if (ayahMenuState.selectedAyah) lastAyah = ayahMenuState.selectedAyah;
		if (firstAyah) player.play(firstAyah, lastAyah);
		ayahMenuState.hide();
	};
</script>

<div
	class="main"
	role="menu"
	tabindex="0"
	onpointerdown={(e) => e.stopPropagation()}
	style:--visibility={ayahMenuState.shown ? 'visible' : 'hidden'}
	style:--x={`${ayahMenuState.pos_x}px`}
	style:--y={`${ayahMenuState.pos_y}px`}
>
	<menu class="menu">
		<li>
			<button
				onclick={() => {
					if (ayahMenuState.selectedAyah) player.play(ayahMenuState.selectedAyah);
					ayahMenuState.hide();
				}}>Start</button
			>
		</li>
		<li>
			<button onclick={assignFirstAyah}>Mark start ayah</button>
		</li>
		<li><button onclick={assignLastAyahAndPlay}>Mark last ayah</button></li>
		<li>
			<button
				onclick={() => {
					if (ayahMenuState.selectedAyah) player.playSurah(ayahMenuState.selectedAyah.surahIndex);
					ayahMenuState.hide();
				}}>Loop recite surah</button
			>
		</li>
	</menu>
</div>

<style>
	.main {
		--x: 0px;
		--y: 0px;
		--visibility: hidden;
		position: absolute;
		top: calc(var(--y) - 100px);
		left: var(--x);
		width: max-content;
		z-index: 10;
		visibility: var(--visibility);

		transform: translate(
			min(5px, calc(100dvw - var(--x) - 100% - 5px)),
			min(5px, calc(100dvh - var(--y) - 100% - 5px))
		);
	}

	.menu {
		margin: 0;
		padding: 0;
		border: 1px solid var(--border);
		border-radius: 5px;
		overflow: clip;

		display: flex;
		flex-direction: column;
		gap: 1px;
		background-color: var(--border);
	}

	button {
		width: 100%;
		text-align: left;
		background-color: var(--surface);
		border: none;
		padding: 0.2rem 0.5rem;
	}
</style>
