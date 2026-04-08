// أنواع البيانات الرئيسية للنظام

// ==================== المنتجات الدوائية ====================
export interface PharmaceuticalProduct {
  id: string;
  name: string;
  genericName: string;
  brandName?: string;
  category: ProductCategory;
  dosageForm: DosageForm;
  strength: string;
  manufacturer: string;
  supplier?: string;
  batchNumber: string;
  manufacturingDate: Date;
  expiryDate: Date;
  quantity: number;
  unit: string;
  storageConditions: StorageCondition;
  registrationNumber?: string;
  pharmacopeiaStandard: PharmacopeiaStandard;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

export type ProductCategory =
  | 'API' // Active Pharmaceutical Ingredient
  | 'Finished_Product'
  | 'Excipient'
  | 'Packaging_Material'
  | 'Intermediate'
  | 'Biological'
  | 'Vaccine'
  | 'Herbal'
  | 'Radiopharmaceutical'
  | 'Other'
  | (string & {}); // Allow custom categories

export type DosageForm =
  | 'Tablet'
  | 'Capsule'
  | 'Injection'
  | 'Syrup'
  | 'Suspension'
  | 'Cream'
  | 'Ointment'
  | 'Gel'
  | 'Powder'
  | 'Solution'
  | 'Inhaler'
  | 'Patch'
  | 'Suppository'
  | 'Drops'
  | 'Other'
  | (string & {}); // Allow custom dosage forms

export type StorageCondition =
  | 'Room_Temperature'
  | 'Refrigerated_2_8'
  | 'Frozen_-20'
  | 'Frozen_-80'
  | 'Protect_From_Light'
  | 'Protect_From_Moisture'
  | 'Controlled_Room_Temperature'
  | 'Other'
  | (string & {}); // Allow custom storage conditions

export type PharmacopeiaStandard =
  | 'USP'
  | 'BP'
  | 'EP'
  | 'JP'
  | 'IP'
  | 'PhInt'
  | 'Company_Specification'
  | 'Other'
  | (string & {}); // Allow custom standards

export type ProductStatus =
  | 'Quarantine'
  | 'Approved'
  | 'Rejected'
  | 'Released'
  | 'Blocked'
  | 'Expired'
  | 'Under_Test';

// ==================== الاختبارات والتحاليل ====================
export interface TestMethod {
  id: string;
  name: string;
  description?: string;
  pdfUrl?: string;
  category: TestCategory;
  parameters: TestParameter[];
  pharmacopeiaReference?: string;
  standardProcedure: string;
  procedureDetails?: string; // Detailed instructions for analyst
  acceptanceCriteria: AcceptanceCriteria;
  equipmentRequired: string[];
  reagentsRequired: string[];
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface TestParameter {
  id: string;
  name: string;
  unit?: string;
  minValue?: number;
  maxValue?: number;
  nominalValue?: number;
  tolerance?: number;
  isQualitative: boolean;
  qualitativeOptions?: string[];
}

export type TestCategory =
  | 'Identity'
  | 'Assay'
  | 'Dissolution'
  | 'Uniformity'
  | 'Impurities'
  | 'Microbial'
  | 'Physical'
  | 'Chemical'
  | 'Biological'
  | 'Stability'
  | 'Other';

export interface AcceptanceCriteria {
  min?: number;
  max?: number;
  exact?: number;
  tolerance?: number;
  qualitativePass?: string;
}

export interface TestResult {
  id: string;
  productId: string;
  testMethodId: string;
  batchNumber: string;
  sampleId: string;
  analystId: string;
  testDate: Date;
  completionDate?: Date;
  parameters: ParameterResult[];
  overallResult: TestResultStatus;
  oosInvestigation?: OOSInvestigation;
  reviewedBy?: string;
  reviewDate?: Date;
  approvedBy?: string;
  approvalDate?: Date;
  status: TestStatus;
  notes?: string;
  attachments?: string[];
}

export interface ParameterResult {
  parameterId: string;
  parameterName: string;
  value: number | string;
  unit?: string;
  result: 'Pass' | 'Fail' | 'Pending';
  deviation?: string;
}

export type TestResultStatus = 'Pass' | 'Fail' | 'Pending' | 'OOS';
export type TestStatus = 'Scheduled' | 'In_Progress' | 'Completed' | 'Approved' | 'Rejected';

// ==================== OOS Investigation ====================
export interface OOSInvestigation {
  id: string;
  testResultId: string;
  phase1: Phase1Investigation;
  phase2?: Phase2Investigation;
  conclusion: string;
  capaRequired: boolean;
  capaId?: string;
  closedBy?: string;
  closureDate?: Date;
}

export interface Phase1Investigation {
  laboratoryError: boolean;
  errorType?: string;
  errorDescription?: string;
  analystError: boolean;
  sampleIntegrity: boolean;
  equipmentMalfunction: boolean;
  methodError: boolean;
  investigationDate: Date;
  investigatedBy: string;
}

export interface Phase2Investigation {
  fullScaleInvestigation: boolean;
  manufacturingReview: boolean;
  additionalTesting: boolean;
  retestResults?: TestResult[];
  rootCause?: string;
  investigationDate: Date;
  investigatedBy: string;
}

// ==================== CAPA ====================
export interface CAPA {
  id: string;
  title: string;
  description: string;
  source: CAPASource;
  sourceId?: string;
  priority: CAPAPriority;
  category: CAPACategory;
  rootCause: string;
  correctiveActions: Action[];
  preventiveActions: Action[];
  effectivenessCheck: EffectivenessCheck;
  linkedDocuments?: string[];
  initiatedBy: string;
  initiationDate: Date;
  dueDate: Date;
  completionDate?: Date;
  status: CAPAStatus;
  department: string;
  closedBy?: string;
  signatureIntent?: string;
}

export interface Action {
  id: string;
  description: string;
  assignedTo: string;
  dueDate: Date;
  completionDate?: Date;
  status: ActionStatus;
  evidence?: string[];
}

export interface EffectivenessCheck {
  description: string;
  checkedBy?: string;
  checkDate?: Date;
  result?: 'Effective' | 'Not_Effective' | 'Pending';
}

export type CAPASource = 'OOS' | 'OOT' | 'Deviation' | 'Audit' | 'Complaint' | 'Risk_Assessment' | 'Management_Review';
export type CAPAPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type CAPACategory = 'Laboratory' | 'Manufacturing' | 'Documentation' | 'Equipment' | 'Training' | 'Process' | 'Other';
export type CAPAStatus = 'Open' | 'In_Progress' | 'Pending_Verification' | 'Closed' | 'Cancelled';
export type ActionStatus = 'Not_Started' | 'In_Progress' | 'Completed' | 'Overdue';

// ==================== الانحرافات ====================
export interface Deviation {
  id: string;
  title: string;
  description: string;
  type: DeviationType;
  category: string;
  discoveredBy: string;
  discoveryDate: Date;
  occurrenceDate: Date;
  affectedProduct?: string;
  affectedBatch?: string;
  immediateAction: string;
  rootCause: string;
  impactAssessment: string;
  capaRequired: boolean;
  capaId?: string;
  status: DeviationStatus;
  closedBy?: string;
  closureDate?: Date;
  signatureIntent?: string;
}

export type DeviationType = 'Critical' | 'Major' | 'Minor';
export type DeviationStatus = 'Open' | 'Under_Investigation' | 'Pending_CAPA' | 'Pending_Approval' | 'Closed';

// ==================== المعدات ====================
export interface Equipment {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
  serialNumber: string;
  assetTag: string;
  location: string;
  department: string;
  qualificationStatus: QualificationStatus;
  calibrationSchedule: CalibrationSchedule;
  maintenanceSchedule: MaintenanceSchedule;
  status: EquipmentStatus;
  purchaseDate?: Date;
  warrantyExpiry?: Date;
  documents: EquipmentDocument[];
}

export interface QualificationStatus {
  iq: boolean; // Installation Qualification
  iqDate?: Date;
  oq: boolean; // Operational Qualification
  oqDate?: Date;
  pq: boolean; // Performance Qualification
  pqDate?: Date;
}

export interface CalibrationSchedule {
  frequency: number; // in days
  lastCalibration?: Date;
  nextCalibration?: Date;
  calibrationProcedure: string;
  tolerance?: number;
}

export interface MaintenanceSchedule {
  preventiveFrequency: number; // in days
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  maintenanceProcedure: string;
}

export interface EquipmentDocument {
  id: string;
  type: 'Manual' | 'SOP' | 'Qualification' | 'Calibration' | 'Maintenance' | 'Other';
  name: string;
  filePath: string;
  uploadDate: Date;
}

export type EquipmentStatus = 'Active' | 'Inactive' | 'Under_Maintenance' | 'Out_Of_Service' | 'Retired';

// ==================== المواد الكيميائية والمعايير ====================
export interface ChemicalReagent {
  id: string;
  name: string;
  casNumber?: string;
  grade: ReagentGrade;
  manufacturer: string;
  supplier: string;
  batchNumber: string;
  quantity: number;
  unit: string;
  storageConditions: string;
  expiryDate: Date;
  dateReceived: Date;
  location: string;
  safetyInfo: SafetyInfo;
  status: ReagentStatus;
}

export interface ReferenceStandard {
  id: string;
  name: string;
  lotNumber: string;
  purity?: number;
  potency?: number;
  expiryDate: Date;
  dateReceived: Date;
  storageConditions: string;
  certificateOfAnalysis?: string;
  status: 'Active' | 'Expired' | 'Depleted';
}

export type ReagentGrade = 'ACS' | 'Reagent' | 'Pharmaceutical' | 'HPLC' | 'GC' | 'Spectrophotometric' | 'Other';
export type ReagentStatus = 'Available' | 'Low_Stock' | 'Expired' | 'Depleted';

export interface SafetyInfo {
  hazardClass?: string;
  hazardStatements: string[];
  precautionaryStatements: string[];
  sdsFile?: string;
}

// ==================== أنظمة الجودة ====================
export interface QualitySystem {
  id: string;
  name: string;
  code: string; // GMP, GDP, GLP, etc.
  description: string;
  version: string;
  effectiveDate: Date;
  documents: QualityDocument[];
  trainingRequired: boolean;
  status: 'Active' | 'Under_Review' | 'Superseded';
}

export interface QualityDocument {
  id: string;
  documentNumber: string;
  title: string;
  type: DocumentType;
  version: string;
  effectiveDate: Date;
  reviewDate: Date;
  department: string;
  filePath: string;
  status: DocumentStatus;
}

export type DocumentType = 'Policy' | 'SOP' | 'Work_Instruction' | 'Form' | 'Specification' | 'Protocol' | 'Report' | 'Other';
export type DocumentStatus = 'Draft' | 'Under_Review' | 'Approved' | 'Effective' | 'Superseded' | 'Obsolete';

// ==================== التدريب والكفاءة ====================
export interface TrainingRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  trainingTitle: string;
  trainingType: TrainingType;
  description: string;
  conductedBy: string;
  trainingDate: Date;
  completionDate?: Date;
  expiryDate?: Date;
  status: TrainingStatus;
  score?: number;
  certificate?: string;
  competencyVerified: boolean;
}

export type TrainingType = 'Onboarding' | 'SOP' | 'Technical' | 'Safety' | 'Quality' | 'Regulatory' | 'Refresher';
export type TrainingStatus = 'Scheduled' | 'In_Progress' | 'Completed' | 'Overdue' | 'Cancelled';

// ==================== التدقيق والمراجعة ====================
export interface Audit {
  id: string;
  auditNumber: string;
  type: AuditType;
  scope: string;
  area: string;
  auditors: string[];
  auditees: string[];
  scheduledDate: Date;
  completionDate?: Date;
  findings: AuditFinding[];
  status: AuditStatus;
  report?: string;
}

export interface AuditFinding {
  id: string;
  category: FindingCategory;
  description: string;
  reference: string;
  correctiveAction?: string;
  capaId?: string;
  dueDate?: Date;
  closureDate?: Date;
  status: FindingStatus;
}

export type AuditType = 'Internal' | 'External' | 'Regulatory' | 'Supplier' | 'Certification';
export type FindingCategory = 'Critical' | 'Major' | 'Minor' | 'Observation';
export type AuditStatus = 'Planned' | 'In_Progress' | 'Pending_Report' | 'Closed';
export type FindingStatus = 'Open' | 'In_Progress' | 'Pending_Verification' | 'Closed';

// ==================== الموردين ====================
export interface Supplier {
  id: string;
  name: string;
  type: SupplierType;
  address: string;
  contactPerson: string;
  email: string;
  phone: string;
  products: string[];
  qualificationStatus: SupplierQualificationStatus;
  auditDate?: Date;
  nextAuditDate?: Date;
  rating?: number;
  documents: SupplierDocument[];
  status: 'Active' | 'Inactive' | 'Suspended';
}

export interface SupplierDocument {
  id: string;
  type: string;
  name: string;
  expiryDate?: Date;
  filePath: string;
}

export type SupplierType = 'API' | 'Excipient' | 'Packaging' | 'Equipment' | 'Service' | 'Laboratory';
export type SupplierQualificationStatus = 'Approved' | 'Conditional' | 'Pending' | 'Rejected';

// ==================== إعدادات النظام ====================
export interface SystemSettings {
  companyName: string;
  companyLogo?: string;
  defaultPharmacopeia: PharmacopeiaStandard;
  dateFormat: string;
  timeZone: string;
  language: string;
  emailNotifications: boolean;
  oosNotification: boolean;
  deviationNotification: boolean;
  capaNotification: boolean;
  expiryNotificationDays: number;
  calibrationNotificationDays: number;
}

// ==================== إحصائيات الداش بورد ====================
export interface DashboardStats {
  totalProducts: number;
  productsByStatus: Record<ProductStatus, number>;
  pendingTests: number;
  oosCount: number;
  openDeviations: number;
  openCAPAs: number;
  upcomingCalibrations: number;
  expiringProducts: number;
  openComplaints: number;
  activeRecalls: number;
  recentActivities: Activity[];
}

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  user: string;
  timestamp: Date;
  relatedId?: string;
}

