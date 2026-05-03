import { useState } from 'react';
// Settings Page
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Bell,
  Shield,
  Database,
  Globe,
  Palette,
  User,
  Save,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  KeyRound,
  UserPlus,
  Pencil,
  Users,
  CheckCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLicense } from '@/components/security/LicenseProvider';
import { useSecurity, type User as UserType } from '@/components/security/SecurityProvider';
import { backupSystemData, prepareGoogleDriveBackup, importSystemData, restoreSessionData } from '@/services/BackupService';
import { triggerManualSync } from '@/services/CloudSyncService';
import { db } from '@/db/db';
import { toast } from 'sonner';

// ==================== Helper: Load/Save Company Settings ====================
interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
}

function loadCompanySettings(): CompanySettings {
  try {
    const stored = localStorage.getItem('pqms_company_settings');
    if (stored) return JSON.parse(stored);
  } catch { /* fallback */ }
  return {
    name: 'National Pharmaceutical Company',
    address: 'Khartoum, Sudan',
    phone: '+249 123 456 789',
    email: 'info@pharma.com',
  };
}

function saveCompanySettings(settings: CompanySettings) {
  localStorage.setItem('pqms_company_settings', JSON.stringify(settings));
}

// ==================== Role Display Helpers ====================
const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  qc_manager: 'QC Manager',
  manager: 'QA Manager',
  analyst: 'QC Analyst',
  viewer: 'Viewer',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-rose-500',
  qc_manager: 'bg-indigo-600',
  manager: 'bg-blue-500',
  analyst: 'bg-emerald-500',
  viewer: 'bg-slate-400',
};

