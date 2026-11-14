import { createServer } from 'node:http';
import { Readable } from 'node:stream';

import announcements from '../api/announcements.js';
import departments from '../api/departments.js';

interface Endpoint {
  fetch(request: Request): Promise<Response>;
}

// Mirrors the files in api/, which Vercel routes by name. Running the
// handlers directly keeps local development free of the Vercel CLI and of
// an account.
const routes: Record<string, Endpoint> = {
  '/api/departments': departments,
  '/api/announcements': announcements,
};

const port = Number(process.env.PORT ?? 3000);

const server = createServer((incoming, outgoing) => {
  void (async () => {
    const url = new URL(incoming.url ?? '/', `http://${incoming.headers.host ?? 'localhost'}`);
    const endpoint = routes[url.pathname];
    if (!endpoint) {
      outgoing.writeHead(404, { 'Content-Type': 'application/json' });
      outgoing.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    const hasBody = incoming.method !== 'GET' && incoming.method !== 'HEAD';
    const request = new Request(url, {
      method: incoming.method,
      headers: new Headers(incoming.headers as Record<string, string>),
      body: hasBody ? (Readable.toWeb(incoming) as ReadableStream) : undefined,
      // Node needs this to accept a streamed request body.
      ...(hasBody ? { duplex: 'half' } : {}),
    });

    const response = await endpoint.fetch(request);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
    console.log(`${incoming.method} ${url.pathname}${url.search} ${response.status}`);
  })();
});

// Listening on every interface lets a phone on the same network reach it.
server.listen(port, '0.0.0.0', () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
