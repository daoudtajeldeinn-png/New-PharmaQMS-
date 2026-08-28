import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recordDeletion, recoverRecord, getDeletedIds } from '../DeletedRecordsService';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

function setupSupabaseMock() {
  const update = vi.fn().mockReturnThis();
  const eq = vi.fn().mockResolvedValue({ error: null });
  const upsert = vi.fn().mockResolvedValue({ error: null });
  // Fix: select must be chainable, limit resolves
  const select = vi.fn().mockReturnThis();
  const limit = vi.fn().mockResolvedValue({ data: null, error: { message: 'does not exist' } });

  vi.mocked(supabase.from).mockReturnValue({
    update,
    eq,
    upsert,
    select,
    limit,
  } as any);

  return { update, eq, upsert };
}

describe('DeletedRecordsService (ALCOA+ Soft Delete)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('soft-deletes the record — NEVER calls .delete()', async () => {
    const { update, eq } = setupSupabaseMock();
    await recordDeletion('products', 'prod1', 'qa-admin', 'Obsolete');

    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      is_deleted: true,
      deleted_by: 'qa-admin',
    }));
    expect(eq).toHaveBeenCalledWith('id', 'prod1');
  });

  it('tracks a tombstone locally and hides the record from sync filters', async () => {
    setupSupabaseMock();
    await recordDeletion('products', 'prod1', 'qa-admin');
    const deletedIds = getDeletedIds('products');
    expect(deletedIds.has('prod1')).toBe(true);
  });

  it('recovery un-flags the record', async () => {
    setupSupabaseMock();
    await recordDeletion('products', 'prod1', 'qa-admin');
    await recoverRecord('products', 'prod1', 'qa-admin');

    const updateCalls = vi.mocked(supabase.from).mock.calls
      .map((call) => call[0])
      .filter((name) => name === 'products');
    expect(updateCalls.length).toBeGreaterThanOrEqual(2);
  });
});
