import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Activity, ShieldAlert, User, Clock } from 'lucide-react';

export default function AdminAuditLog() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
        
        // Setup real-time subscription
        const channel = supabase
            .channel('audit_logs_changes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
                setLogs((prev) => [payload.new, ...prev]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);
            
            if (error) {
                console.error('Error fetching logs:', error);
            } else if (data) {
                setLogs(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatAction = (action: string) => {
        return action.replace(/_/g, ' ').toUpperCase();
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short', day: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
        });
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                        <ShieldAlert className="h-6 w-6 text-indigo-500" />
                        Administrator Audit Trail
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">Real-time oversight of all company-wide activities.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Live Connection</span>
                </div>
            </div>

            <Card className="border-indigo-500/20 shadow-xl shadow-indigo-500/5">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="uppercase text-sm tracking-widest text-slate-500 flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Live Activity Feed
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-slate-400">Loading audit trail securely...</div>
                    ) : logs.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">No activity logged yet. System is monitoring.</div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[70vh] overflow-y-auto">
                            {logs.map((log) => (
                                <div key={log.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-start gap-4 group">
                                    <div className="mt-1 p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-full shrink-0 group-hover:scale-110 transition-transform">
                                        <User className="h-4 w-4 text-indigo-500" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                User <span className="font-bold text-indigo-600 dark:text-indigo-400">{log.user_name || log.user_id || 'System'}</span> performed action:
                                            </p>
                                            <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                                                <Clock className="h-3 w-3" />
                                                {formatDate(log.created_at)}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                                                {formatAction(log.action)}
                                            </Badge>
                                            <span className="text-xs text-slate-500 uppercase font-bold">ON {log.entity_type}</span>
                                            <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">
                                                {log.entity_id}
                                            </span>
                                        </div>
                                        {log.details && (
                                            <p className="text-xs text-slate-500 mt-2 bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800 font-mono break-all">
                                                {JSON.stringify(log.details)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
