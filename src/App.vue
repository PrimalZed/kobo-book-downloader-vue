<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useKobo } from './stores/use-kobo';
import audiobooksList from './components/audiobooks-list.vue';
import booksList from './components/books-list.vue';
import credentialsForm from './components/credentials-form.vue';
import { usePreferredColorScheme } from './composables/use-preferred-color-scheme';

const koboStore = useKobo();
const { authenticating, authenticated } = storeToRefs(koboStore);
const activeTab = ref<'audiobooks' | 'books'>('audiobooks');

const colorScheme = usePreferredColorScheme();
</script>
<template>
<header :class="`navbar navbar-expand-lg sticky-top bg-${colorScheme}-subtle`">
	<div class="container">
		<div class="navbar-brand">Kobo Downloader</div>
		<template v-if="!authenticated && !authenticating">
			<div class="absolute-center">Sign In</div>
		</template>
		<template v-else-if="authenticating">
			<div class="absolute-center">Authenticating...</div>
		</template>
		<template v-else>
			<div class="navbar-nav flex-row absolute-center">
				<div class="nav-item">
					<button
						type="button"
						class="nav-link"
						:class="{ active: activeTab === 'audiobooks' }"
						@click="activeTab = 'audiobooks'"
					>
						Audiobooks
					</button>
				</div>
				<div class="nav-item">
					<button
						type="button"
						class="nav-link"
						:class="{ active: activeTab === 'books' }"
						@click="activeTab = 'books'"
					>
						Books
					</button>
				</div>
			</div>
			<button type="button" class="btn btn-seconary" :disabled="koboStore.signingOut" @click="koboStore.signOut()">Sign Out</button>
		</template>
	</div>
</header>
<main class="container">
	<credentials-form v-if="!authenticating && !authenticated" />
	<template v-else-if="authenticated">
		<audiobooks-list v-if="activeTab === 'audiobooks'" />
		<books-list v-else-if="activeTab === 'books'" />
	</template>
	<VueQueryDevtools />
</main>
</template>

<style lang="scss" scoped>
.absolute-center {
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
}
</style>
