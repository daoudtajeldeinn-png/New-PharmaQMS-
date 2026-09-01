# IQ/OQ/PQ Validation Protocol
## PharmaQMS - 21 CFR Part 11 / EU GMP Annex 11 Compliance

### Document Control
- **Document Owner**: Dr. Daoud Tajeldeinn Ahmed
- **Version**: 1.0
- **Date**: 2026-09-01
- **Status**: Draft
- **Purpose**: Define IQ/OQ/PQ validation procedures for PharmaQMS

---

## 1. Installation Qualification (IQ)

### 1.1 Purpose
To verify that PharmaQMS is installed correctly according to specified requirements and operates within the intended environment.

### 1.2 Scope
- Software installation and configuration
- Hardware/environment requirements
- Integration with supporting systems
- Documentation completeness

### 1.3 Test Scripts

#### IQ-001: Software Installation Verification
**Objective**: Verify PharmaQMS application is installed correctly
**Acceptance Criteria**: Application launches without errors, all components load successfully

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|----------------|---------------|--------|
| 1 | Navigate to application directory | Directory exists at specified path | | ⏳ |
| 2 | Check package.json exists | package.json file present | | ⏳ |
| 3 | Verify node_modules installation | Dependencies installed successfully | | ⏳ |
| 4 | Launch application | Application starts without errors | | ⏳ |
| 5 | Verify main window displays | Main interface loads correctly | | ⏳ |

**Test Execution Date**: _____________  
**Tester**: _____________  
**Signature**: _____________

#### IQ-002: Configuration Verification
**Objective**: Verify system configuration meets requirements
**Acceptance Criteria**: All configuration files present and properly formatted

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|----------------|---------------|--------|
| 1 | Check vercel.json configuration | Vercel config exists and valid | | ⏳ |
| 2 | Verify environment variables | Required env variables set | | ⏳ |
| 3 | Check database connection settings | Supabase connection configured | | ⏳ |
| 4 | Verify i18n configuration | Translation files present | | ⏳ |
| 5 | Check gitignore patterns | Proper exclusions configured | | ⏳ |

**Test Execution Date**: _____________  
**Tester**: _____________  
**Signature**: _____________

#### IQ-003: Database Schema Verification
**Objective**: Verify database schema matches requirements
**Acceptance Criteria**: All required tables and columns exist

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|----------------|---------------|--------|
| 1 | Connect to Supabase database | Connection successful | | ⏳ |
| 2 | Verify profiles table exists | Table exists with required columns | | ⏳ |
| 3 | Check soft-delete columns | is_deleted, deleted_at columns present | | ⏳ |
| 4 | Verify audit_logs table | Audit logging table exists | | ⏳ |
| 5 | Check MFA support tables | MFA-related tables/indices exist | | ⏳ |

**Test Execution Date**: _____________  
**Tester**: _____________  
**Signature**: _____________

---

## 2. Operational Qualification (OQ)

### 2.1 Purpose
To verify that PharmaQMS operates according to functional specifications in both normal and stress conditions.

### 2.2 Scope
- Core functionality testing
- Role-based access control
- Data integrity features
- Audit trail functionality
- MFA authentication
- Business process workflows

### 2.3 Test Scripts

#### OQ-001: User Authentication and Authorization
**Objective**: Verify user authentication and role-based access control functions correctly
**Acceptance Criteria**: Users can login, access appropriate features based on role

| Test Case | Description | Expected Result | Actual Result | Status |
|----------|-------------|----------------|---------------|--------|
| OQ-001-01 | Valid admin login | Admin user logs in successfully | | ⏳ |
| OQ-001-02 | Invalid login attempt | Login fails with appropriate error | | ⏳ |
| OQ-001-03 | MFA enrollment | Admin can enroll in MFA | | ⏳ |
| OQ-001-04 | MFA challenge | MFA challenge works during login | | ⏳ |
| OQ-001-05 | MFA trial exception | Trial users skip MFA requirement | | ⏳ |
| OQ-001-06 | Role-based permissions | Users access only permitted features | | ⏳ |
| OQ-001-07 | Session timeout | Sessions expire after specified time | | ⏳ |

