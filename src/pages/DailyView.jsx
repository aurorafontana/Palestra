import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { Plus, Scale, Save, CheckCircle, TrendingUp, TrendingDown, Minus, Dumbbell } from 'lucide-react';
import { db } from '../db/db';
import { getLastLog } from '../db/history';
import { getWeekNumber } from '../utils/dateUtils';
import { ExerciseForm } from '../components/ExerciseForm';
import { ROUTINES, ROUTINE_LABELS } from '../data/routines';
import { EXERCISE_IMAGES, DEFAULT_EXERCISE_IMAGE } from '../data/exerciseImages';

export function DailyView() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const [isAdding, setIsAdding] = useState(false);
  const [historyData, setHistoryData] = useState({}); // Map of exerciseName -> lastLog

  // Get current workout for today (excluding completed ones)
  const workout = useLiveQuery(async () => {
    return await db.workouts.where('date').equals(todayStr).filter(w => w.status !== 'completed').first();
  });

  const logs = useLiveQuery(async () => {
    if (!workout) return [];
    return await db.logs.where('workoutId').equals(workout.id).toArray();
  }, [workout]);

  const bodyweightEntry = useLiveQuery(async () => {
    return await db.bodyweight.where('date').equals(todayStr).first();
  });

  // Fetch history for all exercises
  useEffect(() => {
    const fetchHistory = async () => {
      if (!logs) return;
      const newHistory = {};
      for (const log of logs) {
        if (!historyData[log.exerciseName]) {
          const lastLog = await getLastLog(log.exerciseName, todayStr);
          if (lastLog) {
            newHistory[log.exerciseName] = lastLog;
          }
        }
      }
      if (Object.keys(newHistory).length > 0) {
        setHistoryData(prev => ({ ...prev, ...newHistory }));
      }
    };
    fetchHistory();
  }, [logs, todayStr]);

  const handleRoutineSelect = async (routineName) => {
    // If workout doesn't exist, create it
    let workoutId = workout?.id;
    if (!workoutId) {
      const weekNum = getWeekNumber(today);
      workoutId = await db.workouts.add({
        date: todayStr,
        weekNumber: weekNum,
        status: 'draft'
      });
    }

    const routine = ROUTINES[routineName];
    if (routine) {
      for (const exercise of routine) {
        const emptySets = Array(exercise.sets).fill({ weight: '', reps: '' });
        await db.logs.add({
          workoutId: workoutId,
          exerciseName: exercise.name,
          target: exercise.target,
          sets: emptySets
        });
      }
    }
  };

  const updateSet = async (logId, setIndex, field, value) => {
    const log = logs.find(l => l.id === logId);
    if (!log) return;
    const newSets = [...log.sets];
    newSets[setIndex] = { ...newSets[setIndex], [field]: value };
    await db.logs.update(logId, { sets: newSets });
  };

  const handleCompleteSession = async () => {
    if (!workout) return;
    // Save session (mark as completed)
    await db.workouts.update(workout.id, { status: 'completed' });
    // The updated query will automatically filter out this completed workout,
    // causing the UI to reset to the routine selector (menu).
  };

  const handleReset = async () => {
    if (!workout) return;
    if (confirm('Sei sicuro di voler resettare la sessione? Questo cancellerà i dati inseriti oggi.')) {
      await db.logs.where('workoutId').equals(workout.id).delete();
      await db.workouts.delete(workout.id);
    }
  };

  const handleAddBodyweight = async () => {
    const weight = prompt("Inserisci peso corporeo (kg):");
    if (weight) {
      const weekNum = getWeekNumber(today);
      if (bodyweightEntry) {
        await db.bodyweight.update(bodyweightEntry.id, { weight: parseFloat(weight) });
      } else {
        await db.bodyweight.add({ date: todayStr, weekNumber: weekNum, weight: parseFloat(weight) });
      }
    }
  };

  const getProgressionIcon = (current, last) => {
    if (!current || !last) return <Minus size={14} className="text-gray-500" />;
    if (parseFloat(current) > parseFloat(last)) return <TrendingUp size={14} className="text-green-500" />;
    if (parseFloat(current) < parseFloat(last)) return <TrendingDown size={14} className="text-red-500" />;
    return <Minus size={14} className="text-gray-500" />;
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header & Bodyweight */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Workout Tracker</h2>
          <div className="flex items-center gap-2">
            <p className="text-gray-400 text-sm">{format(today, 'd MMMM yyyy')}</p>
            {workout && (
              <button onClick={handleReset} className="text-xs text-red-400 hover:text-red-300 underline">
                Reset
              </button>
            )}
          </div>
        </div>
        <button
          onClick={handleAddBodyweight}
          className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-full text-sm hover:bg-gray-700 transition-colors border border-gray-700"
        >
          <Scale size={16} className="text-blue-400" />
          {bodyweightEntry ? `${bodyweightEntry.weight} kg` : 'Peso Corporeo'}
        </button>
      </div>

      {/* Routine Selector */}
      {(!logs || logs.length === 0) && (
        <div className="grid grid-cols-2 gap-3">
          {Object.keys(ROUTINES).map(routineName => (
            <button
              key={routineName}
              onClick={() => handleRoutineSelect(routineName)}
              className="flex flex-col items-start p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-all text-left group"
            >
              <span className="text-xs text-blue-400 font-medium mb-1 uppercase tracking-wider">
                {ROUTINE_LABELS[routineName]}
              </span>
              <div className="flex items-center gap-2">
                <Dumbbell size={18} className="text-gray-400 group-hover:text-white transition-colors" />
                <span className="font-bold text-white">{routineName}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Workout Content */}
      {logs && logs.length > 0 && (
        <div className="space-y-6">
          {logs.map(log => {
            const lastLog = historyData[log.exerciseName];
            const lastWeight = lastLog?.lastWeight;
            const exerciseImage = EXERCISE_IMAGES[log.exerciseName] || DEFAULT_EXERCISE_IMAGE;

            return (
              <div key={log.id} className="bg-gray-800/50 rounded-2xl overflow-hidden border border-gray-800 shadow-sm">
                {/* Exercise Header */}
                <div className="p-4 border-b border-gray-700/50 flex gap-4">
                  <img
                    src={exerciseImage}
                    alt={log.exerciseName}
                    className="w-16 h-16 rounded-lg object-cover bg-gray-700"
                    onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_EXERCISE_IMAGE; }}
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-white mb-1">{log.exerciseName}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="bg-gray-700/50 px-2 py-1 rounded">Target: {log.target || '8-10'} reps</span>
                      {lastWeight && (
                        <span className="text-blue-400 font-medium">
                          Ultimo: {lastWeight} kg
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sets */}
                <div className="p-4 space-y-3">
                  {log.sets?.map((set, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <span className="text-xs font-bold text-gray-500 w-8 uppercase">Set {idx + 1}</span>

                      <div className="flex-1 relative">
                        <input
                          type="number"
                          placeholder="kg"
                          className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono"
                          value={set.weight}
                          onChange={(e) => updateSet(log.id, idx, 'weight', e.target.value)}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {getProgressionIcon(set.weight, lastLog?.sets[idx]?.weight)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Actions */}
          <div className="sticky bottom-20 z-10 px-4 space-y-3">
            <button
              onClick={handleCompleteSession}
              className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-bold shadow-xl shadow-green-900/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Save size={20} />
              Salva Sessione
            </button>
          </div>

          {isAdding ? (
            <ExerciseForm
              workoutId={workout.id}
              onCancel={() => setIsAdding(false)}
              onComplete={() => setIsAdding(false)}
            />
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-4 border-2 border-dashed border-gray-700 rounded-xl text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Aggiungi Esercizio Extra
            </button>
          )}
        </div>
      )}
    </div>
  );
}
