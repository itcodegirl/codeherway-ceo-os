import { NavLink } from 'react-router-dom';
import Icon from './Icon';
import { usePersistentState } from '../../hooks/usePersistentState';
import { DEFAULT_SETTINGS, resolveTeamName } from '../../lib/settings';

function Sidebar() {
  const [settings] = usePersistentState('ceo-os-settings', DEFAULT_SETTINGS);
  const teamName = resolveTeamName(settings?.teamName);

  const navItems = [
    { label: 'Dashboard', path: '/', icon: 'dashboard' },
    { label: 'Opportunities', path: '/opportunities', icon: 'opportunities' },
    { label: 'Content OS', path: '/content', icon: 'content' },
    { label: 'Weekly Brief', path: '/weekly-brief', icon: 'weekly' },
    { label: 'Chief of Staff', path: '/chief-of-staff', icon: 'chief' },
    { label: 'Settings', path: '/settings', icon: 'settings' },
  ];

  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="sidebar__brand">
        <p className="sidebar__eyebrow">{teamName}</p>
        <p className="sidebar__brand-title">CEO OS</p>
      </div>

      <nav className="sidebar__nav" aria-label="Main navigation">
        <ul className="sidebar__list">
          {navItems.map((item) => (
            <li key={item.path} className="sidebar__item">
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
                }
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
