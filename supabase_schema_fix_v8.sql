-- ==============================================================================
-- PharmaQMS Database Migration: v8
-- Equipment Qualification Module (EU GMP Annex 15, 21 CFR 211.68)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS "equipmentQualifications" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id uuid NOT NULL,
    phase text NOT NULL CHECK (phase IN ('DQ', 'IQ', 'OQ', 'PQ')),
    protocol_number text,
    qualification_date timestamptz,
    performed_by text,
    approved_by text,
    result text CHECK (result IN ('Pass', 'Fail', 'Pending')),
    next_requalification_date timestamptz,
    notes text,
    is_deleted boolean DEFAULT false,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_equipment_qualifications_eq_id ON "equipmentQualifications" (equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_qualifications_phase ON "equipmentQualifications" (phase);
CREATE INDEX IF NOT EXISTS idx_equipment_qualifications_next_date ON "equipmentQualifications" (next_requalification_date);

-- Enable Row Level Security
ALTER TABLE "equipmentQualifications" ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to perform operations
CREATE POLICY "Allow authenticated read equipmentQualifications"
    ON "equipmentQualifications" FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated insert equipmentQualifications"
    ON "equipmentQualifications" FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update equipmentQualifications"
    ON "equipmentQualifications" FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated delete equipmentQualifications"
    ON "equipmentQualifications" FOR DELETE
    TO authenticated
    USING (true);
