import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Activity } from '@/types';
import {
  Pill,
  FlaskConical,
  AlertTriangle,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Users,
} from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';

interface ActivityFeedProps {
  activities: Activity[];
}

const activityIcons: Record<string, React.ElementType> = {
  Product_Created: Pill,
  Product_Updated: Pill,
  Test_Completed: FlaskConical,
  OOS_Investigation: AlertTriangle,
  Deviation_Created: AlertTriangle,
  CAPA_Created: ClipboardCheck,
  CAPA_Closed: ClipboardCheck,
  Document_Approved: FileText,
  Training_Completed: GraduationCap,
  Audit_Completed: Users,
  Complaint_Created: AlertTriangle,
  Recall_Initiated: FileText,
};

const activityColors: Record<string, string> = {
  Product_Created: 'text-blue-600 bg-blue-100',
  Product_Updated: 'text-blue-600 bg-blue-100',
  Test_Completed: 'text-green-600 bg-green-100',
  OOS_Investigation: 'text-red-600 bg-red-100',
  Deviation_Created: 'text-orange-600 bg-orange-100',
  CAPA_Created: 'text-purple-600 bg-purple-100',
  CAPA_Closed: 'text-green-600 bg-green-100',
  Document_Approved: 'text-indigo-600 bg-indigo-100',
  Training_Completed: 'text-cyan-600 bg-cyan-100',
  Audit_Completed: 'text-pink-600 bg-pink-100',
  Complaint_Created: 'text-rose-600 bg-rose-100',
  Recall_Initiated: 'text-red-700 bg-red-100',
};

const activityLabels: Record<string, string> = {
  Product_Created: 'New Product registered',
  Product_Updated: 'Product record updated',
  Test_Completed: 'Analysis finalized',
  OOS_Investigation: 'OOS investigation logic',
  Deviation_Created: 'Deviation logged',
  CAPA_Created: 'CAPA record initiated',
  CAPA_Closed: 'CAPA finalized/closed',
  Document_Approved: 'System SOP approved',
  Training_Completed: 'Staff training verified',
  Audit_Completed: 'Protocol audit finalized',
  Complaint_Created: 'Market complaint logged',
  Recall_Initiated: 'PRODUCT RECALL INITIATED',
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card className="h-full border-white/20 bg-white/40 backdrop-blur-xl glass-card overflow-hidden">
      <CardHeader className="bg-slate-900/5 dark:bg-white/5 border-b border-white/10">
        <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
          Intelligence Stream
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[450px]">
          <div className="divide-y divide-white/10">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
                <div className="p-4 rounded-full bg-slate-50 mb-4 scale-150 grayscale opacity-20">📊</div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Signal Lost: No active data stream</p>
              </div>
            ) : (
              activities.map((activity) => {
                const Icon = activityIcons[activity.type] || FileText;
                const colorClass = activityColors[activity.type] || 'text-slate-600 bg-slate-100';
                const label = activityLabels[activity.type] || activity.type;

                return (
                  <div key={activity.id} className="p-6 flex items-start gap-4 hover:bg-white/40 transition-all group">
                    <div className={cn(`rounded-2xl p-3 shadow-lg transition-transform group-hover:scale-110`, colorClass)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-[11px] font-black uppercase tracking-tight text-slate-900">
                          {label}
                        </p>
                        <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">{formatDistanceToNow(activity.timestamp)}</span>
                      </div>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed mb-2 truncate group-hover:whitespace-normal transition-all">{activity.description}</p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Users className="h-2 w-2 text-indigo-600" />
                          </div>
                          <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">{activity.user}</span>
                        </div>
                        <span className="text-slate-200">|</span>
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Validated Event</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
