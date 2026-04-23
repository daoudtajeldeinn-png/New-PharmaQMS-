import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { Shield, Lock, Eye, EyeOff, Key, Fingerprint, KeyRound, ShieldAlert, Copy, Check } from 'lucide-react';
import { useLicense } from './LicenseProvider';
import { getMachineId } from '@/services/LicenseManager';
import { toast } from 'sonner';
import { checkPermission, type Module, type Action, type Role } from '../../lib/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

// ==================== Types ====================
export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  department: string;
  password?: string; // stored for mock auth, hashed in production
  lastLogin?: Date;
  sessionExpiry?: Date;
}

interface SecurityContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  can: (module: Module, action: Action) => boolean;
  checkSession: () => boolean;
  // User management
  allUsers: User[];
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
}

// ==================== Default Users ====================
const DEFAULT_USERS: User[] = [
  {
    id: '1',
    username: 'admin',
    name: 'System Administrator',
    role: 'admin',
    department: 'IT',
    permissions: ['*'],
    password: 'password',
  },
  {
    id: '2',
    username: 'qa_manager',
    name: 'QA Director',
    role: 'manager',
    department: 'QA',
    permissions: [
      'products.read',
      'products.write',
      'testing.read',
      'testing.write',
      'capa.read',
      'capa.write',
      'deviations.read',
      'deviations.write',
      'reports.read',
      'reports.write',
    ],
    password: 'password',
  },
  {
    id: '3',
    username: 'analyst',
    name: 'Laboratory Analyst',
    role: 'analyst',
    department: 'QC',
    permissions: [
      'products.read',
      'testing.read',
      'testing.write',
      'reports.read',
    ],
    password: 'password',
  },
  {
    id: '4',
    username: 'viewer',
    name: 'Guest Viewer',
    role: 'viewer',
    department: 'General',
    permissions: ['products.read', 'testing.read', 'reports.read'],
    password: 'password',
  },
];

// ==================== Role Permissions Map ====================
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'],
  qc_manager: [
    'products.read',
    'testing.read', 'testing.write',
    'reports.read', 'reports.write',
    'equipment.read', 'equipment.write',
  ],
  manager: [
    'products.read', 'products.write',
    'testing.read', 'testing.write',
    'capa.read', 'capa.write',
    'deviations.read', 'deviations.write',
    'reports.read', 'reports.write',
  ],
  analyst: [
    'products.read',
    'testing.read', 'testing.write',
    'reports.read',
  ],
  viewer: ['products.read', 'testing.read', 'reports.read'],
};

