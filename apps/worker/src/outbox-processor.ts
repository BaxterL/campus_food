import { OutboxStatus, Prisma } from '@prisma/client';
import { prisma } from './prisma.js';

const WORKER_ID = `worker-${process.pid}`;

export interface OutboxMessageRow {
  id: string;
  eventType: string;
  payload: Prisma.JsonValue;
}

export async function claimOutboxBatch(limit = 10): Promise<OutboxMessageRow[]> {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<OutboxMessageRow[]>`
      SELECT id, "eventType", payload
      FROM "OutboxMessage"
      WHERE status = 'PENDING'
      ORDER BY "createdAt" ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    `;

    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.id);
    await tx.outboxMessage.updateMany({
      where: { id: { in: ids } },
      data: { status: OutboxStatus.PROCESSING, lockedAt: new Date(), lockedBy: WORKER_ID },
    });

    return rows;
  });
}

export async function handleOutboxMessage(msg: OutboxMessageRow): Promise<void> {
  // MVP: log events; extend with real handlers (notifications, analytics, etc.)
  console.log(`[outbox] ${msg.eventType}`, JSON.stringify(msg.payload));
}

export async function completeOutboxMessage(id: string): Promise<void> {
  await prisma.outboxMessage.update({
    where: { id },
    data: { status: OutboxStatus.COMPLETED, processedAt: new Date() },
  });
}

export async function failOutboxMessage(id: string, error: string): Promise<void> {
  await prisma.outboxMessage.update({
    where: { id },
    data: {
      status: OutboxStatus.FAILED,
      attempts: { increment: 1 },
      lastError: error.slice(0, 500),
    },
  });
}

export async function processOutboxBatch(): Promise<number> {
  const batch = await claimOutboxBatch();
  for (const msg of batch) {
    try {
      await handleOutboxMessage(msg);
      await completeOutboxMessage(msg.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await failOutboxMessage(msg.id, message);
    }
  }
  return batch.length;
}
