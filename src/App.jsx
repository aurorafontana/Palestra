import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DailyView } from './pages/DailyView';
import { WeeklyView } from './pages/WeeklyView';
import { HistoryView } from './pages/HistoryView';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DailyView />} />
          <Route path="weekly" element={<WeeklyView />} />
          <Route path="history" element={<HistoryView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
