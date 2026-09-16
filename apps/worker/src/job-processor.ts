import { JobStatus, Prisma } from '@prisma/client';
import { prisma } from './prisma.js';

const WORKER_ID = `worker-${process.pid}`;

export interface JobRow {
  id: string;
  type: string;
  payload: Prisma.JsonValue;
  attempts: number;
  maxAttempts: number;
}

export async function claimJobBatch(limit = 5): Promise<JobRow[]> {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<JobRow[]>`
      SELECT id, type, payload, attempts, "maxAttempts"
      FROM "Job"
      WHERE status = 'PENDING' AND "runAt" <= NOW()
      ORDER BY "runAt" ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    `;

    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.id);
    await tx.job.updateMany({
      where: { id: { in: ids } },
      data: { status: JobStatus.RUNNING, lockedAt: new Date(), lockedBy: WORKER_ID },
    });

    return rows;
  });
}

export async function handleJob(job: JobRow): Promise<void> {
  switch (job.type) {
    case 'inventory.release_expired':
      await releaseExpiredReservations();
      break;
    case 'order.close_unpaid':
      await closeUnpaidOrder(job.payload);
      break;
  }
}

async function releaseExpiredReservations(): Promise<void> {
  const expired = await prisma.inventoryReservation.findMany({
    where: { released: false, expiresAt: { lt: new Date() }, order: { paymentStatus: 'PENDING' } },
  });

  for (const r of expired) {
    await prisma.$transaction([
      prisma.inventory.update({
        where: { skuId: r.skuId },
        data: { reservedQty: { decrement: r.qty } },
      }),
      prisma.inventoryReservation.update({
        where: { id: r.id },
        data: { released: true },
      }),
    ]);
  }

  if (expired.length > 0) {
    console.log(`[job] released ${expired.length} expired reservations`);
  }
}

async function closeUnpaidOrder(payload: Prisma.JsonValue): Promise<void> {
  const orderId =
    payload && typeof payload === 'object' && !Array.isArray(payload) && 'orderId' in payload
      ? String((payload as { orderId: string }).orderId)
      : '';
  if (!orderId) return;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== 'PENDING_PAYMENT') return;
  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'CANCELLED' },
  });
  const reservations = await prisma.inventoryReservation.findMany({
    where: { orderId, released: false },
  });
  for (const reservation of reservations) {
    await prisma.$transaction([
      prisma.inventory.update({
        where: { skuId: reservation.skuId },
        data: { reservedQty: { decrement: reservation.qty } },
      }),
      prisma.inventoryReservation.update({
        where: { id: reservation.id },
        data: { released: true },
      }),
    ]);
  }
}

export async function completeJob(id: string): Promise<void> {
  await prisma.job.update({
    where: { id },
    data: { status: JobStatus.COMPLETED },
  });
}

export async function failJob(id: string, error: string, attempts: number, maxAttempts: number): Promise<void> {
  const nextAttempts = attempts + 1;
  await prisma.job.update({
    where: { id },
    data: {
      status: nextAttempts >= maxAttempts ? JobStatus.FAILED : JobStatus.PENDING,
      attempts: nextAttempts,
      lastError: error.slice(0, 500),
      runAt: new Date(Date.now() + nextAttempts * 60_000),
      lockedAt: null,
      lockedBy: null,
    },
  });
}

export async function processJobBatch(): Promise<number> {
  const batch = await claimJobBatch();
  for (const job of batch) {
    try {
      await handleJob(job);
      await completeJob(job.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await failJob(job.id, message, job.attempts, job.maxAttempts);
    }
  }
  return batch.length;
}
