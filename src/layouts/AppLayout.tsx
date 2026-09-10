import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, Tractor, Map, Leaf, ClipboardList,
  Package, Wallet, Brain, LogOut, Menu, X, ChevronDown,
  Bell, User, Sprout, Search, ChevronLeft, ChevronRight,
  Sparkles, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { ToastContainer, showToast } from '@/components/common/ToastNotification';
import { CommandPaletteModal } from '@/components/common/CommandPaletteModal';

interface NavGroup {
  label: string;
  items: {
    to: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    badge?: string;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/farms', icon: Tractor, label: 'Farms' },
      { to: '/fields', icon: Map, label: 'Fields' },
      { to: '/crops', icon: Leaf, label: 'Crop Cycles', badge: 'Active' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/activities', icon: ClipboardList, label: 'Activities', badge: '1 Overdue' },
      { to: '/inputs', icon: Package, label: 'Inputs' },
      { to: '/expenses', icon: Wallet, label: 'Expenses' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/intelligence', icon: Brain, label: 'Farm Health', badge: '82/100' },
    ],
  },
];

export default function AppLayout() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('farmpilot_sidebar_collapsed') === 'true';
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('farmpilot_sidebar_collapsed', String(collapsed));
  }, [collapsed]);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    showToast.info('Signed out successfully');
    navigate('/login');
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Farm Manager';

  // Compute breadcrumb title based on path
  const currentPath = location.pathname;
  const currentNav = NAV_GROUPS.flatMap(g => g.items).find(i => currentPath.startsWith(i.to));
  const pageTitle = currentNav?.label || 'Command Center';

  return (
    <div className="flex h-screen bg-[var(--color-surface-canvas)] overflow-hidden">
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Stitch Collapsible Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          bg-white border-r border-[var(--color-border-subtle)]
          flex flex-col transition-all duration-200 ease-in-out
          ${collapsed ? 'lg:w-[68px]' : 'lg:w-[256px]'}
          ${sidebarOpen ? 'w-[256px] translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--color-border-subtle)]">
          <NavLink to="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-800)] flex items-center justify-center text-white flex-shrink-0 shadow-xs">
              <Sprout className="w-4 h-4" />
            </div>
            {(!collapsed || sidebarOpen) && (
              <div className="min-w-0">
                <span className="text-sm font-bold text-[var(--color-text-title)] tracking-tight block truncate">
                  FarmPilot
                </span>
                <span className="text-[10px] font-semibold text-[var(--color-primary-600)] tracking-wider uppercase block truncate">
                  Precision OS
                </span>
              </div>
            )}
          </NavLink>

          <button
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
          {NAV_GROUPS.map(group => (
            <div key={group.label} className="space-y-1">
              {(!collapsed || sidebarOpen) && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] mb-1">
                  {group.label}
                </p>
              )}

              {group.items.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold
                      transition-colors relative
                      ${isActive
                        ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-800)]'
                        : 'text-[var(--color-text-muted)] hover:bg-slate-50 hover:text-[var(--color-text-title)]'
                      }
                      ${collapsed && !sidebarOpen ? 'justify-center px-2' : ''}
                    `}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {(!collapsed || sidebarOpen) && (
                      <span className="flex-1 truncate">{item.label}</span>
                    )}

                    {(!collapsed || sidebarOpen) && item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        item.badge.includes('Overdue')
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer & Collapse Toggle */}
        <div className="border-t border-[var(--color-border-subtle)] p-2">
          {/* Collapse Toggle for Desktop */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[var(--color-text-muted)] hover:bg-slate-50 hover:text-[var(--color-text-title)] transition-colors mb-1"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 mx-auto" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse menu</span>
              </>
            )}
          </button>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-50 transition-colors ${
                collapsed && !sidebarOpen ? 'justify-center' : ''
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-[var(--color-primary-100)] text-[var(--color-primary-800)] flex items-center justify-center text-xs font-bold flex-shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>

              {(!collapsed || sidebarOpen) && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-xs font-semibold text-[var(--color-text-title)] truncate">{displayName}</p>
                    <p className="text-[10px] text-[var(--color-text-faint)] truncate">{user?.email}</p>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-[var(--color-text-faint)] transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

            {profileOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-[var(--color-border-subtle)] rounded-xl shadow-lg overflow-hidden animate-scale-in z-50">
                <div className="p-3 border-b border-[var(--color-border-subtle)]">
                  <p className="text-xs font-bold text-[var(--color-text-title)]">{displayName}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)] truncate">{user?.email}</p>
                  <span className="mt-1.5 inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Active Farm Manager
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Stitch Top Command Header */}
        <header className="h-16 bg-white border-b border-[var(--color-border-subtle)] flex items-center justify-between px-4 lg:px-8 flex-shrink-0">
          {/* Left: Mobile Toggle & Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[var(--color-text-muted)] font-medium">FarmPilot</span>
              <span className="text-[var(--color-border-strong)]">/</span>
              <span className="font-bold text-[var(--color-text-title)]">{pageTitle}</span>
            </div>
          </div>

          {/* Center: Contextual Farm Switcher Pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-surface-muted)] border border-[var(--color-border-subtle)] text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-[var(--color-text-title)]">Green Valley Farm</span>
            <span className="text-[11px] text-[var(--color-text-muted)]">25.0 Acres</span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.2 rounded">Kharif 2026</span>
          </div>

          {/* Right Actions: Command Search, Notifications, Demo Reset */}
          <div className="flex items-center gap-2">
            {/* Command Search Trigger */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--color-border-subtle)] bg-slate-50 hover:bg-slate-100 text-xs text-[var(--color-text-muted)] transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
              <span className="hidden sm:inline">Search commands</span>
              <kbd className="hidden sm:inline px-1.5 py-0.2 bg-white border border-slate-200 rounded text-[10px] font-mono">⌘K</kbd>
            </button>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-slate-100 relative transition-colors cursor-pointer"
                title="Operational Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-[var(--color-border-subtle)] rounded-xl shadow-xl p-3 z-50 animate-scale-in">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--color-border-subtle)]">
                    <span className="text-xs font-bold text-[var(--color-text-title)]">Alert Center</span>
                    <span className="text-[10px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                      1 Action Required
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="p-2.5 rounded-lg bg-red-50/50 border border-red-100 text-xs">
                      <div className="flex items-center gap-1.5 text-red-800 font-bold mb-0.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Fertilizer Application Overdue</span>
                      </div>
                      <p className="text-[11px] text-red-700 leading-normal">
                        Zinc Sulfate Spray is 2 days behind schedule in Field A.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-bold mb-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Budget Health Optimal</span>
                      </div>
                      <p className="text-[11px] text-emerald-700 leading-normal">
                        Total spend is tracking 8% under Kharif season planned outlay.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Viewport Canvas */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8 max-w-[1440px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Toast Container */}
      <ToastContainer />

      {/* Global Cmd+K Command Palette Modal */}
      <CommandPaletteModal
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}
