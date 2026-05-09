import { createServer } from 'node:http';
import { Hono } from 'hono';
import app from './hono';

const serverApp = new Hono();

serverApp.route('/api', app);
serverApp.get('/', (c) => c.json({ status: 'ok', message: 'Properavista backend server is running' }));

const port = Number(process.env.PORT || process.env.LOCAL_API_PORT || 8787);
const host = process.env.LOCAL_API_HOST || '0.0.0.0';

const server = createServer((req, res) => {
  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || `127.0.0.1:${port}`}`);
  const bodyChunks: Buffer[] = [];

  req.on('data', (chunk) => {
    bodyChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  });

  req.on('end', async () => {
    try {
      const method = req.method || 'GET';
      const headers = new Headers();

      Object.entries(req.headers).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((entry) => headers.append(key, entry));
          return;
        }

        if (typeof value === 'string') {
          headers.set(key, value);
        }
      });

      const init: RequestInit = {
        method,
        headers,
      };

      if (!['GET', 'HEAD'].includes(method)) {
        init.body = bodyChunks.length > 0 ? Buffer.concat(bodyChunks) : undefined;
      }

      const response = await serverApp.fetch(new Request(requestUrl, init));

      res.statusCode = response.status;
      res.statusMessage = response.statusText;

      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      if (response.body) {
        const payload = Buffer.from(await response.arrayBuffer());
        res.end(payload);
        return;
      }

      res.end();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected backend failure';
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, message }));
    }
  });
});

server.listen(port, host, () => {
  console.log(`Properavista backend listening on http://${host}:${port}`);
});