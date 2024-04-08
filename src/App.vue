<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools';
import { ref } from 'vue';
import { useKobo } from './stores/use-kobo';
import audiobooksList from './components/audiobooks-list.vue';
import booksList from './components/books-list.vue';
import credentialsForm from './components/credentials-form.vue';
import { storeToRefs } from 'pinia';

const koboStore = useKobo();
const {
	authenticated,
	audiobooks,
	books,
} = storeToRefs(koboStore);
const activeTab = ref<'audiobooks' | 'books'>('audiobooks');
</script>

<template>
<header>
  <h1>Kobo Downloader</h1>
</header>

<main>
	<credentials-form v-if="!authenticated" />
	<template v-else>
		<button type="button" :disabled="koboStore.signingOut" @click="koboStore.signOut()">Sign Out</button>
		<div>
			<button type="button" @click="activeTab = 'audiobooks'">Audiobooks</button>
			<button type="button" @click="activeTab = 'books'">Books</button>
		</div>
		<audiobooks-list v-if="activeTab === 'audiobooks'" />
		<books-list v-else-if="activeTab === 'books'" />
	</template>
	<VueQueryDevtools />
</main>
</template>
