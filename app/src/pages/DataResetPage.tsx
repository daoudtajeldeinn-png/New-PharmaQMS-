import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function DataResetPage() {
  const [confirmText, setConfirmText] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  // NOTE: This is a build-blocker placeholder to unblock Vite/electron builds.
  // Hook this up to your real reset implementation when ready.
  const canReset = confirmText.trim().toLowerCase() === 'reset';

  const handleReset = async () => {
    if (!canReset || isRunning) return;

    setIsRunning(true);
    try {
      // TODO: Implement actual data reset logic.
      // Example: clear Dexie tables / local cache and optionally re-sync.
      console.warn('DataResetPage: reset requested (placeholder).');
      alert('Data reset is not implemented yet (placeholder).');
      setConfirmText('');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">Admin: Data Reset</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        This page is currently a placeholder to unblock the build. A real implementation can be connected later.
      </p>

      <div className="mt-6 rounded-lg border bg-white dark:bg-slate-900 p-4">
        <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Safety check</div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Type <span className="font-semibold">reset</span> to enable the reset button.
        </p>

        <input
          className="mt-3 w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-slate-800"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          disabled={isRunning}
          placeholder="Type reset"
        />

        <Button
          className="mt-4 w-full"
          onClick={handleReset}
          disabled={!canReset || isRunning}
        >
          {isRunning ? 'Resetting...' : 'Reset Data'}
        </Button>
      </div>
    </div>
  );
}

