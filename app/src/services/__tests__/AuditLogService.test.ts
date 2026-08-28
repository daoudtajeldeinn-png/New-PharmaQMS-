import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

// Polyfill crypto.randomUUID BEFORE any import evaluation
if (!globalThis.crypto) {
  (globalThis as any).crypto = { randomUUID: () => 'test-uuid' };
} else if (!globalThis.crypto.randomUUID) {
  (globalThis.crypto as any).randomUUID = () => 'test-uuid';
}

const { supabaseFromMock } = vi.hoisted(() => ({ supabaseFromMock: vi.fn() }));
const { dbPutMock } = vi.hoisted(() => ({ dbPutMock: vi.fn().mockResolvedValue(undefined) }));

vi.mock('@/lib/supabase', () => ({
  supabase: { from: supabaseFromMock },
}));

vi.mock('@/db/db', () => ({
  db: { activities: { put: dbPutMock } },
}));

let AuditLogService: any;

beforeAll(async () => {
  const mod = await import('../AuditLogService');
  AuditLogService = mod.AuditLogService ?? mod.default;

  if (!AuditLogService) {
    throw new Error(`AuditLogService is undefined. Module keys: ${Object.keys(mod).join(', ')}`);
  }
});

function setupSupabaseMock(options: { insertError?: boolean; previousHash?: string } = {}) {
  const insert = vi.fn().mockResolvedValue({
    error: options.insertError ? { message: 'DB failure' } : null,
  });
  const select = vi.fn().mockReturnThis();
  const order = vi.fn().mockReturnThis();
  const limit = vi.fn().mockResolvedValue({
    data: options.previousHash ? [{ entry_hash: options.previousHash }] : [],
    error: null,
  });

  supabaseFromMock.mockReturnValue({ select, order, limit, insert } as any);

  return { insert };
}

describe('AuditLogService (21 CFR Part 11)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset static hash-chain state between tests
    (AuditLogService as any).lastKnownHash = null;
  });

  it('writes audit entries via INSERT to user_activity_logs (append-only)', async () => {
    const { insert } = setupSupabaseMock();
    await AuditLogService.logCreate('u1', 'Dr. Smith', 'QA', 'products', 'r1', 'Test product', { name: 'Test' });

    expect(supabaseFromMock).toHaveBeenCalledWith('user_activity_logs');
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it('throws (fail-closed) when the audit write fails', async () => {
    setupSupabaseMock({ insertError: true });
    await expect(
      AuditLogService.logCreate('u1', 'Dr. Smith', 'QA', 'products', 'r1', 'Test', {})
    ).rejects.toThrow(/blocked/i);
  });

  it('records a hash chain (entry_hash + previous_hash)', async () => {
    const { insert } = setupSupabaseMock({ previousHash: 'abc123' });
    await AuditLogService.logUpdate('u1', 'Dr. Smith', 'QA', 'capas', 'capa1', 'Update', { a: 1 }, { a: 2 });

    const entry = insert.mock.calls[0][0];
    expect(entry.entry_hash).toBeDefined();
    expect(entry.previous_hash).toBe('abc123');
  });
});