export function SettingsPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    oos: true,
    deviation: true,
    capa: true,
    calibration: true,
    expiry: true,
  });

  const [appearance, setAppearance] = useState({
    theme: 'light',
    language: 'en',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
  });

  // Company settings from localStorage
  const [company, setCompany] = useState<CompanySettings>(loadCompanySettings);
  const [initialCompany, setInitialCompany] = useState<CompanySettings>(loadCompanySettings);
  const isDirty = JSON.stringify(company) !== JSON.stringify(initialCompany);

  const license = useLicense();
  const { allUsers, addUser, updateUser, deleteUser } = useSecurity();
  const [newLicenseKey, setNewLicenseKey] = useState('');

  // User management state
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [deleteTargetUser, setDeleteTargetUser] = useState<UserType | null>(null);
  const [userForm, setUserForm] = useState({
    username: '',
    name: '',
    password: '',
    role: 'analyst' as 'admin' | 'qc_manager' | 'manager' | 'analyst' | 'viewer',
    department: 'QC',
  });

  const handleSaveCompanySettings = () => {
    saveCompanySettings(company);
    setInitialCompany({ ...company });
    toast.success('Company settings saved successfully!');
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const backupData = restoreSessionData(content);
        
        if (backupData) {
          await importSystemData(backupData);
          toast.success('System database restored successfully! The page will now reload.');
          setTimeout(() => window.location.reload(), 2000);
        } else {
          toast.error('Invalid backup file format');
        }
      } catch (error) {
        console.error('Import error:', error);
        toast.error('Failed to restore database');
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  const handleWipeDatabase = async () => {
    if (!confirm('CRITICAL: This will permanently delete ALL system records. Are you absolutely sure?')) {
      return;
    }

    try {
      const tables = db.tables;
      await db.transaction('rw', tables, async () => {
        for (const table of tables) {
          await table.clear();
        }
      });
      toast.success('Database wiped successfully. Reloading...');
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error('Wipe error:', error);
      toast.error('Failed to wipe database');
    }
  };

  const handleCheckUpdate = async () => {
    // Robust check for Electron environment
    const isElectron = (window as any).ipcRenderer || 
                       ((window as any).process && (window as any).process.type) ||
                       (navigator.userAgent.toLowerCase().indexOf(' electron/') > -1);

    if (!isElectron) {
      toast.info('Update check is only available in the Desktop application.');
      return;
    }

    const ipc = (window as any).ipcRenderer;
    if (!ipc) {
        toast.error('Electron IPC bridge is not active. Please restart the app.');
        return;
    }

    toast.loading('Checking for system updates...', { id: 'update-check' });
    try {
      const result = await ipc.invoke('check-for-updates');
      if (result.success) {
        if (result.info) {
          toast.success(`Update found: v${result.info.version}. Downloading in background...`, { id: 'update-check' });
        } else {
          toast.success('You are running the latest version of PharmaQMS.', { id: 'update-check' });
        }
      } else {
        toast.error(`Update check failed: ${result.error}`, { id: 'update-check' });
      }
    } catch (error) {
      toast.error('Could not connect to update server.', { id: 'update-check' });
    }
  };

  const openAddUserDialog = () => {
    setEditingUser(null);
    setUserForm({ username: '', name: '', password: '', role: 'analyst', department: 'QC' });
    setIsUserDialogOpen(true);
  };

  const openEditUserDialog = (user: UserType) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      name: user.name,
      password: '',
      role: user.role,
      department: user.department,
    });
    setIsUserDialogOpen(true);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.username || !userForm.name) {
      toast.error('Username and Name are required');
      return;
    }

    if (editingUser) {
      updateUser({
        ...editingUser,
        username: userForm.username,
        name: userForm.name,
        role: userForm.role,
        department: userForm.department,
        ...(userForm.password ? { password: userForm.password } : {}),
      });
    } else {
      if (!userForm.password) {
        toast.error('Password is required for new users');
        return;
      }
      // Check for duplicate username
      if (allUsers.some((u) => u.username === userForm.username)) {
        toast.error('Username already exists');
        return;
      }
      addUser({
        username: userForm.username,
        name: userForm.name,
        role: userForm.role,
        department: userForm.department,
        permissions: [],
        password: userForm.password,
      });
    }
    setIsUserDialogOpen(false);
  };

  const handleDeleteUser = () => {
    if (deleteTargetUser) {
      deleteUser(deleteTargetUser.id);
      setIsDeleteDialogOpen(false);
      setDeleteTargetUser(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Configuration</h1>
          <p className="text-slate-500">Customize application behavior and institutional data</p>
        </div>
        <Button
          className={`${isDirty ? 'bg-green-600 hover:bg-green-700 animate-pulse' : 'bg-green-600 hover:bg-green-700 opacity-60'}`}
          onClick={handleSaveCompanySettings}
          disabled={!isDirty}
        >
          <Save className="mr-2 h-4 w-4" />
          {isDirty ? 'Save Changes' : 'No Changes'}
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-5 bg-slate-100 p-1">
          <TabsTrigger value="general">Institutional</TabsTrigger>
          <TabsTrigger value="notifications">Communications</TabsTrigger>
          <TabsTrigger value="appearance">Interface</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="data">Data Ops</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Company Profile
              </CardTitle>
              <CardDescription>
                Changes will be saved when you click "Save Changes" above
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Legal Registered Name</Label>
                  <Input
                    value={company.name}
                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    value={company.email}
                    onChange={(e) => setCompany({ ...company, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Operations Address</Label>
                <Input
                  value={company.address}
                  onChange={(e) => setCompany({ ...company, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Primary Phone</Label>
                <Input
                  value={company.phone}
                  onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                />
              </div>
              {isDirty && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                  <CheckCircle className="h-4 w-4" />
                  <span>You have unsaved changes. Click <strong>"Save Changes"</strong> to apply.</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Regional & Language Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Interface Language</Label>
                  <Select
                    value={appearance.language}
                    onValueChange={(value) => setAppearance({ ...appearance, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English (Primary)</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>System Timezone</Label>
                  <Select defaultValue="Africa/Khartoum">
                    <SelectTrigger>
                      <SelectValue placeholder="Select Timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Khartoum">Khartoum (GMT+2)</SelectItem>
                      <SelectItem value="Asia/Riyadh">Riyadh (GMT+3)</SelectItem>
                      <SelectItem value="Asia/Dubai">Dubai (GMT+4)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date Display Format</Label>
                  <Select
                    value={appearance.dateFormat}
                    onValueChange={(value: string) => setAppearance({ ...appearance, dateFormat: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (UK/Sudan)</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US)</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Time Format</Label>
                  <Select
                    value={appearance.timeFormat}
                    onValueChange={(value: string) => setAppearance({ ...appearance, timeFormat: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12-hour AM/PM</SelectItem>
                      <SelectItem value="24h">24-hour Military</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" />
                Notification Directives
              </CardTitle>
              <CardDescription>
                Configure automated system alerts and broadcasting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Dispatches</Label>
                  <p className="text-sm text-slate-500">Enable SMTP broadcasting for critical alerts</p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, email: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-slate-500">In-app and browser popup notifications</p>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, push: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>OOS Results Crisis</Label>
                  <p className="text-sm text-slate-500">Alert laboratory manager when OOS is recorded</p>
                </div>
                <Switch
                  checked={notifications.oos}
                  onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, oos: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Deviations Log</Label>
                  <p className="text-sm text-slate-500">Broadcast when a system deviation is raised</p>
                </div>
                <Switch
                  checked={notifications.deviation}
                  onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, deviation: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>CAPA Lifecycle</Label>
                  <p className="text-sm text-slate-500">Alert responsible users on CAPA assignments</p>
                </div>
                <Switch
                  checked={notifications.capa}
                  onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, capa: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Calibration Reminders</Label>
                  <p className="text-sm text-slate-500">Alert maintenance 30 days before calibration due</p>
                </div>
                <Switch
                  checked={notifications.calibration}
                  onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, calibration: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Inventory Expiration</Label>
                  <p className="text-sm text-slate-500">Notify inventory control of near-expiry goods</p>
                </div>
                <Switch
                  checked={notifications.expiry}
                  onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, expiry: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Color Palette / Theme</Label>
                <Select
                  value={appearance.theme}
                  onValueChange={(value: string) => setAppearance({ ...appearance, theme: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select UI Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Solarized Light</SelectItem>
                    <SelectItem value="dark">Deep Space Dark</SelectItem>
                    <SelectItem value="system">Inherit from OS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          {/* User Management Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-600" />
                    User Management
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Add, edit, and manage system users and their access levels
                  </CardDescription>
                </div>
                <Button onClick={openAddUserDialog} className="bg-indigo-600 hover:bg-indigo-700">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Username</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Full Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Role</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Department</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((u) => (
                      <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-slate-900">{u.username}</td>
                        <td className="px-4 py-3 text-slate-700">{u.name}</td>
                        <td className="px-4 py-3">
                          <Badge className={`${ROLE_COLORS[u.role] || 'bg-slate-400'} text-white text-[10px] font-bold`}>
                            {ROLE_LABELS[u.role] || u.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{u.department}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-blue-600"
                              onClick={() => openEditUserDialog(u)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-rose-600"
                              onClick={() => {
                                setDeleteTargetUser(u);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-400 mt-3">
                Total Users: {allUsers.length} • Roles: Admin, QA Manager, QC Analyst, Viewer
              </p>
            </CardContent>
          </Card>

          {/* License & Security Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Access & Security Protocols
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Label className="flex items-center gap-2 text-indigo-600">
                  <KeyRound className="h-4 w-4" />
                  System Activation & License
                </Label>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">License Integrity Status:</span>
                    <Badge className={license.status.isValid ? "bg-emerald-500" : "bg-rose-500"}>
                      {license.status.isValid ? 'VALID' : 'INVALID'}
                    </Badge>
                  </div>
                  {license.status.expiryDate && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">Renewal Date:</span>
                      <span className="font-mono font-bold text-slate-700">{license.status.expiryDate.toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="pt-2">
                    <Label className="text-[10px] uppercase font-bold text-slate-400 mb-2 block tracking-widest">Update Certification Key</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="ENTER NEW LICENSE KEY..."
                        className="bg-white font-mono uppercase text-xs"
                        value={newLicenseKey}
                        onChange={(e) => setNewLicenseKey(e.target.value)}
                      />
                      <Button
                        size="sm"
                        className="bg-indigo-600"
                        onClick={() => {
                          if (license.activate(newLicenseKey)) {
                            setNewLicenseKey('');
                            toast.success('System Activation Successful');
                          } else {
                            toast.error('Invalid Activation Key');
                          }
                        }}
                      >
                        Activate
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Administrative Password Update</Label>
                <Input type="password" placeholder="Current Authentication Pin" />
                <Input type="password" placeholder="New Secure Password" />
                <Input type="password" placeholder="Verify New Password" />
                <Button className="mt-2 bg-blue-600">Update Credentials</Button>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Two-Factor Authentication (2FA)</Label>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">Enhanced security via mobile OTP</p>
                  <Switch />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Cyber-Audit Session Logs</Label>
                <Button variant="outline">Inspect Access History</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                Data Integrity & Operations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>System Backup (Local/Cloud)</Label>
                <p className="text-sm text-slate-500">Export encapsulated laboratory and QMS data</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="border-blue-200 text-blue-700" onClick={() => backupSystemData()}>
                    <Download className="mr-2 h-4 w-4" />
                    Generate Archive
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={async () => {
                    try {
                      const msg = await prepareGoogleDriveBackup();
                      toast.success(msg);
                    } catch (e) {
                      toast.error('Cloud backup failed');
                    }
                  }}>
                    <Globe className="mr-2 h-4 w-4" />
                    Backup to Google Drive
                  </Button>
                  <Button className="bg-indigo-700 hover:bg-indigo-800" onClick={() => triggerManualSync()}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync with Enterprise Cloud
                  </Button>
                  <Button variant="secondary" className="bg-slate-200 hover:bg-slate-300 text-slate-700" onClick={handleCheckUpdate}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Check for Updates
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Import Protocol</Label>
                <p className="text-sm text-slate-500">Restore or update database from external file</p>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    id="backup-upload"
                    className="hidden"
                    accept=".json"
                    onChange={handleImportData}
                  />
                  <Button 
                    variant="outline" 
                    className="border-emerald-200 text-emerald-700"
                    onClick={() => document.getElementById('backup-upload')?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Data File
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-red-700 font-black">CRITICAL: DANGER ZONE</Label>
                <p className="text-sm text-slate-500 font-medium">Irreversible wipe of all system records and logs</p>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleWipeDatabase}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Wipe Entire Database
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Developer Credit */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Developed & Maintained by:</p>
              <p className="text-lg font-black text-blue-900 tracking-tight">Dr. Daoud Tajeldeinn Ahmed</p>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Pharmaceutical Quality Management System</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600 font-bold">Release Build</p>
              <p className="text-lg font-black text-blue-900">v4.2.3-stable</p>
              <p className="text-xs text-slate-500">© 2024-2026 All Rights Reserved</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ==================== Add/Edit User Dialog ==================== */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUserSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Username *</Label>
              <Input
                value={userForm.username}
                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                placeholder="e.g. john.doe"
                required
                disabled={!!editingUser} // Can't change username when editing
              />
            </div>
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                placeholder="e.g. John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}</Label>
              <Input
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                placeholder="Enter password"
                required={!editingUser}
              />
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select
                value={userForm.role}
                onValueChange={(value: any) => setUserForm({ ...userForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator (IT/All)</SelectItem>
                  <SelectItem value="qc_manager">Quality Control Manager (QC)</SelectItem>
                  <SelectItem value="manager">Quality Assurance Manager (QA)</SelectItem>
                  <SelectItem value="analyst">QC Analyst (Laboratory)</SelectItem>
                  <SelectItem value="viewer">Guest Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department *</Label>
              <Select
                value={userForm.department}
                onValueChange={(value: string) => setUserForm({ ...userForm, department: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QC">Quality Control (QC)</SelectItem>
                  <SelectItem value="QA">Quality Assurance (QA)</SelectItem>
                  <SelectItem value="Production">Production</SelectItem>
                  <SelectItem value="R&D">R&D</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                {editingUser ? 'Save Changes' : 'Add User'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================== Delete User Confirmation ==================== */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Confirm User Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete user <strong>"{deleteTargetUser?.name}"</strong> ({deleteTargetUser?.username})?
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
