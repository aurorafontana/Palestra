import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { db } from '../db/db';

export function WeeklyView() {
  const [selectedExercise, setSelectedExercise] = useState('All');

  const logs = useLiveQuery(async () => {
    return await db.logs.toArray();
  });

  const workouts = useLiveQuery(async () => {
    return await db.workouts.toArray();
  });

  const bodyweightData = useLiveQuery(async () => {
    const data = await db.bodyweight.orderBy('date').toArray();
    return data.map(d => ({
      date: format(new Date(d.date), 'd MMM'),
      weight: d.weight
    }));
  });

  // Unique exercises for dropdown
  const uniqueExercises = ['All', ...new Set(logs?.map(l => l.exerciseName) || [])].sort();

  // Prepare data for Load Progression Chart
  const getProgressionData = () => {
    if (!logs || !workouts || selectedExercise === 'All') return [];

    const exerciseLogs = logs.filter(l => l.exerciseName === selectedExercise);
    const data = exerciseLogs.map(log => {
      const workout = workouts.find(w => w.id === log.workoutId);
      if (!workout) return null;

      // Find max weight in the set
      const maxWeight = Math.max(...log.sets.map(s => parseFloat(s.weight) || 0));

      return {
        date: workout.date, // Keep ISO for sorting
        displayDate: format(new Date(workout.date), 'd MMM'),
        weight: maxWeight
      };
    }).filter(d => d && d.weight > 0);

    return data.sort((a, b) => a.date.localeCompare(b.date));
  };

  const progressionData = getProgressionData();

  return (
    <div className="space-y-8 pb-24">
      <h2 className="text-2xl font-bold text-white">Weekly Progress</h2>

      {/* Bodyweight Chart */}
      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
        <h3 className="text-lg font-semibold text-blue-400 mb-4">Bodyweight Trend</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={bodyweightData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} domain={['dataMin - 1', 'dataMax + 1']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                itemStyle={{ color: '#60A5FA' }}
              />
              <Line type="monotone" dataKey="weight" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Load Progression Chart */}
      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-green-400">Load Progression</h3>
        </div>

        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm mb-4 outline-none focus:border-green-500"
        >
          <option value="All" disabled>Select Exercise</option>
          {uniqueExercises.filter(e => e !== 'All').map(ex => (
            <option key={ex} value={ex}>{ex}</option>
          ))}
        </select>

        {selectedExercise !== 'All' ? (
          <div className="h-64 w-full">
            {progressionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="displayDate" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                    itemStyle={{ color: '#34D399' }}
                  />
                  <Line type="monotone" dataKey="weight" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No data available for this exercise
              </div>
            )}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-900/30 rounded-lg">
            Select an exercise to view progress
          </div>
        )}
      </div>
    </div>
  );
}

