import { useState, useRef } from 'react';
import { useStore } from '@/hooks/useStore';
import { Download, Printer, Plus, Activity, AlertCircle, Database, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { g1Monographs } from '@/data/g1Data';
import { toast } from 'sonner';
const coaTypes: COAType[] = ['Finished Product', 'Raw Material', 'Water Analysis', 'Microbiology', 'Utilities'];
import { backupSystemData } from '@/services/BackupService';
import { SignatureModal } from '@/components/security/SignatureModal';
import type { COARecord, COAType } from '@/types';


export function COAManagerPage() {
    const { state, dispatch } = useStore();
    const records = state.coaRecords || [];
    const [activeTab, setActiveTab] = useState('overview');
    const [showForm, setShowForm] = useState(false);
    const [selectedCOA, setSelectedCOA] = useState<COARecord | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSignatureOpen, setIsSignatureOpen] = useState(false);
    const [pendingCOA, setPendingCOA] = useState<COARecord | null>(null);
    const initialFormState: Partial<COARecord> = {
        testResults: [{ test: '', specification: '', result: '', status: 'Pass' }],
        type: 'Finished Product',
        manufacturer: 'Pharma Corp',
        address: 'Industrial Zone, Phase 2, Pharmaceutical District',
        productionDate: '',
        analysisDate: '',
        status: 'Draft',
        marketComplaintStatus: 'Verified and Compliant'
    };
    const [formData, setFormData] = useState<Partial<COARecord>>(initialFormState);
    const [showFetchTests, setShowFetchTests] = useState(false);
    const [batchForFetch, setBatchForFetch] = useState('');

    const handleFetchTests = () => {
      dispatch({
        type: 'FETCH_BATCH_TESTS_FOR_COA',
        payload: { batchNumber: batchForFetch }
      });
      toast.success('Tests fetched from batch! Check test results section.');
      setShowFetchTests(false);
    };
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: selectedCOA ? `COA-${selectedCOA.coaNumber}` : 'COA',
    });

    const handleDownloadPDF = async () => {
        if (!printRef.current || !selectedCOA) return;
        const element = printRef.current;
        const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`${selectedCOA.coaNumber}.pdf`);
    };

    const handleSaveCOA = (isDraft: boolean = false) => {
        if (!isDraft && (!formData.productName || !formData.batchNumber)) {
            toast.error('Please fill mandatory fields (Product Name & Batch ID)');
            return;
        }

        const coaId = isEditing ? formData.id! : Math.random().toString(36).substr(2, 9);
        const record: COARecord = {
            id: coaId,
            type: formData.type || 'Finished Product',
            coaNumber: formData.coaNumber || `COA-${Date.now()}`,
            analysisNo: formData.analysisNo || '',
            productName: formData.productName || '',
            strength: formData.strength || '',
            dosageForm: formData.dosageForm || '',
            batchNumber: formData.batchNumber || '',
            batchSize: formData.batchSize || '',
            mfgDate: formData.mfgDate || formData.manufacturingDate || '',
            receivingDate: formData.receivingDate || '',
            analysisDate: formData.analysisDate || '',
            expiryDate: formData.expiryDate || '',
            issueDate: formData.issueDate || new Date().toISOString().split('T')[0],
            manufacturer: formData.manufacturer || 'Pharma Corp',
            address: formData.address || 'Industrial Zone, Phase 2, Pharmaceutical District',
            testResults: formData.testResults || [],
            marketComplaintStatus: formData.marketComplaintStatus || 'Verified and Compliant',
            analyzedBy: formData.analyzedBy || '',
            checkedBy: formData.checkedBy || '',
            approvedBy: formData.approvedBy || '',
            status: isDraft ? 'Draft' : (formData.status === 'Draft' ? 'Approved' : (formData.status || 'Approved')),
        };

        if (isDraft) {
            saveToStore(record);
        } else {
            setPendingCOA(record);
            setIsSignatureOpen(true);
        }
    };

    const saveToStore = (record: COARecord) => {
        if (state.coaRecords.find(r => r.id === record.id)) {
            dispatch({ type: 'UPDATE_COA_RECORD', payload: record });
            toast.success('COA updated successfully');
        } else {
            dispatch({ type: 'ADD_COA_RECORD', payload: record });
            toast.success('New COA created successfully');
            dispatch({
                type: 'ADD_ACTIVITY', payload: {
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'Document_Approved',
                    description: `New COA issued: ${record.coaNumber} for ${record.productName}`,
                    user: 'QA Department',
                    timestamp: new Date(),
                    relatedId: record.id
                }
            });
        }

        setShowForm(false);
        setIsEditing(false);
        setFormData(initialFormState);
    };

    const handleSignatureConfirm = (sigData: any) => {
        if (pendingCOA) {
            const signedRecord = {
                ...pendingCOA,
                approvedBy: sigData.signerName,
                status: 'Released' as const
            };
            saveToStore(signedRecord);
            setPendingCOA(null);

            dispatch({
                type: 'ADD_ACTIVITY',
                payload: {
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'Document_Approved',
                    description: `COA ${signedRecord.coaNumber} signed and released by ${sigData.signerName}`,
                    user: sigData.signerName,
                    timestamp: sigData.timestamp,
                    relatedId: signedRecord.id
                }
            });
        }
    };

    const handleLoadMonograph = (monographId: string) => {
        const monograph = g1Monographs[monographId];
        if (monograph) {
            // Filter tests if a specific department COA is selected
            let targetTests = [...monograph.tests];
            if (formData.type === 'Microbiology') {
                targetTests = targetTests.filter(t => t.category === 'Microbiological');
            }

            // Sort tests by custom category order: Descriptive -> Physical -> Chemical -> Microbiological
            const categoryOrder: Record<string, number> = { 'Descriptive': 1, 'Physical': 2, 'Chemical': 3, 'Microbiological': 4 };
            const sortedTests = targetTests.sort((a, b) =>
                (categoryOrder[a.category] || 99) - (categoryOrder[b.category] || 99)
            );

            setFormData({
                ...formData,
                productName: monograph.name,
                strength: (monograph as any).strength || '',
                dosageForm: (monograph as any).dosageForm || '',
                manufacturer: monograph.standard === 'In-House' ? 'In-House' : 'Pharma Corp',
                testResults: sortedTests.map(t => ({
                    test: t.test,
                    specification: t.specification,
                    result: '',
                    status: 'Pass'
                }))
            });
        }
    };

    const totalCOAs = records.length;
    const releasedCOAs = records.filter(r => r.status === 'Released').length;
    const getRecordsByType = (type: COAType) => records.filter(r => r.type === type);

    const renderTable = (data: COARecord[]) => (
        <div className="border rounded-lg overflow-hidden mt-4 bg-white dark:bg-slate-900">
            <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                        <th className="px-4 py-3 text-left">COA #</th>
                        <th className="px-4 py-3 text-left">Product/Sample</th>
                        <th className="px-4 py-3 text-left">Batch/ID</th>
                        <th className="px-4 py-3 text-left">Type</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {data.length === 0 ? <tr><td colSpan={6} className="p-4 text-center text-slate-500">No records found</td></tr> :
                        data.map((record) => (
                            <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 font-medium text-blue-600">{record.coaNumber}</td>
                                <td className="px-4 py-3 font-medium">{record.productName}</td>
                                <td className="px-4 py-3 font-mono text-xs">{record.batchNumber}</td>
                                <td className="px-4 py-3"><Badge variant="outline">{record.type}</Badge></td>
                                <td className="px-4 py-3">
                                    <Badge variant={record.status === 'Approved' || record.status === 'Released' ? 'default' : 'secondary'}>
                                        {record.status}
                                    </Badge>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <Button size="icon" variant="ghost" onClick={() => { setSelectedCOA(record); setTimeout(handlePrint, 100); }}>
                                            <Printer className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={() => { setSelectedCOA(record); setTimeout(handleDownloadPDF, 100); }}>
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={() => { setFormData(record); setIsEditing(true); setShowForm(true); }} className="text-indigo-600">
                                            <Activity className="h-4 w-4" />
                                        </Button>
                                        {record.status !== 'Approved' && record.status !== 'Released' && (
                                            <Button size="icon" variant="ghost" onClick={() => {
                                                if (window.confirm(`QA AUTHORIZATION: Are you sure you want to OFFICIALLY RELEASE this COA for ${record.productName}?`)) {
                                                    dispatch({ type: 'UPDATE_COA_RECORD', payload: { ...record, status: 'Released' } });
                                                    toast.success('COA Officially Released by QA');
                                                }
                                            }} className="text-emerald-600" title="QA Release">
                                                <ShieldCheck className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2">
                        <Activity className="h-8 w-8 text-blue-600" />
                        CERTIFICATE OF ANALYSIS
                    </h1>
                </div>
                <div className="flex gap-2">
                    <Button onClick={backupSystemData} variant="outline" className="gap-2 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100">
                        <Database className="h-4 w-4" /> Backup System
                    </Button>
                    <Button onClick={() => { setFormData(initialFormState); setShowForm(true); }} className="gap-2 bg-blue-600 shadow-lg">
                        <Plus className="h-4 w-4" /> Issue New COA
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-sm border-none bg-slate-50"><CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-slate-500 uppercase">Total COAs</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{totalCOAs}</div></CardContent></Card>
                <Card className="shadow-sm border-none bg-teal-50"><CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-teal-600 uppercase">Released</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-teal-700">{releasedCOAs}</div></CardContent></Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-5 h-12 bg-slate-100 p-1">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="fp" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Finished Products</TabsTrigger>
                    <TabsTrigger value="rm" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">Raw Materials</TabsTrigger>
                    <TabsTrigger value="water">Water</TabsTrigger>
                    <TabsTrigger value="micro">Micro</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">{renderTable(records)}</TabsContent>
                <TabsContent value="fp">{renderTable(getRecordsByType('Finished Product'))}</TabsContent>
                <TabsContent value="rm">{renderTable(getRecordsByType('Raw Material'))}</TabsContent>
                <TabsContent value="water">{renderTable(getRecordsByType('Water Analysis'))}</TabsContent>
                <TabsContent value="micro">{renderTable(getRecordsByType('Microbiology'))}</TabsContent>
            </Tabs>

            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
                    <DialogHeader><DialogTitle className="text-2xl font-bold text-slate-900">Issue New Certificate of Analysis</DialogTitle></DialogHeader>
                    <div className="grid grid-cols-2 gap-6 py-4">
                        {/* Step 1: Type selection */}
                        <div className="col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <Label className="text-blue-600 font-bold mb-3 block text-sm uppercase">Step 1: Select COA Type</Label>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {coaTypes.map(type => (
                                    <Button key={type} variant={formData.type === type ? 'default' : 'outline'} size="sm" onClick={() => setFormData({ ...formData, type: type as any })} className="min-w-[120px]">{type}</Button>
                                ))}
                            </div>
                        </div>

                        {/* Step 2: Auto Load (Monograph Recall) */}
                        <div className="col-span-2 border-2 border-blue-100 p-5 rounded-lg bg-blue-50/50 shadow-inner">
                            <Label className="text-blue-700 font-bold mb-3 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" /> Step 2: Auto-Load Specifications (G1 Monograph Recall)
                            </Label>
                            <div className="flex gap-2 flex-wrap">
                                {Object.values(g1Monographs).filter(m => {
                                    if (formData.type === 'Finished Product') return m.type === 'Finished Product';
                                    if (formData.type === 'Raw Material') return m.type === 'Raw Material';
                                    if (formData.type === 'Utilities') return m.type === 'Utility';
                                    return true; // Show all if type not specifically mapped
                                }).map(m => (
                                    <Button key={m.id} variant="secondary" size="sm" onClick={() => handleLoadMonograph(m.id)} className="bg-white hover:bg-blue-600 hover:text-white transition-all shadow-sm border-blue-200">{m.name}</Button>
                                ))}
                            </div>
                            <p className="text-[10px] text-blue-400 mt-2 italic">* This will automatically pull BP/USP standards and test limits.</p>
                        </div>

                        {/* Form Fields */}
                        <div className="grid grid-cols-2 col-span-2 gap-4">
                            <div className="space-y-1"><Label>Product Name*</Label><Input value={formData.productName || ''} onChange={e => setFormData({ ...formData, productName: e.target.value })} className="border-slate-300" /></div>
                            <div className="space-y-1"><Label>Analysis Number</Label><Input value={formData.analysisNo || ''} onChange={e => setFormData({ ...formData, analysisNo: e.target.value })} className="border-slate-300" /></div>
                            <div className="space-y-1"><Label>Strength</Label><Input value={formData.strength || ''} onChange={e => setFormData({ ...formData, strength: e.target.value })} className="border-slate-300" /></div>
                            <div className="space-y-1"><Label>Dosage Form</Label><Input value={formData.dosageForm || ''} onChange={e => setFormData({ ...formData, dosageForm: e.target.value })} className="border-slate-300" /></div>
                            <div className="space-y-1"><Label>Batch ID*</Label><Input value={formData.batchNumber || ''} onChange={e => setFormData({ ...formData, batchNumber: e.target.value })} className="border-slate-300" /></div>
                            <div className="space-y-1"><Label>Batch Size</Label><Input value={formData.batchSize || ''} onChange={e => setFormData({ ...formData, batchSize: e.target.value })} className="border-slate-300" /></div>
                            <div className="space-y-1"><Label>Manufacturing Date</Label><Input type="date" value={formData.manufacturingDate || ''} onChange={e => setFormData({ ...formData, manufacturingDate: e.target.value })} className="border-slate-300" /></div>
                            <div className="space-y-1"><Label>Receiving Date</Label><Input type="date" value={formData.receivingDate || ''} onChange={e => setFormData({ ...formData, receivingDate: e.target.value })} className="border-slate-300" /></div>
                            <div className="space-y-1"><Label>Analysis Date</Label><Input type="date" value={formData.analysisDate || ''} onChange={e => setFormData({ ...formData, analysisDate: e.target.value })} className="border-slate-300" /></div>
                            <div className="space-y-1"><Label>Expiry Date</Label><Input type="date" value={formData.expiryDate || ''} onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} className="border-slate-300" /></div>
                            <div className="space-y-1"><Label>Issue Date</Label><Input type="date" value={formData.issueDate || ''} onChange={e => setFormData({ ...formData, issueDate: e.target.value })} className="border-slate-300" /></div>
                            <div className="space-y-1"><Label>Manufacturer</Label><Input value={formData.manufacturer || ''} onChange={e => setFormData({ ...formData, manufacturer: e.target.value })} className="border-slate-300" /></div>
                            <div className="space-y-1"><Label>Manufacturing Address</Label><Input value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} className="border-slate-300" /></div>
                            <div className="space-y-1 col-span-2">
                              <Button 
                                type="button"
                                onClick={() => {
                                  if (formData.batchNumber) {
                                    setBatchForFetch(formData.batchNumber);
                                    setShowFetchTests(true);
                                  } else {
                                    toast.error('Enter Batch ID first');
                                  }
                                }}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
                              >
                                🔄 Fetch Tests from Batch Test Results
                              </Button>
                            </div>
                            <div className="col-span-2 space-y-1"><Label>Recall & Market Complaint Status</Label><Input value={formData.marketComplaintStatus || ''} onChange={e => setFormData({ ...formData, marketComplaintStatus: e.target.value })} placeholder="Verified and Compliant" className="border-slate-300" /></div>
                        </div>

                        {/* Test Grid */}
                        <div className="col-span-2 mt-4 space-y-3 bg-slate-50 p-4 rounded-lg border">
                            <Label className="font-bold text-slate-700 block border-b pb-2 mb-2">3. Analytical Test Results</Label>
                            <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-400 uppercase px-1">
                                <div className="col-span-4">Test Parameter</div>
                                <div className="col-span-3">Specification</div>
                                <div className="col-span-3">Result</div>
                                <div className="col-span-2 text-center">Inference</div>
                            </div>
                            {formData.testResults?.map((test, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                    <div className="col-span-4"><Input placeholder="Test Name" value={test.test} onChange={(e) => { const nt = [...(formData.testResults || [])]; nt[index].test = e.target.value; setFormData({ ...formData, testResults: nt }); }} className="h-8 text-xs" /></div>
                                    <div className="col-span-3"><Input placeholder="Limit" value={test.specification} onChange={(e) => { const nt = [...(formData.testResults || [])]; nt[index].specification = e.target.value; setFormData({ ...formData, testResults: nt }); }} className="h-8 text-xs" /></div>
                                    <div className="col-span-3"><Input placeholder="Observed" value={test.result} onChange={(e) => { const nt = [...(formData.testResults || [])]; nt[index].result = e.target.value; setFormData({ ...formData, testResults: nt }); }} className="h-8 text-xs font-bold" /></div>
                                    <div className="col-span-2"><select className="w-full border rounded h-8 p-1 text-[10px] font-bold" value={test.status} onChange={(e) => { const nt = [...(formData.testResults || [])]; nt[index].status = e.target.value as any; setFormData({ ...formData, testResults: nt }); }}><option value="Pass">Pass</option><option value="Fail">Fail</option><option value="Pending">Pending</option><option value="N/A">N/A</option></select></div>
                                </div>
                            ))}
                            <Button size="sm" variant="outline" className="w-full mt-2 border-dashed border-blue-300 text-blue-600 bg-white" onClick={() => setFormData({ ...formData, testResults: [...(formData.testResults || []), { test: '', specification: '', result: '', status: 'Pass' }] })}>+ Add Another Test Parameter</Button>
                        </div>
                    </div>
                    <DialogFooter className="bg-slate-50 -mx-6 -mb-6 p-4 border-t mt-4 flex justify-between items-center">
                        <div className="flex gap-2">
                            <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => { setShowForm(false); setIsEditing(false); setFormData(initialFormState); }}>Discard Changes</Button>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => handleSaveCOA(true)} className="border-blue-200 text-blue-700 bg-white">Save as Draft</Button>
                            <Button onClick={() => handleSaveCOA(false)} className="bg-green-600 hover:bg-green-700 min-w-[150px]">{isEditing ? 'Update & Release COA' : 'Issue Final COA'}</Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <SignatureModal
                open={isSignatureOpen}
                onOpenChange={setIsSignatureOpen}
                onConfirm={handleSignatureConfirm}
                actionIntent={`I approve the Certificate of Analysis for ${pendingCOA?.productName} (Batch: ${pendingCOA?.batchNumber}) and confirm that it meets all quality standards.`}
            />

            {/* Print Engine */}
            {selectedCOA && (
                <div style={{ position: 'absolute', left: '-9999px' }}>
                    <div ref={printRef} className="p-12 bg-white text-black print-a4-container" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'Times New Roman, serif' }}>
                        <style>{`
                            @media print { 
                                @page { size: A4; margin: 15mm; } 
                                .print-a4-container { width: 100% !important; margin: 0 !important; padding: 0 !important; }
                                table { width: 100%; border-collapse: collapse; page-break-inside: auto; margin-bottom: 20px; } 
                                tr { page-break-inside: avoid; page-break-after: auto; } 
                                thead { display: table-header-group; } 
                                th, td { border: 1px solid black; padding: 8px; text-align: left; }
                            }
                        `}</style>
                        <div className="text-center border-b-4 border-double border-black pb-4 mb-6">
                            <h1 className="text-4xl font-bold tracking-tighter">{selectedCOA.manufacturer.toUpperCase()}</h1>
                            <p className="text-sm italic mb-2">{selectedCOA.address}</p>
                            <p className="text-md font-bold uppercase tracking-widest mt-2">{selectedCOA.type === 'Microbiology' ? 'Microbiology Department' : 'Quality Control Department'}</p>
                            <h2 className="text-3xl font-bold underline decoration-2 underline-offset-8 mt-6">
                                {selectedCOA.type === 'Microbiology' ? 'MICROBIAL CERTIFICATE OF ANALYSIS' : 'CERTIFICATE OF ANALYSIS'}
                            </h2>
                        </div>

                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-8 p-4 border-2 border-black rounded-lg text-sm bg-slate-50/50">
                            <div className="flex justify-between border-b border-dotted pb-1"><strong>Product Name:</strong> <span className="font-bold">{selectedCOA.productName}</span></div>
                            <div className="flex justify-between border-b border-dotted pb-1"><strong>Batch Number:</strong> <span className="font-mono">{selectedCOA.batchNumber}</span></div>
                            <div className="flex justify-between border-b border-dotted pb-1"><strong>Analysis No:</strong> <span>{selectedCOA.analysisNo}</span></div>
                            <div className="flex justify-between border-b border-dotted pb-1"><strong>Batch Size:</strong> <span>{selectedCOA.batchSize}</span></div>
                            <div className="flex justify-between border-b border-dotted pb-1"><strong>Strength:</strong> <span>{selectedCOA.strength}</span></div>
                            <div className="flex justify-between border-b border-dotted pb-1"><strong>Dosage Form:</strong> <span>{selectedCOA.dosageForm}</span></div>
                            <div className="flex justify-between border-b border-dotted pb-1"><strong>Issue Date:</strong> <span>{selectedCOA.issueDate}</span></div>
                        </div>

                        <h3 className="font-bold mb-2 underline uppercase">Analytical Results:</h3>
                        <table className="w-full">
                            <thead><tr className="bg-gray-100"><th>Test Parameter</th><th>Specification</th><th>Observed Result</th><th className="text-center">Inference</th></tr></thead>
                            <tbody>{selectedCOA.testResults.map((t, i) => (<tr key={i}><td className="font-semibold">{t.test}</td><td>{t.specification}</td><td className="font-bold">{t.result}</td><td className="text-center font-bold">{t.status === 'Pass' ? 'COMPLIES' : t.status === 'Fail' ? 'DOES NOT COMPLY' : t.status}</td></tr>))}</tbody>
                        </table>

                        <div className="mt-6 p-4 border border-black italic text-sm">
                            <strong>Compliance Statement:</strong> The batch mentioned above has been analyzed as per the specifications of {selectedCOA.productName} and is found to be <strong>{selectedCOA.testResults.every(t => t.status === 'Pass') ? 'COMPLYING' : 'NOT COMPLYING'}</strong>.
                        </div>

                        <div className="mt-4 p-4 border border-black bg-gray-50 rounded italic text-sm">
                            <strong>Market Complaint / Recall Compliance:</strong> {selectedCOA.marketComplaintStatus || 'Verified and Compliant'}
                        </div>

                        <div className="mt-24 grid grid-cols-3 gap-12 text-center text-xs font-bold uppercase tracking-wider">
                            <div><div className="h-10 mb-2 font-handwriting text-xl">{selectedCOA.analyzedBy}</div><div className="border-t-2 border-black pt-2">Analyzed By</div></div>
                            <div><div className="h-10 mb-2 font-handwriting text-xl">{selectedCOA.checkedBy}</div><div className="border-t-2 border-black pt-2">Checked By</div></div>
                            <div><div className="h-10 mb-2 font-handwriting text-xl">{selectedCOA.approvedBy}</div><div className="border-t-2 border-black pt-2">QA Manager (Approved)</div></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
