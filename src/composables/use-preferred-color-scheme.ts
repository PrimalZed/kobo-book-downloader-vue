import { readonly, ref, watch, type Ref } from 'vue';

export function usePreferredColorScheme(): Ref<'dark' | 'light'> {
	const scheme = ref<'dark' | 'light'>(
		window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
	);

	watch(scheme, (newScheme) => {
		document.documentElement.setAttribute('data-bs-theme', newScheme);
	}, { immediate: true });
	return readonly(scheme);
}
