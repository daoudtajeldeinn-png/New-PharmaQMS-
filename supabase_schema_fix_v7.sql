-- PharmaQMS Schema Fix v7
-- Fix: Add missing soft-delete columns to chemicalReagents table
-- Error resolved: PGRST204 'deleteReason' column not found in schema cache

ALTER TABLE "chemicalReagents"
ADD COLUMN IF NOT EXISTS "deleteReason" text,
ADD COLUMN IF NOT EXISTS "is_deleted" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "deleted_by" text,
ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz;

-- Fix v7.1: Add camelCase soft-delete columns expected by CloudSyncService
-- Error resolved: PGRST204 'deletedAt' column not found in schema cache
ALTER TABLE "chemicalReagents"
ADD COLUMN IF NOT EXISTS "deletedAt" timestamptz,
ADD COLUMN IF NOT EXISTS "deletedBy" text,
ADD COLUMN IF NOT EXISTS "isDeleted" boolean DEFAULT false;

-- Fix v7.2: Rename equipment columns to camelCase to match app expectations
-- Error resolved: 400 on equipment sync due to column name mismatch
ALTER TABLE equipment RENAME COLUMN assettag TO "assetTag";
ALTER TABLE equipment RENAME COLUMN calibrationschedule TO "calibrationSchedule";
ALTER TABLE equipment RENAME COLUMN maintenanceschedule TO "maintenanceSchedule";
ALTER TABLE equipment RENAME COLUMN purchasedate TO "purchaseDate";
ALTER TABLE equipment RENAME COLUMN qualificationstatus TO "qualificationStatus";
ALTER TABLE equipment RENAME COLUMN serialnumber TO "serialNumber";
ALTER TABLE equipment RENAME COLUMN warrantyexpiry TO "warrantyExpiry";
