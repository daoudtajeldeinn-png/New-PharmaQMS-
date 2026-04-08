
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Archive as ArchiveIcon, Download, Upload, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { db } from '@/db/db';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function ArchivePage() {
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const data: any = {};
            // Get all table names
            const tables = db.tables.map(table => table.name);

            for (const tableName of tables) {
                data[tableName] = await db.table(tableName).toArray();
            }

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pharmaqms-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success('Backup exported successfully');
        } catch (error) {
            console.error('Export failed', error);
            toast.error('Failed to export data');
        } finally {
            setIsExporting(false);
        }
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!confirm("WARNING: This will OVERWRITE all current data with the backup. Are you sure?")) {
            event.target.value = ''; // Reset input
            return;
        }

        setIsImporting(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const json = e.target?.result as string;
                const data = JSON.parse(json);

                await db.transaction('rw', db.tables, async () => {
                    // 1. Clear all tables
                    for (const table of db.tables) {
                        await table.clear();
                    }

                    // 2. Import data
                    for (const tableName of Object.keys(data)) {
                        if (db.table(tableName)) {
                            await db.table(tableName).bulkAdd(data[tableName]);
                        }
                    }
                });

                toast.success('Data restored successfully. Reloading...');
                setTimeout(() => window.location.reload(), 1500);

            } catch (error) {
                console.error('Import failed', error);
                toast.error('Failed to restore data. Invalid file format?');
            } finally {
                setIsImporting(false);
                event.target.value = '';
            }
        };

        reader.readAsText(file);
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
            <div className="flex items-center gap-3 border-b pb-4">
                <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <ArchiveIcon className="h-6 w-6 text-slate-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Data Archiving & Backup</h1>
                    <p className="text-sm text-slate-500">
                        Manage your local data storage, create backups, and restore from archives.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Download className="h-5 w-5 text-indigo-600" />
                            Export Data
                        </CardTitle>
                        <CardDescription>
                            Create a full backup of your local database. Save this file securely.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-slate-50 p-4 rounded-md mb-4 text-sm text-slate-600 border">
                            <p className="font-medium mb-1">Includes:</p>
                            <ul className="list-disc pl-4 space-y-1 text-xs">
                                <li>All Products & Batches</li>
                                <li>Test Methods & Results</li>
                                <li>Stability Protocols (Active & Completed)</li>
                                <li>Quality Logs (CAPA, Deviations, Audits)</li>
                            </ul>
                        </div>
                        <Button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="w-full"
                        >
                            {isExporting ? (
                                <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Exporting...</>
                            ) : (
                                <><Download className="mr-2 h-4 w-4" /> Download Backup (.json)</>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-amber-200 bg-amber-50/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-900">
                            <Upload className="h-5 w-5 text-amber-600" />
                            Restore Data
                        </CardTitle>
                        <CardDescription>
                            Restore your system from a previously exported backup file.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Alert variant="destructive" className="mb-4 bg-white">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Warning</AlertTitle>
                            <AlertDescription className="text-xs mt-1">
                                Restoring will <strong>permanently delete</strong> all current data on this device and replace it with the backup content. This action cannot be undone.
                            </AlertDescription>
                        </Alert>

                        <div className="relative">
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImport}
                                disabled={isImporting}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <Button
                                variant="outline"
                                disabled={isImporting}
                                className="w-full border-amber-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300"
                            >
                                {isImporting ? (
                                    <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Restoring...</>
                                ) : (
                                    <><Upload className="mr-2 h-4 w-4" /> Select Backup File to Restore</>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Storage Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="font-medium text-slate-900">IndexedDB Active</p>
                            <p className="text-sm text-slate-500">
                                Your data is being saved locally using high-performance IndexedDB storage.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default ArchivePage;
