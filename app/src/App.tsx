import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from '@/hooks/useStore';
import { SecurityProvider, useSecurity, LoginPage } from '@/components/security/SecurityProvider';
import { LicenseProvider, useLicense } from '@/components/security/LicenseProvider';
import { MaintenanceProvider } from '@/components/maintenance/MaintenanceProvider';
import { ErrorBoundary } from '@/components/security/ErrorBoundary';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Dashboard } from '@/pages/Dashboard';
import { Products } from '@/pages/Products';
import { Testing } from '@/pages/Testing';
import { QualitySystems } from '@/pages/QualitySystems';
import { CAPAPage } from '@/pages/CAPA';
import { DeviationsPage } from '@/pages/Deviations';
import { EquipmentPage } from '@/pages/Equipment';
import { LaboratoryPage } from '@/pages/Laboratory';
import { TrainingPage } from '@/pages/Training';
import { AuditsPage } from '@/pages/Audits';
import { SuppliersPage } from '@/pages/Suppliers';
import { ReportsPage } from '@/pages/Reports';
import { SettingsPage } from '@/pages/Settings';
import { DevPortal } from '@/pages/DevPortal';
import { StabilityPage } from '@/pages/Stability';
import { ArchivePage } from './pages/Archive';
import { IPQCPage } from './pages/IPQC';
import { COAManagerPage } from './pages/COAManager';
import { MFRManagerPage } from './pages/MFRManager';
import { BMRManagerPage } from './pages/BMRManager';
import { MarketComplaintsPage } from './pages/MarketComplaints';
import { RecallsPage } from './pages/Recalls';
import { MaintenancePage } from './components/maintenance/MaintenanceProvider';
import { Toaster } from './components/ui/sonner';
import { Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MaterialInventoryPage from './pages/MaterialInventory';
import ReconciliationDashboard from './pages/ReconciliationDashboard';
import { BatchTimelinePage } from './pages/BatchTimelinePage';

// PWA Install Prompt Component
function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstall(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstall(false);
      }
      setDeferredPrompt(null);
    }
  };

  if (!showInstall) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 z-50 bg-white dark:bg-slate-800 rounded-lg shadow-lg border p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Download className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium">Install Application</h4>
          <p className="text-sm text-slate-500 mt-1">
            Install the PQMS on your device for fast access and offline capabilities.
          </p>
          <div className="flex gap-2 mt-3 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setShowInstall(false)}>
              Later
            </Button>
            <Button size="sm" onClick={handleInstall} className="bg-blue-600">
              <Download className="mr-2 h-4 w-4" />
              Install Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useSecurity();
  const { status } = useLicense();
  const isDev = import.meta.env.DEV;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!status.isValid && !isDev) {
    return <LoginPage forcedLicenseLock />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <>{children}</>;
}

// Main App Layout
function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <div className="ml-72">
        <Header />
        <main className="p-6 pt-24 pb-20">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:category" element={<Products />} />
            <Route path="/materials" element={<MaterialInventoryPage />} />
            <Route path="/testing/*" element={<Testing />} />
            <Route path="/stability" element={<StabilityPage />} />
            <Route path="/archive" element={<ArchivePage />} />
            <Route path="/ipqc" element={<IPQCPage />} />
            <Route path="/coa" element={<COAManagerPage />} />
            <Route path="/mfr" element={<MFRManagerPage />} />
            <Route path="/bmr" element={<BMRManagerPage />} />
            <Route path="/batch-trace" element={<BatchTimelinePage />} />
            <Route path="/reconciliation" element={<ReconciliationDashboard />} />
            <Route path="/capa" element={<CAPAPage />} />
            <Route path="/deviations" element={<DeviationsPage />} />
            <Route path="/complaints" element={<MarketComplaintsPage />} />
            <Route path="/recalls" element={<RecallsPage />} />
            <Route path="/quality/*" element={<QualitySystems />} />
            <Route path="/equipment" element={<EquipmentPage />} />
            <Route path="/lab/*" element={<LaboratoryPage />} />
            <Route path="/training/*" element={<TrainingPage />} />
            <Route path="/audits" element={<AuditsPage />} />
            <Route path="/suppliers" element={<SuppliersPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            {import.meta.env.DEV && <Route path="/dev/licensing" element={<DevPortal />} />}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <PWAInstallPrompt />
    </div>
  );
}

// Main App Component
function App() {
  return (
    <ErrorBoundary>
      <LicenseProvider>
        <StoreProvider>
          <SecurityProvider>
            <MaintenanceProvider>
              <HashRouter>
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              </HashRouter>
              <Toaster />
            </MaintenanceProvider>
          </SecurityProvider>
        </StoreProvider>
      </LicenseProvider>
    </ErrorBoundary>
  );
}

export default App;