import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface StatusChartProps {
  data: Record<string, number>;
  title: string;
  type?: 'bar' | 'pie';
  colors?: string[];
}

const defaultColors = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#ef4444', // red
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
];

const statusLabels: Record<string, string> = {
  Quarantine: 'حجر',
  Approved: 'معتمد',
  Rejected: 'مرفوض',
  Released: 'مفرج',
  Blocked: 'محظور',
  Expired: 'منتهي',
  Under_Test: 'قيد الاختبار',
};

export function StatusChart({
  data,
  title,
  type = 'bar',
  colors = defaultColors,
}: StatusChartProps) {
  const chartData = Object.entries(data).map(([key, value]) => ({
    name: statusLabels[key] || key,
    value,
    key,
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {type === 'bar' ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip
                formatter={(value: number) => [value, 'العدد']}
                labelFormatter={(label) => label}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [value, 'العدد']} />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
        {total > 0 && (
          <p className="mt-4 text-center text-sm text-slate-500">
            الإجمالي: {total}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
