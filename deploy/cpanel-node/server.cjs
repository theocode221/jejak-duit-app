/**
 * Serves the Vite production build from ./dist on cPanel (Passenger/Node).
 *
 * 1) From repo root: npm run build:cpanel
 * 2) Copy everything inside dist/ into deploy/cpanel-node/dist/
 * 3) Zip deploy/cpanel-node/ (with dist inside), upload, extract as Application root
 * 4) cPanel: Startup file = server.cjs, Run NPM Install, set BASE_PATH if path differs
 */
const express = require('express');
const path = require('path');

const BASE = (process.env.BASE_PATH || '/jejak-duit').replace(/\/+$/, '') || '';
const dist = path.join(__dirname, 'dist');
const app = express();

app.disable('x-powered-by');

if (BASE) {
  app.use(BASE, express.static(dist, { fallthrough: true }));
  app.use(BASE, (_req, res) => {
    res.sendFile(path.join(dist, 'index.html'));
  });
} else {
  app.use(express.static(dist, { fallthrough: true }));
  app.use((_req, res) => {
    res.sendFile(path.join(dist, 'index.html'));
  });
}

const port = parseInt(process.env.PORT || '3000', 10);
const host = process.env.HOST || '127.0.0.1';
app.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`Static SPA: base=${BASE || '/'} port=${port} dist=${dist}`);
});
