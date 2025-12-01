import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Calendar, BarChart2, History } from 'lucide-react';
import { ExportButton } from './ExportButton';

export function Layout() {
    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans">
            <div className="max-w-md mx-auto min-h-screen relative bg-gray-900 shadow-2xl">
                <header className="p-4 flex justify-between items-center bg-gray-900/90 backdrop-blur sticky top-0 z-10 border-b border-gray-800">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Workout Tracker
                    </h1>
                    <ExportButton />
                </header>

                <main className="p-4">
                    <Outlet />
                </main>

                <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur border-t border-gray-800 z-50">
                    <div className="max-w-md mx-auto flex justify-around p-4">
                        <NavLink
                            to="/"
                            className={({ isActive }) =>
                                `flex flex-col items-center gap-1 text-xs transition-colors ${isActive ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`
                            }
                        >
                            <Calendar size={24} />
                            <span>Daily</span>
                        </NavLink>

                        <NavLink
                            to="/weekly"
                            className={({ isActive }) =>
                                `flex flex-col items-center gap-1 text-xs transition-colors ${isActive ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`
                            }
                        >
                            <BarChart2 size={24} />
                            <span>Weekly</span>
                        </NavLink>

                        <NavLink
                            to="/history"
                            className={({ isActive }) =>
                                `flex flex-col items-center gap-1 text-xs transition-colors ${isActive ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`
                            }
                        >
                            <History size={24} />
                            <span>History</span>
                        </NavLink>
                    </div>
                </nav>
            </div>
        </div>
    );
}
