# Equipment Qualification Module — Development Plan

| Field | Value |
|---|---|
| Document ID | PQMS-DEV-001 |
| Version | 1.0 |
| Date | 2026-09-01 |
| Author | Dr. Daoud Tajeldeinn |
| Priority | High |
| Regulatory Basis | EU GMP Annex 15, 21 CFR 211.68 |

---

## 1. Current State

The Equipment module tracks:
- Name, model, manufacturer, serial number
- Asset tag, location, department
- Calibration schedule, maintenance schedule
- Status, qualification status (single field only)

**Gap:** No formal DQ/IQ/OQ/PQ qualification lifecycle per equipment item.

---

## 2. Required Features

### 2.1 Qualification Phases per Equipment

Each equipment item needs a qualification record for each phase:

| Phase | Full Name | Description |
|---|---|---|
| DQ | Design Qualification | Confirms design meets user requirements |
| IQ | Installation Qualification | Confirms correct installation |
| OQ | Operational Qualification | Confirms operates within defined parameters |
| PQ | Performance Qualification | Confirms consistent performance in use |

### 2.2 Per-Phase Data Fields

| Field | Type | Required |
|---|---|---|
| Phase | DQ / IQ / OQ / PQ | Yes |
| Protocol Number | Text | Yes |
| Qualification Date | Date | Yes |
| Performed By | Text | Yes |
| Approved By | Text | Yes |
| Result | Pass / Fail / Pending | Yes |
| Next Requalification Date | Date | Yes |
| Notes | Text | No |
| Documents | File attachment | No |

### 2.3 Qualification Status Logic

| Condition | Status |
|---|---|
| All 4 phases passed | Fully Qualified |
| Some phases passed | Partially Qualified |
| Any phase failed | Qualification Failed |
| No phases completed | Not Qualified |
| Requalification overdue | Requalification Required |

### 2.4 Requalification Alerts

- Alert when requalification date is within 30 days
- Dashboard indicator for overdue qualifications
- Email/notification support (future)

### 2.5 Qualification Certificate PDF

Generate a PDF qualification certificate per equipment including:
- Equipment details
- All phase results
- Signatures
- Next requalification date

---

## 3. Database Changes Required

### New Table: `equipmentQualifications`

```sql
CREATE TABLE "equipmentQualifications" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id uuid NOT NULL REFERENCES equipment(id),
    phase text NOT NULL CHECK (phase IN ('DQ', 'IQ', 'OQ', 'PQ')),
    protocol_number text,
    qualification_date date,
    performed_by text,
    approved_by text,
    result text CHECK (result IN ('Pass', 'Fail', 'Pending')),
    next_requalification_date date,
    notes text,
    is_deleted boolean DEFAULT false,
    created_at timestamptz DEFAULT NOW()
);

ALTER TABLE "equipmentQualifications" ENABLE ROW LEVEL SECURITY;
```

---

## 4. UI Changes Required

### 4.1 Equipment Detail Page
- Add "Qualification" tab alongside existing details
- Show qualification status badge (Fully Qualified / Partial / Not Qualified)
- List all qualification phases with status

### 4.2 Qualification Form
- Add/Edit qualification record per phase
- Electronic signature required for approval
- Audit trail logged via AuditLogService

### 4.3 Equipment List
- Add qualification status column
- Filter by qualification status
- Highlight overdue requalifications in red

### 4.4 Dashboard
- Add qualification alerts panel
- Count of equipment pending requalification

---

## 5. Files to Create/Modify

| File | Action |
|---|---|
| `supabase_schema_fix_v8.sql` | Create `equipmentQualifications` table |
| `app/src/types/index.ts` | Add `EquipmentQualification` type |
| `app/src/pages/Equipment.tsx` | Add qualification tab and form |
| `app/src/services/QualificationService.ts` | New — qualification CRUD + PDF |
| `app/src/lib/coaExport.ts` | Add `generateQualificationCertificate()` |
| `app/src/components/security/CloudSyncService` | Add `equipmentQualifications` to sync tables |
| `docs/validation_gap_analysis.md` | Add new gap for equipment qualification |

---

## 6. Compliance Mapping

| Requirement | Regulation | Implementation |
|---|---|---|
| Equipment qualification | EU GMP Annex 15 §10 | DQ/IQ/OQ/PQ per equipment |
| Qualification records | 21 CFR 211.68 | Stored in `equipmentQualifications` |
| Requalification | EU GMP Annex 15 §11 | Date tracking + alerts |
| Audit trail | 21 CFR Part 11 | AuditLogService integration |
| Electronic signatures | 21 CFR 11.200 | SignatureModal on approval |

---

## 7. Development Estimate

| Task | Effort |
|---|---|
| Database migration | 30 min |
| Type definitions | 15 min |
| Qualification service | 1 hour |
| Equipment page UI | 2 hours |
| PDF certificate | 1 hour |
| Cloud sync integration | 30 min |
| Testing | 1 hour |
| **Total** | **~6 hours** |

---

## 8. Next Session Checklist

- [ ] Create `supabase_schema_fix_v8.sql` with `equipmentQualifications` table
- [ ] Add `EquipmentQualification` type to `types/index.ts`
- [ ] Create `QualificationService.ts`
- [ ] Update `Equipment.tsx` with qualification tab
- [ ] Add qualification certificate to `coaExport.ts`
- [ ] Add to CloudSync tables
- [ ] Test and release as v4.4.0
