import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import Sidebar from '../components/ui/Sidebar';
import Topbar from '../components/ui/Topbar';
import ErrorBoundary from '../components/ui/ErrorBoundary';

function AppLayout() {
  const location = useLocation();
  const mainRef = useRef(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.focus({ preventScroll: true });
    }
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Sidebar />
      <div className="app-main">
        <Topbar />
        <main className="app-content" id="main-content" tabIndex="-1" ref={mainRef}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
