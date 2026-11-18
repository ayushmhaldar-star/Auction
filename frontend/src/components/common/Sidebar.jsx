import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Tags, 
  Shield, 
  Gavel, 
  CheckCircle2, 
  XCircle, 
  History, 
  Settings, 
  Tv, 
  LogOut,
  Radio
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

import AuctionProLogo from './AuctionProLogo';

const Sidebar = () => {
  const { logout, admin } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Auction Control', path: '/admin/auction', icon: Gavel, badge: 'LIVE' },
    { name: 'Player Management', path: '/admin/players', icon: Users },
    { name: 'Category Management', path: '/admin/categories', icon: Tags },
    { name: 'Team Management', path: '/admin/teams', icon: Shield },
    { name: 'Sold Players', path: '/admin/sold', icon: CheckCircle2 },
    { name: 'Unsold Players', path: '/admin/unsold', icon: XCircle },
    { name: 'Auction History', path: '/admin/history', icon: History },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <AuctionProLogo size="sm" showSubtitle={true} />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/25'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-slate-950 text-amber-400'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}

        {/* Separator */}
        <div className="pt-3 pb-1">
          <div className="h-px bg-slate-800 mx-2" />
        </div>

        {/* Public Live Screen Link */}
        <a
          href="/live"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-cyan-400 hover:bg-cyan-950/30 border border-cyan-500/20 transition-all duration-150 group"
        >
          <div className="flex items-center space-x-3">
            <Tv className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Projector Display</span>
          </div>
          <span className="text-[10px] uppercase font-bold bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded">
            TV View
          </span>
        </a>
      </nav>

      {/* User / Logout Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 uppercase">
              {admin?.username?.[0] || 'A'}
            </div>
            <div className="truncate max-w-[110px]">
              <p className="text-xs font-semibold text-slate-200 truncate">{admin?.username || 'Admin'}</p>
              <p className="text-[10px] text-slate-400">Master Controller</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
