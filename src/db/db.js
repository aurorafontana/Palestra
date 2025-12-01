import Dexie from 'dexie';

export const db = new Dexie('WorkoutTrackerDB');

db.version(2).stores({
    workouts: '++id, date, weekNumber, status', // Added weekNumber and status
    logs: '++id, workoutId, exerciseName',
    bodyweight: '++id, date, weekNumber', // Added weekNumber
}).upgrade(tx => {
    // Migration not strictly necessary for dev, but good practice
});


// Helper to populate data or migrate if needed
db.on('populate', () => {
    // Optional: Add initial data
});
