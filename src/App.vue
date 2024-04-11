<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { VueQueryDevtools } from '@tanstack/vue-query-devtools';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import audiobooksList from './components/audiobooks-list.vue';
import booksList from './components/books-list.vue';
import credentialsForm from './components/credentials-form.vue';
import { usePreferredColorScheme } from './composables/use-preferred-color-scheme';
import { useKobo } from './stores/use-kobo';

const koboStore = useKobo();
const { authenticating, authenticated } = storeToRefs(koboStore);
const activeTab = ref<'audiobooks' | 'books'>('audiobooks');

const colorScheme = usePreferredColorScheme();
</script>
<template>
<header :class="`navbar navbar-expand-lg sticky-top bg-${colorScheme}-subtle`">
	<div class="container">
		<div class="navbar-brand">
			Kobo Downloader
			<a href="https://github.com/PrimalZed/kobo-book-downloader-vue" target="_blank">
				<font-awesome-icon :icon="['fab', 'github']" />
			</a>
		</div>
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
						<font-awesome-icon :icon="['fas', 'headphones']" />
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
						<font-awesome-icon :icon="['fas', 'book']" />
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
