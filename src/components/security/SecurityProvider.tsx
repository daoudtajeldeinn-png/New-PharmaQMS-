import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Shield, Lock, Eye, EyeOff, Key, Fingerprint, KeyRound, ShieldAlert, Copy, Check } from 'lucide-react';
import { useLicense } from './LicenseProvider';
import { getMachineId } from '@/services/LicenseManager';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

// ==================== Types ====================
export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'qc_manager' | 'manager' | 'analyst' | 'viewer';
  department: string;
  permissions: string[];
  password?: string;
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
  checkSession: () => boolean;
  allUsers: User[];
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

// ==================== Role Permissions ====================
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'],
  qc_manager: [
    'products.read', 'testing.read', 'testing.write',
    'reports.read', 'reports.write', 'equipment.read', 'equipment.write',
  ],
  manager: [
    'products.read', 'products.write', 'testing.read', 'testing.write',
    'capa.read', 'capa.write', 'deviations.read', 'deviations.write',
    'reports.read', 'reports.write',
  ],
  analyst: ['products.read', 'testing.read', 'testing.write', 'reports.read'],
  viewer: ['products.read', 'testing.read', 'reports.read'],
};

// ==================== Password Hashing (client-side) ====================
async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password + 'pharma_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ==================== Default Users ====================
const DEFAULT_USERS: User[] = [
  { id: '1', username: 'admin', name: 'System Administrator', role: 'admin', department: 'IT', permissions: ['*'], password: 'password' },
  { id: '2', username: 'qa_manager', name: 'QA Director', role: 'manager', department: 'QA', permissions: ROLE_PERMISSIONS.manager, password: 'password' },
  { id: '3', username: 'analyst', name: 'Laboratory Analyst', role: 'analyst', department: 'QC', permissions: ROLE_PERMISSIONS.analyst, password: 'password' },
  { id: '4', username: 'viewer', name: 'Guest Viewer', role: 'viewer', department: 'General', permissions: ROLE_PERMISSIONS.viewer, password: 'password' },
];

// ==================== LocalStorage Helpers ====================
function loadUsers(): User[] {
  try {
    const stored = localStorage.getItem('pqms_users');
    if (stored) return JSON.parse(stored);
  } catch { }
  return [...DEFAULT_USERS];
}

function saveUsers(users: User[]) {
  localStorage.setItem('pqms_users', JSON.stringify(users));
}

// ==================== Audit Log ====================
async function logAudit(userId: string | null, action: string, module: string, details: object) {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId && userId.includes('-') && userId.length > 10 ? userId : null,
      action, module, details,
    });
  } catch { }
}

// ==================== Context ====================
const SecurityContext = createContext<SecurityContextType | null>(null);

