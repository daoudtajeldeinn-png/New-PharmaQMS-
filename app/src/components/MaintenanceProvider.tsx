import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { Wrench, Download, RefreshCw, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// ==================== Types ====================
interface AppVersion {
  version: string;
  buildNumber: string;
  releaseDate: string;
  changes: string[];
  isMandatory: boolean;
}

interface MaintenanceContextType {
  currentVersion: AppVersion;
  isUpdateAvailable: boolean;
  isUpdating: boolean;
  updateProgress: number;
  checkForUpdates: () => Promise<void>;
  applyUpdate: () => Promise<void>;
  lastChecked: Date | null;
  isOffline: boolean;
  clearCache: () => Promise<void>;
  getStorageInfo: () => StorageInfo;
}

interface StorageInfo {
  used: number;
  total: number;
  percentage: number;
}

// ==================== Current Version ====================
const CURRENT_VERSION: AppVersion = {
  version: '1.0.0',
  buildNumber: '20240204.1',
  releaseDate: '2024-02-04',
  changes: [
    'Initial system launch',
    'PWA support for Mobile & Desktop',
    'Enterprise-grade security & RBAC',
    'Global Maintenance & Update Hub',
  ],
  isMandatory: false,
};

// ==================== Context ====================
const MaintenanceContext = createContext<MaintenanceContextType | null>(null);

// ==================== Provider ====================
export function MaintenanceProvider({ children }: { children: ReactNode }) {
  const [currentVersion] = useState<AppVersion>(CURRENT_VERSION);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [newVersion] = useState<AppVersion | null>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check for updates periodically
  useEffect(() => {
    const checkInterval = setInterval(() => {
      checkForUpdates();
    }, 30 * 60 * 1000); // Check every 30 minutes

    // Initial check
    checkForUpdates();

    return () => clearInterval(checkInterval);
  }, []);

  const checkForUpdates = async () => {
    if (isOffline) return;

    try {
      // In a real app, this would check your update server
      // For demo, we'll simulate checking
      setLastChecked(new Date());

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // For demo purposes, no update is available
      // In production, compare with server version
      setIsUpdateAvailable(false);
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  };

  const applyUpdate = async () => {
    setIsUpdating(true);
    setUpdateProgress(0);

    try {
      // Simulate update process
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setUpdateProgress(i);
      }

      // Reload the app
      window.location.reload();
    } catch (error) {
      console.error('Update failed:', error);
      setIsUpdating(false);
      setUpdateProgress(0);
    }
  };

  const clearCache = async () => {
    try {
      // Clear service worker cache
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      // Clear localStorage except critical data
      const keysToKeep = ['currentUser', 'sessionExpiry'];
      const allKeys = Object.keys(localStorage);
      for (const key of allKeys) {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      }

      // Reload to apply changes
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  const getStorageInfo = (): StorageInfo => {
    let used = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length * 2; // UTF-16 encoding
      }
    }

    // Estimate total (typically 5-10MB for localStorage)
    const total = 5 * 1024 * 1024; // 5MB
    const percentage = Math.min((used / total) * 100, 100);

    return {
      used,
      total,
      percentage,
    };
  };

  return (
    <MaintenanceContext.Provider
      value={{
        currentVersion,
        isUpdateAvailable,
        isUpdating,
        updateProgress,
        checkForUpdates,
        applyUpdate,
        lastChecked,
        isOffline,
        clearCache,
        getStorageInfo,
      }}
    >
      {children}

      {/* Offline Indicator */}
      {isOffline && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50">
          <Card className="border-orange-300 bg-orange-50 dark:bg-orange-900/20">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <p className="font-medium text-sm">Offline Mode Active</p>
                <p className="text-xs text-slate-600">
                  Some GxP features may require reconnection.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Update Available Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-600" />
              Critical Update Available
            </DialogTitle>
          </DialogHeader>
          {newVersion && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-600">
                  Current Version: {currentVersion.version}
                </p>
                <p className="text-sm font-medium">
                  Latest Version: {newVersion.version}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Changelog:</p>
                <ul className="list-disc list-inside text-sm text-slate-600">
                  {newVersion.changes.map((change, index) => (
                    <li key={index}>{change}</li>
                  ))}
                </ul>
              </div>

              {newVersion.isMandatory && (
                <div className="p-3 bg-red-50 rounded-lg text-sm text-red-700">
                  This is a mandatory security update required to maintain GxP compliance.
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={applyUpdate} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Install Patch
                </Button>
                {!newVersion.isMandatory && (
                  <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>
                    Later
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MaintenanceContext.Provider>
  );
}

// ==================== Hook ====================
export function useMaintenance() {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error('useMaintenance must be used within a MaintenanceProvider');
  }
  return context;
}

// ==================== Maintenance Page ====================
export function MaintenancePage() {
  const {
    currentVersion,
    isUpdateAvailable,
    isUpdating,
    updateProgress,
    checkForUpdates,
    applyUpdate,
    lastChecked,
    isOffline,
    clearCache,
    getStorageInfo,
  } = useMaintenance();

  const [storageInfo, setStorageInfo] = useState<StorageInfo>(getStorageInfo());

  useEffect(() => {
    const interval = setInterval(() => {
      setStorageInfo(getStorageInfo());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">System Maintenance Hub</h1>
        <p className="text-slate-500">Manage updates, GxP logs, and local storage</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Version Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Application Environment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-500">Version:</span>
              <Badge variant="secondary">{currentVersion.version}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Build Number:</span>
              <code className="text-sm">{currentVersion.buildNumber}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Release Date:</span>
              <span>{currentVersion.releaseDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Connectivity:</span>
              <Badge variant={isOffline ? 'destructive' : 'default'}>
                {isOffline ? 'Offline' : 'Online'}
              </Badge>
            </div>
            {lastChecked && (
              <div className="flex justify-between">
                <span className="text-slate-500">Last Sync Check:</span>
                <span className="text-sm">
                  {lastChecked.toLocaleTimeString('en-GB')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Storage Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Local GxP Storage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-slate-500">Used Capacity:</span>
                <span>{(storageInfo.used / 1024).toFixed(2)} KB</span>
              </div>
              <Progress value={storageInfo.percentage} className="h-2" />
              <p className="text-xs text-slate-500 mt-1">
                {storageInfo.percentage.toFixed(1)}% of total allocation
              </p>
            </div>
            <Button variant="outline" onClick={clearCache} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Clear System Cache
            </Button>
          </CardContent>
        </Card>

        {/* Update Section */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Enterprise Updates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isUpdateAvailable ? (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">System Patch Ready!</span>
                </div>
                {isUpdating ? (
                  <div className="space-y-2">
                    <p className="text-sm">Applying Patch... {updateProgress}%</p>
                    <Progress value={updateProgress} className="h-2" />
                  </div>
                ) : (
                  <Button onClick={applyUpdate}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Apply Patch Now
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-4 bg-green-50 rounded-lg flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>System is operating on latest version</span>
              </div>
            )}

            <Button variant="outline" onClick={checkForUpdates} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Check for Updates
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
