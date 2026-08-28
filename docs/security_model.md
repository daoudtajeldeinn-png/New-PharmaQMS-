# PharmaQMS Enterprise — Security & Access Control Model

| Field | Value |
|---|---|
| Document ID | PQMS-SEC-001 |
| Version | 1.0 |
| Date | 2026-08-28 |
| System | PharmaQMS Enterprise v4.3.3 |

---

## 1. Authentication

- **Primary**: Supabase Auth (email/password)
- **MFA**: Not yet implemented (GAP-08)
- **Session**: JWT-based, expires per Supabase policy

---

## 2. Authorization (RBAC)

| Role | Permissions |
|---|---|
| **IT Admin** | Full system access, user management, license management, deleted-record recovery |
| **QA Admin** | Approve/reject quality records, manage CAPAs, deviations, audits, training |
| **QA Reviewer** | Review records, add comments, cannot approve |
| **Production User** | Create/view batch records, IPQC results, inventory |
| **Lab User** | Test methods, stability, COA generation |
| **Read-Only Auditor** | View all records, cannot modify |

Enforcement: `PermissionService.ts` + `useRoleAccess.ts` + route guards

---

## 3. Data Protection

### At Rest
- Supabase PostgreSQL (encrypted by provider)
- Local Dexie/IndexedDB (app-level; recommend OS-level encryption for production)

### In Transit
- HTTPS (Supabase API)
- Local Electron renderer → main process via contextBridge (no remote code)

---

## 4. Audit Trail (21 CFR Part 11)

- Table: `user_activity_logs`
- Append-only: DB trigger `prevent_audit_mutation()` blocks UPDATE/DELETE
- Hash-chained: `entry_hash = SHA256(content + previous_hash)`
- Fail-closed: audit write failure blocks business action
- RLS: no anonymous/direct access

---

## 5. Data Integrity (ALCOA+)

| Principle | Implementation |
|---|---|
| **Attributable** | `user_id`, `user_name`, `user_role`, `ip_address` on audit entries |
| **Legible** | JSON structure, human-readable `description` field |
| **Contemporaneous** | `timestamp` set at time of write |
| **Original** | Records never hard-deleted; soft-delete flag only |
| **Accurate** | `old_values` / `new_values` captured on UPDATE/DELETE |

---

## 6. Row-Level Security (Supabase)

- All domain tables: RLS enabled
- Anonymous/key access: denied by default
- Authenticated users: scoped by policy (to be formalized per-role)

---

## 7. Deletion Policy

- Soft-delete only: `is_deleted = true`
- Permanent tombstones in `deletedrecords`
- Recovery: flip flag back (admin-only)
- No purge function in production

---

## 8. Key Management

- Supabase keys stored in environment variables, not in bundle
- `KeyGenerator.ts` / `LicenseManager.ts` — license validation for activation
- Recommend: move license secrets to server-side validation

---

## 9. Network Security

- All API calls via HTTPS
- No unauthenticated write endpoints (RLS enforced)
- No insecure dependencies (npm audit = 0 production vulnerabilities)

---

## 10. Known Gaps & Remediation

| ID | Gap | Priority | Plan |
|---|---|---|---|
| SEC-01 | No MFA | High | Add TOTP/WebAuthn for admin/approver roles |
| SEC-02 | License validation client-side only | Medium | Move to server-side |
| SEC-03 | No formal RLS per-role policies | High | Define + test in staging |
| SEC-04 | Local IndexedDB not encrypted | Low | Recommend OS-level encryption |