**Test Execution Date**: _____________  
**Tester**: _____________  
**Signature**: _____________

#### OQ-002: COA Management Functionality
**Objective**: Verify COA creation, editing, approval, and print functionality
**Acceptance Criteria**: COA lifecycle works according to specifications

| Test Case | Description | Expected Result | Actual Result | Status |
|----------|-------------|----------------|---------------|--------|
| OQ-002-01 | Create new COA record | COA record created with required fields | | ⏳ |
| OQ-002-02 | Edit COA record | Changes saved correctly | | ⏳ |
| OQ-002-03 | Approve COA | Status changes to Approved | | ⏳ |
| OQ-002-04 | Print COA | PDF generated correctly | | ⏳ |
| OQ-002-05 | COA date formatting | Dates display in correct format | | ⏳ |
| OQ-002-06 | Delete COA with audit | Deletion logged in audit trail | | ⏳ |

**Test Execution Date**: _____________  
**Tester**: _____________  
**Signature**: _____________

#### OQ-003: Data Recovery Console
**Objective**: Verify soft-delete recovery functionality
**Acceptance Criteria: Deleted records can be recovered with proper audit trail

| Test Case | Description | Expected Result | Actual Result | Status |
|----------|-------------|----------------|---------------|--------|
| OQ-003-01 | View deleted records | Deleted records displayed correctly | | ⏳ |
| OQ-003-02 | Restore deleted record | Record restored with audit logging | | ⏳ |
| OQ-003-03 | Hard delete record | Permanent deletion with justification | | ⏳ |
| OQ-003-04 | Object rendering fix | No React object rendering errors | | ⏳ |
| OQ-003-05 | Role-based recovery | Only admins can recover records | | ⏳ |

**Test Execution Date**: _____________  
**Tester**: _____________  
**Signature**: _____________

#### OQ-004: Audit Trail Functionality
**Objective**: Verify audit trail captures all system events
**Acceptance Criteria**: All significant events logged with timestamps and user identification

| Test Case | Description | Expected Result | Actual Result | Status |
|----------|-------------|----------------|---------------|--------|
| OQ-004-01 | Login events logged | User logins captured in audit trail | | ⏳ |
| OQ-004-02 | MFA events logged | MFA enrollments and verifications logged | | ⏳ |
| OQ-004-03 | Data modifications logged | Create/edit/delete operations logged | | ⏳ |
| OQ-004-04 | Role changes logged | Role modifications captured | | ⏳ |
| OQ-004-05 | Timestamp accuracy | Event timestamps are accurate | | ⏳ |
| OQ-004-06 | User identification | User ID and username logged | | ⏳ |

**Test Execution Date**: _____________  
**Tester**: _____________  
**Signature**: __��

#### OQ-005: IPQC Testing Module
**Objective**: Verify In-Process Quality Control functionality
**Acceptance Criteria**: IPQC checks can be created, edited, and reported

| Test Case | Description | Expected Result | Actual Result | Status |
|----------|-------------|----------------|---------------|--------|
| OQ-005-01 | Create IPQC check | IPQC record created successfully | | ⏳ |
| OQ-005-02 | Edit IPQC check | Changes saved correctly | | ⏳ |
| OQ-005-03 | Pass/Fail indicators | Test results display correctly | | ⏳ |
| OQ-005-04 | Stage tracking | Production stages tracked | | ⏳ |
| OQ-005-05 | Statistics dashboard | QC statistics display accurately | | ⏳ |

**Test Execution Date**: _____________  
**Tester**: _____________  
**Signature**: _____________

---

## 3. Performance Qualification (PQ)

### 3.1 Purpose
To verify that PharmaQMS performs correctly under actual operating conditions with realistic data volumes and user loads.

### 3.2 Scope
- Load testing with realistic data volumes
- User workflow testing
- System performance under stress
- Data integrity under load
- Backup and recovery testing

