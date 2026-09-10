import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, Tractor, Map, Leaf, ClipboardList,
  Package, Wallet, Droplets, Wheat, Brain, FileBarChart,
  LogOut, Menu, X, ChevronDown, Bell, User,
  Sprout
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/farms', icon: Tractor, label: 'Farms' },
  { to: '/fields', icon: Map, label: 'Fields' },
  { to: '/crops', icon: Leaf, label: 'Crop Cycles' },
  { to: '/activities', icon: ClipboardList, label: 'Activities' },
  { to: '/inputs', icon: Package, label: 'Inputs' },
  { to: '/expenses', icon: Wallet, label: 'Expenses' },
  { to: '/irrigation', icon: Droplets, label: 'Irrigation' },
  { to: '/harvest', icon: Wheat, label: 'Harvest' },
  { to: '/intelligence', icon: Brain, label: 'Intelligence' },
  { to: '/reports', icon: FileBarChart, label: 'Reports' },
];

export default function AppLayout() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Farm Manager';
  const greeting = getGreeting();

  return (
    <div className="flex h-screen bg-[var(--color-surface-secondary)]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-[260px] bg-white border-r border-[var(--color-border-light)]
        flex flex-col transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[var(--color-border-light)]">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
            <Sprout className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text-primary)] tracking-tight">FarmPilot</h1>
            <p className="text-[10px] font-medium text-[var(--color-primary-600)] tracking-widest uppercase">Command Center</p>
          </div>
          <button
            className="ml-auto lg:hidden p-1.5 rounded-lg hover:bg-[var(--color-surface-tertiary)]"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <div className="space-y-0.5">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${isActive
                    ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-700)] shadow-sm'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)]'
                  }
                `}
              >
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User section */}
        <div className="border-t border-[var(--color-border-light)] p-3">
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-surface-tertiary)] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center">
                <User className="w-4 h-4 text-[var(--color-primary-700)]" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{displayName}</p>
                <p className="text-xs text-[var(--color-text-muted)] truncate">{user?.email}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-xl border border-[var(--color-border-light)] shadow-lg overflow-hidden animate-scale-in">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-[var(--color-border-light)] flex items-center justify-between px-4 lg:px-8 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-[var(--color-surface-tertiary)]"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-sm font-medium text-[var(--color-text-primary)]">
                {greeting}, <span className="text-[var(--color-primary-700)]">{displayName}</span>
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Here's what needs your attention today
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold">Green Valley Farm Demo</span>
              <button
                onClick={() => {
                  import('@/services/mockDataStore').then(m => {
                    m.mockDataStore.resetDemoData();
                    window.location.reload();
                  });
                }}
                className="text-[10px] text-emerald-700 underline hover:text-emerald-900 ml-1 cursor-pointer"
                title="Reset back to initial demo state"
              >
                Reset
              </button>
            </div>

            <NavLink
              to="/intelligence"
              className="p-2 rounded-lg hover:bg-[var(--color-surface-tertiary)] relative transition-colors text-[var(--color-text-secondary)]"
              title="Farm Intelligence & Priorities"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </NavLink>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8 max-w-[1440px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
