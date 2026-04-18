import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';
import ThemeToggle from './ThemeToggle';

const NAV_ITEMS = [
  { path: '/engineer/dashboard', label: 'Dashboard', icon: '▦' },
  { path: '/engineer/stock',     label: 'Stock',     icon: '⊞' },
  { path: '/engineer/logs',      label: 'Logs',      icon: '📋' },
  { path: '/engineer/invoices',  label: 'Invoices',  icon: '◻' },
  { path: '/engineer/drawings',  label: 'Drawings',  icon: '✎' },
];

export default function EngineerLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [unread, setUnread] = useState(0);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const fetch = () => {
      notificationService.getUnreadCount()
        .then(({ data }) => setUnread(data.data?.count || 0))
        .catch(() => {});
    };
    fetch();
    const interval = setInterval(fetch, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const siteName = user?.primarySite?.name || user?.primarySite || 'Unassigned Sector';

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans overflow-hidden transition-colors duration-300">
      {/* Sidebar Sidebar Overlay */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] 
        transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16'}
      `}>
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-[var(--border-color)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center font-black text-slate-900 text-sm flex-shrink-0 shadow-lg shadow-amber-500/20">BT</div>
            {(sidebarOpen || window.innerWidth < 1024) && (
              <div>
                <div className="text-sm font-bold text-[var(--text-primary)] leading-none tracking-tight">BuildTrack AI</div>
                <div className="text-[9px] text-amber-500 mt-0.5 uppercase tracking-widest font-black">Site Engineer</div>
              </div>
            )}
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-[var(--text-secondary)]">✕</button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold
                  ${active 
                    ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/10' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'}`}>
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                {(sidebarOpen || window.innerWidth < 1024) && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-primary)]/50">
          {(sidebarOpen || window.innerWidth < 1024) ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center text-slate-900 text-sm font-black flex-shrink-0 shadow-lg shadow-amber-500/10">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-[var(--text-primary)] truncate">{user?.name}</div>
                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Engineer</div>
              </div>
              <button onClick={handleLogout} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center text-xs">⏻</button>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-full h-9 bg-red-500/10 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">⏻</button>
          )}
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && window.innerWidth < 1024 && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="h-14 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex items-center justify-between px-4 sm:px-6 flex-shrink-0 safe-top">
          <div className="flex items-center gap-4">
             <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-10 h-10 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-tertiary)]/50 rounded-xl">☰</button>
             <div className="hidden sm:block">
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">BuildTrack AI</div>
                <div className="text-xs font-bold text-[var(--text-primary)]">Project Hub</div>
             </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
             <ThemeToggle />
             
             <div className="relative">
              <Link to="/engineer/notifications" className="w-10 h-10 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-tertiary)]/50 rounded-xl transition-all">🔔</Link>
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center border-2 border-[var(--bg-secondary)]">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </div>

            <div className="lg:flex flex-col items-end hidden">
                <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest leading-none mb-0.5">{siteName}</span>
                <span className="text-[9px] text-slate-500 uppercase font-bold">Active Sector</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[var(--bg-primary)] p-4 sm:p-8 custom-scrollbar relative">
           {/* Mobile Site Banner */}
           <div className="lg:hidden mb-6 p-4 bg-amber-500 rounded-2xl shadow-lg shadow-amber-500/10 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-900 font-black uppercase tracking-widest mb-0.5 opacity-60">Current Location</div>
                <div className="text-slate-900 font-black text-sm">{siteName}</div>
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-full animate-pulse" />
           </div>
           
           <div className="max-w-7xl mx-auto pb-10">
              {children}
           </div>
        </main>
      </div>
    </div>
  );
}
