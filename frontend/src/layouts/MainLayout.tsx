import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Milk, 
  ShoppingBag, 
  TrendingUp, 
  Receipt, 
  Settings as SettingsIcon, 
  LogOut, 
  Menu, 
  X,
  Droplets,
  CalendarCheck2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { name: 'Shift Gateway', path: '/select-mode', icon: CalendarCheck2 },
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Customers', path: '/customers', icon: Users },
  { name: 'Milk Entry', path: '/milk-entry', icon: Milk },
  { name: 'Product Sales', path: '/product-sales', icon: ShoppingBag },
  { name: 'Rate Settings', path: '/rates', icon: TrendingUp },
  { name: 'Monthly Bills', path: '/bills', icon: Receipt },
  { name: 'Settings', path: '/settings', icon: SettingsIcon },
];

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { fullName, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-stone-50 text-stone-900 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-stone-200 shadow-xs select-none">
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 border-b border-stone-100 gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-sm">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-stone-900 leading-tight">VIPUL MILK</h1>
            <p className="text-xs text-stone-400 font-medium tracking-wide uppercase">Dairy Management</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-red-50 text-red-700 shadow-2xs font-bold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User & Logout section */}
        <div className="p-4 border-t border-stone-100 bg-stone-50/50">
          <div className="flex items-center justify-between px-2 mb-3">
            <div className="truncate">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Dairy Operator</p>
              <p className="text-sm font-bold text-stone-800 truncate">{fullName || 'Owner'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-stone-600 hover:text-red-700 hover:bg-red-50 transition border border-stone-200 bg-white"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">
              <Droplets className="w-5 h-5" />
            </div>
            <span className="font-bold text-stone-900 text-base">VIPUL MILK</span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-stone-200 px-4 py-4 space-y-1 shadow-lg sticky top-[57px] z-20">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                      isActive
                        ? 'bg-red-50 text-red-700 font-bold'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
            <div className="pt-3 border-t border-stone-100">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout ({fullName || 'Owner'})</span>
              </button>
            </div>
          </div>
        )}

        {/* Page Content Body */}
        <main className="flex-1 p-4 md:p-8 w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

