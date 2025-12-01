import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { db } from '../db/db';
import { ChevronDown, ChevronUp, Calendar, Dumbbell } from 'lucide-react';

export function HistoryView() {
    const [filterType, setFilterType] = useState('sessions'); // 'sessions' or 'exercises'
    const [selectedDay, setSelectedDay] = useState('All');
    const [selectedExercise, setSelectedExercise] = useState('All');

    const workouts = useLiveQuery(async () => {
        return await db.workouts.orderBy('date').reverse().toArray();
    });

    const logs = useLiveQuery(async () => {
        return await db.logs.toArray();
    });

    const getWorkoutLogs = (workoutId) => {
        return logs?.filter(l => l.workoutId === workoutId) || [];
    };

    // Get unique days and exercises for filters
    const uniqueDays = ['All', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'];
    const uniqueExercises = ['All', ...new Set(logs?.map(l => l.exerciseName) || [])].sort();

    const filteredWorkouts = workouts?.filter(w => {
        if (selectedDay === 'All') return true;
        // We need to infer the day from the date or store it. 
        // Since we didn't store "Lunedì" explicitly in the DB (only date), we can try to derive it 
        // OR we can rely on the user's mental model. 
        // Actually, the user asked to "choose a day -> see all past sessions of that day".
        // Let's use date-fns to get the day name.
        const dayName = format(new Date(w.date), 'EEEE'); // This gives English names.
        // Mapping English to Italian for filtering
        const map = { 'Monday': 'Lunedì', 'Tuesday': 'Martedì', 'Wednesday': 'Mercoledì', 'Thursday': 'Giovedì', 'Friday': 'Venerdì', 'Saturday': 'Sabato', 'Sunday': 'Domenica' };
        return map[dayName] === selectedDay;
    });

    return (
        <div className="space-y-6 pb-24">
            <h2 className="text-2xl font-bold text-white">History & Analysis</h2>

            {/* Filter Toggles */}
            <div className="flex bg-gray-800 p-1 rounded-xl">
                <button
                    onClick={() => setFilterType('sessions')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${filterType === 'sessions' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Sessions
                </button>
                <button
                    onClick={() => setFilterType('exercises')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${filterType === 'exercises' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Exercises
                </button>
            </div>

            {filterType === 'sessions' ? (
                <div className="space-y-4">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {uniqueDays.map(day => (
                            <button
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${selectedDay === day
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500'
                                    }`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>

                    {filteredWorkouts?.map(workout => (
                        <div key={workout.id} className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-gray-700/50 flex justify-between items-center bg-gray-800/80">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${workout.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                    <div>
                                        <p className="font-bold text-white">{format(new Date(workout.date), 'EEEE d MMMM')}</p>
                                        <p className="text-xs text-gray-500">Week {workout.weekNumber || '-'}</p>
                                    </div>
                                </div>
                                <span className="text-xs font-mono text-gray-400">#{workout.id}</span>
                            </div>
                            <div className="p-4 space-y-3">
                                {getWorkoutLogs(workout.id).map(log => (
                                    <div key={log.id} className="flex justify-between items-center text-sm">
                                        <span className="text-gray-300">{log.exerciseName}</span>
                                        <span className="text-gray-500 font-mono">
                                            {log.sets.filter(s => s.weight).length} sets
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    <select
                        value={selectedExercise}
                        onChange={(e) => setSelectedExercise(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                    >
                        {uniqueExercises.map(ex => (
                            <option key={ex} value={ex}>{ex}</option>
                        ))}
                    </select>

                    {selectedExercise !== 'All' && (
                        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                            <h3 className="font-bold text-lg text-blue-400 mb-4">{selectedExercise} Progress</h3>
                            <div className="space-y-2">
                                {logs
                                    ?.filter(l => l.exerciseName === selectedExercise)
                                    .sort((a, b) => a.id - b.id) // Rough sort by ID (time)
                                    .map(log => {
                                        const workout = workouts?.find(w => w.id === log.workoutId);
                                        // Find max weight
                                        const maxWeight = Math.max(...log.sets.map(s => parseFloat(s.weight) || 0));
                                        return (
                                            <div key={log.id} className="flex justify-between items-center text-sm border-b border-gray-700/50 last:border-0 py-2">
                                                <span className="text-gray-400">{workout ? format(new Date(workout.date), 'd MMM') : '-'}</span>
                                                <span className="font-bold text-white">{maxWeight > 0 ? `${maxWeight} kg` : '-'}</span>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
