-- =====================================================
-- PharmaQMS Enterprise v4.3.0 - Audit & Data Governance
-- 21 CFR Part 11 & EU Annex 11 Compliance
--
-- Migration: Create server-side audit log + admin recovery
-- =====================================================
-- NOTE (important for this codebase):
-- This project already uses a tombstone-based deletion mechanism:
--   CloudSyncService filters deleted rows using the Supabase table `deletedRecords`
-- and DeletedRecordsService writes tombstones there.
-- Therefore, this migration builds `deleted_records_summary` from `deletedRecords`
-- to stay compatible with the existing architecture.
--
-- The "soft delete columns on all major tables" portion of the originally provided
-- SQL is intentionally deferred (it would require frontend/backend query refactors
-- to filter deleted rows consistently).
-- =====================================================

-- 1) USER ACTIVITY LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    user_name text NOT NULL,
    user_role text NOT NULL,          -- admin, qa, operator, viewer (string)
    action_type text NOT NULL,       -- CREATE, READ, UPDATE, DELETE, RECOVER, HARD_DELETE, LOGIN, LOGOUT
    table_name text NOT NULL,
    record_id text,
    record_description text,
    old_values jsonb,
    new_values jsonb,
    reason text,
    ip_address text,
    device_info text,
    timestamp timestamptz DEFAULT NOW(),
    created_at timestamptz DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_logs_timestamp ON user_activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_logs_action_type ON user_activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_user_logs_table_name ON user_activity_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_user_logs_record_id ON user_activity_logs(record_id);

-- Enable RLS
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies
-- Insert: allow authenticated users to insert their own log entries.
-- (The application/user code should populate user_id appropriately.)
DROP POLICY IF EXISTS "Users can insert logs" ON user_activity_logs;
CREATE POLICY "Users can insert logs"
  ON user_activity_logs
  FOR INSERT
  WITH CHECK (true);

-- Select: admins can view all logs
DROP POLICY IF EXISTS "Admins can view all logs" ON user_activity_logs;
CREATE POLICY "Admins can view all logs"
  ON user_activity_logs
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role') = 'admin'
    OR user_id = auth.uid()::text
  );

-- Select: users can view own logs
DROP POLICY IF EXISTS "Users can view own logs" ON user_activity_logs;
CREATE POLICY "Users can view own logs"
  ON user_activity_logs
  FOR SELECT
  USING (user_id = auth.uid()::text);

-- 2) DELETED RECORDS SUMMARY (ADMIN RECOVERY VIEW)
-- =====================================================
-- Uses existing tombstone mechanism table:
--   deletedRecords (written by DeletedRecordsService)
-- Expected columns (from DeletedRecordsService):
--   id, record_id, table_name, deleted_at, deleted_by, reason, snapshot, recovered, recovered_by, recovered_at
-- =====================================================
CREATE OR REPLACE VIEW deleted_records_summary AS
SELECT
  tr.table_name AS table_name,
  tr.record_id::text AS record_id,
  NULL::text AS record_name,
  tr.deleted_at,
  tr.deleted_by,
  tr.reason
FROM deletedRecords tr
WHERE tr.recovered IS DISTINCT FROM true
ORDER BY tr.deleted_at DESC;

-- 3) HELPER FUNCTION: log_user_activity
-- =====================================================
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id TEXT,
    p_user_name TEXT,
    p_user_role TEXT,
    p_action_type TEXT,
    p_table_name TEXT,
    p_record_id TEXT,
    p_record_description TEXT DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_reason TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO user_activity_logs (
    user_id,
    user_name,
    user_role,
    action_type,
    table_name,
    record_id,
    record_description,
    old_values,
    new_values,
    reason,
    ip_address,
    device_info
  ) VALUES (
    p_user_id,
    p_user_name,
    p_user_role,
    p_action_type,
    p_table_name,
    p_record_id,
    p_record_description,
    p_old_values,
    p_new_values,
    p_reason,
    NULL,
    NULL
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$;

-- 4) GRANT PERMISSIONS
-- =====================================================
GRANT SELECT, INSERT ON user_activity_logs TO authenticated;
GRANT SELECT ON deleted_records_summary TO authenticated;
GRANT EXECUTE ON FUNCTION log_user_activity TO authenticated;

-- 5) COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE user_activity_logs IS '21 CFR Part 11 compliant audit trail for user activities.';
COMMENT ON COLUMN user_activity_logs.action_type IS 'Type of action: CREATE, READ, UPDATE, DELETE, RECOVER, HARD_DELETE, LOGIN, LOGOUT';
COMMENT ON COLUMN user_activity_logs.old_values IS 'Previous state of record before modification (for UPDATE/DELETE).';
COMMENT ON COLUMN user_activity_logs.new_values IS 'New state of record after modification (for CREATE/UPDATE).';
COMMENT ON COLUMN user_activity_logs.reason IS 'User-provided reason for critical actions (recommended required for DELETE/RECOVER/HARD_DELETE).';
COMMENT ON VIEW deleted_records_summary IS 'Aggregated view of active (non-recovered) tombstones from deletedRecords for admin recovery UI.';

