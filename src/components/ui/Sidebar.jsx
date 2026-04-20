import { NavLink } from 'react-router-dom';

function Sidebar() {
  const navItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Opportunities', path: '/opportunities' },
    { label: 'Content OS', path: '/content' },
    { label: 'Weekly Brief', path: '/weekly-brief' },
    { label: 'Chief of Staff', path: '/chief-of-staff' },
    { label: 'Settings', path: '/settings' },
  ];

  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="sidebar__brand">
        <p className="sidebar__eyebrow">CodeHerWay</p>
        <h1>CEO OS</h1>
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
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;

