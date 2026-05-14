import type { RawMaterial } from '@/types/materials';

export function generateCOA(material: RawMaterial): void {
  const coaContent = `
CERTIFICATE OF ANALYSIS
=======================

Material: ${material.name}
Batch Number: ${material.batchNumber}
Supplier: ${material.supplier}
Pharmacopeia: ${material.pharmacopeia}
Manufacturing Date: ${material.receivedDate}
Expiry Date: ${material.expiryDate}

TEST RESULTS:
${'='.repeat(50)}

${material.tests.map(test => `
Test: ${test.name}
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
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  // Outer Border
  doc.setLineWidth(0.5);
  doc.rect(5, 5, 200, 287);

  // Header Section
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.text('PHARMA CORP', 105, 20, { align: 'center' });

  doc.setFont('times', 'italic');
  doc.setFontSize(10);
  doc.text('Industrial Zone, Phase 2, Pharmaceutical District', 105, 25, { align: 'center' });

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('QUALITY CONTROL DEPARTMENT', 105, 32, { align: 'center' });

  doc.setLineWidth(1);
  doc.line(20, 35, 190, 35);
  doc.line(20, 36, 190, 36);

  doc.setFontSize(18);
  doc.text('CERTIFICATE OF ANALYSIS', 105, 45, { align: 'center' });
  doc.line(75, 47, 135, 47);

  // Material Info Box
  doc.setLineWidth(0.3);
  doc.rect(15, 55, 180, 40);

  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.text(`Material Name:`, 20, 62);
  doc.setFont('times', 'bold');
  doc.text(`${material.name}`, 50, 62);

  doc.setFont('times', 'normal');
  doc.text(`Batch Number:`, 20, 70);
  doc.setFont('times', 'bold');
  doc.text(`${material.batchNumber}`, 50, 70);

  doc.setFont('times', 'normal');
  doc.text(`Supplier:`, 20, 78);
  doc.text(`${material.supplier}`, 50, 78);

  doc.text(`Pharmacopeia:`, 110, 62);
  doc.text(`${material.pharmacopeia}`, 145, 62);

  doc.text(`Received Date:`, 110, 70);
  doc.text(`${material.receivedDate || '-'}`, 145, 70);

  doc.text(`Expiry Date:`, 110, 78);
  doc.text(`${material.expiryDate || '-'}`, 145, 78);

  doc.text(`Final Status:`, 20, 88);
  doc.setFontSize(12);
  const isApproved = material.status === 'Approved';
  if (isApproved) {
    doc.setTextColor(0, 128, 0);
  } else {
    doc.setTextColor(255, 0, 0);
  }
  doc.text(`${material.status.toUpperCase()}`, 50, 88);
  doc.setTextColor(0, 0, 0);

  // Test Results Table Header
  let y = 105;
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setFillColor(240, 240, 240);
  doc.rect(15, y, 180, 8, 'F');
  doc.rect(15, y, 180, 8);
  doc.text('Test Parameter', 20, y + 5);
  doc.text('Specification', 75, y + 5);
  doc.text('Result', 135, y + 5);
  doc.text('Inference', 170, y + 5);

  y += 8;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);

  material.tests.forEach(test => {
    // Check if we need a new page
    if (y > 250) {
      doc.addPage();
      doc.setLineWidth(0.5);
      doc.rect(5, 5, 200, 287);
      y = 20;
    }

    doc.rect(15, y, 180, 10);
    doc.text(test.name.substring(0, 35), 20, y + 6);
    doc.text(test.spec.substring(0, 35), 75, y + 6);
    doc.setFont('times', 'bold');
    doc.text(String(test.result || '-').substring(0, 30), 135, y + 6);
    doc.text(test.status === 'Pass' ? 'COMPLIES' : test.status === 'Fail' ? 'FAILS' : test.status, 170, y + 6);
    doc.setFont('times', 'normal');
    y += 10;
  });

  // Compliance Statement
  y += 10;
  doc.setFont('times', 'italic');
  doc.setFontSize(10);
  doc.text(`Compliance Statement: The batch mentioned above has been analyzed as per the specifications of ${material.pharmacopeia} and is found to be ${isApproved ? 'COMPLYING' : 'NOT COMPLYING'} with the standards.`, 15, y, { maxWidth: 180 });

  // Signatures
  y = 265;
  doc.setFont('times', 'bold');
  doc.line(15, y, 65, y);
  doc.line(80, y, 130, y);
  doc.line(145, y, 195, y);

  doc.text('Analyzed By', 40, y + 5, { align: 'center' });
  doc.text('Checked By', 105, y + 5, { align: 'center' });
  doc.text('QA Manager', 170, y + 5, { align: 'center' });

  doc.save(`COA-${material.batchNumber}.pdf`);
}

export async function generateInventoryReportPDF(materials: RawMaterial[]): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  // Outer Border
  doc.setLineWidth(0.5);
  doc.rect(5, 5, 200, 287);

  // Header Section
  doc.setFont('times', 'bold');
  doc.setFontSize(20);
  doc.text('PHARMA CORP', 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.text('Industrial Zone, Phase 2, Pharmaceutical District', 105, 25, { align: 'center' });
  doc.setFontSize(14);
  doc.text('MATERIAL INVENTORY STOCK REPORT', 105, 35, { align: 'center' });
  doc.setLineWidth(0.8);
  doc.line(20, 38, 190, 38);

  doc.setFontSize(10);
  doc.setFont('times', 'normal');
  doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 155, 45);

  // Table Header
  let y = 55;
  doc.setFont('times', 'bold');
  doc.setFillColor(240, 240, 240);
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