import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { initSentry, flushSentry } from './observability/sentry.js';
import { SentryExceptionFilter } from './observability/sentry.exception-filter.js';

function assertProdEnv(): void {
  if (process.env.NODE_ENV !== 'production') return;
  const required = ['JWT_ACCESS_SECRET', 'XENDIT_CALLBACK_TOKEN', 'DATABASE_URL'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`[api] refusing to boot in production: missing required env: ${missing.join(', ')}`);
  }
}

async function bootstrap(): Promise<void> {
  assertProdEnv();
  await initSentry();

  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  app.enableShutdownHooks();
  app.useGlobalFilters(new SentryExceptionFilter());

  // URI versioning so controllers declared with `version: '1'` mount under
  // /v1/* (e.g. AccountController @Controller({ path: 'me', version: '1' })
  // serves /v1/me). Controllers without a version stay at their flat path.
  app.enableVersioning({ type: VersioningType.URI });

  // Alpha-launch request logger — emit method+path+status+ms to stdout so
  // VPS docker logs surface tester traffic for debugging. Skip /healthz to
  // keep logs readable. Disable post-alpha by setting LOG_REQUESTS=0.
  if (process.env.LOG_REQUESTS !== '0') {
    app.use((req: { method: string; url: string }, res: { statusCode: number; on: (e: string, cb: () => void) => void }, next: () => void) => {
      const start = Date.now();
      const url = req.url;
      if (url === '/healthz' || url === '/health') return next();
      res.on('finish', () => {
        const ms = Date.now() - start;
        // eslint-disable-next-line no-console
        console.log(`[req] ${req.method} ${url} ${res.statusCode} ${ms}ms`);
      });
      next();
    });
  }

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[api] listening on :${port}`);

  const shutdown = async (signal: string): Promise<void> => {
    // eslint-disable-next-line no-console
    console.log(`[api] received ${signal}, flushing telemetry`);
    await flushSentry();
    await app.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

void bootstrap();
