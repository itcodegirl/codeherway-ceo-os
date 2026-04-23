import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Opportunities = lazy(() => import('./pages/Opportunities'));
const ContentOS = lazy(() => import('./pages/ContentOS'));
const WeeklyBrief = lazy(() => import('./pages/WeeklyBrief'));
const ChiefOfStaff = lazy(() => import('./pages/ChiefOfStaff'));
const OpsReliability = lazy(() => import('./pages/OpsReliability'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Suspense
      fallback={
        <div className="app-shell-load" role="status" aria-live="polite">
          Loading CEO OS...
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="opportunities" element={<Opportunities />} />
          <Route path="content" element={<ContentOS />} />
          <Route path="weekly-brief" element={<WeeklyBrief />} />
          <Route path="chief-of-staff" element={<ChiefOfStaff />} />
          <Route path="ops-reliability" element={<OpsReliability />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
