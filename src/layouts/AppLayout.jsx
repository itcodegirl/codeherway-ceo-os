import { Outlet } from 'react-router-dom';
import Sidebar from '../components/ui/Sidebar';
import Topbar from '../components/ui/Topbar';

function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Topbar />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;