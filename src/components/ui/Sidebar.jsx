import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Icon from './Icon';
import { usePersistentState } from '../../hooks/usePersistentState';
import { DEFAULT_SETTINGS, resolveTeamName } from '../../lib/settings';

function Sidebar() {
  const location = useLocation();
  const [settings] = usePersistentState('ceo-os-settings', DEFAULT_SETTINGS);
  const [mobileMenuOpenPath, setMobileMenuOpenPath] = useState('');
  const [isCompactViewport, setIsCompactViewport] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }

    return window.matchMedia('(max-width: 860px)').matches;
  });
  const teamName = resolveTeamName(settings?.teamName);

  const navItems = [
    { label: 'Dashboard', path: '/', icon: 'dashboard' },
    { label: 'Opportunities', path: '/opportunities', icon: 'opportunities' },
    { label: 'Content OS', path: '/content', icon: 'content' },
    { label: 'Weekly Brief', path: '/weekly-brief', icon: 'weekly' },
    { label: 'Chief of Staff', path: '/chief-of-staff', icon: 'chief' },
    { label: 'Settings', path: '/settings', icon: 'settings' },
  ];

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(max-width: 860px)');

    const handleViewportChange = (event) => {
      const isCompact = event.matches;
      setIsCompactViewport(isCompact);
      if (!isCompact) {
        setMobileMenuOpenPath('');
      }
    };

    mediaQuery.addEventListener('change', handleViewportChange);

    return () => {
      mediaQuery.removeEventListener('change', handleViewportChange);
    };
  }, []);

  const isMobileMenuOpen = isCompactViewport
    ? mobileMenuOpenPath === location.pathname
    : true;

  const navId = 'primary-navigation';

  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="sidebar__header">
        <div className="sidebar__brand">
          <p className="sidebar__eyebrow">{teamName}</p>
          <p className="sidebar__brand-title">CEO OS</p>
        </div>

        <button
          type="button"
          className="sidebar__menu-toggle"
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-controls={navId}
          aria-expanded={isMobileMenuOpen}
          onClick={() => {
            setMobileMenuOpenPath((currentPath) => (
              currentPath === location.pathname ? '' : location.pathname
            ));
          }}
        >
          <span className="sidebar__menu-toggle-bar" aria-hidden="true" />
          <span className="sidebar__menu-toggle-bar" aria-hidden="true" />
          <span className="sidebar__menu-toggle-bar" aria-hidden="true" />
        </button>
      </div>

      <nav
        id={navId}
        className={isMobileMenuOpen ? 'sidebar__nav sidebar__nav--open' : 'sidebar__nav'}
        hidden={isCompactViewport && !isMobileMenuOpen}
        aria-hidden={isCompactViewport && !isMobileMenuOpen ? 'true' : undefined}
        aria-label="Main navigation"
      >
        <ul className="sidebar__list">
          {navItems.map((item) => (
            <li key={item.path} className="sidebar__item">
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
                }
                onClick={() => setMobileMenuOpenPath('')}
              >
                <span className="sidebar__link-icon" aria-hidden="true">
                  <Icon name={item.icon} size={16} />
                </span>
                <span className="sidebar__link-label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
