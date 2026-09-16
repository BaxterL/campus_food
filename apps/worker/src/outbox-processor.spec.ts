import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@prisma/client', () => {
  class PrismaClient {
    $queryRaw = vi.fn();
    $transaction = vi.fn();
    outboxMessage = { updateMany: vi.fn() };
  }
  return {
    PrismaClient,
    OutboxStatus: { PENDING: 'PENDING', PROCESSING: 'PROCESSING', COMPLETED: 'COMPLETED', FAILED: 'FAILED' },
    JobStatus: { PENDING: 'PENDING', RUNNING: 'RUNNING', COMPLETED: 'COMPLETED', FAILED: 'FAILED' },
  };
});

describe('outbox processor', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('exports claim and process functions', async () => {
    const mod = await import('./outbox-processor.js');
    expect(typeof mod.claimOutboxBatch).toBe('function');
    expect(typeof mod.processOutboxBatch).toBe('function');
  });
});
