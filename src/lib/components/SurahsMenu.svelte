<script lang="ts">
	import { surahs } from '#lib/quran/data.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let query = $state('');

	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return surahs;
		return surahs.filter((s) => String(s.number) === q || s.nameArabic.includes(query.trim()));
	});
</script>

<div class="container">
	<input
		class="search"
		type="search"
		placeholder="Search by name, meaning or number"
		bind:value={query}
		aria-label="Search surahs"
	/>
	<ol class="surah-list">
		{#each filtered as surah (surah.number)}
			<li>
				<a
					style="direction:rtl;"
					href={resolve(`/quran?page=${surah.pageNumber}`)}
					onclick={(e) => {
						e.preventDefault();
						goto(resolve(`/quran?page=${surah.pageNumber}`));
					}}
				>
					<span class="arabic name-ar">{surah.nameArabic}</span>
				</a>
			</li>
		{:else}
			<li class="muted empty">No surah matches "{query}".</li>
		{/each}
	</ol>
</div>

<style>
    .container {
        position: absolute;
        display: grid;
        grid-template-rows: auto 1fr;
        width: 100%;
        max-height: 100dvh;
        overflow: scroll;
        z-index: 2;
        height: 100%;
        background-color: var(--border);
        background: var(--surface);
    }

	.search {
		width: 100%;
		padding: 0.7rem 1rem;
		border: 1px solid var(--border);
		border-width: 0 0 1px 0px;
		background: var(--surface);
		outline: none;
		direction: rtl;
	}

	.surah-list {
		list-style: none;
		margin: 0;
		padding: 0;
		gap: 1px;
		overflow: scroll;
	}

	.surah-list a {
		display: flex;
		align-items: center;
		padding: 0.8rem 1rem;
		background: var(--surface);
		/*border: 1px solid var(--border);*/
		border: none;
		text-decoration: none;
		color: var(--text);
	}

	.surah-list a:hover {
		border-color: var(--accent);
	}

	.number {
		display: grid;
		place-items: center;
		width: 2.2rem;
		height: 2.2rem;
		border-radius: 50%;
		background: var(--accent-soft);
		color: var(--accent);
		font-weight: 600;
		font-size: 0.9rem;
		flex-shrink: 0;
	}

	.names {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}

	.name-ar {
		font-size: 1.4rem;
		color: var(--gold);
		direction: rtl;
	}

	.muted {
		color: var(--muted);
		font-size: 0.85rem;
	}

	.empty {
		padding: 1rem;
	}
</style>
