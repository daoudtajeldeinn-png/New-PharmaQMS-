import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'emerald' | 'rose';
  onClick?: () => void;
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  green: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  yellow: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  red: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  purple: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  orange: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  rose: 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400',
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  color = 'blue',
  onClick,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'transition-all duration-500 relative overflow-hidden group border-white/20 bg-white/40 backdrop-blur-xl glass-card',
        onClick && 'cursor-pointer hover:shadow-2xl hover:scale-[1.05] active:scale-95'
      )}
      onClick={onClick}
    >
      {/* Decorative Glow */}
      <div className={cn("absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-20 transition-opacity group-hover:opacity-40", {
        'bg-blue-500': color === 'blue',
        'bg-green-500': color === 'green',
        'bg-emerald-500': color === 'emerald',
        'bg-yellow-500': color === 'yellow',
        'bg-red-500': color === 'red',
        'bg-rose-500': color === 'rose',
        'bg-purple-500': color === 'purple',
        'bg-orange-500': color === 'orange',
      })} />

      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
        <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-indigo-600 transition-colors">
          {title}
        </CardTitle>
        <div className={cn('rounded-2xl p-3 transition-all duration-500 group-hover:rotate-[15deg] group-hover:scale-125 shadow-lg shadow-indigo-500/10', colorClasses[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-4xl font-black text-slate-900 tracking-tighter group-hover:text-indigo-900 transition-colors">{value}</div>
        {(description || trend) && (
          <div className="mt-2 flex items-center gap-2">
            {trend && (
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm',
                  trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                )}
              >
                {trend === 'up' ? '↑' : '↓'}
                {trendValue && ` ${trendValue}`}
              </span>
            )}
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