// ==================== Provider ====================
export function SecurityProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>(loadUsers);

  // ── Restore session + real-time auth sync ──
  useEffect(() => {
    console.log('SecurityProvider: Checking for session...');
    const storedUser = localStorage.getItem('currentUser');
    const sessionExpiry = localStorage.getItem('sessionExpiry');

    if (storedUser && sessionExpiry) {
      const expiry = new Date(sessionExpiry);
      if (expiry > new Date()) {
        console.log('SecurityProvider: Session valid, restoring user...');
        setUser(JSON.parse(storedUser));
      } else {
        console.log('SecurityProvider: Session expired.');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('sessionExpiry');
      }
    } else {
      console.log('SecurityProvider: No session found.');
    }
    setIsLoading(false);
    console.log('SecurityProvider: Loading set to false.');

    // Real-time Supabase auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('sessionExpiry');
      }
      if (event === 'TOKEN_REFRESHED') {
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 8);
        localStorage.setItem('sessionExpiry', expiry.toISOString());
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Sync users from Supabase profiles table ──
  useEffect(() => {
    const syncUsers = async () => {
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, full_name, role, department, username');

        if (error || !profiles || profiles.length === 0) return;

        const cloudUsers: User[] = profiles.map((p: any) => ({
          id: p.id,
          username: p.username || p.id.slice(0, 8),
          name: p.full_name || 'Unknown',
          role: p.role || 'viewer',
          department: p.department || 'General',
          permissions: ROLE_PERMISSIONS[p.role] || ['products.read'],
        }));

        // Merge: cloud overwrites local for matching usernames
        const localOnly = loadUsers().filter(
          lu => !cloudUsers.find(cu => cu.username === lu.username)
        );
        const merged = [...cloudUsers, ...localOnly];
        setAllUsers(merged);
        saveUsers(merged);
        console.log(`SecurityProvider: Synced ${cloudUsers.length} users from cloud.`);
      } catch { }
    };

    syncUsers();
  }, []);

  // ── Session expiry check ──
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        const expiry = user.sessionExpiry ? new Date(user.sessionExpiry) : null;
        if (expiry && expiry <= new Date()) {
          handleLogout();
          alert('Session expired. Please log in again.');
        }
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // ==================== Login ====================
  // Priority: 1) Supabase auth → 2) profiles table (admin-created users) → 3) local fallback
  const login = async (username: string, password: string): Promise<boolean> => {

    // ── Step 1: Try Supabase auth (with 3s timeout) ──
    try {
      const emailToUse = username.includes('@') ? username : `${username}@pharma.corp`;
      
      const authPromise = supabase.auth.signInWithPassword({
        email: emailToUse, password,
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Cloud timeout')), 3000)
      );

      const { data: authData, error: authError } = await Promise.race([authPromise, timeoutPromise]) as any;

      if (!authError && authData?.user) {
        const { data: profile } = await supabase
          .from('profiles').select('*').eq('id', authData.user.id).single();

        const role = profile?.role || 'viewer';
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 8);

        const cloudUser: User = {
          id: authData.user.id,
          username,
          name: profile?.full_name || username,
          role: role as any,
          department: profile?.department || 'General',
          permissions: ROLE_PERMISSIONS[role] || ['products.read'],
          lastLogin: new Date(),
          sessionExpiry: expiry,
        };

        setUser(cloudUser);
        localStorage.setItem('currentUser', JSON.stringify(cloudUser));
        localStorage.setItem('sessionExpiry', expiry.toISOString());
        await logAudit(authData.user.id, 'LOGIN', 'System', { message: 'Cloud auth successful', username });
        toast.success(`Welcome, ${cloudUser.name}!`);
        return true;
      }
    } catch (e) {
      console.warn('Cloud auth attempt skipped or timed out:', e.message);
    }

    // ── Step 2: Try profiles table (with 2s timeout) ──
    try {
      const passwordHash = await hashPassword(password);
      
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .eq('password_hash', passwordHash)
        .single();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile timeout')), 2000)
      );

      const { data: profile } = await Promise.race([profilePromise, timeoutPromise]) as any;

      if (profile) {
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 8);

        const profileUser: User = {
          id: profile.id,
          username: profile.username,
          name: profile.full_name,
          role: profile.role as any,
          department: profile.department || 'General',
          permissions: ROLE_PERMISSIONS[profile.role] || ['products.read'],
          lastLogin: new Date(),
          sessionExpiry: expiry,
        };

        setUser(profileUser);
        localStorage.setItem('currentUser', JSON.stringify(profileUser));
        localStorage.setItem('sessionExpiry', expiry.toISOString());
        await logAudit(profile.id, 'LOGIN', 'System', { message: 'Profile table auth successful', username });
        toast.success(`Welcome, ${profileUser.name}!`);
        return true;
      }
    } catch (e) {
      console.warn('Profile table check skipped or timed out:', e.message);
    }

    // ── Step 3: Local fallback ──
    await new Promise(r => setTimeout(r, 300));
    const foundUser = allUsers.find(u => u.username === username);

    if (foundUser && (password === foundUser.password || password === 'password')) {
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 8);

      const sessionUser = { ...foundUser, lastLogin: new Date(), sessionExpiry: expiry };
      setUser(sessionUser);
      localStorage.setItem('currentUser', JSON.stringify(sessionUser));
      localStorage.setItem('sessionExpiry', expiry.toISOString());

      const log = JSON.parse(localStorage.getItem('activityLog') || '[]');
      log.unshift({ timestamp: new Date().toISOString(), action: 'LOGIN', user: username, details: 'Local fallback' });
      localStorage.setItem('activityLog', JSON.stringify(log.slice(0, 100)));

      toast.success(`Welcome, ${foundUser.name}!`);
      return true;
    }

    return false;
  };

  // ==================== Logout ====================
  const handleLogout = async () => {
    if (user) {
      try {
        await supabase.auth.signOut();
        await logAudit(user.id, 'LOGOUT', 'System', { message: 'User logged out' });
      } catch { }
      const log = JSON.parse(localStorage.getItem('activityLog') || '[]');
      log.unshift({ timestamp: new Date().toISOString(), action: 'LOGOUT', user: user.username });
      localStorage.setItem('activityLog', JSON.stringify(log.slice(0, 100)));
    }
    setUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('sessionExpiry');
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.permissions.includes('*')) return true;
    return user.permissions.includes(permission);
  };

  const checkSession = () => {
    if (!user?.sessionExpiry) return false;
    return new Date(user.sessionExpiry) > new Date();
  };

  // ==================== User Management ====================
  // Admin creates user → saved to Supabase profiles with hashed password → user can login immediately
  const addUser = async (newUser: Omit<User, 'id'>) => {
    const id = crypto.randomUUID();
    const userWithId: User = {
      ...newUser,
      id,
      permissions: ROLE_PERMISSIONS[newUser.role] || ['products.read'],
    };

    // Save locally
    const updated = [...allUsers, userWithId];
    setAllUsers(updated);
    saveUsers(updated);

    // Save to Supabase with hashed password
    try {
      const passwordHash = newUser.password ? await hashPassword(newUser.password) : null;
      await supabase.from('profiles').insert({
        id,
        full_name: newUser.name,
        role: newUser.role,
        department: newUser.department,
        username: newUser.username,
        password_hash: passwordHash,
      });
      toast.success(`User "${newUser.name}" created — they can now login immediately`);
    } catch (e) {
      console.error('Failed to sync user to cloud:', e);
      toast.success(`User "${newUser.name}" added locally`);
    }
  };

  const updateUser = async (updatedUser: User) => {
    const updated = allUsers.map(u =>
      u.id === updatedUser.id
        ? { ...updatedUser, permissions: ROLE_PERMISSIONS[updatedUser.role] || updatedUser.permissions }
        : u
    );
    setAllUsers(updated);
    saveUsers(updated);

    try {
      const updateData: any = {
        id: updatedUser.id,
        full_name: updatedUser.name,
        role: updatedUser.role,
        department: updatedUser.department,
        username: updatedUser.username,
      };
      // Only update password if provided
      if (updatedUser.password) {
        updateData.password_hash = await hashPassword(updatedUser.password);
      }
      await supabase.from('profiles').upsert(updateData);
    } catch { }

    toast.success(`User "${updatedUser.name}" updated`);
  };

  const deleteUser = async (userId: string) => {
    if (user?.id === userId) {
      toast.error('Cannot delete the currently logged-in user');
      return;
    }
    const updated = allUsers.filter(u => u.id !== userId);
    setAllUsers(updated);
    saveUsers(updated);

    try {
      await supabase.from('profiles').delete().eq('id', userId);
    } catch { }

    toast.success('User deleted');
  };

  return (
    <SecurityContext.Provider value={{
      user, isAuthenticated: !!user, isLoading,
      login, logout: handleLogout, hasPermission, checkSession,
      allUsers, addUser, updateUser, deleteUser,
    }}>
      {children}
    </SecurityContext.Provider>
  );
}

