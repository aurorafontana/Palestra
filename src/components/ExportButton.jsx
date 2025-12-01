import React from 'react';
import { Download } from 'lucide-react';
import { db } from '../db/db';

export function ExportButton() {
    const handleExport = async () => {
        try {
            const workouts = await db.workouts.toArray();
            const logs = await db.logs.toArray();
            const bodyweight = await db.bodyweight.toArray();

            const data = {
                workouts,
                logs,
                bodyweight
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `workout-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export failed:", error);
            alert("Failed to export data");
        }
    };

    return (
        <button
            onClick={handleExport}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg"
        >
            <Download size={16} />
            Export Data
        </button>
    );
}
