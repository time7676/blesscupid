import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { initSentry, flushSentry } from './observability/sentry.js';
import { SentryExceptionFilter } from './observability/sentry.exception-filter.js';

async function bootstrap(): Promise<void> {
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
