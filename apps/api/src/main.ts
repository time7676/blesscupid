import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
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
