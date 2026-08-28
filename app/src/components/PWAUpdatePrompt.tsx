import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true });
  if (!needRefresh) return null;
  const applyUpdate = async () => {
    await updateServiceWorker(true);
    setNeedRefresh(false);
  };
  return (
    <div className="fixed bottom-4 left-4 w-96 z-50 bg-blue-50 dark:bg-blue-950 rounded-lg shadow-lg border border-blue-200 dark:border-blue-800 p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-300" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-blue-900 dark:text-blue-100">New version available</h4>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            A new PharmaQMS update is ready. Refresh to use the latest features.
          </p>
          <div className="flex justify-end mt-3">
            <Button size="sm" onClick={applyUpdate} className="bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="mr-2 h-4 w-4" />
              Update Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
