import { prisma } from './prisma.js';
import { processJobBatch } from './job-processor.js';
import { processOutboxBatch } from './outbox-processor.js';

const POLL_INTERVAL_MS = Number(process.env.WORKER_POLL_MS ?? 3000);

async function tick() {
  const [outboxCount, jobCount] = await Promise.all([processOutboxBatch(), processJobBatch()]);
  if (outboxCount > 0 || jobCount > 0) {
    console.log(`[worker] processed outbox=${outboxCount} jobs=${jobCount}`);
  }
}

async function main() {
  console.log(`Worker started (poll=${POLL_INTERVAL_MS}ms)`);
  await prisma.$connect();

  const scheduleInventoryRelease = async () => {
    const existing = await prisma.job.findFirst({
      where: { type: 'inventory.release_expired', status: 'PENDING' },
    });
    if (!existing) {
      await prisma.job.create({
        data: {
          type: 'inventory.release_expired',
          payload: {},
          runAt: new Date(Date.now() + 60_000),
        },
      });
    }
  };

  await scheduleInventoryRelease();

  setInterval(() => {
    tick().catch((err) => console.error('[worker] tick error', err));
  }, POLL_INTERVAL_MS);

  await tick();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
