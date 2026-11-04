<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import '@fontsource/amiri-quran/arabic-400.css';
	import '../app.css';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';
	import SurahsMenu from '#lib/components/SurahsMenu.svelte';
	import { goto } from '$app/navigation';
	import { Menu } from '@lucide/svelte';

	let { data, children }: LayoutProps = $props();

	let player = $derived(data.player);

	const nowPlaying = $derived(
		player.currentAyah === null ? null : data.surahs[player.currentAyah.surahIndex - 1]
	);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="manifest" href="/manifest.webmanifest" />
	<meta name="theme-color" content="#1d5c48" />
</svelte:head>

<header class="topbar">
	<div class="brand">
		<span class="arabic">القرآن</span>
	</div>
	<nav>
		<a
			href={resolve('/settings')}
			aria-current={page.url.pathname === '/settings' ? 'page' : undefined}>Settings</a
		>
		<button
			class="menu-btn"
			onclick={() => {
				goto('', {
					state: { showSurahPicker: true },
					shallow: true
				});
			}}><Menu size="24" /></button
		>
	</nav>
</header>

<div class="surah-menu" style:--show={page.state.showSurahPicker ? 'block' : 'none'}>
	<SurahsMenu surahs={data.surahs}></SurahsMenu>
</div>

<main>
	{@render children()}
</main>

<aside class="player" aria-label="Audio player">
	<!-- <a class="player-info" href={resolve('/surah/[number]', { number: String(nowPlaying.number) })}>
		<strong>{nowPlaying.name}</strong>
		<span class="muted">Verse {player.verse} of {nowPlaying.verses.length}</span>
	</a> -->
	<div class="player-controls">
		<button class="btn icon" onclick={() => player.previous()} aria-label="Previous verse">⏮</button
		>
		<button
			class="btn icon primary"
			onclick={() => player.toggle()}
			aria-label={player.status === 'playing' ? 'Pause' : 'Play'}
			disabled={player.status === 'loading'}
		>
			{player.status === 'playing' ? '⏸' : '▶'}
		</button>
		<button class="btn icon" onclick={() => player.next()} aria-label="Next verse">⏭</button>
		<button class="btn icon" onclick={() => player.stop()} aria-label="Stop">⏹</button>
	</div>
	{#if player.error}
		<p class="player-error" role="alert">{player.error}</p>
	{/if}
</aside>
{#if nowPlaying}

{/if}

<style>
	.surah-menu {
		--show: 'none';
		display: var(--show);
	}
	.menu-btn {
		border: unset;
		background-color: unset;
		margin: unset;
		line-height: 0;
	}
	.topbar {
		position: absolute;
		width: 100%;
		top: 0;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1.25rem;
		background: var(--surface);
		border-bottom: 1px solid var(--border);
	}

	.brand {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		font-weight: 600;
		color: var(--text);
		text-decoration: none;
	}

	.brand .arabic {
		font-size: 1.4rem;
		color: var(--gold);
	}

	nav {
		display: flex;
		gap: 1rem;
	}

	nav a {
		text-decoration: none;
		color: var(--muted);
	}

	nav a[aria-current='page'] {
		color: var(--accent);
		font-weight: 600;
	}

	main {
		max-width: 760px;
		margin: 0 auto;
		height: 100dvh;
		padding: 1.25rem 0.2rem;
		padding-top: 4rem;
		overflow-y: hidden;
	}

	.player {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.75rem 1.25rem;
		background: var(--surface);
		border-top: 1px solid var(--border);
		box-shadow: 0 -4px 16px rgb(0 0 0 / 0.06);
	}

	.player-info {
		display: flex;
		flex-direction: column;
		text-decoration: none;
		color: var(--text);
	}

	.player-controls {
		display: flex;
		gap: 0.4rem;
	}

	.player-error {
		width: 100%;
		margin: 0;
		color: #b3261e;
		font-size: 0.9rem;
	}

	.muted {
		color: var(--muted);
		font-size: 0.9rem;
	}
</style>
