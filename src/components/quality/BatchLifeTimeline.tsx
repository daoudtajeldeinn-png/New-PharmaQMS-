import * as React from 'react';
import { useStore } from '@/hooks/useStore';
import {
    Package,
    FlaskConical,
    ClipboardCheck,
    Truck,
    ShieldCheck,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { formatDateSafe } from '@/lib/dateUtils';
import { fetchBatchTraceability, type BatchTraceData } from '@/services/TraceabilityService';

interface TimelineEvent {
    id: string;
    title: string;
    description: string;
    date: string;
    type: 'Receipt' | 'IPQC' | 'Testing' | 'Release' | 'Deviation' | 'Production';
    status: 'Complete' | 'Pending' | 'Warning';
}

interface BatchLifeTimelineProps {
    batchNumber: string;
}

export function BatchLifeTimeline({ batchNumber }: BatchLifeTimelineProps) {
    const { state } = useStore();
    const [traceData, setTraceData] = React.useState<BatchTraceData | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        async function loadTrace() {
            if (!batchNumber) return;
            setLoading(true);
            setError(null);
            try {
                const data = await fetchBatchTraceability(batchNumber);
                setTraceData(data);
                if (data.error) setError(data.error);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch batch trace');
            } finally {
                setLoading(false);
            }
        }
        loadTrace();
    }, [batchNumber]);

    const events = React.useMemo(() => {
        const timeline: TimelineEvent[] = [];

        // Fallback to local state if Supabase fetch is not yet complete or has no data
        const localMaterial = state.rawMaterials.find(m => m.batchNumber === batchNumber);
        const material = traceData?.rawMaterial || localMaterial;
        
        if (material) {
            timeline.push({
                id: 'receipt',
                title: 'Material Receipt',
                description: `Received ${material.name} from ${material.supplier}`,
                date: formatDateSafe(material.receivedDate),
                type: 'Receipt',
                status: 'Complete'
            });
        }

        // 2. IPQC Checks
        const ipqc = traceData?.ipqcChecks.length ? traceData.ipqcChecks : state.ipqcChecks.filter(i => i.batchNumber === batchNumber);
        ipqc.forEach((check, index) => {
            timeline.push({
                id: `ipqc-${index}`,
                title: `IPQC Check: ${check.stage}`,
                description: `Conducted by ${check.checkedBy}. Result: ${check.result}`,
                date: formatDateSafe(check.checkedAt),
                type: 'IPQC',
                status: check.result === 'Pass' ? 'Complete' : 'Warning'
            });
        });

        // 3. QC Test Results
        const tests = traceData?.testResults.length ? traceData.testResults : state.testResults.filter(t => t.batchNumber === batchNumber);
        tests.forEach((test, index) => {
            timeline.push({
                id: `test-${index}`,
                title: `QC Analysis: ${test.testMethodId}`,
                description: `Analyst: ${test.analystId}. Result: ${test.overallResult}`,
                date: formatDateSafe(test.completionDate || test.testDate),
                type: 'Testing',
                status: test.status === 'Completed' ? 'Complete' : 'Pending'
            });
        });

        // 4. Batch Release (COA)
        const localCoa = state.coaRecords.find(c => c.batchNumber === batchNumber);
        const coa = traceData?.coaRecord || localCoa;
        if (coa) {
            timeline.push({
                id: 'release',
                title: 'Batch Release',
                description: `Approved by ${coa.approvedBy}. Status: ${coa.status}`,
                date: formatDateSafe(coa.issueDate),
                type: 'Release',
                status: coa.status === 'Released' || coa.status === 'Approved' ? 'Complete' : 'Pending'
            });
        }

        // 5. Production (BMR)
        const bmr = traceData?.bmrData;
        if (bmr) {
            timeline.push({
                id: 'bmr',
                title: 'Manufacturing Cycle',
                description: `Batch Record #${bmr.id} | Status: ${bmr.status}`,
                date: formatDateSafe(bmr.updated_at),
                type: 'Production',
                status: bmr.status === 'Completed' ? 'Complete' : 'Pending'
            });
        }

        return timeline.sort((a, b) => {
            if (a.date === 'Pending') return 1;
            if (b.date === 'Pending') return -1;
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
    }, [batchNumber, state, traceData]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Reconstructing Batch History...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-red-50 rounded-3xl border-2 border-dashed border-red-200">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-bold text-red-900 uppercase tracking-tight">Traceability Error</h3>
                <p className="text-sm text-red-600 font-medium text-center max-w-xs mt-2">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest"
                >
                    Retry Fetch
                </button>
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <Package className="h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">No Timeline Data</h3>
                <p className="text-sm text-slate-500 font-medium text-center max-w-xs mt-2">
                    We couldn't find any historical records for Batch ID: <span className="font-mono text-indigo-500">{batchNumber}</span>
                </p>
            </div>
        );
    }

    return (
        <div className="relative space-y-8 p-4 animate-in fade-in duration-500">
            <div className="absolute left-9 top-4 bottom-4 w-0.5 bg-gradient-to-b from-indigo-500 via-blue-500 to-teal-500 opacity-30" />

            {events.map((event) => (
                <div key={event.id} className="relative flex gap-6 items-start group">
                    <div className={cn(
                        "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white dark:border-slate-950 shadow-lg transition-all group-hover:scale-110",
                        event.status === 'Complete' ? "bg-indigo-600 shadow-indigo-500/20" :
                            event.status === 'Warning' ? "bg-amber-500 shadow-amber-500/20" : "bg-slate-200 dark:bg-slate-800"
                    )}>
                        {event.type === 'Receipt' && <Truck className="h-4 w-4 text-white" />}
                        {event.type === 'IPQC' && <ClipboardCheck className="h-4 w-4 text-white" />}
                        {event.type === 'Testing' && <FlaskConical className="h-4 w-4 text-white" />}
                        {event.type === 'Release' && <ShieldCheck className="h-4 w-4 text-white" />}
                        {event.type === 'Deviation' && <AlertCircle className="h-4 w-4 text-white" />}
                        {event.type === 'Production' && <Package className="h-4 w-4 text-white" />}
                    </div>

                    <div className="flex-1 space-y-2 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:border-indigo-500/30 hover:shadow-md">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                    {event.title}
                                </h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                    {event.date}
                                </p>
                            </div>
                            <Badge variant={event.status === 'Complete' ? 'default' : 'secondary'} className="text-[10px] uppercase font-black px-2">
                                {event.status}
                            </Badge>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                            {event.description}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