export type ActivityType =
  | 'Product_Created'
  | 'Product_Updated'
  | 'Test_Completed'
  | 'OOS_Investigation'
  | 'Deviation_Created'
  | 'CAPA_Created'
  | 'CAPA_Closed'
  | 'Document_Approved'
  | 'Training_Completed'
  | 'Audit_Completed'
  | 'Complaint_Created'
  | 'Recall_Initiated';

// ==================== شكاوى السوق ====================
export interface MarketComplaint {
  id: string;
  complaintNumber: string;
  receivedDate: Date;
  complainantName: string;
  complainantContact: string;
  productName: string;
  batchNumber: string;
  expiryDate: Date;
  complaintType: ComplaintType;
  description: string;
  severity: 'Critical' | 'Major' | 'Minor';
  sampleReceived: boolean;
  sampleCondition?: string;
  investigationDetails?: string;
  rootCause?: string;
  capaRequired: boolean;
  capaId?: string;
  disposition: string;
  status: ComplaintStatus;
  closedDate?: Date;
  closedBy?: string;
}

export type ComplaintType = 'Quality' | 'Safety' | 'Efficacy' | 'Packaging' | 'Other';
export type ComplaintStatus = 'Open' | 'Under_Investigation' | 'Responded' | 'Closed' | 'Invalid';

