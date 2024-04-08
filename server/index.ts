import cors from 'cors';
import express from 'express';
import vhost from 'vhost';
import crypto from './crypto';
import proxy from './proxy';

const cryptoApp = express()
  .use(cors({
    methods: 'POST',
    origin: 'http://localhost:5173',
  }))
  .use(crypto);
const proxyApp = express()
  .use(cors({
    methods: 'GET,POST',
    origin: 'http://localhost:5173',
  }))
  .use(proxy);

const domain = 'local.gd';
const app = express()
  .use(vhost(`crypto.${domain}`, cryptoApp))
  .use(vhost(`kobo.${domain}`, proxyApp));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Server is Fire at http://localhost:${port}`);
});

import.meta.hot?.on('vite:beforeFullReload', () => server.close());
