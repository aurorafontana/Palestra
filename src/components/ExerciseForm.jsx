import React, { useState } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { db } from '../db/db';

export function ExerciseForm({ workoutId, onCancel, onComplete }) {
    const [name, setName] = useState('');
    const [sets, setSets] = useState([{ weight: '', reps: '' }]);

    const addSet = () => setSets([...sets, { weight: '', reps: '' }]);
    const removeSet = (index) => setSets(sets.filter((_, i) => i !== index));

    const updateSet = (index, field, value) => {
        const newSets = [...sets];
        newSets[index][field] = value;
        setSets(newSets);
    };

    const handleSave = async () => {
        if (!name || !workoutId) return;

        await db.logs.add({
            workoutId,
            exerciseName: name,
            sets: sets.map(s => ({ weight: Number(s.weight), reps: Number(s.reps) }))
        });

        setName('');
        setSets([{ weight: '', reps: '' }]);
        onComplete();
    };

    return (
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold">Log Exercise</h3>
                <button onClick={onCancel} className="text-gray-400 hover:text-white">
                    <X size={20} />
                </button>
            </div>

            <input
                type="text"
                placeholder="Exercise Name (e.g., Bench Press)"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white focus:border-blue-500 outline-none transition-colors"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
            />

            <div className="space-y-2">
                {sets.map((set, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                        <span className="text-gray-500 w-6 text-center">{idx + 1}</span>
                        <input
                            type="number" placeholder="kg"
                            className="w-24 bg-gray-900 border border-gray-700 rounded-lg p-2 text-white focus:border-blue-500 outline-none"
                            value={set.weight}
                            onChange={e => updateSet(idx, 'weight', e.target.value)}
                        />
                        <input
                            type="number" placeholder="reps"
                            className="w-24 bg-gray-900 border border-gray-700 rounded-lg p-2 text-white focus:border-blue-500 outline-none"
                            value={set.reps}
                            onChange={e => updateSet(idx, 'reps', e.target.value)}
                        />
                        {sets.length > 1 && (
                            <button onClick={() => removeSet(idx)} className="text-red-400 hover:text-red-300 p-2">
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex gap-2 pt-2">
                <button onClick={addSet} className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
                    <Plus size={16} /> Add Set
                </button>
                <button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors font-medium">
                    <Save size={16} /> Save Log
                </button>
            </div>
        </div>
    );
}
