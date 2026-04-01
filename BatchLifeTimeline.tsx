import * as React from 'react';
import { useStore } from '@/hooks/useStore';
import {
    Package,
    FlaskConical,
    ClipboardCheck,
    Truck,
    ShieldCheck,
    AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface TimelineEvent {
    id: string;
    title: string;
    description: string;
    date: string;
    type: 'Receipt' | 'IPQC' | 'Testing' | 'Release' | 'Deviation';
    status: 'Complete' | 'Pending' | 'Warning';
}

interface BatchLifeTimelineProps {
    batchNumber: string;
}

export function BatchLifeTimeline({ batchNumber }: BatchLifeTimelineProps) {
    const { state } = useStore();

    const events = React.useMemo(() => {
        const timeline: TimelineEvent[] = [];

        // 1. Find Raw Material Receipt
        const material = state.rawMaterials.find(m => m.batchNumber === batchNumber);
        if (material) {
            timeline.push({
                id: 'receipt',
                title: 'Material Receipt',
                description: `Received ${material.name} from ${material.supplier}`,
                date: material.receivedDate,
                type: 'Receipt',
                status: 'Complete'
            });
        }

        // 2. Find IPQC Checks
        const ipqc = state.ipqcChecks.filter(i => i.batchNumber === batchNumber);
        ipqc.forEach((check, index) => {
            timeline.push({
                id: `ipqc-${index}`,
                title: `IPQC Check: ${check.stage}`,
                description: `Conducted by ${check.checkedBy}. Result: ${check.result}`,
                date: new Date(check.checkedAt).toISOString().split('T')[0],
                type: 'IPQC',
                status: check.result === 'Pass' ? 'Complete' : 'Warning'
            });
        });

        // 3. Find QC Test Results
        const tests = state.testResults.filter(t => t.batchNumber === batchNumber);
        tests.forEach((test, index) => {
            const completionDate = test.completionDate ? (test.completionDate instanceof Date ? test.completionDate.toISOString().split('T')[0] : String(test.completionDate)) : 'Pending';
            timeline.push({
                id: `test-${index}`,
                title: `QC Analysis: ${test.testMethodId}`,
                description: `Analyst: ${test.analystId}. Result: ${test.overallResult}`,
                date: completionDate,
                type: 'Testing',
                status: test.status === 'Completed' ? 'Complete' : 'Pending'
            });
        });

        // 4. Find Release (COA)
        const coa = state.coaRecords.find(c => c.batchNumber === batchNumber);
        if (coa) {
            timeline.push({
                id: 'release',
                title: 'Batch Release',
                description: `Approved by ${coa.approvedBy}. Status: ${coa.status}`,
                date: coa.issueDate,
                type: 'Release',
                status: coa.status === 'Released' ? 'Complete' : 'Pending'
            });
        }

        // Sort by date (handle 'Pending' as future date)
        return timeline.sort((a, b) => {
            if (a.date === 'Pending') return 1;
            if (b.date === 'Pending') return -1;
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
    }, [batchNumber, state]);

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
        <div className="relative space-y-8 p-4">
            {/* Central Line */}
            <div className="absolute left-9 top-4 bottom-4 w-0.5 bg-gradient-to-b from-indigo-500 via-blue-500 to-teal-500" />

            {events.map((event) => (
                <div key={event.id} className="relative flex gap-6 items-start group">
                    {/* Icon Node */}
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
                    </div>

                    {/* Content Card */}
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
