import './assets/main.scss';

import { library } from '@fortawesome/fontawesome-svg-core'
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faCopy, faPaste } from '@fortawesome/free-regular-svg-icons';
import { faBook, faHeadphones } from '@fortawesome/free-solid-svg-icons';
import { VueQueryPlugin } from '@tanstack/vue-query';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';

library.add([
	faBook,
	faCopy,
	faGithub,
	faHeadphones,
	faPaste,
]);

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
