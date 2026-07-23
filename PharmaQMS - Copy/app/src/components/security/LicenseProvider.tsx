import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';
import { validateLicenseKey, getStoredLicenseKey, setLicenseKey, type LicenseStatus } from '@/services/LicenseManager';

interface LicenseContextType {
    status: LicenseStatus;
    activate: (key: string) => boolean;
}

const LicenseContext = createContext<LicenseContextType | null>(null);

export function LicenseProvider({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<LicenseStatus>(validateLicenseKey(getStoredLicenseKey()));

    // Re-validate daily
    useEffect(() => {
        const interval = setInterval(() => {
            setStatus(validateLicenseKey(getStoredLicenseKey()));
        }, 1000 * 60 * 60 * 6); // Every 6 hours
        return () => clearInterval(interval);
    }, []);

    const activate = (key: string): boolean => {
        const validation = validateLicenseKey(key);
        if (validation.isValid) {
            setLicenseKey(key);
            setStatus(validation);
            return true;
        }
        return false;
    };

    // If it's development mode, we bypass the lock for easier workflow
    const isDev = import.meta.env.DEV;

    return (
        <LicenseContext.Provider value={{ status, activate }}>
            {children}
            {/* Subtle license badge/indicator */}
            <div className="fixed bottom-4 right-4 z-50 pointer-events-none opacity-20 hover:opacity-100 transition-opacity">
                <div className={cn("backdrop-blur-sm shadow-sm flex items-center gap-1 border border-slate-200 px-2 py-1 rounded bg-white/80 dark:bg-slate-900/80")}>
                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                    <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-900">
                        {isDev ? "Dev Mode: Unlocked" : (status.isValid ? "Ent. Licensed" : "License Expired")}
                    </span>
                </div>
            </div>
        </LicenseContext.Provider>
    );
}

export function useLicense() {
    const context = useContext(LicenseContext);
    if (!context) {
        throw new Error('useLicense must be used within a LicenseProvider');
    }
    return context;
}

// Utility for CSS joining (simplified)
function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
