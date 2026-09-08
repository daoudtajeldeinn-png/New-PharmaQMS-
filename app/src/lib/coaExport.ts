import type { RawMaterial } from '@/types/materials';
import type { Equipment, EquipmentQualification } from '@/types';
import { QualificationService } from '@/services/QualificationService';

interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
}

function loadCompanySettings(): CompanySettings {
  try {
    const stored = localStorage.getItem('pqms_company_settings');
    if (stored) return JSON.parse(stored);
  } catch { /* fallback */ }
  return {
    name: 'Company Name',
    address: 'Company Address',
    phone: '',
    email: '',
  };
}

function formatDate(d?: string): string {
  if (!d) return '-';
  return d.split('T')[0];
}

export function generateCOA(material: RawMaterial): void {
  const coaContent = `
CERTIFICATE OF ANALYSIS
=======================

Material: ${material.name}
Batch Number: ${material.batchNumber}
Supplier: ${material.supplier}
Pharmacopeia: ${material.pharmacopeia}
Manufacturing Date: ${formatDate(material.receivedDate)}
Expiry Date: ${formatDate(material.expiryDate)}

TEST RESULTS:
${'='.repeat(50)}

${material.tests.map(test => `
Test: ${test.name} (${test.department || 'General'})
Specification: ${test.spec}
Method: ${test.method}
Result: ${test.result || 'N/A'}
Status: ${test.status}
`).join('\n')}

${'='.repeat(50)}
Final Status: ${material.status}
Analyst: _________________    Date: ${new Date().toISOString().split('T')[0]}
Reviewer: _________________   Date: _______________
  `.trim();

  const blob = new Blob([coaContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `COA-${material.batchNumber}-${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function generateCOAPDF(material: RawMaterial): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const company = loadCompanySettings();
  const isApproved = material.status === 'Approved';

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  // ── Outer border ──
  doc.setLineWidth(0.5);
  doc.rect(5, 5, 200, 287);

  // ── Header ──
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.text(company.name.toUpperCase(), 105, 18, { align: 'center' });

  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  doc.text(company.address, 105, 24, { align: 'center' });

  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('QUALITY CONTROL DEPARTMENT', 105, 31, { align: 'center' });

  // Double line
  doc.setLineWidth(1);
  doc.line(15, 34, 195, 34);
  doc.line(15, 35.5, 195, 35.5);
  doc.setLineWidth(0.3);

  // Title
  doc.setFontSize(17);
  doc.text('CERTIFICATE OF ANALYSIS', 105, 44, { align: 'center' });
  doc.line(60, 46, 150, 46);

  // ── Info box ──
  doc.setLineWidth(0.5);
  doc.rect(15, 52, 180, 52);

  // Vertical divider
  doc.line(105, 52, 105, 104);

  // Horizontal dividers inside box
  const rows = [60, 68, 76, 84, 92, 100];
  rows.forEach(y => doc.line(15, y, 195, y));

  doc.setFont('times', 'bold');
  doc.setFontSize(9);

  const leftLabel = 17;
  const leftValue = 60;
  const rightLabel = 107;
  const rightValue = 150;

  const fields = [
    ['Product/Material:', material.name, 'Batch Number:', material.batchNumber],
    ['Generic Name:', material.pharmacopeia, 'Supplier:', material.supplier],
    ['Analysis No:', '-', 'Batch/Lot Size:', '-'],
    ['Received Date:', formatDate(material.receivedDate), 'Expiry Date:', formatDate(material.expiryDate)],
    ['Issue Date:', new Date().toISOString().split('T')[0], 'Final Status:', material.status.toUpperCase()],
  ];

  fields.forEach((row, i) => {
    const y = 58 + i * 8;
    doc.setFont('times', 'bold');
    doc.text(row[0], leftLabel, y);
    doc.setFont('times', 'normal');
    doc.text(String(row[1] || '-').substring(0, 22), leftValue, y);
    doc.setFont('times', 'bold');
    doc.text(row[2], rightLabel, y);
    doc.setFont('times', 'normal');

    // Color final status
    if (row[2] === 'Final Status:') {
      doc.setTextColor(isApproved ? 0 : 200, isApproved ? 128 : 0, 0);
    }
    doc.text(String(row[3] || '-').substring(0, 22), rightValue, y);
    doc.setTextColor(0, 0, 0);
  });

  // ── Analytical Results header ──
  let y = 112;
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.text('ANALYTICAL RESULTS:', 15, y);
  doc.line(15, y + 1, 75, y + 1);

  // Table header
  y += 5;
  doc.setFillColor(230, 230, 230);
  doc.rect(15, y, 180, 8, 'F');
  doc.rect(15, y, 180, 8);
  doc.line(80, y, 80, y + 8);
  doc.line(130, y, 130, y + 8);
  doc.line(163, y, 163, y + 8);

  doc.setFontSize(9);
  doc.text('Test Parameter', 17, y + 5);
  doc.text('Specification', 82, y + 5);
  doc.text('Observed Result', 132, y + 5);
  doc.text('Inference', 165, y + 5);

  // Table rows
  y += 8;
  doc.setFont('times', 'normal');
  doc.setFontSize(9);

  material.tests.forEach(test => {
    if (y > 248) {
      doc.addPage();
      doc.setLineWidth(0.5);
      doc.rect(5, 5, 200, 287);
      y = 20;
    }

    const rowH = 9;
    doc.rect(15, y, 180, rowH);
    doc.line(80, y, 80, y + rowH);
    doc.line(130, y, 130, y + rowH);
    doc.line(163, y, 163, y + rowH);

    doc.setFont('times', 'bold');
    doc.text(String(test.name || '').substring(0, 28), 17, y + 6);
    doc.setFont('times', 'normal');
    doc.text(String(test.spec || '').substring(0, 24), 82, y + 6);
    doc.setFont('times', 'bold');
    doc.text(String(test.result || '-').substring(0, 16), 132, y + 6);

    const inference = test.status === 'Pass' ? 'COMPLIES' : test.status === 'Fail' ? 'DOES NOT COMPLY' : test.status;
    if (test.status === 'Pass') doc.setTextColor(0, 128, 0);
    else if (test.status === 'Fail') doc.setTextColor(200, 0, 0);
    doc.text(inference.substring(0, 14), 165, y + 6);
    doc.setTextColor(0, 0, 0);

    y += rowH;
  });

  // ── Compliance statement ──
  y += 6;
  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  doc.setLineWidth(0.3);
  doc.rect(15, y, 180, 14);
  doc.text(
    `Compliance Statement: The batch mentioned above has been analyzed as per the specifications of ${material.pharmacopeia} and is found to be ${isApproved ? 'COMPLYING' : 'NOT COMPLYING'} with the standards.`,
    18, y + 5, { maxWidth: 174 }
  );

  // ── Signatures ──
  y = Math.max(y + 22, 255);
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.setLineWidth(0.5);

  doc.line(20, y, 70, y);
  doc.line(82, y, 132, y);
  doc.line(144, y, 194, y);

  doc.text('Analyzed By', 45, y + 5, { align: 'center' });
  doc.text('Checked By', 107, y + 5, { align: 'center' });
  doc.text('QA Manager (Approved)', 169, y + 5, { align: 'center' });

  doc.save(`COA-${material.batchNumber}-${new Date().toISOString().split('T')[0]}.pdf`);
}

export async function generateInventoryReportPDF(materials: RawMaterial[]): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const company = loadCompanySettings();

  doc.setLineWidth(0.5);
  doc.rect(5, 5, 200, 287);

  doc.setFont('times', 'bold');
  doc.setFontSize(20);
  doc.text(company.name.toUpperCase(), 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('times', 'italic');
  doc.text(company.address, 105, 26, { align: 'center' });
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.text('MATERIAL INVENTORY STOCK REPORT', 105, 35, { align: 'center' });
  doc.setLineWidth(0.8);
  doc.line(20, 38, 190, 38);

  doc.setFontSize(10);
  doc.setFont('times', 'normal');
  doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 155, 45);

  let y = 55;
  doc.setFont('times', 'bold');
  doc.setFillColor(230, 230, 230);
  doc.rect(15, y, 180, 8, 'F');
  doc.rect(15, y, 180, 8);
  doc.text('Material Name', 20, y + 5);
  doc.text('Batch No', 75, y + 5);
  doc.text('Type', 110, y + 5);
  doc.text('Quantity', 140, y + 5);
  doc.text('Status', 170, y + 5);

  y += 8;
  doc.setFont('times', 'normal');

  materials.forEach(material => {
    if (y > 260) {
      doc.addPage();
      doc.setLineWidth(0.5);
      doc.rect(5, 5, 200, 287);
      y = 20;
    }
    doc.rect(15, y, 180, 8);
    doc.text(String(material.name || '').substring(0, 30), 20, y + 5);
    doc.text(String(material.batchNumber || '').substring(0, 20), 75, y + 5);
    doc.text(String(material.type || ''), 110, y + 5);
    doc.text(`${material.quantity || 0} ${material.unit || ''}`, 140, y + 5);
    doc.text(String(material.status || ''), 170, y + 5);
    y += 8;
  });

  doc.setFont('times', 'italic');
  doc.text(`Total Items: ${materials.length}`, 20, y + 10);
  doc.save(`Material-Inventory-Report-${new Date().toISOString().split('T')[0]}.pdf`);
}

export async function generateAnalyticalWorksheet(material: RawMaterial): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const company = loadCompanySettings();

  doc.setLineWidth(0.5);
  doc.rect(5, 5, 200, 287);

  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.text(company.name.toUpperCase(), 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('times', 'italic');
  doc.text(company.address, 105, 26, { align: 'center' });
  doc.setLineWidth(0.5);
  doc.line(20, 30, 190, 30);

  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text('ANALYTICAL WORKSHEET', 105, 37, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.text(`Material Name:`, 15, 47);
  doc.setFont('times', 'bold');
  doc.text(`${material.name}`, 50, 47);
  doc.setFont('times', 'normal');
  doc.text(`Batch Number:`, 15, 55);
  doc.setFont('times', 'bold');
  doc.text(`${material.batchNumber}`, 50, 55);
  doc.setFont('times', 'normal');
  doc.text(`Type:`, 130, 47);
  doc.text(`${material.type}`, 160, 47);
  doc.text(`Status:`, 130, 55);
  doc.text(`${material.status}`, 160, 55);

  let y = 65;
  doc.setFont('times', 'bold');
  doc.setFillColor(230, 230, 230);
  doc.rect(15, y, 180, 8, 'F');
  doc.rect(15, y, 180, 8);
  doc.text('Test Parameter', 20, y + 5);
  doc.text('Specification', 80, y + 5);
  doc.text('Result', 140, y + 5);
  doc.text('Status', 170, y + 5);

  y += 8;
  doc.setFont('times', 'normal');

  if (material.tests && material.tests.length > 0) {
    material.tests.forEach(test => {
      if (y > 250) {
        doc.addPage();
        doc.rect(5, 5, 200, 287);
        y = 20;
      }
      doc.rect(15, y, 180, 10);
      doc.text(String(test.name || '').substring(0, 30), 20, y + 6);
      doc.text(String(test.spec || '').substring(0, 30), 80, y + 6);
      doc.text(String(test.result || '').substring(0, 20), 140, y + 6);
      doc.text(String(test.status || ''), 170, y + 6);
      y += 10;
    });
  } else {
    doc.text('No tests assigned.', 20, y + 10);
    y += 10;
  }

  y += 20;
  doc.line(15, y, 70, y);
  doc.text('Analyst Signature & Date', 15, y + 5);
  doc.line(125, y, 180, y);
  doc.text('Reviewer Signature & Date', 125, y + 5);

  doc.save(`Analytical-Worksheet-${material.batchNumber}.pdf`);
}

export async function generateQualificationCertificate(
  equipment: Equipment,
  qualifications: EquipmentQualification[]
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const company = loadCompanySettings();
  const overallStatus = QualificationService.calculateOverallStatus(qualifications);
  const alerts = QualificationService.getRequalificationAlerts(qualifications);

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  // Outer Border
  doc.setLineWidth(0.5);
  doc.rect(5, 5, 200, 287);

  // Header
  doc.setFont('times', 'bold');
  doc.setFontSize(20);
  doc.text(company.name.toUpperCase(), 105, 18, { align: 'center' });

  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  doc.text(company.address, 105, 24, { align: 'center' });

  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('QUALITY ASSURANCE & VALIDATION DEPARTMENT', 105, 31, { align: 'center' });

  // Double Divider Line
  doc.setLineWidth(0.8);
  doc.line(15, 34, 195, 34);
  doc.line(15, 35.5, 195, 35.5);
  doc.setLineWidth(0.3);

  // Certificate Title
  doc.setFontSize(15);
  doc.text('EQUIPMENT QUALIFICATION CERTIFICATE', 105, 43, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('times', 'normal');
  doc.text('Regulatory Standard: EU GMP Annex 15 §10-§11 | 21 CFR 211.68', 105, 48, { align: 'center' });

  // Equipment Details Box
  doc.rect(15, 53, 180, 42);
  doc.line(105, 53, 105, 95);
  [60, 67, 74, 81, 88].forEach(y => doc.line(15, y, 195, y));

  const leftLabel = 18;
  const leftVal = 55;
  const rightLabel = 108;
  const rightVal = 145;

  const infoRows = [
    ['Equipment Name:', equipment.name || '-', 'Asset Tag:', equipment.assetTag || '-'],
    ['Model Number:', equipment.model || '-', 'Serial Number:', equipment.serialNumber || '-'],
    ['Manufacturer:', equipment.manufacturer || '-', 'Department:', equipment.department || '-'],
    ['Location / Room:', equipment.location || '-', 'Current Status:', equipment.status || '-'],
    ['Certificate Date:', new Date().toISOString().split('T')[0], 'Overall Status:', overallStatus.toUpperCase()],
  ];

  doc.setFont('times', 'bold');
  doc.setFontSize(9);

  infoRows.forEach((row, i) => {
    const y = 58 + i * 7;
    doc.setFont('times', 'bold');
    doc.text(row[0], leftLabel, y);
    doc.setFont('times', 'normal');
    doc.text(String(row[1]).substring(0, 26), leftVal, y);

    doc.setFont('times', 'bold');
    doc.text(row[2], rightLabel, y);

    if (i === 4) {
      if (overallStatus === 'Fully Qualified') doc.setTextColor(0, 130, 0);
      else if (overallStatus === 'Qualification Failed') doc.setTextColor(190, 0, 0);
      else doc.setTextColor(180, 110, 0);
      doc.setFont('times', 'bold');
      doc.text(String(row[3]), rightVal, y);
      doc.setTextColor(0, 0, 0);
      doc.setFont('times', 'normal');
    } else {
      doc.setFont('times', 'normal');
      doc.text(String(row[3]).substring(0, 26), rightVal, y);
    }
  });

  // Phases Table Header
  let y = 105;
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('QUALIFICATION PHASES SUMMARY (DQ / IQ / OQ / PQ)', 15, y);

  y += 4;
  doc.setFillColor(235, 238, 242);
  doc.rect(15, y, 180, 8, 'F');
  doc.rect(15, y, 180, 8);
  doc.setFontSize(9);
  doc.text('Phase', 18, y + 5.5);
  doc.text('Protocol #', 38, y + 5.5);
  doc.text('Qual. Date', 75, y + 5.5);
  doc.text('Performed By', 105, y + 5.5);
  doc.text('Approved By', 135, y + 5.5);
  doc.text('Result', 165, y + 5.5);

  const phaseNames: Record<string, string> = {
    DQ: 'DQ - Design Qual.',
    IQ: 'IQ - Installation Qual.',
    OQ: 'OQ - Operational Qual.',
    PQ: 'PQ - Performance Qual.',
  };

  const allPhases = ['DQ', 'IQ', 'OQ', 'PQ'] as const;

  allPhases.forEach(phase => {
    y += 8;
    const q = qualifications.find(item => item.phase === phase && !item.is_deleted);
    doc.rect(15, y, 180, 8);
    doc.setFont('times', 'bold');
    doc.text(phaseNames[phase], 18, y + 5.5);
    doc.setFont('times', 'normal');

    if (q) {
      doc.text(String(q.protocol_number || q.protocolNumber || '-').substring(0, 18), 38, y + 5.5);
      const qDate = q.qualification_date || q.qualificationDate;
      doc.text(qDate ? String(qDate).split('T')[0] : '-', 75, y + 5.5);
      doc.text(String(q.performed_by || q.performedBy || '-').substring(0, 15), 105, y + 5.5);
      doc.text(String(q.approved_by || q.approvedBy || '-').substring(0, 15), 135, y + 5.5);

      if (q.result === 'Pass') {
        doc.setTextColor(0, 120, 0);
        doc.setFont('times', 'bold');
        doc.text('PASS', 165, y + 5.5);
      } else if (q.result === 'Fail') {
        doc.setTextColor(190, 0, 0);
        doc.setFont('times', 'bold');
        doc.text('FAIL', 165, y + 5.5);
      } else {
        doc.setTextColor(150, 100, 0);
        doc.text('PENDING', 165, y + 5.5);
      }
      doc.setTextColor(0, 0, 0);
      doc.setFont('times', 'normal');
    } else {
      doc.setTextColor(120, 120, 120);
      doc.text('Not Initiated', 38, y + 5.5);
      doc.text('-', 75, y + 5.5);
      doc.text('-', 105, y + 5.5);
      doc.text('-', 135, y + 5.5);
      doc.text('PENDING', 165, y + 5.5);
      doc.setTextColor(0, 0, 0);
    }
  });

  // Requalification Schedule Box
  y += 16;
  doc.setFillColor(248, 249, 250);
  doc.rect(15, y, 180, 24, 'F');
  doc.rect(15, y, 180, 24);

  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.text('REQUALIFICATION ASSESSMENT & EXPIRY', 19, y + 6);
  doc.setFontSize(9);
  doc.setFont('times', 'normal');

  const nextDateStr = alerts.nextDate ? alerts.nextDate.toISOString().split('T')[0] : 'Not Scheduled';
  doc.text(`Next Requalification Due Date: ${nextDateStr}`, 19, y + 13);

  if (alerts.isOverdue) {
    doc.setTextColor(190, 0, 0);
    doc.setFont('times', 'bold');
    doc.text(`ALERT: Requalification is OVERDUE by ${Math.abs(alerts.daysRemaining || 0)} day(s)!`, 19, y + 19);
    doc.setTextColor(0, 0, 0);
  } else if (alerts.isDueSoon) {
    doc.setTextColor(180, 110, 0);
    doc.setFont('times', 'bold');
    doc.text(`NOTICE: Requalification due in ${alerts.daysRemaining} day(s). Initiate protocol renewal.`, 19, y + 19);
    doc.setTextColor(0, 0, 0);
  } else {
    doc.text('Status: Equipment operating within valid qualification lifecycle parameters.', 19, y + 19);
  }

  // Regulatory Statement
  y += 32;
  doc.setFont('times', 'italic');
  doc.setFontSize(8.5);
  doc.text(
    'This certificate confirms that the equipment stated above has been evaluated in accordance with approved',
    15,
    y
  );
  doc.text(
    'validation protocols and meets the established acceptance criteria pursuant to EU GMP Annex 15 and 21 CFR Part 11.',
    15,
    y + 4.5
  );

  // Signatures
  y += 22;
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.line(15, y, 65, y);
  doc.text('Validation Engineer', 15, y + 4);
  doc.setFont('times', 'normal');
  doc.text('Date: ________________', 15, y + 8);

  doc.line(75, y, 125, y);
  doc.setFont('times', 'bold');
  doc.text('Head of Engineering', 75, y + 4);
  doc.setFont('times', 'normal');
  doc.text('Date: ________________', 75, y + 8);

  doc.line(135, y, 185, y);
  doc.setFont('times', 'bold');
  doc.text('Quality Assurance Manager', 135, y + 4);
  doc.setFont('times', 'normal');
  doc.text('Date: ________________', 135, y + 8);

  // Bottom Notice
  doc.setFontSize(8);
  doc.setFont('times', 'italic');
  doc.text('Computer Generated Document — Verified via PharmaQMS Validation Engine', 105, 280, {
    align: 'center',
  });

  const filename = `Qualification-Certificate-${(equipment.assetTag || equipment.name || 'EQ').replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}

