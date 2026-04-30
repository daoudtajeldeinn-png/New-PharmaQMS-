import { db } from '../db/db';

export const backupSystemData = async () => {
    try {
        const tables = db.tables;
        const backupData: Record<string, any[]> = {};
        
        await Promise.all(tables.map(async (table) => {
            backupData[table.name] = await table.toArray();
        }));

        const backup = {
            timestamp: new Date().toISOString(),
            version: "3.0",
            application: "PharmaQMS Enterprise",
            data: backupData
        };

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `PQMS_Cloud_Backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true;
    } catch (error) {
        console.error("Backup failed:", error);
        return false;
    }
};

export const prepareGoogleDriveBackup = async () => {
    // This creates the backup file and notifies the user to save it to their Drive folder
    const success = await backupSystemData();
    if (success) {
        return "Backup file generated. Please save this file to your Google Drive folder for cloud synchronization.";
    }
    throw new Error("Cloud backup preparation failed.");
};

export const restoreSessionData = (jsonData: string) => {
    try {
        const backup = JSON.parse(jsonData);
        if (!backup.data) throw new Error("Invalid backup format");
        return backup.data;
    } catch (e) {
        console.error("Restore failed:", e);
        return null;
    }
};

export const importSystemData = async (backupData: Record<string, any[]>) => {
    try {
        const tables = db.tables;
        
        // Use a transaction for safety
        await db.transaction('rw', tables, async () => {
            for (const table of tables) {
                const data = backupData[table.name];
                if (data && Array.isArray(data)) {
                    await table.clear();
                    await table.bulkAdd(data);
                }
            }
        });
        
        return true;
    } catch (error) {
        console.error("Import failed:", error);
        throw error;
    }
};

export const backupSessionData = async () => {
  return await backupSystemData();
};
