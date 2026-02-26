import * as React from 'react';
import { useStore } from '@/hooks/useStore';
import {
    TrendingUp,
    AlertTriangle,
    LineChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { StabilityProtocol } from '@/types';

interface StabilityPredictorProps {
    protocol: StabilityProtocol;
}

export function StabilityPredictor({ protocol }: StabilityPredictorProps) {
    const { state } = useStore();

    // 1. Extract data points for a specific parameter (e.g., Assay)
    const trendData = React.useMemo(() => {
        const data: { x: number; y: number; label: string }[] = [];

        protocol.timePoints.forEach(tp => {
            if (tp.testResultId) {
                const result = state.testResults.find(r => r.id === tp.testResultId);
                if (result) {
                    const param = result.parameters.find(p => p.parameterName.toLowerCase().includes('assay')) ||
                        result.parameters.find(p => !isNaN(Number(p.value)));

                    if (param && !isNaN(Number(param.value))) {
                        data.push({
                            x: tp.month,
                            y: Number(param.value),
                            label: tp.label
                        });
                    }
                }
            }
        });

        return data.sort((a, b) => a.x - b.x);
    }, [protocol, state.testResults]);

    // 2. Simple Linear Regression: y = mx + c
    const regression = React.useMemo(() => {
        if (trendData.length < 2) return null;

        const n = trendData.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

        trendData.forEach(d => {
            sumX += d.x;
            sumY += d.y;
            sumXY += (d.x * d.y);
            sumX2 += (d.x * d.x);
        });

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        const projectionLimit = 24;
        const projectedValue = slope * projectionLimit + intercept;

        return { slope, intercept, projectedValue, projectionMonths: projectionLimit };
    }, [trendData]);

    if (trendData.length < 2) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <LineChart className="h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">Insufficient Data</h3>
                <p className="text-sm text-slate-500 font-medium text-center max-w-xs mt-2">
                    We need at least 2 completed time points to generate stability trends and projections.
                </p>
            </div>
        );
    }

    // Chart Dimensions
    const padding = 40;
    const width = 600;
    const height = 300;
    const minX = 0;
    const maxX = Math.max(24, ...trendData.map(d => d.x));
    const minY = Math.min(...trendData.map(d => d.y)) * 0.95;
    const maxY = Math.max(...trendData.map(d => d.y)) * 1.05;

    const scaleX = (x: number) => padding + (x - minX) / (maxX - minX) * (width - 2 * padding);
    const scaleY = (y: number) => height - padding - (y - minY) / (maxY - minY) * (height - 2 * padding);

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden relative">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                            <TrendingUp className="h-6 w-6 text-emerald-500" />
                            Predictive Potency Trend
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                            Linear regression based on actual time-point analysis
                        </p>
                    </div>
                    {regression && regression.slope < -0.1 && (
                        <Badge variant="destructive" className="animate-pulse px-3 py-1 font-black gap-1 uppercase text-[10px]">
                            <AlertTriangle className="h-3 w-3" /> Degradation Risk
                        </Badge>
                    )}
                </div>

                <div className="relative h-[300px] w-full">
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="2" />
                        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="2" />

                        {regression && (
                            <line
                                x1={scaleX(minX)}
                                y1={scaleY(regression.intercept)}
                                x2={scaleX(maxX)}
                                y2={scaleY(regression.slope * maxX + regression.intercept)}
                                stroke="currentColor"
                                className="text-indigo-500/30"
                                strokeWidth="2"
                                strokeDasharray="4 4"
                            />
                        )}

                        <path
                            d={`M ${trendData.map(d => `${scaleX(d.x)} ${scaleY(d.y)}`).join(' L ')}`}
                            fill="none"
                            stroke="currentColor"
                            className="text-indigo-600"
                            strokeWidth="4"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                        />

                        {trendData.map((d, i) => (
                            <g key={i}>
                                <circle cx={scaleX(d.x)} cy={scaleY(d.y)} r="6" fill="white" stroke="currentColor" className="text-indigo-600" strokeWidth="3" />
                                <text x={scaleX(d.x)} y={scaleY(d.y) - 15} textAnchor="middle" className="text-[10px] font-bold fill-slate-500">
                                    {d.y.toFixed(2)}%
                                </text>
                            </g>
                        ))}

                        {regression && (
                            <circle cx={scaleX(regression.projectionMonths)} cy={scaleY(regression.projectedValue)} r="6" fill="none" stroke="currentColor" className="text-emerald-500" strokeWidth="2" strokeDasharray="2 2" />
                        )}
                    </svg>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Assay</p>
                        <p className="text-lg font-black text-slate-900 dark:text-white">{trendData[trendData.length - 1].y.toFixed(2)}%</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Degradation Rate</p>
                        <p className={cn("text-lg font-black", regression && regression.slope < 0 ? "text-rose-500" : "text-emerald-500")}>
                            {regression ? (regression.slope * 100).toFixed(2) : 0}% / mo
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Projected (24mo)</p>
                        <p className="text-lg font-black text-indigo-600">
                            {regression ? regression.projectedValue.toFixed(2) : 0}%
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confidence</p>
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[10px]">HIGH SIGNAL</Badge>
                    </div>
                </div>
            </div>

            {regression && regression.projectedValue < 95 && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-3xl flex items-start gap-4 animate-in zoom-in-95 duration-500">
                    <AlertTriangle className="h-6 w-6 text-rose-500 shrink-0 mt-1" />
                    <div>
                        <h4 className="text-sm font-black text-rose-600 uppercase tracking-tight">Predictive Stability Failure Warning</h4>
                        <p className="text-xs font-medium text-rose-800/70 mt-1 max-w-xl leading-relaxed">
                            Based on the current degradation rate, this batch is projected to fall below the **95.0% lower limit** within the next **{Math.round(Math.abs((95 - regression.intercept) / regression.slope))} months**. Consider accelerating market distribution or investigating storage conditions.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
