import { useState } from 'react';
import {
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { GlobalSearch } from './GlobalSearch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSecurity } from '@/components/security/SecurityProvider';
import { toast } from 'sonner';

interface HeaderProps {
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export function Header({ onMenuToggle, isMenuOpen }: HeaderProps) {
  // ✅ إضافة: استيراد useSecurity للحصول على بيانات المستخدم ودالة logout
  const { user, logout } = useSecurity();

  const [notifications] = useState([
    {
      id: 1,
      title: 'OOS Result Detected',
      message: 'Amoxicillin batch AMX2024002 failed assay test',
      time: '2 hours ago',
      type: 'error',
      read: false,
    },
    {
      id: 2,
      title: 'Calibration Due',
      message: 'HPLC System 1 calibration due in 5 days',
      time: '1 day ago',
      type: 'warning',
      read: false,
    },
    {
      id: 3,
      title: 'Product Expiring',
      message: 'Insulin Glargine batch INS-2024-004 expires in 30 days',
      time: '2 days ago',
      type: 'info',
      read: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ✅ إضافة: دالة معالجة تسجيل الخروج مع تأكيد
  const handleLogout = () => {
    // تأكيد قبل تسجيل الخروج
    const confirmed = window.confirm('هل أنت متأكد من تسجيل الخروج؟\nسيتم إنهاء جلستك الحالية.');

    if (confirmed) {
      logout();
      toast.success('تم تسجيل الخروج بنجاح');
    }
  };

  return (
    <header className="fixed top-0 z-30 flex h-20 items-center justify-between border-b border-white/10 bg-white/60 backdrop-blur-2xl dark:bg-slate-900/60 px-8 left-72 right-0 glass-panel">
      <div className="flex items-center gap-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="lg:hidden"
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-4">
        {/* Quick Help Status */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">System Secure</span>
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative group">
              <div className="absolute -inset-1 bg-indigo-500 rounded-full blur opacity-0 group-hover:opacity-20 transition" />
              <Bell className="h-5 w-5 relative" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5 flex items-center justify-center rounded-full p-0 text-[10px] font-black border-2 border-white shadow-lg"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96 glass-card border-none p-0 overflow-hidden mt-2">
            <div className="bg-slate-900 p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white uppercase tracking-widest">Active Alerts</span>
                <Badge variant="secondary" className="bg-white/10 text-white border-none">{unreadCount} Issues</Badge>
              </div>
            </div>
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    'flex flex-col items-start gap-1 p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-all',
                    !notification.read && 'bg-indigo-500/5'
                  )}
                >
                  <div className="flex w-full items-center justify-between mb-1">
                    <span className="text-sm font-bold">{notification.title}</span>
                    <Badge
                      variant={
                        notification.type === 'error'
                          ? 'destructive'
                          : notification.type === 'warning'
                            ? 'default'
                            : 'secondary'
                      }
                      className="text-[9px] font-black uppercase"
                    >
                      {notification.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{notification.message}</p>
                  <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">{notification.time}</span>
                </DropdownMenuItem>
              ))}
            </div>
            <div className="p-3 text-center border-t border-white/5">
              <Button variant="ghost" className="w-full text-[10px] font-black text-indigo-500 uppercase tracking-widest h-8">
                View Full Intelligence Feed
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-3 p-1 pr-4 rounded-2xl hover:bg-white/50 transition-all border border-transparent hover:border-white/20">
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full blur-sm opacity-20" />
                <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-black shadow-inner">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              </div>
              <div className="hidden text-right md:block">
                <p className="text-xs font-black uppercase tracking-tight leading-none mb-1">{user?.name || 'Administrator'}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{user?.department || 'Quality Control'}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass-card border-none mt-2">
            <DropdownMenuLabel className="text-xs font-black uppercase tracking-widest p-4">Operation Center</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem className="p-3 gap-3 cursor-pointer">
              <User className="h-4 w-4 text-indigo-500" />
              <span className="text-xs font-bold">Profile Overview</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="p-3 gap-3 cursor-pointer">
              <Settings className="h-4 w-4 text-indigo-500" />
              <span className="text-xs font-bold">System Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              className="p-3 gap-3 text-rose-500 focus:text-rose-500 cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span className="text-xs font-black uppercase tracking-widest">Terminate Session</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
