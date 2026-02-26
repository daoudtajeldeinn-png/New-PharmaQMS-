import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Pill,
  FlaskConical,
  ClipboardCheck,
  AlertTriangle,
  Wrench,
  Beaker,
  GraduationCap,
  Users,
  Truck,
  FileText,
  Settings,
  ChevronRight,
  FileCheck,
  MessageSquare,
  Terminal,
  Timer,
  History as HistoryIcon,
  Factory,
  Shield,
  RefreshCw,
  Package,
  Scale,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSecurity } from '@/components/security/SecurityProvider';
import { toast } from 'sonner';
import { backupSessionData } from '@/services/BackupService';
import { Database } from 'lucide-react';

interface MenuItem {
  label: string;
  icon: React.ElementType;
  path?: string;
  children?: MenuItem[];
  badge?: string;
}

const BASE_MENU_ITEMS: MenuItem[] = [
  { label: 'Intelligence Hub', icon: LayoutDashboard, path: '/' },
  {
    label: 'Inventory Control',
    icon: Pill,
    children: [
      { label: 'Product Registry', icon: ChevronRight, path: '/products' },
      { label: 'Material Archive', icon: ChevronRight, path: '/products/api' },
      { label: 'Finished Goods', icon: ChevronRight, path: '/products/finished' },
    ],
  },
  {
    label: 'Material Inventory',
    icon: Package,
    path: '/materials',
    badge: 'NEW'
  },
  {
    label: 'Lab Operations',
    icon: FlaskConical,
    children: [
      { label: 'Test Records', icon: ChevronRight, path: '/testing/results' },
      { label: 'STP Protocols', icon: ChevronRight, path: '/testing/methods' },
      { label: 'OOS Management', icon: ChevronRight, path: '/testing/oos' },
      { label: 'Pharmacopeia', icon: ChevronRight, path: '/testing/pharmacopeia' },
    ],
  },
  { label: 'Stability Center', icon: Timer, path: '/stability' },
  { label: 'IPQC Monitor', icon: Factory, path: '/ipqc' },
  { label: 'COA Foundry', icon: FileCheck, path: '/coa' },
  {
    label: 'Production Line',
    icon: LayoutDashboard,
    children: [
      { label: 'MFR Templates', icon: ChevronRight, path: '/mfr' },
      { label: 'BMR Execution', icon: ChevronRight, path: '/bmr' },
      { label: 'Batch Trace', icon: HistoryIcon, path: '/batch-trace' },
      { label: 'Material Balance', icon: Scale, path: '/reconciliation' },
    ],
  },
  { label: 'CAPA Lifecycle', icon: ClipboardCheck, path: '/capa' },
  { label: 'Deviations Hub', icon: AlertTriangle, path: '/deviations' },
  {
    label: 'Market Safety',
    icon: MessageSquare,
    children: [
      { label: 'Complaints Hub', icon: ChevronRight, path: '/complaints' },
      { label: 'Recall Actions', icon: ChevronRight, path: '/recalls' },
    ],
  },
  {
    label: 'Asset Compliance',
    icon: Wrench,
    children: [
      { label: 'Equipment Log', icon: ChevronRight, path: '/equipment' },
      { label: 'Calibration', icon: ChevronRight, path: '/equipment/calibration' },
      { label: 'Maintenance', icon: ChevronRight, path: '/equipment/maintenance' },
    ],
  },
  {
    label: 'Lab Reagents',
    icon: Beaker,
    children: [
      { label: 'Inventory', icon: ChevronRight, path: '/lab/reagents' },
      { label: 'Ref Standards', icon: ChevronRight, path: '/lab/standards' },
    ],
  },
  {
    label: 'Quality Systems',
    icon: Shield,
    children: [
      { label: 'GMP Compliance', icon: ChevronRight, path: '/quality/gmp' },
      { label: 'GDP Standards', icon: ChevronRight, path: '/quality/gdp' },
    ],
  },
  {
    label: 'HR & Training',
    icon: GraduationCap,
    children: [
      { label: 'Training Logs', icon: ChevronRight, path: '/training/records' },
      { label: 'Competency Matrix', icon: ChevronRight, path: '/training/competency' },
    ],
  },
  { label: 'Audit Bureau', icon: Users, path: '/audits' },
  { label: 'Supply Chain', icon: Truck, path: '/suppliers' },
  { label: 'System Analytics', icon: FileText, path: '/reports' },
  { label: 'System Service', icon: RefreshCw, path: '/maintenance' },
  { label: 'Global Settings', icon: Settings, path: '/settings' },
];

