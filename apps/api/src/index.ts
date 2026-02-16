import { createServer } from 'node:net';

import { serve } from '@hono/node-server';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { createContext } from './trpc/context';
import { appRouter } from './trpc/router';
import { stripeWebhook } from './webhooks/stripe';

const app = new Hono();

const logInfo = (message: string): void => {
  process.stdout.write(`${message}\n`);
};

const logWarn = (message: string): void => {
  process.stderr.write(`${message}\n`);
};

const logError = (message: string): void => {
  process.stderr.write(`${message}\n`);
};

app.use(
  '*',
  cors({
    origin: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    allowHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-role'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
  }),
);

app.onError((error, c) => {
  logError(`[api:error] ${error.message}`);
  return c.json(
    {
      error: 'Internal server error',
    },
    500,
  );
});

app.get('/health', (c) =>
  c.json({ ok: true, service: 'api', timestamp: new Date().toISOString() }),
);

app.route('/webhooks', stripeWebhook);

app.all('/trpc/*', async (c) =>
  fetchRequestHandler({
    endpoint: '/trpc',
    req: c.req.raw,
    router: appRouter,
    createContext,
  }),
);

const canListenOnPort = async (port: number): Promise<boolean> =>
  new Promise((resolve) => {
    const tester = createServer();
    tester.once('error', () => {
      resolve(false);
    });
    tester.once('listening', () => {
      tester.close(() => {
        resolve(true);
      });
    });
    tester.listen(port, '::');
  });

const getFallbackPort = async (): Promise<number> =>
  new Promise((resolve, reject) => {
    const tester = createServer();
    tester.once('error', reject);
    tester.listen(0, '::', () => {
      const address = tester.address();
      if (!address || typeof address === 'string') {
        tester.close(() => {
          resolve(3001);
        });
        return;
      }

      tester.close(() => {
        resolve(address.port);
      });
    });
  });

const resolvePort = async (): Promise<number> => {
  const preferredPort = Number(process.env.API_PORT ?? process.env.PORT ?? 3001);
  if (Number.isNaN(preferredPort) || preferredPort < 1 || preferredPort > 65_535) {
    return 3001;
  }

  if (await canListenOnPort(preferredPort)) {
    return preferredPort;
  }

  return getFallbackPort();
};

const start = async (): Promise<void> => {
  const preferredPort = Number(process.env.API_PORT ?? process.env.PORT ?? 3001);
  const port = await resolvePort();

  if (port !== preferredPort) {
    logWarn(`[api] Preferred port ${preferredPort} is busy. Using ${port} instead.`);
  }

  logInfo(`API listening on http://localhost:${port}`);
  serve({
    fetch: app.fetch,
    port,
  });
};

void start();
