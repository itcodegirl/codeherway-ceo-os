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
    <aside className="sidebar">
      <div className="sidebar__brand">
        <p className="sidebar__eyebrow">CodeHerWay</p>
        <h1>CEO OS</h1>
      </div>

      <nav className="sidebar__nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;