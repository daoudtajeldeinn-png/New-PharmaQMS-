import { g1Monographs } from '@/data/g1Data';
import { g2COAs } from '@/data/g2Data';
import { masterFormulas } from '@/data/mfrData';
import { batchRecords } from '@/data/bmrData';

export const backupSessionData = () => {
    const backup = {
        timestamp: new Date().toISOString(),
        version: "2.0",
        data: {
            monographs: g1Monographs,
            coaRecords: g2COAs,
            masterFormulas: masterFormulas,
            batchRecords: batchRecords
        }
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PQMS_Full_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
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