export interface RecallUpdate {
  id: string;
  date: Date;
  content: string;
  user: string;
}

// ==================== استدعاء المنتجات ====================
export interface ProductRecall {
  id: string;
  recallNumber: string;
  initiationDate: Date;
  productName: string;
  batchNumbers: string[];
  recallClassification: 'Class_I' | 'Class_II' | 'Class_III';
  recallStrategy: string;
  reasonForRecall: string;
  recommendations?: string;
  updates?: RecallUpdate[];
  sourceOfIssue: 'Complaint' | 'Internal_Audit' | 'Regulatory' | 'Stability_Failure' | 'OOS';
  sourceId?: string;
  totalQuantityDistributed: number;
  totalQuantityRecovered: number;
  healthHazardAssessment: string;
  pressReleaseRequired: boolean;
  regulatoryNotified: boolean;
  closureDate?: Date;
  status: RecallStatus;
}

export type RecallStatus = 'Draft' | 'In_Progress' | 'Completed' | 'Terminated' | 'Follow_Up';

// ==================== المعايير الدستورية ====================
export interface PharmacopeiaMonograph {
  id: string;
  pharmacopeia: PharmacopeiaStandard;
  monographNumber: string;
  productName: string;
  category: string;
  tests: MonographTest[];
  version: string;
  effectiveDate: Date;
  attachments?: {
    name: string;
    url: string;
    type: 'Link' | 'File' | 'Method';
  }[];
}

