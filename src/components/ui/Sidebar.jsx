import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Icon from './Icon';
import { useWorkspaceSettings } from '../../hooks/useWorkspaceSettings';
import { useMetaMode } from '../../hooks/useMetaMode';
import { buildNavGroups } from '../../lib/routes';

function subscribeToMediaQuery(mediaQuery, listener) {
  if (typeof mediaQuery?.addEventListener === 'function') {
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }

  if (typeof mediaQuery?.addListener === 'function') {
    mediaQuery.addListener(listener);
    return () => mediaQuery.removeListener(listener);
  }

  return () => {};
}

function Sidebar() {
  const location = useLocation();
  const { teamName } = useWorkspaceSettings();
  const isMetaMode = useMetaMode();
  const navGroups = useMemo(() => buildNavGroups(undefined, { isMetaMode }), [isMetaMode]);
  const [mobileMenuOpenKey, setMobileMenuOpenKey] = useState('');
  const menuToggleRef = useRef(null);
  const navRef = useRef(null);
  const [isCompactViewport, setIsCompactViewport] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }

    return window.matchMedia('(max-width: 860px)').matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(max-width: 860px)');

    const handleViewportChange = (event) => {
      const isCompact = event.matches;
      setIsCompactViewport(isCompact);
      if (!isCompact) {
        setMobileMenuOpenKey('');
      }
    };

    return subscribeToMediaQuery(mediaQuery, handleViewportChange);
  }, []);

  const isMobileMenuOpen = isCompactViewport
    ? mobileMenuOpenKey === location.key
    : true;

  useEffect(() => {
    if (!isCompactViewport || !isMobileMenuOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') {
        return;
      }

      event.preventDefault();
      setMobileMenuOpenKey('');
      menuToggleRef.current?.focus?.();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCompactViewport, isMobileMenuOpen]);

  useEffect(() => {
    if (!isCompactViewport || !isMobileMenuOpen) {
      return;
    }

    const currentLink = navRef.current?.querySelector?.('a[aria-current="page"]');
    const fallbackLink = navRef.current?.querySelector?.('a');
    const nextFocusTarget = currentLink || fallbackLink;

    nextFocusTarget?.focus?.();
  }, [isCompactViewport, isMobileMenuOpen, location.pathname]);

  const navId = 'primary-navigation';

  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="sidebar__header">
        <div className="sidebar__brand">
          <p className="sidebar__eyebrow">{teamName}</p>
          <p className="sidebar__brand-title">CEO OS</p>
        </div>

        <button
          ref={menuToggleRef}
          type="button"
          className="sidebar__menu-toggle"
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-controls={navId}
          aria-expanded={isMobileMenuOpen}
          onClick={() => {
            setMobileMenuOpenKey((currentKey) => (
              currentKey === location.key ? '' : location.key
            ));
          }}
        >
          <span className="sidebar__menu-toggle-bar" aria-hidden="true" />
          <span className="sidebar__menu-toggle-bar" aria-hidden="true" />
          <span className="sidebar__menu-toggle-bar" aria-hidden="true" />
        </button>
      </div>

      <nav
        ref={navRef}
        id={navId}
        className={isMobileMenuOpen ? 'sidebar__nav sidebar__nav--open' : 'sidebar__nav'}
        hidden={isCompactViewport && !isMobileMenuOpen}
        aria-hidden={isCompactViewport && !isMobileMenuOpen ? 'true' : undefined}
        aria-label="Main navigation"
      >
        {navGroups.map((group) => (
          <div key={group.id} className={`sidebar__group sidebar__group--${group.id}`}>
            <p className="sidebar__group-label" id={`sidebar-group-${group.id}`}>
              {group.label}
            </p>
            <ul className="sidebar__list" aria-labelledby={`sidebar-group-${group.id}`}>
              {group.items.map((item) => (
                <li key={item.path} className="sidebar__item">
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
                    }
                    onClick={() => setMobileMenuOpenKey('')}
                  >
                    <span className="sidebar__link-icon" aria-hidden="true">
                      <Icon name={item.icon} size={16} />
                    </span>
                    <span className="sidebar__link-label">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