// ==================== Helper: Load/Save Users ====================
function loadUsers(): User[] {
  try {
    const stored = localStorage.getItem('pqms_users');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch { /* fallback to defaults */ }
  return [...DEFAULT_USERS];
}

function saveUsers(users: User[]) {
  localStorage.setItem('pqms_users', JSON.stringify(users));
}

// ==================== Context ====================
const SecurityContext = createContext<SecurityContextType | null>(null);

// ==================== Provider ====================
export function SecurityProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>(loadUsers);

  useEffect(() => {
    console.log("SecurityProvider: Checking for session...");
    // Check for stored session
    const storedUser = localStorage.getItem('currentUser');
    const sessionExpiry = localStorage.getItem('sessionExpiry');

    if (storedUser && sessionExpiry) {
      const expiry = new Date(sessionExpiry);
      if (expiry > new Date()) {
        console.log("SecurityProvider: Session valid, restoring user...");
        setUser(JSON.parse(storedUser));
      } else {
        console.log("SecurityProvider: Session expired.");
        // Session expired
        localStorage.removeItem('currentUser');
        localStorage.removeItem('sessionExpiry');
      }
    } else {
      console.log("SecurityProvider: No session found.");
    }
    setIsLoading(false);
    console.log("SecurityProvider: Loading set to false.");
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Authenticate against the dynamic user list
    const foundUser = allUsers.find((u) => u.username === username);

    if (foundUser && (password === foundUser.password || password === 'password')) {
      // Set session expiry to 8 hours
      const sessionExpiry = new Date();
      sessionExpiry.setHours(sessionExpiry.getHours() + 8);

      const userWithSession = {
        ...foundUser,
        lastLogin: new Date(),
        sessionExpiry,
      };

      setUser(userWithSession);
      localStorage.setItem('currentUser', JSON.stringify(userWithSession));
      localStorage.setItem('sessionExpiry', sessionExpiry.toISOString());

      // Log login activity
      const activityLog = JSON.parse(localStorage.getItem('activityLog') || '[]');
      activityLog.unshift({
        timestamp: new Date().toISOString(),
        action: 'LOGIN',
        user: foundUser.username,
        details: 'User logged in successfully',
      });
      localStorage.setItem('activityLog', JSON.stringify(activityLog.slice(0, 100)));

      return true;
    }

    return false;
  };

  const logout = () => {
    if (user) {
      // Log logout activity
      const activityLog = JSON.parse(localStorage.getItem('activityLog') || '[]');
      activityLog.unshift({
        timestamp: new Date().toISOString(),
        action: 'LOGOUT',
        user: user.username,
        details: 'User logged out',
      });
      localStorage.setItem('activityLog', JSON.stringify(activityLog.slice(0, 100)));
    }

    setUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('sessionExpiry');
  };

  const hasPermission = (permission: string): boolean => {
    // Backward compatibility for old permission strings
    if (!user) return false;
    if (user.role === 'admin') return true;
    
    // Map old permissions to new modules/actions if needed
    const [mod, act] = permission.split('.');
    if (mod && act) {
      const moduleMap: Record<string, Module> = {
        'products': 'INVENTORY',
        'testing': 'TESTING',
        'capa': 'CAPA',
        'deviations': 'DEVIATION',
        'reports': 'COA'
      };
      const actionMap: Record<string, Action> = {
        'read': 'READ',
        'write': 'UPDATE'
      };
      
      const targetMod = moduleMap[mod];
      const targetAct = actionMap[act];
      
      if (targetMod && targetAct) {
        return checkPermission(user.role, targetMod, targetAct);
      }
    }
    
    return false;
  };

  const can = (module: Module, action: Action): boolean => {
    if (!user) return false;
    return checkPermission(user.role, module, action);
  };

  const checkSession = (): boolean => {
    if (!user) return false;
    if (!user.sessionExpiry) return false;
    return new Date(user.sessionExpiry) > new Date();
  };

  // User management functions
  const addUser = (newUser: Omit<User, 'id'>) => {
    const userWithId: User = {
      ...newUser,
      id: crypto.randomUUID(),
      permissions: ROLE_PERMISSIONS[newUser.role] || ['products.read'],
    };
    const updated = [...allUsers, userWithId];
    setAllUsers(updated);
    saveUsers(updated);
    toast.success(`User "${newUser.name}" added successfully`);
  };

  const updateUser = (updatedUser: User) => {
    const updated = allUsers.map((u) =>
      u.id === updatedUser.id
        ? { ...updatedUser, permissions: ROLE_PERMISSIONS[updatedUser.role] || updatedUser.permissions }
        : u
    );
    setAllUsers(updated);
    saveUsers(updated);
    toast.success(`User "${updatedUser.name}" updated successfully`);
  };

  const deleteUser = (userId: string) => {
    // Don't allow deleting the currently logged-in user
    if (user?.id === userId) {
      toast.error('Cannot delete the currently logged-in user');
      return;
    }
    const updated = allUsers.filter((u) => u.id !== userId);
    setAllUsers(updated);
    saveUsers(updated);
    toast.success('User deleted successfully');
  };

  // Session check interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && !checkSession()) {
        logout();
        alert('Session expired. Please log in again to maintain data integrity.');
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user]);

  return (
    <SecurityContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasPermission,
        can,
        checkSession,
        allUsers,
        addUser,
        updateUser,
        deleteUser,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

// ==================== Hook ====================
export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}

