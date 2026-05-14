import { useState } from 'react';
import { Plus, Layout, Layers, ClipboardList, Printer, ShieldCheck, Thermometer, Droplets, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { type MasterFormula } from '@/data/mfrData';
import { g1Monographs } from '@/data/g1Data';
import { useStore } from '@/hooks/useStore';
import { usePrintExport } from '@/hooks/usePrintExport';
import { toast } from 'sonner';

export function MFRManagerPage() {
    const { state, dispatch } = useStore();
    const formulas = Object.values(state.masterFormulas);
    const [showForm, setShowForm] = useState(false);
    const [selectedMFR, setSelectedMFR] = useState<MasterFormula | null>(null);
    const [formData, setFormData] = useState<Partial<MasterFormula>>({
        ingredients: [],
        processSteps: []
    });
    const { printRef, handlePrint, exportToPDF } = usePrintExport();
    const [isEditing, setIsEditing] = useState(false);

    const handleSaveMFR = () => {
        if (!formData.productName || !formData.mfrNumber) {
            alert('Please fill mandatory fields');
            return;
        }
        const record: MasterFormula = {
            id: isEditing ? (formData.id || Math.random().toString(36).substr(2, 9)) : Math.random().toString(36).substr(2, 9),
            productName: formData.productName!,
            mfrNumber: formData.mfrNumber!,
            revisionNumber: formData.revisionNumber || '01',
            effectiveDate: formData.effectiveDate || new Date().toISOString().split('T')[0],
            batchSize: formData.batchSize || 1000,
            batchSizeUnit: formData.batchSizeUnit || 'Units',
            strength: formData.strength || '',
            dosageForm: formData.dosageForm || '',
            shelfLife: formData.shelfLife || '24 Months',
            theoreticalYieldRange: formData.theoreticalYieldRange || { min: 98.0, max: 100.5 },
            lineClearanceRequired: true,
            ingredients: formData.ingredients || [],
            processSteps: formData.processSteps || [],
            status: isEditing ? (formData.status || 'Draft') : 'Draft',
            preparedBy: formData.preparedBy || 'Quality Section'
        };
        dispatch({ type: isEditing ? 'UPDATE_MFR' : 'ADD_MFR', payload: record });
        toast.success(`Master Formula Record ${isEditing ? 'updated' : 'created'} successfully`);
        setShowForm(false);
        setIsEditing(false);
    };

    const handleDeleteMFR = (id: string) => {
        if (confirm('Are you sure you want to delete this Master Formula?')) {
            dispatch({ type: 'DELETE_MFR', payload: id });
            toast.success('MFR deleted successfully');
        }
    };

    const handleEditMFR = (mfr: MasterFormula) => {
        setFormData(mfr);
        setIsEditing(true);
        setShowForm(true);
    };

    const loadFromG1 = (monographId: string) => {
        const m = g1Monographs[monographId];
        if (m) {
            setFormData({
                ...formData,
                productName: m.name,
                strength: m.strength || '',
                dosageForm: m.dosageForm || ''
            });
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <Layout className="h-8 w-8 text-indigo-600" />
                        MASTER FORMULA RECORDS (MFR)
                    </h1>
                    <p className="text-slate-500">Managing Manufacturing Master Templates & Bill of Materials</p>
                </div>
                <Button onClick={() => { setFormData({ ingredients: [], processSteps: [] }); setIsEditing(false); setShowForm(true); }} className="bg-indigo-600">
                    <Plus className="h-4 w-4 mr-2" /> Create New MFR
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-sm">
                    <CardHeader className="pb-2 text-indigo-700 font-bold uppercase text-[10px] tracking-wider">Active Formulas</CardHeader>
                    <CardContent><div className="text-4xl font-black text-indigo-900">{formulas.length}</div></CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="px-6 py-4 text-left">MFR Number</th>
                                <th className="px-6 py-4 text-left">Product Name</th>
                                <th className="px-6 py-4 text-left">Batch Size</th>
                                <th className="px-6 py-4 text-left">Revision</th>
                                <th className="px-6 py-4 text-left">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {formulas.map((mfr: MasterFormula) => (
                                <tr key={mfr.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedMFR(mfr)}>
                                    <td className="px-6 py-4 font-bold text-indigo-600">{mfr.mfrNumber}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold">{mfr.productName}</div>
                                        <div className="text-xs text-slate-500">{mfr.strength} | {mfr.dosageForm}</div>
                                    </td>
                                    <td className="px-6 py-4 font-mono">{mfr.batchSize} {mfr.batchSizeUnit}</td>
                                    <td className="px-6 py-4 font-bold">REV {mfr.revisionNumber}</td>
                                    <td className="px-6 py-4">
                                        <Badge className={`${mfr.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'} border-none uppercase text-[9px] font-black`}>
                                            {mfr.status || 'Draft'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button size="icon" variant="ghost" title="Edit Formula" className="text-blue-600 hover:text-blue-700" onClick={(e) => { e.stopPropagation(); handleEditMFR(mfr); }}><Layers className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="ghost" title="Issue New BMR" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={(e: React.MouseEvent) => { e.stopPropagation(); toast.info('Navigating to BMR Issuance...'); }}><Plus className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="ghost" title="Print MFR" onClick={(e) => { e.stopPropagation(); setSelectedMFR(mfr); setTimeout(handlePrint, 500); }}><Printer className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="ghost" title="Delete MFR" className="text-red-500" onClick={(e) => { e.stopPropagation(); handleDeleteMFR(mfr.id); }}><Plus className="h-4 w-4 rotate-45" /></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* MFR View Dialog */}
            <Dialog open={!!selectedMFR} onOpenChange={() => setSelectedMFR(null)}>
                <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto bg-slate-50 p-0 border-none rounded-none shadow-2xl">
                    {selectedMFR && (
                        <div className="bg-white min-h-[297mm] w-full mx-auto p-12 shadow-inner print:p-0 font-serif">
                            {/* Professional Header - A4 Style */}
                            <div className="flex justify-between items-start border-b-4 border-double border-slate-900 pb-8 mb-8">
                                <div className="flex gap-6 items-center">
                                    <div className="bg-slate-900 p-5 rounded-xl text-white shadow-lg">
                                        <Layers className="h-10 w-10" />
                                    </div>
                                    <div>
                                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-1">PHARMAQMS ENTERPRISE</h1>
                                        <p className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-1">Quality Management System | GxP COMPLIANCE</p>
                                        <p className="text-[10px] font-bold text-slate-500 leading-tight">Industrial Zone, Phase 2, Pharmaceutical District<br />Cairo, Egypt | Document Control: MFR-SYS-V2</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-4xl font-black text-slate-900 tracking-tighter mb-1">MASTER FORMULA</div>
                                    <div className="inline-block px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded">CONFIDENTIAL</div>
                                    <div className="text-[10px] font-bold text-slate-500 mt-2 uppercase">Ref No: {selectedMFR.mfrNumber} | Rev: {selectedMFR.revisionNumber}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 text-sm">
                                <div className="space-y-2 border-l-4 border-indigo-600 pl-4 bg-indigo-50/50 p-4 rounded-r-lg">
                                    <div className="flex justify-between"><strong>Product Name:</strong> {selectedMFR.productName}</div>
                                    <div className="flex justify-between"><strong>Label Strength:</strong> {selectedMFR.strength}</div>
                                    <div className="flex justify-between"><strong>Dosage Form:</strong> {selectedMFR.dosageForm}</div>
                                    <div className="pt-2">
                                        <Badge className="bg-indigo-600">PREPARED BY QUALITY SECTION</Badge>
                                    </div>
                                </div>
                                <div className="space-y-2 border-l-4 border-slate-900 pl-4 bg-slate-50 p-4 rounded-r-lg relative">
                                    <div className="flex justify-between"><strong>Standard Batch Size:</strong> {selectedMFR.batchSize} {selectedMFR.batchSizeUnit}</div>
                                    <div className="flex justify-between"><strong>Product Shelf Life:</strong> {selectedMFR.shelfLife}</div>
                                    <div className="flex justify-between"><strong>Theoretical Yield:</strong> {selectedMFR.theoreticalYieldRange.min}% - {selectedMFR.theoreticalYieldRange.max}%</div>
                                    <div className="pt-2 flex gap-2">
                                        {selectedMFR.status !== 'Approved' ? (
                                            <Button size="sm" className="bg-emerald-600 h-7 text-[9px] font-black uppercase" onClick={() => {
                                                dispatch({ type: 'UPDATE_MFR', payload: { ...selectedMFR, status: 'Approved', approvedBy: 'QA Director' } });
                                                setSelectedMFR(null);
                                                toast.success('MFR Approved by QA');
                                            }}>QA APPROVE FORMULA</Button>
                                        ) : (
                                            <Badge className="bg-emerald-600 uppercase text-[9px]">Verified by QA Compliance</Badge>
                                        )}
                                    </div>
                                    {selectedMFR.status === 'Approved' && <ShieldCheck className="absolute top-2 right-2 h-10 w-10 text-emerald-600/20" />}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b pb-2">
                                    <h3 className="font-bold flex items-center gap-2 text-indigo-700"><Layers className="h-4 w-4" /> Bill of Materials (BOM)</h3>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="h-7 text-[9px] font-bold border-indigo-200 text-indigo-600" onClick={() => handlePrint()}>PRINT MFR</Button>
                                        <Button variant="outline" size="sm" className="h-7 text-[9px] font-bold border-indigo-200 text-indigo-600" onClick={() => exportToPDF({ filename: `${selectedMFR!.mfrNumber}.pdf` })}>SAVE PDF</Button>
                                        <Button variant="outline" size="sm" className="h-7 text-[9px] font-bold border-indigo-200 text-indigo-600" onClick={() => handleEditMFR(selectedMFR!)}>EDIT FORMULA</Button>
                                    </div>
                                </div>
                                <table className="w-full border-collapse border text-xs">
                                    <thead>
                                        <tr className="bg-indigo-50">
                                            <th className="border p-3 text-left">Item Code</th>
                                            <th className="border p-3 text-left">Ingredient Description</th>
                                            <th className="border p-3 text-center font-black">Standard Qty</th>
                                            <th className="border p-3 text-center">Qty per Unit</th>
                                            <th className="border p-3 text-center">Unit</th>
                                            <th className="border p-3 text-center">Verification Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedMFR.ingredients.map((ing, i: number) => {
                                            const qtyPerUnit = ing.quantity / selectedMFR.batchSize;
                                            const formattedQtyPerUnit = qtyPerUnit < 0.001 ? qtyPerUnit.toExponential(3) : qtyPerUnit.toFixed(6);
                                            return (
                                                <tr key={i} className="hover:bg-slate-50">
                                                    <td className="border p-3 font-mono text-slate-500">{ing.itemCode}</td>
                                                    <td className="border p-3 font-bold">{ing.description}</td>
                                                    <td className="border p-3 text-center">
                                                        {ing.quantity === 0 ? (
                                                            <span className="text-red-500 font-black animate-pulse">PENDING QUALITY INPUT</span>
                                                        ) : (
                                                            <span className="text-lg font-black text-indigo-900">{ing.quantity}</span>
                                                        )}
                                                    </td>
                                                    <td className="border p-3 text-center font-mono text-indigo-600">
                                                        {formattedQtyPerUnit}
                                                    </td>
                                                    <td className="border p-3 text-center uppercase font-bold text-slate-400">{ing.unit}</td>
                                                    <td className="border p-3 text-center">
                                                        {selectedMFR.status === 'Approved' ? (
                                                            <Badge variant="outline" className="text-emerald-600 border-emerald-200">CONFIRMED</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-amber-600 border-amber-200">AWAITING QA</Badge>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-bold border-b pb-2 flex items-center gap-2 text-indigo-700"><ClipboardList className="h-4 w-4" /> Manufacturing Process Steps</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {selectedMFR.processSteps.map((step, i: number) => (
                                        <div key={i} className={`border p-5 rounded-xl bg-white shadow-sm hover:shadow-md transition-all border-l-8 ${step.phase === 'Packaging' ? 'border-l-purple-500' : 'border-l-indigo-500'}`}>
                                            <div className="flex justify-between items-center mb-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{step.phase} PHASE</span>
                                                    <span className="font-black text-indigo-900 text-lg">STEP {step.stepNumber}: {step.department.toUpperCase()}</span>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <Badge className="bg-slate-100 text-slate-600 border-none px-3 py-1 text-[10px]">Required: {step.roleRequired}</Badge>
                                                    {step.plannedDuration && (
                                                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[9px] font-black">EST: {step.plannedDuration}</Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-slate-700 mb-2 leading-relaxed">{step.description}</p>
                                            <div className="text-sm text-slate-600 mb-4 bg-slate-50 p-2 rounded border border-slate-200">
                                                <span className="font-bold text-[10px] uppercase text-slate-400 block mb-1">Standard Operating Instructions:</span>
                                                {Array.isArray(step.instructions) ? step.instructions.map((inst, k) => <div key={k}>- {inst}</div>) : step.instructions || 'Follow standard operating procedure for this phase.'}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                {step.roomConditions && (
                                                    <div className="flex gap-2">
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded border"><Thermometer className="h-3 w-3" /> {step.roomConditions.temp}</div>
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded border"><Droplets className="h-3 w-3" /> {step.roomConditions.humidity}</div>
                                                    </div>
                                                )}
                                                {step.equipmentId && (
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded border border-indigo-100"><Box className="h-3 w-3" /> {step.equipmentId}</div>
                                                )}
                                            </div>
                                            <div className="flex gap-2 flex-wrap items-center">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Critical Parameters:</span>
                                                {step.criticalParameters.map((p: string, pi: number) => (
                                                    <span key={pi} className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-1 rounded">● {p}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Creation Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="text-2xl font-black">Design New Master Formula</DialogTitle></DialogHeader>
                    <div className="grid grid-cols-2 gap-6 py-6">
                        <div className="col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                            <Label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Link to Monograph</Label>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {Object.values(g1Monographs).filter(m => m.type === 'Finished Product').map((m) => (
                                    <Button key={m.id} size="sm" variant="secondary" onClick={() => loadFromG1(m.id)} className="whitespace-nowrap bg-white border shadow-sm">{m.name}</Button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-1"><Label>Product Name*</Label><Input value={formData.productName || ''} onChange={e => setFormData({ ...formData, productName: e.target.value })} className="border-slate-300" /></div>
                        <div className="space-y-1"><Label>MFR Reference No*</Label><Input placeholder="MFR/TAB/..." value={formData.mfrNumber || ''} onChange={e => setFormData({ ...formData, mfrNumber: e.target.value })} className="border-slate-300" /></div>
                        <div className="space-y-1"><Label>Standard Batch Size</Label><Input type="number" value={formData.batchSize || ''} onChange={e => setFormData({ ...formData, batchSize: Number(e.target.value) })} className="border-slate-300" /></div>
                        <div className="space-y-1"><Label>Unit</Label><Input placeholder="e.g. Tablets" value={formData.batchSizeUnit || ''} onChange={e => setFormData({ ...formData, batchSizeUnit: e.target.value })} className="border-slate-300" /></div>

                        <div className="space-y-1"><Label>Dosage Form</Label><Input placeholder="e.g. Coated Tablet" value={formData.dosageForm || ''} onChange={e => setFormData({ ...formData, dosageForm: e.target.value })} className="border-slate-300" /></div>
                        <div className="space-y-1"><Label>Strength</Label><Input placeholder="e.g. 500mg" value={formData.strength || ''} onChange={e => setFormData({ ...formData, strength: e.target.value })} className="border-slate-300" /></div>
                        <div className="space-y-1"><Label>Shelf Life</Label><Input placeholder="e.g. 36 Months" value={formData.shelfLife || ''} onChange={e => setFormData({ ...formData, shelfLife: e.target.value })} className="border-slate-300" /></div>
                        <div className="space-y-1">
                            <Label>Theoretical Yield Range (%)</Label>
                            <div className="flex gap-2">
                                <Input type="number" placeholder="Min" value={formData.theoreticalYieldRange?.min || ''} onChange={e => setFormData({ ...formData, theoreticalYieldRange: { ...formData.theoreticalYieldRange!, min: Number(e.target.value) } })} />
                                <Input type="number" placeholder="Max" value={formData.theoreticalYieldRange?.max || ''} onChange={e => setFormData({ ...formData, theoreticalYieldRange: { ...formData.theoreticalYieldRange!, max: Number(e.target.value) } })} />
                            </div>
                        </div>

                        <div className="col-span-2 space-y-4 mt-4">
                            <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-700">
                                <Layers className="h-4 w-4" /> Ingredients (BOM)
                            </h3>
                            <div className="space-y-2">
                                {formData.ingredients?.map((ing, idx) => (
                                    <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded">
                                        <Input placeholder="Item Code" className="w-24" value={ing.itemCode} onChange={e => {
                                            const newIngs = [...(formData.ingredients || [])];
                                            newIngs[idx].itemCode = e.target.value;
                                            setFormData({ ...formData, ingredients: newIngs });
                                        }} />
                                        <Input placeholder="Description" className="flex-1" value={ing.description} onChange={e => {
                                            const newIngs = [...(formData.ingredients || [])];
                                            newIngs[idx].description = e.target.value;
                                            setFormData({ ...formData, ingredients: newIngs });
                                        }} />
                                        <div className="flex flex-col gap-1">
                                            <Input type="number" placeholder="Qty" className="w-24 h-8 text-[10px]" value={ing.quantity} onChange={e => {
                                                const newIngs = [...(formData.ingredients || [])];
                                                newIngs[idx].quantity = Number(e.target.value);
                                                setFormData({ ...formData, ingredients: newIngs });
                                            }} />
                                            {formData.batchSize && formData.batchSize > 0 && (
                                                <span className="text-[8px] font-bold text-indigo-500 px-1">
                                                    {(ing.quantity / formData.batchSize).toFixed(6)} {ing.unit}/Unit
                                                </span>
                                            )}
                                        </div>
                                        <Input placeholder="Unit" className="w-16" value={ing.unit} onChange={e => {
                                            const newIngs = [...(formData.ingredients || [])];
                                            newIngs[idx].unit = e.target.value;
                                            setFormData({ ...formData, ingredients: newIngs });
                                        }} />
                                        <Button variant="ghost" size="icon" onClick={() => {
                                            const newIngs = formData.ingredients?.filter((_, i) => i !== idx);
                                            setFormData({ ...formData, ingredients: newIngs });
                                        }} className="text-red-500">×</Button>
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={() => {
                                    setFormData({
                                        ...formData,
                                        ingredients: [...(formData.ingredients || []), { itemCode: '', description: '', quantity: 0, unit: 'kg', category: 'Excipient' }]
                                    });
                                }} className="w-full border-dashed">+ Add Ingredient</Button>
                            </div>
                        </div>

                        <div className="col-span-2 space-y-4 mt-4">
                            <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-700">
                                <ClipboardList className="h-4 w-4" /> Process Steps
                            </h3>
                            <div className="space-y-4">
                                {formData.processSteps?.map((step, idx) => (
                                    <div key={idx} className="border p-4 rounded-lg bg-slate-50 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold">Step {idx + 1}</span>
                                            <Button variant="ghost" size="sm" onClick={() => {
                                                const newSteps = formData.processSteps?.filter((_, i) => i !== idx);
                                                setFormData({ ...formData, processSteps: newSteps });
                                            }} className="text-red-500">Remove Step</Button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input placeholder="Department" value={step.department} onChange={e => {
                                                const newSteps = [...(formData.processSteps || [])];
                                                newSteps[idx].department = e.target.value;
                                                setFormData({ ...formData, processSteps: newSteps });
                                            }} />
                                            <Input placeholder="Role Required" value={step.roleRequired} onChange={e => {
                                                const newSteps = [...(formData.processSteps || [])];
                                                newSteps[idx].roleRequired = e.target.value;
                                                setFormData({ ...formData, processSteps: newSteps });
                                            }} />
                                        </div>
                                        <Input placeholder="Description" value={step.description} onChange={e => {
                                            const newSteps = [...(formData.processSteps || [])];
                                            newSteps[idx].description = e.target.value;
                                            setFormData({ ...formData, processSteps: newSteps });
                                        }} />
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={() => {
                                    setFormData({
                                        ...formData,
                                        processSteps: [...(formData.processSteps || []), { stepNumber: (formData.processSteps?.length || 0) + 1, phase: 'Manufacturing', department: '', description: '', instructions: [], criticalParameters: [], roleRequired: 'Operator' }]
                                    });
                                }} className="w-full border-dashed">+ Add Process Step</Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="bg-slate-50 -mx-6 -mb-6 p-4 mt-6 border-t"><Button onClick={handleSaveMFR} className="bg-indigo-600 px-8">Create Master Record</Button></DialogFooter>
                </DialogContent>
            </Dialog>
{/* Hidden Professional Printer Engine */}
            {selectedMFR && (
                <div style={{ position: 'absolute', left: '-9999px' }}>
                    <div ref={printRef} className="p-12 bg-white text-black" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'serif' }}>
                        <style>{`
                            @media print { 
                                @page { size: A4; margin: 10mm; } 
                                .mfr-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                                .mfr-table th, .mfr-table td { border: 1px solid black; padding: 6px; text-align: left; font-size: 10pt; }
                                .mfr-header { text-align: center; border-bottom: 3px double black; margin-bottom: 20px; padding-bottom: 10px; }
                                .section-title { background: #f0f0f0; font-weight: bold; padding: 5px; border: 1px solid black; margin-top: 20px; }
                            }
                        `}</style>
                        <div className="mfr-header">
                            <h1 className="text-3xl font-bold uppercase">Master Formula Record</h1>
                            <p className="text-sm font-bold mt-1">Quality Management System - Pharmacy Division</p>
                        </div>

                        <table className="mfr-table">
                            <tbody>
                                <tr>
                                    <td><strong>Product Name:</strong></td><td>{selectedMFR.productName}</td>
                                    <td><strong>MFR Number:</strong></td><td>{selectedMFR.mfrNumber}</td>
                                </tr>
                                <tr>
                                    <td><strong>Batch Size:</strong></td><td>{selectedMFR.batchSize} {selectedMFR.batchSizeUnit}</td>
                                    <td><strong>Revision:</strong></td><td>{selectedMFR.revisionNumber}</td>
                                </tr>
                                <tr>
                                    <td><strong>Dosage Form:</strong></td><td>{selectedMFR.dosageForm}</td>
                                    <td><strong>Strength:</strong></td><td>{selectedMFR.strength}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="section-title">BILL OF MATERIALS (BOM)</div>
                        <table className="mfr-table">
                            <thead>
                                <tr>
                                    <th>Item Code</th>
                                    <th>Description</th>
                                    <th>Quantity</th>
                                    <th>Unit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedMFR.ingredients.map((ing, i) => (
                                    <tr key={i}>
                                        <td>{ing.itemCode}</td>
                                        <td>{ing.description}</td>
                                        <td>{ing.quantity}</td>
                                        <td>{ing.unit}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="section-title">MANUFACTURING PROCESS STEPS</div>
                        {selectedMFR.processSteps.map((step, i) => (
                            <div key={i} className="mb-4 border p-2">
                                <strong>Step {step.stepNumber}: {step.department}</strong>
                                <p className="text-sm">{step.description}</p>
                                <p className="text-xs italic">Role: {step.roleRequired} | Status: Scheduled</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
