import { useState } from 'react';
import {
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  HelpCircle,
  Menu,
  X,
} from 'lucide-react';
import { GlobalSearch } from './components/layout/GlobalSearch';
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
    <header className="fixed top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-900 left-72 right-0">
      <div className="flex items-center gap-4">
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

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Alerts & Notifications</span>
              <Badge variant="secondary">{unreadCount} Pending</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  'flex flex-col items-start gap-1 p-3',
                  !notification.read && 'bg-slate-50 dark:bg-slate-800'
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-medium">{notification.title}</span>
                  <Badge
                    variant={
                      notification.type === 'error'
                        ? 'destructive'
                        : notification.type === 'warning'
                          ? 'default'
                          : 'secondary'
                    }
                    className="text-xs"
                  >
                    {notification.type.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500">{notification.message}</p>
                <span className="text-xs text-slate-400">{notification.time}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-blue-600">
              View All Notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Help */}
        <Button variant="ghost" size="icon">
          <HelpCircle className="h-5 w-5" />
        </Button>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden text-right md:block">
                {/* ✅ تحديث: عرض اسم المستخدم الفعلي */}
                <p className="text-sm font-medium">{user?.name || 'Administrator'}</p>
                <p className="text-xs text-slate-500">{user?.department || 'QA Manager'}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>User Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="h-4 w-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* ✅ الإصلاح: إضافة onClick handler لتسجيل الخروج */}
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
