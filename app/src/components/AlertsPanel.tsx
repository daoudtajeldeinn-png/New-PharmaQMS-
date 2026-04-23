import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Clock,
  Calendar,
  ChevronLeft,
  FlaskConical,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Alert {
  id: string;
  type: 'oos' | 'calibration' | 'expiry' | 'deviation' | 'test';
  title: string;
  description: string;
  date: Date;
  priority: 'critical' | 'high' | 'medium' | 'low';
  relatedId?: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
}

const alertIcons: Record<string, React.ElementType> = {
  oos: FlaskConical,
  calibration: Wrench,
  expiry: Calendar,
  deviation: AlertTriangle,
  test: Clock,
};

const alertColors: Record<string, string> = {
  critical: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400',
  high: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400',
  medium: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400',
  low: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
};

const priorityLabels: Record<string, string> = {
  critical: 'حرج',
  high: 'عالي',
  medium: 'متوسط',
  low: 'منخفض',
};

const typeLabels: Record<string, string> = {
  oos: 'OOS',
  calibration: 'معايرة',
  expiry: 'انتهاء صلاحية',
  deviation: 'انحراف',
  test: 'اختبار',
};

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const sortedAlerts = [...alerts].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>التنبيهات والإشعارات</CardTitle>
        <Badge variant="secondary">{alerts.length} تنبيه</Badge>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {sortedAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <AlertTriangle className="mb-2 h-12 w-12" />
                <p>لا توجد تنبيهات حالية</p>
              </div>
            ) : (
              sortedAlerts.map((alert) => {
                const Icon = alertIcons[alert.type];
                return (
                  <div
                    key={alert.id}
                    className={cn(
                      'rounded-lg border p-3 transition-colors',
                      alertColors[alert.priority]
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <Icon className="mt-0.5 h-4 w-4" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{alert.title}</span>
                            <Badge
                              variant="outline"
                              className="text-xs"
                            >
                              {typeLabels[alert.type]}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm opacity-90">
                            {alert.description}
                          </p>
                          <div className="mt-2 flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {alert.date.toLocaleDateString('ar-SA')}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs',
                                alert.priority === 'critical' && 'border-red-300',
                                alert.priority === 'high' && 'border-orange-300',
                                alert.priority === 'medium' && 'border-yellow-300',
                                alert.priority === 'low' && 'border-blue-300'
                              )}
                            >
                              {priorityLabels[alert.priority]}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
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
