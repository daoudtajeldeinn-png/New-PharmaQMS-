# PharmaQMS Enterprise — Validation Protocol (IQ/OQ/PQ)

| Field | Value |
|---|---|
| Document ID | PQMS-VAL-002 |
| Version | 1.0 |
| Date | 2026-08-28 |
| System | PharmaQMS Enterprise v4.3.3 |

---

## 1. Purpose

Qualify PharmaQMS Enterprise as a compliant quality management system for
use in regulated pharmaceutical environments.

## 2. Scope

- Infrastructure: Supabase cloud environment
- Software: Electron app (renderer + main)
- Interfaces: Supabase API, local Dexie storage
- Data: All QMS records (CAPAs, Deviations, Training, Stability, etc.)

## 3. Roles & Responsibilities

| Role | Responsibility |
|---|---|
| System Owner | Defines intended use, approves validation |
| QA | Reviews and approves test protocols |
| IT/Validation | Executes test scripts, documents evidence |
| Business Process Owner | Confirms workflow requirements |

## 4. Installation Qualification (IQ)

| Test | Verification | Evidence |
|---|---|---|
| Software version installed | `package.json` version matches approved | Screenshot / commit hash |
| Node/npm version | `node -v`, `npm -v` within approved range | Console log |
| Supabase connection | App loads data from configured Supabase | Screenshot |
| Dependencies installed | `npm ci` succeeds | Console log |
| Environment variables present | `.env` contains required keys | Checked (no values recorded) |

## 5. Operational Qualification (OQ)

| Test | Verification | Evidence |
|---|---|---|
| Login | Valid/Invalid credentials behave expected | Screenshot |
| Role-based access | User without QA role cannot approve | Test script |
| Create CAPA | Record saved + audit entry created | Screenshot + audit query |
| Edit deviation | `old_values`/`new_values` logged | Audit query |
| Soft-delete product | Record flagged `is_deleted=true`, preserved | SQL query |
| Audit immutability | UPDATE/DELETE on audit table rejected | SQL error log |
| Recovery | Admin un-flags record | Screenshot |
| Hash-chain verification | `previous_hash` matches prior entry | SQL query |

## 6. Performance Qualification (PQ)

| Test | Verification | Evidence |
|---|---|---|
| Batch release workflow | End-to-end passes with 100% accuracy | Signed report |
| COA generation | PDF output correct | Sample PDF |
| Stability prediction | Output within acceptance criteria | Sample report |
| 24h uptime | No memory leaks/crashes | Monitoring log |
| 100 concurrent records | Response < 2s | Performance log |

## 7. Acceptance Criteria

- All IQ/OQ/PQ tests pass
- No unresolved critical/major defects
- All gaps in `validation_gap_analysis.md` remediated or accepted with justification

## 8. Release Decision

- Approved for use in production: Yes/No
- Conditions: _____

## 9. Traceability

- Requirements → `validation_gap_analysis.md`
- Tests → this protocol

## 10. Signatures

| Role | Name | Signature | Date |
|---|---|---|---|
| System Owner | Dr. Daoud Tajeldeinn | | |
| QA | | | |
| IT Validation | | | |