const getMenuItems = (): MenuItem[] => {
  const items = [...BASE_MENU_ITEMS];

  if (import.meta.env.DEV) {
    items.push({ label: 'System Activation', icon: Terminal, path: '/dev/licensing' });
  }

  return items;
};

function MenuItemComponent({ item, depth = 0 }: { item: MenuItem; depth?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  const content = (isActive: boolean = false) => (
    <div
      className={cn(
        'group flex items-center justify-between rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all duration-300 mb-1',
        isActive
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
          : 'text-slate-500 hover:text-white hover:bg-white/5',
        hasChildren && isOpen && 'text-indigo-400'
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "p-1.5 rounded-lg transition-all duration-300",
          isActive ? "bg-white/20 rotate-0 shadow-inner" : "bg-white/5 border border-white/5 group-hover:border-indigo-500/50 group-hover:rotate-6"
        )}>
          <item.icon className="h-3.5 w-3.5" />
        </div>
        <span>{item.label}</span>
        {item.badge && (
          <span className="px-2 py-0.5 text-[9px] bg-emerald-500 text-white rounded-full ml-2">
            {item.badge}
          </span>
        )}
      </div>
      {hasChildren && (
        <div className="transition-transform duration-300" style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0)' }}>
          <ChevronRight className="h-3 w-3 opacity-40 group-hover:opacity-100" />
        </div>
      )}
    </div>
  );

  if (hasChildren) {
    return (
      <div className="space-y-1">
        <button className="w-full" onClick={() => setIsOpen(!isOpen)}>
          {content(false)}
        </button>
        {isOpen && (
          <div className="space-y-1 ml-4 border-l border-white/5 pl-2 transition-all duration-500 animate-in slide-in-from-left-2">
            {item.children!.map((child, index) => (
              <MenuItemComponent key={index} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.path || '#'}
      className={(props: any) => cn("block", props.isActive && "active")}
    >
      {((props: { isActive: boolean }) => content(props.isActive)) as any}
    </NavLink>
  );
}

export function Sidebar() {
  const { logout, user } = useSecurity();
  const menuItems = getMenuItems();

  const handleLogout = () => {
    if (window.confirm('Terminate current session?')) {
      logout();
      toast.success('Session terminated');
    }
  };

  return (
    <aside className="fixed top-0 left-0 z-50 h-screen w-72 flex flex-col bg-slate-900/95 backdrop-blur-2xl border-r border-white/10 shadow-2xl overflow-hidden glass-panel">
      {/* Mesh Background Decor */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="p-8 pb-4 relative z-10">
        <div className="flex items-center gap-4 group">
          <div className="relative">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-500" />
            <div className="relative p-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl shadow-lg border border-white/20">
              <Shield className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tighter leading-none mb-1">
              Pharma<span className="text-indigo-400">QMS</span>
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Suite v.Nano</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-6 overflow-y-auto custom-scrollbar relative z-10">
        <div className="mb-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-2">Main Navigation</p>
          {menuItems.map((item, index) => (
            <MenuItemComponent key={index} item={item} />
          ))}
        </div>

        <div className="mt-8 pt-4 border-t border-white/5">
          <Button
            onClick={backupSessionData}
            variant="ghost"
            className="w-full justify-start gap-4 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400 font-black uppercase text-[10px] tracking-widest px-4 h-12 rounded-xl border border-amber-500/10 transition-all duration-300"
          >
            <Database className="h-4 w-4" />
            <span>Emergency Backup</span>
          </Button>
        </div>
      </nav>

      <div className="p-6 bg-slate-950/40 border-t border-white/10 space-y-6 relative z-10">
        <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all group cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 border border-white/20 flex items-center justify-center text-white font-black text-sm shadow-lg group-hover:scale-110 transition-transform">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-[11px] font-black text-white truncate uppercase">{user?.name || 'Administrator'}</p>
            <p className="text-[9px] font-bold text-indigo-400 truncate uppercase mt-0.5 tracking-widest leading-none">{user?.role || 'Safety Officer'}</p>
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-rose-500 transition-colors" title="Terminate Session">
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        <div className="text-center relative">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-3">Professional Suite</p>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500 opacity-50" />
            <h3 className="text-[12px] font-black text-white uppercase tracking-tight mb-1">DIGITAL QUALITY ASSURANCE</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase leading-snug mb-3">Enterprise GxP compliance engine for pharmaceutical manufacturing and laboratory excellence.</p>
            <div className="pt-2 border-t border-white/5">
              <p className="text-[10px] font-black text-emerald-400 uppercase mb-0.5">Dr. Daoud Tajeldeinn Ahmed</p>
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">GMP, GLP, ISO, QC, QA specialist</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}