import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Shield, Lock, Eye, EyeOff, Key, Fingerprint, KeyRound, ShieldAlert, Copy, Check, Smartphone } from 'lucide-react';
import { useLicense } from './LicenseProvider';
import { getMachineId, getTrialStatus } from '@/services/LicenseManager';
import { mfaService } from '@/services/MFAService';
import { MFAChallenge } from './MFAChallenge';
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
  login: (username: string, password: string, isTrial?: boolean) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  checkSession: () => boolean;
  allUsers: User[];
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  // MFA Methods
  enrollMFA: () => Promise<{ qrCode: string; secret: string } | null>;
  verifyMFAEnrollment: (code: string) => Promise<boolean>;
  completeMFAChallenge: (code: string) => Promise<boolean>;
  requiresMFAChallenge: boolean;
  mfaStatus: { enrolled: boolean; factors: string[] };
  checkMFAStatus: () => Promise<void>;
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
      'products.read', 'products.write',
      'testing.read', 'testing.write',
      'capa.read', 'capa.write',
      'deviations.read', 'deviations.write',
      'reports.read', 'reports.write',
    ],
    password: 'password',
  },
  {
    id: '3',
    username: 'analyst',
    name: 'Laboratory Analyst',
    role: 'analyst',
    department: 'QC',
    permissions: ['products.read', 'testing.read', 'testing.write', 'reports.read'],
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
  analyst: ['products.read', 'testing.read', 'testing.write', 'reports.read'],
  viewer: ['products.read', 'testing.read', 'reports.read'],
};

// ==================== Helper: Load/Save Users ====================
function loadUsers(): User[] {
  try {
    const stored = localStorage.getItem('pqms_users');
    if (stored) return JSON.parse(stored);
  } catch { /* fallback */ }
  return [...DEFAULT_USERS];
}

function saveUsers(users: User[]) {
  localStorage.setItem('pqms_users', JSON.stringify(users));
}

// ==================== Helper: Audit Log ====================
async function logAudit(userId: string | null, action: string, module: string, details: object) {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId && userId.includes('-') && userId.length > 10 ? userId : null,
      action,
      module,
      details,
    });
  } catch { /* silent fail — audit log should never block the app */ }
}

// ==================== Context ====================
const SecurityContext = createContext<SecurityContextType | null>(null);

