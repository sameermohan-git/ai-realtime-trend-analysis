import { useState } from 'react';
import { SidebarIcon } from './SidebarIcon';
import './DashboardSidebar.css';

export type NavItem = {
  id: string;
  label: string;
  /** Icon id for SidebarIcon (e.g. 'executive', 'kpis') or legacy emoji string */
  icon: string;
  sectionId?: string;
  action?: () => void;
};

interface DashboardSidebarProps {
  navItems: NavItem[];
  onChatOpen: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function DashboardSidebar({
  navItems,
  onChatOpen,
  isCollapsed,
  onToggleCollapse,
}: DashboardSidebarProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(sectionId);
    }
  };

  const handleNavClick = (item: NavItem) => {
    if (item.sectionId) {
      scrollToSection(item.sectionId);
    }
    if (item.action) {
      item.action();
    }
  };

  return (
    <aside className={`dashboard-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button
        type="button"
        className="sidebar-toggle"
        onClick={onToggleCollapse}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? '→' : '←'}
      </button>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`sidebar-nav-item ${activeId === item.sectionId ? 'active' : ''}`}
            onClick={() => handleNavClick(item)}
            title={item.label}
          >
            <span className="sidebar-nav-icon"><SidebarIcon name={item.icon} /></span>
            {!isCollapsed && <span className="sidebar-nav-label">{item.label}</span>}
          </button>
        ))}
        <button
          type="button"
          className="sidebar-nav-item sidebar-nav-chat"
          onClick={onChatOpen}
          title="Open Copilot chat"
        >
          <span className="sidebar-nav-icon"><SidebarIcon name="copilot" /></span>
          {!isCollapsed && <span className="sidebar-nav-label">Copilot</span>}
        </button>
      </nav>
    </aside>
  );
}
