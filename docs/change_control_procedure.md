# PharmaQMS Enterprise — Change Control Procedure

| Field | Value |
|---|---|
| Document ID | PQMS-CHG-001 |
| Version | 1.0 |
| Date | 2026-08-31 |
| Author | Dr. Daoud Tajeldeinn |
| System | PharmaQMS Enterprise v4.3.3 |
| Classification | Controlled Document |

---

## 1. Purpose

This procedure defines the change control process for PharmaQMS Enterprise software, linking source code management (Git/GitHub) to the quality management system in compliance with EU GMP Annex 11 §10 and 21 CFR Part 11.

---

## 2. Scope

All changes to:
- Application source code
- Database schema and migrations
- Configuration files
- Validation documentation
- Infrastructure and deployment settings

---

## 3. Change Categories

| Category | Description | Approval Required |
|---|---|---|
| **Critical** | Security fixes, data integrity, audit trail | System Owner + QA Admin |
| **Major** | New features, schema changes, UI changes | System Owner |
| **Minor** | Bug fixes, documentation updates, styling | IT Admin |
| **Emergency** | Production hotfixes for live system issues | System Owner (post-hoc QA review) |

---

## 4. Change Control Workflow

### 4.1 Standard Change Process


**Step 1 — Change Request**
- Open a GitHub Issue describing the change
- Label it: `critical`, `major`, `minor`, or `emergency`
- Reference the Gap ID if applicable (e.g. `GAP-08`)
- Assign to responsible developer

**Step 2 — Impact Assessment**
- Assess impact on validated state
- Identify affected modules and data
- Determine if revalidation (OQ/PQ) is required

**Step 3 — Approval**
- Issue approved by appropriate role (see Section 3)
- Approval recorded as GitHub Issue comment with name and date

**Step 4 — Implementation**
- All changes made in a feature branch
- Commit messages must follow format:
  Examples:

**Step 5 — Testing**
- CI pipeline must pass (TypeScript, Vitest, npm audit)
- Manual testing per affected OQ test cases
- For critical changes: full regression test

**Step 6 — Release**
- Merge to `production` branch via Pull Request
- PR title references Issue number
- Release tagged with version (e.g. `v4.3.4`)

**Step 7 — Documentation**
- Update `validation_gap_analysis.md` if gap closed
- Update `validation_protocol.md` if OQ re-executed
- Update version history in affected documents

---

## 5. Commit Message Convention

| Type | Use For |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `security` | Security hardening |
| `docs` | Documentation only |
| `chore` | Maintenance, cleanup |
| `ci` | CI/CD pipeline changes |
| `schema` | Database migrations |

---

## 6. Emergency Change Process

For critical production issues:
1. IT Admin implements fix immediately
2. Commit with prefix `hotfix:` and issue reference
3. System Owner notified within 1 hour
4. Post-hoc QA review within 24 hours
5. Change documented in next change control record

---

## 7. Traceability Matrix

All changes must be traceable from:

Example traceability chain for GAP-15:
- Issue: #15 — RBAC logic bug
- Commits: `b83e59f`, `63621d1`
- PR: Production #24
- Doc update: `validation_gap_analysis.md` v1.1 GAP-15 ✅ CLOSED

---

## 8. Version Control Rules

| Rule | Requirement |
|---|---|
| All changes via Git | No direct database edits without migration file |
| No force push to main/production | Protected branches enforced |
| CI must pass before merge | GitHub Actions required to pass |
| `.env` files never committed | Enforced via `.gitignore` |
| Secrets never hardcoded | Enforced by code review |

---

## 9. Related Documents

| Document | ID |
|---|---|
| Validation Gap Analysis | PQMS-VAL-001 |
| Validation Protocol (IQ/OQ/PQ) | PQMS-VAL-002 |
| Security & Access Control Model | PQMS-SEC-001 |
| Disaster Recovery Runbook | PQMS-DR-001 |
| Data Retention Policy | PQMS-RET-001 |

---

## 10. Approval

| Role | Name | Signature | Date |
|---|---|---|---|
| System Owner | Dr. Daoud Tajeldeinn | | |
| Quality Assurance | | | |
| IT / Validation | | | |
