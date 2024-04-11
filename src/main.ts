import './assets/main.scss';

import { VueQueryPlugin } from '@tanstack/vue-query';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';

const app = createApp(App);

app
	.use(createPinia())
	.use(VueQueryPlugin, {
		queryClientConfig: {
			defaultOptions: {
				queries: { retry: false, staleTime: Infinity, refetchOnWindowFocus: false },
			},
		},
	})
	.mount('#app');
