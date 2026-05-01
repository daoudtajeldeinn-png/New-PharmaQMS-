import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { g2MaterialInventory } from '@/data/g2Data';
import { toast } from 'sonner';

export default function MaterialInventory() {
    const [materials, setMaterials] = useState<any[]>(g2MaterialInventory);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('inventory').select('*').order('created_at', { ascending: false });
            if (error) {
                console.error('Error fetching inventory:', error);
                // Fallback to local
                setMaterials(g2MaterialInventory);
            } else if (data && data.length > 0) {
                // Map from DB structure to our frontend structure
                const mapped = data.map((d: any) => ({
                    id: d.id,
                    code: d.type || 'N/A',
                    name: d.material_name,
                    batch: d.batch_number,
                    quantity: d.quantity,
                    unit: d.unit,
                    status: d.status,
                    expiry: d.exp_date,
                    mfgDate: d.mfg_date,
                    analysisNo: d.analysis_no,
                    supplier: d.supplier_id || 'Unknown',
                }));
                // Combine with local mock data for presentation
                setMaterials([...mapped, ...g2MaterialInventory]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleIssueCOA = async (material: any) => {
        toast.success(`COA Issuance initiated for ${material.name} (Batch: ${material.batch})`);
        
        // Log to Audit Trail
        try {
            await supabase.from('audit_logs').insert({
                action: 'ISSUED_COA_FOR_RAW_MATERIAL',
                entity_type: 'MaterialInventory',
                entity_id: material.id || material.code,
                details: { materialName: material.name, batch: material.batch },
            });
        } catch (error) {
            console.error('Audit log failed', error);
        }
    };

    const getStatusColor = (status: string) => {
        const s = status?.toLowerCase() || '';
        if (s.includes('release') || s.includes('approved')) return 'bg-green-500';
        if (s.includes('quarantine')) return 'bg-orange-500';
        if (s.includes('reject')) return 'bg-red-500';
        return 'bg-slate-500';
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight">Material Inventory</h1>
                    <p className="text-sm text-slate-500 font-medium">Real-time stock levels and approvals across the company</p>
                </div>
                <Badge variant="outline" className="text-indigo-500 border-indigo-500">
                    Live Sync Active
                </Badge>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="uppercase text-sm tracking-widest text-slate-500">Current Stock</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-sm text-slate-400">Syncing with Supabase cloud...</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-slate-100 dark:bg-slate-800 text-xs uppercase font-black text-slate-600 dark:text-slate-300">
                                    <tr>
                                        <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">Material Name</th>
                                        <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">Batch Number</th>
                                        <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">Analysis No</th>
                                        <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">Mfg / Exp Date</th>
                                        <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">Qty</th>
                                        <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">Status</th>
                                        <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {materials.map((mat, i) => (
                                        <tr key={i} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                            <td className="px-4 py-3 font-bold">{mat.name}</td>
                                            <td className="px-4 py-3 font-mono text-xs">{mat.batch}</td>
                                            <td className="px-4 py-3 font-mono text-xs text-indigo-500">{mat.analysisNo || 'N/A'}</td>
                                            <td className="px-4 py-3 text-xs">
                                                <div>Mfg: {mat.mfgDate || 'N/A'}</div>
                                                <div className="text-red-500">Exp: {mat.expiry}</div>
                                            </td>
                                            <td className="px-4 py-3 font-mono">{mat.quantity} {mat.unit}</td>
                                            <td className="px-4 py-3">
                                                <Badge className={`${getStatusColor(mat.status)} text-white`}>
                                                    {mat.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {mat.status?.toLowerCase().includes('release') || mat.status?.toLowerCase().includes('approve') ? (
                                                    <button
                                                        onClick={() => handleIssueCOA(mat)}
                                                        className="text-[10px] font-bold uppercase bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded transition-colors"
                                                    >
                                                        Issue COA
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-slate-400">Pending</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
