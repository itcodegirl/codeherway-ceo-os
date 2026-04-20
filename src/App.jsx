import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import Opportunities from './pages/Opportunities';
import ContentOS from './pages/ContentOS';
import WeeklyBrief from './pages/WeeklyBrief';
import ChiefOfStaff from './pages/ChiefOfStaff';
import Settings from './pages/Settings';

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="opportunities" element={<Opportunities />} />
        <Route path="content" element={<ContentOS />} />
        <Route path="weekly-brief" element={<WeeklyBrief />} />
        <Route path="chief-of-staff" element={<ChiefOfStaff />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;