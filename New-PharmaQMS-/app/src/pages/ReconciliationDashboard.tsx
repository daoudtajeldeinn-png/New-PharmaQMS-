import { useMemo } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Scale
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/hooks/useStore';
import { cn } from '@/lib/utils';

export default function ReconciliationDashboard() {
    const { state, dispatch } = useStore();
    const movements = state.materialMovements;
    const reconciliations = state.reconciliationRecords;

    const stats = useMemo(() => ({
        totalMovements: movements.length,
        pendingReconciliations: reconciliations.filter(r => r.status === 'Pending').length,
        approvedReconciliations: reconciliations.filter(r => r.status === 'Completed').length,
        alerts: reconciliations.filter(r => Math.abs(r.actualYield - 100) > 2).length,
    }), [movements, reconciliations]);

    const handleApproveReconciliation = (id: string) => {
        const record = reconciliations.find(r => r.id === id);
        if (record) {
            dispatch({
                type: 'UPDATE_RECONCILIATION_RECORD',
                payload: { ...record, status: 'Completed' }
            });
        }
    };

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleString('ar-SA');
    };

    return (
        <div className="space-y-6 p-4">
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Scale className="h-6 w-6 text-indigo-600" />
                        Material Reconciliation & Yield Dashboard
                    </h1>
                    <p className="text-slate-500 text-sm">Monitor stock movements and analyze production yield losses</p>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <Card className="bg-indigo-50 border-indigo-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-indigo-600 uppercase">Total Movements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-indigo-700">{stats.totalMovements}</div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-amber-600 uppercase">Pending Review</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-amber-700">{stats.pendingReconciliations}</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-50 border-emerald-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-emerald-600 uppercase">Reconciled</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-emerald-700">{stats.approvedReconciliations}</div>
                    </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-red-600 uppercase">Deviation Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-red-700">{stats.alerts}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-3 gap-6">
                <Card className="col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                        <CardTitle className="text-lg font-bold">Yield Reconciliation Records</CardTitle>
                        <Badge variant="outline">Latest Entries</Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left">Batch ID</th>
                                    <th className="px-4 py-3 text-left">Product</th>
                                    <th className="px-4 py-3 text-left">Actual Yield (%)</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {reconciliations.map(rec => (
                                    <tr key={rec.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-mono font-bold">{rec.batchId}</td>
                                        <td className="px-4 py-3 text-slate-600">{rec.productName}</td>
                                        <td className="px-4 py-3 font-bold">
                                            <span className={cn(
                                                Math.abs(rec.actualYield - 100) > 2 ? 'text-red-600' : 'text-emerald-600'
                                            )}>
                                                {rec.actualYield.toFixed(2)}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={rec.status === 'Completed' ? 'default' : 'secondary'}>
                                                {rec.status === 'Completed' ? 'Approved' : 'Pending'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {rec.status === 'Pending' && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-indigo-600 hover:text-indigo-700 font-bold"
                                                    onClick={() => handleApproveReconciliation(rec.id)}
                                                >
                                                    Approve
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {reconciliations.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">
                                            No reconciliation records found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="border-b pb-4">
                        <CardTitle className="text-lg font-bold">Recent Material Movements</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y max-h-[500px] overflow-y-auto font-sans">
                            {movements.slice(0, 10).map(mov => (
                                <div key={mov.id} className="p-4 hover:bg-slate-50">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-xs font-bold font-mono text-indigo-600">{mov.materialId}</span>
                                        <span className="text-[10px] text-slate-400">{formatDate(mov.timestamp)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            {mov.type === 'Dispensing' ? (
                                                <TrendingDown className="h-4 w-4 text-red-500" />
                                            ) : (
                                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                                            )}
                                            <span className="text-sm font-medium">
                                                {mov.type === 'Dispensing' ? 'Dispensed to Batch' : 'Receipt / Return'}
                                            </span>
                                        </div>
                                        <span className={cn(
                                            "font-mono font-bold",
                                            mov.type === 'Dispensing' ? "text-red-600" : "text-emerald-600"
                                        )}>
                                            {mov.type === 'Dispensing' ? '-' : '+'}{mov.quantity} {mov.unit}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-1">
                                        Batch: {mov.batchId || 'N/A'} | Operator: {mov.operator}
                                    </div>
                                </div>
                            ))}
                            {movements.length === 0 && (
                                <div className="p-8 text-center text-slate-400 italic">
                                    No movements recorded
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
