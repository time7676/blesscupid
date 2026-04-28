/**
 * BLE-10 — entrypoint for the nightly hard-delete worker.
 *
 * Bootstraps a NestJS standalone application context (no HTTP listener),
 * runs `HardDeleteWorker.runOnce`, prints the per-user purge report, and
 * exits. Schedule from cron / Fly.io machines / GitHub Actions on a daily
 * cadence.
 *
 * Usage: `node dist/scripts/run-hard-delete-worker.js`
 *        `pnpm --filter @blesscupid/api exec tsx src/scripts/run-hard-delete-worker.ts`
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { HardDeleteWorker } from '../account/hard-delete.worker.js';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: false,
  });
  try {
    const worker = app.get(HardDeleteWorker);
    const reports = await worker.runOnce();
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ ok: true, purged: reports.length, reports }, null, 2));
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[hard-delete-worker] failed:', err);
  process.exit(1);
});
