import cors from 'cors';
import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

export default function() {
	const router = Router()
		.use(cors({
			methods: 'GET,POST',
			origin: process.env.VITE_FRONTEND_URL,
		}));

	router.use('/downloads', createProxyMiddleware({
		target: 'https://storedownloads.kobo.com',
		changeOrigin: true,
	}));

	router.use('/store', createProxyMiddleware({
		target: 'https://storeapi.kobo.com',
		changeOrigin: true,
	}));

	return router;
}
