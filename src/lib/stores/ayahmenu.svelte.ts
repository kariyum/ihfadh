import type { Ayah } from "#lib/quran/types.ts";

class AyahMenuState {
	#onHideSubs: (() => void)[] = [];

    selectedAyah: Ayah | null = $state(null);
	pos_x = $state(0);
	pos_y = $state(0);
	shown = $state(false);

	showAt(x: number, y: number) {
		this.pos_x = x;
		this.pos_y = y;
		this.shown = true;
	}

	hide() {
		this.shown = false;

		for (const h of this.#onHideSubs) {
			h();
		}
	}

	onHide(handler: () => void): () => void {
        this.#onHideSubs.push(handler);
		return () => this.#onHideSubs = this.#onHideSubs.filter(x => x !== handler)
    }

    select(ayah: Ayah) {
        this.selectedAyah = ayah;
    }
}

export const ayahMenuState = new AyahMenuState();

window.addEventListener('pointerdown', (e) => {
    if (e.target instanceof Element && e.target.closest('[data-ayah-menu]')) return;
	if (ayahMenuState.shown) ayahMenuState.hide();
});