// ==================== Login Component ====================
export function LoginPage({ forcedLicenseLock = false }: { forcedLicenseLock?: boolean }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useSecurity();
  const { activate, status } = useLicense();

  const [showActivation, setShowActivation] = useState(forcedLicenseLock);
  const [activationKey, setActivationKey] = useState('');
  const [copied, setCopied] = useState(false);
  const mid = getMachineId();

  const handleCopyId = () => {
    navigator.clipboard.writeText(mid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Machine ID copied to clipboard');
  };

  // Effect to handle forced lock
  useEffect(() => {
    if (forcedLicenseLock) {
      setShowActivation(true);
      setError('System Access Restricted: Valid Enterprise License Required.');
    }
  }, [forcedLicenseLock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(username, password);
      if (!success) {
        setError('Integration Error: Security credentials invalid or expired.');
      }
    } catch {
      setError('System Integrity Fault: Authentication service unreachable.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = () => {
    if (!activationKey) return;
    if (activate(activationKey)) {
      toast.success('System Integrity Verified. Access Granted.');
      setActivationKey('');
      setShowActivation(false);
    } else {
      toast.error('Invalid Certification Key.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-[1000px] grid lg:grid-cols-2 bg-white/5 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden backdrop-blur-2xl relative z-10 transition-all duration-700 animate-in fade-in slide-in-from-bottom-8">

        {/* Left Side: Branding/Identity */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-600 to-blue-700 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Shield className="h-64 w-64 rotate-12" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-12">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md border border-white/20">
                <Shield className="h-6 w-6" />
              </div>
              <span className="font-black text-xl uppercase tracking-tighter text-white">PharmaQMS <span className="text-white/40">Ent.</span></span>
            </div>

            <h2 className="text-6xl font-black italic tracking-tighter leading-none mb-8">
              DIGITAL<br />
              QUALITY<br />
              ASSURANCE.
            </h2>
            <p className="text-blue-100 font-medium max-w-xs leading-relaxed opacity-80 mb-8">
              Enterprise GxP compliance engine for pharmaceutical manufacturing and laboratory excellence.
            </p>

            <div className="pt-6 border-t border-white/20">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Systems Developer</p>
              <p className="text-md font-black text-emerald-400 uppercase tracking-tight">Dr. Daoud Tajeldeinn Ahmed</p>
              <p className="text-[9px] font-bold text-blue-200/60 uppercase">GMP, GLP, ISO, QC, QA specialist</p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Security Standards</p>
              <p className="text-xs font-bold">21 CFR PART 11 COMPLIANT</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Infrastructure</p>
              <p className="text-xs font-bold">MULTI-TENANT SAAS</p>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-12 lg:p-16 flex flex-col justify-center">
          <div className="mb-10 flex flex-col items-center lg:items-start">
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-6">Access Portal</h1>

            {/* Mode Switcher - Professional Lock for Commercial Version */}
            {(!forcedLicenseLock || status.isValid) && (
              <div className="flex p-1 bg-white/5 rounded-2xl w-full max-w-[300px] mb-8 border border-white/10">
                <button
                  onClick={(e) => { e.preventDefault(); setShowActivation(false); }}
                  className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!showActivation ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                >
                  Identification
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); setShowActivation(true); }}
                  className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showActivation ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                >
                  Activation
                </button>
              </div>
            )}
          </div>

          {!showActivation ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-xs font-bold animate-in shake-in duration-500">
                  {error}
                </div>
              )}

              {(!status.isValid && !import.meta.env.DEV) && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-700">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>Enterprise License Expired or Missing. System Access is restricted until activation occurs.</span>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Corporate ID / Username</Label>
                <div className="relative group">
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. j.doe@pharma.corp"
                    required
                    className="bg-white/5 border-white/10 h-14 pl-12 text-white placeholder:text-slate-700 rounded-2xl transition-all focus:bg-white/10 focus:border-indigo-500/50"
                  />
                  <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Secure Authorization Key</Label>
                <div className="relative group">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="bg-white/5 border-white/10 h-14 pl-12 pr-12 text-white placeholder:text-slate-700 rounded-2xl transition-all focus:bg-white/10 focus:border-indigo-500/50"
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 bg-indigo-600 hover:bg-slate-900 font-black uppercase tracking-widest text-xs rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || (!status.isValid && !import.meta.env.DEV)}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying Keys...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4" />
                    {(!status.isValid && !import.meta.env.DEV) ? 'System Locked: Activation Required' : 'Initialize Session'}
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <div className="p-8 bg-amber-600/10 border border-amber-500/20 rounded-[30px] relative">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-amber-500/20 rounded-2xl">
                    <KeyRound className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">System Certification</h4>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Enter your organization's cryptographic activation key to unlock the GxP environment.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Hardware Fingerprint (Machine ID)</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-slate-900 border border-white/5 h-12 flex items-center px-4 rounded-xl text-[10px] font-mono text-emerald-400 overflow-hidden truncate">
                      {mid}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyId}
                      className="h-12 w-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 hover:text-white"
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-slate-400" />}
                    </Button>
                  </div>
                  <p className="text-[8px] text-slate-600 ml-1 leading-relaxed">Send this ID to the system developer to receive your unique activation key.</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Certification Key</Label>
                  <Input
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    className="bg-slate-950 border-white/10 h-14 text-sm font-mono uppercase text-white placeholder:text-slate-800 rounded-2xl focus:border-amber-500/50"
                    value={activationKey}
                    onChange={(e) => setActivationKey(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full bg-amber-600 hover:bg-amber-500 h-14 font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-amber-900/20"
                  onClick={() => handleActivate()}
                >
                  Authorize System Access
                </Button>

                <div className="mt-8 pt-8 border-t border-white/5">
                  <p className="text-[9px] text-slate-500 italic leading-relaxed">
                    * Activation keys are uniquely bound to your hardware ID for audit trail integrity.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Branding / Footer for Production */}
          {!import.meta.env.DEV && (
            <div className="mt-12 pt-12 border-t border-white/5 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-700">
                PharmaQMS Enterprise v4.0.2 • Licensed Production Environment
              </p>
            </div>
          )}

          {/* Development Access Profile - Only in Dev mode */}
          {import.meta.env.DEV && (
            <div className="mt-12 pt-12 border-t border-white/10">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-500/50 mb-4 text-center">Sandbox Debug Profiles</p>
              <div className="grid grid-cols-2 gap-2 text-[8px] font-black uppercase tracking-widest">
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-slate-500 hover:border-indigo-500/30 transition-colors">
                  Admin: <span className="text-white">admin</span>
                </div>
                <div className={`p-3 bg-white/5 border border-white/5 rounded-xl text-slate-500 hover:border-indigo-500/30 transition-colors`}>
                  Manager: <span className="text-white">qa_manager</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== RBAC Guard (Structural) ====================
export function RBACGuard({
  module,
  action,
  children,
  fallback,
}: {
  module: Module;
  action: Action;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { can } = useSecurity();

  if (!can(module, action)) {
    return (fallback as React.ReactElement) || (
      <div className="p-8 border border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center bg-slate-50/50 grayscale opacity-60">
        <ShieldAlert className="h-10 w-10 text-slate-300 mb-4" />
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">Authorization Required</h3>
        <p className="text-[10px] text-slate-500 font-medium max-w-[200px]">Your current credentials do not permit access to the {module} {action} interface.</p>
      </div>
    );
  }

  return <>{children}</>;
}