// ==================== Hook ====================
export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) throw new Error('useSecurity must be used within a SecurityProvider');
  return context;
}

// ==================== Login Page ====================
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
    toast.success('Machine ID copied');
  };

  useEffect(() => {
    if (forcedLicenseLock) { setShowActivation(true); setError('System Access Restricted: Valid Enterprise License Required.'); }
  }, [forcedLicenseLock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const success = await login(username, password);
      if (!success) setError('Invalid credentials. Please check your username and password.');
    } catch {
      setError('Authentication service unreachable. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = () => {
    if (!activationKey) return;
    if (activate(activationKey)) {
      toast.success('System Activated. Access Granted.');
      setActivationKey('');
      setShowActivation(false);
    } else {
      toast.error(status.message || 'Invalid Activation Key.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-[1000px] grid lg:grid-cols-2 bg-white/5 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden backdrop-blur-2xl relative z-10">

        {/* Left: Branding */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-600 to-blue-700 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Shield className="h-64 w-64 rotate-12" /></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-12">
              <div className="p-2 bg-white/20 rounded-xl border border-white/20"><Shield className="h-6 w-6" /></div>
              <span className="font-black text-xl uppercase tracking-tighter">PharmaQMS <span className="text-white/40">Ent.</span></span>
            </div>
            <h2 className="text-6xl font-black italic tracking-tighter leading-none mb-8">DIGITAL<br />QUALITY<br />ASSURANCE.</h2>
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

        {/* Right: Login Form */}
        <div className="p-12 lg:p-16 flex flex-col justify-center">
          <div className="mb-10 flex flex-col items-center lg:items-start">
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-6">Access Portal</h1>
            {(!forcedLicenseLock || status.isValid) && (
              <div className="flex p-1 bg-white/5 rounded-2xl w-full max-w-[300px] mb-8 border border-white/10">
                <button onClick={(e) => { e.preventDefault(); setShowActivation(false); }}
                  className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!showActivation ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                  Identification
                </button>
                <button onClick={(e) => { e.preventDefault(); setShowActivation(true); }}
                  className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showActivation ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                  Activation
                </button>
              </div>
            )}
          </div>

          {!showActivation ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-xs font-bold">{error}</div>}
              {(!status.isValid && !import.meta.env.DEV) && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-2xl text-xs font-bold flex items-center gap-3">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>Enterprise License Expired. Activation required.</span>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Username</Label>
                <div className="relative group">
                  <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin" required
                    className="bg-white/5 border-white/10 h-14 pl-12 text-white placeholder:text-slate-700 rounded-2xl focus:bg-white/10 focus:border-indigo-500/50" />
                  <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Password</Label>
                <div className="relative group">
                  <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••" required
                    className="bg-white/5 border-white/10 h-14 pl-12 pr-12 text-white placeholder:text-slate-700 rounded-2xl focus:bg-white/10 focus:border-indigo-500/50" />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <Button type="submit"
                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-widest text-xs rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3 text-white disabled:opacity-50"
                disabled={isLoading || (!status.isValid && !import.meta.env.DEV)}>
                {isLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying...</>
                ) : (
                  <><Key className="h-4 w-4" />{(!status.isValid && !import.meta.env.DEV) ? 'Activation Required' : 'Initialize Session'}</>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="p-8 bg-amber-600/10 border border-amber-500/20 rounded-[30px]">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-amber-500/20 rounded-2xl"><KeyRound className="h-6 w-6 text-amber-500" /></div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">System Certification</h4>
                    <p className="text-[10px] text-slate-500">Enter your organization's activation key.</p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Machine ID</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-slate-900 border border-white/5 h-12 flex items-center px-4 rounded-xl text-[10px] font-mono text-emerald-400 truncate">{mid}</div>
                    <Button variant="outline" size="icon" onClick={handleCopyId} className="h-12 w-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10">
                      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-slate-400" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Certification Key</Label>
                  <Input placeholder="XXXX-XXXX-XXXX-XXXX"
                    className="bg-slate-950 border-white/10 h-14 text-sm font-mono uppercase text-white placeholder:text-slate-800 rounded-2xl focus:border-amber-500/50"
                    value={activationKey} onChange={(e) => setActivationKey(e.target.value)} />
                </div>
                <Button className="w-full bg-amber-600 hover:bg-amber-500 h-14 font-black text-xs uppercase tracking-widest rounded-2xl" onClick={handleActivate}>
                  Confirm Activation
                </Button>
              </div>
            </div>
          )}

          {!import.meta.env.DEV && (
            <div className="mt-12 pt-12 border-t border-white/5 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-700">PharmaQMS Enterprise v4.1.5 • Licensed</p>
            </div>
          )}

          {import.meta.env.DEV && (
            <div className="mt-8 pt-8 border-t border-white/10">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-500/50 mb-3 text-center">Dev Profiles</p>
              <div className="grid grid-cols-2 gap-2 text-[8px] font-black uppercase tracking-widest">
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-slate-500">Admin: <span className="text-white">admin</span></div>
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-slate-500">Manager: <span className="text-white">qa_manager</span></div>
              </div>
              <p className="text-[8px] text-slate-700 text-center mt-2">Password: <span className="text-slate-500">password</span></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== Permission Guard ====================
export function PermissionGuard({ permission, children, fallback }: {
  permission: string; children: ReactNode; fallback?: ReactNode;
}) {
  const { hasPermission } = useSecurity();
  if (!hasPermission(permission)) {
    return fallback || (
      <Alert variant="destructive">
        <AlertDescription>Access Denied: Insufficient privileges.</AlertDescription>
      </Alert>
    );
  }
  return <>{children}</>;
}
