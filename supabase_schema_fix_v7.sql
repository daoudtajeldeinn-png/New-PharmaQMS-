-- PharmaQMS Schema Fix v7
-- Fix: Add missing soft-delete columns to chemicalReagents table
-- Error resolved: PGRST204 'deleteReason' column not found in schema cache

ALTER TABLE "chemicalReagents"
ADD COLUMN IF NOT EXISTS "deleteReason" text,
ADD COLUMN IF NOT EXISTS "is_deleted" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "deleted_by" text,
ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz;
