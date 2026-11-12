<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import '@fontsource/amiri-quran/arabic-400.css';
	import '../app.css';
	import { asset, resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';
	import SurahsMenu from '#lib/components/SurahsMenu.svelte';
	import { player } from '#lib/quran/data.js';
	import { goto } from '$app/navigation';
	import { Menu, Pause, Play, SkipBack, SkipForward, Square } from '@lucide/svelte';
	import AyahMenu from '#lib/components/AyahMenu.svelte';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="manifest" href={asset('/manifest.webmanifest')} />
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
	<SurahsMenu></SurahsMenu>
</div>

<main>
	{@render children()}
</main>

<AyahMenu></AyahMenu>

<aside aria-label="Audio player">
	<div class="player">
		<div></div>
		<div class="player-controls">
			<button class="btn icon" onclick={() => player.previous()} aria-label="Previous verse">
				<SkipBack />
			</button>
			<button
				class="btn icon primary"
				onclick={() => player.toggle()}
				aria-label={player.status === 'playing' ? 'Pause' : 'Play'}
				disabled={player.status === 'loading'}
			>
				{#if player.status == 'playing'}
					<Pause />
				{:else}
					<Play />
				{/if}
			</button>
			<button class="btn icon" onclick={() => player.next()} aria-label="Next verse">
				<SkipForward />
			</button>
		</div>
		<div>
			<button class="btn icon" onclick={() => player.stop()} aria-label="Stop">
				<Square />
			</button>
		</div>
	</div>
	{#if player.error}
		<p class="player-error" role="alert">{player.error}</p>
	{/if}
</aside>

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
		font-weight: 600;
		color: var(--text);
		line-height: 0;
		margin-bottom: 0.3rem;
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
		margin: 0 auto;
		height: 100dvh;
		padding: 1rem 0.2rem;
		padding-top: 3.25rem;
		overflow-y: hidden;
	}

	.player {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: 0.4rem;
		background: var(--surface);
		border-top: 1px solid var(--border);
		box-shadow: 0 -4px 16px rgb(0 0 0 / 0.06);
		padding: 1rem 0;
	}

	.player-controls {
		display: flex;
		gap: 1rem;
	}

	.player-error {
		width: 100%;
		margin: 0;
		color: #b3261e;
		font-size: 0.9rem;
		position: fixed;
		bottom: 0;
	}

	.muted {
		color: var(--muted);
		font-size: 0.9rem;
	}
</style>
