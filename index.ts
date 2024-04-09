import 'dotenv/config';
import express from 'express';
import vhost from 'vhost';
import crypto from './server/crypto';
import kbd from './server/kbd';
import proxy from './server/proxy';

const cryptoApp = express()
  .use(crypto());
const kbdApp = express()
  .use(kbd());
const proxyApp = express()
  .use(proxy());

const app = express()
  .use(vhost(process.env.VITE_CRYPTO_HOST!, cryptoApp))
	.use(vhost(process.env.VITE_FRONTEND_HOST!, kbdApp))
  .use(vhost(process.env.VITE_KOBO_HOST!, proxyApp));

const port = process.env.VITE_BACKEND_PORT || 80;
app.listen(port, () => {
  console.log(`Started at ${process.env.VITE_FRONTEND_URL}`);
});
