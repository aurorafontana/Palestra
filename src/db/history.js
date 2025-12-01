import { db } from './db';

export async function getLastLog(exerciseName, currentDate) {
    // Find the most recent COMPLETED workout before the current date that contains this exercise
    const allLogs = await db.logs.where('exerciseName').equals(exerciseName).toArray();

    if (allLogs.length === 0) return null;

    // Get all workout IDs from logs
    const workoutIds = allLogs.map(log => log.workoutId);

    // Fetch workouts that match these IDs AND are completed AND are before today
    // Note: Dexie doesn't support complex joins/filtering easily in one go.
    const workouts = await db.workouts.where('id').anyOf(workoutIds).toArray();

    // Create a map of valid workouts
    const validWorkoutMap = new Map();
    workouts.forEach(w => {
        if (w.status === 'completed' && w.date < currentDate) {
            validWorkoutMap.set(w.id, w.date);
        }
    });

    // Filter logs that belong to valid workouts
    const validLogs = allLogs.filter(log => validWorkoutMap.has(log.workoutId));

    if (validLogs.length === 0) return null;

    // Sort by workout date descending
    validLogs.sort((a, b) => {
        const dateA = validWorkoutMap.get(a.workoutId);
        const dateB = validWorkoutMap.get(b.workoutId);
        return dateB.localeCompare(dateA);
    });

    const lastLog = validLogs[0];

    // Find the last non-empty set weight
    // User wants "STEP FINALE" (last set)
    let lastWeight = null;
    if (lastLog.sets && lastLog.sets.length > 0) {
        // Try to find the last set with a weight
        for (let i = lastLog.sets.length - 1; i >= 0; i--) {
            if (lastLog.sets[i].weight) {
                lastWeight = lastLog.sets[i].weight;
                break;
            }
        }
    }

    return {
        ...lastLog,
        lastWeight // Add this property for easy access in UI
    };
}
