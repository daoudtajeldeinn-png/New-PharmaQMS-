import { useEffect, useMemo } from 'react';
import { useStore } from '@/hooks/useStore';
import { StatCard } from '@/components/dashboard/StatCard';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { StatusChart } from '@/components/dashboard/StatusChart';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import {
  Pill,
  FlaskConical,
  AlertTriangle,
  ClipboardCheck,
  Wrench,
  MessageSquare,
  FileWarning,
  Shield,
  Factory,
  Beaker,
  Truck,
  FileCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ValidationSuite } from '@/services/ValidationSuite';
import type { ValidationIssue } from '@/services/ValidationSuite';

export function Dashboard() {
  const { state, dispatch } = useStore();
  const now = useMemo(() => Date.now(), []);

  useEffect(() => {
    dispatch({ type: 'INITIALIZE_DATA' });
    dispatch({ type: 'UPDATE_DASHBOARD_STATS' });
  }, [dispatch]);

  const validationIssues = useMemo<ValidationIssue[]>(() => ValidationSuite.validateState(state), [state]);
  const criticalIssuesCount = useMemo(() => validationIssues.filter(i => i.type === 'Critical').length, [validationIssues]);

  const alerts = useMemo(() => [
    // OOS Alerts
    ...state.testResults
      .filter((t) => t.overallResult === 'OOS')
      .map((t) => ({
        id: `oos-${t.id}`,
        type: 'oos' as const,
        title: 'OOS Result',
        description: `Batch ${t.batchNumber} failed test`,
        date: new Date(t.testDate),
        priority: 'critical' as const,
        relatedId: t.id,
      })),
    // Calibration Alerts
    ...state.equipment
      .filter((e) => {
        if (!e.calibrationSchedule.nextCalibration) return false;
        const daysUntil = Math.ceil(
          (new Date(e.calibrationSchedule.nextCalibration).getTime() - now) /
          (1000 * 60 * 60 * 24)
        );
        return daysUntil <= 30 && daysUntil >= 0;
      })
      .map((e) => ({
        id: `cal-${e.id}`,
        type: 'calibration' as const,
        title: 'Calibration Due',
        description: `${e.name} calibration due soon`,
        date: new Date(e.calibrationSchedule.nextCalibration!),
        priority:
          Math.ceil(
            (new Date(e.calibrationSchedule.nextCalibration!).getTime() - now) /
            (1000 * 60 * 60 * 24)
          ) <= 7
            ? ('critical' as const)
            : ('high' as const),
        relatedId: e.id,
      })),
    // Expiry Alerts
    ...state.products
      .filter((p) => {
        const daysUntil = Math.ceil(
          (new Date(p.expiryDate).getTime() - now) / (1000 * 60 * 60 * 24)
        );
        return daysUntil <= 90 && daysUntil >= 0;
      })
      .map((p) => ({
        id: `exp-${p.id}`,
        type: 'expiry' as const,
        title: 'Product Expiring',
        description: `${p.name} expires in ${Math.ceil(
          (new Date(p.expiryDate).getTime() - now) / (1000 * 60 * 60 * 24)
        )} days`,
        date: new Date(p.expiryDate),
        priority:
          Math.ceil(
            (new Date(p.expiryDate).getTime() - now) / (1000 * 60 * 60 * 24)
          ) <= 30
            ? ('critical' as const)
            : ('high' as const),
        relatedId: p.id,
      })),
  ], [state.testResults, state.equipment, state.products]);

  return (
    <div className="space-y-10 animate-in fade-in zoom-in-95 duration-1000 mesh-bg-light min-h-screen p-8 rounded-[40px] shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-indigo-100 pb-8">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            Intelligence <span className="text-indigo-600">Hub</span>
          </h1>
          <p className="text-indigo-400 font-black uppercase text-[11px] tracking-[0.4em] mt-3">
            Real-time GxP Compliance & Operation Monitoring
          </p>
        </div>
        <div className="flex items-center gap-8">
          <div className="hidden xl:flex items-center gap-8 px-6 py-3 bg-white/60 backdrop-blur-xl border border-white rounded-[24px] shadow-xl">
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Assets</p>
              <p className="text-lg font-black text-indigo-600 leading-none">{state.products.length}</p>
            </div>
            <div className="w-px h-8 bg-indigo-100" />
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Global Health</p>
              <p className="text-lg font-black text-emerald-600 leading-none">98.2%</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-indigo-600 px-6 py-3 rounded-2xl shadow-lg shadow-indigo-600/30">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-black text-white uppercase tracking-widest">System Active</span>
          </div>
        </div>
      </div>

      {/* Compliance Health Ribbon */}
      <div className="glass-panel rounded-[40px] p-8 flex items-center justify-between shadow-2xl relative overflow-hidden group border-white">
        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-blue-600" />
        <div className="flex items-center gap-8 relative z-10">
          <div className={`p-5 rounded-[24px] shadow-xl ${validationIssues.length === 0 ? 'bg-emerald-500 text-white' : criticalIssuesCount > 0 ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>
            <Shield className="h-10 w-10" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Compliance Status: <span className={validationIssues.length === 0 ? 'text-emerald-600' : criticalIssuesCount > 0 ? 'text-red-600' : 'text-amber-600'}>{validationIssues.length === 0 ? 'VALIDATED' : `${validationIssues.length} DISCREPANCIES`}</span></h2>
            <p className="text-slate-500 font-bold text-xs mt-1 uppercase tracking-wider italic">Secure GxP/GDP Continuous Intelligence Stream</p>
          </div>
        </div>
        <div className="flex gap-8 items-center relative z-10">
          <div className="text-right px-8 border-r border-indigo-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap mb-1">Critical Risks</p>
            <p className={`text-3xl font-black ${criticalIssuesCount > 0 ? 'text-red-600' : 'text-slate-200'}`}>{criticalIssuesCount}</p>
          </div>
          <div className="text-right px-8 border-r border-indigo-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap mb-1">System Gaps</p>
            <p className="text-3xl font-black text-amber-500">{validationIssues.filter(i => i.type === 'Major').length}</p>
          </div>
          <Button variant="outline" className="rounded-2xl border-indigo-200 text-indigo-600 font-black h-12 px-6 uppercase tracking-widest hover:bg-indigo-50 shadow-inner">
            Full Audit Report
          </Button>
        </div>
      </div>

      {/* Actionable Issues List (Only if issues exist) */}
      {validationIssues.length > 0 && (
        <div className="glass-card rounded-[40px] overflow-hidden shadow-2xl border-red-100/30">
          <div className="bg-red-500/10 p-5 border-b border-red-100/20 flex justify-between items-center backdrop-blur-3xl">
            <h3 className="text-[11px] font-black text-red-700 uppercase tracking-[0.2em] flex items-center gap-3">
              <AlertTriangle className="h-5 w-5" />
              Intelligence Attention Required
            </h3>
            <span className="px-4 py-1.5 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">Priority Stream</span>
          </div>
          <div className="divide-y divide-red-100/10">
            {validationIssues.map((issue) => (
              <div key={issue.id} className="p-6 flex items-center justify-between hover:bg-white/40 transition-all group">
                <div className="flex items-center gap-6">
                  <Badge className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md ${issue.type === 'Critical' ? 'bg-red-600 text-white' : 'bg-amber-100 text-amber-700'}`}>
                    {issue.type}
                  </Badge>
                  <div>
                    <p className="text-base font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">{issue.description}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Component: <span className="text-slate-600">{issue.module}</span> | Sequence: {issue.targetId}</p>
                  </div>
                </div>
                {issue.autoFixable && (
                  <Button
                    size="lg"
                    className="rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 h-10 px-8"
                    onClick={() => {
                      ValidationSuite.autoFix(issue, state, dispatch);
                      toast.success('Discrepancy resolved automatically');
                    }}
                  >
                    Resolve Discrepancy
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Nav Ribbon */}
      <div className="flex flex-wrap gap-4 pb-4">
        {[
          { label: 'Quality Assurance', icon: Shield, color: 'indigo' },
          { label: 'Production Ops', icon: Factory, color: 'blue' },
          { label: 'Laboratory Hub', icon: Beaker, color: 'emerald' },
          { label: 'Supply Chain', icon: Truck, color: 'slate' },
          { label: 'Standards/GxP', icon: FileCheck, color: 'purple' },
        ].map((mod, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 bg-white/60 backdrop-blur-xl border border-white rounded-[24px] hover:border-indigo-500 hover:shadow-2xl transition-all cursor-pointer group shadow-lg">
            <div className={`p-2.5 rounded-2xl bg-${mod.color}-500 text-white group-hover:scale-125 transition-transform shadow-lg shadow-${mod.color}-500/20`}>
              <mod.icon className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 group-hover:text-indigo-600">{mod.label}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-6 grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8">
        <StatCard
          title="Assets"
          value={state.dashboardStats.totalProducts}
          icon={Pill}
          color="blue"
        />
        <StatCard
          title="Lab Queue"
          value={state.dashboardStats.pendingTests}
          icon={FlaskConical}
          color="yellow"
        />
        <StatCard
          title="OOS Stream"
          value={state.dashboardStats.oosCount}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Deviations"
          value={state.dashboardStats.openDeviations}
          icon={ClipboardCheck}
          color="orange"
        />
        <StatCard
          title="Active CAPA"
          value={state.dashboardStats.openCAPAs}
          icon={ClipboardCheck}
          color="purple"
        />
        <StatCard
          title="Assets Cal."
          value={state.dashboardStats.upcomingCalibrations}
          icon={Wrench}
          color="blue"
        />
        <StatCard
          title="Safety Feed"
          value={state.dashboardStats.openComplaints || 0}
          icon={MessageSquare}
          color="rose"
        />
        <StatCard
          title="Recalls"
          value={state.dashboardStats.activeRecalls || 0}
          icon={FileWarning}
          color="red"
        />
      </div>

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-10">
          <div className="glass-card rounded-[40px] shadow-2xl border-white overflow-hidden">
            <div className="bg-slate-900 p-6 border-b border-white/10">
              <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                Global Compliance Disposition Analytics
              </h3>
            </div>
            <div className="p-10">
              <StatusChart
                data={state.dashboardStats.productsByStatus}
                title=""
                type="bar"
              />
            </div>
          </div>

          <div className="grid gap-10 md:grid-cols-2">
            <ActivityFeed activities={state.activities} />
            <div className="glass-card rounded-[40px] shadow-2xl border-white p-8">
              <h3 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Batch Strategy Release Accuracy
              </h3>
              <StatusChart
                data={{
                  'Quarantine': state.dashboardStats.productsByStatus.Quarantine,
                  'Approved': state.dashboardStats.productsByStatus.Approved,
                  'Rejected': state.dashboardStats.productsByStatus.Rejected,
                  'Released': state.dashboardStats.productsByStatus.Released,
                }}
                title=""
                type="pie"
              />
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <AlertsPanel alerts={alerts} />

          <div className="bg-gradient-to-br from-indigo-600 via-blue-700 to-indigo-900 rounded-[40px] p-8 text-white shadow-2xl shadow-indigo-500/30 relative overflow-hidden group">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none group-hover:scale-150 transition-transform duration-1000" />
            <div className="flex items-start justify-between mb-10 relative z-10">
              <div className="p-4 bg-white/15 rounded-[24px] backdrop-blur-xl shadow-lg border border-white/20">
                <ClipboardCheck className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <p className="text-[11px] font-black uppercase tracking-widest text-indigo-200 mb-1">Intelligence Priority</p>
                <p className="text-3xl font-black italic tracking-tighter">HIGH ALERT</p>
              </div>
            </div>
            <h4 className="text-xl font-black mb-3 tracking-tight relative z-10 uppercase">Regulatory Audit Readiness</h4>
            <p className="text-sm text-indigo-100/90 mb-10 leading-relaxed font-medium relative z-10">
              Ensure investigation logs for batch BTC2024 (Market Complaints) are finalized before the next internal inspection.
            </p>
            <div className="space-y-3 relative z-10">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                <span>Finalization Data</span>
                <span>82%</span>
              </div>
              <div className="h-2.5 bg-black/20 rounded-full overflow-hidden shadow-inner">
                <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full w-[82%] shadow-lg" />
              </div>
            </div>
            <Button className="w-full mt-10 rounded-2xl bg-white text-indigo-700 hover:bg-slate-100 font-black uppercase text-[11px] tracking-[0.2em] h-12 shadow-xl relative z-10">
              Launch Inspection Protocol
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

