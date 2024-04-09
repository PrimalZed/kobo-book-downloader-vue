import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
	return {
		plugins: [
			vue(),
		],
		resolve: {
			alias: {
				'@': fileURLToPath(new URL('./src', import.meta.url))
			}
		},
		server: {
			host: process.env.VITE_FRONTEND_HOST,
			port: Number(process.env.VITE_FRONTEND_PORT),
			proxy: {
				'/kobo': {
					target: process.env.VITE_KOBO_URL,
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/kobo/, ''),
				},
			},
		},
		build: {
			outDir: 'dist/frontend',
		},
	};
});
