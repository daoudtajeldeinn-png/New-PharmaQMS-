import { RawMaterial } from '@/types/materials'

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

  const blob = new Blob([coaContent], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `COA-${material.batchNumber}-${new Date().toISOString().split('T')[0]}.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function generateCOAPDF(material: RawMaterial): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  
  doc.setFontSize(20)
  doc.text('CERTIFICATE OF ANALYSIS', 105, 20, { align: 'center' })
  
  doc.setFontSize(12)
  doc.text(`Material: ${material.name}`, 20, 40)
  doc.text(`Batch: ${material.batchNumber}`, 20, 50)
  doc.text(`Supplier: ${material.supplier}`, 20, 60)
  doc.text(`Pharmacopeia: ${material.pharmacopeia}`, 20, 70)
  
  let y = 90
  doc.setFontSize(10)
  doc.text('Test Name', 20, y)
  doc.text('Specification', 80, y)
  doc.text('Result', 140, y)
  doc.text('Status', 170, y)
  
  y += 10
  material.tests.forEach(test => {
    doc.text(test.name.substring(0, 25), 20, y)
    doc.text(test.spec.substring(0, 20), 80, y)
    doc.text(String(test.result || '-').substring(0, 15), 140, y)
    doc.text(test.status, 170, y)
    y += 8
  })
  
  doc.save(`COA-${material.batchNumber}.pdf`)
}