// ==================== Provider ====================
export function SecurityProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>(loadUsers);
  
  // MFA State
  const [mfaStatus, setMfaStatus] = useState<{ enrolled: boolean; factors: string[] }>({ enrolled: false, factors: [] });
  const [mfaRequired, setMfaRequired] = useState(false);
  const [pendingMFAChallenge, setPendingMFAChallenge] = useState<{ challengeId: string; userId: string } | null>(null);

  // ── 1. Restore session on mount + listen for Supabase auth state changes ──
  useEffect(() => {
    console.log('SecurityProvider: Checking for session...');

    // Restore from localStorage first (instant, no network)
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

    // ── Real-time Supabase auth state listener ──
    // This fires whenever session changes in ANY tab or device
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Session refreshed or signed in from another tab
        console.log('SecurityProvider: Supabase session active:', event);

        // Fetch latest profile from cloud
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          const role = profile.role || 'viewer';
          const expiry = new Date();
          expiry.setHours(expiry.getHours() + 8);

          const refreshedUser: User = {
            id: session.user.id,
            username: profile.username || session.user.email?.split('@')[0] || 'user',
            name: profile.full_name || 'User',
            role: role as any,
            department: profile.department || 'General',
            permissions: ROLE_PERMISSIONS[role] || ['products.read'],
            lastLogin: new Date(),
            sessionExpiry: expiry,
          };

          setUser(refreshedUser);
          localStorage.setItem('currentUser', JSON.stringify(refreshedUser));
          localStorage.setItem('sessionExpiry', expiry.toISOString());
        }
      }

      if (event === 'SIGNED_OUT') {
        // Signed out from another tab — sync logout here too
        console.log('SecurityProvider: Supabase sign-out detected.');
        setUser(null);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('sessionExpiry');
      }

      if (event === 'TOKEN_REFRESHED') {
        // Token auto-refreshed by Supabase — extend local session
        console.log('SecurityProvider: Token refreshed automatically.');
        const sessionExpiry = new Date();
        sessionExpiry.setHours(sessionExpiry.getHours() + 8);
        localStorage.setItem('sessionExpiry', sessionExpiry.toISOString());
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── 2. Session expiry check every minute ──
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        const expiry = user.sessionExpiry ? new Date(user.sessionExpiry) : null;
        if (expiry && expiry <= new Date()) {
          handleLogout();
          alert('Session expired. Please log in again to maintain data integrity.');
        }
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // ── 3. Auto-sync users from Supabase profiles table ──
  useEffect(() => {
    const syncUsersFromCloud = async () => {
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, full_name, role, department, username');

        if (error || !profiles || profiles.length === 0) return;

        // Merge cloud profiles into local users list
        const cloudUsers: User[] = profiles.map((p: any) => ({
          id: p.id,
          username: p.username || p.full_name?.toLowerCase().replace(' ', '_') || p.id.slice(0, 8),
          name: p.full_name || 'Unknown',
          role: p.role || 'viewer',
          department: p.department || 'General',
          permissions: ROLE_PERMISSIONS[p.role] || ['products.read'],
        }));

        // Combine with local users, cloud takes priority for matching usernames
        const localOnly = loadUsers().filter(
          lu => !cloudUsers.find(cu => cu.username === lu.username)
        );
        const merged = [...cloudUsers, ...localOnly];
        setAllUsers(merged);
        saveUsers(merged);
        console.log(`SecurityProvider: Synced ${cloudUsers.length} users from cloud.`);
      } catch { /* silent fail */ }
    };

    syncUsersFromCloud();
  }, []);

  // ==================== Login ====================
  const login = async (username: string, password: string, isTrialPeriod: boolean = false): Promise<boolean> => {
    try {
      const emailToUse = username.includes('@') ? username : `${username}@pharma.corp`;

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (!authError && authData.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        const role = profile?.role || 'viewer';
        
        // Check if this role requires MFA
        const requiresMFA = mfaService.requiresMFA(role);
        
        // Check MFA enrollment status
        const mfaStatus = await mfaService.checkMFAStatus(authData.user.id);
        setMfaStatus(mfaStatus);
        
        // Skip MFA during trial period if isTrialPeriod flag is set
        if (isTrialPeriod) {
          console.log('Trial period active - MFA skipped for trial user');
          toast.info('Trial period active. MFA enrollment recommended but not required.');
          
          // Proceed with normal login without MFA
          const sessionExpiry = new Date();
          sessionExpiry.setHours(sessionExpiry.getHours() + 8);

          const cloudUser: User = {
            id: authData.user.id,
            username,
            name: profile?.full_name || username,
            role: role as any,
            department: profile?.department || 'General',
            permissions: ROLE_PERMISSIONS[role] || ['products.read'],
            lastLogin: new Date(),
            sessionExpiry,
          };

          setUser(cloudUser);
          localStorage.setItem('currentUser', JSON.stringify(cloudUser));
          localStorage.setItem('sessionExpiry', sessionExpiry.toISOString());

          await logAudit(authData.user.id, 'LOGIN', 'System', {
            message: 'Cloud authentication successful (trial - MFA skipped)',
            username,
            mfaCompleted: false,
            trialPeriod: true,
          });

          toast.success(`Welcome back, ${cloudUser.name}! (Trial Mode)`);
          return true;
        }
        
        // Skip MFA during trial period, but still allow enrollment
        if (isTrialActive) {
          console.log('Trial period active - MFA skipped for trial user');
          toast.info('Trial period active. MFA enrollment recommended but not required.');
          
          // Proceed with normal login without MFA
          const sessionExpiry = new Date();
          sessionExpiry.setHours(sessionExpiry.getHours() + 8);

          const cloudUser: User = {
            id: authData.user.id,
            username,
            name: profile?.full_name || username,
            role: role as any,
            department: profile?.department || 'General',
            permissions: ROLE_PERMISSIONS[role] || ['products.read'],
            lastLogin: new Date(),
            sessionExpiry,
          };

          setUser(cloudUser);
          localStorage.setItem('currentUser', JSON.stringify(cloudUser));
          localStorage.setItem('sessionExpiry', sessionExpiry.toISOString());

          await logAudit(authData.user.id, 'LOGIN', 'System', {
            message: 'Cloud authentication successful (trial - MFA skipped)',
            username,
            mfaCompleted: false,
            trialPeriod: true,
          });

          toast.success(`Welcome back, ${cloudUser.name}! (Trial Mode)`);
          return true;
        }
        
        // If MFA is required and user is enrolled, trigger MFA challenge
        if (requiresMFA && mfaStatus.enrolled && mfaStatus.factors.length > 0) {
          setMfaRequired(true);
          setPendingMFAChallenge({
            challengeId: mfaStatus.factors[0], // Use first factor for now
            userId: authData.user.id
          });
          
          // Store partial user data for MFA completion
          const partialUser: User = {
            id: authData.user.id,
            username,
            name: profile?.full_name || username,
            role: role as any,
            department: profile?.department || 'General',
            permissions: ROLE_PERMISSIONS[role] || ['products.read'],
            lastLogin: new Date(),
          };
          
          localStorage.setItem('pendingUser', JSON.stringify(partialUser));
          
          toast.info('MFA verification required. Please enter your authenticator code.');
          return false; // Login incomplete, MFA required
        }
        
        // Proceed with normal login for non-MFA users or unenrolled admin users
        const sessionExpiry = new Date();
        sessionExpiry.setHours(sessionExpiry.getHours() + 8);

        const cloudUser: User = {
          id: authData.user.id,
          username,
          name: profile?.full_name || username,
          role: role as any,
          department: profile?.department || 'General',
          permissions: ROLE_PERMISSIONS[role] || ['products.read'],
          lastLogin: new Date(),
          sessionExpiry,
        };

        setUser(cloudUser);
        localStorage.setItem('currentUser', JSON.stringify(cloudUser));
        localStorage.setItem('sessionExpiry', sessionExpiry.toISOString());

        await logAudit(authData.user.id, 'LOGIN', 'System', {
          message: 'Cloud authentication successful',
          username,
          mfaCompleted: false,
        });

        toast.success(`Welcome back, ${cloudUser.name}!`);
        return true;
      }

      console.warn('Supabase auth failed, attempting local fallback migration...');
    } catch (e) {
      console.error('Cloud auth exception:', e);
    }

    // ── Local fallback ──
    await new Promise((resolve) => setTimeout(resolve, 500));
    const foundUser = allUsers.find((u) => u.username === username);

    if (foundUser && password === foundUser.password) {
      const sessionExpiry = new Date();
      sessionExpiry.setHours(sessionExpiry.getHours() + 8);

      const userWithSession = { ...foundUser, lastLogin: new Date(), sessionExpiry };
      setUser(userWithSession);
      localStorage.setItem('currentUser', JSON.stringify(userWithSession));
      localStorage.setItem('sessionExpiry', sessionExpiry.toISOString());

      const activityLog = JSON.parse(localStorage.getItem('activityLog') || '[]');
      activityLog.unshift({
        timestamp: new Date().toISOString(),
        action: 'LOGIN',
        user: foundUser.username,
        details: 'User logged in via local fallback',
      });
      localStorage.setItem('activityLog', JSON.stringify(activityLog.slice(0, 100)));

      toast.success(`Welcome back, ${foundUser.name}!`);
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
      } catch (e) {
        console.error('Cloud logout error:', e);
      }

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

  // ==================== Permissions ====================
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.permissions.includes('*')) return true;
    return user.permissions.includes(permission);
  };

  const checkSession = (): boolean => {
    if (!user) return false;
    if (!user.sessionExpiry) return false;
    return new Date(user.sessionExpiry) > new Date();
  };

  // ==================== MFA Methods ====================
  const checkMFAStatus = async () => {
    if (!user) return;
    const status = await mfaService.checkMFAStatus(user.id);
    setMfaStatus(status);
  };

  const enrollMFA = async () => {
    if (!user) return null;
    try {
      const enrollment = await mfaService.enrollTOTP(user.id);
      return {
        qrCode: enrollment.qrCode,
        secret: enrollment.secret,
      };
    } catch (error) {
      console.error('MFA enrollment failed:', error);
      toast.error('Failed to enroll in MFA. Please try again.');
      return null;
    }
  };

  const verifyMFAEnrollment = async (code: string): Promise<boolean> => {
    if (!user) return false;
    try {
      // First get the TOTP factors
      const factors = await mfaService.checkMFAStatus(user.id);
      if (factors.factors.length === 0) {
        toast.error('No MFA factors found. Please enroll first.');
        return false;
      }

      const verified = await mfaService.verifyTOTPEnrollment(factors.factors[0], code);
      if (verified) {
        await checkMFAStatus();
        toast.success('MFA enrollment verified successfully!');
        return true;
      } else {
        toast.error('Invalid MFA code. Please try again.');
        return false;
      }
    } catch (error) {
      console.error('MFA verification failed:', error);
      toast.error('MFA verification failed. Please try again.');
      return false;
    }
  };

  const completeMFAChallenge = async (code: string): Promise<boolean> => {
    if (!pendingMFAChallenge) return false;
    
    try {
      // First create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: pendingMFAChallenge.challengeId,
      });

      if (challengeError || !challengeData) {
        console.error('MFA challenge creation failed:', challengeError);
        toast.error('Failed to create MFA challenge');
        return false;
      }

      // Then verify with the code
      const { data, error } = await supabase.auth.mfa.verify({
        factorId: pendingMFAChallenge.challengeId,
        challengeId: challengeData.id,
        code,
      });

      if (error) {
        console.error('MFA challenge verification failed:', error);
        toast.error('Invalid MFA code. Please try again.');
        return false;
      }

      if (data) {
        // Get pending user data
        const pendingUserStr = localStorage.getItem('pendingUser');
        if (pendingUserStr) {
          const pendingUser: User = JSON.parse(pendingUserStr);
          const sessionExpiry = new Date();
          sessionExpiry.setHours(sessionExpiry.getHours() + 8);
          
          const completedUser = {
            ...pendingUser,
            sessionExpiry,
          };

          setUser(completedUser);
          localStorage.setItem('currentUser', JSON.stringify(completedUser));
          localStorage.setItem('sessionExpiry', sessionExpiry.toISOString());
          localStorage.removeItem('pendingUser');

          await logAudit(completedUser.id, 'LOGIN', 'System', {
            message: 'Cloud authentication with MFA successful',
            username: completedUser.username,
            mfaCompleted: true,
          });

          setMfaRequired(false);
          setPendingMFAChallenge(null);
          toast.success(`Welcome back, ${completedUser.name}!`);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('MFA challenge completion failed:', error);
      toast.error('MFA verification failed. Please try again.');
      return false;
    }
  };

  // ==================== User Management (with cloud sync) ====================
  const addUser = async (newUser: Omit<User, 'id'>) => {
    const userWithId: User = {
      ...newUser,
      id: crypto.randomUUID(),
      permissions: ROLE_PERMISSIONS[newUser.role] || ['products.read'],
    };
    const updated = [...allUsers, userWithId];
    setAllUsers(updated);
    saveUsers(updated);

    // Sync to Supabase profiles
    try {
      await supabase.from('profiles').insert({
        id: userWithId.id,
        full_name: userWithId.name,
        role: userWithId.role,
        department: userWithId.department,
        username: userWithId.username,
      });
    } catch { /* silent */ }

    toast.success(`User "${newUser.name}" added successfully`);
  };

  const updateUser = async (updatedUser: User) => {
    const updated = allUsers.map((u) =>
      u.id === updatedUser.id
        ? { ...updatedUser, permissions: ROLE_PERMISSIONS[updatedUser.role] || updatedUser.permissions }
        : u
    );
    setAllUsers(updated);
    saveUsers(updated);

    // Sync to Supabase
    try {
      await supabase.from('profiles').upsert({
        id: updatedUser.id,
        full_name: updatedUser.name,
        role: updatedUser.role,
        department: updatedUser.department,
        username: updatedUser.username,
      });
    } catch { /* silent */ }

    toast.success(`User "${updatedUser.name}" updated successfully`);
  };

  const deleteUser = async (userId: string) => {
    if (user?.id === userId) {
      toast.error('Cannot delete the currently logged-in user');
      return;
    }
    const updated = allUsers.filter((u) => u.id !== userId);
    setAllUsers(updated);
    saveUsers(updated);

    // Sync to Supabase
    try {
      await supabase.from('profiles').delete().eq('id', userId);
    } catch { /* silent */ }

    toast.success('User deleted successfully');
  };

  return (
    <SecurityContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout: handleLogout,
        hasPermission,
        checkSession,
        allUsers,
        addUser,
        updateUser,
        deleteUser,
        // MFA methods
        enrollMFA,
        verifyMFAEnrollment,
        requiresMFAChallenge: mfaRequired,
        mfaStatus,
        checkMFAStatus,
        completeMFAChallenge,
      }}
    >
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

