import express from 'express';
import vhost from 'vhost';
import crypto from './crypto';
import proxy from './proxy';

const cryptoApp = express()
  .use(crypto());
const proxyApp = express()
  .use(proxy());

const app = express()
  .use(vhost(process.env.VITE_CRYPTO_HOST!, cryptoApp))
  .use(vhost(process.env.VITE_KOBO_HOST!, proxyApp));

const port = process.env.VITE_BACKEND_PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Server is Fire at http://${process.env.VITE_CRYPTO_HOST}:${port} & http://${process.env.VITE_KOBO_HOST}:${port}`);
});

import.meta.hot?.on('vite:beforeFullReload', () => server.close());