export interface MonographTest {
  testName: string;
  procedure: string;
  acceptanceCriteria: string;
  reference?: string;
}

// ==================== سجل التغييرات ====================
export interface ChangeControl {
  id: string;
  changeNumber: string;
  title: string;
  description: string;
  type: ChangeType;
  category: string;
  requestedBy: string;
  requestDate: Date;
  impactAssessment: string;
  affectedDocuments: string[];
  affectedProducts: string[];
  implementationPlan: string;
  trainingRequired: boolean;
  approvedBy?: string;
  approvalDate?: Date;
  implementationDate?: Date;
  status: ChangeStatus;
}

export type ChangeType = 'Minor' | 'Major' | 'Critical';
export type ChangeStatus = 'Draft' | 'Under_Review' | 'Approved' | 'Implemented' | 'Closed';

// ==================== دراسات الثبات (Stability) ====================
export interface StabilityProtocol {
  id: string;
  protocolNumber: string;
  productId: string;
  productName: string;
  batchNumber: string;
  studyType: StabilityStudyType;
  storageConditions: StabilityCondition[];
  timePoints: StabilityTimePoint[];
  tests: { testId: string; specification?: string }[]; // IDs with optional custom specs
  packagingType: string;
  sampleQuantity: number;
  manufacturingDate: Date;
  expiryDate: Date;
  initiationDate: Date;
  status: StabilityStatus;
  approvalDate?: Date;
  approvedBy?: string;
  documents?: string[]; // Paths to protocol documents
  trends?: StabilityTrend[];
}