// ==================== Login Component ====================
export function LoginPage({ forcedLicenseLock = false }: { forcedLicenseLock?: boolean }) {
  const { login, requiresMFAChallenge } = useSecurity();
  const { activate, status } = useLicense();
  const trialStatus = getTrialStatus();
  
  const isDev = import.meta.env.DEV;
  // System is locked if not valid, AND trial expired, AND not in dev mode
  const isLocked = !status.isValid && trialStatus.trialExpired && !isDev;
  
  // If it's a trial, not activated yet, and not expired
  const isTrialActive = !status.isValid && trialStatus.isInTrial;

  const [username, setUsername] = useState(isTrialActive ? 'admin' : '');
  const [password, setPassword] = useState(isTrialActive ? 'password' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [showActivation, setShowActivation] = useState(forcedLicenseLock || isLocked);
  const [activationKey, setActivationKey] = useState('');
  const [copied, setCopied] = useState(false);
  const mid = getMachineId();
  
  // MFA Challenge State
  const [showMFAChallenge, setShowMFAChallenge] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(mid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Machine ID copied to clipboard');
  };

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
      const success = await login(username, password, isTrialActive);
      if (success) {
        // Login successful
      } else if (requiresMFAChallenge) {
        // MFA required, show challenge dialog
        setShowMFAChallenge(true);
      } else {
        setError('Integration Error: Security credentials invalid or expired.');
      }
    } catch {
      setError('System Integrity Fault: Authentication service unreachable.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFAComplete = () => {
    setShowMFAChallenge(false);
    // Login is already completed by the MFA challenge
  };

  const handleActivate = () => {
    if (!activationKey) return;
    if (activate(activationKey)) {
      toast.success('System Integrity Verified. Access Granted.');
      setActivationKey('');
      setShowActivation(false);
    } else {
      toast.error(status.message || 'Invalid Certification Key.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-[1000px] grid lg:grid-cols-2 bg-white/5 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden backdrop-blur-2xl relative z-10 transition-all duration-700 animate-in fade-in slide-in-from-bottom-8">

        {/* Left: Branding */}
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
              DIGITAL<br />QUALITY<br />ASSURANCE.
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

        {/* Right: Login Form */}
        <div className="p-12 lg:p-16 flex flex-col justify-center">
          <div className="mb-10 flex flex-col items-center lg:items-start">
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-6">Access Portal</h1>
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
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-xs font-bold">
                  {error}
                </div>
              )}
              {isLocked && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-2xl text-xs font-bold flex items-center gap-3">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>Enterprise License Expired or Missing. System Access is restricted until activation occurs.</span>
                </div>
              )}
              {isTrialActive && !isLocked && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 mb-6">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>Trial Mode Active: Default Admin credentials pre-filled. Click Initialize Session to continue.</span>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Corporate ID / Username</Label>
                <div className="relative group">
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin"
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
                disabled={isLoading || isLocked}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying Keys...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4" />
                    {isLocked ? 'System Locked: Activation Required' : 'Initialize Session'}
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
                <div className="space-y-2 mt-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Certification Key</Label>
                  <Input
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    className="bg-slate-950 border-white/10 h-14 text-sm font-mono uppercase text-white placeholder:text-slate-800 rounded-2xl focus:border-amber-500/50"
                    value={activationKey}
                    onChange={(e) => setActivationKey(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full bg-amber-600 hover:bg-amber-500 h-14 font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-amber-900/20 mt-4"
                  onClick={() => handleActivate()}
                >
                  Confirm Activation
                </Button>
                <div className="mt-8 pt-8 border-t border-white/5">
                  <p className="text-[9px] text-slate-500 italic leading-relaxed">
                    * Activation keys are uniquely bound to your hardware ID for audit trail integrity.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!import.meta.env.DEV && (
            <div className="mt-12 pt-12 border-t border-white/5 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-700">
                PharmaQMS Enterprise v4.1.5 • Licensed Production Environment
              </p>
            </div>
          )}

          {import.meta.env.DEV && (
            <div className="mt-12 pt-12 border-t border-white/10">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-500/50 mb-4 text-center">Sandbox Debug Profiles</p>
              <div className="grid grid-cols-2 gap-2 text-[8px] font-black uppercase tracking-widest">
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-slate-500 hover:border-indigo-500/30 transition-colors">
                  Admin: <span className="text-white">admin</span>
                </div>
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-slate-500 hover:border-indigo-500/30 transition-colors">
                  Manager: <span className="text-white">qa_manager</span>
                </div>
              </div>
              <p className="text-[8px] text-slate-700 text-center mt-2">Password: <span className="text-slate-500">password</span></p>
            </div>
          )}
        </div>
      </div>

      {/* MFA Challenge Dialog */}
      <MFAChallenge 
        isOpen={showMFAChallenge}
        onClose={() => setShowMFAChallenge(false)}
        onSuccess={handleMFAComplete}
      />
    </div>
  );
}

// ==================== Permission Guard ====================
export function PermissionGuard({
  permission,
  children,
  fallback,
}: {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { hasPermission } = useSecurity();
  if (!hasPermission(permission)) {
    return fallback || (
      <Alert variant="destructive">
        <AlertDescription>
          Access Denied: You do not have sufficient privileges to access this module.
        </AlertDescription>
      </Alert>
    );
  }
  return <>{children}</>;
}
