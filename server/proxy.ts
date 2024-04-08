import { Router } from 'express';
import { createProxyMiddleware, responseInterceptor } from 'http-proxy-middleware';

const router = Router();

router.use('/auth', createProxyMiddleware({
	target: 'https://auth.kobobooks.com',
	changeOrigin: true,
	selfHandleResponse: true,
	on: {
		proxyRes: responseInterceptor(async (resBuffer, proxyRes, req, res) => {
			if (res.statusCode !== 302) {
				return resBuffer;
			}
			res.removeHeader('Location');
			res.statusCode = 200;

			return resBuffer;
		}),
	},
}));

router.use('/authorize', createProxyMiddleware({
	target: 'https://authorize.kobo.com',
	changeOrigin: true,
	selfHandleResponse: true,
	on: {
		proxyRes: responseInterceptor(async (resBuffer, proxyRes, req, res) => {
			if (res.statusCode !== 302) {
				return resBuffer;
			}

			const location = res.getHeader('Location');
			if (!location || typeof location === 'number' || Array.isArray(location)) {
				return resBuffer;
			}
			const newLocation = location.replace('https://auth.kobobooks.com', `${process.env.VITE_KOBO_URL}/auth`);
			res.setHeader('Location', newLocation);

			return resBuffer;
		}),
	},
}));

router.use('/downloads', createProxyMiddleware({
	target: 'https://storedownloads.kobo.com',
	changeOrigin: true,
}));

router.use('/store', createProxyMiddleware({
	target: 'https://storeapi.kobo.com',
	changeOrigin: true,
}));

export default router;
