import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

type AppShellProps = {
  kicker?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function AppShell({ kicker, title, subtitle, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="app-shell__main">
        <Topbar
          kicker={kicker}
          title={title}
          subtitle={subtitle}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="app-shell__content">{children}</main>
      </div>
      <style>{`
        .app-shell {
          min-height: 100vh;
        }
        .app-shell__main {
          margin-left: var(--sidebar-w);
          min-height: 100vh;
          padding: clamp(0.85rem, 2vw, 1.35rem) clamp(1rem, 3vw, 1.75rem)
            clamp(1.5rem, 4vw, 2.5rem);
          max-width: calc(var(--content-max) + var(--sidebar-w) + 4rem);
        }
        .app-shell.sidebar-collapsed .app-shell__main {
          margin-left: var(--sidebar-w-collapsed);
        }
        .app-shell__content {
          display: flex;
          flex-direction: column;
          gap: clamp(1.15rem, 2.5vw, 1.65rem);
          max-width: var(--content-max);
        }
        @media (max-width: 900px) {
          .app-shell__main {
            margin-left: 0;
            max-width: none;
          }
          .app-shell.sidebar-collapsed .app-shell__main {
            margin-left: 0;
          }
          .app-shell__content {
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
}
