import express, { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

export default function() {
	const router = Router();

	router.use(express.static(`${__dirname}/frontend`));

	router.use('/kobo', createProxyMiddleware({
		target: process.env.VITE_KOBO_URL,
		changeOrigin: true,
	}));

	return router;
}