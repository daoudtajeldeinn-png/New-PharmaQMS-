import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { BatchLifeTimeline } from '@/components/quality/BatchLifeTimeline';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, History, Download, Printer } from 'lucide-react';
import { toast } from 'sonner';

export function BatchTimelinePage() {
    const location = useLocation();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [currentBatch, setCurrentBatch] = React.useState('');

    React.useEffect(() => {
        if (location.state?.batchNumber) {
            setSearchTerm(location.state.batchNumber);
            setCurrentBatch(location.state.batchNumber);
        }
    }, [location.state]);

    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!searchTerm) {
            toast.error('Please enter a Batch ID to search');
            return;
        }
        setCurrentBatch(searchTerm);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                        <History className="h-10 w-10 text-indigo-500" />
                        Batch Lifecycle Intelligence
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">
                        End-to-end traceability and audit trail for pharmaceutical batches
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 text-[10px] font-black uppercase tracking-widest h-11 px-6">
                        <Printer className="h-4 w-4" /> Print History
                    </Button>
                    <Button variant="outline" className="gap-2 text-[10px] font-black uppercase tracking-widest h-11 px-6">
                        <Download className="h-4 w-4" /> Export Report
                    </Button>
                </div>
            </div>

            <div className="max-w-3xl mx-auto">
                <form onSubmit={handleSearch} className="relative group mb-12">
                    <Input
                        placeholder="Search Batch ID (e.g., B2024-001)..."
                        className="h-16 pl-14 pr-32 rounded-3xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-lg font-bold shadow-xl transition-all focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Button
                        type="submit"
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest px-8 shadow-indigo-500/20 shadow-lg"
                    >
                        Trace Batch
                    </Button>
                </form>

                {currentBatch ? (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 bg-indigo-500/5 p-6 rounded-3xl border border-indigo-500/10 mb-8">
                            <div className="p-4 bg-indigo-500/10 rounded-2xl">
                                <History className="h-8 w-8 text-indigo-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Active Investigation</p>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                    Tracing History for <span className="text-indigo-600">{currentBatch}</span>
                                </h2>
                            </div>
                        </div>

                        <BatchLifeTimeline batchNumber={currentBatch} />
                    </div>
                ) : (
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[40px] border-4 border-dashed border-slate-200 dark:border-slate-800 transition-all hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer" onClick={() => document.querySelector('input')?.focus()}>
                        <History className="h-20 w-20 text-slate-300 mx-auto mb-6 animate-pulse" />
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Awaiting Batch Input</h3>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-2 max-w-sm mx-auto">
                            Enter a Batch Number above to reconstruct the full manufacturing and quality history of your pharmaceutical products.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