export type StabilityStudyType = 'Long_Term' | 'Accelerated' | 'Intermediate' | 'Photo_Stability' | 'Forced_Degradation' | 'In_Use' | 'Other';
export type StabilityStatus = 'Draft' | 'Pending_Approval' | 'Active' | 'Completed' | 'Terminated';
export type TimePointStatus = 'Pending' | 'Scheduled' | 'Pulled' | 'Testing' | 'Completed' | 'OOS' | 'OOT' | 'Skipped';

export interface StabilityCondition {
  id: string;
  condition: string; // e.g., "25°C ± 2°C / 60% RH ± 5% RH"
  zone: string; // e.g., "Zone I", "Zone II", "Zone III", "Zone IVb"
}

export interface StabilityTimePoint {
  id: string;
  label: string; // e.g., "Initial", "3 Months", "6 Months"
  month: number; // 0, 3, 6, 9, 12, etc.
  scheduledDate: Date;
  windowDays: number; // e.g., +/- 7 days
  status: TimePointStatus;
  pullDate?: Date;
  testResultId?: string; // Link to TestResult
}

export interface StabilityTrend {
  parameterId: string;
  parameterName: string;
  dataPoints: { timePoint: number; value: number }[];
  regressionLine?: { slope: number; intercept: number; rSquared: number };
  shelfLifePrediction?: number; // predicted months
}

// ==================== IPQC (In-Process Quality Control) ====================
export interface IPQCCheck {
  id: string;
  batchNumber: string;
  productName: string;
  dosageForm: 'Tablet' | 'Liquid' | 'Powder' | 'Capsule';
  stage: 'Dispensing' | 'Mixing' | 'Granulation' | 'Drying' | 'Compression' | 'Coating' | 'Packaging' | 'Filling' | 'Sealing';
  checkType: string;
  parameter: string;
  specification: string;
  result: string;
  samples?: number[];
  status: 'Pass' | 'Fail' | 'Pending';
  checkedBy: string;
  reviewedBy?: string;
  checkedAt: Date;
  notes?: string;
}

// ==================== COA Manager ====================
export type COAType = 'Finished Product' | 'Raw Material' | 'Water Analysis' | 'Microbiology' | 'Utilities' | 'Stability';

export interface COATestResult {
  test: string;
  specification: string;
  result: string;
  status: 'Pass' | 'Fail' | 'Pending' | 'N/A';
}

export interface COARecord {
  id: string;
  type: COAType;
  coaNumber: string;
  analysisNo: string;
  productName: string;
  strength: string;
  dosageForm: string;
  batchNumber: string;
  batchSize: string;
  manufacturingDate: string;
  receivingDate?: string;
  analysisDate?: string;
  issueDate: string;
  expiryDate: string;
  manufacturer: string;
  address: string;
  testResults: COATestResult[];
  marketComplaintStatus: string;
  analyzedBy: string;
  checkedBy: string;
  approvedBy: string;
  status: 'Draft' | 'Approved' | 'Released';
}

export * from './materials';
