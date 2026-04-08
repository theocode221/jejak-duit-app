import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  Banknote,
  CalendarClock,
  Plane,
  ShoppingBag,
  TrendingUp,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/budget', label: 'Monthly budget', icon: Wallet },
  { to: '/income', label: 'Income & OT', icon: Banknote },
  { to: '/bills', label: 'Bills', icon: CalendarClock },
  { to: '/events', label: 'Events / trips', icon: Plane },
  { to: '/gear', label: 'Gear wishlist', icon: ShoppingBag },
  { to: '/side-income', label: 'Side income', icon: TrendingUp },
];

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  return (
    <>
      <aside
        className={`app-sidebar ${collapsed ? 'is-collapsed' : ''} ${
          mobileOpen ? 'is-open' : ''
        }`}
        aria-label="Main navigation"
      >
        <div className="app-sidebar__brand">
          <div className="app-sidebar__logo">B</div>
          {!collapsed && (
            <div>
              <div className="app-sidebar__title">Bajet</div>
              <div className="app-sidebar__tag">Finance OS</div>
            </div>
          )}
        </div>
        <nav className="app-sidebar__nav">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `app-sidebar__link ${isActive ? 'is-active' : ''}`
              }
              onClick={onCloseMobile}
            >
              <Icon size={20} strokeWidth={1.65} aria-hidden />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          className="app-sidebar__collapse"
          onClick={onToggle}
          aria-expanded={!collapsed}
        >
          {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </aside>
      {mobileOpen && (
        <button
          type="button"
          className="app-sidebar__scrim"
          aria-label="Close menu"
          onClick={onCloseMobile}
        />
      )}
      <style>{`
        .app-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          z-index: 40;
          height: 100vh;
          width: var(--sidebar-w);
          background: linear-gradient(
            175deg,
            #0b1220 0%,
            #111827 42%,
            #0f172a 100%
          );
          border-right: 1px solid rgba(148, 163, 184, 0.12);
          display: flex;
          flex-direction: column;
          padding: 1.1rem 0.7rem;
          transition: width 0.22s ease, transform 0.22s ease;
          box-shadow: 4px 0 32px -8px rgba(0, 0, 0, 0.35);
        }
        .app-sidebar.is-collapsed {
          width: var(--sidebar-w-collapsed);
        }
        .app-sidebar__brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.45rem 0.6rem 1.35rem;
        }
        .app-sidebar__logo {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          background: linear-gradient(
            135deg,
            #14b8a6 0%,
            #0d9488 45%,
            #4f46e5 130%
          );
          color: white;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.05rem;
          flex-shrink: 0;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12),
            0 8px 24px -6px var(--accent-glow);
        }
        .app-sidebar__title {
          font-weight: 700;
          font-size: 1.08rem;
          letter-spacing: -0.02em;
          color: #f8fafc;
        }
        .app-sidebar__tag {
          font-size: 0.65rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 600;
          margin-top: 0.1rem;
        }
        .app-sidebar__nav {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          flex: 1;
          overflow-y: auto;
        }
        .app-sidebar__link {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          padding: 0.62rem 0.8rem;
          border-radius: var(--radius-sm);
          color: #94a3b8;
          font-size: 0.875rem;
          font-weight: 500;
          transition: background 0.15s, color 0.15s, box-shadow 0.15s;
        }
        .app-sidebar__link:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #e2e8f0;
        }
        .app-sidebar__link.is-active {
          background: rgba(45, 212, 191, 0.12);
          color: #5eead4;
          box-shadow: inset 0 0 0 1px rgba(45, 212, 191, 0.2);
        }
        .app-sidebar__collapse {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: auto;
          padding: 0.62rem 0.8rem;
          border: none;
          background: transparent;
          border-radius: var(--radius-sm);
          color: #64748b;
          font-size: 0.8125rem;
          font-weight: 500;
        }
        .app-sidebar__collapse:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #cbd5e1;
        }
        .app-sidebar__scrim {
          display: none;
        }
        @media (max-width: 900px) {
          .app-sidebar {
            transform: translateX(-100%);
            box-shadow: var(--shadow-float);
          }
          .app-sidebar.is-open {
            transform: translateX(0);
          }
          .app-sidebar__scrim {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 30;
            background: rgba(2, 6, 23, 0.55);
            backdrop-filter: blur(4px);
            border: none;
            cursor: pointer;
          }
        }
      `}</style>
    </>
  );
}
