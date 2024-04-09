import { defineConfig, mergeConfig } from 'vite';
import coreConfig from './vite.config';

export default defineConfig((env) =>  mergeConfig(
	coreConfig(env),
	defineConfig({
		server: { watch: null },
	})
));
