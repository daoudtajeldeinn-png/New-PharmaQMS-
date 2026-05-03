-- PharmaQMS Enterprise: COA Foundry Schema Expansion
-- Execute this in the Supabase SQL Editor to support the new automated COA fields.

ALTER TABLE coa_raw_material 
ADD COLUMN IF NOT EXISTS mfg_date DATE,
ADD COLUMN IF NOT EXISTS exp_date DATE,
ADD COLUMN IF NOT EXISTS analysis_no TEXT,
ADD COLUMN IF NOT EXISTS issue_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS analyzed_by TEXT,
ADD COLUMN IF NOT EXISTS checked_by TEXT,
ADD COLUMN IF NOT EXISTS approved_by TEXT,
ADD COLUMN IF NOT EXISTS market_complaint_status TEXT DEFAULT 'Verified and Compliant';

-- Ensure existing records are updated with defaults if necessary
UPDATE coa_raw_material SET market_complaint_status = 'Verified and Compliant' WHERE market_complaint_status IS NULL;

-- Final Deployment Checklist:
-- 1. Push changes to GitHub.
-- 2. Create a new tag: git tag v4.2.1 && git push origin v4.2.1
-- 3. The 'release.yml' workflow will trigger automatically.
-- 4. Users will receive the auto-update prompt on next launch.
