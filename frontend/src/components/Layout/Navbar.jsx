import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../../utils/constants';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-logo" style={{ textDecoration: 'none' }}>
          <span className="logo-accent">F1</span> Analytics
        </NavLink>
        <div className="navbar-links">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