### 3.3 Test Scripts

#### PQ-001: Load Testing with Realistic Data
**Objective**: Verify system performance with realistic data volumes
**Acceptance Criteria**: System performs acceptably with expected data volumes

| Test Case | Description | Expected Result | Actual Result | Status |
|----------|-------------|----------------|---------------|--------|
| PQ-001-01 | 100 COA records | System handles 100 COA records efficiently | | ⏳ |
| PQ-001-02 | 500 COA records | System handles 500 COA records efficiently | | ⏳ |
| PQ-001-03 | 1000 COA records | System handles 1000 COA records efficiently | | ⏳ |
| PQ-001-04 | Large batch creation | Large batch records created successfully | | ⏳ |
| PQ-001-05 | Concurrent users | System handles multiple concurrent users | | ⏳ |

**Test Execution Date**: _____________  
**Tester**: _____________  
**Signature**: _____________

#### PQ-002: Data Integrity Under Load
**Objective**: Verify data integrity is maintained under load
**Acceptance Criteria**: No data corruption or loss during load testing

| Test Case | Description | Expected Result | Actual Result | Status |
|----------|-------------|----------------|---------------|--------|
| PQ-002-01 | Data consistency under load | No duplicate or orphaned records | | ⏳ |
| PQ-002-02 | Audit trail integrity | Audit logs remain accurate under load | | ⏳ |
| PQ-002-03 | Soft-delete consistency | Soft-delete logic works under load | | ⏳ |
| PQ-002-04 | Database transaction integrity | Transactions complete atomically | | ⏳ |

**Test Execution Date**: _____________  
**Tester**: _____________  
**Signature**: _____________

#### PQ-003: User Workflow Testing
**Objective**: Verify end-to-end workflows function correctly
**Acceptance Criteria: Critical business processes work from start to finish

| Test Case | Description | Expected Result | Actual Result | Status |
|----------|-------------|----------------|---------------|--------|
| PQ-003-01 | Complete COA lifecycle | COA created → edited → approved → printed | | ⏳ |
| PQ-003-02 | IPQC complete workflow | Check created → results recorded → report generated | | ⏳ |
| PQ-003-03 | Data recovery workflow | Record deleted → recovered → verified | | ⏳ |
| PQ-003-04 | MFA authentication flow | User login → MFA challenge → access granted | | ⏳ |
| PQ-003-05 | Trial to production transition | Trial user → MFA enrollment → production access | | ⏳ |

**Test Execution Date**: _____________  
**Tester**: _____________  
**Signature**: _____________

---

## 4. Validation Report Summary

### 4.1 Overall Results
- **IQ Tests**: ___ / ___ passed
- **OQ Tests**: ___ / ___ passed  
- **PQ Tests**: ___ / ___ passed
- **Overall Pass Rate**: ___%

### 4.2 Critical Findings
| Finding | Severity | Status | Resolution |
|---------|----------|--------|------------|
| | | | |

### 4.3 Non-Critical Findings
| Finding | Severity | Status | Resolution |
|---------|----------|--------|------------|
| | | | |

### 4.4 Recommendations
1. 
2. 
3. 

### 4.5 Validation Conclusion
**Validation Status**: [ ] Pass [ ] Fail [ ] Conditional

**Approved By**: _____________  
**Title**: _____________  
**Date**: _____________  
**Signature**: _____________

---

## 5. Evidence Collection

### 5.1 Required Evidence
- Screenshots of test execution
- System logs from test runs
- Database query results
- Performance metrics
- Audit trail extracts
- Configuration files
- User acceptance feedback

### 5.2 Evidence Storage
- **Location**: `/docs/validation_evidence/`
- **Naming Convention**: `[TEST_ID]_[DATE]_[EVIDENCE_TYPE]`
- **Retention**: 7 years (per 21 CFR Part 11)

---

*Document Reference: GAP-09*  
*Compliance Standards: 21 CFR Part 11, EU GMP Annex 11, ISPE GAMP® Guide*